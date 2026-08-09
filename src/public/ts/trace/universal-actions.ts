// R35.1 — universal, view-independent item-action provider + handler. Converts the 4 bespoke per-detail buttons
// (vcard / preview / new-tab / proxy) into universalActionBar actions so they flow through the ONE shared bar
// wherever the detail mounts (room / trace / model), not just in a per-view host.
import { downloadVCard } from '../vcard-download.js';
import { fillPreviewPane } from './content-preview.js';
import type { RbPreviewPane } from './rb-preview-pane.js';

type Action = { verb: string; label: string };
const VERBS = ['download-vcard', 'preview-file', 'open-newtab', 'proxy-preview', 'qa-approve', 'qa-decline'];

// TYPE-CONDITIONAL verb set (INV-E3 type-policy): file-verbs never leak onto a webitem, vcard only on member/user, etc.
function universalActionsFor(type: string): Action[] {
  const t = (type || '').toLowerCase();
  if (t === 'member' || t === 'user') return [{ verb: 'download-vcard', label: '📇 vCard' }];
  if (t === 'file') return [{ verb: 'preview-file', label: '👁 Preview' }, { verb: 'open-newtab', label: '↗ New tab' }];
  if (t === 'webitem') return [{ verb: 'proxy-preview', label: '⟳ Proxy preview' }];
  // R40.10 — the owner's QA verdict control as ACTION UNITS on any task detail (NOT a bespoke button). We do NOT
  // client-gate on status: the SERVER is the sole authority for the Done-gate (approve 409s if not 'QA Review',
  // decline always mints a ChangeRequest) — a client status-check would be a second source of truth that can drift.
  // The 409/403 refusal is surfaced honestly by the handler; approve+decline ship TOGETHER (approve-only = prose again).
  if (t === 'task') return [{ verb: 'qa-approve', label: '✓ Approve' }, { verb: 'qa-decline', label: '✗ Decline' }];
  return [];
}

// [impl:uuid:b8f284c6-9cad-4865-adac-53321f4cf666] universalActions.registerUniversalActions (Method 2b03ee86, Class
// universalActions a9019609, off UC f9c241bf actionBar.convertLegacyButtons) — R35.1: self-register the ONE view-
// independent TYPE-CONDITIONAL provider + a shared rb-drawer-action handler on the drawer. Called by rb-detail-drawer
// (which loads on every page) → the verbs surface wherever a member/user/file/webitem detail mounts, composing with
// the A1 defaults + model's host-provider (INV-E3 host-policy vs type-policy, no fork). Handlers reproduce the OLD
// buttons' EXACT effect (INV-1): vcard→downloadVCard, preview→toggle the pane + SAME fillPreviewPane lazy-fill,
// new-tab→window.open(content url), proxy→#wi-frame src=/api/proxy. The detail's data-attrs/pane/frame are the
// ref-context (read from the drawer body). Idempotent (wired flag) — safe on every connectedCallback.
export function registerUniversalActions(drawer: HTMLElement & { registerActionProvider?: (fn: (type: string, ref: string) => Action[]) => void }): void {
  if ((registerUniversalActions as unknown as { _wired?: boolean })._wired) return;
  (registerUniversalActions as unknown as { _wired?: boolean })._wired = true;
  drawer.registerActionProvider?.((type) => universalActionsFor(type));
  document.addEventListener('rb-drawer-action', (e) => {
    const d = (e as CustomEvent<{ verb?: string; ref?: string }>).detail;
    const verb = d?.verb || '';
    if (!VERBS.includes(verb)) return; // host/model verbs handled by their own provider
    const ref = d?.ref || '';
    const uuid = ref.includes(':') ? ref.slice(ref.indexOf(':') + 1) : ref;
    if (verb === 'qa-approve' || verb === 'qa-decline') { handleTaskVerdict(drawer, verb, uuid); return; } // R40.10 owner QA verdict
    if (verb === 'download-vcard') { // was the rb-detail-view vCard button (fetch real playerToken, then download)
      void fetch(`/api/ior/ior:instance:${uuid}`).then((r) => (r.ok ? r.json() : null)).then((j) => {
        const m = (j?.unit?.model || {}) as Record<string, unknown>;
        void downloadVCard({ name: String(m.name || uuid), playerToken: String(m.playerToken || m.token || uuid), phone: m.phone as string, url: m.url as string, avatar: m.avatar as string });
      }).catch(() => void downloadVCard({ name: uuid, playerToken: uuid }));
      return;
    }
    // file / webitem verbs operate on the detail rendered in the drawer body; its data-attrs are the ref-context.
    const cv = drawer.querySelector('.cv-actions') as HTMLElement | null;
    if (verb === 'open-newtab') { const u = cv?.getAttribute('data-url') || ''; if (u) window.open(u, '_blank'); return; } // was .cv-newtab
    if (verb === 'preview-file') { // was .cv-preview-toggle — toggle the pane, lazy-fill via the SAME fillPreviewPane (INV-1)
      const pane = drawer.querySelector('rb-preview-pane.cv-preview-content') as RbPreviewPane | null;
      const resets = drawer.querySelectorAll('.cv-reset, .pz-reset'); // zoom-reset shows only while the pane is open (content-preview .cv-reset + rb-file-detail .pz-reset)
      if (!pane || !cv) return;
      const show = pane.style.display === 'none';
      pane.style.display = show ? '' : 'none';
      resets.forEach((r) => { (r as HTMLElement).style.display = show ? '' : 'none'; });
      if (show && !(pane as HTMLElement).dataset.filled) { fillPreviewPane(pane, cv.getAttribute('data-uuid') || uuid, cv.getAttribute('data-mime') || '', cv.getAttribute('data-name') || '', cv.getAttribute('data-token') || undefined); (pane as HTMLElement).dataset.filled = '1'; }
      return;
    }
    if (verb === 'proxy-preview') { // was the rb-webitem #wi-proxy button — reload the frame via the same-origin proxy
      const frame = drawer.querySelector('#wi-frame') as HTMLIFrameElement | null;
      if (!frame) return;
      void fetch(`/api/ior/ior:instance:${uuid}`).then((r) => (r.ok ? r.json() : null)).then((j) => {
        const wurl = String(((j?.unit?.model || {}) as Record<string, unknown>).url || '');
        if (wurl) frame.src = `/api/proxy?url=${encodeURIComponent(wurl)}`;
      }).catch(() => { /* frame keeps its direct src + the detail's own 3s auto-fallback */ });
      return;
    }
  });
}

// R40.10 — surface the QA-verdict outcome INSIDE the drawer detail, honestly (never a fake success, never a hidden
// refusal): a banner at the top of the task detail, colour-coded ok/warn/err, + reflect the server's new status on
// the badge. Reused by approve + decline. @390-legible (system-ui 13px, wrapping).
function surfaceVerdict(drawer: HTMLElement, message: string, kind: 'ok' | 'warn' | 'err'): void {
  const panel = drawer.querySelector('.drawer-panel-detail') as HTMLElement | null;
  if (!panel) return;
  let banner = panel.querySelector('.qa-verdict-result') as HTMLElement | null;
  if (!banner) { banner = document.createElement('div'); banner.className = 'qa-verdict-result'; panel.insertBefore(banner, panel.firstChild); }
  const bg = kind === 'ok' ? '#12331f' : kind === 'warn' ? '#3d2f00' : '#3d1414';
  const bd = kind === 'ok' ? '#2ea043' : kind === 'warn' ? '#d29922' : '#f85149';
  banner.setAttribute('style', `margin:0 0 10px;padding:9px 12px;border-radius:6px;background:${bg};border:1px solid ${bd};color:#e6edf3;font:13px system-ui;white-space:pre-wrap;line-height:1.4`);
  banner.textContent = message;
}

// R40.10 universalActions.handleTaskVerdict — [impl] marker PENDING req's R40.10 client-chain mint (placed on THIS fn).
// The owner taps ✓ Approve or ✗ Decline on a task detail → POST the owner-gated /api/task/<uuid>/{approve,decline}
// and surface the server's verdict verbatim. NO client status pre-gate (server is the sole Done-gate authority):
//   200 approve → status Done (approvedBy/approvedAt shown)   200 decline → ChangeRequest minted, status In Progress
//   403 → owner-only refusal, verdict NOT recorded            409 → no-evidence (not 'QA Review'), nothing changed
// Decline prompts for an optional CR reason; CANCEL aborts so an accidental tap can't mint a ChangeRequest.
function handleTaskVerdict(drawer: HTMLElement, verb: string, uuid: string): void {
  const action = verb === 'qa-approve' ? 'approve' : 'decline';
  let body: string | undefined;
  if (action === 'decline') {
    const reason = window.prompt('Decline — reason for the Change Request (optional):', '');
    if (reason === null) return; // cancelled → do NOT mint a ChangeRequest on an accidental tap
    body = JSON.stringify({ reason });
  }
  surfaceVerdict(drawer, action === 'approve' ? '⏳ Approving…' : '⏳ Declining…', 'warn');
  void fetch(`/api/task/${uuid}/${action}`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body })
    .then(async (r) => {
      let j: any = {}; try { j = await r.json(); } catch { /* non-JSON body */ }
      if (r.status === 200 && j.ok) {
        if (action === 'approve') surfaceVerdict(drawer, `✓ Approved — status now Done (by ${j.approvedBy} at ${j.approvedAt})`, 'ok');
        else surfaceVerdict(drawer, `✗ Declined — Change Request ${String(j.changeRequest || '').slice(0, 8)} created; status now In Progress`, 'ok');
        const badge = drawer.querySelector('.dv-status-badge') as HTMLElement | null;
        if (badge && j.status) badge.textContent = String(j.status);
      } else if (r.status === 403) {
        surfaceVerdict(drawer, '⚠ Not permitted — owner only (403). Your verdict was NOT recorded.', 'err');
      } else if (r.status === 409) {
        surfaceVerdict(drawer, `⚠ Cannot approve — ${String(j.detail || j.error || "not in 'QA Review'")}. Nothing was changed.`, 'warn');
      } else {
        surfaceVerdict(drawer, `⚠ ${action} failed (HTTP ${r.status}) — ${String(j.error || 'unknown')}. Nothing was changed.`, 'err');
      }
    })
    .catch((e) => surfaceVerdict(drawer, `⚠ ${action} request failed — ${String(e?.message || e)}. Nothing was changed.`, 'err'));
}
