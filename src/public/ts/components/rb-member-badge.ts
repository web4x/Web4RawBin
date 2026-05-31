// [impl:uuid:574ae9d1-2e23-4fdf-93e4-496102aad08f] T43 member badge
import './rb-avatar.js';

const BADGE_ATTRS = ['name', 'avatar-url', 'avatar-crop', 'player-token', 'is-host', 'is-self', 'is-connected'] as const;

export class RbMemberBadge extends HTMLElement {
  static get observedAttributes() { return [...BADGE_ATTRS]; }

  connectedCallback() { this.render(); this.setupClick(); }
  attributeChangedCallback() { if (this.isConnected) this.render(); }

  private render(): void {
    const name = this.getAttribute('name') || '?';
    const avatarUrl = this.getAttribute('avatar-url') || '';
    const token = this.getAttribute('player-token') || '';
    const isHost = this.hasAttribute('is-host');
    const isSelf = this.hasAttribute('is-self');
    const isConnected = this.hasAttribute('is-connected');

    this.className = `mb-badge${isSelf ? ' mb-self' : ''}`;

    this.innerHTML = `
      <rb-avatar size="24" src="${avatarUrl}" name="${name}" token="${token}" crop='${this.getAttribute('avatar-crop') || ''}' readonly></rb-avatar>
      <span class="mb-name">${name}${isSelf ? ' (you)' : ''}</span>
      ${isHost ? '<span class="mb-host" title="Host">★</span>' : ''}
      <span class="mb-status" style="color:${isConnected ? '#4CAF50' : '#f44336'}" title="${isConnected ? 'Connected' : 'Disconnected'}">●</span>
    `;
  }

  private setupClick(): void {
    this.addEventListener('click', () => {
      const token = this.getAttribute('player-token') || '';
      this.dispatchEvent(new CustomEvent('rb-member-click', {
        bubbles: true,
        detail: { playerToken: token, isSelf: this.hasAttribute('is-self') },
      }));
    });
  }
}

customElements.define('rb-member-badge', RbMemberBadge);
