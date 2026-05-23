import { RawBinClient } from './RawBinClient.js';
import { RoomBrowser } from './RoomBrowser.js';
import { RoomView } from './RoomView.js';
import { ProfileEditor } from './ProfileEditor.js';
import { DeviceEnrollDialog } from './DeviceEnrollDialog.js';
import { MSG } from '../../shared/MessageTypes.js';

const client = new RawBinClient();
(window as any).__rawbinClient = client;
const container = document.getElementById('app')!;
const profileEditor = new ProfileEditor(client);
const deviceEnroll = new DeviceEnrollDialog(client);

const browser = new RoomBrowser(client, container, (roomId) => {
  browser.hide();
  roomView.show(roomId);
});

const roomView = new RoomView(client, container, () => {
  roomView.hide();
  browser.show();
  history.replaceState({}, '', '/app');
});

async function loadConfig(): Promise<{ baseDomain: string; httpsPort: number }> {
  try {
    const res = await fetch('/api/config');
    return await res.json();
  } catch {
    return { baseDomain: location.hostname, httpsPort: parseInt(location.port) || 4444 };
  }
}

function hasDeviceKeys(): boolean {
  return !!localStorage.getItem('rawbin-device-privateKey');
}

function proceedToBrowser(): void {
  const params = new URLSearchParams(window.location.search);
  if (params.get('editProfile') === '1') {
    history.replaceState({}, '', '/app');
    const profile = client.getProfile();
    profileEditor.open({
      name: profile?.name || '', phone: profile?.phone || '', url: profile?.url || '',
      avatar: profile?.avatar || '', secretCode: profile?.secretCode || '',
    }, 'normal', () => { browser.show(); });
    browser.show();
    return;
  }
  browser.show();
}

function checkDeviceEnrollment(profile: any): void {
  if (profile.sshKeysGenerated && !hasDeviceKeys()) {
    deviceEnroll.open(() => { proceedToBrowser(); });
  } else {
    proceedToBrowser();
  }
}

async function init() {
  try {
    const config = await loadConfig();
    const shareBase = `https://${config.baseDomain}:${config.httpsPort}`;
    (window as any).__shareBase = shareBase;
    await client.connect();

    const profileMsg = await client.once(MSG.PROFILE);

    if (!profileMsg?.profile?.profileCommitted) {
      const initial = profileMsg?.profile || {};
      profileEditor.open(
        { name: initial.name || '', phone: initial.phone || '', url: initial.url || '', avatar: initial.avatar || '', secretCode: initial.secretCode || '' },
        'gate',
        (savedProfile: any) => { checkDeviceEnrollment(savedProfile); }
      );
    } else {
      checkDeviceEnrollment(profileMsg.profile);
    }
  } catch {
    container.innerHTML = '<div class="error"><h2>Connection Failed</h2><p>Could not connect to server. Please refresh.</p></div>';
  }
}

init();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner(reg);
        }
      });
    });
  }).catch(() => {});

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    location.reload();
  });
}

async function checkForUpdate(): Promise<void> {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    const cachedVersion = localStorage.getItem('rawbin-version');
    if (cachedVersion && cachedVersion !== config.version) {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting) showUpdateBanner(reg);
      }
    }
    localStorage.setItem('rawbin-version', config.version);
  } catch {}
}

function showUpdateBanner(reg: ServiceWorkerRegistration): void {
  if (document.getElementById('update-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.className = 'update-banner';
  banner.innerHTML = '<span>New version available</span><button id="update-now">Update Now</button>';
  document.body.prepend(banner);
  document.getElementById('update-now')?.addEventListener('click', () => {
    banner.remove();
    reg.waiting?.postMessage('SKIP_WAITING');
  });
}

checkForUpdate();
