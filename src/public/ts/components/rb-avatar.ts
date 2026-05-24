const AVATAR_CSS = `
:host { display: inline-block; cursor: pointer; }
.circle { border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: rgba(102,126,234,0.15); }
.circle img { width: 100%; height: 100%; object-fit: cover; }
.initial { color: #667eea; font-weight: 700; }
.overlay { position: fixed; inset: 0; z-index: 3000; background: rgba(0,0,0,0.92); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.overlay img { max-width: 90vw; max-height: 70vh; border-radius: 12px; object-fit: contain; touch-action: pinch-zoom; }
.overlay-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; padding: 16px 24px; padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
.btn-ov { padding: 10px 24px; border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.btn-upload { background: #667eea; color: white; }
.btn-close { background: rgba(255,255,255,0.15); color: white; }
`;

class RbAvatar extends HTMLElement {
  private shadow: ShadowRoot;
  private overlayEl: HTMLElement | null = null;

  static get observedAttributes() { return ['src', 'size', 'name', 'token']; }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void { this.render(); }
  attributeChangedCallback(): void { if (this.isConnected) this.render(); }

  private getSize(): number { return parseInt(this.getAttribute('size') || '40'); }
  private getSrc(): string { return this.getAttribute('src') || ''; }
  private getName(): string { return this.getAttribute('name') || '?'; }
  private getToken(): string { return this.getAttribute('token') || ''; }

  private render(): void {
    const size = this.getSize();
    const src = this.getSrc();
    const initial = this.getName()[0]?.toUpperCase() || '?';
    const fontSize = Math.max(10, Math.round(size * 0.4));

    this.shadow.innerHTML = `<style>${AVATAR_CSS}</style>
      <div class="circle" style="width:${size}px;height:${size}px">
        ${src ? `<img src="${src}" alt="${initial}" id="img">` : `<span class="initial" style="font-size:${fontSize}px">${initial}</span>`}
      </div>`;

    const img = this.shadow.getElementById('img') as HTMLImageElement;
    if (img) {
      img.addEventListener('error', () => {
        img.replaceWith(Object.assign(document.createElement('span'), {
          className: 'initial', textContent: initial,
          style: `font-size:${fontSize}px`,
        }));
      });
    }

    this.shadow.querySelector('.circle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openOverlay();
    });
  }

  private openOverlay(): void {
    if (this.overlayEl) return;
    const src = this.getSrc();
    const initial = this.getName()[0]?.toUpperCase() || '?';

    this.overlayEl = document.createElement('div');
    this.overlayEl.innerHTML = `<style>${AVATAR_CSS}</style>
      <div class="overlay" id="ov">
        ${src ? `<img src="${src}" alt="Avatar">` : `<div style="font-size:8rem;color:white">${initial}</div>`}
        <div class="overlay-bar">
          <label class="btn-ov btn-upload">Upload<input type="file" accept="image/*" id="ov-file" style="display:none"></label>
          <button class="btn-ov btn-close" id="ov-close">Close</button>
        </div>
      </div>`;

    document.body.appendChild(this.overlayEl);

    this.overlayEl.querySelector('#ov-close')?.addEventListener('click', () => this.closeOverlay());
    this.overlayEl.querySelector('#ov')?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'ov') this.closeOverlay();
    });

    const fileInput = this.overlayEl.querySelector('#ov-file') as HTMLInputElement;
    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (file.size > 500 * 1024) { alert('Max 500KB'); return; }
      if (!file.type.startsWith('image/')) { alert('Must be an image'); return; }

      const token = this.getToken() || localStorage.getItem('rawbin-player-id') || '';
      if (!token) return;

      const buf = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));

      try {
        const res = await fetch('/api/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerToken: token, data: base64, mimeType: file.type }),
        });
        const result = await res.json();
        if (result.ok && result.avatarUrl) {
          this.setAttribute('src', result.avatarUrl + '?t=' + Date.now());
          this.closeOverlay();
          this.dispatchEvent(new CustomEvent('rb-avatar-changed', { detail: { avatarUrl: result.avatarUrl }, bubbles: true, composed: true }));
        } else { alert(result.error || 'Upload failed'); }
      } catch { alert('Upload failed'); }
    });
  }

  private closeOverlay(): void {
    if (this.overlayEl) { this.overlayEl.remove(); this.overlayEl = null; }
  }
}

customElements.define('rb-avatar', RbAvatar);
export { RbAvatar };
