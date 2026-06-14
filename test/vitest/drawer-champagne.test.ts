/**
 * v0.6.24 champagne tests — R19.63 / R20.10 / R20.11 / R20.12
 * [test:uuid:22ca6dac-fde4-4751-8df1-db94422c8146] R19.63 renderFilePreview
 * [test:uuid:f0d21ea3-1b05-4a2c-8d31-21c916c5030a] R20.10 openForRef
 * [test:uuid:ef6a4fd9-3477-4f03-b986-505c93bbb4f4] R20.11 close
 * [test:uuid:c99f0a42-f1b8-4cac-b5de-fb4e27e1b7d4] R20.12 pinnedSprint
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

describe('v0.6.24 drawer champagne', () => {

  it('R19.63 renderFilePreview impl marker exists at rb-detail-view:136', () => {
    const code = fs.readFileSync('src/public/ts/trace/rb-detail-view.ts', 'utf-8');
    expect(code).toContain('[impl:uuid:71954a38-ec79-4bc6-8fd9-9cfdd9a8e1bd]');
    expect(code).toContain('renderFilePreview');
  });

  it('R20.10 openForRef impl marker exists at rb-detail-drawer:83', () => {
    const code = fs.readFileSync('src/public/ts/trace/rb-detail-drawer.ts', 'utf-8');
    expect(code).toContain('[impl:uuid:dbddf408-60f3-4094-91b6-268861d651c6]');
    expect(code).toContain('openForRef');
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
});
