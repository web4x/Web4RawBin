const AVATAR_CSS = `
:host { display: inline-block; cursor: pointer; }
.circle { border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: rgba(102,126,234,0.15); }
.circle img { width: 100%; height: 100%; object-fit: cover; }
.initial { color: #667eea; font-weight: 700; }
.overlay { position: fixed; inset: 0; z-index: 3000; background: rgba(0,0,0,0.92); display: flex; flex-direction: column; align-items: center; justify-content: center; touch-action: none; }
.overlay img { max-width: 90vw; max-height: 70vh; border-radius: 12px; object-fit: contain; will-change: transform; }
.overlay-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
.btn-ov { padding: 10px 24px; border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.btn-upload { background: #667eea; color: white; }
.btn-crop { background: #ff9800; color: white; }
.btn-close { background: rgba(255,255,255,0.15); color: white; }
`;

function pinchDist(t: TouchList): number {
  const dx = t[0].clientX - t[1].clientX;
  const dy = t[0].clientY - t[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

class RbAvatar extends HTMLElement {
  private shadow: ShadowRoot;
  private overlayEl: HTMLElement | null = null;
  private scale = 1; private tx = 0; private ty = 0;

  static get observedAttributes() { return ['src', 'size', 'name', 'token', 'crop']; }

  private boundRefresh: ((e: Event) => void) | null = null;

  constructor() { super(); this.shadow = this.attachShadow({ mode: 'open' }); }

  connectedCallback(): void {
    this.render();
    this.boundRefresh = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.token && d.token === this.getToken()) {
        if (d.url) this.setAttribute('src', d.url + '?t=' + Date.now());
        if (d.crop !== undefined) this.setAttribute('crop', JSON.stringify(d.crop));
      }
    };
    window.addEventListener('rb-avatar-updated', this.boundRefresh);
  }

  disconnectedCallback(): void {
    if (this.boundRefresh) window.removeEventListener('rb-avatar-updated', this.boundRefresh);
  }

  attributeChangedCallback(): void { if (this.isConnected) this.render(); }

  private getSize(): number { return parseInt(this.getAttribute('size') || '40'); }
  private getSrc(): string { return this.getAttribute('src') || ''; }
  private getName(): string { return this.getAttribute('name') || '?'; }
  private getToken(): string { return this.getAttribute('token') || ''; }
  private getCrop(): { scale: number; x: number; y: number } | null {
    try { const c = JSON.parse(this.getAttribute('crop') || ''); return c?.scale ? c : null; } catch { return null; }
  }

  private render(): void {
    const size = this.getSize();
    const src = this.getSrc();
    const initial = this.getName()[0]?.toUpperCase() || '?';
    const fontSize = Math.max(10, Math.round(size * 0.4));
    const crop = this.getCrop();
    const cropStyle = crop ? `transform:scale(${crop.scale}) translate(${crop.x * size}px,${crop.y * size}px)` : '';

    this.shadow.innerHTML = `<style>${AVATAR_CSS}</style>
      <div class="circle" style="width:${size}px;height:${size}px">
        ${src ? `<img src="${src}" alt="${initial}" id="img" style="${cropStyle}">` : `<span class="initial" style="font-size:${fontSize}px">${initial}</span>`}
      </div>`;

    const img = this.shadow.getElementById('img') as HTMLImageElement;
    if (img) img.addEventListener('error', () => {
      img.replaceWith(Object.assign(document.createElement('span'), { className: 'initial', textContent: initial, style: `font-size:${fontSize}px` }));
    });
    this.shadow.querySelector('.circle')?.addEventListener('click', (e) => { e.stopPropagation(); this.openOverlay(); });
  }

  private openOverlay(): void {
    if (this.overlayEl) return;
    const src = this.getSrc();
    const initial = this.getName()[0]?.toUpperCase() || '?';
    this.scale = 1; this.tx = 0; this.ty = 0;

    this.overlayEl = document.createElement('div');
    this.overlayEl.innerHTML = `<style>${AVATAR_CSS}</style>
      <div class="overlay" id="ov">
        ${src ? `<img src="${src}" alt="Avatar" id="ov-img">` : `<div style="font-size:8rem;color:white">${initial}</div>`}
        <div class="overlay-bar">
          <label class="btn-ov btn-upload">Upload<input type="file" accept="image/*" id="ov-file" style="display:none"></label>
          <button class="btn-ov btn-crop" id="ov-crop">Crop</button>
          <button class="btn-ov btn-close" id="ov-close">Close</button>
        </div>
      </div>`;
    document.body.appendChild(this.overlayEl);

    this.overlayEl.querySelector('#ov-close')?.addEventListener('click', () => this.closeOverlay());
    this.overlayEl.querySelector('#ov')?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'ov') this.closeOverlay();
    });

    // JS pinch-zoom + pan
    const ovImg = this.overlayEl.querySelector('#ov-img') as HTMLImageElement;
    if (ovImg) {
      let startDist = 0, startScale = 1, startX = 0, startY = 0, startTx = 0, startTy = 0;
      const apply = () => { ovImg.style.transform = `scale(${this.scale}) translate(${this.tx}px,${this.ty}px)`; };

      ovImg.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          startDist = pinchDist(e.touches); startScale = this.scale;
        } else if (e.touches.length === 1) {
          startX = e.touches[0].clientX; startY = e.touches[0].clientY;
          startTx = this.tx; startTy = this.ty;
        }
      }, { passive: true });

      ovImg.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
          const d = pinchDist(e.touches);
          this.scale = Math.max(0.5, Math.min(5, startScale * (d / startDist)));
          apply();
        } else if (e.touches.length === 1) {
          this.tx = startTx + (e.touches[0].clientX - startX) / this.scale;
          this.ty = startTy + (e.touches[0].clientY - startY) / this.scale;
          apply();
        }
      }, { passive: true });

      // Mouse wheel zoom for desktop
      ovImg.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.scale = Math.max(0.5, Math.min(5, this.scale * (e.deltaY < 0 ? 1.1 : 0.9)));
        apply();
      });
    }

    // Crop button
    this.overlayEl.querySelector('#ov-crop')?.addEventListener('click', async () => {
      const token = this.getToken() || localStorage.getItem('rawbin-player-id') || '';
      if (!token) return;
      const ovImg = this.overlayEl?.querySelector('#ov-img') as HTMLImageElement;
      const imgW = ovImg?.offsetWidth || 300;
      const imgH = ovImg?.offsetHeight || 300;
      const crop = { scale: Math.round(this.scale * 100) / 100, x: Math.round((this.tx / imgW) * 1000) / 1000, y: Math.round((this.ty / imgH) * 1000) / 1000 };
      try {
        const ws = (window as any).__rawbinClient;
        if (ws) {
          ws.send({ type: 'UPDATE_PROFILE', avatarCrop: crop });
          this.setAttribute('crop', JSON.stringify(crop));
          this.closeOverlay();
          window.dispatchEvent(new CustomEvent('rb-avatar-updated', { detail: { token, crop } }));
        }
      } catch {}
    });

    // Upload
    const fileInput = this.overlayEl.querySelector('#ov-file') as HTMLInputElement;
    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file || !file.type.startsWith('image/')) { if (file) alert('Must be an image'); return; }
      const token = this.getToken() || localStorage.getItem('rawbin-player-id') || '';
      if (!token) return;
      const buf = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      try {
        const res = await fetch('/api/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerToken: token, data: base64, mimeType: file.type }) });
        const result = await res.json();
        if (result.ok && result.avatarUrl) {
          const tk = this.getToken() || localStorage.getItem('rawbin-player-id') || '';
          this.setAttribute('src', result.avatarUrl + '?t=' + Date.now());
          this.closeOverlay();
          this.dispatchEvent(new CustomEvent('rb-avatar-changed', { detail: { avatarUrl: result.avatarUrl }, bubbles: true, composed: true }));
          window.dispatchEvent(new CustomEvent('rb-avatar-updated', { detail: { token: tk, url: result.avatarUrl } }));
        } else { alert(result.error || 'Upload failed'); }
      } catch { alert('Upload failed'); }
    });
  }

  private closeOverlay(): void {
    if (this.overlayEl) { this.overlayEl.remove(); this.overlayEl = null; }
    this.scale = 1; this.tx = 0; this.ty = 0;
  }
}

customElements.define('rb-avatar', RbAvatar);
export { RbAvatar };
