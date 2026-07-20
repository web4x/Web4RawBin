// R31.4 — Server Manager itemView tree + interactive terminal (client bundle).
// Tree: the SHARED rb-trace-tree renderer fed by /tree `roots` (otmuxSession→otmuxWindow→otmuxPane, TRACE_ICONS).
// Terminal: selecting an otmuxPane opens a full-interactive xterm.js terminal — hosted in the SHARED default
//   drawer (RbDetailDrawer.showElement) over a binary ws to the owner-gated PtyBridge. Owner-gate is server-side
//   (R31.2 choke-point 403s non-owners before this shell + before the ws upgrade).
import '../trace/rb-trace-tree.js';
import '../trace/rb-detail-drawer.js';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

type Root = { uuid: string; type: string; name: string; hasChildren?: boolean; children?: Root[] };

const err = document.getElementById('err') as HTMLElement | null;
const tree = document.getElementById('sm-tree') as (HTMLElement & { items?: Root[] }) | null;

// R31.4 UX: the shared default drawer hosts the terminal (reuses grab-bar/close/minimize/expand). Client-only —
// created here in the bundle (no server page-shell change / no restart).
const drawer = ((): HTMLElement & { showElement(el: HTMLElement, opts?: { title?: string; onClose?: () => void }): void } => {
  let d = document.getElementById('sm-drawer');
  if (!d) { d = document.createElement('rb-detail-drawer'); d.id = 'sm-drawer'; document.body.appendChild(d); }
  return d as unknown as HTMLElement & { showElement(el: HTMLElement, opts?: { title?: string; onClose?: () => void }): void };
})();

// R31.4 UX fix: the terminal mounts in the SHARED default drawer (RbDetailDrawer.showElement) — reusing its
// grab-bar / close / minimize / expand chrome — instead of a bespoke centered overlay. LEFT-ALIGNED container
// (no center / justify / margin-auto — the old overlay .body centering was the UX bug). PTY lifecycle: attach on
// open; KEEP the ws on minimize-peek (re-expand resumes); teardown (ws.close → server kills pty + grouped tmux
// session, term.dispose) on FULL close via the onClose the drawer's close() invokes.
function openTerminal(paneId: string): void {
  const container = document.createElement('div');
  container.style.cssText = 'text-align:left;height:100%;width:100%;display:flex;flex-direction:column;min-height:0';
  const host = document.createElement('div'); // xterm mounts here
  host.style.cssText = 'flex:1;min-height:0;overflow:hidden';
  container.appendChild(host);

  const term = new Terminal({ cursorBlink: true, fontFamily: 'monospace', fontSize: 14, theme: { background: '#0b0b0b' } });
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${proto}//${location.host}/api/server-manager/terminal?pane=${encodeURIComponent(paneId)}`);
  ws.binaryType = 'arraybuffer';
  const enc = new TextEncoder();

  // Approximate monospace cell (14px) → cols/rows from the host box; refit on drawer expand/minimize + window (ResizeObserver).
  const cell = { w: 8.5, h: 17 };
  const fit = (): void => {
    const cols = Math.max(20, Math.floor((host.clientWidth - 4) / cell.w));
    const rows = Math.max(6, Math.floor((host.clientHeight - 4) / cell.h));
    try { term.resize(cols, rows); } catch { /* */ }
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ t: 'resize', cols, rows }));
  };

  ws.onopen = () => { fit(); term.focus(); };
  ws.onmessage = (ev: MessageEvent) => {
    if (typeof ev.data === 'string') { try { const m = JSON.parse(ev.data); if (m && m.t === 'error') term.write(`\r\n\x1b[31m[${m.msg}]\x1b[0m\r\n`); } catch { /* */ } return; }
    term.write(new Uint8Array(ev.data as ArrayBuffer)); // pty output (binary)
  };
  ws.onclose = () => { try { term.write('\r\n\x1b[33m[disconnected]\x1b[0m\r\n'); } catch { /* */ } };
  term.onData((d: string) => { if (ws.readyState === WebSocket.OPEN) ws.send(enc.encode(d)); }); // keystrokes → binary

  const ro = new ResizeObserver(() => fit());
  const onWin = (): void => fit();
  let disposed = false;
  const teardown = (): void => { // invoked by the drawer's FULL close (onClose) — NOT on minimize-peek
    if (disposed) return; disposed = true;
    try { ro.disconnect(); } catch { /* */ }
    window.removeEventListener('resize', onWin);
    try { ws.close(); } catch { /* */ } // → server kills the pty + grouped tmux session
    try { term.dispose(); } catch { /* */ }
  };

  drawer.showElement(container, { title: 'Terminal — pane ' + paneId, onClose: teardown });
  term.open(host);          // host is now in the DOM (drawer detail panel)
  ro.observe(host);
  window.addEventListener('resize', onWin);
  fit();
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
