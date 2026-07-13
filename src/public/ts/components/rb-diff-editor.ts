// R30.6 — 3-pane diff/merge editor (design-notes/r30.6-diff-merge-editor.md).
// Left + Right are two sources (working file or file@git-ref); Center is the editable merged result.
// Per-hunk take-over pushes a hunk's Left or Right lines into Center. In-house LCS line-diff (no dependency).
import './rb-file-tree.js';

export interface DiffHunk {
  id: number;
  type: 'add' | 'del' | 'change';
  leftRange: [number, number];   // half-open [start, end) into leftLines
  rightRange: [number, number];  // half-open into rightLines
  left: string[];                // the hunk's left lines
  right: string[];               // the hunk's right lines
}

interface SideState { path: string; ref: string; lines: string[]; mtime: number }

const emptySide = (): SideState => ({ path: '', ref: '', lines: [], mtime: 0 });

export class RbDiffEditor extends HTMLElement {
  private left: SideState = emptySide();
  private right: SideState = emptySide();
  private hunks: DiffHunk[] = [];
  private choice = new Map<number, 'left' | 'right'>(); // per-hunk merge choice (default 'left')
  private centerMtime = 0;
  private dirty = false;

  // [impl:uuid:ef6708f6-735c-4a59-a2cd-350aa0ec795d] RbDiffEditor.connectedCallback
  connectedCallback(): void {
    this.style.cssText = 'display:flex;flex-direction:column;height:100%;font-size:0.8rem;color:#ddd';
    this.innerHTML = `
      <div class="de-panes" style="display:flex;flex:1;min-height:0;gap:1px;background:#111">
        ${['left', 'center', 'right'].map(s => `
          <div class="de-pane de-${s}" style="display:flex;flex-direction:column;flex:1;min-width:0;background:#1e1e1e">
            <div class="de-toolbar" style="display:flex;gap:4px;align-items:center;padding:4px;background:#252526;border-bottom:1px solid #333">
              <span class="de-label" style="opacity:0.6;font-size:0.7rem">${s.toUpperCase()}</span>
              ${s === 'center'
                ? `<span class="de-title" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
                   <button class="de-save" title="Save merged result">💾</button>`
                : `<button class="de-file" data-side="${s}" title="Choose file">📁</button>
                   <button class="de-ref" data-side="${s}" title="Choose git ref">🔀</button>
                   <span class="de-title" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
                   ${s === 'left' ? `<button class="de-swap" title="Swap sides">⇄</button>` : ''}`}
            </div>
            <textarea class="de-text" data-side="${s}" spellcheck="false" ${s === 'center' ? '' : 'readonly'}
              style="flex:1;resize:none;border:0;background:#1e1e1e;color:#ddd;font-family:monospace;font-size:0.75rem;padding:6px;outline:none;white-space:pre;overflow:auto"></textarea>
          </div>`).join('')}
      </div>
      <div class="de-status" style="padding:3px 6px;background:#252526;border-top:1px solid #333;font-size:0.7rem;opacity:0.7"></div>`;

    this.querySelectorAll('.de-file').forEach(b => b.addEventListener('click', () => this.pickFile((b as HTMLElement).dataset.side as 'left' | 'right')));
    this.querySelectorAll('.de-ref').forEach(b => b.addEventListener('click', () => this.pickRef((b as HTMLElement).dataset.side as 'left' | 'right')));
    this.querySelector('.de-swap')?.addEventListener('click', () => this.swapSides());
    this.querySelector('.de-save')?.addEventListener('click', () => void this.save());
    this.centerEl.addEventListener('input', () => { this.dirty = true; });
  }

  private get centerEl(): HTMLTextAreaElement { return this.querySelector('.de-text[data-side="center"]') as HTMLTextAreaElement; }
  private sideEl(side: 'left' | 'right'): HTMLTextAreaElement { return this.querySelector(`.de-text[data-side="${side}"]`) as HTMLTextAreaElement; }
  private titleEl(side: 'left' | 'right' | 'center'): HTMLElement { return this.querySelector(`.de-${side} .de-title`) as HTMLElement; }
  private status(msg: string): void { const s = this.querySelector('.de-status'); if (s) s.textContent = msg; }

  // [impl:uuid:c4da837c-b59f-4c02-9522-2e8599206abf] RbDiffEditor.loadSide
  async loadSide(side: 'left' | 'right', src: { path: string; ref?: string; content?: string }): Promise<void> {
    const st = side === 'left' ? this.left : this.right;
    st.path = src.path; st.ref = src.ref || '';
    try {
      let content = '';
      if (src.content != null) {                    // R30.6.6: preloaded content (current editor buffer, LEFT-preselect) — no fetch
        content = src.content; st.mtime = 0;
      } else if (st.ref) {
        const res = await fetch(`/api/git/file?ref=${encodeURIComponent(st.ref)}&path=${encodeURIComponent(st.path)}`);
        if (!res.ok) { this.status(`load ${side} @${st.ref} failed (${res.status})`); return; }
        content = (await res.json()).content ?? '';
      } else {
        const res = await fetch(`/api/files/${encodeURIComponent(st.path)}`);
        if (!res.ok) { this.status(`load ${side} failed (${res.status})`); return; }
        const data = await res.json();
        content = data.content ?? ''; st.mtime = data.mtime ?? 0;
      }
      st.lines = content.split('\n');
      this.sideEl(side).value = content;
      this.titleEl(side).textContent = st.ref ? `${st.path}@${st.ref}` : st.path;
      this.recompute();
    } catch { this.status(`load ${side} error`); }
  }

  // [impl:uuid:15843ac9-9ca1-4cd5-bf5b-dffdff72b19c] RbDiffEditor.computeDiff
  // PURE, DOM-FREE (unit-testable): classic LCS over lines → coalesced add/del/change hunks.
  computeDiff(leftLines: string[], rightLines: string[]): DiffHunk[] {
    const n = leftLines.length, m = rightLines.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        dp[i][j] = leftLines[i] === rightLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const ops: ('keep' | 'del' | 'add')[] = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (leftLines[i] === rightLines[j]) { ops.push('keep'); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push('del'); i++; }
      else { ops.push('add'); j++; }
    }
    while (i < n) { ops.push('del'); i++; }
    while (j < m) { ops.push('add'); j++; }
    const hunks: DiffHunk[] = [];
    let li = 0, ri = 0, id = 0, k = 0;
    while (k < ops.length) {
      if (ops[k] === 'keep') { li++; ri++; k++; continue; }
      const li0 = li, ri0 = ri; const left: string[] = [], right: string[] = [];
      while (k < ops.length && ops[k] !== 'keep') {
        if (ops[k] === 'del') { left.push(leftLines[li]); li++; } else { right.push(rightLines[ri]); ri++; }
        k++;
      }
      const type = left.length && right.length ? 'change' : left.length ? 'del' : 'add';
      hunks.push({ id: id++, type, leftRange: [li0, li], rightRange: [ri0, ri], left, right });
    }
    return hunks;
  }

  private recompute(): void {
    this.hunks = this.computeDiff(this.left.lines, this.right.lines);
    this.choice.clear();
    this.rebuildCenter();
    this.renderHunks();
  }

  // Rebuild Center from Left baseline + per-hunk choice (default 'left' = identity to Left).
  private rebuildCenter(): void {
    const out: string[] = []; let li = 0;
    for (const h of this.hunks) {
      while (li < h.leftRange[0]) { out.push(this.left.lines[li]); li++; }
      out.push(...((this.choice.get(h.id) ?? 'left') === 'right' ? h.right : h.left));
      li = h.leftRange[1];
    }
    while (li < this.left.lines.length) { out.push(this.left.lines[li]); li++; }
    this.centerEl.value = out.join('\n');
    this.titleEl('center').textContent = this.left.path ? `merged: ${this.left.path}` : 'merged';
  }

  // [impl:uuid:37636aaa-1a20-4335-988f-c0a76fff701c] RbDiffEditor.renderHunks
  renderHunks(): void {
    const counts = this.hunks.reduce((a, h) => { a[h.type]++; return a; }, { add: 0, del: 0, change: 0 } as Record<string, number>);
    const list = this.hunks.map(h => {
      const chosen = this.choice.get(h.id) ?? 'left';
      return `<span class="de-hunk" data-hunk="${h.id}" style="display:inline-flex;gap:2px;margin:1px 3px;padding:1px 3px;border:1px solid #444;border-radius:3px">`
        + `<b style="opacity:0.6">#${h.id} ${h.type}</b>`
        + `<button class="de-take" data-hunk="${h.id}" data-side="left" style="${chosen === 'left' ? 'font-weight:bold;color:#6cf' : ''}" title="take Left">◄</button>`
        + `<button class="de-take" data-hunk="${h.id}" data-side="right" style="${chosen === 'right' ? 'font-weight:bold;color:#6cf' : ''}" title="take Right">►</button>`
        + `</span>`;
    }).join('');
    let gutter = this.querySelector('.de-gutter') as HTMLElement;
    if (!gutter) {
      gutter = document.createElement('div');
      gutter.className = 'de-gutter';
      gutter.style.cssText = 'padding:3px 6px;background:#252526;border-top:1px solid #333;max-height:80px;overflow:auto;line-height:1.8';
      this.querySelector('.de-status')?.before(gutter);
      gutter.addEventListener('click', e => {
        const b = (e.target as HTMLElement).closest('.de-take') as HTMLElement | null;
        if (b) this.takeHunk(Number(b.dataset.hunk), b.dataset.side as 'left' | 'right');
      });
    }
    gutter.innerHTML = list || '<span style="opacity:0.5">no differences</span>';
    this.status(`${this.hunks.length} hunks — +${counts.add} -${counts.del} ~${counts.change}${this.dirty ? ' • modified' : ''}`);
  }

  // [impl:uuid:6ebfac12-8114-40fe-b0e4-54709f102711] RbDiffEditor.takeHunk
  takeHunk(hunkId: number, side: 'left' | 'right'): void {
    if (!this.hunks.some(h => h.id === hunkId)) return;
    this.choice.set(hunkId, side);
    this.rebuildCenter();
    this.dirty = true;
    this.renderHunks();
  }

  // [impl:uuid:97b584c6-36ef-49a8-a7ed-0359a9acb1a5] RbDiffEditor.swapSides
  swapSides(): void {
    const tmp = this.left; this.left = this.right; this.right = tmp;
    this.sideEl('left').value = this.left.lines.join('\n');
    this.sideEl('right').value = this.right.lines.join('\n');
    this.titleEl('left').textContent = this.left.ref ? `${this.left.path}@${this.left.ref}` : this.left.path;
    this.titleEl('right').textContent = this.right.ref ? `${this.right.path}@${this.right.ref}` : this.right.path;
    this.recompute();
  }

  // [impl:uuid:f0b7ef57-ae79-408c-8f19-a82702d78101] RbDiffEditor.pickRef
  async pickRef(side: 'left' | 'right'): Promise<void> {
    let branches: string[] = [], commits: { hash: string; subject: string }[] = [];
    try {
      branches = (await (await fetch('/api/git/branches')).json()).branches ?? [];
      const st = side === 'left' ? this.left : this.right;
      const q = st.path ? `?path=${encodeURIComponent(st.path)}&limit=20` : '?limit=20';
      commits = (await (await fetch(`/api/git/commits${q}`)).json()).commits ?? [];
    } catch { this.status('git ref list failed'); return; }
    const opts = [...branches.map(b => ({ ref: b, label: `⎇ ${b}` })),
                  ...commits.map(c => ({ ref: c.hash, label: `● ${c.hash.slice(0, 8)} ${c.subject}` }))];
    this.overlay(`Pick ref for ${side}`, opts.map(o => ({ label: o.label, onPick: () => this.setSideRef(side, o.ref) })));
  }

  private setSideRef(side: 'left' | 'right', ref: string): void {
    const st = side === 'left' ? this.left : this.right;
    if (!st.path) { this.status('choose a file first'); return; }
    void this.loadSide(side, { path: st.path, ref });
  }

  // [impl:uuid:552dd534-56f4-4dbf-bb11-7c99c19f0d41] RbDiffEditor.pickFile
  // REUSE rb-file-tree (R30.5) as the file chooser; on file-select set the side's path + loadSide.
  pickFile(side: 'left' | 'right'): void {
    const box = this.overlay(`Choose file for ${side}`, []);
    const tree = document.createElement('rb-file-tree');
    tree.style.cssText = 'display:block;max-height:50vh;overflow:auto';
    box.appendChild(tree);
    box.addEventListener('file-select', (e: Event) => {
      const p = (e as CustomEvent).detail?.path;
      if (p) { void this.loadSide(side, { path: p }); this.closeOverlay(); }
    });
  }

  // [impl:uuid:a88b2b53-0cc7-42c7-8a63-dfebe737a7c9] RbDiffEditor.save
  // POST the Center merged content via /api/files (mtime-guarded, like edit.ts saveFile).
  async save(): Promise<void> {
    if (!this.left.path) { this.status('nothing to save (no target path)'); return; }
    try {
      const res = await fetch(`/api/files/${encodeURIComponent(this.left.path)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: this.centerEl.value, expectedMtime: this.left.mtime || undefined }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.status === 409) { this.status('save conflict — file changed on disk (reload Left)'); return; }
      if (!res.ok) { this.status(`save failed (${res.status})`); return; }
      this.left.mtime = out.mtime ?? this.left.mtime;
      this.dirty = false;
      this.status(`saved ${this.left.path}`);
      this.renderHunks();
    } catch { this.status('save error'); }
  }

  // Minimal modal overlay helper (option list + optional custom content appended by caller).
  private overlay(title: string, options: { label: string; onPick: () => void }[]): HTMLElement {
    this.closeOverlay();
    const ov = document.createElement('div');
    ov.className = 'de-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1000';
    const box = document.createElement('div');
    box.className = 'de-overlay-box';
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
