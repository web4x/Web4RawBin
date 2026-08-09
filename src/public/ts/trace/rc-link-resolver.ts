/**
 * R40.1 — client-side per-pane RC-link resolver (chain 9bbfd7437). Fronts the OWNER-GATED server endpoint
 * GET /api/server-manager/rc, which does the real resolution (pane → pane_pid → descendant claude pid →
 * ~/.claude/sessions/<pid>.json → bridgeSessionId → https://claude.ai/code/<bridgeSessionId>). The filesystem/
 * /proc/tmux work is necessarily server-side; this client method is the caller. FAIL-CLOSED end-to-end:
 * { url: null, reason } when there is no measured bridge — the caller shows the limit, NEVER a synthesised URL.
 * The returned link is the plain claude.ai UNIVERSAL link (app-if-installed-else-web; no custom scheme invented).
 */
export interface RcLink { url: string | null; reason?: string; agent?: string; }

export class RcLinkResolver {
  // [impl:uuid:45853b02-340f-409f-8501-449a119c8ca4] RcLinkResolver.resolveRcLink — the SELECTED pane → its agent's
  // claude.ai RC universal link via the owner-gated endpoint; url=null is fail-closed, never a fabricated session_ URL.
  static async resolveRcLink(paneId: string): Promise<RcLink> {
    try {
      const r = await fetch('/api/server-manager/rc?pane=' + encodeURIComponent(paneId), { headers: { 'Cache-Control': 'no-store' } });
      if (!r.ok) return { url: null, reason: 'RC endpoint returned ' + r.status };
      const j = await r.json();
      return { url: j && j.url ? String(j.url) : null, reason: j && j.reason ? String(j.reason) : undefined, agent: j && j.agent ? String(j.agent) : undefined };
    } catch { return { url: null, reason: 'RC lookup failed (network)' }; }
  }
}
