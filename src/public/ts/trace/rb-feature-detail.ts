// R31.8b FeatureManager VIEW — a first-class drawer detail-view (PARALLEL to rb-terminal-detail), reached via the
// STANDARD selection path (selectionModel.select('feature:<uuid>') → selection-changed → drawer renderDetailForRef →
// tagMap feature→rb-feature-manager-detail). REUSES the shared RbDetailDrawer (NO fork). Lists every Feature + its
// members, with an owner-only grant/revoke UI. VIEW read = membership (GET /api/feature-manager, cookie-gated);
// grant/revoke WRITES = hardcoded owner (POST /api/feature-manager → resolveOwner via the sm_session cookie).
type Feature = { uuid: string; name: string; icon: string; allowedUsers: string[] };
const esc = (s: string): string => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));

export class RbFeatureManagerDetail extends HTMLElement {
  static get observedAttributes() { return ['uuid']; }
  connectedCallback(): void { void this.mount(); }
  attributeChangedCallback(): void { if (this.isConnected) void this.mount(); }

  // [impl:uuid:90d15a35-6f91-41a1-bce4-75129ba7d13e] RbFeatureManagerDetail.mount (Method b7d6ca6a, off Class a085d2d1)
  // — connectedCallback→GET /api/feature-manager (membership-gated) → render each Feature + its allowedUsers (each with
  // a revoke ✕) + a grant-token input per feature. CLIENT counterpart of the server FeatureManager write path.
  private async mount(): Promise<void> {
    this.style.cssText = 'display:block;text-align:left;padding:8px 4px;max-height:70vh;overflow:auto';
    this.innerHTML = '<div class="dv-loading">Loading features…</div>';
    let features: Feature[] = [];
    try {
      const r = await fetch('/api/feature-manager', { credentials: 'same-origin' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      features = (await r.json()).features || [];
    } catch { this.innerHTML = '<div class="dv-empty">Failed to load features</div>'; return; }
    this.innerHTML = '<h3 style="color:#fff;margin:0 0 10px;font-size:0.95rem">Feature Manager</h3>';
    for (const f of features) {
      const card = document.createElement('div');
      card.style.cssText = 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;margin-bottom:10px';
      const users = (f.allowedUsers || []).length
        ? f.allowedUsers.map(u => `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(102,126,234,0.12);border-radius:8px;padding:3px 6px;font:12px monospace;color:#c9d1d9">${esc(u.slice(0, 8))}<button data-revoke="${esc(f.uuid)}" data-token="${esc(u)}" title="revoke" style="background:none;border:0;color:#f85149;cursor:pointer;padding:0 2px">✕</button></span>`).join(' ')
        : '<em style="opacity:.6">no members</em>';
      card.innerHTML = `<div style="font-weight:600;color:#e6edf3;margin-bottom:6px">${esc(f.icon || '')} ${esc(f.name)}</div>`
        + `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">${users}</div>`
        + `<div style="display:flex;gap:6px"><input data-grant-input="${esc(f.uuid)}" placeholder="player token to grant" style="flex:1;min-width:0;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;padding:5px 8px;font:12px monospace"/><button data-grant="${esc(f.uuid)}" style="background:#238636;color:#fff;border:0;border-radius:6px;padding:5px 12px;cursor:pointer">Grant</button></div>`;
      this.appendChild(card);
    }
    this.querySelectorAll('[data-grant]').forEach(b => b.addEventListener('click', () => {
      const fu = b.getAttribute('data-grant') || '';
      const inp = this.querySelector(`[data-grant-input="${fu}"]`) as HTMLInputElement | null;
      const tok = inp?.value.trim();
      if (fu && tok) void this.applyGrant('grant', fu, tok);
    }));
    this.querySelectorAll('[data-revoke]').forEach(b => b.addEventListener('click', () => {
      const fu = b.getAttribute('data-revoke') || '';
      const tok = b.getAttribute('data-token') || '';
      if (fu && tok) void this.applyGrant('revoke', fu, tok);
    }));
  }

  // [impl:uuid:cfde8f48-a004-4a0a-818e-7306c0d0c2dd] RbFeatureManagerDetail.applyGrant (Method ee4143df, off Class
  // a085d2d1) — POST /api/feature-manager {action,feature,token} (owner-gated root-of-trust; auth via the sm_session
  // cookie, credentials:same-origin) then re-render. Non-owner → 403 (write is hardcoded-owner, not membership).
  private async applyGrant(action: 'grant' | 'revoke', feature: string, token: string): Promise<void> {
    try {
      const r = await fetch('/api/feature-manager', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, feature, token }) });
      if (!r.ok) { this.flash(r.status === 403 ? 'Forbidden (owner only)' : 'Failed (' + r.status + ')'); return; }
    } catch { this.flash('Request failed'); return; }
    void this.mount(); // re-render from the authoritative server state
  }

  private flash(msg: string): void {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#b62324;color:#fff;padding:8px 14px;border-radius:8px;z-index:10000;font-size:0.85rem';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
}
customElements.define('rb-feature-manager-detail', RbFeatureManagerDetail);
