import { RawBinClient } from './RawBinClient.js';
import { MSG } from '../../shared/MessageTypes.js';

interface PublicProfile {
  name: string;
  phone: string;
  url: string;
  avatar: string;
  playerToken: string;
}

export class ProfileSheet {
  private client: RawBinClient;
  private overlay: HTMLElement | null = null;

  constructor(client: RawBinClient) {
    this.client = client;
  }

  open(profile: PublicProfile): void {
    if (this.overlay) this.close();

    const avatarHtml = profile.avatar && profile.avatar.startsWith('data:image')
      ? `<img src="${profile.avatar}" alt="${profile.name}">`
      : `<span class="avatar-placeholder">?</span>`;

    this.overlay = document.createElement('div');
    this.overlay.className = 'profile-overlay';
    this.overlay.innerHTML = `
      <div class="profile-sheet user-sheet">
        <div class="sheet-handle"><div class="sheet-handle-bar"></div></div>
        <button class="profile-close" id="us-close">✕</button>
        <div class="user-sheet-avatar">${avatarHtml}</div>
        <h3 class="user-sheet-name">${profile.name || 'Unknown'}</h3>
        <button id="us-vcard" class="btn btn-secondary user-sheet-btn">Download vCard</button>
        <button id="us-link" class="btn btn-primary user-sheet-btn" data-token="${profile.playerToken}" data-name="${profile.name}">Link Account</button>
      </div>`;

    document.body.appendChild(this.overlay);
    this.setupEvents(profile);
  }

  close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private setupEvents(profile: PublicProfile): void {
    document.getElementById('us-close')?.addEventListener('click', () => this.close());

    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    document.getElementById('us-vcard')?.addEventListener('click', () => {
      this.downloadVCard(profile);
    });

    document.getElementById('us-link')?.addEventListener('click', () => {
      const code = prompt(
        `Enter ${profile.name}'s secret code to link accounts.\n` +
        `The code is a 4-digit number shown on their /profile page.\n` +
        `This cannot be undone.`
      );
      if (code && profile.playerToken) {
        this.client.send({ type: MSG.CONSOLIDATE, targetToken: profile.playerToken, secretCode: code.trim() });
        this.close();
      }
    });

    let startY = 0;
    const sheet = this.overlay?.querySelector('.user-sheet') as HTMLElement;
    sheet?.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
    sheet?.addEventListener('touchmove', (e) => {
      if (e.touches[0].clientY - startY > 50) this.close();
    }, { passive: true });
  }

  private downloadVCard(profile: PublicProfile): void {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${profile.name}`];
    if (profile.phone) lines.push(`TEL:${profile.phone}`);
    if (profile.url) lines.push(`URL:${profile.url}`);
    if (profile.avatar && profile.avatar.startsWith('data:image')) {
      const match = profile.avatar.match(/^data:image\/(\w+);base64,(.+)$/);
      if (match) lines.push(`PHOTO;ENCODING=b;TYPE=${match[1].toUpperCase()}:${match[2]}`);
    }
    lines.push('NOTE:RawBin User');
    lines.push('END:VCARD');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${profile.name.replace(/[^a-zA-Z0-9 ]/g, '')}.vcf`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
