/**
 * R40.22 STORAGE RE-KEY — decouple ownerToken (auth) from the storage key (design 03287719c / architect
 * backstop 2a4f28459). Makes token rotation possible without orphaning a home: storage is keyed by an
 * opaque never-auth `storageId`; the token becomes a pure rotatable credential mapped via a gitignored
 * runtime `tokenToStorageId`.
 *
 * APPROACH (architect-cleared): COPY-BASED, ADDITIVE, SINGLE-WINDOW (measured 0.24s on 7.9MB).
 *   - COPY (not move) data/users/<token>/ -> data/users/<storageId>/ with `cp -rP` (preserve symlinks as
 *     symlinks — data/users is a symlink-farm: 69 relative symlinks to scenario/index; token->storageId is
 *     a SAME-DEPTH rename so the relative targets resolve unchanged, NO retarget). Originals stay
 *     BYTE-UNTOUCHED = the insurance (both paths resolve). Zero non-atomic window (no mv/ln).
 *   - Then REWRITE the 84 tracked unitLink strings token->storageId (LAST — the riskier tracked-data half,
 *     after the data is safely copied+verified).
 *
 * ORDER (a failure lands safe): mint -> COPY+hash-verify -> rewrite-unitLinks-LAST -> verify -> (restart w/
 *   regrowth-kill code). ABORT (proven, zero-restore): originals untouched -> `git checkout scenario/index`
 *   (revert the 84 rewrites) + revert regrowth-kill code + restart OLD code serves originals + rm copies.
 *
 * Run: /opt/node22/bin/node --import tsx scripts/migrate-storage-rekey.ts            (DRY-RUN, read-only)
 *      /opt/node22/bin/node --import tsx scripts/migrate-storage-rekey.ts --apply    (GATED real write)
 *
 * IDEMPOTENT + fail-closed: re-run skips already-copied homes / already-rewritten links; any per-home
 * hash mismatch ABORTS that home (RED), never deletes an original.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index.js';

// REKEY_ROOT lets --apply run against an ISOLATED scratch repo copy (architect gate: measured-green on
// scratch before the real window). Default = the real repo.
const ROOT = process.env.REKEY_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_USERS = path.join(ROOT, 'data', 'users');
const MAP_PATH = path.join(ROOT, 'data', 'token-storage-map.json'); // gitignored (contains raw tokens)
// DRY-RUN CROSS-CHECK ONLY — the first backup's fingerprint. The live tree DRIFTS past this (legit user
// writes), so --apply NEVER gates on this constant; it captures a FRESH APPLY_REF from the quiesced state
// in-window and verifies against THAT (PIN 1, architect). This constant only annotates the dry-run report.
const FIRST_BACKUP_FINGERPRINT = 'b5ec87fbb79ee84fa22c2c66c32702e27433ff1721cf94c18117330bbf7c0f25';
const APPLY = process.argv.includes('--apply');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_G = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const bare = (s: string) => String(s || '').replace('ior:instance:', '').split('@')[0];
const sha256File = (p: string) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

// Content multiset of REGULAR FILES (symlinks excluded — they point to scenario/index, tracked separately)
// under a set of home dirs, as a single fingerprint == the architect/backup reference.
function contentFingerprint(homeDirs: string[]): { files: number; fingerprint: string } {
  const hashes: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) hashes.push(sha256File(p));
    }
  };
  for (const h of homeDirs) walk(h);
  hashes.sort();
  return { files: hashes.length, fingerprint: crypto.createHash('sha256').update(hashes.join('\n')).digest('hex') };
}

// ── enumerate owners (token-named home dirs) ────────────────────────────────
const ownerTokens = fs.existsSync(DATA_USERS)
  ? fs.readdirSync(DATA_USERS, { withFileTypes: true })
      .filter(e => e.isDirectory() && UUID.test(e.name))
      .map(e => e.name)
  : [];

// ── scan tracked scenario units for File/WebItem unitLinks embedding data/users/<token>/ ─────
const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
const DATA_USERS_SEG = /data\/users\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\//i;
interface LinkHit { uuid: string; unitKey: string; }
const linkHits: LinkHit[] = [];
const tokensInLinks = new Set<string>();
for (const key of idx.list()) {
  const u = idx.get(key); if (!u) continue;
  if (u.ior !== 'ior:class:File' && u.ior !== 'ior:class:WebItem') continue;
  const m: any = u.model || {};
  const links: string[] = Array.isArray(m.unitLinks) ? m.unitLinks : [];
  for (const l of links) {
    const mm = String(l).match(DATA_USERS_SEG);
    if (mm) { linkHits.push({ uuid: mm[1], unitKey: key }); tokensInLinks.add(mm[1]); }
  }
}

// ── token -> storageId map (mint idempotently; NEVER printed to logs) ────────
function loadMap(): Record<string, string> {
  try { return JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8')); } catch { return {}; }
}
function mintStorageIds(existing: Record<string, string>, allTokens: string[]): Record<string, string> {
  const map = { ...existing };
  for (const t of allTokens) if (!map[t]) map[t] = crypto.randomUUID(); // opaque, never-auth
  return map;
}

// ── DRY-RUN report ──────────────────────────────────────────────────────────
const cur = contentFingerprint(ownerTokens.map(t => path.join(DATA_USERS, t)));
const symlinkCount = (() => { let n = 0; const walk = (d: string) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isSymbolicLink()) n++; else if (e.isDirectory()) walk(p); } }; for (const t of ownerTokens) walk(path.join(DATA_USERS, t)); return n; })();
const tokensInLinksNotOwners = [...tokensInLinks].filter(t => !ownerTokens.includes(t));

console.log(`\n=== R40.22 storage re-key — ${APPLY ? 'APPLY' : 'DRY-RUN'} ===`);
console.log(`owner homes (data/users/<token>/): ${ownerTokens.length}`);
console.log(`regular files: ${cur.files}   symlinks (→scenario/index, preserved as-is): ${symlinkCount}`);
console.log(`content multiset fingerprint: ${cur.fingerprint}`);
console.log(`  == FIRST backup b5ec87fb… (dry-run cross-check only): ${cur.fingerprint === FIRST_BACKUP_FINGERPRINT ? '✓ match' : '✗ DRIFT (expected — live moved; --apply re-quiesces + uses a FRESH ref, never this constant)'}`);
console.log(`File/WebItem unitLink strings embedding data/users/<token>/: ${linkHits.length}  across ${new Set(linkHits.map(h => h.unitKey)).size} units`);
console.log(`distinct tokens embedded in unitLinks: ${tokensInLinks.size}`);
console.log(`  all embedded tokens are known owner-homes: ${tokensInLinksNotOwners.length === 0 ? '✓' : '✗ ' + tokensInLinksNotOwners.length + ' orphan'}`);

if (!APPLY) {
  const unionCount = new Set([...ownerTokens, ...tokensInLinks]).size;
  console.log(`\nDRY-RUN only — no writes. --apply performs: mint storageId for ${unionCount} tokens (${ownerTokens.length} homes + ${tokensInLinksNotOwners.length} orphan-in-unitLinks, dangling/no-home → mapped+rewritten so no credential survives in a path, dangling unchanged) → cp -rP the ${ownerTokens.length} EXISTING homes token→storageId + per-file hash-verify → rewrite ${linkHits.length} unitLinks → verify (resolve + multiset==ref + no-token-in-tracked-path).`);
  console.log(`ORPHANS (${tokensInLinksNotOwners.length}) = unitLink refs with no home + no profile = pre-existing dangling; flagged to req (scenario-first) — the re-key removes the credential from their paths but does not resurrect the missing home.`);
  console.log(`ABORT (if --apply fails): git checkout scenario/index + revert regrowth-kill + restart old code (originals byte-untouched).`);
  process.exit(0);
}

// ── APPLY (gated single-window; caller MUST have quiesced the server + re-backed-up in THIS window) ──
// The reference is the QUIESCED-START multiset captured now (self-consistent: the server is stopped so
// data/users is frozen; this is the exact state the fresh backup + architect's reference also see). The
// original backup fingerprint (b5ec87fb) was a point-in-time snapshot the live tree has since drifted past
// (legit user writes) — so the invariant is "storageId homes == THIS quiesced state", cross-checked by the
// architect's independent reference captured at the same instant, not the stale hardcoded value.
const APPLY_REF = cur.fingerprint;
console.log(`quiesced-start reference multiset: ${APPLY_REF} (${cur.files} files) — architect cross-checks this against its own capture at this instant`);
// Mint for the UNION of home-owners AND unitLink-embedded tokens: the 11 "orphan" tokens (in unitLinks
// with NO home dir + NO profile = pre-existing DANGLING refs) must ALSO get a storageId so their paths
// are rewritten off the credential — else those token-paths survive and the no-credential-path gate stays
// RED. Copying only touches EXISTING homes; orphan tokens get a mapping but no copy (nothing to copy).
const allTokens = [...new Set([...ownerTokens, ...tokensInLinks])];
let map = mintStorageIds(loadMap(), allTokens);
fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));
console.log(`minted/loaded storageId for ${Object.keys(map).length} tokens (${ownerTokens.length} homes + ${allTokens.length - ownerTokens.length} orphan-in-unitLinks) → ${path.relative(ROOT, MAP_PATH)} (gitignored)`);

// (2) COPY homes token→storageId — STAGE-then-MOVE, NOT in-place. ROOT CAUSE (measured): extracting all
// 47 homes IN-PLACE into data/users (alongside the originals) cross-contaminates — one home's copy gained
// ANOTHER home's room (+1 symlink), caught by the count-mirror. Injective map ruled out a collision (B);
// an isolated-staging copy is faithful (69==69) ⇒ (A) in-place was the cause. So: tar-extract each home
// into an ISOLATED staging dir (data/users-staging, same filesystem, NOT under data/users → no coexistence
// with the originals during extract), hash-verify, then rename it into place (atomic metadata move — no
// extract, no symlink-follow → no contamination). tar preserves symlinks exactly (backup proved 69→69).
const STAGE = path.join(ROOT, 'data', 'users-staging');
fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });
let copied = 0, skipped = 0;
for (const token of ownerTokens) {
  const sid = map[token];
  const src = path.join(DATA_USERS, token), staged = path.join(STAGE, sid), dst = path.join(DATA_USERS, sid);
  if (fs.existsSync(dst)) { skipped++; continue; } // idempotent
  execFileSync('sh', ['-c', `mkdir -p "${staged}" && tar -C "${src}" -cf - . | tar -C "${staged}" -xf -`]);
  const a = contentFingerprint([src]), b = contentFingerprint([staged]);
  if (a.fingerprint !== b.fingerprint) {
    console.error(`✗ ABORT: hash mismatch staging a home (original untouched); removing staged copy.`);
    fs.rmSync(staged, { recursive: true, force: true });
    process.exit(1);
  }
  fs.renameSync(staged, dst); // atomic move into data/users (same fs) — no re-extract, no contamination
  copied++;
}
fs.rmSync(STAGE, { recursive: true, force: true });
console.log(`homes staged→moved: ${copied} (skipped ${skipped} already-present); originals byte-untouched`);

// (3) REWRITE the unitLinks token→storageId in the scenario units (LAST) — idempotent
let rewritten = 0;
for (const key of idx.list()) {
  const u = idx.get(key); if (!u) continue;
  if (u.ior !== 'ior:class:File' && u.ior !== 'ior:class:WebItem') continue;
  const m: any = u.model || {};
  if (!Array.isArray(m.unitLinks)) continue;
  let changed = false;
  m.unitLinks = m.unitLinks.map((l: string) => {
    const mm = String(l).match(DATA_USERS_SEG);
    if (mm && map[mm[1]]) { changed = true; return String(l).replace(`data/users/${mm[1]}/`, `data/users/${map[mm[1]]}/`); }
    return l;
  });
  if (changed) { idx.put(key, u); rewritten++; }
}
console.log(`unitLinks rewritten (token→storageId) in ${rewritten} units`);

// (4) VERIFY — the gates
const fails: string[] = [];
// (4a) every rewritten unitLink resolves on disk (target exists)
for (const key of idx.list()) {
  const u = idx.get(key); if (!u || (u.ior !== 'ior:class:File' && u.ior !== 'ior:class:WebItem')) continue;
  const m: any = u.model || {};
  for (const l of (Array.isArray(m.unitLinks) ? m.unitLinks : [])) {
    const mm = String(l).match(DATA_USERS_SEG); if (!mm) continue;
    if (!fs.existsSync(path.join(DATA_USERS, mm[1]))) fails.push(`unitLink target missing: data/users/${mm[1].slice(0,8)}…`);
  }
}
// (4b) EXACT content multiset over the copied storageId homes == quiesced-start reference (0 content lost).
// Only the 47 real homes were copied (orphan tokens have no home); compare against the same 47-home ref.
const sidFp = contentFingerprint(ownerTokens.map(t => path.join(DATA_USERS, map[t])));
if (sidFp.fingerprint !== APPLY_REF) fails.push(`storageId-home multiset ${sidFp.fingerprint.slice(0,8)} != quiesced-start ${APPLY_REF.slice(0,8)} (content changed/lost)`);
// (4c) no-token-in-tracked-path: no tracked unitLink still embeds an OWNER-TOKEN home segment
let tokenPathsLeft = 0;
for (const key of idx.list()) {
  const u = idx.get(key); if (!u) continue; const m: any = u.model || {};
  for (const l of (Array.isArray(m.unitLinks) ? m.unitLinks : [])) {
    const mm = String(l).match(DATA_USERS_SEG); if (mm && ownerTokens.includes(mm[1])) tokenPathsLeft++;
  }
}
if (tokenPathsLeft) fails.push(`${tokenPathsLeft} tracked unitLinks still embed an owner-TOKEN path segment (must be storageId)`);
// (4d) PIN 2 (architect) — DELTA, not absolute. The copy must not BREAK any symlink; but the originals
// already contain PRE-EXISTING dangling symlinks (measured: 36/69 broken — refs to scenario units that no
// longer exist / wrong-depth ../ counts), which the re-key faithfully preserves and is NOT responsible for.
// So the invariant is 0 NEW broken (copy-broken <= original-broken), proven by comparing the untouched
// token homes (still present — copy is additive) against the storageId copies. fs.existsSync FOLLOWS the
// link → false if broken; recursion enters only real dirs (never a symlink entry) → no loop.
const brokenIn = (dirs: string[]) => {
  let t = 0, b = 0;
  const w = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isSymbolicLink()) { t++; if (!fs.existsSync(p)) b++; }
      else if (e.isDirectory()) w(p);
    }
  };
  for (const d of dirs) w(d);
  return { t, b };
};
const symOrig = brokenIn(ownerTokens.map(t => path.join(DATA_USERS, t)));        // untouched originals (baseline)
const symCopy = brokenIn(ownerTokens.map(t => path.join(DATA_USERS, map[t])));    // storageId copies
const newBroken = symCopy.b - symOrig.b;
if (newBroken > 0) fails.push(`${newBroken} NEW broken symlinks introduced by the copy (originals ${symOrig.b} broken, copies ${symCopy.b}) — the copy must preserve resolution`);
// COUNT MIRROR (architect): delta-broken alone false-PASSES if the copy DROPS a resolving symlink
// (symCopy.t=68/b=36 → newBroken=0) and the content-multiset excludes symlinks → assert copy total ==
// original total so a dropped OR added symlink is caught too.
if (symCopy.t !== symOrig.t) fails.push(`symlink COUNT MIRROR: copies have ${symCopy.t} symlinks vs originals ${symOrig.t} (a symlink was dropped/added — the class delta+multiset jointly miss)`);
console.log(`in-home symlinks: originals ${symOrig.t - symOrig.b}/${symOrig.t} resolve (${symOrig.b} PRE-EXISTING dangling, flagged req); copies ${symCopy.t - symCopy.b}/${symCopy.t} resolve → NEW broken=${newBroken} (0 req), COUNT MIRROR ${symCopy.t}==${symOrig.t} (${symCopy.t === symOrig.t ? '✓' : '✗'})`);

if (fails.length) {
  console.error(`✗ VERIFY FAILED (ABORT — originals untouched; git checkout scenario/index to revert):`);
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log(`✓ VERIFY PASS: links resolve · storageId multiset == APPLY_REF quiesced-start (0 content lost) · symlink count-mirror + 0-new-broken · 0 owner-token paths in tracked unitLinks`);
console.log(`NEXT (outside this script): deploy regrowth-kill code + restart; originals kept as insurance.`);
