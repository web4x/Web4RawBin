import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface SmPane { paneId: string; index: string; title: string; active: boolean; label: string; }
export interface SmWindow { index: string; name: string; active: boolean; panes: SmPane[]; }
export interface SmSession { name: string; windows: SmWindow[]; }

// R31.3 Server-Manager tmux READ path (architect Class OtmuxBridge / Method OtmuxBridge.readSessionTree 7d7221d8,
// off UC 168e6d2b, design-server-manager.md ## R31.3). Read-only, owner-gated at the callers (API + page route via
// R31.2 assertOwner). Uses RAW `tmux list-panes -a -F` (NOT the OOSH otmux wrapper) so parsing is deterministic.
export class OtmuxBridge {
  // [impl marker PENDING] — architect to mint+wire the Impl under Method 7d7221d8 (ior:class:Implementation), then
  // place [impl:uuid:<Impl>] here (NOT the Method uuid). Env can't wireImplNode; architect mints on ship.
  // Parse the flat -F output into nested sessions[] → windows[] → panes[]. pane_id (%N) is the STABLE target
  // (survives window/pane renumbering); label `session:win.pane` is the human ID. execFile ARRAY args = no shell
  // (no injection), read-only verb, bounded timeout + maxBuffer.
  static async readSessionTree(): Promise<SmSession[]> {
    const FMT = ['#{session_name}', '#{window_index}', '#{window_name}', '#{window_active}',
      '#{pane_index}', '#{pane_id}', '#{pane_active}', '#{pane_title}'].join('\t');
    let out = '';
    try {
      const r = await execFileAsync('tmux', ['list-panes', '-a', '-F', FMT], { timeout: 5000, maxBuffer: 1 << 20 });
      out = r.stdout;
    } catch {
      return []; // no tmux server / no sessions → empty tree (not an error)
    }
    const sessions = new Map<string, SmSession>();
    for (const line of out.split('\n')) {
      if (!line.trim()) continue;
      const parts = line.split('\t');
      const [sname, widx, wname, wactive, pidx, pid, pactive] = parts;
      const title = parts.slice(7).join('\t'); // pane_title may itself contain tabs — take the remainder
      let s = sessions.get(sname);
      if (!s) { s = { name: sname, windows: [] }; sessions.set(sname, s); }
      let w = s.windows.find((x) => x.index === widx);
      if (!w) { w = { index: widx, name: wname, active: wactive === '1', panes: [] }; s.windows.push(w); }
      w.panes.push({ paneId: pid, index: pidx, title, active: pactive === '1', label: `${sname}:${widx}.${pidx}` });
    }
    return [...sessions.values()];
  }
}
