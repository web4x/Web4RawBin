// [impl:uuid:7a5752ae-3c8c-47b1-867e-1490db5796bf] T10 device enrollment
import { RawBinClient } from './RawBinClient.js';
import { MSG } from '../../shared/MessageTypes.js';

export class DeviceEnrollDialog {
  private client: RawBinClient;
  private overlay: HTMLElement | null = null;
  private onEnrolled: (() => void) | null = null;

  constructor(client: RawBinClient) {
    this.client = client;
    this.client.on(MSG.DEVICE_ENROLL_OK, (msg) => {
      localStorage.setItem('rawbin-device-privateKey', msg.devicePrivateKey);
      localStorage.setItem('rawbin-device-publicKey', msg.devicePublicKey);
      localStorage.setItem('rawbin-device-signature', msg.signature);
      this.close();
      if (this.onEnrolled) this.onEnrolled();
    });
    this.client.on(MSG.DEVICE_ENROLL_FAILED, (msg) => {
      const err = document.getElementById('de-error');
      if (err) { err.textContent = msg.reason || 'Enrollment failed'; err.style.display = 'block'; }
      const btn = document.getElementById('de-submit') as HTMLButtonElement;
      if (btn) btn.disabled = false;
    });
  }

  open(onEnrolled: () => void): void {
    this.onEnrolled = onEnrolled;
    if (this.overlay) this.close();

    this.overlay = document.createElement('div');
    this.overlay.className = 'profile-overlay profile-gate';
    this.overlay.innerHTML = `
      <div class="profile-sheet">
        <h3 style="margin-bottom:12px">Authorize This Device</h3>
        <p style="font-size:0.85rem;opacity:0.6;margin-bottom:16px">Enter your 4-digit secret code to authorize this device.</p>
        <input type="text" id="de-code" pattern="[0-9]{4}" maxlength="4" placeholder="1234" inputmode="numeric"
          style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:1.5rem;text-align:center;letter-spacing:8px">
        <div id="de-error" style="display:none;color:#e74c3c;text-align:center;margin-top:8px;font-size:0.85rem"></div>
        <button class="btn btn-primary profile-save" id="de-submit" disabled style="margin-top:16px">Authorize</button>
      </div>`;
    document.body.appendChild(this.overlay);

    const codeInput = document.getElementById('de-code') as HTMLInputElement;
    const submitBtn = document.getElementById('de-submit') as HTMLButtonElement;

    codeInput?.addEventListener('input', () => {
      submitBtn.disabled = !/^\d{4}$/.test(codeInput.value);
      const err = document.getElementById('de-error');
      if (err) err.style.display = 'none';
    });

    submitBtn?.addEventListener('click', () => {
      const code = codeInput.value.trim();
      if (!/^\d{4}$/.test(code)) return;
      submitBtn.disabled = true;
      this.client.send({ type: MSG.DEVICE_ENROLL_REQUEST, secretCode: code });
    });

    codeInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !submitBtn.disabled) submitBtn.click();
    });

    codeInput?.focus();
  }

  close(): void {
    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
  }
}
