import './components/rb-update-banner.js';
import './components/rb-editor-layout.js';
import type { RbEditorLayout } from './components/rb-editor-layout.js';
import './components/rb-file-tree.js';
import type { RbFileTree } from './components/rb-file-tree.js';
import './components/rb-code-editor.js';
import type { RbCodeEditor } from './components/rb-code-editor.js';
import './components/rb-preview.js';
import type { RbPreview } from './components/rb-preview.js';
import './components/rb-editor-toolbar.js';
import type { RbEditorToolbar } from './components/rb-editor-toolbar.js';
import { RbTraceTree, TraceRouter, viewRegistry, deserialize } from './trace/index.js';

if (!document.querySelector('rb-update-banner')) {
  document.body.prepend(document.createElement('rb-update-banner'));
}

const toolbar = document.getElementById('toolbar') as RbEditorToolbar;
const layout = document.getElementById('layout') as RbEditorLayout;

const rawPath = location.pathname.replace(/^\/edit\/?/, '');
let filePath = decodeURIComponent(rawPath);
let currentMtime = '';

let codeEditor: RbCodeEditor | null = null;
let preview: RbPreview | null = null;

function hasPreview(path: string): boolean { return path.endsWith('.md') || path.endsWith('.puml'); }

function updatePreview(): void {
  if (!preview || !codeEditor || !filePath.endsWith('.md')) return;
  preview.setContent(codeEditor.getValue(), filePath);
}

function applyMode(mode: string): void {
  if (mode === 'code') { layout.hidePreview(); }
  else if (mode === 'preview') { layout.showPreview(); layout.toggleTree(); }
  else { layout.showPreview(); }
}

async function fetchFile(path: string): Promise<{ content: string; mtime: string } | null> {
  if (!path) return null;
  try {
    const res = await fetch(`/api/files/${encodeURIComponent(path)}`);
    if (!res.ok) { toolbar.setStatus((await res.json().catch(() => ({}))).error || `Error ${res.status}`, '#e74c3c'); return null; }
    const data = await res.json();
    currentMtime = data.mtime;
    return data;
  } catch { toolbar.setStatus('Fetch failed', '#e74c3c'); return null; }
}

async function saveFile(path: string, content: string, force?: boolean): Promise<void> {
  toolbar.setStatus('Saving...');
  try {
    const body: any = { content };
    if (!force && currentMtime) body.expectedMtime = currentMtime;
    const res = await fetch(`/api/files/${encodeURIComponent(path)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const result = await res.json();
    if (result.ok) {
      currentMtime = result.mtime;
      toolbar.setStatus('Saved', '#4CAF50');
      codeEditor?.clearDirty();
      if (path.endsWith('.puml') && preview) preview.renderPuml(content);
      setTimeout(() => toolbar.setStatus(''), 2000);
    } else if (result.conflict) {
      toolbar.setStatus('Conflict!', '#e74c3c');
      if (confirm('File changed on disk.\n\nOK = Overwrite\nCancel = Reload from disk')) {
        await saveFile(path, content, true);
      } else {
        const fresh = await fetchFile(path);
        if (codeEditor && fresh) await codeEditor.loadFile(path, fresh.content);
        toolbar.setStatus('Reloaded', '#ff9800');
        setTimeout(() => toolbar.setStatus(''), 2000);
      }
    } else { toolbar.setStatus(result.error || 'Save failed', '#e74c3c'); }
  } catch { toolbar.setStatus('Save failed', '#e74c3c'); }
}

async function openFile(path: string): Promise<void> {
  if (codeEditor?.dirty && !confirm('Unsaved changes. Discard?')) return;
  filePath = path;
  document.title = `${path.split('/').pop() || 'Editor'} — RawBin`;
  history.replaceState({}, '', `/edit/${encodeURIComponent(path)}`);
  toolbar.setPath(path);
  const file = await fetchFile(path);
  if (codeEditor) await codeEditor.loadFile(path, file?.content || '');
  if (hasPreview(path) && file) {
    if (preview) preview.setContentImmediate(file.content, path);
  } else if (preview) { preview.clear(); }
  const fileTree = document.querySelector('rb-file-tree') as RbFileTree | null;
  if (fileTree) fileTree.setActive(path);
  if (!file) toolbar.setStatus('File not found', '#e74c3c');
}

// Toolbar events
document.addEventListener('toolbar-save', () => { if (filePath) saveFile(filePath, codeEditor?.getValue() || ''); });
document.addEventListener('mode-change', ((e: CustomEvent) => applyMode(e.detail.mode)) as EventListener);
document.addEventListener('dirty-change', ((e: CustomEvent) => { toolbar.setDirty(e.detail.dirty); updatePreview(); }) as EventListener);

// T108: traceability browser — a tree sibling to the file tree, with a detail pane below.
// Additive + guarded: if /api/trace fails, the editor is unaffected.
async function mountTraceBrowser(treePanel: HTMLElement): Promise<void> {
  try {
    const heading = document.createElement('div');
    heading.textContent = 'Traceability';
    heading.style.cssText = 'color:#888;font-size:0.7rem;text-transform:uppercase;padding:8px 8px 4px;border-top:1px solid #3c3c3c;margin-top:8px';
    const traceTree = document.createElement('rb-trace-tree') as RbTraceTree;
    const detail = document.createElement('div');
    detail.className = 'tt-detail';
    treePanel.appendChild(heading);
    treePanel.appendChild(traceTree);
    treePanel.appendChild(detail);

    const res = await fetch('/api/trace');
    if (!res.ok) return;
    const data = await res.json();
    const graph = deserialize(data.objects || []);
    traceTree.setGraph(graph, data.broken || []);
    // node click (rb-object-item) → navigate → router renders the DetailView into `detail`
    const router = new TraceRouter(graph, viewRegistry(), detail);
    router.start();
  } catch { /* trace browser optional — never break the editor */ }
}

async function init(): Promise<void> {
  toolbar.setPath(filePath);

  const treePanel = layout.treeEl;
  if (treePanel) {
    const tree = document.createElement('rb-file-tree') as RbFileTree;
    treePanel.appendChild(tree);
    tree.addEventListener('file-select', ((e: CustomEvent) => openFile(e.detail.path)) as EventListener);
    mountTraceBrowser(treePanel); // T108: traceability tree next to the file tree
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

  if (filePath) {
    const file = await fetchFile(filePath);
    if (codeEditor) await codeEditor.loadFile(filePath, file?.content || '');
    if (hasPreview(filePath) && file && preview) preview.setContentImmediate(file.content, filePath);
    const fileTree = document.querySelector('rb-file-tree') as RbFileTree | null;
    if (fileTree) fileTree.setActive(filePath);
    if (!file) toolbar.setStatus('File not found', '#e74c3c');
  } else { toolbar.setStatus('Select a file from the tree'); }
}

init();
