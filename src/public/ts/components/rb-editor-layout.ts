const STORAGE_KEY = 'rawbin-editor-layout';

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
      <div class="el-tabs" style="display:none;position:fixed;bottom:0;left:0;right:0;background:#252526;border-top:1px solid #3c3c3c;padding:6px 0;padding-bottom:calc(6px + env(safe-area-inset-bottom));z-index:10">
        <div style="display:flex;justify-content:center;gap:4px">
          <button class="tab-btn" data-panel="tree" style="flex:1;padding:8px;border:none;background:#3c3c3c;color:#ccc;font-size:0.8rem;cursor:pointer;border-radius:4px">📂 Files</button>
          <button class="tab-btn" data-panel="editor" style="flex:1;padding:8px;border:none;background:#667eea;color:white;font-size:0.8rem;cursor:pointer;border-radius:4px">✏️ Editor</button>
          <button class="tab-btn" data-panel="preview" style="flex:1;padding:8px;border:none;background:#3c3c3c;color:#ccc;font-size:0.8rem;cursor:pointer;border-radius:4px">👁 Preview</button>
        </div>
      </div>`;
    this.applyState();
  }

  private applyState(): void {
    const tree = this.treeEl;
    const preview = this.previewEl;
    const divTree = this.querySelector('.el-div-tree') as HTMLElement;
    const divPreview = this.querySelector('.el-div-preview') as HTMLElement;
    if (tree && divTree) {
      tree.style.display = this.state.treeCollapsed ? 'none' : '';
      tree.style.width = this.state.treeWidth + 'px';
      divTree.style.display = this.state.treeCollapsed ? 'none' : '';
    }
    if (preview && divPreview) {
      preview.style.display = this.state.previewVisible ? '' : 'none';
      divPreview.style.display = this.state.previewVisible ? '' : 'none';
    }
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
    const isMobile = window.innerWidth < 768;
    const tabs = this.querySelector('.el-tabs') as HTMLElement;
    const dividers = this.querySelectorAll('.el-divider') as NodeListOf<HTMLElement>;
    if (!tabs) return;

    if (isMobile) {
      tabs.style.display = '';
      dividers.forEach(d => d.style.display = 'none');
      this.showPanel('editor');
      tabs.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => this.showPanel((btn as HTMLElement).dataset.panel || 'editor'));
      });
    } else {
      tabs.style.display = 'none';
      this.applyState();
    }
  }

  private showPanel(panel: string): void {
    const tree = this.treeEl, editor = this.editorEl, preview = this.previewEl;
    if (tree) tree.style.display = panel === 'tree' ? '' : 'none';
    if (editor) editor.style.display = panel === 'editor' ? '' : 'none';
    if (preview) preview.style.display = panel === 'preview' ? '' : 'none';
    this.querySelectorAll('.tab-btn').forEach(btn => {
      (btn as HTMLElement).style.background = (btn as HTMLElement).dataset.panel === panel ? '#667eea' : '#3c3c3c';
      (btn as HTMLElement).style.color = (btn as HTMLElement).dataset.panel === panel ? 'white' : '#ccc';
    });
  }
}

customElements.define('rb-editor-layout', RbEditorLayout);
