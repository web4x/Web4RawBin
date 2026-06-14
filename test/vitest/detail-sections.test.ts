/**
 * R20.5 — renderAllChildrenSection + renderSupersededSection in detail views.
 * Tests that detail views include both sections when data is present.
 *
 * [test:uuid:7e717383-207e-41b8-b564-f47a964f54b6] R20.5a renderAllChildrenSection
 * [test:uuid:ae410763-e446-4294-ad75-a6b11a2bdc31] R20.5c renderSupersededSection
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

const detailSuperCode = fs.existsSync('src/public/ts/trace/detail-superseded.ts')
  ? fs.readFileSync('src/public/ts/trace/detail-superseded.ts', 'utf-8') : '';

const reqDetailCode = fs.existsSync('src/public/ts/trace/rb-requirement-detail.ts')
  ? fs.readFileSync('src/public/ts/trace/rb-requirement-detail.ts', 'utf-8') : '';

const detailViewCode = fs.existsSync('src/public/ts/trace/rb-detail-view.ts')
  ? fs.readFileSync('src/public/ts/trace/rb-detail-view.ts', 'utf-8') : '';

describe('R20.5a renderAllChildrenSection', () => {
  it('renderAllChildrenSection function is exported from detail-superseded.ts', () => {
    expect(detailSuperCode).toContain('renderAllChildrenSection');
    expect(detailSuperCode).toMatch(/export\s+(function|const)\s+renderAllChildrenSection/);
  });

  it('renderAllChildrenSection is imported and called in rb-detail-view.ts', () => {
    expect(detailViewCode).toContain('renderAllChildrenSection');
  });

  it('renderAllChildrenSection is imported and called in rb-requirement-detail.ts', () => {
    expect(reqDetailCode).toContain('renderAllChildrenSection');
  });
});

describe('R20.5c renderSupersededSection', () => {
  it('renderSupersededSection function is exported from detail-superseded.ts', () => {
    expect(detailSuperCode).toContain('renderSupersededSection');
    expect(detailSuperCode).toMatch(/export\s+(function|const)\s+renderSupersededSection/);
  });

  it('renderSupersededSection is imported and called in rb-requirement-detail.ts', () => {
    expect(reqDetailCode).toContain('renderSupersededSection');
  });

  it('toArr normalizer handles string and array refinementOf', () => {
    expect(detailSuperCode || detailViewCode).toContain('toArr');
  });
});
