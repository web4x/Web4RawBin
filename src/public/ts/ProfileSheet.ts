// [impl:uuid:3bbd5f2b-eb9c-4c48-9cf7-f6424d0b1ec2] T81 profile sheet
import { RawBinClient } from './RawBinClient.js';
import { MSG } from '../../shared/MessageTypes.js';
import './components/rb-avatar.js';
import { viewBus } from './ViewBus.js';
import { downloadVCard } from './vcard-download.js';

interface PublicProfile {
  name: string;
  phone: string;
  url: string;
  avatar: string;
  playerToken: string;
}

interface SheetOpts { isSelf?: boolean; onEdit?: () => void; }

export class ProfileSheet {
  private client: RawBinClient;
  private overlay: HTMLElement | null = null;
  private onEdit: (() => void) | null = null;
  private unsub: (() => void) | null = null;

  constructor(client: RawBinClient) {
    this.client = client;
  }

  open(profile: PublicProfile, opts: SheetOpts = {}): void {
    if (this.overlay) this.close();

    const isSelf = opts.isSelf === true;
    this.onEdit = opts.onEdit || null;

    this.overlay = document.createElement('div');
    this.overlay.className = 'profile-overlay';
    this.overlay.innerHTML = `
      <div class="profile-sheet user-sheet">
        <div class="sheet-handle"><div class="sheet-handle-bar"></div></div>
        <button class="profile-close" id="us-close">✕</button>
        <div class="user-sheet-avatar"><rb-avatar size="80" name="${profile.name || '?'}" token="${profile.playerToken || ''}" ${profile.avatar ? `src="${profile.avatar}"` : ''} readonly></rb-avatar></div>
        <h3 class="user-sheet-name">${profile.name || 'Unknown'}</h3>
        <button id="us-vcard" class="btn btn-secondary user-sheet-btn">Download vCard</button>
        ${isSelf
          ? `<button id="us-edit" class="btn btn-primary user-sheet-btn">Edit Profile</button>`
          : `<button id="us-link" class="btn btn-primary user-sheet-btn" data-token="${profile.playerToken}" data-name="${profile.name}">Link Account</button>`}
      </div>`;

    document.body.appendChild(this.overlay);
    this.setupEvents(profile);
    if (profile.playerToken) {
      this.unsub = viewBus.subscribe('User', profile.playerToken, (m) => {
        const nameEl = this.overlay?.querySelector('.user-sheet-name');
        if (nameEl && m.displayName) nameEl.textContent = String(m.displayName);
      });
    }
  }

  close(): void {
    this.unsub?.(); this.unsub = null;
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
      downloadVCard(profile);
    });

    // T83: self-only Edit button → ProfileEditor via the onEdit callback (ProfileSheet stays
    // decoupled — never imports ProfileEditor). #us-edit only exists in the DOM when isSelf.
    document.getElementById('us-edit')?.addEventListener('click', () => {
      this.close();
      this.onEdit?.();
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

}
