// R31.4 step-2/3 — Server Manager itemView tree (client bundle).
// Step 2: mount the SHARED rb-trace-tree renderer and feed it the server's /tree `roots`
//   (typed nodes otmuxSession → otmuxWindow → otmuxPane, icons from TRACE_ICONS).
// Step 3: node-select hook — clicking an otmuxPane node opens the terminal (STUBBED here;
//   steps 4-5 = node-pty ws PTY bridge, wired post-rewind). Owner-gate is server-side (R31.2);
//   this page is only reachable by the owner (choke-point 403s everyone else before the shell).
import '../trace/rb-trace-tree.js';

type Root = { uuid: string; type: string; name: string; hasChildren?: boolean; children?: Root[] };

const err = document.getElementById('err') as HTMLElement | null;
const tree = document.getElementById('sm-tree') as (HTMLElement & { items?: Root[] }) | null;

// STUB terminal (R31.4 steps 4-5 = node-pty grouped-session PTY bridge + xterm.js; expert wires post-rewind).
function openTerminal(paneId: string): void {
  const ov = document.createElement('div');
  ov.className = 'sm-term-overlay';
  const bar = document.createElement('div');
  bar.className = 'bar';
  const close = document.createElement('button');
  close.textContent = '✕ Close';
  close.addEventListener('click', () => ov.remove());
  const label = document.createElement('span');
  label.style.cssText = 'flex:1;font-family:monospace';
  label.textContent = 'Terminal — pane ' + paneId;
  bar.appendChild(close);
  bar.appendChild(label);
  const body = document.createElement('div');
  body.className = 'body';
  body.textContent = 'Interactive terminal for pane ' + paneId + ' — coming soon (R31.4: node-pty ws PTY bridge).';
  ov.appendChild(bar);
  ov.appendChild(body);
  document.body.appendChild(ov);
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
