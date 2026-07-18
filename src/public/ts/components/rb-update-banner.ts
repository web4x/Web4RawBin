// [impl:uuid:18ebf760-c51b-4b67-9dcb-a2c2f5f3cfa3] T39 update banner
declare const __BUILD_VERSION__: string; // compiled in by build.mjs (define) = the version of THIS running bundle
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
      this.pollForWorkerUpdate(reg); // R30.14: keep re-checking sw.js while the app stays open → banner on deploy
    }).catch(() => {});

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      location.reload();
    });
  }

  // [impl:uuid:f1456992-163b-40ed-abb5-b5f2d4730dc6] ServiceWorker.pollForWorkerUpdate
  // R30.14 deploy-visibility: a left-open PWA never re-checks sw.js on its own, so a deploy stays invisible until
  // reopen (Tron's stale-bundle). Periodically — and on tab focus / visibility — call reg.update() to re-fetch sw.js;
  // a newer sw.js fires 'updatefound' → the EXISTING banner lights up (banner-first; no reload until the user taps).
  private pollForWorkerUpdate(reg: ServiceWorkerRegistration): void {
    const check = () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); };
    setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
  }

  // R30.14 network-first shell (B): CONTINUOUS, SW-independent version poll. Poll /api/config (no-cache) every 60s +
  // on focus/visibility, compare the SERVER version to __BUILD_VERSION__ (the version of THIS running bundle) — NOT a
  // drifting localStorage baseline. A deploy to a left-open tab is caught ≤60s → the one-click prompt (the reload then
  // lands fresh because the SW shell is network-first). Independent of the SW updatefound path (which stays secondary).
  private checkForUpdate(): void {
    const check = async () => {
      try {
        const config = await (await fetch('/api/config', { cache: 'no-store' })).json();
        if (config.version && config.version !== __BUILD_VERSION__) { this.version = config.version; this.showBanner(config.version); }
      } catch {}
    };
    void check();
    setInterval(() => void check(), 60_000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void check(); });
    window.addEventListener('focus', () => void check());
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
      // R30.14 one-click (C): swap the waiting SW if present, then reload. The network-first shell guarantees this
      // reload fetches the CURRENT html + bundle hashes → fresh app in a SINGLE click, no manual hard-reload ever.
      const reg = await navigator.serviceWorker?.getRegistration?.();
      if (reg?.waiting) reg.waiting.postMessage('SKIP_WAITING');
      location.reload();
    });
  }
}

customElements.define('rb-update-banner', RbUpdateBanner);
