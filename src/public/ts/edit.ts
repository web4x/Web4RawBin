import './components/rb-update-banner.js';
import './components/rb-editor-layout.js';
import type { RbEditorLayout } from './components/rb-editor-layout.js';
import './components/rb-file-tree.js';
import type { RbFileTree } from './components/rb-file-tree.js';
import './components/rb-code-editor.js';
import type { RbCodeEditor } from './components/rb-code-editor.js';

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

async function saveFile(path: string, content: string): Promise<void> {
  statusEl.textContent = 'Saving...';
  try {
    const res = await fetch(`/api/files/${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, expectedMtime: currentMtime }),
    });
    const result = await res.json();
    if (result.ok) {
      currentMtime = result.mtime;
      statusEl.textContent = 'Saved';
      codeEditor?.clearDirty();
      setTimeout(() => { if (statusEl.textContent === 'Saved') statusEl.textContent = ''; }, 2000);
    } else if (result.conflict) {
      statusEl.textContent = 'Conflict — file changed externally!';
    } else {
      statusEl.textContent = result.error || 'Save failed';
    }
  } catch { statusEl.textContent = 'Save failed'; }
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

  document.addEventListener('dirty-change', ((e: CustomEvent) => {
    pathEl.textContent = filePath + (e.detail.dirty ? ' ●' : '');
  }) as EventListener);

  if (filePath) {
    const file = await fetchFile(filePath);
    if (codeEditor) await codeEditor.loadFile(filePath, file?.content || '');
    const fileTree = document.querySelector('rb-file-tree') as RbFileTree | null;
    if (fileTree) fileTree.setActive(filePath);
    if (!file) statusEl.textContent = 'File not found';
  } else {
    statusEl.textContent = 'Select a file from the tree';
  }
}

init();
