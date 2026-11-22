/**
 * v0.6.24 champagne tests — R19.63 / R20.10 / R20.11 / R20.12
 * [test:uuid:f0d21ea3-1b05-4a2c-8d31-21c916c5030a] R20.10 openForRef
 * [test:uuid:ef6a4fd9-3477-4f03-b986-505c93bbb4f4] R20.11 close
 * [test:uuid:c99f0a42-f1b8-4cac-b5de-fb4e27e1b7d4] R20.12 pinnedSprint
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

describe('v0.6.24 drawer champagne', () => {

  // R19.63 renderFilePreview: removed in R35.1 (dead file-type fallback, see rb-detail-view.ts:101) — test deleted (Sprint 42 T42.4)

  it('R20.10 renderDetailForRef impl marker exists at rb-detail-drawer:83', () => {
    const code = fs.readFileSync('src/public/ts/trace/rb-detail-drawer.ts', 'utf-8');
    expect(code).toContain('[impl:uuid:dbddf408-60f3-4094-91b6-268861d651c6]');
    expect(code).toContain('renderDetailForRef');
  });

  it('R20.11 close impl exists at rb-detail-drawer:108', () => {
    const code = fs.readFileSync('src/public/ts/trace/rb-detail-drawer.ts', 'utf-8');
    expect(code).toContain('[impl:uuid:2e4ff35c-6286-4400-a2c8-d6ebfde62638]');
    expect(code).toContain('close');
  });

  it('R20.12 CurrentSprint module exists with setChain+pinCurrent+advance+getActiveChain', () => {
    const code = fs.readFileSync('src/ts/scenario/CurrentSprint.ts', 'utf-8');
    expect(code).toContain('setChain');
    expect(code).toContain('pinCurrent');
    expect(code).toContain('advance');
    expect(code).toContain('getActiveChain');
    expect(code).toContain('PinData');
  });

  // BUG8 collectionDetail: the marker + wrapper lookup were replaced by RbDetailBase synthetic-ref resolution in R37.24 (e55e5de7e) — test deleted (Sprint 42 T42.4)
});
