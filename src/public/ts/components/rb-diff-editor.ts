// R30.9 — IntelliJ-faithful base-aware 3-way merge editor (Tron: "IntelliJ at ANY cost").
// LEFT 'Local' (read-only) | CENTER 'Result' (editable full Monaco) | RIGHT 'Repository' (read-only). Base-aware:
// node-diff3(local, base, remote) → CENTER auto-merges non-conflicting changes + flags true conflicts; per-change
// gutter accept-left ◄ / accept-right ► arrows resolve into CENTER. BASE = GitApi.mergeBase (no base → 2-way fallback).
// Re-arch of the R30.6 textarea/LCS editor (Class RbDiffEditor REUSE 18165081): computeDiff/renderHunks/takeHunk
// (R30.6.1/6.3) SUPERSEDED by computeMergedCenter/renderMergeGutter/acceptChange; loadSide/pickFile/pickRef/save/
// swapSides KEPT (re-scoped). Monaco via the shared CDN/AMD loader (reuse rb-code-editor); node-diff3 vendored.
import './rb-file-tree.js';
import { diff3Merge, diffIndices, type Diff3Region } from '../vendor/diff3.js';

const MONACO_VS = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';
let _monacoPromise: Promise<any> | null = null;

interface SideState { path: string; ref: string; repo: string; content: string }
const emptySide = (): SideState => ({ path: '', ref: '', repo: '', content: '' });

// A conflict alternative (local vs remote) + current pick. `span` = its CURRENT line range in CENTER (recomputed on
// every (re)flatten so it never drifts, even after other conflicts change length).
// R30.16: `kind` set ONCE at hunk creation (classify-at-source) → conflictColor() is a pure fn; center-blocks +
// ribbons read the SAME Conflict → same color by construction. aStart/bStart = the hunk's start line in Local/Repository
// (for viewZone row-alignment + ribbon endpoints).
type ConflictKind = 'conflict' | 'resolvable' | 'change';
interface Conflict { id: number; a: string[]; b: string[]; pick: 'a' | 'b'; span: [number, number]; kind: ConflictKind; aStart: number; bStart: number }
// R30.16 shared palette (DRY, single source for center-blocks + ribbons): blue=one-side change / green=cleanly-resolvable / brown=conflict.
const CONFLICT_PALETTE: Record<ConflictKind, string> = { conflict: '#a5603a', resolvable: '#3a8a5a', change: '#3a6ea5' };
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
        /* R30.16: colored rounded change-blocks in CENTER (replaces the flat maroon de-conflict-line), palette-matched to ribbons. */
        .de-block-conflict { background: rgba(165,96,58,0.22); border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(165,96,58,0.5); }
        .de-block-resolvable { background: rgba(58,138,90,0.20); border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(58,138,90,0.5); }
        .de-block-change { background: rgba(58,110,165,0.20); border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(58,110,165,0.5); }
        .de-gutter-conflict { background: #a5603a; width: 3px !important; margin-left: 2px; }
        .de-gutter-resolvable { background: #3a8a5a; width: 3px !important; margin-left: 2px; }
        .de-gutter-change { background: #3a6ea5; width: 3px !important; margin-left: 2px; }
        rb-diff-editor .de-toolbar button, rb-diff-editor .de-sub button, rb-diff-editor .de-accept-bar button { background:#333;border:1px solid #555;color:#ccc;border-radius:4px;cursor:pointer;font-size:0.7rem;padding:2px 6px }
      </style>
      <div class="de-toolbar" style="display:flex;gap:6px;align-items:center;padding:5px 8px;background:#252526;border-bottom:1px solid #333">
        <b style="font-size:0.75rem">🔀 3-Way Merge</b>
        <button class="de-apply-all" title="Apply All Non-Conflicting Changes">✨ Apply All Non-Conflicting</button>
        <span class="de-count" style="font-size:0.7rem;opacity:0.85" title="changes / conflicts"></span>
        <button class="de-jump-prev" title="Previous change">▲</button>
        <button class="de-jump-next" title="Next change">▼</button>
        <span class="de-status" style="flex:1;font-size:0.7rem;opacity:0.7"></span>
        <button class="de-save" title="Save merged Result">💾 Save</button>
      </div>
      <div class="de-panes" style="display:flex;flex:1;min-height:0;gap:34px;background:#111;position:relative">
        ${(['local', 'center', 'remote'] as const).map(s => `
          <div class="de-pane de-${s}" style="display:flex;flex-direction:column;flex:1;min-width:0;background:#1e1e1e">
            <div class="de-sub" style="display:flex;gap:4px;align-items:center;padding:3px 5px;background:#2d2d2d;border-bottom:1px solid #333;font-size:0.7rem">
              <span class="de-role">${s === 'local' ? 'Local' : s === 'center' ? 'Result' : 'Repository'}</span>
              ${s === 'center'
                ? `<span class="de-title" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:0.7"></span>`
                : `<select class="de-repo" data-side="${s === 'local' ? 'left' : 'right'}" style="background:#1e1e1e;color:#ccc;border:1px solid #333;border-radius:3px;font-size:0.65rem;max-width:70px"></select>
                   <button class="de-file" data-side="${s === 'local' ? 'left' : 'right'}" title="Choose file">📁</button>
                   <button class="de-ref" data-side="${s === 'local' ? 'left' : 'right'}" title="Choose git ref">⎇</button>
                   ${s === 'remote' ? `<select class="de-history" title="File version history (git log --follow)" style="background:#1e1e1e;color:#ccc;border:1px solid #333;border-radius:3px;font-size:0.65rem;max-width:130px"></select>` : ''}
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
    this.querySelector('.de-apply-all')?.addEventListener('click', () => this.applyAllNonConflicting());
    this.querySelector('.de-jump-prev')?.addEventListener('click', () => this.jumpToChange(-1));
    this.querySelector('.de-jump-next')?.addEventListener('click', () => this.jumpToChange(1));
    void this.mountThreePane();
    void this.populateRepos();
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
    const common = { automaticLayout: true, minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: true, renderLineHighlight: 'none' as const }; // R30.16: true → last line can reach the top
    this.edLocal = m.editor.create(this.mount('local'), { ...common, value: this.left.content, readOnly: true, theme: 'vs-dark' });
    this.edCenter = m.editor.create(this.mount('center'), { ...common, value: '', readOnly: false, theme: 'vs-dark' });
    this.edRemote = m.editor.create(this.mount('remote'), { ...common, value: this.right.content, readOnly: true, theme: 'vs-dark' });
    this.edCenter.onDidChangeModelContent(() => { this.dirty = true; });
    this.syncScroll3();
    void this.computeMergedCenter();
  }

  // [impl:uuid:c4da837c-b59f-4c02-9522-2e8599206abf] RbDiffEditor.loadSide
  // Re-scoped (R30.9): load LOCAL (side='left') or REMOTE (side='right') content — working file (/api/files),
  // file@ref (/api/git/file), or preloaded buffer (src.content) — into the side + its Monaco editor, then recompute.
  async loadSide(side: 'left' | 'right', src: { path: string; ref?: string; content?: string }): Promise<void> {
    const st = side === 'left' ? this.left : this.right;
    st.path = src.path; st.ref = src.ref || '';
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
      st.content = content;
      const ed = side === 'left' ? this.edLocal : this.edRemote;
      if (ed) ed.setValue(content);
      const title = this.querySelector(`.de-${side === 'left' ? 'local' : 'remote'} .de-title`) as HTMLElement;
      if (title) title.textContent = st.ref ? `${st.path}@${st.ref}` : st.path;
      await this.computeMergedCenter();
      if (side === 'left') void this.populateRightHistory(); // R30.10: default RIGHT to this file's git history
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
    this.dismissed.clear(); this._jumpIdx = -1; // R30.13: fresh merge → clear ignored set + jump cursor
    if (this.base === '') {
      // R30.12: no merge-base → 2-way TAKE-OVER. LCS(local,remote) → conflicts[] as take-over hunks so the gutter
      // renders ◄/► (pick='a' keep Local default, ► take Version). Previously centerSeq was flat local → no arrows.
      this.twoWay = true;
      this.computeTwoWayHunks(localLines, remoteLines);
    } else {
      this.twoWay = false;
      let cid = 0;
      for (const r of diff3Merge(localLines, this.base.split('\n'), remoteLines)) {
        if ('ok' in r) { this.centerSeq.push({ ok: r.ok }); continue; }
        this.conflicts.push({ id: cid, a: r.conflict.a, b: r.conflict.b, pick: 'a', span: [0, 0], kind: 'conflict', aStart: r.conflict.aIndex, bStart: r.conflict.bIndex }); // R30.16: 3-way true conflict → brown; aIndex/bIndex = Local/Repo start lines
        this.centerSeq.push({ cid: cid });
        cid++;
      }
    }
    this.rebuildCenter();
    const ct = this.querySelector('.de-center .de-title') as HTMLElement;
    if (ct) ct.textContent = this.left.path ? `merged: ${this.left.path}` : 'merged';
    const nc = this.conflicts.length;
    this.status(this.twoWay ? '2-way (no merge-base) — accept ◄/► as take-over' : `${nc} conflict${nc === 1 ? '' : 's'} to resolve${nc ? '' : ' — clean auto-merge'}${this.dirty ? ' • modified' : ''}`);
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
      this.conflicts.push({ id: cid, a: localLines.slice(lStart, lStart + lLen), b: remoteLines.slice(rStart, rStart + rLen), pick: 'a', span: [0, 0], kind: 'change', aStart: lStart, bStart: rStart }); // R30.16: 2-way take-over → blue; lStart/rStart = Local/Repo start lines
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
      const picked = c.pick === 'b' ? c.b : c.a;
      c.span = [lines.length, lines.length + picked.length];
      lines.push(...picked);
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
    this.querySelector('.de-accept-bar')?.remove();
    this.renderInterPaneGutters();   // (4) ≫/≪/✕ icons in the widened gutter
    this.renderConnectorRibbons();   // (5) SVG ribbons, palette-matched to the blocks
    const nc2 = this.conflicts.filter(c => !this.dismissed.has(c.id)).length;
    const cnt = this.querySelector('.de-count') as HTMLElement;
    if (cnt) cnt.textContent = `${this.conflicts.length} change${this.conflicts.length === 1 ? '' : 's'}, ${nc2} ${this.twoWay ? 'take-over' : 'conflict'}${nc2 === 1 ? '' : 's'}`;
  }

  private _maxH(c: Conflict): number { return Math.max(c.a.length, c.b.length, 1); } // aligned block height (rows) across all 3 panes

  // [impl:uuid:17c71adf-7b69-4081-98aa-0e687747a4d5] RbDiffEditor.alignPaneRows
  // R30.16: Monaco viewZone BLANK-ROW spacers so each conflict block occupies maxH=max(a,b) rows in ALL 3 panes →
  // change regions line up L↔C↔R (getTopForLineNumber already counts viewZones → ribbon endpoints get aligned Y →
  // near-horizontal bands). Pad = maxH − that pane's real block length, inserted AFTER the block.
  private alignPaneRows(): void {
    if (!this.edLocal || !this.edCenter || !this.edRemote) return;
    const live = this.conflicts.filter(c => !this.dismissed.has(c.id));
    const specs: Array<['local' | 'center' | 'remote', any, (c: Conflict) => { after: number; pad: number }]> = [
      ['local', this.edLocal, c => ({ after: c.aStart + c.a.length, pad: this._maxH(c) - c.a.length })],
      ['center', this.edCenter, c => ({ after: c.span[1], pad: this._maxH(c) - (c.pick === 'b' ? c.b.length : c.a.length) })],
      ['remote', this.edRemote, c => ({ after: c.bStart + c.b.length, pad: this._maxH(c) - c.b.length })],
    ];
    for (const [key, ed, fn] of specs) {
      ed.changeViewZones((acc: any) => {
        for (const id of this._zoneIds[key]) acc.removeZone(id);
        this._zoneIds[key] = [];
        for (const c of live) {
          const { after, pad } = fn(c);
          if (pad > 0) this._zoneIds[key].push(acc.addZone({ afterLineNumber: Math.max(0, after), heightInLines: pad, domNode: document.createElement('div') }));
        }
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
    const decos = this.conflicts.filter(c => !this.dismissed.has(c.id)).map(c => ({
      range: new m.Range(c.span[0] + 1, 1, Math.max(c.span[0] + 1, c.span[1]), 1),
      options: { isWholeLine: true, className: `de-block-${c.kind}`, linesDecorationsClassName: `de-gutter-${c.kind}`, glyphMarginClassName: c.kind === 'conflict' ? 'de-conflict-glyph' : undefined },
    }));
    this._blockDecoIds = this.edCenter.deltaDecorations(this._blockDecoIds, decos);
  }
  private _blockDecoIds: string[] = [];
  private dismissed = new Set<number>();   // R30.13: changes the user ✕-ignored (visual dismiss; center untouched)
  private _jumpIdx = -1;
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
        s.addEventListener('click', e => {
          const b = (e.target as HTMLElement).closest('[data-cid]') as HTMLElement | null; if (!b) return;
          const id = Number(b.dataset.cid);
          if (b.dataset.act === 'ignore') { this.dismissed.add(id); this.renderInterPaneGutters(); this.renderConnectorRibbons(); }
          else this.acceptChange(id, b.dataset.act as 'left' | 'right');
        });
        panes.appendChild(s);
      }
      s.style.left = (leftPx - 11) + 'px';
      return s;
    };
    const leftStrip = mk('de-gutter-left', centerLeft);
    const rightStrip = mk('de-gutter-right', remoteLeft);
    const btn = (act: string, id: number, glyph: string, title: string) =>
      `<button data-cid="${id}" data-act="${act}" title="${title}" style="pointer-events:auto;display:block;width:20px;height:15px;line-height:13px;margin:1px 0;padding:0;font-size:0.65rem;background:#333;border:1px solid #666;color:#ddd;border-radius:3px;cursor:pointer">${glyph}</button>`;
    const rows = (side: 'left' | 'right') => this.conflicts.filter(c => !this.dismissed.has(c.id)).map(c => {
      const y = Math.max(0, this.lineY(this.edCenter, c.span[0]));
      const take = side === 'left' ? btn('left', c.id, '≫', 'Take Local → Result') : btn('right', c.id, '≪', 'Take Repository → Result');
      const ignore = btn('ignore', c.id, '✕', 'Ignore this change');
      const wand = (c.a.length && c.b.length) ? `<div style="text-align:center;font-size:0.65rem" title="conflict — resolve">🪄</div>` : '';
      return `<div style="position:absolute;top:${y}px;left:0;right:0">${side === 'left' ? take + ignore : ignore + take}${wand}</div>`;
    }).join('');
    leftStrip.innerHTML = rows('left');
    rightStrip.innerHTML = rows('right');
  }

  // [impl:uuid:5051b2a4-6102-41fe-a352-a50e6b8ae03e] RbDiffEditor.renderConnectorRibbons
  // R30.16: one filled band per Conflict — Local-block → Result-block and Result-block → Repository-block — colored by
  // the SHARED conflictColor(c) so ribbons MATCH the center rounded-block. alignPaneRows makes the blocks share rows →
  // near-horizontal Bézier ribbons across the widened (~34px) inter-pane gutter. SVG z-ABOVE editors, pointer-events:none.
  private renderConnectorRibbons(): void {
    if (!this.edCenter || !this.edLocal || !this.edRemote) return;
    const panes = this.querySelector('.de-panes') as HTMLElement; if (!panes) return;
    const pr = panes.getBoundingClientRect();
    if (!this._ribbonSvg) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'de-ribbons');
      svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none'; // above editors, below the z-6 icon strips
      panes.insertBefore(svg, panes.firstChild);
      this._ribbonSvg = svg;
    }
    const lRight = this.mount('local').getBoundingClientRect().right - pr.left;
    const cM = this.mount('center').getBoundingClientRect();
    const cLeft = cM.left - pr.left, cRight = cM.right - pr.left;
    const rLeft = this.mount('remote').getBoundingClientRect().left - pr.left;
    // A closed Bézier band: top edge x1,ya → x2,ya' (S-curve), down x2, back along a mirrored curve, close.
    const band = (x1: number, ya1: number, yb1: number, x2: number, ya2: number, yb2: number, color: string) => {
      const mx = ((x1 + x2) / 2).toFixed(1);
      return `<path d="M${x1.toFixed(1)},${ya1.toFixed(1)} C${mx},${ya1.toFixed(1)} ${mx},${ya2.toFixed(1)} ${x2.toFixed(1)},${ya2.toFixed(1)} L${x2.toFixed(1)},${yb2.toFixed(1)} C${mx},${yb2.toFixed(1)} ${mx},${yb1.toFixed(1)} ${x1.toFixed(1)},${yb1.toFixed(1)} Z" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-opacity="0.6" stroke-width="1"/>`;
    };
    const parts: string[] = [];
    for (const c of this.conflicts.filter(x => !this.dismissed.has(x.id))) {
      const color = conflictColor(c);
      const cTop = this.lineY(this.edCenter, c.span[0]);
      const h = this.lineY(this.edCenter, c.span[1]) - cTop; // aligned block visual height (same in all 3 panes)
      const lTop = this.lineY(this.edLocal, c.aStart);
      const rTop = this.lineY(this.edRemote, c.bStart);
      parts.push(band(lRight, lTop, lTop + h, cLeft, cTop, cTop + h, color));   // Local → Result
      parts.push(band(cRight, cTop, cTop + h, rLeft, rTop, rTop + h, color));   // Result → Repository
    }
    this._ribbonSvg.innerHTML = parts.join('');
  }

  // [impl:uuid:65c465fa-1c45-497c-a3f9-f95829cff06d] RbDiffEditor.jumpToChange
  // Change navigation: reveal the next/prev (dir ±1) non-ignored change region in Result (wraps). Counter lives in the toolbar.
  jumpToChange(dir: number): void {
    const list = this.conflicts.filter(c => !this.dismissed.has(c.id));
    if (!list.length || !this.edCenter) return;
    this._jumpIdx = (((this._jumpIdx + dir) % list.length) + list.length) % list.length;
    const c = list[this._jumpIdx];
    this.edCenter.revealLineInCenter(c.span[0] + 1);
    this.edCenter.setPosition({ lineNumber: c.span[0] + 1, column: 1 });
  }

  // [impl:uuid:843d79d4-b07a-4f8c-8f15-297211017cb4] RbDiffEditor.acceptChange
  // Apply one side's chunk of a conflict into CENTER at its aligned range (the ◄/► gutter action). Re-scopes the old
  // takeHunk, now base-aware + IntelliJ-styled. Rebuilds CENTER text + re-renders the gutter, marks dirty.
  acceptChange(changeId: number, side: 'left' | 'right'): void {
    const c = this.conflicts.find(x => x.id === changeId);
    if (!c) return;
    c.pick = side === 'left' ? 'a' : 'b';
    this.rebuildCenter(); // deterministic re-flatten (recomputes all spans; no drift), re-renders the gutter
    this.dirty = true;
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
    if (side === 'right') this._rightUserPicked = true; // R30.15 (b): an explicit right ref-pick WINS over the async auto-default
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
  async save(): Promise<void> {
    if (!this.left.path) { this.status('nothing to save (no target path)'); return; }
    try {
      const res = await fetch(`/api/files/${encodeURIComponent(this.left.path)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: this.edCenter ? this.edCenter.getValue() : '' }),
      });
      if (res.status === 409) { this.status('save conflict — file changed on disk'); return; }
      if (!res.ok) { this.status(`save failed (${res.status})`); return; }
      this.dirty = false;
      this.status(`saved ${this.left.path}`);
    } catch { this.status('save error'); }
  }

  // [impl:uuid:58c11039-3f11-464d-a8fe-641722f78e2b] RbDiffEditor.populateRightHistory
  // R30.10: default the RIGHT side to the current LOCAL file's git history (git log --follow). Fills the .de-history
  // select newest-first, auto-loads the newest version into RIGHT, and picking an older commit re-loads RIGHT at that
  // sha. No history (untracked / non-git) → 'no history' + the manual ⎇ pickRef fallback is preserved.
  async populateRightHistory(): Promise<void> {
    const sel = this.querySelector('.de-history') as HTMLSelectElement | null;
    if (!sel || !this.left.path) return;
    this._rightUserPicked = false; // R30.15 (b): new LEFT context → a prior right-pick no longer applies
    const rq = this.left.repo ? `&repo=${encodeURIComponent(this.left.repo)}` : '';
    let history: { hash: string; subject: string }[] = [];
    try {
      history = (await (await fetch(`/api/git/file-history?path=${encodeURIComponent(this.left.path)}${rq}`)).json()).history ?? [];
    } catch { /* non-git / error → fallback below */ }
    if (!history.length) { sel.innerHTML = '<option>no history</option>'; sel.disabled = true; this.status('no git history for this file — use ⎇ to pick a ref'); return; }
    sel.disabled = false;
    this.right.repo = this.left.repo; // the file's history lives in the same repo as the local file
    if (!this._historyWired) {
      this._historyWired = true;
      sel.addEventListener('change', () => { if (sel.value) { this._rightUserPicked = true; void this.loadSide('right', { path: this.left.path, ref: sel.value }); } }); // R30.15 (b): explicit history pick WINS
    }
    // R30.15 (a) MEANINGFUL-DEFAULT: default RIGHT to the newest version that DIFFERS from LEFT — HEAD~1 when the
    // working file is clean (content == newest commit), else HEAD — so Open-Diff shows a REAL diff, not 0 hunks.
    let newestContent = '';
    try { newestContent = (await (await fetch(`/api/git/file?ref=${encodeURIComponent(history[0].hash)}&path=${encodeURIComponent(this.left.path)}${rq}`)).json()).content ?? ''; } catch {}
    const defaultIdx = (newestContent === this.left.content && history.length > 1) ? 1 : 0;
    sel.innerHTML = history.map((h, i) => `<option value="${h.hash}"${i === defaultIdx ? ' selected' : ''}>${i === 0 ? '● latest ' : ''}${h.hash.slice(0, 7)} ${h.subject}</option>`).join('');
    // R30.15 (b) PICK-WINS: only auto-load the default if the user hasn't picked a right ref during our async fetch.
    if (!this._rightUserPicked) void this.loadSide('right', { path: this.left.path, ref: history[defaultIdx].hash });
  }
  private _historyWired = false;
  private _rightUserPicked = false;

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
