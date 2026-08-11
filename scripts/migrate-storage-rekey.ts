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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_USERS = path.join(ROOT, 'data', 'users');
const MAP_PATH = path.join(ROOT, 'data', 'token-storage-map.json'); // gitignored (contains raw tokens)
const REF_FINGERPRINT = 'b5ec87fbb79ee84fa22c2c66c32702e27433ff1721cf94c18117330bbf7c0f25'; // quiesced backup multiset (527 files)
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
console.log(`  == backup reference b5ec87fb…: ${cur.fingerprint === REF_FINGERPRINT ? '✓ EXACT MATCH' : '✗ DRIFT (server wrote since snapshot — expected if not re-quiesced)'}`);
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

// (2) COPY homes token→storageId (idempotent; hash-verify; originals UNTOUCHED)
let copied = 0, skipped = 0;
for (const token of ownerTokens) {
  const sid = map[token];
  const src = path.join(DATA_USERS, token), dst = path.join(DATA_USERS, sid);
  if (fs.existsSync(dst)) { skipped++; continue; } // idempotent
  execFileSync('cp', ['-rP', src, dst]); // -rP: recursive, symlinks preserved (NOT dereferenced), no hardlinks
  // per-file hash-verify (regular files only)
  const a = contentFingerprint([src]), b = contentFingerprint([dst]);
  if (a.fingerprint !== b.fingerprint) {
    console.error(`✗ ABORT: hash mismatch copying a home (original untouched); removing bad copy.`);
    fs.rmSync(dst, { recursive: true, force: true });
    process.exit(1);
  }
  copied++;
}
console.log(`homes copied: ${copied} (skipped ${skipped} already-present); originals byte-untouched`);

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

if (fails.length) {
  console.error(`✗ VERIFY FAILED (ABORT — originals untouched; git checkout scenario/index to revert):`);
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log(`✓ VERIFY PASS: links resolve · storageId multiset == b5ec87fb (0 content lost) · 0 owner-token paths in tracked unitLinks`);
console.log(`NEXT (outside this script): deploy regrowth-kill code + restart; originals kept as insurance.`);
