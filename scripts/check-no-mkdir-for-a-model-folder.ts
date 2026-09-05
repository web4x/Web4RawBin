/**
 * R40.88 — NO-MKDIR-FOR-A-MODEL-FOLDER guard (architect design-r40.88 767350ee9; Tron ruling R40.87: a Folder is a MODEL
 * object, not inherently a directory). A TRACEABILITY QUERY, not a linter. Enforce, do NOT document.
 *
 * SCAN THE HAZARD, NOT THE ACTORS (lift R40.82 check-children-single-owner 9ef91a551): the forbidden OPERATION names
 * itself — a physical user-directory creation reached for a MODEL folder. ONE NUMBER — nonOwnerMkdir + ungatedPhysCall == 0,
 * reached BY ROUTING (never by exempting) — proves the IDIOMATIC hazard is absent + complete.
 *
 * ★ SCOPE (accurate, NOT "unevadable" — tester R40.88 e1/e2/e3, same honesty correction as R40.91's deleted "unevadable"):
 * the guard catches the hazard as it is IDIOMATICALLY spelled (a direct fsSync.mkdirSync(<userTarget>) / a bare
 * createPhysicalWithUnit|createPhysicalFolder call). ACCEPTED RESIDUAL (written down, PENDING architect ruling on design-r40.88):
 *  - e1 OBFUSCATION: an ALIASED mkdir (`const mk = fsSync.mkdirSync; mk(t)`) evades — a sabotage threat model, not idiomatic drift.
 *  - e2 NO-OP DISCRIMINATOR: a resolveFolderRefToDir() call in scope that does nothing FALSELY-GATES (the discriminator is
 *    trusted structurally, its return not proven used).
 *  - e3 SELF-ATTESTED MARKER (the notable one): the `physicality-gated` gate marker is a bare comment any site can add —
 *    NOT count/architect-validated like R40.91's owner-marker — so a rogue model mkdir can hide behind the comment.
 * The self-bite proves the IDIOMATIC forms only; it does NOT claim e1/e2/e3. Architect owns the hardening decision
 * (validate the marker/discriminator via a count or an architect-list, OR accept + keep this written-down residual).
 *
 * THE HAZARD, made precise + self-naming (design §"The hazard"):
 *  - HAZARD = a NON-recursive mkdirSync(<userTarget>) that is NOT inside the ONE physical-folder-owner
 *    (FolderService.createPhysicalFolder), OR a createPhysicalWithUnit/createPhysicalFolder CALL-site NOT reached through a
 *    physicality gate (the physicality-gated router marker OR the resolveFolderRefToDir discriminator in scope).
 *  - NOT the hazard = a store-shard `mkdirSync(path.dirname(f), { recursive: true })` laying out the unit-JSON file
 *    (distinguished STRUCTURALLY by recursive:true, never by a per-site exempt).
 *
 * GUARD-ON-THE-GUARD (carry R40.82): 0 by ROUTING never by EXEMPTING; no in-file exempt marker (exemptions live ONLY in
 * the architect-maintained EXEMPT list, reason+approvedBy, reported as a SEPARATE number); physical-folder-owner appears
 * in exactly ONE file/method (two = RED). Built-in self-bite runs every invocation (a detector that stops detecting FAILS
 * ITS OWN SELFTEST). Registered in ci:gates:raw.
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
const GATE_MARK = /physicality-gated/;                                     // the ONE router branch marker
const OWNER_MARK = /physical-folder-owner/;                                // the ONE mkdir owner (createPhysicalFolder)
const DISCRIMINATOR = /resolveFolderRefToDir\s*\(/;                        // the upstream physicality gate of a model PHYS_CALL
const SCOPE = 30; // lines of preceding context that count as "in scope" for a gate marker / discriminator (window, like R40.82)

// ★ ARCHITECT-ONLY exemptions — a site is exempt ONLY if listed HERE (never self-declared in-file). reason + approvedBy.
// Reported as a SEPARATE number, never folded into 0. Add ONLY after an architect+PO decision that a site is a distinct create.
const EXEMPT: { file: string; line: number; reason: string; approvedBy: string }[] = [
  // (empty) — 0 is by ROUTING. The room physical-create (RoomFilesService.addNestedFolder → createPhysicalFolder) is a
  // DISTINCT create (a real ROOM directory, gated by room membership + getRoomDir(creator), NOT the model discriminator) —
  // its treatment is an architect+PO design decision, surfaced by this guard, resolved by routing-mark or an entry here.
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === 'dist' ? [] : walk(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}
const rel = (f: string) => f.replace(ROOT, 'src/ts');
const isExempt = (f: string, ln: number) => EXEMPT.some((e) => e.file === rel(f) && e.line === ln);
// strip block+line comments so a PROSE mention of mkdirSync / createPhysicalFolder / the markers can't false-flag a real call.
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, '$1');

interface Site { file: string; line: number; text: string; }

function scan(files: Array<{ file: string; src: string }>): { ownerMarkFiles: Set<string>; nonOwnerMkdir: Site[]; ungatedPhysCall: Site[]; exempted: Site[] } {
  const ownerMarkFiles = new Set<string>();
  const nonOwnerMkdir: Site[] = [];
  const ungatedPhysCall: Site[] = [];
  const exempted: Site[] = [];
  for (const { file, src } of files) {
    const raw = src.split('\n');
    const code = stripComments(src).split('\n');
    // owner-marker lives in a COMMENT → search RAW; the marker file owns its downstream non-recursive mkdir.
    if (raw.some((l) => OWNER_MARK.test(l))) ownerMarkFiles.add(rel(file));
    const ownerMarkLine = raw.findIndex((l) => OWNER_MARK.test(l)); // -1 if none
    for (let i = 0; i < code.length; i++) {
      const line = code[i];
      // (1) non-recursive user mkdir NOT inside the owner
      if (HAZARD_MKDIR.test(line) && !SHARD_EXCLUDE.test(line)) {
        const ownedHere = ownerMarkLine >= 0 && i >= ownerMarkLine && i - ownerMarkLine <= SCOPE; // owner mkdir sits just below its marker/method
        if (!ownedHere && !isExempt(file, i + 1)) nonOwnerMkdir.push({ file: rel(file), line: i + 1, text: raw[i].trim().slice(0, 88) });
      }
      // (2) PHYS_CALL call-site (exclude the DEFINITION) NOT reached through a physicality gate
      if (PHYS_CALL.test(line) && !PHYS_DEF.test(line)) {
        const rawWin = raw.slice(Math.max(0, i - SCOPE), i + 1).join('\n');   // GATE_MARK lives in a COMMENT → search RAW (a physicality-gated marker states a by-construction gate, R40.88 room ruling 0c9acf712)
        const codeWin = code.slice(Math.max(0, i - SCOPE), i + 1).join('\n'); // DISCRIMINATOR is real code → search comment-stripped (a prose mention must not gate)
        const gated = GATE_MARK.test(rawWin) || DISCRIMINATOR.test(codeWin);
        const site: Site = { file: rel(file), line: i + 1, text: raw[i].trim().slice(0, 88) };
        if (gated) continue;
        if (isExempt(file, i + 1)) exempted.push(site); else ungatedPhysCall.push(site);
      }
    }
  }
  return { ownerMarkFiles, nonOwnerMkdir, ungatedPhysCall, exempted };
}

// ---- BUILT-IN SELF-BITE (runs every invocation): the detector MUST discriminate, or it FAILS its own selftest ----
function selfBite(): void {
  const owner = { file: 'x/owner.ts', src: '// [physical-folder-owner]\nstatic createPhysicalFolder(o){\n  fsSync.mkdirSync(target);\n  fsSync.mkdirSync(path.dirname(f), { recursive: true });\n}' };
  const gatedCall = { file: 'x/model.ts', src: 'const abs = resolveFolderRefToDir(parent);\nFolderService.createPhysicalWithUnit(S, name, parent);' };
  const markerGatedCall = { file: 'x/room.ts', src: '// [physicality-gated: room-folder-is-physical-by-construction]\nreturn FolderService.createPhysicalFolder({ parentAbsPath, name });' }; // MUST NOT flag: gated by the COMMENT marker (R40.88 room ruling), no resolveFolderRefToDir
  const plantMkdir = { file: 'x/rogue.ts', src: 'fsSync.mkdirSync(userTarget);' };            // MUST flag: non-owner user mkdir
  const plantCall = { file: 'x/rogue2.ts', src: 'FolderService.createPhysicalFolder({parentAbsPath, name});' }; // MUST flag: ungated PHYS_CALL
  const proseOnly = { file: 'x/doc.ts', src: '// mkdirSync(target) and createPhysicalFolder( are described here only' }; // MUST NOT flag
  const r = scan([owner, gatedCall, markerGatedCall, plantMkdir, plantCall, proseOnly]);
  const fails: string[] = [];
  if (r.nonOwnerMkdir.some((s) => s.file === 'x/owner.ts')) fails.push('owner mkdir wrongly flagged');
  if (!r.nonOwnerMkdir.some((s) => s.file === 'x/rogue.ts')) fails.push('planted non-owner mkdir NOT caught');
  if (r.ungatedPhysCall.some((s) => s.file === 'x/model.ts')) fails.push('discriminator-gated PHYS_CALL wrongly flagged');
  if (r.ungatedPhysCall.some((s) => s.file === 'x/room.ts')) fails.push('marker-gated PHYS_CALL wrongly flagged (comment marker not recognized)');
  if (!r.ungatedPhysCall.some((s) => s.file === 'x/rogue2.ts')) fails.push('planted ungated PHYS_CALL NOT caught');
  if (r.nonOwnerMkdir.concat(r.ungatedPhysCall).some((s) => s.file === 'x/doc.ts')) fails.push('prose mention false-flagged');
  if (r.ownerMarkFiles.size !== 1) fails.push(`owner-mark files = ${r.ownerMarkFiles.size} (want 1 in the fixture)`);
  if (fails.length) { console.error('✗ SELF-BITE FAILED — the detector is inert / mis-discriminates:\n' + fails.map((f) => '  ✗ ' + f).join('\n')); process.exit(1); }
}

selfBite();
const files = walk(ROOT).map((file) => ({ file, src: readFileSync(file, 'utf8') }));
const { ownerMarkFiles, nonOwnerMkdir, ungatedPhysCall, exempted } = scan(files);

console.log(`=== R40.88 no-mkdir-for-a-model-folder (scan src/ts) ===`);
console.log(`nonOwnerMkdir: ${nonOwnerMkdir.length}  |  ungatedPhysCall: ${ungatedPhysCall.length}  |  exempted (architect-approved): ${exempted.length}  |  physical-folder-owner file(s): ${[...ownerMarkFiles].join(', ') || '(none!)'}`);
for (const s of nonOwnerMkdir) console.log(`  ✗ non-owner mkdir: ${s.file}:${s.line}  ${s.text}`);
for (const s of ungatedPhysCall) console.log(`  ✗ ungated physical-create: ${s.file}:${s.line}  ${s.text}`);
for (const s of exempted) console.log(`  ⓘ exempt: ${s.file}:${s.line}  ${s.text}`);

let fail = false;
if (ownerMarkFiles.size === 0) { console.error('\n✗ physical-folder-owner marker is on NO file — fail-closed (the owner was deleted or the marker lost).'); fail = true; }
if (ownerMarkFiles.size > 1) { console.error(`\n✗ TWO owners: physical-folder-owner in ${ownerMarkFiles.size} files (${[...ownerMarkFiles].join(', ')}). Exactly ONE.`); fail = true; }
if (nonOwnerMkdir.length || ungatedPhysCall.length) { console.error(`\n✗ ${nonOwnerMkdir.length + ungatedPhysCall.length} physical folder-create(s) not reached through the physicality gate. Route them (do NOT exempt); a genuinely-distinct create = architect+PO design decision.`); fail = true; }
if (fail) process.exit(1);
console.log(`\n✓ R40.88 GREEN — 0 non-gated physical folder-creations (by ROUTING; ${exempted.length} architect-approved exemptions listed separately). A MODEL folder cannot get a mkdir.`);
