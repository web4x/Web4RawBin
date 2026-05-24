import QRCode from 'qrcode';

const STYLES = `
:host { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 900; display: flex; align-items: center; justify-content: center; }
.content { background: white; border-radius: 20px; padding: 24px; text-align: center; max-width: 320px; width: 90%; }
h3 { margin-bottom: 16px; font-size: 1.1rem; color: #333; }
canvas { display: block; margin: 0 auto 12px; }
.url { font-size: 0.7rem; opacity: 0.5; word-break: break-all; margin-bottom: 16px; color: #333; }
.actions { display: flex; gap: 8px; justify-content: center; }
button { padding: 6px 12px; border: none; border-radius: 10px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
button:active { transform: scale(0.97); }
.btn-share { background: #667eea; color: white; }
.btn-close { background: rgba(0,0,0,0.08); color: #333; }
`;

export class RbQrPopup extends HTMLElement {
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() { return ['url', 'title']; }
  attributeChangedCallback() { if (this.isConnected) this.render(); }
  connectedCallback() { this.render(); }

  show(url: string, title?: string): void {
    this.setAttribute('url', url);
    if (title) this.setAttribute('title', title);
    if (!this.parentNode) document.body.appendChild(this);
    this.render();
  }

  close(): void {
    this.remove();
  }

  private async render(): Promise<void> {
    const url = this.getAttribute('url') || '';
    const title = this.getAttribute('title') || 'Scan to Join';
    if (!url) return;

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="content">
        <h3>${title}</h3>
        <canvas id="qr"></canvas>
        <p class="url">${url}</p>
        <div class="actions">
          <button class="btn-share" id="share">Share Link</button>
          <button class="btn-close" id="close">Close</button>
        </div>
      </div>`;

    const canvas = this.shadow.getElementById('qr') as HTMLCanvasElement;
    if (canvas) {
      try { await QRCode.toCanvas(canvas, url, { width: 200, margin: 2 }); } catch {}
    }

    this.shadow.getElementById('close')?.addEventListener('click', () => this.close());
    this.shadow.getElementById('share')?.addEventListener('click', async () => {
      const shareBtn = this.shadow.getElementById('share')!;
      if (navigator.share) {
        try { await navigator.share({ title: 'RawBin', text: 'Join my room on RawBin', url }); } catch {}
      } else {
        try { await navigator.clipboard.writeText(url); } catch { prompt('Copy this link:', url); return; }
      }
      const orig = shareBtn.textContent;
      shareBtn.textContent = 'Copied!';
      setTimeout(() => { shareBtn.textContent = orig; }, 2000);
    });

    this.addEventListener('click', (e) => { if (e.target === this) this.close(); }, { once: true });
  }
}

customElements.define('rb-qr-popup', RbQrPopup);
