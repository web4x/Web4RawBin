// [impl:uuid:3858a667-1f57-4ebf-afd4-fd34128a985d] T70 editor toolbar
const MODE_KEY = 'rawbin-editor-mode';
type ViewMode = 'code' | 'split' | 'preview';

function defaultMode(path: string): ViewMode {
  return path.endsWith('.md') || path.endsWith('.puml') ? 'split' : 'code';
}

export class RbEditorToolbar extends HTMLElement {
  private _mode: ViewMode = 'code';
  private _dirty = false;
  private _path = '';

  get mode(): ViewMode { return this._mode; }

  connectedCallback(): void {
    this.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 12px;background:#252526;border-bottom:1px solid #3c3c3c;font-size:0.8rem';
    this.render();
  }

  setPath(path: string): void {
    this._path = path;
    const saved = localStorage.getItem(MODE_KEY + ':' + path);
    this._mode = (saved as ViewMode) || defaultMode(path);
    this.render();
    this.dispatchModeChange();
  }

  setDirty(dirty: boolean): void { this._dirty = dirty; this.updatePath(); }
  setStatus(text: string, color?: string): void {
    const el = this.querySelector('#tb-status') as HTMLElement;
    if (el) { el.textContent = text; el.style.color = color || ''; }
  }

  private render(): void {
    const parent = this._path ? this._path.split('/').slice(0, -1).join('/') : '';
    const parentDir = parent ? '/md/' + parent + '/' : '/md/';
    this.innerHTML = `
      <a href="${parentDir}" style="color:#ccc;text-decoration:none">← Back</a>
      <a href="/md/" style="color:#ccc;text-decoration:none">📂</a>
      <span id="tb-path" style="flex:1;color:#667eea;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._path || '(no file)'}</span>
      ${this._path && (this._path.endsWith('.md') || this._path.endsWith('.puml')) ? `<a href="/md/${this._path}" style="color:#ff9800;text-decoration:none;font-size:0.75rem" title="View rendered">👁 View</a>` : ''}
      <span id="tb-status" style="font-size:0.75rem;opacity:0.8"></span>
      <button class="tb-btn" id="tb-mode" style="background:none;border:1px solid #555;color:#ccc;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem">${this.modeLabel()}</button>
      <button class="tb-btn" id="tb-save" style="background:none;border:1px solid #555;color:#ccc;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem">Save</button>`;
    this.querySelector('#tb-save')?.addEventListener('click', () => this.dispatchEvent(new CustomEvent('toolbar-save', { bubbles: true })));
    this.querySelector('#tb-mode')?.addEventListener('click', () => this.cycleMode());
  }

  private updatePath(): void {
    const el = this.querySelector('#tb-path') as HTMLElement;
    if (el) el.textContent = this._path + (this._dirty ? ' ●' : '');
  }

  private modeLabel(): string { return this._mode === 'code' ? '✏️ Code' : this._mode === 'split' ? '⬜ Split' : '👁 Preview'; }

  private cycleMode(): void {
    const modes: ViewMode[] = ['code', 'split', 'preview'];
    this._mode = modes[(modes.indexOf(this._mode) + 1) % 3];
    localStorage.setItem(MODE_KEY + ':' + this._path, this._mode);
    const btn = this.querySelector('#tb-mode') as HTMLElement;
    if (btn) btn.textContent = this.modeLabel();
    this.dispatchModeChange();
  }

  private dispatchModeChange(): void {
    this.dispatchEvent(new CustomEvent('mode-change', { bubbles: true, detail: { mode: this._mode } }));
  }
}

customElements.define('rb-editor-toolbar', RbEditorToolbar);
