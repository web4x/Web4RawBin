// R31.4 step-2/3 — Server Manager itemView tree (client bundle).
// Step 2: mount the SHARED rb-trace-tree renderer and feed it the server's /tree `roots`
//   (typed nodes otmuxSession → otmuxWindow → otmuxPane, icons from TRACE_ICONS).
// Step 3: node-select hook — clicking an otmuxPane node opens the terminal (STUBBED here;
//   steps 4-5 = node-pty ws PTY bridge, wired post-rewind). Owner-gate is server-side (R31.2);
//   this page is only reachable by the owner (choke-point 403s everyone else before the shell).
import '../trace/rb-trace-tree.js';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

type Root = { uuid: string; type: string; name: string; hasChildren?: boolean; children?: Root[] };

const err = document.getElementById('err') as HTMLElement | null;
const tree = document.getElementById('sm-tree') as (HTMLElement & { items?: Root[] }) | null;

// R31.4 step-4: full-interactive terminal — fullscreen xterm.js over a binary ws to the owner-gated PTY bridge
// (server PtyBridge.attachPane). Keystrokes → binary frames → pty; pty output → binary frames → term.write;
// resize → {t:'resize'} JSON. Inline overlay styles so it's self-contained (independent of page CSS).
function openTerminal(paneId: string): void {
  const ov = document.createElement('div');
  ov.className = 'sm-term-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:#000;z-index:9999;display:flex;flex-direction:column';
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.style.cssText = 'display:flex;gap:8px;align-items:center;padding:6px 10px;background:#151515;border-bottom:1px solid #333';
  const close = document.createElement('button');
  close.textContent = '✕ Close';
  const label = document.createElement('span');
  label.style.cssText = 'flex:1;font-family:monospace;color:#ccc;font-size:0.8rem';
  label.textContent = 'Terminal — pane ' + paneId;
  bar.appendChild(close);
  bar.appendChild(label);
  const body = document.createElement('div');
  body.className = 'body';
  body.style.cssText = 'flex:1;overflow:hidden;padding:4px;min-height:0';
  ov.appendChild(bar);
  ov.appendChild(body);
  document.body.appendChild(ov);

  const term = new Terminal({ cursorBlink: true, fontFamily: 'monospace', fontSize: 14, theme: { background: '#0b0b0b' } });
  term.open(body);

  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${proto}//${location.host}/api/server-manager/terminal?pane=${encodeURIComponent(paneId)}`);
  ws.binaryType = 'arraybuffer';

  // Approximate monospace cell (14px) → cols/rows from the body box; recomputed on window resize.
  const cell = { w: 8.5, h: 17 };
  const enc = new TextEncoder();
  const fit = (): void => {
    const cols = Math.max(20, Math.floor((body.clientWidth - 8) / cell.w));
    const rows = Math.max(6, Math.floor((body.clientHeight - 8) / cell.h));
    try { term.resize(cols, rows); } catch { /* */ }
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ t: 'resize', cols, rows }));
  };

  ws.onopen = () => { fit(); term.focus(); };
  ws.onmessage = (ev: MessageEvent) => {
    if (typeof ev.data === 'string') { // control JSON (ready / error)
      try { const m = JSON.parse(ev.data); if (m && m.t === 'error') term.write(`\r\n\x1b[31m[${m.msg}]\x1b[0m\r\n`); } catch { /* */ }
      return;
    }
    term.write(new Uint8Array(ev.data as ArrayBuffer)); // pty output (binary)
  };
  ws.onclose = () => { term.write('\r\n\x1b[33m[disconnected]\x1b[0m\r\n'); };
  term.onData((d: string) => { if (ws.readyState === WebSocket.OPEN) ws.send(enc.encode(d)); }); // keystrokes → binary

  const onResize = (): void => fit();
  window.addEventListener('resize', onResize);
  const teardown = (): void => {
    window.removeEventListener('resize', onResize);
    try { ws.close(); } catch { /* */ }
    try { term.dispose(); } catch { /* */ }
    ov.remove();
  };
  close.addEventListener('click', teardown);
}

async function load(): Promise<void> {
  if (!tree) return;
  if (err) err.textContent = '';
  try {
    const r = await fetch('/api/server-manager/tree', { credentials: 'same-origin' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const roots: Root[] = d.roots || [];
    tree.items = roots;
    if (!roots.length && err) err.textContent = 'No tmux sessions.';
  } catch (e: any) {
    if (err) err.textContent = 'Failed to load tree: ' + (e && e.message ? e.message : e);
  }
}

// Node-select hook — capture phase so it runs BEFORE rb-object-item's own click→navigate,
// letting us intercept pane selection without a router on this standalone page.
tree?.addEventListener('click', (e: Event) => {
  const item = (e.target as HTMLElement).closest('rb-object-item');
  if (!item) return;
  const ref = item.getAttribute('ref') || '';
  const sep = ref.indexOf(':');
  if (sep < 0) return;
  const type = ref.slice(0, sep);
  const uuid = ref.slice(sep + 1);
  if (type === 'otmuxpane') {
    e.stopPropagation();
    e.preventDefault();
    openTerminal(uuid);
  }
}, true);

document.getElementById('refresh')?.addEventListener('click', () => void load());
void load();
