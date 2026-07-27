// [impl:uuid:39074a59-864f-4947-ac7b-0457bbbe172b] T40 header
// [impl:uuid:92f4ced4-fab4-4b90-bd1f-37621eb8cd54] R19.94 showBuildVersion
declare const __BUILD_VERSION__: string;
const BUILD_VER = typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : '?';
const ATTRS = ['title', 'show-home', 'show-leave', 'show-edit', 'show-delete', 'show-reload', 'show-fullscreen'] as const;

export class RbHeader extends HTMLElement {
  static get observedAttributes() { return [...ATTRS]; }

  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }

  private render(): void {
    const title = this.getAttribute('title') || '';
    const showHome = this.hasAttribute('show-home');
    const showLeave = this.hasAttribute('show-leave');
    const showDelete = this.hasAttribute('show-delete');
    const showReload = this.hasAttribute('show-reload');
    const showFullscreen = this.hasAttribute('show-fullscreen');
    const showEdit = this.hasAttribute('show-edit');

    this.innerHTML = `
      ${showLeave ? '<button class="btn btn-header" data-action="leave" title="Leave room">←</button>' : ''}
      ${showHome ? '<a href="/" class="btn btn-header" title="Home">🏠</a>' : ''}
      <h2 class="rb-header-title">${title}</h2><span style="font-size:0.55rem;opacity:0.4;margin-left:4px">v${BUILD_VER}</span>
      ${showEdit ? '<button class="btn btn-header" data-action="edit" title="Edit room config">✏️</button>' : ''}
      ${showDelete ? '<button class="btn btn-header btn-header-danger" data-action="delete" title="Delete room">🗑</button>' : ''}
      ${showReload ? '<button class="btn btn-header" data-action="reload" title="Reload">↻</button>' : ''}
      ${showFullscreen ? '<button class="btn btn-header" data-action="fullscreen" title="Fullscreen">⛶</button>' : ''}
    `;

    this.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = (btn as HTMLElement).dataset.action!;
        if (action === 'reload') { location.reload(); return; }
        if (action === 'fullscreen') {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            btn.textContent = '✕';
          } else {
            document.exitFullscreen().catch(() => {});
            btn.textContent = '⛶';
          }
          return;
        }
        this.dispatchEvent(new CustomEvent(`rb-${action}`, { bubbles: true }));
      });
    });

    // R31.12 device-fix (Tron): the room TITLE opens room settings for ALL in-room members (non-host = read-only,
    // enforced in RoomView.openRoomEditor). REAL interactive element (role=button + keydown) so iOS WebKit fires the
    // tap — was a plain click on a non-interactive <h2> = Chromium false-green, dead on real WebKit. Un-gated from
    // showEdit → all members; ✏️ button stays host-only (unchanged). Reuses rb-edit → openRoomEditor.
    const titleEl = this.querySelector('.rb-header-title') as HTMLElement | null;
    if (titleEl) {
      titleEl.setAttribute('role', 'button'); titleEl.setAttribute('tabindex', '0');
      titleEl.style.cursor = 'pointer'; titleEl.title = 'Room settings';
      const openCfg = () => this.dispatchEvent(new CustomEvent('rb-edit', { bubbles: true }));
      titleEl.addEventListener('click', openCfg);
      titleEl.addEventListener('keydown', (e: Event) => { const k = (e as KeyboardEvent).key; if (k === 'Enter' || k === ' ') { e.preventDefault(); openCfg(); } });
    }
  }
}

customElements.define('rb-header', RbHeader);
