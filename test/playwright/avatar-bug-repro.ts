import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(import.meta.dirname, '../../test-results/avatar-bug');
fs.mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  await page.addInitScript(() => {
    (window as any).__avatarEvents = [];
    (window as any).__secretCode = '';
    window.addEventListener('rb-avatar-updated', (e: Event) => {
      const d = (e as CustomEvent).detail;
      (window as any).__avatarEvents.push({ time: Date.now(), ...d });
      console.log('[AVATAR-EVENT] rb-avatar-updated: ' + JSON.stringify(d));
    });
    const origParse = JSON.parse;
    JSON.parse = function(text: string) {
      const result = origParse.call(this, text);
      if (result?.type === 'PROFILE' && result?.profile?.secretCode) {
        (window as any).__secretCode = result.profile.secretCode;
      }
      return result;
    };
  });

  console.log('=== AVATAR BUG REPRODUCTION ===\n');

  await page.goto('https://localhost:4444/app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Gate
  const gate = await page.$('.profile-gate');
  if (gate) {
    console.log('STEP 1: Profile gate...');
    await page.fill('#pe-name', 'BugRepro');
    await page.waitForTimeout(300);
    await page.click('#pe-save');
    await page.waitForTimeout(4000);

    // Enrollment
    const enrollInput = await page.$('#de-code');
    if (enrollInput) {
      console.log('STEP 2: Device enrollment...');
      const code = await page.evaluate(() => (window as any).__secretCode);
      console.log('   Secret code (captured from WS):', code);
      if (code && /^\d{4}$/.test(code)) {
        await page.fill('#de-code', code);
        await page.waitForTimeout(300);
        await page.click('#de-submit');
        await page.waitForTimeout(3000);
      }
    }
  }

  // Wait for lobby
  try {
    await page.waitForSelector('.lobby', { timeout: 10000 });
  } catch {
    console.log('Lobby failed to appear. Screenshot:');
    await page.screenshot({ path: path.join(OUT, 'stuck.png'), fullPage: true });
    await browser.close();
    return;
  }
  await page.waitForTimeout(1000);
  console.log('STEP 3: Lobby loaded');

  const lobbyAvatars = await page.$$eval('rb-avatar', els => els.map(el => ({
    src: el.getAttribute('src'), token: el.getAttribute('token')?.slice(0, 8), size: el.getAttribute('size'),
  })));
  console.log('   Lobby rb-avatars:', JSON.stringify(lobbyAvatars));
  await page.screenshot({ path: path.join(OUT, '01-lobby.png'), fullPage: true });

  // Create room
  console.log('STEP 4: Creating room...');
  await page.click('#create-room-btn');
  await page.waitForTimeout(500);
  await page.click('#confirm-create-btn');
  await page.waitForTimeout(3000);

  const beforeAvatars = await page.$$eval('rb-avatar', els => els.map(el => ({
    src: el.getAttribute('src'), token: el.getAttribute('token')?.slice(0, 8), size: el.getAttribute('size'),
  })));
  console.log('STEP 5: Room avatars BEFORE:', JSON.stringify(beforeAvatars));
  await page.screenshot({ path: path.join(OUT, '02-room-before.png'), fullPage: true });

  // Open overlay
  console.log('STEP 6: Opening avatar overlay...');
  const avEl = await page.$('rb-member-badge rb-avatar');
  if (avEl) {
    await avEl.evaluate(el => {
      (el.shadowRoot?.querySelector('.circle') as HTMLElement)?.click();
    });
  }
  await page.waitForTimeout(1500);

  const overlayFound = await page.evaluate(() => {
    for (const child of document.body.children) {
      if (child.querySelector?.('.overlay')) return true;
    }
    return false;
  });
  console.log('   Overlay found:', overlayFound);
  await page.screenshot({ path: path.join(OUT, '03-overlay.png'), fullPage: true });

  if (!overlayFound) {
    console.log('   FATAL: Overlay did not open.');
    await browser.close();
    return;
  }

  // Upload
  const testPng = path.join(OUT, 'test-avatar.png');
  fs.writeFileSync(testPng, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2P4z8DwHwYZqAgYGUYtGLUAAGkMBf8Fg/Z3AAAAAElFTkSuQmCC', 'base64'));

  console.log('STEP 7: Uploading...');
  const fileHandle = await page.evaluateHandle(() => {
    for (const child of document.body.children) {
      const input = child.querySelector?.('input[type="file"]');
      if (input) return input;
    }
    return null;
  });
  await (fileHandle as any).setInputFiles(testPng);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(OUT, '04-after-upload.png'), fullPage: true });

  // Measure
  const events = await page.evaluate(() => (window as any).__avatarEvents);
  console.log('\n=== MEASUREMENT RESULTS ===\n');
  console.log('rb-avatar-updated events fired:', events?.length || 0);
  events?.forEach((e: any, i: number) => {
    console.log(`  Event ${i}: token=${e.token?.slice(0,8)} url=${(e.url || '').slice(0,50)} crop=${e.crop ? 'yes' : 'no'}`);
  });

  const afterAvatars = await page.$$eval('rb-avatar', els => els.map(el => ({
    src: el.getAttribute('src'), token: el.getAttribute('token')?.slice(0, 8), size: el.getAttribute('size'),
  })));
  console.log('\nAvatars AFTER upload:', JSON.stringify(afterAvatars));

  console.log('\n--- COMPARISON ---');
  for (let i = 0; i < Math.max(beforeAvatars.length, afterAvatars.length); i++) {
    const b = beforeAvatars[i], a = afterAvatars[i];
    const changed = b?.src !== a?.src;
    console.log(`  [${i}] size=${a?.size || '?'}: ${changed ? 'UPDATED ✅' : 'STALE ❌'}`);
    console.log(`       before: ${(b?.src || '(none)').slice(0, 60)}`);
    console.log(`       after:  ${(a?.src || '(none)').slice(0, 60)}`);
  }

  // Check if overlay is still open or closed
  const overlayStillOpen = await page.evaluate(() => {
    for (const child of document.body.children) {
      if (child.querySelector?.('.overlay')) return true;
    }
    return false;
  });
  console.log('\nOverlay still open after upload:', overlayStillOpen);

  consoleLogs.filter(l => l.includes('AVATAR') || l.includes('avatar') || l.includes('Upload') || l.includes('upload') || l.includes('Error') || l.includes('error') || l.includes('failed')).forEach(l => console.log('  ' + l));

  await browser.close();
  console.log('\nScreenshots:', OUT);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
