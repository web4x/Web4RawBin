// [impl:uuid:5b438bb9-1602-4890-9c09-407606a28d6c] T8 profile editor
import { RawBinClient } from './RawBinClient.js';
import { MSG } from '../../shared/MessageTypes.js';
import './components/rb-avatar.js';
import { parseVCard, type VCardData } from './vcard-parse.js';
import { viewBus } from './ViewBus.js';

interface ProfileData {
  name: string;
  phone: string;
  url: string;
  avatar: string;
  secretCode: string;
}

export class ProfileEditor {
  private client: RawBinClient;
  private overlay: HTMLElement | null = null;
  private mode: 'normal' | 'gate' = 'normal';
  private onSave: ((data: ProfileData) => void) | null = null;

  constructor(client: RawBinClient) {
    this.client = client;
    this.client.on(MSG.PROFILE_UPDATED, (msg) => {
      // R21.2: always persist the canonical name (not only on the gate onSave path)
      // so the lobby reads it on next construction even if the live update is missed.
      if (msg.profile?.name) localStorage.setItem('rawbin-name', msg.profile.name);
      if (this.onSave && msg.profile) {
        const cb = this.onSave;
        this.onSave = null;        // clear BEFORE invoking — one-shot
        cb(msg.profile);
      }
      this.close();
    });
  }

  open(initial: Partial<ProfileData> = {}, mode: 'normal' | 'gate' = 'normal', onSave?: (data: ProfileData) => void): void {
    this.mode = mode;
    this.onSave = onSave || null;
    if (this.overlay) this.close();

    this.overlay = document.createElement('div');
    this.overlay.className = `profile-overlay ${mode === 'gate' ? 'profile-gate' : ''}`;
    this.overlay.innerHTML = `
      <div class="profile-sheet">
        <div class="profile-header">
          <h3>${mode === 'gate' ? 'Set Up Your Profile' : 'Edit Profile'}</h3>
          ${mode === 'normal' ? '<button class="profile-close" id="pe-close">✕</button>' : ''}
        </div>
        <div class="profile-vcard-import">
          <button id="pe-import-vcard" class="btn btn-primary profile-vcard-btn">📇 Import vCard</button>
          <input type="file" id="pe-vcf-input" accept=".vcf,text/vcard" hidden>
          <p class="profile-vcard-hint">or drag & drop a .vcf file here</p>
        </div>
        <div class="profile-avatar-row">
          <rb-avatar size="80" src="${initial.avatar || ''}" name="${initial.name || '?'}" token="${this.client.playerToken}" crop='${this.client.getProfile()?.avatarCrop ? JSON.stringify(this.client.getProfile()!.avatarCrop) : ''}' id="pe-avatar"></rb-avatar>
          <p class="profile-avatar-hint">Tap photo to view or upload</p>
        </div>
        <div class="profile-fields">
          <label>Name${mode === 'gate' ? ' *' : ''}</label>
          <input type="text" id="pe-name" value="${initial.name || ''}" placeholder="Your name..." ${mode === 'gate' ? 'required' : ''}>
          <label>Phone</label>
          <input type="tel" id="pe-phone" value="${initial.phone || ''}" maxlength="30" placeholder="Phone number...">
          <label>URL</label>
          <input type="url" id="pe-url" value="${initial.url || ''}" maxlength="200" placeholder="Website or social link...">
          <label>Secret Code (4 digits)</label>
          <input type="text" id="pe-code" value="${initial.secretCode || ''}" pattern="[0-9]{4}" maxlength="4" placeholder="1234" inputmode="numeric">
          ${mode !== 'gate' ? `<label style="margin-top:8px">Your UUID</label><code style="display:block;padding:8px;background:rgba(0,0,0,0.05);border-radius:6px;font-size:0.75rem;word-break:break-all;user-select:all">${this.client.playerToken}</code>` : ''}
        </div>
        <button class="btn btn-primary profile-save" id="pe-save" ${mode === 'gate' && !initial.name ? 'disabled' : ''}>${mode === 'gate' ? 'Continue' : 'Save'}</button>
      </div>`;

    this.avatarUrl = initial.avatar || '';
    document.body.appendChild(this.overlay);
    this.setupEvents();
  }

  close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  isOpen(): boolean {
    return this.overlay !== null;
  }

  private avatarUrl: string = '';

  private setupEvents(): void {
    document.getElementById('pe-close')?.addEventListener('click', () => this.close());

    // R21.4: for a NEW (uncommitted) identity, a phone already in the index triggers a
    // device-link challenge instead of minting a new user. Check on phone blur.
    document.getElementById('pe-phone')?.addEventListener('blur', (e) => {
      const phone = (e.target as HTMLInputElement).value.trim();
      if (phone) this.client.checkKnownKey(phone, undefined);
    });

    // T142: vCard import handlers
    document.getElementById('pe-import-vcard')?.addEventListener('click', () => {
      (document.getElementById('pe-vcf-input') as HTMLInputElement)?.click();
    });
    document.getElementById('pe-vcf-input')?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const vcf = parseVCard(text);
        this.applyVCard(vcf);
        // R20.31: store .vcf on server
        const token = this.client.playerToken; // R21.1 fix: was localStorage('rawbin-player-token') which is never set (key is 'rawbin-player-id')
        if (token) {
          const b64 = btoa(unescape(encodeURIComponent(text)));
          fetch('/api/vcard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerToken: token, data: b64 }) }).catch(() => {});
        }
      } catch { this.showVCardError('Could not parse this vCard'); }
    });
    const overlay = this.overlay!;
    overlay.addEventListener('dragover', (e: DragEvent) => { e.preventDefault(); e.dataTransfer!.dropEffect = 'copy'; overlay.classList.add('profile-drag-active'); });
    overlay.addEventListener('dragleave', () => { overlay.classList.remove('profile-drag-active'); });
    overlay.addEventListener('drop', async (e: DragEvent) => {
      e.preventDefault(); overlay.classList.remove('profile-drag-active');
      const file = e.dataTransfer?.files[0];
      if (!file || (!file.name.endsWith('.vcf') && file.type !== 'text/vcard')) { this.showVCardError('Please drop a .vcf file'); return; }
      try {
        const text = await file.text();
        const vcf = parseVCard(text);
        if (!vcf.fn && !vcf.tel && !vcf.url && !vcf.photo) { this.showVCardError('No profile data found'); return; }
        this.applyVCard(vcf);
        const token = this.client.playerToken; // R21.1 fix: was localStorage('rawbin-player-token') which is never set (key is 'rawbin-player-id')
        if (token) {
          const b64 = btoa(unescape(encodeURIComponent(text)));
          fetch('/api/vcard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerToken: token, data: b64 }) }).catch(() => {});
        }
      } catch { this.showVCardError('Could not read this file'); }
    });

    document.getElementById('pe-avatar')?.addEventListener('rb-avatar-changed', ((e: CustomEvent) => {
      this.avatarUrl = e.detail.avatarUrl;
    }) as EventListener);

    if (this.mode === 'gate') {
      const nameInput = document.getElementById('pe-name') as HTMLInputElement;
      const saveBtn = document.getElementById('pe-save') as HTMLButtonElement;
      nameInput?.addEventListener('input', () => {
        saveBtn.disabled = !nameInput.value.trim();
      });
    }

    document.getElementById('pe-save')?.addEventListener('click', () => {
      const name = (document.getElementById('pe-name') as HTMLInputElement).value.trim();
      const phone = (document.getElementById('pe-phone') as HTMLInputElement).value.trim();
      const url = (document.getElementById('pe-url') as HTMLInputElement).value.trim();
      const secretCode = (document.getElementById('pe-code') as HTMLInputElement).value.trim();
      if (this.mode === 'gate' && !name) {
        (document.getElementById('pe-name') as HTMLInputElement).focus();
        return;
      }
      if (secretCode && !/^\d{4}$/.test(secretCode)) {
        (document.getElementById('pe-code') as HTMLInputElement).focus();
        return;
      }

      this.client.send({
        type: MSG.UPDATE_PROFILE,
        name, phone, url,
        ...(this.avatarUrl ? { avatar: this.avatarUrl } : {}),
        ...(secretCode ? { secretCode } : {}),
      });
      viewBus.publish('User', this.client.playerToken, { displayName: name, token: this.client.playerToken });
    });

    if (this.mode !== 'gate') {
      this.overlay?.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }
  }

  // [impl:uuid:d1337706-80fa-48ba-a0a0-5b9cc42e2511] R21.1 Profile.applyVCard — vCard drop/import → photo→avatar + POST /api/vcard
  private applyVCard(vcf: VCardData): void {
    if (vcf.fn) {
      const nameInput = document.getElementById('pe-name') as HTMLInputElement;
      nameInput.value = vcf.fn;
      nameInput.dispatchEvent(new Event('input'));
    }
    if (vcf.tel) (document.getElementById('pe-phone') as HTMLInputElement).value = vcf.tel;
    if (vcf.url) (document.getElementById('pe-url') as HTMLInputElement).value = vcf.url;
    if (vcf.photo) {
      const avatar = document.getElementById('pe-avatar') as any;
      if (avatar?.uploadBlob) avatar.uploadBlob(vcf.photo);
    }
  }

  private showVCardError(msg: string): void {
    const hint = this.overlay?.querySelector('.profile-vcard-hint') as HTMLElement;
    if (hint) { hint.textContent = msg; hint.classList.add('profile-vcard-error'); }
    setTimeout(() => { if (hint) { hint.textContent = 'or drag & drop a .vcf file here'; hint.classList.remove('profile-vcard-error'); } }, 3000);
  }
}
