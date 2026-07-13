// [impl:uuid:c335d0b8-e290-4e60-b359-e6b4c51ae22a] T65 file tree
const ICONS: Record<string, string> = { '.md': '📄', '.sh': '📜', '.puml': '🎨', '.ts': '⚡', '.tsx': '⚡', '.js': '📦', '.mjs': '📦', '.css': '🎨', '.json': '⚙️', '.html': '🌐', '.svg': '🖼', '.env': '🔒', '.yml': '📋', '.yaml': '📋' };
const BINARY_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.enc', '.key', '.woff', '.woff2', '.ttf', '.zip', '.gz', '.tar', '.pdf', '.map', '.lock']);
const HIDDEN_DIRS = new Set(['node_modules', '.git', 'data']);
const STORAGE_KEY = 'rawbin-file-tree';

function loadExpanded(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { return new Set(); }
}
function saveExpanded(s: Set<string>): void { localStorage.setItem(STORAGE_KEY, JSON.stringify([...s])); }

export class RbFileTree extends HTMLElement {
  private expanded: Set<string> = new Set();
  private activePath: string = '';

  connectedCallback(): void {
    this.expanded = loadExpanded();
    this.style.cssText = 'display:block;font-size:0.8rem;color:#ccc;padding:4px 0;overflow-y:auto;height:100%';
    this.loadDir('');
  }

  setActive(filePath: string): void {
    this.activePath = filePath;
    this.querySelectorAll('.ft-file').forEach(el => {
      (el as HTMLElement).style.background = (el as HTMLElement).dataset.path === filePath ? '#37373d' : '';
    });
  }

  // [impl:uuid:0b026300-cc81-482e-a445-b2bdbb2ed29c] RbFileTree.loadDir — R30.5 root relPath stays '' (drop ||'/')
  private async loadDir(dirPath: string): Promise<void> {
    try {
      // R30.5: root dirPath='' must stay '' → /api/files/ hits readDir('')=project-root. '/' → %2F → server safePath
      // rejects as FS-root Forbidden → empty tree. Subdirs unaffected (lines 34/36 already treat '' as root).
      const res = await fetch(`/api/files/${encodeURIComponent(dirPath)}`);
      if (!res.ok) return;
      const data = await res.json();
      const container = dirPath ? this.querySelector(`[data-children="${dirPath}"]`) as HTMLElement : this;
      if (!container) return;
      if (!dirPath) container.innerHTML = '';
      else container.innerHTML = '';

      for (const entry of data.entries) {
        if (entry.type === 'dir' && HIDDEN_DIRS.has(entry.name)) continue;
        if (entry.type === 'file' && entry.ext && BINARY_EXTS.has(entry.ext)) continue;

        const fullPath = dirPath ? `${dirPath}${entry.name}` : entry.name;
        const el = document.createElement('div');

        if (entry.type === 'dir') {
          const isExpanded = this.expanded.has(fullPath + '/');
          el.className = 'ft-dir';
          const lnk = entry.symlink ? ' 🔗' : '';
          el.innerHTML = `<div class="ft-row" data-dir="${fullPath}/" style="padding:2px 0 2px ${this.indent(dirPath)}px;cursor:pointer;white-space:nowrap"><span style="display:inline-block;width:16px;text-align:center">${isExpanded ? '▾' : '▸'}</span> 📁 ${entry.name}${lnk}</div><div data-children="${fullPath}/" style="display:${isExpanded ? '' : 'none'}"></div>`;
          container.appendChild(el);

          el.querySelector('.ft-row')?.addEventListener('click', () => this.toggleDir(fullPath + '/'));
          if (isExpanded) this.loadDir(fullPath + '/');
        } else {
          const icon = ICONS[entry.ext || ''] || '📄';
          el.className = 'ft-file';
          el.dataset.path = fullPath;
          el.style.cssText = `padding:2px 0 2px ${this.indent(dirPath) + 16}px;cursor:pointer;white-space:nowrap;${fullPath === this.activePath ? 'background:#37373d' : ''}`;
          const flnk = entry.symlink ? ' 🔗' : '';
          el.innerHTML = `${icon} ${entry.name}${flnk}`;
          el.addEventListener('click', () => {
            this.setActive(fullPath);
            this.dispatchEvent(new CustomEvent('file-select', { bubbles: true, detail: { path: fullPath } }));
          });
          container.appendChild(el);
        }
      }
    } catch {}
  }

  private toggleDir(dirPath: string): void {
    const children = this.querySelector(`[data-children="${dirPath}"]`) as HTMLElement;
    const row = this.querySelector(`[data-dir="${dirPath}"]`) as HTMLElement;
    if (!children || !row) return;

    if (this.expanded.has(dirPath)) {
      this.expanded.delete(dirPath);
      children.style.display = 'none';
      children.innerHTML = '';
      row.querySelector('span')!.textContent = '▸';
    } else {
      this.expanded.add(dirPath);
      children.style.display = '';
      row.querySelector('span')!.textContent = '▾';
      this.loadDir(dirPath);
    }
    saveExpanded(this.expanded);
  }

  private indent(dirPath: string): number {
    return (dirPath.split('/').filter(Boolean).length) * 12 + 8;
  }
}

customElements.define('rb-file-tree', RbFileTree);
