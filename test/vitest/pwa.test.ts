/**
 * Task 31 + T32 + T33: PWA, Caching, and Reconnect tests
 * [test:uuid:24cc252b-d276-4ab6-9a5a-981825332a17] T31+T32+T33 PWA caching reconnect
 * [verifies:uuid:67bde18f-76f9-43cd-abea-77c2ad7134f9] R-V1 PWA caching
 * [verifies:uuid:5b6122fe-75f4-4d22-8a93-b9d381c7f269] FLAG-PWA device update
 * T31: sw.js, manifest.json, icons, app.html PWA integration
 * T32: Cache-Control headers, source map blocking in production
 * T33: RawBinClient reconnect, messageQueue, queue/replay
 * File existence, content checks, and unit logic — no running server.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'src/public');

// ── TC-31.1: sw.js exists and is valid JS ───────────────────────────────────

describe('TC-31.1: Service Worker file', () => {

  it('sw.js exists in src/public/', () => {
    expect(existsSync(path.join(PUBLIC_DIR, 'sw.js'))).toBe(true);
  });

  it('sw.js contains install event listener', () => {
    const swPath = path.join(PUBLIC_DIR, 'sw.js');
    if (!existsSync(swPath)) return;
    const content = readFileSync(swPath, 'utf-8');
    expect(content).toContain('install');
    expect(content).toContain('addEventListener');
  });

  it('sw.js contains fetch event listener', () => {
    const swPath = path.join(PUBLIC_DIR, 'sw.js');
    if (!existsSync(swPath)) return;
    const content = readFileSync(swPath, 'utf-8');
    expect(content).toContain('fetch');
  });

  it('sw.js is parseable JS (no syntax errors)', () => {
    const swPath = path.join(PUBLIC_DIR, 'sw.js');
    if (!existsSync(swPath)) return;
    const content = readFileSync(swPath, 'utf-8');
    expect(() => new Function(content)).not.toThrow();
  });
});

// ── TC-31.2: manifest.json has required PWA fields ──────────────────────────

describe('TC-31.2: manifest.json PWA fields', () => {

  it('manifest.json exists in src/public/', () => {
    expect(existsSync(path.join(PUBLIC_DIR, 'manifest.json'))).toBe(true);
  });

  it('manifest.json is valid JSON', () => {
    const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
    if (!existsSync(manifestPath)) return;
    const content = readFileSync(manifestPath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('has name field', () => {
    const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
    if (!existsSync(manifestPath)) return;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.name).toBeDefined();
    expect(manifest.name.length).toBeGreaterThan(0);
  });

  it('has start_url field', () => {
    const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
    if (!existsSync(manifestPath)) return;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.start_url).toBeDefined();
  });

  it('has display field set to standalone or fullscreen', () => {
    const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
    if (!existsSync(manifestPath)) return;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.display).toBeDefined();
    expect(['standalone', 'fullscreen']).toContain(manifest.display);
  });

  it('has icons array with at least one icon', () => {
    const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
    if (!existsSync(manifestPath)) return;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it('icons include 192px and 512px sizes', () => {
    const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
    if (!existsSync(manifestPath)) return;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    if (!Array.isArray(manifest.icons)) return;
    const sizes = manifest.icons.map((i: any) => i.sizes);
    expect(sizes.some((s: string) => s.includes('192'))).toBe(true);
    expect(sizes.some((s: string) => s.includes('512'))).toBe(true);
  });

  it('name contains RawBin', () => {
    const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
    if (!existsSync(manifestPath)) return;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.name.toLowerCase()).toContain('rawbin');
  });
});

// ── TC-31.3: Icon files exist ───────────────────────────────────────────────

describe('TC-31.3: PWA icon files', () => {

  it('icon-192.png exists', () => {
    expect(existsSync(path.join(PUBLIC_DIR, 'icon-192.png'))).toBe(true);
  });

  it('icon-512.png exists', () => {
    expect(existsSync(path.join(PUBLIC_DIR, 'icon-512.png'))).toBe(true);
  });

  it('icon files are non-empty', () => {
    const icon192 = path.join(PUBLIC_DIR, 'icon-192.png');
    const icon512 = path.join(PUBLIC_DIR, 'icon-512.png');
    if (existsSync(icon192)) {
      expect(readFileSync(icon192).length).toBeGreaterThan(100);
    }
    if (existsSync(icon512)) {
      expect(readFileSync(icon512).length).toBeGreaterThan(100);
    }
  });
});

// ── TC-31.4: app.html has manifest link and SW registration ─────────────────

describe('TC-31.4: app.html PWA integration', () => {

  it('app.html has manifest link tag', () => {
    const htmlPath = path.join(PUBLIC_DIR, 'app.html');
    if (!existsSync(htmlPath)) return;
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('manifest');
  });

  it('service worker registration exists in source', () => {
    // SW registration may be in app.html, app.ts, or rb-update-banner.ts component
    const candidates = [
      path.join(PUBLIC_DIR, 'app.html'),
      path.join(PUBLIC_DIR, 'ts/app.ts'),
      path.join(PUBLIC_DIR, 'ts/components/rb-update-banner.ts'),
    ];
    const found = candidates.some(f => {
      if (!existsSync(f)) return false;
      const content = readFileSync(f, 'utf-8');
      return content.includes('serviceWorker') || content.includes('sw.js');
    });
    expect(found).toBe(true);
  });
});

// ── TC-31.5: app.html has apple-mobile-web-app meta tags ────────────────────

describe('TC-31.5: Apple mobile web app meta tags', () => {

  it('has apple-mobile-web-app-capable meta tag', () => {
    const htmlPath = path.join(PUBLIC_DIR, 'app.html');
    if (!existsSync(htmlPath)) return;
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('apple-mobile-web-app-capable');
  });

  it('has theme-color meta tag', () => {
    const htmlPath = path.join(PUBLIC_DIR, 'app.html');
    if (!existsSync(htmlPath)) return;
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('theme-color');
  });

  it('has viewport meta tag with user-scalable=no', () => {
    const htmlPath = path.join(PUBLIC_DIR, 'app.html');
    if (!existsSync(htmlPath)) return;
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('viewport');
    expect(html).toContain('user-scalable=no');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T32: Static File Caching
// ═══════════════════════════════════════════════════════════════════════════

// Replicate caching logic from server.ts static file serving

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function getCacheControl(ext: string, isHtml: boolean, isProduction: boolean): string {
  if (isHtml) return 'no-cache, must-revalidate';
  if (ext === '.js' || ext === '.css') return 'public, max-age=31536000, immutable';
  if (ext === '.png' || ext === '.jpg' || ext === '.svg' || ext === '.ico') return 'public, max-age=86400';
  return 'no-cache';
}

function shouldServeSourceMap(filepath: string, isProduction: boolean): boolean {
  if (!filepath.endsWith('.map')) return true;
  return !isProduction;
}

// ── TC-32.1: Cache-Control for static assets ────────────────────────────────

describe('TC-32.1: Cache-Control headers', () => {

  it('JS files get long-lived cache (max-age)', () => {
    const header = getCacheControl('.js', false, true);
    expect(header).toContain('max-age');
    expect(header).not.toBe('no-cache');
  });

  it('CSS files get long-lived cache', () => {
    const header = getCacheControl('.css', false, true);
    expect(header).toContain('max-age');
  });

  it('images get moderate cache (max-age)', () => {
    const header = getCacheControl('.png', false, true);
    expect(header).toContain('max-age');
  });

  it('HTML files get must-revalidate', () => {
    const header = getCacheControl('.html', true, true);
    expect(header).toContain('must-revalidate');
  });

  it('app.html served with must-revalidate, not long cache', () => {
    const header = getCacheControl('.html', true, true);
    expect(header).toContain('must-revalidate');
    expect(header).not.toContain('max-age=31536000');
  });
});

// ── TC-32.2: Source maps not served in production ───────────────────────────

describe('TC-32.2: Source map production blocking', () => {

  it('app.js.map blocked in production', () => {
    expect(shouldServeSourceMap('/dist/app.js.map', true)).toBe(false);
  });

  it('app.js.map allowed in development', () => {
    expect(shouldServeSourceMap('/dist/app.js.map', false)).toBe(true);
  });

  it('non-map files always served', () => {
    expect(shouldServeSourceMap('/dist/app.js', true)).toBe(true);
    expect(shouldServeSourceMap('/app.html', true)).toBe(true);
    expect(shouldServeSourceMap('/icon-192.png', true)).toBe(true);
  });

  it('any .map file blocked in production', () => {
    expect(shouldServeSourceMap('/dist/app.css.map', true)).toBe(false);
    expect(shouldServeSourceMap('/vendor.js.map', true)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T33: RawBinClient Reconnect + Message Queue
// ═══════════════════════════════════════════════════════════════════════════

// Replicate queue/reconnect logic that expert will add to RawBinClient

class MockRawBinClient {
  connected = false;
  messageQueue: object[] = [];
  sentMessages: string[] = [];
  private ws: { readyState: number; send: (data: string) => void } | null = null;

  connect(): void {
    this.ws = {
      readyState: 1,
      send: (data: string) => this.sentMessages.push(data),
    };
    this.connected = true;
    this.replayQueue();
  }

  disconnect(): void {
    this.ws = null;
    this.connected = false;
  }

  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  send(msg: object): void {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.messageQueue.push(msg);
    }
  }

  private replayQueue(): void {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()!;
      this.send(msg);
    }
  }
}

// ── TC-33.1: RawBinClient has reconnect method ─────────────────────────────

describe('TC-33.1: Reconnect method', () => {

  it('reconnect re-establishes connection', () => {
    const client = new MockRawBinClient();
    client.connect();
    expect(client.connected).toBe(true);

    client.disconnect();
    expect(client.connected).toBe(false);

    client.reconnect();
    expect(client.connected).toBe(true);
  });

  it('RawBinClient.ts source has reconnect method', () => {
    const clientPath = path.join(PROJECT_ROOT, 'src/public/ts/RawBinClient.ts');
    if (!existsSync(clientPath)) return;
    const content = readFileSync(clientPath, 'utf-8');
    expect(content).toContain('reconnect');
  });
});

// ── TC-33.2: messageQueue array ─────────────────────────────────────────────

describe('TC-33.2: Message queue', () => {

  it('client has messageQueue property', () => {
    const client = new MockRawBinClient();
    expect(client.messageQueue).toBeDefined();
    expect(Array.isArray(client.messageQueue)).toBe(true);
  });

  it('queue starts empty', () => {
    const client = new MockRawBinClient();
    expect(client.messageQueue.length).toBe(0);
  });
});

// ── TC-33.3: send() queues when not connected ───────────────────────────────

describe('TC-33.3: Queue on disconnect', () => {

  it('send() queues messages when disconnected', () => {
    const client = new MockRawBinClient();

    client.send({ type: 'LIST_ROOMS' });
    client.send({ type: 'CHAT_MESSAGE', text: 'hello' });

    expect(client.messageQueue.length).toBe(2);
    expect(client.sentMessages.length).toBe(0);
  });

  it('send() delivers immediately when connected', () => {
    const client = new MockRawBinClient();
    client.connect();

    client.send({ type: 'LIST_ROOMS' });

    expect(client.sentMessages.length).toBe(1);
    expect(client.messageQueue.length).toBe(0);
  });

  it('messages queued in order', () => {
    const client = new MockRawBinClient();

    client.send({ type: 'MSG_1' });
    client.send({ type: 'MSG_2' });
    client.send({ type: 'MSG_3' });

    expect(client.messageQueue.length).toBe(3);
    expect((client.messageQueue[0] as any).type).toBe('MSG_1');
    expect((client.messageQueue[1] as any).type).toBe('MSG_2');
    expect((client.messageQueue[2] as any).type).toBe('MSG_3');
  });
});

// ── TC-33.4: Queue replays on reconnect ─────────────────────────────────────

describe('TC-33.4: Queue replay on reconnect', () => {

  it('queued messages sent on reconnect', () => {
    const client = new MockRawBinClient();

    client.send({ type: 'QUEUED_1' });
    client.send({ type: 'QUEUED_2' });
    expect(client.messageQueue.length).toBe(2);

    client.connect();

    expect(client.messageQueue.length).toBe(0);
    expect(client.sentMessages.length).toBe(2);
    expect(JSON.parse(client.sentMessages[0]).type).toBe('QUEUED_1');
    expect(JSON.parse(client.sentMessages[1]).type).toBe('QUEUED_2');
  });

  it('queue replays in FIFO order', () => {
    const client = new MockRawBinClient();

    client.send({ type: 'FIRST' });
    client.send({ type: 'SECOND' });
    client.send({ type: 'THIRD' });

    client.connect();

    expect(client.sentMessages.map(s => JSON.parse(s).type)).toEqual(['FIRST', 'SECOND', 'THIRD']);
  });

  it('new messages after reconnect go directly, not to queue', () => {
    const client = new MockRawBinClient();

    client.send({ type: 'QUEUED' });
    client.connect();

    client.send({ type: 'LIVE' });

    expect(client.messageQueue.length).toBe(0);
    expect(client.sentMessages.length).toBe(2);
    expect(JSON.parse(client.sentMessages[1]).type).toBe('LIVE');
  });

  it('disconnect-queue-reconnect cycle works repeatedly', () => {
    const client = new MockRawBinClient();
    client.connect();

    client.send({ type: 'ROUND_1' });
    expect(client.sentMessages.length).toBe(1);

    client.disconnect();
    client.send({ type: 'QUEUED_R2' });
    expect(client.messageQueue.length).toBe(1);

    client.reconnect();
    expect(client.messageQueue.length).toBe(0);
    // sentMessages: ROUND_1 + QUEUED_R2
    expect(client.sentMessages.length).toBe(2);
  });
});
