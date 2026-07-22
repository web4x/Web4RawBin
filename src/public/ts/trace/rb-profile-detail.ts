// R31.8c NODE-4 — RbProfileDetail: a first-class drawer detail-view for a GRANTED USER (reached from a Feature's
// allowedUsers child-node in the native itemView tree; tagMap profile→rb-profile-detail; REUSES the shared
// RbDetailDrawer, NO ProfileSheet overlay). uuid attr carries the context: 'feature:token' (opened under a Feature →
// REVOKE shown) or plain 'token'. Owner-gated, MASKED PII (data via the owner-gated searchUsers exact-match).
type Hit = { token: string; name: string; avatar?: string; uuid?: string; identifiers: string[] };
const esc = (s: string): string => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));

export class RbProfileDetail extends HTMLElement {
  static get observedAttributes() { return ['uuid']; }
  private key = '';

  connectedCallback(): void { void this.mount(); }
  attributeChangedCallback(): void { if (this.isConnected && (this.getAttribute('uuid') || '') !== this.key) void this.mount(); }

  // [impl:uuid:3f61d7d8-041b-45ae-a09e-b5bb0a5cafd9] RbProfileDetail.mount (Method e809f03a, off Class 50f45ac3) —
  // R31.8c NODE-4: render the granted-user profile — avatar + name + MASKED identifiers. In FeatureManager context
  // (uuid = 'featureUuid:token' → parent feature in scope) ALSO render a REVOKE control → POST /api/feature-manager
  // {action:'revoke', feature, token} (owner-gated, reuses the slice-b revokeFeature) → re-render/close. MASKED PII,
  // owner-gated read (data via searchUsers exact-match). revokeHandler / profile-render = private helpers.
  private async mount(): Promise<void> {
    const raw = this.getAttribute('uuid') || '';
    this.key = raw;
    // context: 'feature:token' (FeatureManager) vs plain 'token'
    const sep = raw.indexOf(':');
    const feature = sep >= 0 ? raw.slice(0, sep) : '';
    const token = sep >= 0 ? raw.slice(sep + 1) : raw;
    this.style.cssText = 'display:block;text-align:left;padding:12px 8px';
    this.innerHTML = '<div class="dv-loading">Loading…</div>';
    const hit = await this.fetchUser(token);
    this.innerHTML = '';
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:12px';
    head.innerHTML =
      (hit?.avatar ? `<img src="${esc(hit.avatar)}" alt="" style="width:48px;height:48px;border-radius:50%;object-fit:cover"/>` : `<div style="width:48px;height:48px;border-radius:50%;background:#30363d;display:flex;align-items:center;justify-content:center;font-size:1.2rem">👤</div>`)
      + `<div><div style="color:#fff;font-weight:600;font-size:1rem">${esc(hit?.name || '(unknown user)')}</div>`
      + `<div style="color:rgba(255,255,255,0.55);font:11px monospace;margin-top:2px">${esc((hit?.identifiers || []).join(' · ') || token.slice(0, 8) + '…')}</div></div>`;
    this.appendChild(head);
    if (feature) {
      const btn = document.createElement('button');
      btn.textContent = 'Revoke access';
      btn.style.cssText = 'background:#b62324;color:#fff;border:0;border-radius:6px;padding:7px 14px;cursor:pointer;font-size:0.85rem';
      btn.addEventListener('click', () => void this.revoke(feature, token));
      this.appendChild(btn);
    }
  }

  private async fetchUser(token: string): Promise<Hit | null> {
    try {
      const r = await fetch(`/api/feature-manager/users?q=${encodeURIComponent(token)}`, { credentials: 'same-origin' });
      if (!r.ok) return null;
      const d = (await r.json()) as { results?: Hit[] };
      return (d.results || []).find(h => h.token === token) || (d.results || [])[0] || null;
    } catch { return null; }
  }

  private async revoke(feature: string, token: string): Promise<void> {
    try {
      const r = await fetch('/api/feature-manager', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'revoke', feature, token }) });
      this.flash(r.ok ? 'Revoked ✓' : (r.status === 403 ? 'Forbidden (owner only)' : 'Failed (' + r.status + ')'), r.ok);
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
