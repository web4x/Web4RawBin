// R30.9 — IntelliJ-faithful base-aware 3-way merge editor (Tron: "IntelliJ at ANY cost").
// LEFT 'Local' (read-only) | CENTER 'Result' (editable full Monaco) | RIGHT 'Repository' (read-only). Base-aware:
// node-diff3(local, base, remote) → CENTER auto-merges non-conflicting changes + flags true conflicts; per-change
// gutter accept-left ◄ / accept-right ► arrows resolve into CENTER. BASE = GitApi.mergeBase (no base → 2-way fallback).
// Re-arch of the R30.6 textarea/LCS editor (Class RbDiffEditor REUSE 18165081): computeDiff/renderHunks/takeHunk
// (R30.6.1/6.3) SUPERSEDED by computeMergedCenter/renderMergeGutter/acceptChange; loadSide/pickFile/pickRef/save/
// swapSides KEPT (re-scoped). Monaco via the shared CDN/AMD loader (reuse rb-code-editor); node-diff3 vendored.
import './rb-file-tree.js';
import { diff3MergeRegions, diffIndices, type StableRegion } from '../vendor/diff3.js';

const MONACO_VS = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';
let _monacoPromise: Promise<any> | null = null;

interface SideState { path: string; ref: string; repo: string; content: string }
const emptySide = (): SideState => ({ path: '', ref: '', repo: '', content: '' });

// A conflict alternative (local vs remote) + current pick. `span` = its CURRENT line range in CENTER (recomputed on
// every (re)flatten so it never drifts, even after other conflicts change length).
// R30.16: `kind` set ONCE at hunk creation (classify-at-source) → conflictColor() is a pure fn; center-blocks +
// ribbons read the SAME Conflict → same color by construction. aStart/bStart = the hunk's start line in Local/Repository
// (for viewZone row-alignment + ribbon endpoints).
type ConflictKind = 'add' | 'delete' | 'modify' | 'conflict';
// R30.35 REWORK (Tron both-versions-center): a changed region's CENTER content = the INCLUDED sides, not one pick.
// incl.a = Local(older) lines are in center, incl.b = Repo(newer) lines are in center. Default BOTH true → center shows
// both versions (older dark / newer highlighted). ≫ add-left → incl.a=true · ≪ add-right → incl.b=true (coexist,
// idempotent) · ✕ remove → incl.<side>=false (always). olderLen = # of older(a) lines in the emitted span (for age styling).
interface Conflict { id: number; a: string[]; b: string[]; incl: { a: boolean; b: boolean }; span: [number, number]; olderLen: number; kind: ConflictKind; aStart: number; bStart: number }
// R30.35 shared palette (DRY, single source for center-blocks + side-blocks + ribbons): green=add / red=delete /
// blue=modify / brown=conflict — semantic, IntelliJ-like (Tron). One color source → blocks+ribbons match by construction.
const CONFLICT_PALETTE: Record<ConflictKind, string> = { add: '#3a8a5a', delete: '#b83a3a', modify: '#3a6ea5', conflict: '#a5603a' };
const conflictColor = (c: Conflict): string => CONFLICT_PALETTE[c.kind];
// CENTER is a deterministic flatten of this sequence: literal ok-runs + conflict placeholders (by id). Rebuilding
// from the sequence (never by splicing the live buffer) means resolving one conflict can't drift another's offsets.
type CenterSeq = Array<{ ok: string[] } | { cid: number }>;

export class RbDiffEditor extends HTMLElement {
  private left: SideState = emptySide();   // LOCAL
  private right: SideState = emptySide();  // REMOTE
  private base = '';                       // merge-base content ('' → 2-way fallback)
  private conflicts: Conflict[] = [];
  private centerSeq: CenterSeq = [];       // the region sequence CENTER flattens from
  private twoWay = false;
  private monaco: any = null;
  private edLocal: any = null; private edCenter: any = null; private edRemote: any = null;
  private dirty = false;

  // [impl:uuid:ef6708f6-735c-4a59-a2cd-350aa0ec795d] RbDiffEditor.connectedCallback
  // Re-scoped (R30.9): builds the IntelliJ 3-pane shell (Local | Result | Repository) + toolbar, then mounts 3 Monaco.
  connectedCallback(): void {
    this.style.cssText = 'display:flex;flex-direction:column;height:100%;font-size:0.8rem;color:#ddd';
    this.innerHTML = `
      <style>
        .de-conflict-glyph::before { content: '⚠'; color: #e66; font-size: 0.7rem; }
        /* R30.34: SUBTLE line-tint only (NO box-outline, NO border-radius — Tron rejected boxes). The changed lines
           get a translucent kind-colored background that the continuous spline ribbon ties into at the pane edges. */
        .de-block-add { background: rgba(58,138,90,0.16); --kind: #3a8a5a; }
        .de-block-delete { background: rgba(184,58,58,0.16); --kind: #b83a3a; }
        .de-block-modify { background: rgba(58,110,165,0.15); --kind: #3a6ea5; }
        .de-block-conflict { background: rgba(165,96,58,0.16); --kind: #a5603a; }
        /* R30.36: the CURRENT change (up/down nav) — same KIND hue, just brighter + a 2px kind-colour border + glow so
           it's pixel-distinguishable from non-current same-kind blocks (hue never changes → kind-identity preserved). */
        .de-block-current { filter: brightness(1.35) saturate(1.25); box-shadow: inset 0 0 0 2px var(--kind), 0 0 6px rgba(255,255,255,0.35); }
        /* R30.35: NEWER (b/Repo) lines highlighted = brighter kind fill + left accent bar; OLDER (a/Local) keep the subtle de-block tint (reads dark). */
        .de-newer-add { background: rgba(58,138,90,0.36) !important; box-shadow: inset 2px 0 0 #3a8a5a; }
        .de-newer-delete { background: rgba(184,58,58,0.36) !important; box-shadow: inset 2px 0 0 #b83a3a; }
        .de-newer-modify { background: rgba(58,110,165,0.36) !important; box-shadow: inset 2px 0 0 #3a6ea5; }
        .de-newer-conflict { background: rgba(165,96,58,0.36) !important; box-shadow: inset 2px 0 0 #a5603a; }
        /* R30.37: resolution checkmark — OUTLINED-green = unresolved / SOLID-green = resolved (one per CHANGE). */
        rb-diff-editor .de-resolve { border: 2px solid #2ecc71 !important; color: #2ecc71 !important; background: transparent !important; font-weight: 800; }
        rb-diff-editor .de-resolve.resolved { background: #2ecc71 !important; color: #fff !important; }
        rb-diff-editor .de-resolve:disabled { opacity: 0.35; cursor: default; }
        .de-resolved-badge { width: 14px !important; }
        .de-resolved-badge::before { content: '✓'; color: #2ecc71; font-weight: 800; font-size: 0.8rem; }
        /* R30.34-revert (Tron: ALWAYS 3 columns, no matter what): the 3 panes stay side-by-side at EVERY width — no
           stacking media query. Row is pinned on .de-panes below; on a narrow phone the panes just get narrow
           (scroll/zoom), never stack. The req/architect formalize 'always 3 columns' as the AC; this revert is it. */
        .de-gutter-add { background: #3a8a5a; width: 3px !important; margin-left: 2px; }
        .de-gutter-delete { background: #b83a3a; width: 3px !important; margin-left: 2px; }
        .de-gutter-modify { background: #3a6ea5; width: 3px !important; margin-left: 2px; }
        .de-gutter-conflict { background: #a5603a; width: 3px !important; margin-left: 2px; }
        rb-diff-editor .de-toolbar button, rb-diff-editor .de-sub button, rb-diff-editor .de-accept-bar button { background:#333;border:1px solid #555;color:#ccc;border-radius:4px;cursor:pointer;font-size:0.7rem;padding:2px 6px }
      </style>
      <div class="de-toolbar" style="display:flex;gap:6px;align-items:center;padding:5px 8px;background:#252526;border-bottom:1px solid #333">
        <b style="font-size:0.75rem">🔀 3-Way Merge</b>
        <button class="de-apply-all" title="Apply All Non-Conflicting Changes">✨ Apply All Non-Conflicting</button>
        <span class="de-count" style="font-size:0.7rem;opacity:0.85" title="changes / conflicts"></span>
        <button class="de-jump-prev" title="Previous change">▲</button>
        <button class="de-jump-next" title="Next change">▼</button>
        <button class="de-resolve" title="Mark this change resolved (outlined = unresolved, solid = resolved)">✓</button>
        <span class="de-status" style="flex:1;font-size:0.7rem;opacity:0.7"></span>
        <button class="de-save" title="Save merged Result">💾 Save</button>
        <button class="de-share" title="Copy a shareable deep-link to this exact diff">🔗</button>
      </div>
      <div class="de-panes" style="display:flex;flex-direction:row;flex:1;min-height:0;gap:34px;background:#111;position:relative">
        ${(['local', 'center', 'remote'] as const).map(s => `
          <div class="de-pane de-${s}" style="display:flex;flex-direction:column;flex:1;min-width:0;background:#1e1e1e">
            <div class="de-sub" style="display:flex;gap:4px;align-items:center;padding:3px 5px;background:#2d2d2d;border-bottom:1px solid #333;font-size:0.7rem">
              <span class="de-role">${s === 'local' ? 'Local' : s === 'center' ? 'Result' : 'Repository'}</span>
              ${s === 'center'
                ? `<span class="de-title" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:0.7"></span>`
                : `<select class="de-repo" data-side="${s === 'local' ? 'left' : 'right'}" style="background:#1e1e1e;color:#ccc;border:1px solid #333;border-radius:3px;font-size:0.65rem;max-width:70px"></select>
                   <button class="de-file" data-side="${s === 'local' ? 'left' : 'right'}" title="Choose file">📁</button>
                   <button class="de-ref" data-side="${s === 'local' ? 'left' : 'right'}" title="Choose git ref">⎇</button>
                   ${s === 'local' ? `<select class="de-history" title="File version history (git log --follow) — older version on the LEFT" style="background:#1e1e1e;color:#ccc;border:1px solid #333;border-radius:3px;font-size:0.65rem;max-width:130px"></select>` : ''}
                   <span class="de-title" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:0.7"></span>
                   ${s === 'local' ? `<button class="de-swap" title="Swap Local↔Repository">⇄</button>` : ''}`}
            </div>
            <div class="de-mount" data-side="${s}" style="flex:1;min-height:0"></div>
          </div>`).join('')}
      </div>`;
    this.querySelectorAll('.de-file').forEach(b => b.addEventListener('click', () => this.pickFile((b as HTMLElement).dataset.side as 'left' | 'right')));
    this.querySelectorAll('.de-ref').forEach(b => b.addEventListener('click', () => this.pickRef((b as HTMLElement).dataset.side as 'left' | 'right')));
    this.querySelector('.de-swap')?.addEventListener('click', () => this.swapSides());
    this.querySelector('.de-save')?.addEventListener('click', () => void this.save());
    this.querySelector('.de-share')?.addEventListener('click', () => void this.buildShareLink());
    this.querySelector('.de-apply-all')?.addEventListener('click', () => this.applyAllNonConflicting());
    this.querySelector('.de-jump-prev')?.addEventListener('click', () => this.jumpToChange(-1));
    this.querySelector('.de-jump-next')?.addEventListener('click', () => this.jumpToChange(1));
    this.querySelector('.de-resolve')?.addEventListener('click', () => this.toggleResolved());
    void this.mountThreePane();
    void this.populateRepos();
    this.wireResponsive();
  }

  // [impl:uuid:5051b2a4-6102-41fe-a352-a50e6b8ae03e] R30.34-revert: layout is ALWAYS side-by-side (Tron: 3 columns no
  // matter what) — NO orientation flip, NO stacking media query. This only re-lays-out Monaco + re-renders the
  // (always-horizontal) pixel-positioned ribbons/gutters on a window RESIZE so they track the panes' new geometry.
  private wireResponsive(): void {
    const panes = this.querySelector('.de-panes') as HTMLElement; if (!panes) return;
    panes.dataset.orient = 'h';
    const rerender = () => { if (!this.edCenter) return; [this.edLocal, this.edCenter, this.edRemote].forEach(e => e?.layout?.()); this.renderMergeGutter(); };
    let t: any = 0; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(rerender, 120); }); // debounced: reposition pixel overlays after a resize
  }

  private status(msg: string): void { const s = this.querySelector('.de-status'); if (s) s.textContent = msg; }
  private mount(side: 'local' | 'center' | 'remote'): HTMLElement { return this.querySelector(`.de-mount[data-side="${side}"]`) as HTMLElement; }

  // [impl:uuid:e09a8327-bb1f-4d7c-8b46-d0f1802cfb89] RbDiffEditor.monacoLoader
  // Reuse the SAME CDN/AMD Monaco that rb-code-editor loads (require(['vs/editor/editor.main'])). AMD dedupes → no
  // double CDN fetch. Module-level singleton promise so the 3 editors + rb-code-editor share one monaco global.
  static monacoLoader(): Promise<any> {
    if (_monacoPromise) return _monacoPromise;
    _monacoPromise = new Promise<any>((resolve) => {
      const w = window as any;
      if (w.monaco) { resolve(w.monaco); return; }
      const boot = () => {
        const req = (window as any).require;
        req.config({ paths: { vs: MONACO_VS } });
        req(['vs/editor/editor.main'], () => resolve((window as any).monaco));
      };
      if ((window as any).require) { boot(); return; }
      const script = document.createElement('script');
      script.src = `${MONACO_VS}/loader.js`;
      script.onload = boot;
      document.head.appendChild(script);
    });
    return _monacoPromise;
  }

  // [impl:uuid:c4c84142-191c-4ed5-af2a-568534f2807c] RbDiffEditor.mountThreePane
  // Three Monaco editors in IntelliJ column order: LEFT local (read-only), CENTER result (read-write, full Monaco =
  // autocomplete/lint/keybindings), RIGHT remote (read-only). Then wire synchronized scroll.
  async mountThreePane(): Promise<void> {
    this.monaco = await RbDiffEditor.monacoLoader();
    const m = this.monaco;
    const common = { automaticLayout: true, minimap: { enabled: false }, fontSize: 12, lineHeight: 19, wordWrap: 'off' as const, scrollBeyondLastLine: true, renderLineHighlight: 'none' as const }; // R30.16: scrollBeyondLastLine → last line can reach the top. R30.30: pin lineHeight+wordWrap on ALL 3 panes so a font-load/wrap variance can never add a per-row px delta (0px by construction, complements the row re-anchor).
    this.edLocal = m.editor.create(this.mount('local'), { ...common, value: this.left.content, readOnly: true, theme: 'vs-dark' });
    this.edCenter = m.editor.create(this.mount('center'), { ...common, value: '', readOnly: false, theme: 'vs-dark' });
    this.edRemote = m.editor.create(this.mount('remote'), { ...common, value: this.right.content, readOnly: true, theme: 'vs-dark' });
    this.edCenter.onDidChangeModelContent(() => { this.dirty = true; });
    // R30.17 (TRON1): delegate the gutter-icon clicks from the STABLE component root (attached ONCE) — the old
    // per-strip listener was orphaned each time renderInterPaneGutters re-rendered the strip's innerHTML → accept did nothing.
    this.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('[data-cid]') as HTMLElement | null;
      if (!b || !this.contains(b)) return;
      const id = Number(b.dataset.cid); const act = b.dataset.act;
      // R30.35: ≫ add-Local / ≪ add-Right (acceptChange, additive+coexist) · ✕ remove that side ALWAYS (removeLine)
      if (act === 'add-left') this.addSide(id, 'left');
      else if (act === 'add-right') this.addSide(id, 'right');
      else if (act === 'rm-left') this.removeLine(id, 'left');
      else if (act === 'rm-right') this.removeLine(id, 'right');
    });
    this.syncScroll3();
    void this.computeMergedCenter();
  }

  // [impl:uuid:c4da837c-b59f-4c02-9522-2e8599206abf] RbDiffEditor.loadSide
  // Re-scoped (R30.9): load LOCAL (side='left') or REMOTE (side='right') content — working file (/api/files),
  // file@ref (/api/git/file), or preloaded buffer (src.content) — into the side + its Monaco editor, then recompute.
  async loadSide(side: 'left' | 'right', src: { path: string; ref?: string; content?: string }): Promise<void> {
    const st = side === 'left' ? this.left : this.right;
    st.path = src.path; st.ref = src.ref || '';
    // R30.25: a fresh LEFT working-file load = a new diff context → re-enable the auto-promote for it (clears any prior
    // RIGHT-pick flag). Done HERE (before the content-load awaits) so a subsequent user RIGHT-pick — which fires as a
    // later event — re-sets the flag and WINS over the promote (populateLeftHistory's early-guard then aborts).
    if (side === 'left' && !st.ref && !this._deepLink) this._rightUserPicked = false;
    const seq = side === 'right' ? ++this._rightLoadSeq : 0; // R30.25.2: RIGHT-load generation — captured before the fetch await; a newer right-load bumps _rightLoadSeq and supersedes this one
    try {
      let content = '';
      if (src.content != null) {
        content = src.content;
      } else if (st.ref) {
        const rq = st.repo ? `&repo=${encodeURIComponent(st.repo)}` : '';
        const res = await fetch(`/api/git/file?ref=${encodeURIComponent(st.ref)}&path=${encodeURIComponent(st.path)}${rq}`);
        if (!res.ok) { this.status(`load ${side} @${st.ref} failed (${res.status})`); return; }
        content = (await res.json()).content ?? '';
      } else {
        const rq = st.repo ? `?repo=${encodeURIComponent(st.repo)}` : '';
        const res = await fetch(`/api/files/${encodeURIComponent(st.path)}${rq}`);
        if (!res.ok) { this.status(`load ${side} failed (${res.status})`); return; }
        content = (await res.json()).content ?? '';
      }
      // R30.25.2 (WIN-B residual): if a NEWER right-load started while this one's fetch was in flight (e.g. a user
      // ref-pick landing DURING the deep-link's own loadSide('right',dev)), discard THIS result — otherwise the
      // late-resolving content lands under the newer ref (RIGHT-corrupt: right.ref=pick but right.content=dev). Only
      // the latest right-load applies. LEFT is unaffected (no seq check) so a right-pick never aborts a left-load.
      if (side === 'right' && seq !== this._rightLoadSeq) return;
      st.content = content;
      const ed = side === 'left' ? this.edLocal : this.edRemote;
      if (ed) ed.setValue(content);
      const title = this.querySelector(`.de-${side === 'left' ? 'local' : 'remote'} .de-title`) as HTMLElement;
      if (title) title.textContent = st.ref ? `${st.path}@${st.ref}` : st.path;
      await this.computeMergedCenter();
      if (side === 'left' && !st.ref && !this._deepLink) await this.populateLeftHistory(); // R30.17 (TRON4): working-file load (no ref) → promote to RIGHT + fill LEFT history (older-left); guard !st.ref so the older-ref reload doesn't recurse. R30.24: skip during a deep-link restore. R30.25: AWAIT (serialize) so the promote's async tail can't race a later RIGHT ref-pick and blank LEFT.
    } catch { this.status(`load ${side} error`); }
  }

  // [impl:uuid:a0b30550-71c8-4497-9eaf-f73551f7bb0f] RbDiffEditor.computeMergedCenter
  // Base-aware: BASE = GitApi.mergeBase(leftRef,rightRef) content; diff3Merge(local, base, remote) → CENTER starts as
  // the auto-merge (every non-conflicting change applied) + tracks true conflict regions for the gutter. The diff3
  // core (vendored node-diff3) is PURE/DOM-free/unit-tested. No merge-base → 2-way fallback (CENTER = local).
  async computeMergedCenter(): Promise<void> {
    const localLines = this.left.content.split('\n');
    const remoteLines = this.right.content.split('\n');
    this.base = await this.resolveBase();
    this.twoWay = this.base === '' && !!(this.left.ref && this.right.ref) ? false : this.base === '';
    this.conflicts = [];
    this.centerSeq = [];
    this.dismissed.clear(); this._jumpIdx = -1; this._currentId = null; this._override.clear(); // R30.13/36: fresh merge → clear jump cursor + emphasis + manual resolve-overrides
    if (this.base === '') {
      // R30.12: no merge-base → 2-way TAKE-OVER. LCS(local,remote) → conflicts[] as take-over hunks so the gutter
      // renders ◄/► (pick='a' keep Local default, ► take Version). Previously centerSeq was flat local → no arrows.
      this.twoWay = true;
      this.computeTwoWayHunks(localLines, remoteLines);
    } else {
      this.twoWay = false;
      let cid = 0;
      let la = 0, lb = 0; // R30.27: running LOCAL / REMOTE line positions — one-sided spacers land at the aligned position (la/lb), not line 0
      const baseLines = this.base.split('\n'); // R30.29: base buffer — a one-sided MODIFICATION's non-changed pane still shows these base lines
      // R30.23: iterate the RICHER region list (not the collapsed diff3Merge) so each stable region carries its
      // `buffer` origin tag — 'o'=truly stable (== base), 'a'=local-only change, 'b'=repo-only change (diff3
      // already auto-applied it into CENTER). A one-sided change is surfaced as a Conflict{kind:'change'} so it
      // renders a block+ribbon+arrow (IMG_4522 gap: a 'merged, 0 conflicts' file showed ZERO blocks). The picked
      // side's content stays in CENTER → merge RESULT byte-identical; this ONLY adds visibility.
      for (const region of diff3MergeRegions(localLines, baseLines, remoteLines)) {
        if (region.stable) {
          if (region.buffer === 'o') { this.centerSeq.push({ ok: region.bufferContent }); la += region.bufferContent.length; lb += region.bufferContent.length; continue; } // stable == base → ok-run; advances BOTH panes
          this.conflicts.push(this.computeOneSidedHunks(region, cid, la, lb, baseLines)); // R30.27/29: aligned per-pane positions; opposite side = base slice for a modification
          // R30.29: advance the CHANGED side by its N lines AND the NON-changed side by oLength (the M base lines it retains — 0 for a pure insertion, M for a modification). la/lb now track each pane's TRUE consumed lines → resync at EVERY region, no cumulative drift.
          if (region.buffer === 'a') { la += region.bufferLength; lb += region.oLength; } else { lb += region.bufferLength; la += region.oLength; }
          this.centerSeq.push({ cid: cid });
          cid++;
        } else if (region.aContent.length === region.bContent.length && region.aContent.every((x, i) => x === region.bContent[i])) {
          this.centerSeq.push({ ok: region.aContent }); la += region.aContent.length; lb += region.bContent.length; // false conflict: both sides made the SAME change → agreed ok-run; advances BOTH
        } else {
          this.conflicts.push({ id: cid, a: region.aContent, b: region.bContent, incl: { a: true, b: true }, span: [0, 0], olderLen: 0, kind: 'conflict', aStart: region.aStart, bStart: region.bStart }); // R30.16/35: 3-way divergence → brown; default both included (center shows both versions)
          la = region.aStart + region.aContent.length; lb = region.bStart + region.bContent.length; // R30.27: conflict carries REAL indices → resync the counters (regression guard: conflict path untouched otherwise)
          this.centerSeq.push({ cid: cid });
          cid++;
        }
      }
    }
    this.rebuildCenter();
    this.setCenterTitle();          // R30.x save-404: 'file@currentBranch' when known, else 'merged: file'
    void this.loadCurrentBranch();  // fetch the working-tree branch the Save targets (async, cached per repo) → refresh header
    // R30.35 E: single source of truth for the count lives in .de-count ('X/Y open conflicts'). Status keeps ONLY the
    // mode/dirty note — the second "N conflicts to resolve" denominator is removed (was confusing vs the de-count total).
    this.status(this.twoWay ? '2-way (no merge-base) — accept ◄/► as take-over' : (this.dirty ? '• modified' : ''));
  }

  // R30.23 private helper (traceability stays on computeMergedCenter's a0b30550 — one-sided detection is the same
  // concern that already owns merge+conflict tracking; NOT a minted Method). Maps a diff3 one-sided stable region
  // to a change-Conflict, origin-EXACT: buffer 'a' = LOCAL-only (a=content, b=[], pick='a') → renders a Local block +
  // Local↔Result ribbon + arrow only; buffer 'b' = REPO-only (a=[], b=content, pick='b') → Repository side only.
  // Downstream (renderCenterChangeBlocks via c.span, renderSideChangeBlocks/renderConnectorRibbons gate on a/b.length,
  // jumpToChange counts) all iterate conflicts[] with NO new rendering code. pick keeps the changed content in CENTER
  // (rebuildCenter: pick==='b'?c.b:c.a) → merge RESULT byte-identical; span [0,0] is set by rebuildCenter.
  private computeOneSidedHunks(region: StableRegion, cid: number, la: number, lb: number, baseLines: string[]): Conflict {
    const local = region.buffer === 'a';
    // R30.29: the NON-changed pane still shows the M base lines this region replaced (M = oLength). [] for a pure
    // insertion (oLength=0 → one-sided, R30.23/27 preserved); the M base lines for a modification → both panes align
    // (maxH = max(N,M)) + both highlight. The changed side stays bufferContent → CENTER pick unchanged → byte-identical.
    const baseSlice = baseLines.slice(region.oStart, region.oStart + region.oLength);
    // R30.35: derive the semantic kind — oLength=0 → ADD (green, inserted, base had none); bufferLength=0 → DELETE
    // (red, the changed side removed the M base lines); both>0 → MODIFY (blue). (Conflicts are the stable:false path.)
    const kind: ConflictKind = region.oLength === 0 ? 'add' : region.bufferLength === 0 ? 'delete' : 'modify';
    return {
      id: cid,
      a: local ? region.bufferContent : baseSlice,
      b: local ? baseSlice : region.bufferContent,
      incl: { a: true, b: true }, // R30.35: default both sides in center (older dark / newer highlighted)
      span: [0, 0],
      olderLen: 0,
      kind,
      // R30.27: aligned per-pane line positions threaded from the region loop (StableRegion only carries the CHANGED
      // buffer's start). For the changed side la/lb == bufferStart; for the opposite side it's the running counter —
      // so alignPaneRows places the opposite pane's spacer rows AT the change position, not piled at line 0.
      aStart: la,
      bStart: lb,
    };
  }

  // [impl:uuid:def2c0f2-0ded-430b-9d4e-3d54665f27bc] RbDiffEditor.computeTwoWayHunks
  // R30.12 two-way take-over: LCS(local,remote) via the vendored diffIndices → each mismatched chunk becomes a
  // Conflict (a=Local lines, b=Version lines, pick='a' = keep Local; ► = take Version). Equal runs go in as ok
  // segments, mismatches as conflict segments — so centerSeq/rebuildCenter + renderMergeGutter show ◄/► arrows.
  private computeTwoWayHunks(localLines: string[], remoteLines: string[]): void {
    let cid = 0, cursor = 0;
    for (const d of diffIndices(localLines, remoteLines)) {
      const [lStart, lLen] = d.buffer1; // local chunk
      const [rStart, rLen] = d.buffer2; // version chunk
      if (lStart > cursor) this.centerSeq.push({ ok: localLines.slice(cursor, lStart) }); // equal run (local==version here)
      this.conflicts.push({ id: cid, a: localLines.slice(lStart, lStart + lLen), b: remoteLines.slice(rStart, rStart + rLen), incl: { a: true, b: true }, span: [0, 0], olderLen: 0, kind: 'modify', aStart: lStart, bStart: rStart }); // R30.35: 2-way take-over = modify (blue), both included
      this.centerSeq.push({ cid });
      cid++;
      cursor = lStart + lLen;
    }
    if (cursor < localLines.length) this.centerSeq.push({ ok: localLines.slice(cursor) }); // trailing equal run
  }

  // Deterministic flatten of centerSeq → CENTER text, recomputing each conflict's current line span (for the gutter).
  private rebuildCenter(): void {
    const lines: string[] = [];
    for (const seg of this.centerSeq) {
      if ('ok' in seg) { lines.push(...seg.ok); continue; }
      const c = this.conflicts.find(x => x.id === seg.cid);
      if (!c) continue;
      // R30.35: emit the INCLUDED sides — older(a/Local) first then newer(b/Repo). Both by default → center shows both
      // versions; ✕ drops a side, ≫/≪ re-add. olderLen = # older lines emitted (for the dark/highlighted age styling).
      const older = c.incl.a ? c.a : [], newer = c.incl.b ? c.b : [];
      c.olderLen = older.length;
      c.span = [lines.length, lines.length + older.length + newer.length];
      lines.push(...older, ...newer);
    }
    if (this.edCenter) this.edCenter.setValue(lines.join('\n'));
    this.renderMergeGutter();
  }

  // BASE content: git merge-base(leftRef,rightRef) → fileAtRef(base, path). Only when BOTH sides are git refs.
  private async resolveBase(): Promise<string> {
    if (!this.left.ref || !this.right.ref || !this.left.path) return '';
    try {
      const rq = this.left.repo ? `&repo=${encodeURIComponent(this.left.repo)}` : '';
      const mb = await (await fetch(`/api/git/merge-base?a=${encodeURIComponent(this.left.ref)}&b=${encodeURIComponent(this.right.ref)}${rq}`)).json();
      const baseRef = (mb.base || '').trim();
      if (!baseRef) return '';
      const fr = await (await fetch(`/api/git/file?ref=${encodeURIComponent(baseRef)}&path=${encodeURIComponent(this.left.path)}${rq}`)).json();
      return fr.content ?? '';
    } catch { return ''; }
  }

  // [impl:uuid:e24dc98a-bbea-4e9b-9960-5f59db8bf6b1] RbDiffEditor.renderMergeGutter
  // R30.16 orchestrator (full IntelliJ layout): align rows (viewZones) → colored center blocks → inter-pane gutter
  // icons → connector ribbons — Y (alignment) BEFORE X (gutter/ribbon geometry). Counter in the toolbar.
  renderMergeGutter(): void {
    if (!this.edCenter || !this.monaco) return;
    this.alignPaneRows();            // (2) viewZone blank-row spacers → blocks line up L↔C↔R
    this.renderCenterChangeBlocks(); // (3) colored rounded change-blocks (replaces the flat de-conflict-line)
    this.renderSideChangeBlocks();   // (3b) R30.19: same-colored blocks in the Local + Repository source panes
    this.querySelector('.de-accept-bar')?.remove();
    this.renderInterPaneGutters();   // (4) ≫/≪/✕ icons in the widened gutter
    this.renderConnectorRibbons();   // (5) SVG ribbons, palette-matched to the blocks
    const cnt = this.querySelector('.de-count') as HTMLElement;
    // R30.35 E: ONE count = openChangeCount (derived-unresolved) / total changes → 'X/Y open conflicts'. 0 changes → clean auto-merge.
    if (cnt) cnt.textContent = (this.conflicts.length === 0 ? 'clean auto-merge' : `${this.openChangeCount()}/${this.conflicts.length} open conflict${this.conflicts.length === 1 ? '' : 's'}`) + (this.dirty ? ' • modified' : '');
  }

  private _maxH(c: Conflict): number { const centerLen = (c.incl.a ? c.a.length : 0) + (c.incl.b ? c.b.length : 0); return Math.max(c.a.length, c.b.length, centerLen, 1); } // R30.35 A+D: centerLen-aware (both-versions center = older+newer rows), matching alignPaneRows/renderCenterChangeBlocks

  // [impl:uuid:17c71adf-7b69-4081-98aa-0e687747a4d5] RbDiffEditor.alignPaneRows
  // R30.16: Monaco viewZone BLANK-ROW spacers so each conflict block occupies maxH=max(a,b) rows in ALL 3 panes →
  // change regions line up L↔C↔R (getTopForLineNumber already counts viewZones → ribbon endpoints get aligned Y →
  // near-horizontal bands). Pad = maxH − that pane's real block length, inserted AFTER the block.
  private alignPaneRows(): void {
    if (!this.edLocal || !this.edCenter || !this.edRemote) return;
    // R30.30: SINGLE forward pass over centerSeq (the full region sequence: {ok}=stable/blank anchor, {cid}=changed
    // region). Track REAL content lines per pane (rL/rC/rR → the viewZone afterLineNumber) AND VISUAL rows
    // (vL/vC/vR = real + spacer rows emitted so far). Changed region → pad each pane to maxH. Stable region →
    // RE-ANCHOR FIRST: pad the lagging panes up to max(vL,vC,vR) BEFORE emitting the stable lines, so ALL 3 land the
    // next full line on the same visual row. Any single-region mis-pad thus snaps to 0 at the very next stable/blank
    // line — self-healing, bounded to one block (fixes the L1823 32px residual that R30.29's counters-only froze to EOF).
    const plan: Record<'local' | 'center' | 'remote', Array<{ after: number; pad: number }>> = { local: [], center: [], remote: [] };
    let rL = 0, rC = 0, rR = 0, vL = 0, vC = 0, vR = 0;
    const push = (pane: 'local' | 'center' | 'remote', after: number, pad: number) => { if (pad > 0) plan[pane].push({ after, pad }); };
    for (const seg of this.centerSeq) {
      if ('ok' in seg) {
        const target = Math.max(vL, vC, vR);                                   // re-anchor: snap laggards to the max
        push('local', rL, target - vL); push('center', rC, target - vC); push('remote', rR, target - vR);
        vL = vC = vR = target;
        const k = seg.ok.length; rL += k; rC += k; rR += k; vL += k; vC += k; vR += k; // emit K stable lines (advance all)
      } else {
        const c = this.conflicts.find(x => x.id === seg.cid);
        if (!c) continue;
        // R30.35: center block = the INCLUDED sides (older+newer), can be taller than either side → maxH spans all 3.
        const older = c.incl.a ? c.a.length : 0;    // center's older(Local) sub-span height
        const newer = c.incl.b ? c.b.length : 0;    // center's newer(Repo) sub-span height
        const centerLen = older + newer;
        const maxH = Math.max(c.a.length, c.b.length, centerLen, 1);
        // R30.35 A+D: Local(older) aligns to the block TOP (real rows + pad BELOW); Repo(newer) aligns to CENTER's newer
        // sub-span (pad ABOVE by the older-portion, only when both coexist) so its content sits on the SAME visual rows as
        // center's newer band → the Repo↔centerRight half-ribbon is a clean horizontal rectangle bounded to real content,
        // spanning NO blank spacer rows (fixes the diagonal skew + empty-line spanning; one-sided has older=0 → unchanged).
        const padAbove = c.incl.b ? older : 0;
        push('local', rL + c.a.length, maxH - c.a.length);
        push('center', rC + centerLen, maxH - centerLen);
        push('remote', rR, padAbove);                                          // pad ABOVE = center's older-sub-span rows
        push('remote', rR + c.b.length, Math.max(0, maxH - padAbove - c.b.length)); // pad BELOW to fill maxH
        rL += c.a.length; rC += centerLen; rR += c.b.length; vL += maxH; vC += maxH; vR += maxH;
      }
    }
    const specs: Array<['local' | 'center' | 'remote', any]> = [['local', this.edLocal], ['center', this.edCenter], ['remote', this.edRemote]];
    for (const [key, ed] of specs) {
      ed.changeViewZones((acc: any) => {
        for (const id of this._zoneIds[key]) acc.removeZone(id);
        this._zoneIds[key] = [];
        for (const { after, pad } of plan[key]) this._zoneIds[key].push(acc.addZone({ afterLineNumber: Math.max(0, after), heightInLines: pad, domNode: document.createElement('div') }));
      });
    }
  }
  private _zoneIds: { local: string[]; center: string[]; remote: string[] } = { local: [], center: [], remote: [] };

  // [impl:uuid:37c9694c-8af3-41fd-9cbc-69b505642b05] RbDiffEditor.renderCenterChangeBlocks
  // R30.16: colored ROUNDED-block backgrounds on each CENTER hunk span (Monaco whole-line decorations, class by
  // conflictColor kind) — replaces the flat maroon de-conflict-line. Same conflicts[] as the ribbons → colors match.
  private renderCenterChangeBlocks(): void {
    if (!this.edCenter || !this.monaco) return;
    const m = this.monaco;
    // R30.35: two decorations per region — OLDER (a/Local) lines get the subtle kind tint (dark), NEWER (b/Repo) lines
    // get the brighter de-newer-<kind> (highlighted). Both share the kind gutter bar → age is visible, kind preserved.
    const decos = this.conflicts.filter(c => !this.dismissed.has(c.id)).flatMap(c => {
      const oEnd = c.span[0] + c.olderLen; const out: any[] = [];
      const cur = c.id === this._currentId ? ' de-block-current' : ''; // R30.36: brighter same-hue emphasis for the nav-current change
      if (c.olderLen > 0) out.push({ range: new m.Range(c.span[0] + 1, 1, oEnd, 1), options: { isWholeLine: true, className: `de-block-${c.kind}${cur}`, linesDecorationsClassName: `de-gutter-${c.kind}` } });
      if (c.span[1] > oEnd) out.push({ range: new m.Range(oEnd + 1, 1, c.span[1], 1), options: { isWholeLine: true, className: `de-block-${c.kind} de-newer-${c.kind}${cur}`, linesDecorationsClassName: `de-gutter-${c.kind}` } });
      // R30.37: ONE glyph per CHANGE on its first block — solid-green ✓ badge when RESOLVED, else the conflict ⚠ (if any).
      if (out.length) out[0].options.glyphMarginClassName = this.isResolved(c) ? 'de-resolved-badge' : (c.kind === 'conflict' ? 'de-conflict-glyph' : undefined);
      return out;
    });
    this._blockDecoIds = this.edCenter.deltaDecorations(this._blockDecoIds, decos);
  }
  private _blockDecoIds: string[] = [];

  // [impl:uuid:eb994dcd-d9dc-4b55-84e8-13b2be3b47d5] RbDiffEditor.renderSideChangeBlocks
  // R30.19: colored change-block backgrounds in the SOURCE panes too — Local shows its a-lines, Repository its b-lines,
  // both with the SAME de-block-<kind> class (shared CONFLICT_PALETTE) → source blocks color-MATCH the center block +
  // the ribbon by construction. Origin-aware (a.length>0 → Local, b.length>0 → Repository, R30.17 gate). LINE-anchored
  // on the real source lines (Monaco Range on aStart/bStart) — no getTopForLineNumber, no off-by-one.
  private renderSideChangeBlocks(): void {
    if (!this.edLocal || !this.edRemote || !this.monaco) return;
    const m = this.monaco;
    const live = this.conflicts.filter(c => !this.dismissed.has(c.id));
    const decosFor = (startKey: 'aStart' | 'bStart', linesKey: 'a' | 'b') => live.filter(c => c[linesKey].length > 0).map(c => ({
      range: new m.Range(c[startKey] + 1, 1, c[startKey] + c[linesKey].length, 1),
      options: { isWholeLine: true, className: `de-block-${c.kind}${c.id === this._currentId ? ' de-block-current' : ''}`, linesDecorationsClassName: `de-gutter-${c.kind}` }, // R30.36: current-change emphasis
    }));
    this._sideDecoIds.local = this.edLocal.deltaDecorations(this._sideDecoIds.local, decosFor('aStart', 'a'));
    this._sideDecoIds.remote = this.edRemote.deltaDecorations(this._sideDecoIds.remote, decosFor('bStart', 'b'));
  }
  private _sideDecoIds: { local: string[]; remote: string[] } = { local: [], remote: [] };
  private dismissed = new Set<number>();   // R30.13: (legacy; unused post-R30.35 — x is now removeLine, not dismiss)
  private _jumpIdx = -1;
  private _currentId: number | null = null; // R30.36: the change under the up/down nav cursor → rendered brighter
  private _ribbonSvg: SVGSVGElement | null = null;

  // Visible Y (px, relative to .de-panes top) of the TOP of 0-based `line0` in Monaco editor `ed`.
  private lineY(ed: any, line0: number): number {
    const node = ed?.getDomNode?.(); const panes = this.querySelector('.de-panes') as HTMLElement;
    if (!node || !panes) return 0;
    return (node.getBoundingClientRect().top - panes.getBoundingClientRect().top) + (ed.getTopForLineNumber(line0 + 1) - ed.getScrollTop());
  }

  // [impl:uuid:fd99c520-a56b-46ce-b37b-4108daed1132] RbDiffEditor.renderInterPaneGutters
  // IntelliJ inter-pane gutters: two slim strips at the Local↔Result and Result↔Repository boundaries. Per change,
  // icons aligned to its Result row — left ≫ take Local / ✕ ignore, right ≪ take Repository / ✕ ignore, 🪄 at conflicts.
  // THE DESKTOP FIX: replaces the cramped/invisible bottom .de-accept-bar. Wired to the existing acceptChange.
  private renderInterPaneGutters(): void {
    if (!this.edCenter || !this.monaco) return;
    const panes = this.querySelector('.de-panes') as HTMLElement; if (!panes) return;
    const pr = panes.getBoundingClientRect();
    const centerLeft = this.mount('center').getBoundingClientRect().left - pr.left;
    const remoteLeft = this.mount('remote').getBoundingClientRect().left - pr.left;
    const mk = (cls: string, leftPx: number): HTMLElement => {
      let s = this.querySelector('.' + cls) as HTMLElement;
      if (!s) {
        s = document.createElement('div'); s.className = cls;
        s.style.cssText = 'position:absolute;top:0;bottom:0;width:22px;z-index:6;pointer-events:none';
        panes.appendChild(s); // R30.17 (TRON1): clicks handled by ROOT delegation in mountThreePane — a per-strip listener was orphaned when innerHTML re-rendered the strip's buttons
      }
      s.style.left = (leftPx - 11) + 'px';
      return s;
    };
    const leftStrip = mk('de-gutter-left', centerLeft);
    const rightStrip = mk('de-gutter-right', remoteLeft);
    const btn = (act: string, id: number, glyph: string, title: string) =>
      `<button data-cid="${id}" data-act="${act}" title="${title}" style="pointer-events:auto;display:block;width:20px;height:15px;line-height:13px;margin:1px 0;padding:0;font-size:0.65rem;background:#333;border:1px solid #666;color:#ddd;border-radius:3px;cursor:pointer">${glyph}</button>`;
    // R30.35 F (UNIFIED per-line visibility, supersedes "✕ only when both in center"): per side, keyed on whether THAT
    // side's line is in center — content + in-center → ✕ (remove it); content + NOT in-center → add(≫/≪); no content → no
    // button (outer filter). So a ONE-SIDED change also gets ✕ (un-merge), then ≫/≪ to re-add — not just 2-version changes.
    const rows = (side: 'left' | 'right') => this.conflicts.filter(c => (side === 'left' ? c.a.length > 0 : c.b.length > 0)).map(c => {
      const y = Math.max(0, this.lineY(this.edCenter, c.span[0]));
      const thisIn = side === 'left' ? this.leftIn(c) : this.rightIn(c);
      const ctrl = thisIn
        ? (side === 'left' ? btn('rm-left', c.id, '✕', 'Remove Local from Result') : btn('rm-right', c.id, '✕', 'Remove Repository from Result'))
        : (side === 'left' ? btn('add-left', c.id, '≫', 'Add Local → Result') : btn('add-right', c.id, '≪', 'Add Repository → Result'));
      return `<div style="position:absolute;top:${y}px;left:0;right:0">${ctrl}</div>`;
    }).join('');
    leftStrip.innerHTML = rows('left');
    rightStrip.innerHTML = rows('right');
  }

  // [impl:uuid:5051b2a4-6102-41fe-a352-a50e6b8ae03e] RbDiffEditor.renderConnectorRibbons
  // R30.34-revert (Tron/Rider): ONE continuous cubic-Bézier ribbon PER change spanning Local→Result→Repository as a
  // single SVG <path> that sweeps ACROSS the 2 column gutters — no boxes, no disjoint bands, no stacked variant. Layout
  // is ALWAYS 3 side-by-side columns, so the spline is always horizontal; the curve absorbs each pane's Y-offset via
  // horizontal tangents at the gutter midlines (the Rider S-curve). Origin-gated (a>0 left / b>0 right), color by kind,
  // translucent so code reads through. syncScroll3 keeps all 3 in register. z-5, pointer-events:none.
  private renderConnectorRibbons(): void {
    if (!this.edCenter || !this.edLocal || !this.edRemote) return;
    const panes = this.querySelector('.de-panes') as HTMLElement; if (!panes) return;
    const pr = panes.getBoundingClientRect();
    if (!this._ribbonSvg) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'de-ribbons');
      svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none';
      panes.insertBefore(svg, panes.firstChild);
      this._ribbonSvg = svg;
    }
    const lm = this.mount('local').getBoundingClientRect(), cm = this.mount('center').getBoundingClientRect(), rm = this.mount('remote').getBoundingClientRect();
    const n = (v: number) => v.toFixed(1);
    const parts: string[] = [];
    for (const c of this.conflicts.filter(x => !this.dismissed.has(x.id))) {
      const color = conflictColor(c), left = c.a.length > 0, right = c.b.length > 0;
      // each pane's OWN Y-range (viewzone-aware), max(...,1) so a pure deletion still has a 1-row anchor
      const aT = this.lineY(this.edLocal, c.aStart), aB = this.lineY(this.edLocal, c.aStart + Math.max(c.a.length, 1));
      const cT = this.lineY(this.edCenter, c.span[0]), cB = this.lineY(this.edCenter, c.span[1]);
      const bT = this.lineY(this.edRemote, c.bStart), bB = this.lineY(this.edRemote, c.bStart + Math.max(c.b.length, 1));
      // R30.34-revert: ALWAYS the ACROSS spline (Tron: alignment always Left→Center→Right as ONE SVG overlay). The
      // stacked/vertical variant is removed — layout is always 3 side-by-side columns, so this is the only path.
      let d = '';
      const Lr = lm.right - pr.left, Rl = cm.left - pr.left, Rr = cm.right - pr.left, Sl = rm.left - pr.left;
      const mL = (Lr + Rl) / 2, mR = (Rr + Sl) / 2; // gutter midlines — control X → horizontal tangents (Rider S-curve)
      if (left && right) {
        // R30.35 AC-two-per-side-blocks: a both-versions change draws TWO HALF-ribbons — Local↔centerLeft(older) and
        // Repository↔centerRight(newer), each side connecting to ITS specific center sub-span, NEVER one merged ribbon
        // spanning both. centerLeft = [span0, span0+olderLen] (older/dark), centerRight = [span0+olderLen, span1] (newer).
        const oEnd = c.span[0] + c.olderLen;
        const cLT = this.lineY(this.edCenter, c.span[0]), cLB = this.lineY(this.edCenter, oEnd); // centerLeft (older) Y-range
        const cRT = this.lineY(this.edCenter, oEnd), cRB = this.lineY(this.edCenter, c.span[1]); // centerRight (newer) Y-range
        // R30.35 A+D-left: Local(older) top-aligns to centerLeft with the SAME row count (olderLen === a.length), but the
        // local pad-BELOW viewzone makes aB=lineY(aStart+a.length) overshoot INTO that blank pad → the left half-ribbon
        // spanned content+1 empty row (Tron). Bound the local bottom to the older CONTENT span (aT + centerLeft height) so
        // it maps ONLY real content — symmetric with half2's clean bT/bB (the repo pad-above leaves no trailing pad).
        const aBc = aT + (cLB - cLT);
        const half1 = c.olderLen > 0 ? `M${n(Lr)},${n(aT)} C${n(mL)},${n(aT)} ${n(mL)},${n(cLT)} ${n(Rl)},${n(cLT)} L${n(Rl)},${n(cLB)} C${n(mL)},${n(cLB)} ${n(mL)},${n(aBc)} ${n(Lr)},${n(aBc)} Z` : ''; // Local → centerLeft
        const half2 = c.span[1] > oEnd ? `M${n(Rr)},${n(cRT)} C${n(mR)},${n(cRT)} ${n(mR)},${n(bT)} ${n(Sl)},${n(bT)} L${n(Sl)},${n(bB)} C${n(mR)},${n(bB)} ${n(mR)},${n(cRB)} ${n(Rr)},${n(cRB)} Z` : ''; // centerRight → Repository
        d = `${half1} ${half2}`.trim();
      }
      else if (left) d = `M${n(Lr)},${n(aT)} C${n(mL)},${n(aT)} ${n(mL)},${n(cT)} ${n(Rl)},${n(cT)} L${n(Rl)},${n(cB)} C${n(mL)},${n(cB)} ${n(mL)},${n(aB)} ${n(Lr)},${n(aB)} Z`;
      else if (right) d = `M${n(Rr)},${n(cT)} C${n(mR)},${n(cT)} ${n(mR)},${n(bT)} ${n(Sl)},${n(bT)} L${n(Sl)},${n(bB)} C${n(mR)},${n(bB)} ${n(mR)},${n(cB)} ${n(Rr)},${n(cB)} Z`;
      const isCur = c.id === this._currentId; // R30.36: current change's ribbon brighter (same kind hue)
      if (d) parts.push(`<path d="${d}" fill="${color}" fill-opacity="${isCur ? 0.45 : 0.3}" stroke="${color}" stroke-opacity="${isCur ? 1 : 0.85}" stroke-width="${isCur ? 2 : 1.5}"/>`);
    }
    this._ribbonSvg.innerHTML = parts.join('');
  }

  // [impl:uuid:65c465fa-1c45-497c-a3f9-f95829cff06d] RbDiffEditor.jumpToChange
  // Change navigation: reveal the next/prev (dir ±1) change in Result (wraps). R30.36: also mark it the CURRENT change
  // (_currentId) + re-render so it renders BRIGHTER (same kind hue) than its same-kind neighbours (highlightCurrentChange).
  jumpToChange(dir: number): void {
    const list = this.conflicts;
    if (!list.length || !this.edCenter) return;
    this._jumpIdx = (((this._jumpIdx + dir) % list.length) + list.length) % list.length;
    const c = list[this._jumpIdx];
    this._currentId = c.id;
    this.edCenter.revealLineInCenter(c.span[0] + 1);
    this.edCenter.setPosition({ lineNumber: c.span[0] + 1, column: 1 });
    this.renderMergeGutter(); // re-render blocks+ribbons with the current one emphasised
    this.updateResolveButton(); // R30.37: reflect the new current change's resolved state on the ✓ button
  }

  // [impl:uuid:c86a104d-9777-4e00-a7d9-891e1a69334c] RbDiffEditor.toggleResolved — req 2f7e1606e: the green ✓ is a derived
  // indicator AND a MANUAL OVERRIDE. Clicking it FLIPS the CURRENT change's EFFECTIVE resolved-state and pins that as an
  // override (force-resolve a 2-line KEEP-BOTH, or re-open a 1-line). Sticky until any ≫/≪/✕ on that change re-derives.
  toggleResolved(): void {
    if (this._currentId == null) return;
    const c = this.conflicts.find(x => x.id === this._currentId); if (!c) return;
    this._override.set(c.id, !this.isResolved(c)); // pin the flipped effective state
    this.updateResolveButton();
    this.renderMergeGutter(); // refresh the 'K to resolve' counter + per-change resolved badge
  }

  // R30.37: reflect the CURRENT change's resolved flag on the toolbar ✓ (solid=resolved / outlined=unresolved;
  // disabled when no current change). Called from jumpToChange, toggleResolved, and after every ≫/≪/✕ action.
  private updateResolveButton(): void {
    const el = this.querySelector('.de-resolve') as HTMLButtonElement | null; if (!el) return;
    const c = this._currentId == null ? null : this.conflicts.find(x => x.id === this._currentId);
    el.disabled = c == null;
    el.classList.toggle('resolved', !!c && this.isResolved(c)); // solid = resolved (one version) / outlined = unresolved (both coexist) — DERIVED
  }

  // [impl:uuid:843d79d4-b07a-4f8c-8f15-297211017cb4] RbDiffEditor.addSide — R30.35 REWORK = ADD-SIDE semantic.
  // ≫ (side='left') ADDS Local(older) lines into the region's center; ≪ (side='right') ADDS Repo(newer). ADDITIVE +
  // idempotent — click both → BOTH versions coexist in center. NOT a pick (no longer replaces/kills the other side).
  // R30.37: renamed acceptChange→addSide (accurate: it ADDS a side, not a pick) — req flips scenario 843d79d4.name→addSide
  // simultaneously so the marker keeps name-matching + crediting.
  addSide(changeId: number, side: 'left' | 'right'): void {
    const c = this.conflicts.find(x => x.id === changeId);
    if (!c) return;
    if (side === 'left') c.incl.a = true; else c.incl.b = true;
    this._currentId = changeId; this._override.delete(changeId); // acted change becomes focus; action RE-DERIVES (clears any manual override)
    this.rebuildCenter(); // re-flatten center from the included sets → blocks+ribbons+counter re-derive (no jump)
    this.updateResolveButton();
    this.dirty = true;
  }

  // [impl:uuid:af887908-0d9a-4d44-beda-8c1ebc7fa695] RbDiffEditor.removeLine — R30.35: ✕ REMOVES a side's lines from
  // center, ALWAYS (drop the version you don't want). left=drop Local(older), right=drop Repo(newer). (Method 03c84f3a;
  // the 4 *RemoveLine UCs 3662f00b/74167c20/c014b832/a328ddac point here.)
  removeLine(changeId: number, side: 'left' | 'right'): void {
    const c = this.conflicts.find(x => x.id === changeId);
    if (!c) return;
    if (side === 'left') c.incl.a = false; else c.incl.b = false;
    this._currentId = changeId; this._override.delete(changeId); // acted change becomes focus; action RE-DERIVES (clears any manual override) → drives the ✓ indicator
    this.rebuildCenter();
    this.updateResolveButton();
    this.dirty = true;
    // R30.35 B: dropping a side resolves this change → advance to the NEXT change in sequence of ANY kind (add/delete/
    // modify/conflict) via jumpToChange(1) — NOT jumpToNextUnresolved, which filtered to !isResolved and so SKIPPED every
    // one-sided green(add)/red(delete) change (they derive as resolved). Keep the resolve-on-✕ behaviour; only the target changes.
    if (this.isResolved(c)) { this._jumpIdx = this.conflicts.findIndex(x => x.id === changeId); this.jumpToChange(1); }
  }

  // R30.35/37 (req 2f7e1606e): resolution is DERIVED-PRIMARY with a MANUAL OVERRIDE. Derived = center inclusion,
  // content-aware (a side counts only if included AND has lines) so a genuine one-sided change is derived-resolved,
  // not perpetually open. The green ✓ is BOTH a derived indicator AND a manual override: it can force-RESOLVE a 2-line
  // KEEP-BOTH change (both versions genuinely wanted in the result — the gap pure-derive can't express) or re-OPEN a
  // 1-line change. _override pins the flipped effective state per change; ANY ≫/≪/✕ action re-derives (clears it).
  private _override = new Map<number, boolean>(); // id → forced resolved-state, overriding the derived value
  private leftIn(c: Conflict): boolean { return c.incl.a && c.a.length > 0; }   // Local(older) version present in center
  private rightIn(c: Conflict): boolean { return c.incl.b && c.b.length > 0; }  // Repository(newer) version present in center
  private isResolvedDerived(c: Conflict): boolean { return !(this.leftIn(c) && this.rightIn(c)); } // derived: resolved UNLESS both versions coexist
  private isResolved(c: Conflict): boolean { return this._override.has(c.id) ? this._override.get(c.id)! : this.isResolvedDerived(c); } // effective = override ?? derived
  // [impl:uuid:8b6abf77-b1d7-4eca-a0cd-a90b41372495] RbDiffEditor.openChangeCount — # EFFECTIVELY-unresolved = derived-unresolved
  // (both versions in center) MINUS manual force-resolves (+ manual re-opens). Auto-decrements on ✕ (→ one version) or a
  // force-resolve override; increments on ≫/≪ back to both or a re-open. 0 when every change is effectively resolved.
  openChangeCount(): number {
    return this.conflicts.filter(c => !this.isResolved(c)).length;
  }

  // [impl:uuid:91c452ae-d41c-49bc-8efe-f656d628fd62] RbDiffEditor.applyAllNonConflicting
  // IntelliJ "Apply All Non-Conflicting Changes": diff3 already pre-applied them into CENTER (computeMergedCenter);
  // this (re)confirms by recomputing the base-aware merge, leaving only true conflicts for manual ◄/► resolution.
  applyAllNonConflicting(): void {
    void this.computeMergedCenter();
    this.status(`applied all non-conflicting; ${this.conflicts.length} conflict(s) remain`);
  }

  // [impl:uuid:e3431e87-2312-4679-bd98-6258b43ce6f3] RbDiffEditor.syncScroll3
  // Synchronized vertical scroll across the 3 Monaco editors (IntelliJ locked-scroll). Guard against feedback loops.
  syncScroll3(): void {
    if (!this.edLocal || !this.edCenter || !this.edRemote) return;
    const eds = [this.edLocal, this.edCenter, this.edRemote];
    let syncing = false;
    for (const src of eds) {
      src.onDidScrollChange((e: any) => {
        if (syncing) return;
        syncing = true;
        for (const dst of eds) if (dst !== src) dst.setScrollTop(e.scrollTop);
        syncing = false;
        this.renderInterPaneGutters(); this.renderConnectorRibbons(); // R30.13: keep gutter icons + ribbons aligned on scroll
      });
    }
  }

  // [impl:uuid:97b584c6-36ef-49a8-a7ed-0359a9acb1a5] RbDiffEditor.swapSides
  // Re-scoped (R30.9): exchange Local↔Repository (content + refs + repo) + swap the editor models, then recompute.
  swapSides(): void {
    const tmp = this.left; this.left = this.right; this.right = tmp;
    if (this.edLocal) this.edLocal.setValue(this.left.content);
    if (this.edRemote) this.edRemote.setValue(this.right.content);
    const lt = this.querySelector('.de-local .de-title') as HTMLElement;
    const rt = this.querySelector('.de-remote .de-title') as HTMLElement;
    if (lt) lt.textContent = this.left.ref ? `${this.left.path}@${this.left.ref}` : this.left.path;
    if (rt) rt.textContent = this.right.ref ? `${this.right.path}@${this.right.ref}` : this.right.path;
    void this.computeMergedCenter();
  }

  // [impl:uuid:f0b7ef57-ae79-408c-8f19-a82702d78101] RbDiffEditor.pickRef
  async pickRef(side: 'left' | 'right'): Promise<void> {
    let branches: string[] = [], commits: { hash: string; subject: string }[] = [];
    try {
      const st = side === 'left' ? this.left : this.right;
      const rq = st.repo ? `&repo=${encodeURIComponent(st.repo)}` : '';
      branches = (await (await fetch(`/api/git/branches${st.repo ? `?repo=${encodeURIComponent(st.repo)}` : ''}`)).json()).branches ?? [];
      const q = (st.path ? `?path=${encodeURIComponent(st.path)}&limit=20` : '?limit=20') + rq;
      commits = (await (await fetch(`/api/git/commits${q}`)).json()).commits ?? [];
    } catch { this.status('git ref list failed'); return; }
    const opts = [...branches.map(b => ({ ref: b, label: `⎇ ${b}` })), ...commits.map(c => ({ ref: c.hash, label: `● ${c.hash.slice(0, 8)} ${c.subject}` }))];
    this.overlay(`Pick ref for ${side === 'left' ? 'Local' : 'Repository'}`, opts.map(o => ({ label: o.label, onPick: () => this.setSideRef(side, o.ref) })));
  }

  private setSideRef(side: 'left' | 'right', ref: string): void {
    const st = side === 'left' ? this.left : this.right;
    if (!st.path) { this.status('choose a file first'); return; }
    if (side === 'left') this._leftUserPicked = true; // R30.17 (TRON4): an explicit LEFT ref-pick WINS over the async older-default
    else { this._rightUserPicked = true; this._promoteToken++; } // R30.25: symmetric — a user RIGHT-pick WINS over the auto-promote AND invalidates any in-flight promote (its LEFT-reload tail aborts on the token mismatch), so a RIGHT pick never touches LEFT
    void this.loadSide(side, { path: st.path, ref });
  }

  // [impl:uuid:552dd534-56f4-4dbf-bb11-7c99c19f0d41] RbDiffEditor.pickFile — REUSE rb-file-tree (R30.5).
  pickFile(side: 'left' | 'right'): void {
    const st = side === 'left' ? this.left : this.right;
    const box = this.overlay(`Choose file for ${side === 'left' ? 'Local' : 'Repository'}`, []);
    const tree = document.createElement('rb-file-tree');
    tree.style.cssText = 'display:block;max-height:50vh;overflow:auto';
    box.appendChild(tree);
    if (st.repo) (tree as unknown as { setRepo(k: string): void }).setRepo(st.repo);
    box.addEventListener('file-select', (e: Event) => {
      const p = (e as CustomEvent).detail?.path;
      if (p) { void this.loadSide(side, { path: p }); this.closeOverlay(); }
    });
  }

  // [impl:uuid:a88b2b53-0cc7-42c7-8a63-dfebe737a7c9] RbDiffEditor.save — write CENTER via /api/files (mtime-guarded).
  // R30.x save-404 (item 2): center header shows 'file@currentBranch' — the working-tree branch the merged Save writes to.
  private _branch = ''; private _branchRepo: string | null = null;
  private setCenterTitle(): void {
    const ct = this.querySelector('.de-center .de-title') as HTMLElement; if (!ct) return;
    ct.textContent = this.left.path ? (this._branch ? `${this.left.path}@${this._branch}` : `merged: ${this.left.path}`) : 'merged';
  }
  private async loadCurrentBranch(): Promise<void> {
    if (!this.left.ref || !this.right.ref) { this._branch = ''; this._branchRepo = this.left.repo; return; } // only meaningful for a git-ref diff
    if (this._branchRepo === this.left.repo && this._branch) return;                                          // cached per repo
    const rq = this.left.repo ? `?repo=${encodeURIComponent(this.left.repo)}` : '';
    try { const r = await (await fetch(`/api/git/current-branch${rq}`)).json(); this._branch = (r.branch || '').trim(); } catch { this._branch = ''; }
    this._branchRepo = this.left.repo; this.setCenterTitle();
  }

  async save(): Promise<void> {
    if (!this.left.path) { this.status('nothing to save (no target path)'); return; }
    try {
      const rq = this.left.repo ? `?repo=${encodeURIComponent(this.left.repo)}` : ''; // R30.x save-404: write the merged Result to the DIFF'S repo (e.g. oosh), not rawbin (was 404 'cannot create new files')
      const res = await fetch(`/api/files/${encodeURIComponent(this.left.path)}${rq}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: this.edCenter ? this.edCenter.getValue() : '' }),
      });
      if (res.status === 409) { this.status('save conflict — file changed on disk'); return; }
      if (!res.ok) { this.status(`save failed (${res.status})`); return; }
      this.dirty = false;
      this.status(`saved ${this.left.path}`);
    } catch { this.status('save error'); }
  }

  // [impl:uuid:dc236c19-be03-42df-9c52-4346fb76144a] RbDiffEditor.openFromParams
  // R30.24: restore/open a diff to an EXACT state from URL params — repo=<RepoRegistry key>&path=&left=<ref>&right=<ref>&3way=1.
  // path may come from ?path= or the /edit/<path> pathname (fallbackPath). left/right are git refs ('' = the working file).
  // repo key maps to SideState.repo exactly like the .de-repo <select> ('rawbin' → '', else the key), so R30.6.7 repo-safety
  // (server-side allow-list on ?repo=) is reused unchanged. Loads both sides; 3-way vs 2-way then emerges from resolveBase.
  async openFromParams(params: URLSearchParams, fallbackPath?: string): Promise<void> {
    const key = params.get('repo') || '';
    const repo = key && key !== 'rawbin' ? key : '';           // mirror populateRepos: 'rawbin'/empty = the primary repo ('')
    const path = params.get('path') || fallbackPath || '';
    if (!path) { this.status('deep-link: missing path'); return; }
    const left = params.get('left') || '';                     // git ref, or '' = working file
    const right = params.get('right') || '';
    this._deepLink = true;                                      // suppress the auto left-history promote (would clobber RIGHT)
    this._rightUserPicked = false;                             // R30.25.1: fresh deep-link context (no user pick yet)
    const token = ++this._promoteToken;                        // R30.25.1: our generation — a user RIGHT-pick during the loads bumps this
    this.left = { path, ref: left, repo, content: '' };
    this.right = { path, ref: right, repo, content: '' };
    this.querySelectorAll('.de-repo').forEach(el => { (el as HTMLSelectElement).value = key || 'rawbin'; }); // reflect in UI (best-effort; load uses st.repo)
    try {
      await this.loadSide('left', { path, ref: left });
      // R30.25.1: same token/guard as populateLeftHistory — if a user RIGHT ref-pick landed during the left-load, HONOR it
      // (don't let the deep-link's in-flight right-load resolve last and clobber the user's pick / corrupt RIGHT).
      if (token !== this._promoteToken || this._rightUserPicked) return;
      await this.loadSide('right', { path, ref: right });      // no pick intervened → authoritative RIGHT from the deep-link
    } finally { this._deepLink = false; }
  }

  // [impl:uuid:bcd06c77-0b71-45be-b432-cad7d2a54a99] RbDiffEditor.buildShareLink
  // R30.24: current diff state → a shareable deep-link (the inverse of openFromParams) + copy to clipboard. Path goes in the
  // /edit/<path> pathname; repo (RepoRegistry key, '' → 'rawbin'), left/right refs, and 3way go in the query. Round-trips:
  // buildShareLink() → openFromParams() reopens the identical diff.
  async buildShareLink(): Promise<void> {
    const path = this.left.path;
    if (!path) { this.status('nothing to link (no file)'); return; }
    const key = this.left.repo || 'rawbin';
    const qs = new URLSearchParams({ repo: key, left: this.left.ref, right: this.right.ref, '3way': this.twoWay ? '0' : '1' });
    const url = `${location.origin}/edit/${encodeURIComponent(path)}?${qs.toString()}`;
    try { await navigator.clipboard.writeText(url); this.status(`🔗 link copied: ${url}`); }
    catch { this.status(`🔗 ${url}`); } // clipboard denied (no HTTPS/permission) → still surface the URL to copy manually
  }

  // [impl:uuid:751934c1-96d7-4d9b-ab64-4882b7b6e042] RbDiffEditor.populateLeftHistory
  // R30.17 (TRON4): file-history selector on the LEFT — OLDER version on the left, current/working on the right. When
  // the working file loads on the LEFT, promote it to the RIGHT, then fill the LEFT .de-history (git log --follow) and
  // default LEFT to the newest version that DIFFERS from the working file (HEAD~1 when clean, else HEAD) → Open-Diff
  // shows a real diff, older-on-the-left. Picking an older commit reloads LEFT. Supersedes populateRightHistory (R30.10/15).
  async populateLeftHistory(): Promise<void> {
    const sel = this.querySelector('.de-history') as HTMLSelectElement | null;
    const path = this.left.path;
    if (!sel || !path) return;
    // R30.25: a RIGHT pick that already won for this context (it beat the promote to the punch — loadSide awaits
    // computeMergedCenter first, so a same-tick setSideRef('right') runs before this) must WIN: don't promote, don't
    // reload LEFT (AC-fix). The flag is reset per fresh left working-file load at the top of loadSide, not here.
    if (this._rightUserPicked) return;
    // Take a generation token + snapshot the LEFT content BEFORE any await. A RIGHT ref-pick that lands DURING the awaits
    // re-sets _rightUserPicked and bumps _promoteToken → the token/flag checks below abort the LEFT-reload tail, so a
    // RIGHT pick can NEVER blank or reload LEFT (Tron's invariant: a RIGHT pick touches only right + center).
    const token = ++this._promoteToken;
    const leftSnapshot = this.left.content;
    // promote the just-loaded working file to the RIGHT (current) so the LEFT can carry an older version
    this.right = { path: this.left.path, ref: '', repo: this.left.repo, content: leftSnapshot };
    if (this.edRemote) this.edRemote.setValue(this.right.content);
    const rt = this.querySelector('.de-remote .de-title') as HTMLElement; if (rt) rt.textContent = this.right.path;
    this._leftUserPicked = false;
    const rq = this.left.repo ? `&repo=${encodeURIComponent(this.left.repo)}` : '';
    let history: { hash: string; subject: string }[] = [];
    try { history = (await (await fetch(`/api/git/file-history?path=${encodeURIComponent(path)}${rq}`)).json()).history ?? []; } catch { /* non-git → fallback */ }
    if (token !== this._promoteToken || this._rightUserPicked) return; // R30.25: a RIGHT pick landed mid-flight → this promote is stale, abort before touching LEFT
    if (!history.length) { sel.innerHTML = '<option>no history</option>'; sel.disabled = true; this.status('no git history for this file — use ⎇ to pick a ref'); return; }
    sel.disabled = false;
    if (!this._historyWired) {
      this._historyWired = true;
      sel.addEventListener('change', () => { if (sel.value) { this._leftUserPicked = true; void this.loadSide('left', { path, ref: sel.value }); } }); // explicit LEFT pick WINS
    }
    // MEANINGFUL-DEFAULT: newest version that DIFFERS from the working file — HEAD~1 when clean, else HEAD. R30.25: compare
    // to leftSnapshot (the working content captured before the awaits), NOT live this.right — which a RIGHT pick may have mutated.
    let newestContent = '';
    try { newestContent = (await (await fetch(`/api/git/file?ref=${encodeURIComponent(history[0].hash)}&path=${encodeURIComponent(path)}${rq}`)).json()).content ?? ''; } catch {}
    if (token !== this._promoteToken || this._rightUserPicked) return; // R30.25: re-check after the 2nd await — never reload LEFT over a fresh user RIGHT pick
    const defaultIdx = (newestContent === leftSnapshot && history.length > 1) ? 1 : 0;
    sel.innerHTML = history.map((h, i) => `<option value="${h.hash}"${i === defaultIdx ? ' selected' : ''}>${i === 0 ? '● latest ' : ''}${h.hash.slice(0, 7)} ${h.subject}</option>`).join('');
    if (!this._leftUserPicked) void this.loadSide('left', { path, ref: history[defaultIdx].hash }); // PICK-WINS guard (LEFT); _rightUserPicked/token already re-checked above
  }
  private _historyWired = false;
  private _leftUserPicked = false;
  private _rightUserPicked = false; // R30.25: symmetric to _leftUserPicked — a user-driven RIGHT ref-pick wins over the auto-promote (populateLeftHistory won't reload LEFT while set)
  private _promoteToken = 0;         // R30.25: generation token — a stale in-flight promote aborts its LEFT-reload tail when this no longer matches (bumped by a RIGHT ref-pick / each new promote)
  private _rightLoadSeq = 0;         // R30.25.2: RIGHT-load generation — each loadSide('right') bumps it; a superseded in-flight right-load discards its result (last right-load wins, no ref/content mismatch)
  private _deepLink = false; // R30.24: true while openFromParams restores a URL-linked diff (suppresses auto left-history promote)

  private async populateRepos(): Promise<void> {
    let repos: { key: string; label: string }[] = [];
    try { repos = (await (await fetch('/api/git/repos')).json()).repos ?? []; } catch { return; }
    if (!repos.length) return;
    this.querySelectorAll('.de-repo').forEach(el => {
      const sel = el as HTMLSelectElement;
      sel.innerHTML = repos.map(r => `<option value="${r.key}">${r.label}</option>`).join('');
      sel.addEventListener('change', () => {
        const st = sel.dataset.side === 'left' ? this.left : this.right;
        st.repo = sel.value === 'rawbin' ? '' : sel.value;
        st.ref = '';
        if (st.path) void this.loadSide(sel.dataset.side as 'left' | 'right', { path: st.path });
      });
    });
  }

  private overlay(title: string, options: { label: string; onPick: () => void }[]): HTMLElement {
    this.closeOverlay();
    const ov = document.createElement('div');
    ov.className = 'de-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1000';
    const box = document.createElement('div');
    box.style.cssText = 'background:#252526;border:1px solid #444;border-radius:8px;padding:12px;min-width:280px;max-width:80vw;max-height:70vh;overflow:auto';
    box.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${title}</b><button class="de-close">✕</button></div>`;
    for (const o of options) {
      const b = document.createElement('button');
      b.textContent = o.label;
      b.style.cssText = 'display:block;width:100%;text-align:left;margin:2px 0;padding:4px;background:#1e1e1e;color:#ddd;border:1px solid #333;border-radius:4px;cursor:pointer';
      b.addEventListener('click', () => { o.onPick(); this.closeOverlay(); });
      box.appendChild(b);
    }
    box.querySelector('.de-close')?.addEventListener('click', () => this.closeOverlay());
    ov.addEventListener('click', e => { if (e.target === ov) this.closeOverlay(); });
    ov.appendChild(box);
    document.body.appendChild(ov);
    return box;
  }
  private closeOverlay(): void { document.querySelector('.de-overlay')?.remove(); }
}

customElements.define('rb-diff-editor', RbDiffEditor);
