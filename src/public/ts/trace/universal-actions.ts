// R35.1 — universal, view-independent item-action provider + handler. Converts the 4 bespoke per-detail buttons
// (vcard / preview / new-tab / proxy) into universalActionBar actions so they flow through the ONE shared bar
// wherever the detail mounts (room / trace / model), not just in a per-view host.
import { downloadVCard } from '../vcard-download.js';
import { fillPreviewPane } from './content-preview.js';
import type { RbPreviewPane } from './rb-preview-pane.js';
import { ViewBus } from './ViewBus.js'; // R40.17: notify the CurrentSprint singleton ref so the eager-lazy pin re-fetches live
// R40.37: the applicability declarations + the pure resolver live in the browser-dep-free action-applicability module
// (node-testable). This file SUPPLIES UNIVERSAL_DECLS to the shared drawer bar (which resolves via applicableActionsFor).
import { UNIVERSAL_DECLS, type ActionDecl } from './action-applicability.js';

const VERBS = ['download-vcard', 'preview-file', 'open-newtab', 'proxy-preview', 'qa-approve', 'qa-decline', 'pin-current', 'pin-next'];

// [impl:uuid:b8f284c6-9cad-4865-adac-53321f4cf666] universalActions.registerUniversalActions (Method 2b03ee86, Class
// universalActions a9019609, off UC f9c241bf actionBar.convertLegacyButtons) — R35.1: self-register the ONE view-
// independent TYPE-CONDITIONAL provider + a shared rb-drawer-action handler on the drawer. Called by rb-detail-drawer
// (which loads on every page) → the verbs surface wherever a member/user/file/webitem detail mounts, composing with
// the A1 defaults + model's host-provider (INV-E3 host-policy vs type-policy, no fork). Handlers reproduce the OLD
// buttons' EXACT effect (INV-1): vcard→downloadVCard, preview→toggle the pane + SAME fillPreviewPane lazy-fill,
// new-tab→window.open(content url), proxy→#wi-frame src=/api/proxy. The detail's data-attrs/pane/frame are the
// ref-context (read from the drawer body). Idempotent (wired flag) — safe on every connectedCallback.
export function registerUniversalActions(drawer: HTMLElement & { registerActionDecls?: (fn: () => ActionDecl[]) => void }): void {
  if ((registerUniversalActions as unknown as { _wired?: boolean })._wired) return;
  (registerUniversalActions as unknown as { _wired?: boolean })._wired = true;
  // R40.37: SUPPLY declarations (no gating here); the shared drawer bar resolves applicability ONCE via applicableActionsFor.
  drawer.registerActionDecls?.(() => UNIVERSAL_DECLS);
  document.addEventListener('rb-drawer-action', (e) => {
    const d = (e as CustomEvent<{ verb?: string; ref?: string }>).detail;
    const verb = d?.verb || '';
    if (!VERBS.includes(verb)) return; // host/model verbs handled by their own provider
    const ref = d?.ref || '';
    const uuid = ref.includes(':') ? ref.slice(ref.indexOf(':') + 1) : ref;
    if (verb === 'qa-approve' || verb === 'qa-decline') { handleTaskVerdict(drawer, verb, uuid); return; } // R40.10 owner QA verdict
    if (verb === 'pin-current' || verb === 'pin-next') { handlePinDesignate(drawer, verb, uuid); return; } // R40.17 owner pin designation
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

// R40.17 universalActions.handlePinDesignate — the pin-designate client action (the notify-add below IS the live-pin push).
// The owner taps 📌 Set current / 📋 Set next on a task detail → POST the owner-gated /api/current-sprint/designate.
// The server writes the designation INPUT-ONLY onto the CurrentSprint singleton (the task's sprint + the task uuid) and
// resolves the pin — it NEVER writes the task's status (reactivation is a separate checklist act). An owner designation
// is UNCONSTRAINED + LABELED: a Closed/QA-pending sprint resolves and is shown with its real status, never refused. We
// surface the server's honest label verbatim (incl. the status), and never fake success.
//   200 → designated, pin now shows "Sprint N — <status> (designated)"   403 → owner-only, not recorded   4xx → surfaced
// [impl:uuid:9073d5fd-701a-492c-a40b-a49846529266] universalActions.handlePinDesignate — R40.17 notify-add: on a 200 designate it calls ViewBus.notify(CurrentSprint ref) so the eager-lazy live-pin re-fetches (no Refresh @390).
function handlePinDesignate(drawer: HTMLElement, verb: string, uuid: string): void {
  const slot = verb === 'pin-current' ? 'current' : 'next';
  surfaceVerdict(drawer, slot === 'current' ? '⏳ Setting as current…' : '⏳ Setting as next…', 'warn');
  void fetch('/api/current-sprint/designate', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskUuid: uuid, slot }) })
    .then(async (r) => {
      let j: any = {}; try { j = await r.json(); } catch { /* non-JSON body */ }
      if (r.status === 200 && j.ok) {
        surfaceVerdict(drawer, `📌 Designated ${slot} — pin now: ${j.label || j.sprint || 'updated'} (task status unchanged)`, 'ok');
        ViewBus.notify('current-sprint-singleton-0000-000000000001'); // R40.17: the eager-lazy pin's targeted subscriber re-fetches the 2-node pin → sprint tree updates LIVE, no Refresh @390
      } else if (r.status === 403) {
        surfaceVerdict(drawer, '⚠ Not permitted — owner only (403). Designation NOT recorded.', 'err');
      } else {
        surfaceVerdict(drawer, `⚠ Designate failed (HTTP ${r.status}) — ${String(j.error || 'unknown')}. Nothing changed.`, 'err');
      }
    })
    .catch((e) => surfaceVerdict(drawer, `⚠ designate request failed — ${String(e?.message || e)}. Nothing changed.`, 'err'));
}
