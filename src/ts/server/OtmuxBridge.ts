import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export interface SmPane { paneId: string; index: string; title: string; active: boolean; label: string; }
export interface SmWindow { index: string; name: string; active: boolean; panes: SmPane[]; }
export interface SmSession { name: string; windows: SmWindow[]; }
export interface SmTreeRow { uuid: string; type: string; name: string; hasChildren: boolean; children?: SmTreeRow[]; }
// Minimal read view of the scenario store (decouples OtmuxBridge from ScenarioIndex; lets the gate pass a real one).
export interface UnitReader { list(): Iterable<string>; get(key: string): { ior: string; model?: Record<string, unknown> } | null | undefined; }
// R40.1 per-pane RC deep-link. url=null is FAIL-CLOSED (no measured bridge → NO link + a stated reason), NEVER a
// synthesised session_ URL. A url is emitted ONLY from a measured ~/.claude/sessions/<pid>.json.bridgeSessionId.
export interface RcLink { url: string | null; reason?: string; agent?: string; }

// R31.3 Server-Manager tmux READ path (architect Class OtmuxBridge / Method OtmuxBridge.readSessionTree 7d7221d8,
// off UC 168e6d2b, design-server-manager.md ## R31.3). Read-only, owner-gated at the callers (API + page route via
// R31.2 assertOwner). Uses RAW `tmux list-panes -a -F` (NOT the OOSH otmux wrapper) so parsing is deterministic.
export class OtmuxBridge {
  // [impl:uuid:5c1701bc-bf5d-4e9c-904a-2f4144e1ef2a] OtmuxBridge.readSessionTree (Method 7d7221d8, off UC 168e6d2b)
  // — parse the flat `tmux list-panes -a -F` output into nested sessions[] → windows[] → panes[]. pane_id (%N) is
  // the STABLE target (survives renumbering); label `session:win.pane` is the human ID. execFile ARRAY args = no
  // shell (no injection), read-only verb, bounded timeout + maxBuffer.
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

  // R41 — compose the Server-Manager itemView `roots`: re-root the live otmux session tree under the WODA.prod
  // deployment node (model-driven from nodeUnit). EXTRACTED from the /api/server-manager/tree handler so the
  // composition AND the loud fail-open are gateable as REAL code — inline handler logic is untestable-by-construction
  // (the tester had to gate a [REPLICATED] copy; this makes it gate the actual function + INV-T). This method only
  // COMPOSES — `sessions` is the LIVE LENS the caller reads fresh each request (read-only → INV-T byte-diff==0). Fail
  // -OPEN AND LOUD: a missing / non-`node` unit keeps the sessions available BUT surfaces a visible ⚠ notice row + a
  // server WARN (never silently the bare flat list Tron complained about — degrade the data, never the honesty).
  // [impl:uuid:fcd57103-4ff0-4ca1-b3c7-2deec33e6a02] OtmuxBridge.buildRootedTree (R40.2 deploymentNode.render composition)
  // typedUnits (R40.11 slice-2): the node's deploymentRefs resolved to their REAL minted typed units
  // (units whose sourceRole ∈ this node's deploymentRef roles). The caller (which has the ScenarioIndex)
  // resolves them; this emitter maps each to a REAL ior row — NO synthetic 'depref:'+role. One row per
  // real typed unit; unresolvable → a fail-LOUD ⚠ row (never a silent synthetic).
  static buildRootedTree(sessions: SmSession[], nodeUnit: { model?: Record<string, unknown> } | null | undefined, nodeUuid: string, typedUnits: { uuid: string; name: string; m2Type?: string }[] = []): SmTreeRow[] {
    const sessionRows: SmTreeRow[] = sessions.map((s) => ({
      uuid: 'sess:' + s.name, type: 'otmuxSession', name: s.name, hasChildren: s.windows.length > 0,
      children: s.windows.map((w) => ({
        uuid: 'win:' + s.name + ':' + w.index, type: 'otmuxWindow', name: 'window ' + w.index, hasChildren: true,
        children: w.panes.map((p) => ({
          uuid: p.paneId, type: 'otmuxPane', name: p.label + (p.title ? '  —  ' + p.title : ''), hasChildren: false,
        })),
      })),
    }));
    const nm = nodeUnit?.model as any;
    if (nm && nm.kind === 'node') {
      // R40.11 slice-2: emit the REAL minted typed-unit iors (from Slice-1's units), NOT synthetic
      // 'depref:'+role — so the drawer resolves each row to a real unit (graph.get hit) instead of a miss.
      // If the node declares refs but none resolved to a typed unit → fail-LOUD ⚠ row (never revert to depref:).
      const declaredRefs = Array.isArray(nm.deploymentRefs) ? nm.deploymentRefs : [];
      const refRows: SmTreeRow[] = typedUnits.length
        ? typedUnits.map((u) => ({ uuid: u.uuid, type: 'deploymentUnit', name: u.name, hasChildren: false }))
        : (declaredRefs.length
            ? [{ uuid: 'depunit:unresolved', type: 'notice', name: `⚠ ${declaredRefs.length} deployment ref(s) unresolved to a typed unit`, hasChildren: false }]
            : []);
      return [{ uuid: String(nm.uuid), type: 'deploymentNode', name: String(nm.name), hasChildren: true, children: [...refRows, ...sessionRows] }];
    }
    console.warn(`[server-manager] WARN: WODA.prod deployment node ${nodeUuid} missing/not-a-node → tree DEGRADED to flat session list (fail-open, availability preserved).`);
    return [{ uuid: 'depnode:unavailable', type: 'notice', name: `⚠ WODA.prod deployment node unavailable (${nodeUuid.slice(0, 8)}) — showing flat session list`, hasChildren: sessionRows.length > 0, children: sessionRows }];
  }

  // R40.11 slice-2/3 WIRING + PATH-UNIFY: the ONE served composition for /api/server-manager/tree. Resolves the
  // node's declared deploymentRefs to the REAL slice-1 typed units (by sourceRole — a ref role may map to >1 unit,
  // e.g. ssh-service → the Service AND its configuredBy ConfigFile, the 1→2 split) and emits the rooted tree via
  // buildRootedTree. The SERVER route AND check-tree-emitter both call THIS → the gate tests what the server RUNS
  // (kills the armed-but-inert / gate-points-at-an-uncalled-fn blindness). NO synthetic 'depref:' anywhere.
  // [impl:uuid:792be0fd-a9c9-4951-95bc-30b091158f74] OtmuxBridge.buildServerManagerTree — R40.11 AC-2 crown resolver
  // (architect MINT-OWN 1edbe2868: R40.11's OWN emitter Impl, rides R40.6 buildTypedModel e009ace7 UPSTREAM, does
  // not own it). Gated by [test:uuid:e2b8f574…] (check-tree-emitter.ts, SERVED-path). Emits REAL typed-unit iors.
  static buildServerManagerTree(sessions: SmSession[], idx: UnitReader, nodeUuid: string): SmTreeRow[] {
    const nodeUnit = idx.get(nodeUuid);
    const nm = (nodeUnit?.model || {}) as Record<string, unknown>;
    const roles = new Set<string>((Array.isArray(nm.deploymentRefs) ? nm.deploymentRefs : []).map((d: any) => String(d.role)));
    const typedUnits: { uuid: string; name: string }[] = [];
    if (roles.size) {
      for (const key of idx.list()) {
        const u = idx.get(key);
        if (!u || u.ior !== 'ior:class:ModelElement') continue;
        const m = (u.model || {}) as Record<string, unknown>;
        if (m.sourceRole && roles.has(String(m.sourceRole))) typedUnits.push({ uuid: String(m.uuid), name: String(m.name) });
      }
    }
    return OtmuxBridge.buildRootedTree(sessions, nodeUnit, nodeUuid, typedUnits);
  }

  // R40.1 [impl marker pending req chain] resolveRcLink(paneId) — the SELECTED pane → its claude agent's claude.ai RC
  // deep link, resolved via the MEASURED bridge ~/.claude/sessions/<pid>.json.bridgeSessionId (NOT the .jsonl uuid /
  // registry sessionId — a different id-space that would 404). FAIL-CLOSED: no matching file / no bridgeSessionId →
  // { url: null, reason } (caller opens the RC surface with NO per-pane link + states the limit); NEVER synthesise a URL.
  // Join priority: pid (a session file whose claude pid is a DESCENDANT of pane_pid) → name (pane title agent@host).
  static async resolveRcLink(paneId: string): Promise<RcLink> {
    let panePid = 0, paneTitle = '';
    try {
      const r = await execFileAsync('tmux', ['display-message', '-p', '-t', paneId, '#{pane_pid}\t#{pane_title}'], { timeout: 5000 });
      const [p, t] = r.stdout.trim().split('\t'); panePid = parseInt(p, 10) || 0; paneTitle = (t || '').trim();
    } catch { return { url: null, reason: `pane ${paneId} not found (no tmux/pane)` }; }
    if (!panePid) return { url: null, reason: `no pane_pid for ${paneId}` };

    const dir = path.join(os.homedir(), '.claude', 'sessions');
    let sessions: Array<{ pid?: number; bridgeSessionId?: string; name?: string; sessionId?: string }> = [];
    try {
      sessions = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
        .map((f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')); } catch { return null; } })
        .filter((s): s is NonNullable<typeof s> => !!s);
    } catch { return { url: null, reason: 'no ~/.claude/sessions directory' }; }

    // pane_pid is the pane's shell; the claude process is a descendant — walk /proc PPid up to pane_pid (Linux).
    const isDescendantOfPane = (pid: number): boolean => {
      let cur = pid;
      for (let hops = 0; cur > 1 && hops < 24; hops++) {
        let ppid = 0;
        try { const st = fs.readFileSync(`/proc/${cur}/stat`, 'utf-8'); ppid = parseInt(st.slice(st.lastIndexOf(')') + 2).split(' ')[1], 10) || 0; } catch { return false; }
        if (ppid === panePid) return true;
        cur = ppid;
      }
      return false;
    };

    let match = sessions.find((s) => s.pid && isDescendantOfPane(Number(s.pid)));           // priority 1: pid (1 process = 1 file)
    if (!match && paneTitle) match = sessions.find((s) => s.name && String(s.name) === paneTitle); // priority 2: name (agent@host)

    if (!match) return { url: null, reason: `no ~/.claude/sessions/*.json matches pane ${paneId} (pid ${panePid}${paneTitle ? `, title ${paneTitle}` : ''})` };
    if (!match.bridgeSessionId) return { url: null, reason: `session for pane ${paneId} has no bridgeSessionId`, agent: match.name };
    return { url: `https://claude.ai/code/${match.bridgeSessionId}`, agent: match.name }; // ONLY from a measured bridge id
  }
}
