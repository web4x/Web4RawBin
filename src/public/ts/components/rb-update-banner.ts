// [impl:uuid:18ebf760-c51b-4b67-9dcb-a2c2f5f3cfa3] T39 update banner
class RbUpdateBanner extends HTMLElement {
  private version: string = '';

  connectedCallback(): void {
    this.registerServiceWorker();
    this.checkForUpdate();
  }

  private registerServiceWorker(): void {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showBanner();
          }
        });
      });
    }).catch(() => {});

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      location.reload();
    });
  }

  private async checkForUpdate(): Promise<void> {
    try {
      const res = await fetch('/api/config');
      const config = await res.json();
      const cachedVersion = localStorage.getItem('rawbin-version');
      if (!cachedVersion) {
        localStorage.setItem('rawbin-version', config.version);
        return;
      }
      if (cachedVersion !== config.version) {
        this.version = config.version;
        this.showBanner(config.version);
      }
    } catch {}
  }

  private showBanner(version?: string): void {
    if (this.shadowRoot?.getElementById('banner')) return;

    const shadow = this.attachShadow?.({ mode: 'open' }) || this.shadowRoot;
    if (!shadow) return;

    const v = version || this.version;
    const label = v ? `v${v} available` : 'New version available';

    shadow.innerHTML = `
      <style>
        :host { display: block; position: fixed; top: 0; left: 0; right: 0; z-index: 2000; }
        .banner { background: #e74c3c; color: white; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 10px 16px; padding-top: calc(10px + env(safe-area-inset-top)); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.9rem; font-weight: 600; }
        button { background: white; color: #e74c3c; border: none; border-radius: 6px; padding: 6px 16px; font-size: 0.85rem; font-weight: 700; cursor: pointer; }
        button:active { opacity: 0.8; }
      </style>
      <div class="banner" id="banner">
        <span>${label}</span>
        <button id="update-now">Update Now</button>
      </div>`;

    shadow.getElementById('update-now')?.addEventListener('click', async () => {
      if (v) localStorage.setItem('rawbin-version', v);
      this.remove();
      const reg = await navigator.serviceWorker?.getRegistration?.();
      if (reg?.waiting) {
        reg.waiting.postMessage('SKIP_WAITING');
      } else {
        location.reload();
      }
    });
  }
}

customElements.define('rb-update-banner', RbUpdateBanner);
