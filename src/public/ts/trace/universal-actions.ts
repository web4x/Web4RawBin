// R35.1 — universal, view-independent item-action provider + handler. Converts the 4 bespoke per-detail buttons
// (vcard / preview / new-tab / proxy) into universalActionBar actions so they flow through the ONE shared bar
// wherever the detail mounts (room / trace / model), not just in a per-view host.
import { downloadVCard } from '../vcard-download.js';
import { fillPreviewPane } from './content-preview.js';
import type { RbPreviewPane } from './rb-preview-pane.js';

type Action = { verb: string; label: string };
const VERBS = ['download-vcard', 'preview-file', 'open-newtab', 'proxy-preview'];

// TYPE-CONDITIONAL verb set (INV-E3 type-policy): file-verbs never leak onto a webitem, vcard only on member/user, etc.
function universalActionsFor(type: string): Action[] {
  const t = (type || '').toLowerCase();
  if (t === 'member' || t === 'user') return [{ verb: 'download-vcard', label: '📇 vCard' }];
  if (t === 'file') return [{ verb: 'preview-file', label: '👁 Preview' }, { verb: 'open-newtab', label: '↗ New tab' }];
  if (t === 'webitem') return [{ verb: 'proxy-preview', label: '⟳ Proxy preview' }];
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
