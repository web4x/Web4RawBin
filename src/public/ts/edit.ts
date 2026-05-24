import './components/rb-update-banner.js';
import './components/rb-editor-layout.js';
import type { RbEditorLayout } from './components/rb-editor-layout.js';
import './components/rb-file-tree.js';
import type { RbFileTree } from './components/rb-file-tree.js';
import './components/rb-code-editor.js';
import type { RbCodeEditor } from './components/rb-code-editor.js';
import './components/rb-preview.js';
import type { RbPreview } from './components/rb-preview.js';

if (!document.querySelector('rb-update-banner')) {
  document.body.prepend(document.createElement('rb-update-banner'));
}

const pathEl = document.getElementById('file-path')!;
const statusEl = document.getElementById('save-status')!;
const saveBtn = document.getElementById('save-btn')!;
const layout = document.getElementById('layout') as RbEditorLayout;

const rawPath = location.pathname.replace(/^\/edit\/?/, '');
let filePath = decodeURIComponent(rawPath);
let currentMtime = '';

pathEl.textContent = filePath || '(no file)';
document.title = `${filePath.split('/').pop() || 'Editor'} — RawBin`;

document.getElementById('toggle-tree')?.addEventListener('click', () => layout.toggleTree());
document.getElementById('toggle-preview')?.addEventListener('click', () => layout.togglePreview());

let codeEditor: RbCodeEditor | null = null;
let preview: RbPreview | null = null;

function isMarkdown(path: string): boolean { return path.endsWith('.md'); }
function isPuml(path: string): boolean { return path.endsWith('.puml'); }
function hasPreview(path: string): boolean { return isMarkdown(path) || isPuml(path); }

function updatePreview(): void {
  if (!preview || !codeEditor || !isMarkdown(filePath)) return;
  preview.setContent(codeEditor.getValue(), filePath);
}

async function fetchFile(path: string): Promise<{ content: string; mtime: string } | null> {
  if (!path) return null;
  try {
    const res = await fetch(`/api/files/${encodeURIComponent(path)}`);
    if (!res.ok) { statusEl.textContent = (await res.json().catch(() => ({}))).error || `Error ${res.status}`; return null; }
    const data = await res.json();
    currentMtime = data.mtime;
    return data;
  } catch { statusEl.textContent = 'Fetch failed'; return null; }
}

async function saveFile(path: string, content: string, force?: boolean): Promise<void> {
  statusEl.textContent = 'Saving...';
  statusEl.style.color = '';
  try {
    const body: any = { content };
    if (!force && currentMtime) body.expectedMtime = currentMtime;
    const res = await fetch(`/api/files/${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (result.ok) {
      currentMtime = result.mtime;
      statusEl.textContent = 'Saved';
      statusEl.style.color = '#4CAF50';
      codeEditor?.clearDirty();
      if (isPuml(path) && preview) preview.renderPuml(content);
      setTimeout(() => { if (statusEl.textContent === 'Saved') { statusEl.textContent = ''; statusEl.style.color = ''; } }, 2000);
    } else if (result.conflict) {
      statusEl.textContent = 'Conflict!';
      statusEl.style.color = '#e74c3c';
      const choice = confirm('File changed on disk.\n\nOK = Overwrite with your version\nCancel = Reload file from disk');
      if (choice) {
        await saveFile(path, content, true);
      } else {
        const fresh = await fetchFile(path);
        if (codeEditor && fresh) await codeEditor.loadFile(path, fresh.content);
        statusEl.textContent = 'Reloaded';
        statusEl.style.color = '#ff9800';
        setTimeout(() => { statusEl.textContent = ''; statusEl.style.color = ''; }, 2000);
      }
    } else {
      statusEl.textContent = result.error || 'Save failed';
      statusEl.style.color = '#e74c3c';
    }
  } catch { statusEl.textContent = 'Save failed'; statusEl.style.color = '#e74c3c'; }
}

async function openFile(path: string): Promise<void> {
  if (codeEditor?.dirty && !confirm('Unsaved changes. Discard?')) return;
  filePath = path;
  pathEl.textContent = path;
  document.title = `${path.split('/').pop() || 'Editor'} — RawBin`;
  history.replaceState({}, '', `/edit/${encodeURIComponent(path)}`);
  statusEl.textContent = '';
  const file = await fetchFile(path);
  if (codeEditor) await codeEditor.loadFile(path, file?.content || '');
  if (hasPreview(path)) {
    layout.showPreview();
    if (preview && file) preview.setContentImmediate(file.content, path);
  } else {
    layout.hidePreview();
    if (preview) preview.clear();
  }
  const fileTree = document.querySelector('rb-file-tree') as RbFileTree | null;
  if (fileTree) fileTree.setActive(path);
  if (!file) statusEl.textContent = 'File not found';
}

saveBtn.addEventListener('click', () => { if (filePath) saveFile(filePath, codeEditor?.getValue() || ''); });

async function init(): Promise<void> {
  const treePanel = layout.treeEl;
  if (treePanel) {
    const tree = document.createElement('rb-file-tree') as RbFileTree;
    treePanel.appendChild(tree);
    tree.addEventListener('file-select', ((e: CustomEvent) => openFile(e.detail.path)) as EventListener);
  }

  const editorPanel = layout.editorEl;
  if (editorPanel) {
    editorPanel.innerHTML = '';
    codeEditor = document.createElement('rb-code-editor') as RbCodeEditor;
    codeEditor.setOnSave(saveFile);
    editorPanel.appendChild(codeEditor);
  }

  const previewPanel = layout.previewEl;
  if (previewPanel) {
    previewPanel.innerHTML = '';
    preview = document.createElement('rb-preview') as RbPreview;
    previewPanel.appendChild(preview);
  }

  document.addEventListener('dirty-change', ((e: CustomEvent) => {
    updatePreview();
    pathEl.textContent = filePath + (e.detail.dirty ? ' ●' : '');
  }) as EventListener);

  if (filePath) {
    const file = await fetchFile(filePath);
    if (codeEditor) await codeEditor.loadFile(filePath, file?.content || '');
    if (hasPreview(filePath) && file) {
      layout.showPreview();
      if (preview) preview.setContentImmediate(file.content, filePath);
    } else {
      layout.hidePreview();
    }
    const fileTree = document.querySelector('rb-file-tree') as RbFileTree | null;
    if (fileTree) fileTree.setActive(filePath);
    if (!file) statusEl.textContent = 'File not found';
  } else {
    statusEl.textContent = 'Select a file from the tree';
  }
}

init();
