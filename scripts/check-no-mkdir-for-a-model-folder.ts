/**
 * R40.88 — NO-MKDIR-FOR-A-MODEL-FOLDER guard (architect design-r40.88 767350ee9 + hardening ruling f506ac659; Tron R40.87:
 * a Folder is a MODEL object, not inherently a directory). A TRACEABILITY QUERY, not a linter. Enforce, do NOT document.
 *
 * SCAN THE HAZARD, NOT THE ACTORS (lift R40.82 check-children-single-owner 9ef91a551): the forbidden OPERATION names itself —
 * a physical user-directory creation reached for a MODEL folder. ONE NUMBER — nonOwnerMkdir + ungatedPhysCall == 0, gated
 * ONLY by the architect GATE list (never a self-attested in-file comment) — proves the IDIOMATIC hazard is absent + complete.
 *
 * ★ HARDENING (architect f506ac659, tester e1/e2/e3 — same honesty as R40.91's deleted "unevadable"): the HAZARD side is
 * unevadable but SUPPRESSION was gameable, now closed:
 *  - e3 CLOSED: a physical-create call-site suppresses ONLY if it is in the ARCHITECT-MAINTAINED GATE list below (file:line +
 *    reason + approvedBy, a SEPARATE number). A dev-added `// physicality-gated` comment does NOT suppress (self-attested =
 *    e3-gameable). Editing the GATE list = editing this guard = architect review (the validation, like R40.82 EXEMPT / R40.91 owner-marker).
 *  - e2 CLOSED: a `resolveFolderRefToDir()` in scope does NOT gate (its return was not proven used = a no-op falsely-gated).
 *  - e1 ACCEPTED RESIDUAL (written down): an ALIASED mkdir (`const mk = fsSync.mkdirSync; mk(t)`) evades — deliberate
 *    obfuscation, a sabotage threat model not idiomatic drift (mirrors R40.91's aliased-notify residual). NOT claimed unevadable.
 *  - the OWNER side stays validated by the SOLE-OWNER count: physical-folder-owner in exactly ONE file/method (two = RED), so a
 *    rogue cannot "own" its mkdir without tripping the 2-owner RED.
 * DRIFT-GUARD: every GATE entry's (file,line) must STILL be a physical-create call (a shifted line = stale list = FAIL LOUD),
 * so file:line cannot silently rot. Built-in self-bite runs every invocation (incl. e2/e3: an unlisted comment-marked /
 * discriminator-in-scope call STAYS red; a listed call suppresses). Registered in ci:gates:raw.
 * Run: node --import tsx scripts/check-no-mkdir-for-a-model-folder.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src', 'ts');
const HAZARD_MKDIR = /\bmkdirSync\s*\(/;                                   // physical dir creation
const SHARD_EXCLUDE = /recursive:\s*true/;                                 // store-shard unit-JSON layout — NOT a user folder
const PHYS_CALL = /\b(createPhysicalWithUnit|createPhysicalFolder)\s*\(/;  // the physical-create path (call OR def)
const PHYS_DEF = /\bstatic\s+(createPhysicalWithUnit|createPhysicalFolder)\s*\(/; // the DEFINITION (not a call-site)
const OWNER_MARK = /physical-folder-owner/;                                // the ONE mkdir owner (createPhysicalFolder) — sole-owner-count validated
const OWNER_SCOPE = 30; // lines below the owner marker that count as the owner method body (its non-recursive mkdir is the owner's)

// ★ ARCHITECT-MAINTAINED GATE list — the ONLY thing that suppresses a physical-create call-site (e3 fix: NOT an in-file
// comment). Each entry: file:line + a `call` matcher (drift-guard) + reason + approvedBy. Reported as a SEPARATE number.
// Add/change ONLY by an architect ruling (editing this list = editing the guard = review). A physical-create call NOT here = RED.
const GATE: { file: string; line: number; call: RegExp; reason: string; approvedBy: string }[] = [
  { file: 'src/ts/server/server.ts', line: 2953, call: /createPhysicalWithUnit/, reason: 'model add-folder router — physicality-gated by isVirtualModelParent/resolveFolderRefToDir (R40.87-B); real-dir parent only reaches here', approvedBy: 'architect f506ac659' },
  { file: 'src/ts/server/FolderService.ts', line: 167, call: /createPhysicalFolder/, reason: 'createPhysicalWithUnit delegating to the physical-create core, downstream of the model physicality gate', approvedBy: 'architect f506ac659' },
  { file: 'src/ts/server/RoomFilesService.ts', line: 47, call: /createPhysicalFolder/, reason: 'room-folder-is-physical-by-construction (a room folder IS a real fs dir under getRoomDir(creator)/files, never a model folder)', approvedBy: 'architect f506ac659 (amends 0c9acf712: GATE-list, not a bare comment)' },
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === 'dist' ? [] : walk(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}
const rel = (f: string) => f.replace(ROOT, 'src/ts');
const isGated = (gate: typeof GATE, file: string, line: number) => gate.some((g) => g.file === file && g.line === line);
// strip block+line comments so a PROSE mention can't false-flag AND (e3) a `// physicality-gated` comment cannot gate.
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, '$1');

interface Site { file: string; line: number; text: string; }

function scan(files: Array<{ file: string; src: string }>, gate: typeof GATE): { ownerMarkFiles: Set<string>; nonOwnerMkdir: Site[]; ungatedPhysCall: Site[]; gateListed: Site[] } {
  const ownerMarkFiles = new Set<string>();
  const nonOwnerMkdir: Site[] = [];
  const ungatedPhysCall: Site[] = [];
  const gateListed: Site[] = [];
  for (const { file, src } of files) {
    const raw = src.split('\n');
    const code = stripComments(src).split('\n');
    if (raw.some((l) => OWNER_MARK.test(l))) ownerMarkFiles.add(rel(file)); // owner marker lives in a COMMENT → RAW
    const ownerMarkLine = raw.findIndex((l) => OWNER_MARK.test(l));
    for (let i = 0; i < code.length; i++) {
      const line = code[i];
      if (HAZARD_MKDIR.test(line) && !SHARD_EXCLUDE.test(line)) {
        const ownedHere = ownerMarkLine >= 0 && i >= ownerMarkLine && i - ownerMarkLine <= OWNER_SCOPE;
        if (!ownedHere) nonOwnerMkdir.push({ file: rel(file), line: i + 1, text: raw[i].trim().slice(0, 88) });
      }
      if (PHYS_CALL.test(line) && !PHYS_DEF.test(line)) {
        const site: Site = { file: rel(file), line: i + 1, text: raw[i].trim().slice(0, 88) };
        if (isGated(gate, rel(file), i + 1)) gateListed.push(site); else ungatedPhysCall.push(site); // ONLY the GATE list suppresses (no comment, no discriminator)
      }
    }
  }
  return { ownerMarkFiles, nonOwnerMkdir, ungatedPhysCall, gateListed };
}

// DRIFT-GUARD: every GATE entry's (file,line) must STILL hold the sanctioned physical-create call — else the list is stale.
function driftStale(gate: typeof GATE): string[] {
  const stale: string[] = [];
  for (const g of gate) {
    try {
      const lines = readFileSync(join(ROOT, '..', '..', g.file), 'utf8').split('\n'); // ROOT = repo/src/ts → ../.. = repo
      const ln = lines[g.line - 1] || '';
      if (!PHYS_CALL.test(stripComments(ln)) || !g.call.test(ln)) stale.push(`${g.file}:${g.line} no longer a ${g.call.source} call — GATE list is STALE (line drifted)`);
    } catch (e) { stale.push(`${g.file}:${g.line} unreadable (${(e as Error).message})`); }
  }
  return stale;
}

// ---- BUILT-IN SELF-BITE (runs every invocation): the detector MUST discriminate incl. the e2/e3 hardening ----
function selfBite(): void {
  const TEST_GATE = [{ file: 'x/legit.ts', line: 2, call: /createPhysicalFolder/, reason: 't', approvedBy: 't' }];
  const owner = { file: 'x/owner.ts', src: '// [physical-folder-owner]\nstatic createPhysicalFolder(o){\n  fsSync.mkdirSync(target);\n  fsSync.mkdirSync(path.dirname(f), { recursive: true });\n}' };
  const plantMkdir = { file: 'x/rogue.ts', src: 'fsSync.mkdirSync(userTarget);' };                       // MUST flag: non-owner mkdir
  const plantCall = { file: 'x/rogue2.ts', src: 'FolderService.createPhysicalFolder({p, name});' };      // MUST flag: unlisted PHYS_CALL
  const e3Comment = { file: 'x/e3.ts', src: '// physicality-gated: room-folder-is-physical-by-construction\nFolderService.createPhysicalFolder({p});' }; // e3: comment does NOT suppress → STILL RED
  const e2Discr = { file: 'x/e2.ts', src: 'const d = resolveFolderRefToDir(parent);\nFolderService.createPhysicalFolder({p});' };                      // e2: no-op discriminator does NOT gate → STILL RED
  const listed = { file: 'x/legit.ts', src: 'x\nFolderService.createPhysicalFolder({p});' };             // line 2, in TEST_GATE → suppressed
  const proseOnly = { file: 'x/doc.ts', src: '// mkdirSync(target) and createPhysicalFolder( described here only' };  // MUST NOT flag
  const r = scan([owner, plantMkdir, plantCall, e3Comment, e2Discr, listed, proseOnly], TEST_GATE);
  const F: string[] = [];
  const inUn = (f: string) => r.ungatedPhysCall.some((s) => s.file === f);
  if (r.nonOwnerMkdir.some((s) => s.file === 'x/owner.ts')) F.push('owner mkdir wrongly flagged');
  if (!r.nonOwnerMkdir.some((s) => s.file === 'x/rogue.ts')) F.push('planted non-owner mkdir NOT caught');
  if (!inUn('x/rogue2.ts')) F.push('planted unlisted PHYS_CALL NOT caught');
  if (!inUn('x/e3.ts')) F.push('e3 REGRESSION — a // physicality-gated comment suppressed an unlisted call (must stay RED)');
  if (!inUn('x/e2.ts')) F.push('e2 REGRESSION — a resolveFolderRefToDir() in scope gated an unlisted call (must stay RED)');
  if (inUn('x/legit.ts')) F.push('GATE-listed call wrongly flagged (listing must suppress)');
  if (!r.gateListed.some((s) => s.file === 'x/legit.ts')) F.push('GATE-listed call not counted as gateListed');
  if (r.nonOwnerMkdir.concat(r.ungatedPhysCall).some((s) => s.file === 'x/doc.ts')) F.push('prose mention false-flagged');
  if (r.ownerMarkFiles.size !== 1) F.push(`owner-mark files = ${r.ownerMarkFiles.size} (want 1 in the fixture)`);
  if (F.length) { console.error('✗ SELF-BITE FAILED — the detector is inert / mis-discriminates:\n' + F.map((x) => '  ✗ ' + x).join('\n')); process.exit(1); }
}

selfBite();
const stale = driftStale(GATE);
if (stale.length) { console.error('✗ GATE list STALE (drift) — an architect-sanctioned line no longer holds its physical-create call:\n' + stale.map((s) => '  ✗ ' + s).join('\n') + '\n  → update the GATE list line numbers (architect review).'); process.exit(1); }

const files = walk(ROOT).map((file) => ({ file, src: readFileSync(file, 'utf8') }));
const { ownerMarkFiles, nonOwnerMkdir, ungatedPhysCall, gateListed } = scan(files, GATE);

console.log(`=== R40.88 no-mkdir-for-a-model-folder (scan src/ts) ===`);
console.log(`nonOwnerMkdir: ${nonOwnerMkdir.length}  |  ungatedPhysCall: ${ungatedPhysCall.length}  |  GATE-listed physical-creates (architect-sanctioned): ${gateListed.length}  |  physical-folder-owner file(s): ${[...ownerMarkFiles].join(', ') || '(none!)'}`);
for (const s of gateListed) console.log(`  ⓘ gate-listed: ${s.file}:${s.line}  ${s.text}`);
for (const s of nonOwnerMkdir) console.log(`  ✗ non-owner mkdir: ${s.file}:${s.line}  ${s.text}`);
for (const s of ungatedPhysCall) console.log(`  ✗ ungated physical-create: ${s.file}:${s.line}  ${s.text}`);

let fail = false;
if (ownerMarkFiles.size === 0) { console.error('\n✗ physical-folder-owner marker on NO file — fail-closed (owner deleted / marker lost).'); fail = true; }
if (ownerMarkFiles.size > 1) { console.error(`\n✗ TWO owners: physical-folder-owner in ${ownerMarkFiles.size} files (${[...ownerMarkFiles].join(', ')}). Exactly ONE.`); fail = true; }
if (nonOwnerMkdir.length || ungatedPhysCall.length) { console.error(`\n✗ ${nonOwnerMkdir.length + ungatedPhysCall.length} physical folder-create(s) not sanctioned. A physical-create is legitimate ONLY inside the sole owner (mkdir) or on a GATE-listed call-site — route it + add an architect GATE entry (a // comment does NOT suppress).`); fail = true; }
if (fail) process.exit(1);
console.log(`\n✓ R40.88 GREEN — 0 non-sanctioned physical folder-creations (${gateListed.length} architect-GATE-listed, ${nonOwnerMkdir.length} rogue mkdir, ${ungatedPhysCall.length} ungated). A MODEL folder cannot get a mkdir; suppression is architect-validated (e2/e3 closed), e1 aliased-mkdir is accepted residual.`);
