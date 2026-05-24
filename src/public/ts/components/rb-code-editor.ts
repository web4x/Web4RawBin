// Files loaded via /api/files/<path> by edit.ts, content passed to loadFile()
const EXT_TO_LANG: Record<string, string> = {
  '.md': 'markdown', '.sh': 'shell', '.ts': 'typescript', '.tsx': 'typescript',
  '.js': 'javascript', '.mjs': 'javascript', '.jsx': 'javascript',
  '.css': 'css', '.json': 'json', '.html': 'html', '.svg': 'xml',
  '.yml': 'yaml', '.yaml': 'yaml', '.xml': 'xml', '.puml': 'plaintext',
  '.env': 'ini', '.txt': 'plaintext', '.toml': 'plaintext',
};

export class RbCodeEditor extends HTMLElement {
  private editor: any = null;
  private monaco: any = null;
  private _dirty = false;
  private _path = '';
  private _savedContent = '';
  private onSave: ((path: string, content: string) => void) | null = null;
  private loadResolve: (() => void) | null = null;

  get dirty(): boolean { return this._dirty; }
  get currentPath(): string { return this._path; }

  connectedCallback(): void {
    this.style.cssText = 'display:block;width:100%;height:100%;overflow:hidden';
    this.loadMonaco();
    window.addEventListener('beforeunload', (e) => { if (this._dirty) { e.preventDefault(); e.returnValue = ''; } });
  }

  setOnSave(cb: (path: string, content: string) => void): void { this.onSave = cb; }

  async loadFile(filePath: string, content: string): Promise<void> {
    this._path = filePath;
    this._savedContent = content;
    this._dirty = false;
    this.updateDirtyIndicator();

    if (!this.monaco) await new Promise<void>(r => { this.loadResolve = r; });
    if (!this.editor) return;

    const lang = this.getLanguage(filePath);
    const model = this.monaco.editor.createModel(content, lang);
    this.editor.setModel(model);
    this.editor.updateOptions({ wordWrap: lang === 'markdown' ? 'on' : 'off' });
  }

  getValue(): string { return this.editor?.getValue() || ''; }

  clearDirty(): void {
    this._dirty = false;
    this._savedContent = this.getValue();
    this.updateDirtyIndicator();
  }

  private getLanguage(filePath: string): string {
    const ext = '.' + filePath.split('.').pop()?.toLowerCase();
    return EXT_TO_LANG[ext] || 'plaintext';
  }

  private updateDirtyIndicator(): void {
    this.dispatchEvent(new CustomEvent('dirty-change', { bubbles: true, detail: { dirty: this._dirty, path: this._path } }));
  }

  private loadMonaco(): void {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js';
    script.onload = () => {
      const req = (window as any).require;
      req.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } });
      req(['vs/editor/editor.main'], (monaco: any) => {
        this.monaco = monaco;
        this.innerHTML = '';

        this.editor = monaco.editor.create(this, {
          value: '',
          language: 'plaintext',
          theme: 'vs-dark',
          minimap: { enabled: window.innerWidth >= 768 },
          wordWrap: 'off',
          fontSize: 14,
          tabSize: 2,
          automaticLayout: true,
          scrollBeyondLastLine: false,
        });

        this.editor.onDidChangeModelContent(() => {
          const nowDirty = this.getValue() !== this._savedContent;
          if (nowDirty !== this._dirty) {
            this._dirty = nowDirty;
            this.updateDirtyIndicator();
          }
        });

        this.editor.addAction({
          id: 'save-file',
          label: 'Save File',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
          run: () => { if (this.onSave && this._path) this.onSave(this._path, this.getValue()); },
        });

        if (this.loadResolve) { this.loadResolve(); this.loadResolve = null; }
      });
    };
    document.head.appendChild(script);
  }
}

customElements.define('rb-code-editor', RbCodeEditor);
