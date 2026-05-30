/**
 * vCard photo fix (commit 148e9b8, v0.5.14): downloadVCard must embed the PHOTO sourced
 * [test:uuid:40f20e19-71a5-47ff-9391-75661b520ed2] vCard photo fix
 * from the TOKEN (the same source the sheet's rb-avatar displays), NOT gated on the
 * possibly-empty profile.avatar string; the data-URL regex must accept svg+xml; and the
 * NOTE must carry the user's UUID.
 *
 * Drives the REAL ProfileSheet (private downloadVCard) via the #us-vcard click, capturing
 * the generated .vcf through a Blob stub, with fetch('/api/avatar/<token>') stubbed.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProfileSheet } from '../../src/public/ts/ProfileSheet.js';

// Capture the text passed to `new Blob([...])` inside downloadVCard.
let capturedVcf = '';
const RealBlob = globalThis.Blob;

function stubFetchReturning(contentType: string): void {
  const bytes = new Uint8Array(20000); // >10KB → exercises the loop-based base64 (no stack overflow)
  for (let i = 0; i < bytes.length; i++) bytes[i] = i & 0xff;
  (globalThis as any).fetch = vi.fn(async () => ({
    arrayBuffer: async () => bytes.buffer,
    headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? contentType : null) },
  }));
}

async function clickDownloadAndCapture(sheet: ProfileSheet): Promise<string> {
  capturedVcf = '';
  const btn = document.getElementById('us-vcard') as HTMLButtonElement;
  btn.click();
  // downloadVCard is async (awaits fetch); flush microtasks + a tick
  await new Promise((r) => setTimeout(r, 30));
  return capturedVcf;
}

describe('vCard photo + UUID (v0.5.14)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // capture Blob text; keep a real-ish shape
    (globalThis as any).Blob = class {
      constructor(parts: any[]) { capturedVcf = (parts || []).join(''); }
    };
    (globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:vcf');
    (globalThis as any).URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    (globalThis as any).Blob = RealBlob;
    vi.restoreAllMocks();
  });

  it('AC1: EMPTY profile.avatar + playerToken set → PHOTO sourced from token (TYPE=JPEG)', async () => {
    stubFetchReturning('image/jpeg');
    const sheet = new ProfileSheet({} as any);
    sheet.open({ name: 'Alice', phone: '', url: '', avatar: '', playerToken: 'tok-uuid-1' });

    const vcf = await clickDownloadAndCapture(sheet);

    // fetch went to the token endpoint, not gated on the empty avatar string
    expect((globalThis as any).fetch).toHaveBeenCalledWith('/api/avatar/tok-uuid-1');
    expect(vcf).toContain('PHOTO;ENCODING=b;TYPE=JPEG:');
    expect(vcf).toContain('BEGIN:VCARD');
    expect(vcf).toContain('FN:Alice');
  });

  it('AC2: content-type image/svg+xml → PHOTO line still present (regex accepts svg+xml)', async () => {
    stubFetchReturning('image/svg+xml');
    const sheet = new ProfileSheet({} as any);
    sheet.open({ name: 'Bob', phone: '', url: '', avatar: '', playerToken: 'tok-uuid-2' });

    const vcf = await clickDownloadAndCapture(sheet);

    expect(vcf).toMatch(/PHOTO;ENCODING=b;TYPE=SVG\+XML:/);
  });

  it('AC3: .vcf NOTE carries the user UUID', async () => {
    stubFetchReturning('image/jpeg');
    const sheet = new ProfileSheet({} as any);
    sheet.open({ name: 'Carol', phone: '', url: '', avatar: '', playerToken: 'tok-uuid-3' });

    const vcf = await clickDownloadAndCapture(sheet);

    expect(vcf).toContain('UUID: tok-uuid-3');
    expect(vcf).toMatch(/NOTE:RawBin User — UUID: tok-uuid-3/);
  });

  it('data: avatar is used directly without a fetch (no token round-trip)', async () => {
    stubFetchReturning('image/jpeg');
    const dataUrl = 'data:image/png;base64,' + Buffer.from('hello').toString('base64');
    const sheet = new ProfileSheet({} as any);
    sheet.open({ name: 'Dave', phone: '', url: '', avatar: dataUrl, playerToken: 'tok-uuid-4' });

    const vcf = await clickDownloadAndCapture(sheet);

    expect((globalThis as any).fetch).not.toHaveBeenCalled();
    expect(vcf).toContain('PHOTO;ENCODING=b;TYPE=PNG:');
  });

  it('phone + url included when present', async () => {
    stubFetchReturning('image/jpeg');
    const sheet = new ProfileSheet({} as any);
    sheet.open({ name: 'Eve', phone: '+49 123', url: 'https://eve.test', avatar: '', playerToken: 'tok-uuid-5' });

    const vcf = await clickDownloadAndCapture(sheet);

    expect(vcf).toContain('TEL:+49 123');
    expect(vcf).toContain('URL:https://eve.test');
    expect(vcf).toContain('END:VCARD');
  });

  it('fetch failure is silent — vCard still produced (without PHOTO), no throw', async () => {
    (globalThis as any).fetch = vi.fn(async () => { throw new Error('network'); });
    const sheet = new ProfileSheet({} as any);
    sheet.open({ name: 'Frank', phone: '', url: '', avatar: '', playerToken: 'tok-uuid-6' });

    const vcf = await clickDownloadAndCapture(sheet);

    expect(vcf).toContain('BEGIN:VCARD');
    expect(vcf).toContain('UUID: tok-uuid-6');
    expect(vcf).not.toContain('PHOTO;ENCODING'); // photo dropped silently, rest intact
  });
});
