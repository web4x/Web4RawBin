import { RawBinClient } from './RawBinClient.js';
import { RoomBrowser } from './RoomBrowser.js';
import { RoomView } from './RoomView.js';
import { ProfileEditor } from './ProfileEditor.js';
import { MSG } from '../../shared/MessageTypes.js';

const client = new RawBinClient();
const container = document.getElementById('app')!;
const profileEditor = new ProfileEditor(client);

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
        () => { browser.show(); }
      );
    } else {
      browser.show();
    }
  } catch {
    container.innerHTML = '<div class="error"><h2>Connection Failed</h2><p>Could not connect to server. Please refresh.</p></div>';
  }
}

init();
