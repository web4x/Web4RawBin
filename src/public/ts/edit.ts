import './components/rb-update-banner.js';
import './components/rb-editor-layout.js';
import type { RbEditorLayout } from './components/rb-editor-layout.js';

if (!document.querySelector('rb-update-banner')) {
  document.body.prepend(document.createElement('rb-update-banner'));
}

const EXT_TO_LANG: Record<string, string> = {
  '.md': 'markdown', '.sh': 'shell', '.ts': 'typescript', '.tsx': 'typescript',
  '.js': 'javascript', '.mjs': 'javascript', '.jsx': 'javascript',
  '.css': 'css', '.json': 'json', '.html': 'html', '.svg': 'xml',
  '.yml': 'yaml', '.yaml': 'yaml', '.xml': 'xml', '.puml': 'plaintext',
  '.env': 'ini', '.txt': 'plaintext', '.toml': 'plaintext',
};

function getLanguage(filePath: string): string {
  const ext = '.' + filePath.split('.').pop()?.toLowerCase();
  return EXT_TO_LANG[ext] || 'plaintext';
}

const pathEl = document.getElementById('file-path')!;
const statusEl = document.getElementById('save-status')!;
const saveBtn = document.getElementById('save-btn')!;
const layout = document.getElementById('layout') as RbEditorLayout;

const rawPath = location.pathname.replace(/^\/edit\/?/, '');
const filePath = decodeURIComponent(rawPath);
pathEl.textContent = filePath || '(no file)';
document.title = `${filePath.split('/').pop() || 'Editor'} — RawBin`;

let editor: any = null;
let currentMtime: string = '';

document.getElementById('toggle-tree')?.addEventListener('click', () => layout.toggleTree());
document.getElementById('toggle-preview')?.addEventListener('click', () => layout.togglePreview());

async function loadFile(): Promise<{ content: string; mtime: string } | null> {
  if (!filePath) return null;
  try {
    const res = await fetch(`/api/files/${encodeURIComponent(filePath)}`);
    if (!res.ok) { const e = await res.json().catch(() => ({})); statusEl.textContent = e.error || `Error ${res.status}`; return null; }
    const data = await res.json();
    currentMtime = data.mtime;
    return data;
  } catch { statusEl.textContent = 'Fetch failed'; return null; }
}

async function saveFile(): Promise<void> {
  if (!editor || !filePath) return;
  statusEl.textContent = 'Saving...';
  const content = editor.getValue();
  try {
    const res = await fetch(`/api/files/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, expectedMtime: currentMtime }),
    });
    const result = await res.json();
    if (result.ok) {
      currentMtime = result.mtime;
      statusEl.textContent = 'Saved';
      setTimeout(() => { if (statusEl.textContent === 'Saved') statusEl.textContent = ''; }, 2000);
    } else if (result.conflict) {
      statusEl.textContent = 'Conflict — file changed externally!';
    } else {
      statusEl.textContent = result.error || 'Save failed';
    }
  } catch { statusEl.textContent = 'Save failed'; }
}

saveBtn.addEventListener('click', saveFile);

async function init(): Promise<void> {
  const file = await loadFile();

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js';
  script.onload = () => {
    const require = (window as any).require;
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } });
    require(['vs/editor/editor.main'], (monaco: any) => {
      const editorPanel = layout.editorEl;
      if (!editorPanel) return;
      editorPanel.innerHTML = '';

      const lang = getLanguage(filePath);
      const isMarkdown = lang === 'markdown';

      editor = monaco.editor.create(editorPanel, {
        value: file?.content || '',
        language: lang,
        theme: 'vs-dark',
        minimap: { enabled: true },
        wordWrap: isMarkdown ? 'on' : 'off',
        fontSize: 14,
        tabSize: 2,
        automaticLayout: true,
        scrollBeyondLastLine: false,
      });

      editor.addAction({
        id: 'save-file',
        label: 'Save File',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => saveFile(),
      });

      if (!file) statusEl.textContent = filePath ? 'File not found' : 'No file specified';
    });
  };
  document.head.appendChild(script);
}

init();
