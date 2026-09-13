/**
 * Sprint 41 (T41.1 inc-4 adapter) — the /model thin VIEW adapter maps a File's semantic icon TOKEN → an SVG glyph.
 * This gate proves the map is TOTAL over the File vocabulary (every FileIconToken → a non-empty SVG, NEVER blank) and
 * that it is a glyph adapter (SVG), not the model. A missing token = a blank icon on Tron's tree = a regression.
 * stub-must-fail: drop a token entry / return '' → this gate exits 1 (RED).
 */
import { FILE_TOKEN_ICONS } from '../src/public/ts/trace/icons.js';

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

console.log(`✓ Sprint 41 T41.1 inc-4 adapter: FILE_TOKEN_ICONS is total over {${VOCAB.join(',')}} — every category → a non-empty SVG (never blank), no drift.`);
