// [impl:uuid:3bbd5f2b-eb9c-4c48-9cf7-f6424d0b1ec2] T81 profile sheet
import { RawBinClient } from './RawBinClient.js';
import { MSG } from '../../shared/MessageTypes.js';
import './components/rb-avatar.js';
import { viewBus } from './ViewBus.js';

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
      this.downloadVCard(profile);
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

  private async downloadVCard(profile: PublicProfile): Promise<void> {
    // R20.31: try serving stored .vcf first, enrich NOTE with date+geolocation
    // Skip stored vcard fetch if we already have local data (data: avatar = all local)
    let vcfText: string | null = null;
    const hasLocalData = profile.avatar?.startsWith('data:');
    if (profile.playerToken && !hasLocalData) {
      try {
        const r = await fetch(`/api/vcard/${profile.playerToken}`);
        if (r.ok) vcfText = await r.text();
      } catch { /* no stored vcard — generate from scratch */ }
    }

    if (!vcfText) {
      // Generate from profile data
      const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${profile.name}`];
      if (profile.phone) lines.push(`TEL:${profile.phone}`);
      if (profile.url) lines.push(`URL:${profile.url}`);
      const photoSrc = profile.avatar && profile.avatar.startsWith('data:')
        ? profile.avatar
        : (profile.playerToken ? `/api/avatar/${profile.playerToken}` : (profile.avatar || ''));
      if (photoSrc) {
        try {
          let dataUrl = photoSrc;
          if (!dataUrl.startsWith('data:')) {
            const res = await fetch(photoSrc);
            const buf = await res.arrayBuffer();
            const type = res.headers.get('content-type') || 'image/jpeg';
            dataUrl = `data:${type};base64,${bufToBase64(buf)}`;
          }
          const match = dataUrl.match(/^data:image\/([\w+.-]+);base64,(.+)$/);
          if (match) lines.push(`PHOTO;ENCODING=b;TYPE=${match[1].toUpperCase()}:${match[2]}`);
        } catch { /* silent */ }
      }
      lines.push(`NOTE:RawBin User${profile.playerToken ? ` — UUID: ${profile.playerToken}` : ''}`);
      lines.push('END:VCARD');
      vcfText = lines.join('\r\n');
    }

    // R20.31 Part C: enrich NOTE with download date + geolocation
    const downloadDate = new Date().toISOString();
    let geoLink = '';
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      geoLink = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
    } catch { /* denied or unavailable — graceful fallback */ }

    // Append download metadata to NOTE field
    const noteExtra = `\\nDownloaded: ${downloadDate}${geoLink ? `\\nLocation: ${geoLink}` : ''}`;
    if (vcfText.includes('NOTE:')) {
      vcfText = vcfText.replace(/(NOTE:[^\r\n]*)/, `$1${noteExtra}`);
    } else {
      vcfText = vcfText.replace('END:VCARD', `NOTE:RawBin vCard${noteExtra}\r\nEND:VCARD`);
    }

    const blob = new Blob([vcfText], { type: 'text/vcard' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${profile.name.replace(/[^a-zA-Z0-9 ]/g, '')}.vcf`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

/** Loop-based base64 — spread `btoa(String.fromCharCode(...))` stack-overflows on >10KB buffers
 * (real JPEG avatars), which silently dropped the vCard photo. */
function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
