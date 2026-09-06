// R40.81 BEHAVIOUR-PAIR-1 RUNNER (architect zero-code-drift control, PO+architect labelling directive f7af60999).
// ★ PAIR-1 = SLICE-1 TRANSPARENCY: 1d7462512 is DATA-ONLY (669 scenario/index files, 0 code). PRE = harness @1d7462512^
//   (669 ABSENT), POST = harness @1d7462512 (669 PRESENT), CODE BYTE-IDENTICAL both sides → confound gone, full 214, no
//   ref-drop, no snapshot-restore. EXPECTED GREEN and LOW-INFORMATION: pre-repoint readers still source MODEL_STORE, so
//   adding scenario/index copies must change NOTHING = 'nothing changed yet'. NECESSARY (catches an accidental early repoint
//   or a corrupted copy) but NOT proof the migration works. ★ THE DECISIVE PAIR IS PAIR-2 (Slice-2 same-code repoint, later).
//   ⛔ NEVER let a bare 'behaviour-pair GREEN' read as 'migration proven' — this is PAIR-1 only.
// ★ RED MEANING, DEFINED BEFORE THE RUN (cannot be reinterpreted after): RED = a reader ALREADY reads the relocated copies
//   pre-repoint = a real Slice-1 regression → STOP.
// ★ INSTRUMENT GUARD: the harness mof-m1 walk reads MODEL_STORE; if the scratch lacks data/model-store the model subtree comes
//   back empty → that is an INSTRUMENT GAP, reported as such, NEVER as GREEN.
import { setupFoundation } from './r4031-foundation.mjs';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const R = (v) => console.log(v);
const S = (x) => JSON.stringify(x);
const HARNESS = 'test/baseline/premigration-behavioural.mjs';
const BASELINE = 'test/baseline/premigration-behavioural.json';

const REPO = process.cwd();
const SNAP_TAR = `${REPO}/test/baseline/model-store-premigration-v0.8.186.tar.gz`; // architect's PINNED snapshot (784 units) — NOT cp-live
const lsScratch = () => new Set(fs.readdirSync('/tmp').filter((d) => d.startsWith('r4031-scratch-')));

async function capture(commit, out) {
  const before = lsScratch();
  const f = await setupFoundation({ commit });
  try {
    // ── SEED MODEL_STORE into the scratch (gitignored → absent from a commit build) via the PINNED snapshot TAR (architect ruling).
    //    TAR (never cp -a / cp -l / rsync --link-dest) so every file is a NEW inode — a hardlinked 'copy' shares the LIVE inode and
    //    the harness would write THROUGH to the MODEL_STORE we are mid-migrating (PO hazard). Identical-both-sides by construction.
    const scratchRoot = [...lsScratch()].filter((d) => !before.has(d)).map((d) => `/tmp/${d}`)[0];
    if (!scratchRoot) throw new Error('could not locate the new scratch root to seed MODEL_STORE');
    execSync(`tar xzf ${SNAP_TAR} -C ${scratchRoot}`);
    // ── PROVE ISOLATION (PO: verify inodes, do not trust the command). An existing MODEL_STORE file must have a DIFFERENT inode in
    //    scratch vs LIVE, else it is a passthrough hazard → ABORT before the harness can write through.
    const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = `${d}/${e.name}`; if (e.isDirectory()) { const r = walk(p); if (r) return r; } else if (e.name.endsWith('.scenario.json')) return p; } return null; };
    const scratchMS = `${scratchRoot}/data/model-store/index`, liveMS = `${REPO}/data/model-store/index`;
    const sample = walk(scratchMS);
    if (sample) { const rel = sample.slice(scratchMS.length); const liveFile = liveMS + rel;
      if (fs.existsSync(liveFile)) { const ss = fs.statSync(sample), ls = fs.statSync(liveFile);
        if (ss.ino === ls.ino || ss.nlink !== 1) throw new Error(`ISOLATION HAZARD (${commit}): scratch ${rel} inode=${ss.ino} nlink=${ss.nlink} vs live inode=${ls.ino} — same-inode or nlink>1 = hardlink passthrough → ABORT (would corrupt live MODEL_STORE)`);
        console.log(`  isolation PROVEN (${commit}): ${rel.split('/').pop()} scratch-inode=${ss.ino} (nlink=1) != live-inode=${ls.ino}`);
      } }
    execSync(`node ${HARNESS}`, { stdio: 'pipe', env: { ...process.env, BASE: f.base, SERVED_VERSION: commit } });
    fs.copyFileSync(BASELINE, out);
    return { base: f.base, sha: f.worktreeSha };
  } finally {
    try { execSync(`git checkout ${BASELINE}`); } catch {} // the harness CLOBBERS the committed baseline → restore it every time
    await f.teardown();
  }
}

R('═══ R40.81 PAIR-1 (Slice-1 transparency, 1d7462512^ vs 1d7462512 — zero code drift) ═══');
const pre = await capture('1d7462512^', '/tmp/boundary-pre.json');
const post = await capture('1d7462512', '/tmp/boundary-post.json');
R(`  PRE @1d7462512^ sha=${pre.sha} | POST @1d7462512 sha=${post.sha}`);

const PRE = JSON.parse(fs.readFileSync('/tmp/boundary-pre.json', 'utf8'));
const POST = JSON.parse(fs.readFileSync('/tmp/boundary-post.json', 'utf8'));
const preMof = (PRE.trees?.['mof-m1']?.children || []).length, postMof = (POST.trees?.['mof-m1']?.children || []).length;
if (!preMof || !postMof) { R(`  ⛔ INSTRUMENT GAP: mof-m1 children PRE=${preMof} POST=${postMof} — scratch lacks MODEL_STORE, model subtree empty. NOT a verdict (fix: ensure the foundation copies data/model-store into the scratch).`); process.exit(2); }

const allRefs = [...new Set([...Object.keys(PRE.trees), ...Object.keys(POST.trees)])];
const changed = allRefs.filter((r) => S(PRE.trees[r]) !== S(POST.trees[r]));
const onlyPre = allRefs.filter((r) => !(r in POST.trees)), onlyPost = allRefs.filter((r) => !(r in PRE.trees));
const alSame = S(PRE.authoredListings) === S(POST.authoredListings);
R(`  refs=${allRefs.length} mof-m1 children PRE=${preMof} POST=${postMof} | authoredListings ${alSame ? 'identical' : 'CHANGED'}`);
R(`  CHANGED listings : ${changed.length}  (onlyPRE=${onlyPre.length} onlyPOST=${onlyPost.length})`);
for (const r of changed.slice(0, 20)) { const a = PRE.trees[r], b = POST.trees[r]; R(`    ${r}: childCount ${a?.childCount}->${b?.childCount}`); }

const green = changed.length === 0 && !onlyPre.length && !onlyPost.length && alSame;
R(`  ── RESULT ──`);
R(`  PAIR-1 (Slice-1 transparency): ${green ? 'GREEN' : 'RED'}`);
R(`  ${green ? 'GREEN meaning: adding the 669 scenario/index copies changed NO read-path listing across all 214 (same code) = Slice-1 is TRANSPARENT. This is LOW-INFORMATION / necessary-not-sufficient — it proves \'nothing changed yet\', NOT that the migration works.' : 'RED meaning (pre-defined): a reader ALREADY reads the relocated copies pre-repoint = a real Slice-1 regression → STOP.'}`);
R(`  ⚠ THE DECISIVE PAIR IS PAIR-2 (Slice-2 same-code repoint) — NOT run here. Do NOT read this as \'migration proven\'.`);
process.exit(green ? 0 : 1);
