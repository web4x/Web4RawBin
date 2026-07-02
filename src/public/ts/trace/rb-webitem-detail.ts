/**
 * R27.7 UC d48b4dda (webItemDrawer.previewByType) — type-aware WebItem drawer.
 * previewable (http/https/pdf) → live preview (direct iframe, server-proxy fallback on X-Frame/CORS block) with
 * preview-FIRST layout + a reset-zoom OVERLAY inside the pane (R22.2/R25.x pan-zoom preserved); launcher schemes
 * (mailto/message/tel/calendar/sms/…) → NO preview + an Open card.
 * Regression fix (v0.7.8 mailto-routed-everything): a DECLARED scheme→kind MAP, not an if/else cascade — adding a
 * launcher scheme is an independent map entry and CANNOT capture the previewable branch (correct-by-construction).
 */
import { refUuid } from '../../../ts/shared/TraceModel.js';
import { scenarioBrowserLinkFromIor } from './detail-children.js'; // R26.2: universal 📄 Scenario link
import { RbPanZoom } from './pan-zoom.js'; // R22.2/R25.x pan-zoom (reset() drives the overlay)

function esc(s: string): string {
  return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

export type WebItemKind = 'previewable' | 'launcher';
const LAUNCHER_SCHEMES = ['mailto', 'message', 'tel', 'sms', 'calendar', 'webcal', 'facetime', 'maps', 'geo'];

/**
 * R27.7 (1) TYPE-ROUTER — declared scheme/content-type → kind. Independent entries (NOT fallthrough): http/https/pdf
 * → previewable; the launcher schemes → launcher; unknown → launcher (never auto-iframe an unknown scheme).
 */
export function kindOf(url: string, contentType?: string): WebItemKind {
  const scheme = (String(url).match(/^([a-z][a-z0-9+.-]*):/i)?.[1] || '').toLowerCase();
  if (scheme === 'http' || scheme === 'https') return 'previewable';
  if (/pdf/i.test(String(contentType || '')) || /\.pdf($|[?#])/i.test(url)) return 'previewable';
  if (LAUNCHER_SCHEMES.includes(scheme)) return 'launcher';
  return 'launcher';
}

const BTN = 'padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.8rem;cursor:pointer;border:none';

export class RbWebItemDetail extends HTMLElement {
  static get observedAttributes() { return ['ref', 'uuid']; }
  private pz?: RbPanZoom;
  connectedCallback(): void { this.render(); }
  attributeChangedCallback(): void { if (this.isConnected) this.render(); }

  // [impl:uuid:2598da09-7b89-4939-92f6-9e916d645e3c] R25.2 RbWebItemDetail.render — WebItem card (now type-routed)
  render(): void {
    const ref = this.getAttribute('ref') || '';
    const uuid = this.getAttribute('uuid') || refUuid(ref);
    if (!uuid) { this.innerHTML = '<div class="dv-empty">WebItem not found</div>'; return; }
    this.innerHTML = '<div class="dv-empty">Loading…</div>';
    fetch(`/api/ior/ior:instance:${uuid}`).then(r => r.json()).then(data => {
      this.previewByType((data.unit?.model || {}) as Record<string, unknown>, uuid);
    }).catch(() => { this.innerHTML = '<div class="dv-empty">Failed to load WebItem</div>'; });
  }

  // [impl:uuid:accc6a00] R27.7 RbWebItemDetail.previewByType — declared type-router → previewable vs launcher layout
  previewByType(m: Record<string, unknown>, uuid: string): void {
    const url = String(m.url || '');
    const kind = kindOf(url, String(m.contentType || ''));
    if (kind === 'launcher') this.renderLauncher(m, url, uuid);
    else this.renderPreviewable(m, url, uuid);
  }

  private srcLink(m: Record<string, unknown>, uuid: string): string {
    const childUuid = String((((m.children as string[]) || [])[0]) || '').replace('ior:instance:', '');
    const src = childUuid ? `<div style="margin-top:14px;font-size:0.8rem"><a href="/scenario?ior=${esc(childUuid)}" style="color:#42a5f5;text-decoration:none">📎 Source file</a></div>` : '';
    return `${src}${scenarioBrowserLinkFromIor(uuid)}`;
  }

  // previewable: [handle (drawer)] → action-row → PREVIEW pane (+reset-zoom overlay) → details BELOW (preview-first)
  private renderPreviewable(m: Record<string, unknown>, url: string, uuid: string): void {
    const name = String(m.name || url);
    this.innerHTML =
      `<div style="display:flex;gap:10px;padding:10px 14px 6px;flex-wrap:wrap">` +          // action-row, immediately below the drawer handle
        `<button id="wi-proxy" style="${BTN};background:#455a64;color:#fff">⟳ Preview via proxy</button>` +
        `<a href="${esc(url)}" target="_blank" rel="noopener" style="${BTN};background:#ff9800;color:#000">↗ Open in new tab</a>` +
      `</div>` +
      `<div id="wi-pane" style="position:relative;height:52vh;margin:0 10px;background:#0d0d0d;border-radius:10px;overflow:hidden">` +
        `<div id="wi-vp" style="width:100%;height:100%;overflow:hidden;touch-action:pan-y">` +
          `<div id="wi-content" style="width:100%;height:100%;transform-origin:0 0">` +
            `<iframe id="wi-frame" src="${esc(url)}" sandbox="allow-scripts allow-same-origin allow-popups" style="width:100%;height:100%;border:0;background:#fff" referrerpolicy="no-referrer"></iframe>` +
          `</div>` +
        `</div>` +
        `<button id="wi-reset" title="Reset zoom" style="position:absolute;top:8px;right:8px;z-index:5;${BTN};background:rgba(0,0,0,0.6);color:#fff;padding:6px 10px">⤢ Reset</button>` +  // OVERLAY inside pane (NOT an action row) — keeps RbPanZoom state
      `</div>` +
      `<div style="padding:14px 18px 24px">` +                                             // file details BELOW the preview
        `<h3 style="color:white;margin:4px 0;font-size:0.95rem">${esc(name)}</h3>` +
        `<div style="word-break:break-all;color:#a1887f;font-size:0.75rem">${esc(url)}</div>` +
        this.srcLink(m, uuid) +
      `</div>`;

    const vp = this.querySelector('#wi-vp') as HTMLElement, content = this.querySelector('#wi-content') as HTMLElement;
    const frame = this.querySelector('#wi-frame') as HTMLIFrameElement;
    if (vp && content) { this.pz = new RbPanZoom(vp, content); }
    (this.querySelector('#wi-reset') as HTMLElement)?.addEventListener('click', () => this.pz?.reset());

    // X-Frame/CORS block leaves a dead/blank frame → fall back to the SERVER PROXY (same-origin, sanitized → always renders).
    const toProxy = () => { if (frame) frame.src = `/api/proxy?url=${encodeURIComponent(url)}`; };
    let loaded = false; frame?.addEventListener('load', () => { loaded = true; });
    setTimeout(() => { if (!loaded) toProxy(); }, 3000);                                   // auto-fallback: never a permanently dead frame
    (this.querySelector('#wi-proxy') as HTMLElement)?.addEventListener('click', toProxy); // manual fallback
  }

  // launcher: no preview-pane; details + an Open card that hands off to the OS app
  private renderLauncher(m: Record<string, unknown>, url: string, uuid: string): void {
    const name = String(m.name || url);
    this.innerHTML =
      (url ? `<div style="padding:10px 14px 4px"><a href="${esc(url)}" target="_blank" rel="noopener" style="${BTN};background:#ff9800;color:#000;display:inline-block">↗ Open</a></div>` : '') +
      `<div style="padding:24px 20px;text-align:center">` +
        `<div style="font-size:3rem">${esc(String(m.badge || '🔗'))}</div>` +
        `<h3 style="color:white;margin:12px 0;font-size:0.95rem">${esc(name)}</h3>` +
        `<div style="word-break:break-all;color:#a1887f;font-size:0.75rem;margin-bottom:8px">${esc(url)}</div>` +
        this.srcLink(m, uuid) +
      `</div>`;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-webitem-detail')) {
  customElements.define('rb-webitem-detail', RbWebItemDetail);
}
