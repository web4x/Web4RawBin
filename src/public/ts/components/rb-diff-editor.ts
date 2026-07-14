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
interface Conflict { id: number; a: string[]; b: string[]; pick: 'a' | 'b'; span: [number, number] }
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
        .de-conflict-line { background: rgba(200,60,60,0.16); }
        .de-conflict-gutter { background: #a33; width: 3px !important; margin-left: 2px; }
        .de-conflict-glyph::before { content: '⚠'; color: #e66; font-size: 0.7rem; }
        rb-diff-editor .de-toolbar button, rb-diff-editor .de-sub button, rb-diff-editor .de-accept-bar button { background:#333;border:1px solid #555;color:#ccc;border-radius:4px;cursor:pointer;font-size:0.7rem;padding:2px 6px }
      </style>
      <div class="de-toolbar" style="display:flex;gap:6px;align-items:center;padding:5px 8px;background:#252526;border-bottom:1px solid #333">
        <b style="font-size:0.75rem">🔀 3-Way Merge</b>
        <button class="de-apply-all" title="Apply All Non-Conflicting Changes">✨ Apply All Non-Conflicting</button>
        <span class="de-status" style="flex:1;font-size:0.7rem;opacity:0.7"></span>
        <button class="de-save" title="Save merged Result">💾 Save</button>
      </div>
      <div class="de-panes" style="display:flex;flex:1;min-height:0;gap:1px;background:#111">
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
    const common = { automaticLayout: true, minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false, renderLineHighlight: 'none' as const };
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
        this.conflicts.push({ id: cid, a: r.conflict.a, b: r.conflict.b, pick: 'a', span: [0, 0] }); // default LOCAL; ► → remote
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
      this.conflicts.push({ id: cid, a: localLines.slice(lStart, lStart + lLen), b: remoteLines.slice(rStart, rStart + rLen), pick: 'a', span: [0, 0] });
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
  // IntelliJ gutter: highlight each conflict region in CENTER + a ◄ (accept Local) / ► (accept Repository) control.
  // Non-conflicting changes are already applied (rendered subtly); true conflicts stand out for resolution.
  renderMergeGutter(): void {
    if (!this.edCenter || !this.monaco) return;
    const m = this.monaco;
    const decos = this.conflicts.map(c => ({
      range: new m.Range(c.span[0] + 1, 1, Math.max(c.span[0] + 1, c.span[1]), 1),
      options: { isWholeLine: true, className: 'de-conflict-line', linesDecorationsClassName: 'de-conflict-gutter', glyphMarginClassName: 'de-conflict-glyph' },
    }));
    this._conflictDecoIds = this.edCenter.deltaDecorations(this._conflictDecoIds || [], decos);
    // accept arrows overlay (one row per conflict) — ◄ take Local / ► take Repository
    let bar = this.querySelector('.de-accept-bar') as HTMLElement;
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'de-accept-bar';
      bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;padding:3px 8px;background:#252526;border-top:1px solid #333;max-height:64px;overflow:auto';
      this.querySelector('.de-panes')?.after(bar);
      bar.addEventListener('click', e => {
        const b = (e.target as HTMLElement).closest('.de-accept') as HTMLElement | null;
        if (b) this.acceptChange(Number(b.dataset.cid), b.dataset.side as 'left' | 'right');
      });
    }
    bar.innerHTML = this.conflicts.length
      ? this.conflicts.map(c => `<span style="display:inline-flex;gap:2px;align-items:center;border:1px solid #a33;border-radius:3px;padding:1px 4px">`
        + `<b style="opacity:0.7;font-size:0.65rem">${this.twoWay ? 'take-over' : 'conflict'} #${c.id}${c.pick === 'a' ? ' (Local)' : c.pick === 'b' ? ' (Repo)' : ''}</b>`
        + `<button class="de-accept" data-cid="${c.id}" data-side="left" title="Accept Local">◄</button>`
        + `<button class="de-accept" data-cid="${c.id}" data-side="right" title="Accept Repository">►</button></span>`).join('')
      : '<span style="opacity:0.5">no conflicts</span>';
  }
  private _conflictDecoIds: string[] = [];

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
    let history: { hash: string; subject: string }[] = [];
    try {
      const rq = this.left.repo ? `&repo=${encodeURIComponent(this.left.repo)}` : '';
      history = (await (await fetch(`/api/git/file-history?path=${encodeURIComponent(this.left.path)}${rq}`)).json()).history ?? [];
    } catch { /* non-git / error → fallback below */ }
    if (!history.length) { sel.innerHTML = '<option>no history</option>'; sel.disabled = true; this.status('no git history for this file — use ⎇ to pick a ref'); return; }
    sel.disabled = false;
    sel.innerHTML = history.map((h, i) => `<option value="${h.hash}">${i === 0 ? '● latest ' : ''}${h.hash.slice(0, 7)} ${h.subject}</option>`).join('');
    this.right.repo = this.left.repo; // the file's history lives in the same repo as the local file
    if (!this._historyWired) {
      this._historyWired = true;
      sel.addEventListener('change', () => { if (sel.value) void this.loadSide('right', { path: this.left.path, ref: sel.value }); });
    }
    void this.loadSide('right', { path: this.left.path, ref: history[0].hash }); // default = newest version
  }
  private _historyWired = false;

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
