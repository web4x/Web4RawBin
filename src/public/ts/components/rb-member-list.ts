// [impl:uuid:b549aef8-c99b-4d41-8dd8-0dbd538f1e8d] T43 member list
import './rb-member-badge.js';

export interface MemberData {
  id: string;
  name: string;
  avatarUrl: string;
  avatarCrop?: { scale: number; x: number; y: number } | null;
  playerToken: string;
  isHost: boolean;
  isSelf: boolean;
  isConnected: boolean;
}

export class RbMemberList extends HTMLElement {
  private members: MemberData[] = [];

  connectedCallback() {
    this.style.display = 'flex';
    this.style.flexWrap = 'wrap';
    this.style.gap = '4px';
  }

  setMembers(members: MemberData[]): void {
    this.members = members;
    this.render();
  }

  private render(): void {
    this.innerHTML = '';
    for (const m of this.members) {
      const badge = document.createElement('rb-member-badge');
      badge.setAttribute('name', m.name);
      if (m.avatarUrl) badge.setAttribute('avatar-url', m.avatarUrl);
      if (m.avatarCrop) badge.setAttribute('avatar-crop', JSON.stringify(m.avatarCrop));
      if (m.playerToken) badge.setAttribute('player-token', m.playerToken);
      if (m.isHost) badge.setAttribute('is-host', '');
      if (m.isSelf) badge.setAttribute('is-self', '');
      if (m.isConnected) badge.setAttribute('is-connected', '');
      this.appendChild(badge);
    }
  }
}

customElements.define('rb-member-list', RbMemberList);
