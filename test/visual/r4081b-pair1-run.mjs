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

async function capture(commit, out) {
  const f = await setupFoundation({ commit });
  try {
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
