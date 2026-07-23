// R31.8c NODE-4 / round-2 — RbProfileDetail: the drawer detail-view for a GRANTED USER (reached from a Feature's
// allowedUsers child-node; tagMap profile→rb-profile-detail; REUSES the shared RbDetailDrawer). uuid attr =
// 'featureUuid:opaqueUserId' (FeatureManager → REVOKE shown) or plain 'token'. Round-2: the hand-built stub is
// RETIRED — layout = [grab-bar] → [Revoke] → [<rb-profile-view> fed the enriched MASKED profile] (items 2+3).
import './rb-profile-view.js';
import type { ProfileViewData } from './rb-profile-view.js';

export class RbProfileDetail extends HTMLElement {
  static get observedAttributes() { return ['uuid']; }
  private key = '';

  connectedCallback(): void { void this.mount(); }
  attributeChangedCallback(): void { if (this.isConnected && (this.getAttribute('uuid') || '') !== this.key) void this.mount(); }

  // [impl:uuid:3f61d7d8-041b-45ae-a09e-b5bb0a5cafd9] RbProfileDetail.mount (Method e809f03a, off Class 50f45ac3) —
  // R31.8c round-2 (items 2+3): render the granted-user profile via the SHARED <rb-profile-view> (masking-aware full
  // viewer) fed the enriched MASKED profile from the owner-gated GET /api/feature-manager/granted-user (grantedUserProfile).
  // Layout: Revoke button FIRST (directly under the drawer grab-bar), viewer BELOW. No token ever reaches the client (INV-F7).
  private async mount(): Promise<void> {
    const raw = this.getAttribute('uuid') || '';
    this.key = raw;
    const sep = raw.indexOf(':');                 // 'featureUuid:opaqueUserId' (FM context) vs plain 'token'
    const feature = sep >= 0 ? raw.slice(0, sep) : '';
    const id = sep >= 0 ? raw.slice(sep + 1) : raw;
    this.style.cssText = 'display:block;text-align:left;padding:12px 8px';
    this.innerHTML = '<div class="dv-loading">Loading…</div>';
    const data = feature ? await this.resolveGranted(feature, id) : await this.fetchUser(id);
    this.innerHTML = '';
    if (feature) { // Revoke FIRST — directly under the grab-bar (item 3), not buried below the viewer
      const btn = document.createElement('button');
      btn.textContent = 'Revoke access';
      btn.style.cssText = 'background:#b62324;color:#fff;border:0;border-radius:6px;padding:7px 14px;cursor:pointer;font-size:0.85rem;margin-bottom:12px';
      btn.addEventListener('click', () => void this.revoke(feature, id));
      this.appendChild(btn);
    }
    const view = document.createElement('rb-profile-view') as HTMLElement & { data: ProfileViewData | null };
    view.data = data;                              // masking-aware: renders only present (masked) fields → no token/secret
    this.appendChild(view);
  }

  // R31.8c: resolve a granted user's MASKED FULL profile server-side by opaque id (owner-gated grantedUserProfile).
  // No token reaches the client — masked display only (INV-F7). The response shape IS ProfileViewData.
  private async resolveGranted(feature: string, id: string): Promise<ProfileViewData | null> {
    try {
      const r = await fetch(`/api/feature-manager/granted-user?feature=${encodeURIComponent(feature)}&id=${encodeURIComponent(id)}`, { credentials: 'same-origin' });
      if (!r.ok) return null;
      return (await r.json()) as ProfileViewData;
    } catch { return null; }
  }

  private async fetchUser(token: string): Promise<ProfileViewData | null> {
    try {
      const r = await fetch(`/api/feature-manager/users?q=${encodeURIComponent(token)}`, { credentials: 'same-origin' });
      if (!r.ok) return null;
      const d = (await r.json()) as { results?: { token: string; name: string; avatar?: string; identifiers: string[] }[] };
      const h = (d.results || []).find(x => x.token === token) || (d.results || [])[0];
      return h ? { name: h.name, avatar: h.avatar, identifiers: h.identifiers } : null;
    } catch { return null; }
  }

  private async revoke(feature: string, id: string): Promise<void> {
    try {
      const r = await fetch('/api/feature-manager', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'revoke', feature, token: id }) });
      this.flash(r.ok ? 'Revoked ✓' : (r.status === 403 ? 'Forbidden (owner only)' : 'Failed (' + r.status + ')'), r.ok);
      if (r.ok) document.dispatchEvent(new CustomEvent('fm-tree-refresh')); // R31.8c round-2 item(b): auto-refresh the FM tree (revoked user disappears)
    } catch { this.flash('Request failed', false); }
  }

  private flash(msg: string, ok: boolean): void {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:${ok ? '#238636' : '#b62324'};color:#fff;padding:8px 14px;border-radius:8px;z-index:10000;font-size:0.85rem`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }
}
customElements.define('rb-profile-detail', RbProfileDetail);
