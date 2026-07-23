// R31.8c round-3 (architect design-r31.8c-round3.md): the ONE canonical, data-driven full-profile viewer
// (<rb-profile-view>) used by BOTH /profile AND the FeatureManager drawer (rb-profile-detail) — the migration
// that proves it's the REAL viewer (/profile renders identical through it). Self-contained INLINE styles so it
// looks the same on any host page (no dependency on the /profile page CSS). Data-driven: renders exactly the
// fields present — a summary/masked feed shows fewer rows, a full real feed shows everything (avatar, Name, ID
// row=real profile uuid, Token, Secret Code, full Devices, Bug Reports). Round-3 dropped owner-side masking — the
// owner (root-of-trust) sees real data; non-owner is still 403'd at the endpoint, never reaching this viewer.
export type ProfileViewData = {
  name?: string;
  avatar?: string;
  profileUuid?: string;                 // round-3: the user's REAL User-unit uuid (ID row) — resolved server-side
  // FULL real-profile fields (own /profile, and the real granted-user feed):
  token?: string;
  secretCode?: string;
  connectedDeviceIds?: string[];        // device online-dot source
  devices?: { userAgent?: string; deviceId?: string; ip?: string; screenSize?: string; platform?: string; name?: string; connectionCount?: number; lastSeen?: number }[];
  bugReports?: { status?: string; date?: number; text?: string }[];
  // SUMMARY fields (kept for backward-compat with any summary feed until it carries full data):
  identifiers?: string[];
  deviceCount?: number;
  grantedFeatureCount?: number;
  bugReportCount?: number;
};

const esc = (s: string): string => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));

export class RbProfileView extends HTMLElement {
  private _data: ProfileViewData | null = null;
  set data(d: ProfileViewData | null) { this._data = d; this.render(); }
  get data(): ProfileViewData | null { return this._data; }
  connectedCallback(): void { if (this._data) this.render(); }

  // [impl:uuid:4e1c8a92-6b3d-4a57-8f21-9c0d3e5b7a16] RbProfileView.render (Method 422f22f8, Class 51bb30cb) —
  // R31.8c round-3: data-driven FULL real-profile render matching the /profile layout (avatar, Name, ID row, Token,
  // Secret Code, full Devices list, Bug Reports). Self-contained inline styles → identical on /profile and the FM
  // drawer (the shared-viewer migration = the proof). Renders only the fields present, so a summary feed degrades
  // gracefully and a full feed shows everything. No masking here — the owner-gated feed decides what data it carries.
  render(): void {
    const d = this._data;
    this.style.cssText = 'display:block;text-align:left';
    if (!d) { this.innerHTML = '<div class="dv-loading">Loading…</div>'; return; }
    const parts: string[] = [];
    const row = (label: string, val: string, valStyle = ''): string => `<div style="display:flex;gap:8px;padding:5px 0;font-size:0.82rem;border-bottom:1px solid rgba(128,128,128,0.12)"><span style="opacity:0.55;min-width:96px;flex-shrink:0">${esc(label)}</span><span style="word-break:break-all;${valStyle}">${esc(val)}</span></div>`;
    const heading = (t: string): string => `<div style="font-size:0.9rem;font-weight:600;margin:14px 0 6px;border-bottom:1px solid rgba(128,128,128,0.2);padding-bottom:4px">${esc(t)}</div>`;

    // avatar + name (centered, matching /profile's 80px)
    parts.push(`<div style="text-align:center;margin-bottom:12px">`
      + (d.avatar ? `<img src="${esc(d.avatar)}" alt="" style="width:80px;height:80px;border-radius:50%;object-fit:cover"/>` : `<div style="width:80px;height:80px;border-radius:50%;background:#30363d;display:inline-flex;align-items:center;justify-content:center;font-size:1.8rem">👤</div>`)
      + `<div style="font-weight:600;font-size:1.05rem;margin-top:6px">${esc(d.name || 'Unknown')}</div></div>`);

    if (d.profileUuid) parts.push(row('Profile UUID', d.profileUuid, 'font-size:0.72rem;opacity:0.8'));   // round-3: the REAL user uuid
    if (d.token) parts.push(row('Token', d.token, 'font-size:0.62rem;opacity:0.5'));
    if (d.identifiers && d.identifiers.length) parts.push(row('Identifiers', d.identifiers.join(' · ')));

    if (d.secretCode) parts.push(heading('Secret Code')
      + `<div style="text-align:center;font-size:1.8rem;font-weight:700;letter-spacing:6px;color:#667eea;padding:10px;background:rgba(102,126,234,0.1);border-radius:10px">${esc(d.secretCode)}</div>`);

    // Devices — FULL details (dot / short-type / deviceId[:8] / IP / screen·platform·conn / lastSeen), matching /profile
    if (d.devices && d.devices.length) {
      const cids = d.connectedDeviceIds || [];
      parts.push(heading('Devices (' + d.devices.length + ')'));
      for (const dv of d.devices) {
        const ua = String(dv.userAgent || '');
        const short = ua.includes('Mobile') ? 'Mobile' : ua.includes('Mac') ? 'Mac' : ua.includes('Windows') ? 'Windows' : ua.includes('Linux') ? 'Linux' : (dv.platform || dv.name || 'Browser');
        const online = cids.indexOf(String(dv.deviceId || '')) >= 0;
        const dot = `<span style="color:${online ? '#4CAF50' : '#f44336'}">●</span>`;
        const meta = 'font-size:0.72rem;opacity:0.5;margin-top:2px';
        parts.push(`<div style="background:rgba(102,126,234,0.06);border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:0.8rem">`
          + `${dot} <span style="font-weight:600">${esc(short)}</span> <span style="opacity:0.4">${esc((dv.deviceId || '').slice(0, 8) || 'legacy')}</span>`
          + `<div style="${meta}">IP: ${esc((dv.ip || 'unknown').replace('::ffff:', ''))}</div>`
          + `<div style="${meta}">${esc(String(dv.screenSize || ''))}${dv.platform ? ' · ' + esc(dv.platform) : ''}${dv.connectionCount ? ' · ' + dv.connectionCount + 'x connected' : ''}</div>`
          + (dv.lastSeen ? `<div style="${meta}">Last: ${esc(new Date(dv.lastSeen).toLocaleString())}</div>` : '')
          + `</div>`);
      }
    } else if (typeof d.deviceCount === 'number') {
      parts.push(row('Devices', String(d.deviceCount)));  // summary feed fallback
    }

    if (typeof d.grantedFeatureCount === 'number') parts.push(row('Feature grants', String(d.grantedFeatureCount)));

    // Bug Reports — status color / date / text, matching /profile
    if (d.bugReports && d.bugReports.length) {
      parts.push(heading('Bug Reports (' + d.bugReports.length + ')'));
      for (const b of d.bugReports) {
        const sc = b.status === 'FIXED' ? '#4CAF50' : b.status === 'IN PROGRESS' ? '#ff9800' : '#999';
        parts.push(`<div style="background:rgba(102,126,234,0.06);border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:0.8rem">`
          + `<span style="color:${sc};font-weight:600">${esc(String(b.status || ''))}</span> <span style="opacity:0.5;font-size:0.7rem">${b.date ? esc(new Date(b.date).toLocaleDateString()) : ''}</span>`
          + `<div style="font-size:0.72rem;opacity:0.5;margin-top:2px">${esc(String(b.text || ''))}</div></div>`);
      }
    } else if (typeof d.bugReportCount === 'number') {
      parts.push(row('Bug reports', String(d.bugReportCount)));  // summary feed fallback
    }

    this.innerHTML = parts.join('');
  }
}
customElements.define('rb-profile-view', RbProfileView);
