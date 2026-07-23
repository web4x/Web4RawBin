// R31.8c round-2 (architect design-r31.8c-round2.md): the ONE canonical, data-driven, MASKING-AWARE full-profile
// viewer (<rb-profile-view>). Renders ONLY the fields present in its `data`, so a masked granted-user feed
// (FeatureManager.grantedUserProfile) omits token/secretCode BY CONSTRUCTION (INV-F7) — the viewer cannot leak what
// the feed doesn't carry. FM drawer (rb-profile-detail) is the FIRST caller; /profile adopts it as a fast-follow.
export type ProfileViewData = {
  name?: string;
  avatar?: string;                     // opaque url for granted-users (INV-F7), real for own-profile
  identifiers?: string[];              // already masked by the server for granted-users
  deviceCount?: number;
  devices?: { platform?: string; name?: string }[];
  grantedFeatureCount?: number;
  bugReportCount?: number;
  token?: string;                      // own-profile ONLY; a masked feed omits it → never rendered
  secretCode?: string;                 // own-profile ONLY
};

const esc = (s: string): string => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));

export class RbProfileView extends HTMLElement {
  private _data: ProfileViewData | null = null;
  set data(d: ProfileViewData | null) { this._data = d; this.render(); }
  get data(): ProfileViewData | null { return this._data; }
  connectedCallback(): void { if (this._data) this.render(); }

  // [impl:uuid:4e1c8a92-6b3d-4a57-8f21-9c0d3e5b7a16] RbProfileView.render (Method 422f22f8, Class 51bb30cb) —
  // R31.8c round-2: data-driven masking-aware full-profile render. Emits a section ONLY when its field(s) are present,
  // so a masked granted-user feed shows name/identifiers/devices/grants/bug-reports but NEVER token/secretCode
  // (INV-F7 by construction). THE shared viewer — no drawer-only fork; /profile adopts it (fast-follow AC).
  render(): void {
    const d = this._data;
    this.style.cssText = 'display:block;text-align:left';
    if (!d) { this.innerHTML = '<div class="dv-loading">Loading…</div>'; return; }
    const row = (label: string, val: string): string => `<div style="display:flex;gap:8px;padding:3px 0;font-size:0.8rem"><span style="color:rgba(255,255,255,0.5);min-width:104px;flex-shrink:0">${esc(label)}</span><span style="color:#e6edf3;word-break:break-all">${esc(val)}</span></div>`;
    const parts: string[] = [];
    parts.push(`<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">`
      + (d.avatar ? `<img src="${esc(d.avatar)}" alt="" style="width:48px;height:48px;border-radius:50%;object-fit:cover"/>` : `<div style="width:48px;height:48px;border-radius:50%;background:#30363d;display:flex;align-items:center;justify-content:center;font-size:1.2rem">👤</div>`)
      + `<div style="color:#fff;font-weight:600;font-size:1rem">${esc(d.name || '(unknown user)')}</div></div>`);
    if (d.identifiers && d.identifiers.length) parts.push(row('Identifiers', d.identifiers.join(' · ')));
    if (typeof d.deviceCount === 'number') parts.push(row('Devices', String(d.deviceCount) + (d.devices && d.devices.length ? ' — ' + d.devices.map(x => x.platform || x.name || '?').join(', ') : '')));
    if (typeof d.grantedFeatureCount === 'number') parts.push(row('Feature grants', String(d.grantedFeatureCount)));
    if (typeof d.bugReportCount === 'number') parts.push(row('Bug reports', String(d.bugReportCount)));
    if (d.token) parts.push(row('Token', d.token));            // own-profile only — a masked feed has no token → not shown
    if (d.secretCode) parts.push(row('Secret code', d.secretCode));
    this.innerHTML = parts.join('');
  }
}
customElements.define('rb-profile-view', RbProfileView);
