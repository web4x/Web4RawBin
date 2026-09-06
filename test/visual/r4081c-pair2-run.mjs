// R40.81 BEHAVIOUR-PAIR-2 RUNNER — THE DECISIVE PAIR (architect flag 81cc37755). Slice-2 repoint = readers switch MODEL_STORE
// → scenario/index behind ONE collapsed resolver honouring env MODEL_READ_SOURCE (model-store | scenario-index, default
// model-store). PAIR-2 = ONE build (the Slice-2 repoint commit) booted TWICE, same tar-seeded MODEL_STORE + same scenario/index,
// only the FLAG flips → TRUE same-code, zero drift: PRE = MODEL_READ_SOURCE=model-store, POST = MODEL_READ_SOURCE=scenario-index,
// diff the canonical 213-set byte-identical.
// ★ DECISIVE (NOT low-information like PAIR-1): GREEN = every unit ANSWERS byte-identical from the NEW store = the repoint is
//   transparent = the claim Slice-3 DELETION actually rests on. RED (pre-defined, cannot be reinterpreted after) = a unit answers
//   DIFFERENTLY from scenario/index than from MODEL_STORE → STOP, do NOT delete the source store.
// Same guards as PAIR-1: PINNED snapshot tar (never cp/hardlink), isolation PROVEN by inode+nlink BEFORE the harness, mof-m1
// NON-EMPTY (empty = INSTRUMENT GAP exit-2, never a green), clobber-safe baseline restore.
// ★ FILL IN when the architect pings the Slice-2 build: SLICE2_COMMIT (env or edit). Default HEAD with a loud warning.
import { setupFoundation } from './r4031-foundation.mjs';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const R = (v) => console.log(v);
const S = (x) => JSON.stringify(x);
const REPO = process.cwd();
const HARNESS = 'test/baseline/premigration-behavioural.mjs';
const BASELINE = 'test/baseline/premigration-behavioural.json';
const SNAP_TAR = `${REPO}/test/baseline/model-store-premigration-v0.8.186.tar.gz`;
const SLICE2_COMMIT = process.env.SLICE2_COMMIT || 'HEAD'; // ← set to the Slice-2 repoint commit that honours MODEL_READ_SOURCE
const CANON = `${REPO}/test/baseline/r40.81-behaviour-pair-canonical-213-set.txt`;
const lsScratch = () => new Set(fs.readdirSync('/tmp').filter((d) => d.startsWith('r4031-scratch-')));
if (SLICE2_COMMIT === 'HEAD') R('⚠ SLICE2_COMMIT unset → using HEAD. Set SLICE2_COMMIT=<repoint sha> once the architect pings the build, else this is not the decisive boundary.');

// boot the SAME build with the flag toggled; seed + prove isolation + guard; capture the 213-set listings
async function capture(flag, out) {
  const before = lsScratch();
  process.env.MODEL_READ_SOURCE = flag; // the ONLY thing that differs PRE vs POST — the reader source flips, code is identical
  const f = await setupFoundation({ commit: SLICE2_COMMIT });
  try {
    const scratchRoot = [...lsScratch()].filter((d) => !before.has(d)).map((d) => `/tmp/${d}`)[0];
    if (!scratchRoot) throw new Error('no new scratch root to seed MODEL_STORE');
    execSync(`tar xzf ${SNAP_TAR} -C ${scratchRoot}`); // PINNED snapshot (never cp/hardlink → new inodes → no live passthrough)
    const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = `${d}/${e.name}`; if (e.isDirectory()) { const r = walk(p); if (r) return r; } else if (e.name.endsWith('.scenario.json')) return p; } return null; };
    const scratchMS = `${scratchRoot}/data/model-store/index`, liveMS = `${REPO}/data/model-store/index`;
    const sample = walk(scratchMS);
    if (sample) { const rel = sample.slice(scratchMS.length); const liveFile = liveMS + rel;
      if (fs.existsSync(liveFile)) { const ss = fs.statSync(sample), ls = fs.statSync(liveFile);
        if (ss.ino === ls.ino || ss.nlink !== 1) throw new Error(`ISOLATION HAZARD (${flag}): scratch inode=${ss.ino} nlink=${ss.nlink} vs live ${ls.ino} — hardlink passthrough, ABORT`);
        R(`  isolation PROVEN (${flag}): scratch-inode=${ss.ino} (nlink=1) != live ${ls.ino}`); } }
    execSync(`node ${HARNESS}`, { stdio: 'pipe', env: { ...process.env, BASE: f.base, SERVED_VERSION: flag, MODEL_READ_SOURCE: flag } });
    fs.copyFileSync(BASELINE, out);
    return { base: f.base };
  } finally { try { execSync(`git checkout ${BASELINE}`); } catch {} await f.teardown(); delete process.env.MODEL_READ_SOURCE; }
}

R('═══ R40.81 PAIR-2 (Slice-2 repoint, DECISIVE — same code, MODEL_READ_SOURCE flip) ═══');
const pre = await capture('model-store', '/tmp/pair2-pre.json');   // readers on MODEL_STORE (pre-repoint)
const post = await capture('scenario-index', '/tmp/pair2-post.json'); // readers on scenario/index (post-repoint)
const PRE = JSON.parse(fs.readFileSync('/tmp/pair2-pre.json', 'utf8'));
const POST = JSON.parse(fs.readFileSync('/tmp/pair2-post.json', 'utf8'));
const preMof = (PRE.trees?.['mof-m1']?.children || []).length, postMof = (POST.trees?.['mof-m1']?.children || []).length;
if (!preMof || !postMof) { R(`  ⛔ INSTRUMENT GAP: mof-m1 children PRE=${preMof} POST=${postMof} — MODEL_STORE not seeded / resolver read nothing. NOT a verdict.`); process.exit(2); }

// canonical 213-set only (code-invariant here — same commit both sides — but the set keeps coverage explicit + auditable)
let canon = null; try { canon = fs.readFileSync(CANON, 'utf8').split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#')); } catch {}
const refs = canon || [...new Set([...Object.keys(PRE.trees), ...Object.keys(POST.trees)])];
const changed = refs.filter((r) => S(PRE.trees[r]) !== S(POST.trees[r]));
const alSame = S(PRE.authoredListings) === S(POST.authoredListings);
R(`  set=${refs.length} (${canon ? 'canonical file' : 'live union'}) mof-m1 PRE=${preMof} POST=${postMof} | authoredListings ${alSame ? 'identical' : 'CHANGED'}`);
R(`  CHANGED listings (a unit answers DIFFERENTLY from the new store) : ${changed.length}`);
for (const r of changed.slice(0, 20)) R(`    ${r}: PRE.childCount=${PRE.trees[r]?.childCount} POST.childCount=${POST.trees[r]?.childCount}`);

const green = changed.length === 0 && alSame;
R(`  ── RESULT ──`);
R(`  PAIR-2 (Slice-2 repoint, DECISIVE): ${green ? 'GREEN' : 'RED'}`);
R(`  ${green ? 'GREEN meaning: every unit in the 213-set ANSWERS BYTE-IDENTICAL whether the resolver reads MODEL_STORE or scenario/index = the repoint is TRANSPARENT = units answer the same from the NEW store. THIS is the decisive proof Slice-3 deletion rests on.' : 'RED meaning (pre-defined): a unit answers DIFFERENTLY from scenario/index than from MODEL_STORE → the repoint is NOT transparent → STOP, do NOT delete the source store.'}`);
process.exit(green ? 0 : 1);
