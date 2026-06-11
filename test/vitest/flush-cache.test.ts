/**
 * Flush PWA Cache button — verifies sw.js offline page has the flush affordance
 *
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
// [test:uuid:919e6fa6-6c30-47a3-90f3-184abdb6f653]
// [test:uuid:14304a0c-01f4-4b09-9beb-303fadad2e92]
import fsSync from 'node:fs';
import path from 'node:path';

describe('flush PWA cache (R19.45)', () => {
  const swSrc = fsSync.readFileSync(path.join(__dirname, '../../src/public/sw.js'), 'utf-8');

  it('OFFLINE_HTML contains a flush button', () => {
    expect(swSrc).toContain('class="flush"');
    expect(swSrc).toContain('Flush Cache');
  });

  it('flushCache function deletes caches + unregisters SW', () => {
    expect(swSrc).toContain('flushCache');
    expect(swSrc).toContain('caches.delete');
    expect(swSrc).toContain('r.unregister()');
  });

  it('[impl:uuid:79505a42] marker present (Impl uuid)', () => {
    expect(swSrc).toContain('[impl:uuid:79505a42');
  });
});
