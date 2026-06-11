/**
 * R19.52 Full-width drawer + R19.33 Sticky close X
 * [test:uuid:a7e34f12-8b5c-4d9e-a1f2-3c4d5e6f7a89] R19.52 detailDrawer.fullWidth
 * [test:uuid:c9f56d34-7a8b-4e1f-b2c3-4d5e6f7a8b90] R19.33 stickyClose pinned X
 */
import { describe, it, expect } from 'vitest';
import fsSync from 'node:fs';

const css = fsSync.readFileSync('src/public/app.css', 'utf-8');

describe('[test:uuid:a7e34f12] R19.52 detailDrawer.fullWidth', () => {
  it('desktop drawer has flex:1 min-width:300px (no 480px cap)', () => {
    expect(css).toContain('rb-detail-drawer');
    const desktopRule = css.match(/\.trace-page rb-detail-drawer \{[^}]+\}/);
    expect(desktopRule).toBeDefined();
    const rule = desktopRule![0];
    expect(rule).toContain('flex: 1');
    expect(rule).toContain('min-width: 300px');
    expect(rule).not.toContain('max-width: 480px');
  });

  it('[impl:uuid:da9462f5] marker present in app.css source context', () => {
    const src = fsSync.readFileSync('src/public/ts/trace/rb-detail-drawer.ts', 'utf-8');
    expect(src).toContain('drawer-header');
    expect(src).toContain('drawer-body');
  });
});

describe('[test:uuid:c9f56d34] R19.33 stickyClose pinned X', () => {
  it('.drawer-header has position:sticky + z-index:2 + min-height', () => {
    const headerRule = css.match(/\.drawer-header \{[^}]+\}/);
    expect(headerRule).toBeDefined();
    const rule = headerRule![0];
    expect(rule).toContain('position: sticky');
    expect(rule).toContain('z-index: 2');
    expect(rule).toContain('min-height: 36px');
  });

  it('.drawer-close button exists in template', () => {
    const src = fsSync.readFileSync('src/public/ts/trace/rb-detail-drawer.ts', 'utf-8');
    expect(src).toContain('drawer-close');
    expect(src).toContain('✕');
  });

  it('.drawer-body scrolls independently (overflow-y:auto)', () => {
    expect(css).toContain('.drawer-body');
    const bodyRule = css.match(/\.drawer-body \{[^}]+\}/);
    expect(bodyRule).toBeDefined();
    expect(bodyRule![0]).toContain('overflow-y: auto');
  });
});
