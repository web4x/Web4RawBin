/**
 * Flush PWA Cache button — verifies sw.js offline page has the flush affordance
 * [test:uuid:b42c8d93-e5f6-4a7b-8c9d-1f2a3b4c5d6e] R19.45 flush PWA cache
 *
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
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

  it('[impl:uuid:fd5059c5] marker present', () => {
    expect(swSrc).toContain('[impl:uuid:fd5059c5');
  });
});
