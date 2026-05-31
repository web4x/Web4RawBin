// [impl:uuid:1e9916f1-7e29-4e9d-9aa9-c930fe693c9f] T64 editor layout
const STORAGE_KEY = 'rawbin-editor-layout';
const TAB_BAR_HEIGHT = 52;

interface LayoutState {
  treeWidth: number;
  treeCollapsed: boolean;
  previewVisible: boolean;
}

function loadState(): LayoutState {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return s?.treeWidth ? s : { treeWidth: 200, treeCollapsed: false, previewVisible: false };
  } catch { return { treeWidth: 200, treeCollapsed: false, previewVisible: false }; }
}

function saveState(s: LayoutState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export class RbEditorLayout extends HTMLElement {
  private state: LayoutState = { treeWidth: 200, treeCollapsed: false, previewVisible: false };
  private mobileSetup = false;
  private activePanel = 'editor';

  connectedCallback(): void {
    const saved = loadState();
    if (saved) this.state = saved;
    this.render();
    this.setupDividers();
    this.setupMobile();
    window.addEventListener('resize', () => this.setupMobile());
  }

  get treeEl(): HTMLElement | null { return this.querySelector('.el-tree'); }
  get editorEl(): HTMLElement | null { return this.querySelector('.el-editor'); }
  get previewEl(): HTMLElement | null { return this.querySelector('.el-preview'); }
  get isMobile(): boolean { return window.innerWidth < 768; }

  toggleTree(): void { this.state.treeCollapsed = !this.state.treeCollapsed; this.applyState(); saveState(this.state); }
  togglePreview(): void { this.state.previewVisible = !this.state.previewVisible; this.applyState(); saveState(this.state); }
  showPreview(): void { this.state.previewVisible = true; this.applyState(); saveState(this.state); }
  hidePreview(): void { this.state.previewVisible = false; this.applyState(); saveState(this.state); }

  private render(): void {
    this.style.cssText = 'display:flex;width:100%;height:100%;overflow:hidden;position:relative';
    this.innerHTML = `
      <div class="el-tree" style="width:${this.state.treeWidth}px;min-width:0;overflow:auto;background:#252526;border-right:1px solid #3c3c3c;flex-shrink:0"></div>
      <div class="el-divider el-div-tree" style="width:4px;cursor:col-resize;background:#3c3c3c;flex-shrink:0"></div>
      <div class="el-editor" style="flex:1;min-width:0;overflow:hidden"></div>
      <div class="el-divider el-div-preview" style="width:4px;cursor:col-resize;background:#3c3c3c;flex-shrink:0;display:none"></div>
      <div class="el-preview" style="flex:1;min-width:0;overflow:auto;background:#1e1e1e;display:none"></div>
      <div class="el-tabs" style="display:none;position:fixed;bottom:0;left:0;right:0;background:#252526;border-top:1px solid #3c3c3c;padding:6px 8px;padding-bottom:calc(6px + env(safe-area-inset-bottom));z-index:10">
        <div style="display:flex;gap:4px">
          <button class="tab-btn" data-panel="tree" style="flex:1;padding:10px;border:none;background:#3c3c3c;color:#ccc;font-size:0.8rem;cursor:pointer;border-radius:6px">📂 Files</button>
          <button class="tab-btn" data-panel="editor" style="flex:1;padding:10px;border:none;background:#667eea;color:white;font-size:0.8rem;cursor:pointer;border-radius:6px">✏️ Editor</button>
          <button class="tab-btn" data-panel="preview" style="flex:1;padding:10px;border:none;background:#3c3c3c;color:#ccc;font-size:0.8rem;cursor:pointer;border-radius:6px">👁 Preview</button>
        </div>
      </div>`;
    this.applyState();
  }

  private applyState(): void {
    if (this.isMobile) { this.showMobilePanel(this.activePanel); return; }
    const tree = this.treeEl, preview = this.previewEl;
    const divTree = this.querySelector('.el-div-tree') as HTMLElement;
    const divPreview = this.querySelector('.el-div-preview') as HTMLElement;
    const tabs = this.querySelector('.el-tabs') as HTMLElement;
    if (tabs) tabs.style.display = 'none';
    if (tree && divTree) {
      tree.style.display = this.state.treeCollapsed ? 'none' : '';
      tree.style.width = this.state.treeWidth + 'px';
      tree.style.height = '';
      divTree.style.display = this.state.treeCollapsed ? 'none' : '';
    }
    if (preview && divPreview) {
      preview.style.display = this.state.previewVisible ? '' : 'none';
      preview.style.height = '';
      divPreview.style.display = this.state.previewVisible ? '' : 'none';
    }
    const editor = this.editorEl;
    if (editor) { editor.style.display = ''; editor.style.height = ''; }
  }

  private setupDividers(): void {
    const setupDrag = (divider: HTMLElement, target: HTMLElement, stateKey: 'treeWidth') => {
      let startX = 0, startW = 0;
      const onMove = (e: MouseEvent) => { this.state[stateKey] = Math.max(100, Math.min(400, startW + e.clientX - startX)); target.style.width = this.state[stateKey] + 'px'; };
      const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); saveState(this.state); };
      divider.addEventListener('mousedown', (e) => { startX = e.clientX; startW = this.state[stateKey]; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); e.preventDefault(); });
    };
    const divTree = this.querySelector('.el-div-tree') as HTMLElement;
    const tree = this.treeEl;
    if (divTree && tree) setupDrag(divTree, tree, 'treeWidth');
  }

  private setupMobile(): void {
    const isMobile = this.isMobile;
    const tabs = this.querySelector('.el-tabs') as HTMLElement;
    const dividers = this.querySelectorAll('.el-divider') as NodeListOf<HTMLElement>;
    if (!tabs) return;

    if (isMobile) {
      tabs.style.display = '';
      dividers.forEach(d => d.style.display = 'none');
      if (!this.mobileSetup) {
        this.mobileSetup = true;
        tabs.querySelectorAll('.tab-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            this.activePanel = (btn as HTMLElement).dataset.panel || 'editor';
            this.showMobilePanel(this.activePanel);
          });
        });
      }
      this.showMobilePanel(this.activePanel);
      this.dispatchEvent(new CustomEvent('layout-mobile', { bubbles: true, detail: { mobile: true } }));
    } else {
      tabs.style.display = 'none';
      this.mobileSetup = false;
      this.applyState();
      this.dispatchEvent(new CustomEvent('layout-mobile', { bubbles: true, detail: { mobile: false } }));
    }
  }

  private showMobilePanel(panel: string): void {
    const tree = this.treeEl, editor = this.editorEl, preview = this.previewEl;
    const h = `calc(100% - ${TAB_BAR_HEIGHT}px)`;
    if (tree) { tree.style.display = panel === 'tree' ? '' : 'none'; tree.style.width = '100%'; tree.style.height = h; }
    if (editor) { editor.style.display = panel === 'editor' ? '' : 'none'; editor.style.height = h; }
    if (preview) { preview.style.display = panel === 'preview' ? '' : 'none'; preview.style.height = h; }
    this.querySelectorAll('.tab-btn').forEach(btn => {
      const active = (btn as HTMLElement).dataset.panel === panel;
      (btn as HTMLElement).style.background = active ? '#667eea' : '#3c3c3c';
      (btn as HTMLElement).style.color = active ? 'white' : '#ccc';
    });
  }
}

customElements.define('rb-editor-layout', RbEditorLayout);
