// R40.4-phase2 GUARD 2 (architect §41 'consistency-checked' made concrete) — every Sprint unit's EFFECTIVE slug
// (stored model.slug, else slugify(name)) MUST resolve to an EXISTING sprint directory. This is the slug↔dir coupling
// gate: a stored slug that drifts off its dir, or a name-change that breaks a derived slug, is caught HERE (RED) instead
// of crashing the MD generator with ENOENT. stub-must-fail: mutate a slug off its dir → RED. Registered in ci:gates:raw.
// Run: node --import tsx scripts/check-sprint-slug-dir.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPRINTS_DIR = path.join(ROOT, 'scrum.pmo/sprints');
// EXACT parity with generate-sprint-md speakingSlug's name-derivation.
export const slugify = (name: string): string => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const dirExists = (slug: string): boolean => { try { return !!slug && fs.statSync(path.join(SPRINTS_DIR, slug)).isDirectory(); } catch { return false; } };

export interface SlugFinding { uuid: string; name: string; effectiveSlug: string; stored: boolean; }
export function scanSprintSlugDirs(idx: ScenarioIndex): SlugFinding[] {
  const bad: SlugFinding[] = [];
  for (const u of [...idx.list()].map((x) => idx.get(x)!).filter((x) => x && x.ior === 'ior:class:Sprint')) {
    const m = u.model as Record<string, unknown>;
    const stored = m.slug ? String(m.slug) : '';
    const effectiveSlug = stored || slugify(String(m.name || ''));
    if (!dirExists(effectiveSlug)) bad.push({ uuid: String(m.uuid), name: String(m.name || ''), effectiveSlug, stored: !!stored });
  }
  return bad;
}

// SELF-BITE: the detector MUST flag a non-existent-dir slug (else the gate is inert).
const biteDetects = !dirExists('definitely-not-a-real-sprint-dir-xyz') && dirExists.length >= 0; // dirExists returns false for a bogus slug → a planted bad slug WOULD be caught

if (process.argv[1] && /check-sprint-slug-dir\.(ts|js|mjs)$/.test(process.argv[1])) {
  if (!biteDetects) { console.error('✗ check-sprint-slug-dir: SELF-BITE FAILED — detector no longer flags a bogus slug. INERT. RED.'); process.exit(1); }
  const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
  const bad = scanSprintSlugDirs(idx);
  if (bad.length) {
    console.error(`✗ check-sprint-slug-dir: ${bad.length} Sprint unit(s) whose slug does NOT resolve to an existing dir (ENOENT risk in the MD generator):`);
    for (const f of bad) console.error(`  ${f.uuid.slice(0, 8)} "${f.name}" → ${f.stored ? 'stored' : 'derived'} slug "${f.effectiveSlug}" (no dir)`);
    process.exit(1);
  }
  console.log('✓ check-sprint-slug-dir — every Sprint slug (stored or derived) resolves to an existing dir (self-BITE: bogus slug flagged ✓).');
}
