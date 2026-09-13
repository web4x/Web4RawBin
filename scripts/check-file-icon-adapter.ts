/**
 * [test:uuid:c5749bef] Test — FILE_TOKEN_ICONS token→SVG adapter (impl 199105f8).
 * Sprint 41 (T41.1 inc-4 adapter) — the /model thin VIEW adapter maps a File's semantic icon TOKEN → an SVG glyph.
 * This gate proves the map is TOTAL over the File vocabulary (every FileIconToken → a non-empty SVG, NEVER blank) and
 * that it is a glyph adapter (SVG), not the model. A missing token = a blank icon on Tron's tree = a regression.
 * stub-must-fail: drop a token entry / return '' → this gate exits 1 (RED).
 */
import { FILE_TOKEN_ICONS, fileIconGlyph } from '../src/public/ts/trace/icons.js';

const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };
// The File vocabulary (must match src/ts/scenario/file.ts FileIconToken) — the adapter must cover EVERY category.
const VOCAB = ['image', 'audio', 'video', 'document', 'archive', 'code', 'data', 'generic'] as const;

for (const token of VOCAB) {
  const glyph = (FILE_TOKEN_ICONS as Record<string, string>)[token];
  if (!glyph || !glyph.trim()) fail(`FILE_TOKEN_ICONS missing/blank for token '${token}' — a File in that category would render blank on the /model tree (regression).`);
  if (!/^<svg[\s>]/.test(glyph) || !/<(path|rect|circle|polyline|ellipse|line)/.test(glyph)) fail(`FILE_TOKEN_ICONS['${token}'] is not a real SVG glyph (adapter maps token→SVG, consistent with the tree's SVG siblings).`);
}
// no EXTRA tokens beyond the vocabulary (drift guard) + no gaps
const keys = Object.keys(FILE_TOKEN_ICONS).sort();
if (keys.join(',') !== [...VOCAB].sort().join(',')) fail(`FILE_TOKEN_ICONS keys [${keys}] must equal the File vocabulary [${[...VOCAB].sort()}] exactly (no gaps, no drift).`);

// fileIconGlyph() is the BEHAVIOUR that OWNS the never-blank guarantee (a raw map lets a caller index past it): token
// in → SVG out, and an out-of-vocabulary token → the 'generic' glyph, NEVER blank/undefined.
for (const token of VOCAB) { const g = fileIconGlyph(token); if (!g || !/^<svg/.test(g)) fail(`fileIconGlyph('${token}') must return an SVG.`); }
if (fileIconGlyph('nonsense-token' as never) !== FILE_TOKEN_ICONS.generic) fail('fileIconGlyph(unknown) must fall back to the generic glyph — never blank (the guarantee a raw map cannot make).');

console.log(`✓ Sprint 41 T41.1 inc-4 adapter: fileIconGlyph() owns token→SVG over {${VOCAB.join(',')}} + unknown→generic (never blank); FILE_TOKEN_ICONS total, no drift.`);
