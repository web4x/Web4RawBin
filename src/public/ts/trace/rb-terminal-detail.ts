// R31.4 DRAWER-DRY: the Server Manager terminal as a FIRST-CLASS detail-view (like rb-task-detail) so it flows
// through the STANDARD drawer path — selectionModel.select('otmuxpane:%N') → selection-changed → drawer
// renderDetailForRef → this element — making scroll / grab-bar / expand / minimize IDENTICAL to /trace by
// construction (retires the showElement fork + its scroll/handle/silent-no-op bugs). uuid attr = tmux pane_id (%N).
// xterm.js over a binary ws to the owner-gated PtyBridge; teardown in disconnectedCallback (the drawer removes the
// element on re-render/close → ws.close → server kills the pty + grouped tmux session).
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

export class RbTerminalDetail extends HTMLElement {
  static get observedAttributes() { return ['uuid']; }
  private term: Terminal | null = null;
  private ws: WebSocket | null = null;
  private ro: ResizeObserver | null = null;
  private onWin: (() => void) | null = null;
  private paneId = '';

  connectedCallback(): void { this.mount(); }
  disconnectedCallback(): void { this.teardown(); }
  attributeChangedCallback(): void { if (this.isConnected && (this.getAttribute('uuid') || '') !== this.paneId) { this.teardown(); this.mount(); } }

  private mount(): void {
    const paneId = this.getAttribute('uuid') || '';
    if (!paneId) { this.innerHTML = '<div class="dv-empty">no pane</div>'; return; }
    this.paneId = paneId;
    this.style.cssText = 'display:flex;flex-direction:column;height:60vh;min-height:240px;text-align:left';
    this.innerHTML = '';
    const bar = document.createElement('div');
    bar.style.cssText = 'flex:0 0 auto;color:#ccc;font:600 0.78rem monospace;padding:2px 4px 6px';
    bar.textContent = 'Terminal — pane ' + paneId;
    const host = document.createElement('div');
    host.style.cssText = 'flex:1;min-height:0;overflow:hidden';
    this.appendChild(bar);
    this.appendChild(host);

    const term = new Terminal({ cursorBlink: true, fontFamily: 'monospace', fontSize: 14, theme: { background: '#0b0b0b' } });
    this.term = term;
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${location.host}/api/server-manager/terminal?pane=${encodeURIComponent(paneId)}`);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    const enc = new TextEncoder();
    const cell = { w: 8.5, h: 17 }; // approximate monospace cell (14px) → cols/rows; refit on drawer expand/minimize/window
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
    term.open(host);
    this.ro = new ResizeObserver(() => fit());
    this.ro.observe(host);
    this.onWin = (): void => fit();
    window.addEventListener('resize', this.onWin);
    fit();
  }

  private teardown(): void {
    try { this.ro?.disconnect(); } catch { /* */ } this.ro = null;
    if (this.onWin) { window.removeEventListener('resize', this.onWin); this.onWin = null; }
    try { this.ws?.close(); } catch { /* */ } this.ws = null; // → server kills pty + grouped tmux session
    try { this.term?.dispose(); } catch { /* */ } this.term = null;
    this.paneId = '';
  }
}
customElements.define('rb-terminal-detail', RbTerminalDetail);
