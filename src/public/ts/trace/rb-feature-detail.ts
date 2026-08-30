// R31.8c FeatureManager user-selector — RbFeatureDetail: a first-class drawer detail-view for ONE Feature.
// R37.26-CONVERGENCE (Phase A, architect design 19c340d4f/f0999a5e1): NOW extends RbDetailBase — the render FUNNEL, the
// ONE model-source (graph ELSE /api/ior fetch), and the fail-LOUD renderUnresolved live in the base. This element
// implements ONLY its Feature DOM + the owner grant-surface via renderDetail(ctx). Deleted: its own connectedCallback/
// attributeChangedCallback funnel, its own fetch(/api/ior) unit-model source, and the SILENT 'Feature' default on fetch
// failure (a data-gap now shows the base's honest '⚠ unresolved', never a fake-named empty). The grant input + c2
// user-search/grant is EXTRA interactive behavior (architect supplemental boundary) — its listeners tear down via the
// base's unsub registry on disconnect.
type UserHit = { token: string; name: string; avatar?: string; uuid?: string; identifiers: string[] };
const esc = (s: string): string => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));
import { RbDetailBase, type DetailCtx } from './rb-detail-base.js'; // R37.24 inc2: the ONE detail primitive (funnel + one-source + fail-loud)

export class RbFeatureDetail extends RbDetailBase {
  private featureUuid = '';
  private input: HTMLInputElement | null = null;
  private dropdown: HTMLElement | null = null;
  private debounceTimer = 0;
  private hits: UserHit[] = [];
  private active = -1;
  private onKey: ((e: KeyboardEvent) => void) | null = null;

  // R37.24 inc2: the funnel + one-model-source + honest-empty-on-unresolved live in RbDetailBase. This element renders
  // ONLY its Feature DOM from the resolved ctx.model (name/icon/description) + the owner grant surface.
  // [impl:uuid:965e810c-f01d-4047-ae2b-9f6682084953] RbFeatureDetail.renderDetail (Method 29130d6e, off Class a085d2d1) — R31.8c NODE-3 (carried onto renderDetail — R37.26 convergence)
  protected renderDetail({ uuid, model }: DetailCtx): void {
    this.teardown(); // clear any prior grant-input listeners before a re-render (base already cleared unsubs)
    this.featureUuid = uuid;
    const m = model || {};
    const info = { name: String(m.name || 'Feature'), icon: String(m.icon || '🔑'), description: String(m.description || '') };
    this.style.cssText = 'display:block;text-align:left;padding:10px 6px';
    this.innerHTML = '';
    this.appendChild(this.renderFeatureInfo(info));
    this.appendChild(this.renderGrantInput());
    if (this.input) {
      this.input.addEventListener('input', () => this.userComplete());
      this.input.addEventListener('blur', () => setTimeout(() => this.closeDropdown(), 150)); // allow mousedown-select first
    }
    this.unsubs.push(() => this.teardown()); // base disconnectedCallback → clearSubs → tears down debounce/keys
  }

  private renderFeatureInfo(info: { name: string; icon: string; description: string }): HTMLElement {
    const h = document.createElement('div');
    h.innerHTML = `<h3 style="color:#fff;margin:0 0 4px;font-size:1rem">${esc(info.icon)} ${esc(info.name)}</h3>`
      + (info.description ? `<p style="color:rgba(255,255,255,0.6);font-size:0.8rem;margin:0 0 12px">${esc(info.description)}</p>` : '<div style="height:8px"></div>');
    return h;
  }

  private renderGrantInput(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative';
    const label = document.createElement('div');
    label.textContent = 'Grant access — search a user';
    label.style.cssText = 'color:rgba(255,255,255,0.7);font-size:0.75rem;margin-bottom:4px';
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'search name / phone / token…';
    this.input.setAttribute('autocomplete', 'off');
    this.input.style.cssText = 'width:100%;box-sizing:border-box;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:0.85rem';
    this.dropdown = document.createElement('div');
    this.dropdown.style.cssText = 'position:absolute;left:0;right:0;top:100%;margin-top:2px;background:#161b22;border:1px solid #30363d;border-radius:8px;max-height:240px;overflow:auto;z-index:20;display:none;box-shadow:0 6px 20px rgba(0,0,0,0.4)';
    wrap.append(label, this.input, this.dropdown);
    return wrap;
  }

  // [impl:uuid:9b54bc91-f8fc-4585-84bf-fb45cbab98e3] RbFeatureDetail.userComplete (Method ca286163, off Class a085d2d1) — R31.8c NODE-2 OOSH-c2 completion
  private userComplete(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    const q = (this.input?.value || '').trim();
    if (!q) { this.closeDropdown(); return; }
    this.debounceTimer = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/feature-manager/users?q=${encodeURIComponent(q)}`, { credentials: 'same-origin' });
        if (!r.ok) { this.closeDropdown(); return; }
        const d = (await r.json()) as { results?: UserHit[]; truncated?: boolean };
        this.hits = d.results || [];
        this.renderDropdown(!!d.truncated);
      } catch { this.closeDropdown(); }
    }, 220);
  }

  private renderDropdown(truncated: boolean): void {
    if (!this.dropdown) return;
    this.active = -1;
    if (!this.hits.length) {
      this.dropdown.innerHTML = '<div style="padding:8px;opacity:.6;font-size:0.8rem">no matches</div>';
    } else {
      this.dropdown.innerHTML = this.hits.map((h, i) =>
        `<div data-hit="${i}" style="padding:7px 9px;display:flex;gap:8px;align-items:center;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06)"><span style="flex:1;min-width:0"><b style="color:#e6edf3">${esc(h.name || '(no name)')}</b> <span style="opacity:.6;font:11px monospace">${esc((h.identifiers || []).join(' · '))}</span></span><span style="color:#238636;font-size:0.75rem">＋ grant</span></div>`).join('')
        + (truncated ? '<div style="padding:6px 9px;opacity:.5;font-size:0.72rem">…more — refine your search</div>' : '');
      this.dropdown.querySelectorAll('[data-hit]').forEach(el => el.addEventListener('mousedown', (ev: Event) => { ev.preventDefault(); this.select(Number((el as HTMLElement).getAttribute('data-hit'))); }));
    }
    this.dropdown.style.display = 'block';
    this.wireKeys();
  }

  private wireKeys(): void {
    if (this.onKey || !this.input) return;
    this.onKey = (e: KeyboardEvent): void => {
      if (this.dropdown?.style.display !== 'block') return;
      if (e.key === 'ArrowDown') { e.preventDefault(); this.move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (this.active >= 0) this.select(this.active); }
      else if (e.key === 'Escape') { e.preventDefault(); this.closeDropdown(); }
    };
    this.input.addEventListener('keydown', this.onKey);
  }

  private move(dir: number): void {
    if (!this.dropdown || !this.hits.length) return;
    this.active = (this.active + dir + this.hits.length) % this.hits.length;
    this.dropdown.querySelectorAll('[data-hit]').forEach((el, i) => { (el as HTMLElement).style.background = i === this.active ? 'rgba(102,126,234,0.18)' : ''; });
  }

  private select(i: number): void {
    const h = this.hits[i];
    if (!h) return;
    void this.applyGrant('grant', this.featureUuid, h.token);
    this.closeDropdown();
    if (this.input) this.input.value = '';
  }

  private closeDropdown(): void {
    if (this.dropdown) { this.dropdown.style.display = 'none'; this.dropdown.innerHTML = ''; }
    this.active = -1;
  }

  // [impl:uuid:cfde8f48-a004-4a0a-818e-7306c0d0c2dd] RbFeatureDetail.applyGrant (Method ee4143df, off Class a085d2d1)
  private async applyGrant(action: 'grant' | 'revoke', feature: string, token: string): Promise<void> {
    try {
      const r = await fetch('/api/feature-manager', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, feature, token }) });
      this.flash(r.ok ? (action === 'grant' ? 'Granted ✓' : 'Revoked ✓') : (r.status === 403 ? 'Forbidden (owner only)' : 'Failed (' + r.status + ')'), r.ok);
      if (r.ok) document.dispatchEvent(new CustomEvent('fm-tree-refresh')); // R31.8c round-2 item(b): grant success auto-refreshes the tree
    } catch { this.flash('Request failed', false); }
  }

  private teardown(): void {
    if (this.debounceTimer) { clearTimeout(this.debounceTimer); this.debounceTimer = 0; }
    if (this.onKey && this.input) this.input.removeEventListener('keydown', this.onKey);
    this.onKey = null;
  }

  private flash(msg: string, ok: boolean): void {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:${ok ? '#238636' : '#b62324'};color:#fff;padding:8px 14px;border-radius:8px;z-index:10000;font-size:0.85rem`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }
}
if (!customElements.get('rb-feature-detail')) customElements.define('rb-feature-detail', RbFeatureDetail);
