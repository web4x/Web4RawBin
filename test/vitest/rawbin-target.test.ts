/**
 * R42.1 tests-never-touch-prod — chain: R42.1 → UC rawbinTarget.resolve → RawbinTarget.resolveRawbinTarget
 */
import { describe, it, expect, vi } from 'vitest';
// @ts-expect-error — plain .mjs module without type declarations
import { resolveRawbinTarget } from '../../scripts/rawbin-target.mjs';

// [test:uuid:7877086e-5326-4a39-82f2-3e623906b2c4] test:RawbinTarget.resolveRawbinTarget
describe('R42.1 RawbinTarget.resolveRawbinTarget', () => {
  it('AC isolated-by-default: no env → isolated local server on 4445, never prod', () => {
    const warn = vi.fn();
    const t = resolveRawbinTarget({}, warn);
    expect(t).toEqual({ host: 'localhost', port: 4445, base: 'https://localhost:4445', wss: 'wss://localhost:4445', isProd: false });
    expect(warn).not.toHaveBeenCalled();
  });

  it('local host/port can be overridden without reaching prod', () => {
    const t = resolveRawbinTarget({ RAWBIN_HOST: '127.0.0.1', RAWBIN_PORT: '5555' }, vi.fn());
    expect(t.base).toBe('https://127.0.0.1:5555');
    expect(t.isProd).toBe(false);
  });

  it('AC prod-opt-in: RAWBIN_TARGET=prod reaches prod and warns', () => {
    const warn = vi.fn();
    const t = resolveRawbinTarget({ RAWBIN_TARGET: 'PROD' }, warn);
    expect(t.base).toBe('https://prod.wo-da.de:4444');
    expect(t.isProd).toBe(true);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('an unknown target value falls back to the isolated server (fail-closed)', () => {
    expect(resolveRawbinTarget({ RAWBIN_TARGET: 'production' }, vi.fn()).isProd).toBe(false);
  });
});
