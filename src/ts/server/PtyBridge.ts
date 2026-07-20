import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as pty from 'node-pty';
import type { WebSocket } from 'ws';

const execFileAsync = promisify(execFile);

// R31.4 step-4 Server-Manager INTERACTIVE terminal (architect Class PtyBridge / Method PtyBridge.attachPane
// 6fc43b8e, off design-server-manager.md ## R31.4). Reached ONLY after the owner-gated ws upgrade
// (R31.2 resolveOwner + INV-G3: a non-owner/absent-cookie upgrade is socket.destroy'd BEFORE handleUpgrade,
// so `connection` never fires here). FULL READ-WRITE (Tron: no -r / no Take-Control) — the owner drives the
// real pane. Isolation: a GROUPED tmux session (shares the window list, own view/cursor) so attach + detach
// never disturb any other client; the grouped session is killed on ws close. execFile ARRAY args = no shell
// (no injection); pane_id is validated ^%\d+$ before it touches any tmux target.
export class PtyBridge {
  // [impl:uuid:394eac63-aa3a-4ee6-a2dc-6a5ac9204a05] PtyBridge.attachPane (Method 6fc43b8e) — bridge an owner
  // ws to a live tmux pane via node-pty: resolve the pane's session+window, open a grouped session focused on
  // that pane, node-pty `tmux attach` it RW, pipe pty↔ws (binary), {t:'resize'}→pty.resize, kill on close.
  static async attachPane(ws: WebSocket, paneId: string, log: (m: string) => void): Promise<void> {
    if (!/^%\d+$/.test(paneId)) { try { ws.send(JSON.stringify({ t: 'error', msg: 'bad pane id' })); } catch { /* */ } ws.close(1008, 'bad-pane'); return; }

    // Resolve the pane's session + window index — a grouped attach needs a session; select-window needs the index.
    let sessionName = '', windowIndex = '';
    try {
      const r = await execFileAsync('tmux', ['display-message', '-p', '-t', paneId, '#{session_name}\t#{window_index}'], { timeout: 5000 });
      const [s, w] = r.stdout.trim().split('\t'); sessionName = s || ''; windowIndex = w || '';
    } catch { /* falls through to the not-found guard */ }
    if (!sessionName) { try { ws.send(JSON.stringify({ t: 'error', msg: 'pane not found' })); } catch { /* */ } ws.close(1011, 'no-pane'); return; }

    const sm = `sm_${paneId.replace('%', 'p')}_${Date.now().toString(36)}`; // grouped-session name (server runtime — Date.now ok)
    try {
      await execFileAsync('tmux', ['new-session', '-d', '-s', sm, '-t', sessionName], { timeout: 5000 }); // grouped: shares windows, own view
      await execFileAsync('tmux', ['select-window', '-t', `${sm}:${windowIndex}`], { timeout: 5000 });
      await execFileAsync('tmux', ['select-pane', '-t', paneId], { timeout: 5000 });
    } catch {
      try { await execFileAsync('tmux', ['kill-session', '-t', sm], { timeout: 3000 }); } catch { /* */ }
      try { ws.send(JSON.stringify({ t: 'error', msg: 'attach failed' })); } catch { /* */ }
      ws.close(1011, 'attach-failed'); return;
    }

    const term = pty.spawn('tmux', ['attach-session', '-t', sm], {
      name: 'xterm-256color', cols: 80, rows: 24, cwd: process.env.HOME || '/', env: process.env as { [k: string]: string },
    });
    log(`[server-manager] ATTACH pane=${paneId} session=${sessionName} grouped=${sm} pid=${term.pid}`); // audit

    let closed = false;
    const cleanup = (): void => {
      if (closed) return; closed = true;
      try { term.kill(); } catch { /* */ }
      execFileAsync('tmux', ['kill-session', '-t', sm], { timeout: 3000 }).catch(() => { /* already gone */ });
      try { ws.close(); } catch { /* */ }
      log(`[server-manager] DETACH pane=${paneId} grouped=${sm}`); // audit
    };

    term.onData((d: string) => { try { ws.send(Buffer.from(d, 'utf8')); } catch { /* */ } }); // pty → ws (binary)
    term.onExit(() => cleanup());

    ws.on('message', (data: Buffer, isBinary: boolean) => {
      if (isBinary) { try { term.write(data.toString('utf8')); } catch { /* */ } return; } // keystrokes (binary) → pty
      let msg: { t?: string; cols?: number; rows?: number; data?: string } | null = null;
      try { msg = JSON.parse(data.toString('utf8')); } catch { return; } // text frame = control JSON
      if (msg?.t === 'resize' && Number.isFinite(msg.cols) && Number.isFinite(msg.rows)) {
        try { term.resize(Math.max(1, (msg.cols as number) | 0), Math.max(1, (msg.rows as number) | 0)); } catch { /* */ }
      } else if (msg?.t === 'input' && typeof msg.data === 'string') {
        try { term.write(msg.data); } catch { /* */ }
      }
    });
    ws.on('close', cleanup);
    ws.on('error', cleanup);
    try { ws.send(JSON.stringify({ t: 'ready', pane: paneId })); } catch { /* */ }
  }
}
