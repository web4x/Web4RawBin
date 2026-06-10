// [impl:uuid:39074a59-864f-4947-ac7b-0457bbbe172b] T40 header
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
      <h2 class="rb-header-title">${title}</h2>
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
  }
}

customElements.define('rb-header', RbHeader);
