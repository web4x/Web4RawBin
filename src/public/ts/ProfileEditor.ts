import { RawBinClient } from './RawBinClient.js';
import { MSG } from '../../shared/MessageTypes.js';

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
      if (this.onSave && msg.profile) {
        this.onSave(msg.profile);
        if (msg.profile.name) localStorage.setItem('rawbin-name', msg.profile.name);
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
        <div class="profile-avatar-row">
          <div class="profile-avatar-preview" id="pe-avatar-preview">${initial.avatar ? `<img src="${initial.avatar}" alt="avatar">` : '<span class="avatar-placeholder">?</span>'}</div>
          <label class="btn btn-small btn-secondary profile-avatar-btn">
            Upload Photo
            <input type="file" accept="image/*" id="pe-avatar-input" style="display:none">
          </label>
        </div>
        <div class="profile-fields">
          <label>Name${mode === 'gate' ? ' *' : ''}</label>
          <input type="text" id="pe-name" value="${initial.name || ''}" maxlength="20" placeholder="Your name..." ${mode === 'gate' ? 'required' : ''}>
          <label>Phone</label>
          <input type="tel" id="pe-phone" value="${initial.phone || ''}" maxlength="30" placeholder="Phone number...">
          <label>URL</label>
          <input type="url" id="pe-url" value="${initial.url || ''}" maxlength="200" placeholder="Website or social link...">
          <label>Secret Code (4 digits)</label>
          <input type="text" id="pe-code" value="${initial.secretCode || ''}" pattern="[0-9]{4}" maxlength="4" placeholder="1234" inputmode="numeric">
        </div>
        <button class="btn btn-primary profile-save" id="pe-save" ${mode === 'gate' && !initial.name ? 'disabled' : ''}>${mode === 'gate' ? 'Continue' : 'Save'}</button>
      </div>`;

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

  private setupEvents(): void {
    document.getElementById('pe-close')?.addEventListener('click', () => this.close());

    const avatarInput = document.getElementById('pe-avatar-input') as HTMLInputElement;
    avatarInput?.addEventListener('change', () => {
      const file = avatarInput.files?.[0];
      if (!file) return;
      if (file.size > 200 * 1024) { alert('Image must be under 200KB'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const preview = document.getElementById('pe-avatar-preview');
        if (preview) preview.innerHTML = `<img src="${dataUrl}" alt="avatar">`;
      };
      reader.readAsDataURL(file);
    });

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
      const avatarImg = document.querySelector('#pe-avatar-preview img') as HTMLImageElement;
      const avatar = avatarImg?.src || '';

      this.client.send({
        type: MSG.UPDATE_PROFILE,
        name, phone, url, avatar,
        ...(secretCode ? { secretCode } : {}),
      });
    });

    if (this.mode !== 'gate') {
      this.overlay?.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }
  }
}
