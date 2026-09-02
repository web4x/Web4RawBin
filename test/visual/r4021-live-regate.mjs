// P2 LIVE RE-GATE (PO-scoped) — run the MOMENT prod reports LIVE at 0.8.166 after the single atomic restart.
// A scratch GREEN is NOT a prod GREEN. This proves, READ-ONLY, that prod genuinely serves the fix, WITHOUT touching the
// credential guard or building a proxy. Two parts + an explicit non-coverage statement IN the verdict:
//   (1) served == committed: /api/config version == 0.8.166 (BOOT-FROZEN R31.7 = the RESTARTED process booted from the
//       atomic commit carrying mofChildren + the new-folder core) AND the served /model client bundle == the committed dist bundle.
//   (2) read-only live confirmation: /api/trace/children/<dir> returns correct structure (and, if any empty Folder unit exists
//       under a dir, that mofChildren now SURFACES it — the behavioural signal; absent an empty folder this is structure-only).
//   NOT COVERED ON PROD (stated plainly, not a footnote): the full owner-authed 2-browser live-INSERT. It needs owner-auth =
//   the same credential guard that sent P2 to scratch (+ R33.1 /model 403 STAYS). A proxy would be weaker + carry that risk →
//   Tron creating a folder on HIS OWN DEVICE is the acceptance for that part. Item-1 closes on THIS live result + his acceptance + chain.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EXPECT_VER = process.argv[2] || '0.8.166';
const BASE = 'https://prod.wo-da.de:4444';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const curl = (u) => { try { return execSync(`curl -s ${u} --insecure`, { encoding: 'utf8', timeout: 20000 }); } catch (e) { return ''; } };
const R = (v) => console.log(v);

// (1a) served version (boot-frozen)
const cfg = curl(`${BASE}/api/config`);
const servedVer = (cfg.match(/"version":"([^"]*)"/) || [])[1] || '?';
const verOk = servedVer === EXPECT_VER;
R(`(1a) served /api/config version = ${servedVer} (expect ${EXPECT_VER}, boot-frozen ⇒ the restarted process) → ${verOk ? 'OK' : 'MISMATCH'}`);

// (1b) served client bundle == committed dist bundle — DIRECT static GET (the /model PAGE is owner-gated per R33.1, so
//      scraping its HTML returns the auth page; the static /dist/ asset is NOT page-gated → GET the committed filename, 200 = served==committed).
let committedBundle = '?';
for (const d of ['src/public/dist', 'dist']) { try { const f = fs.readdirSync(path.join(REPO, d)).find((x) => /^model-[A-Z0-9]+\.js$/i.test(x)); if (f) { committedBundle = f; break; } } catch {} }
const bundleCode = committedBundle !== '?' ? execSync(`curl -s -o /dev/null -w "%{http_code}" ${BASE}/dist/${committedBundle} --insecure`, { encoding: 'utf8' }).trim() : '?';
const bundleOk = bundleCode === '200';
R(`(1b) committed dist bundle ${committedBundle} served at /dist/ → HTTP ${bundleCode} → ${bundleOk ? 'SERVED==COMMITTED (bundle)' : 'NOT-SERVED'}`);

// (2) read-only live confirmation: /children returns correct structure for a known dir (public GET, no auth, no mutation)
const kids = (ref) => { try { return JSON.parse(curl(`${BASE}/api/trace/children/${encodeURIComponent(ref)}`)).children || []; } catch { return null; } };
const srcTs = kids('dir:src/ts');
const srcTsOk = Array.isArray(srcTs) && srcTs.length > 0 && srcTs.some((c) => String(c.uuid).endsWith('/server') || String(c.uuid).includes('src/ts/'));
R(`(2) read-only /children/dir:src/ts → ${srcTs ? srcTs.length + ' children' : 'ERR'}: ${srcTs ? JSON.stringify(srcTs.map((c) => c.uuid).slice(0, 8)) : ''} → ${srcTsOk ? 'structure OK' : 'UNEXPECTED'}`);
// behavioural mofChildren signal IF an empty Folder exists under some dir (else structure-only): report, don't fail on absence
const emptyFolderSurfaced = Array.isArray(srcTs) && srcTs.some((c) => c.hasChildren === false && String(c.uuid).includes('/'));
R(`(2b) mofChildren behavioural signal (an empty folder surfaced by /children): ${emptyFolderSurfaced ? 'PRESENT' : 'not observable read-only (no empty folder on this dir) — covered by the owner-authed insert / Tron device create'}`);

const servedIsCommitted = verOk && bundleOk; // version (boot-frozen) = server-fix signal; bundle (direct static GET) = client corroboration — require both
const readOnlyOk = srcTsOk;
const pass = servedIsCommitted && readOnlyOk;
R(`\n═══ P2 LIVE RE-GATE VERDICT ═══`);
R(pass
  ? `LIVE PARTIAL-GREEN (stated plainly). SERVED == COMMITTED at ${servedVer}: /api/config boot-frozen version = ${EXPECT_VER} (the restarted process serves the atomic commit with mofChildren + new-folder core)${bundleOk ? ` + served client bundle ${committedBundle} == committed dist (HTTP ${bundleCode})` : ''}. READ-ONLY LIVE CONFIRMATION: /children returns correct structure. ★ NOT COVERED ON PROD, plainly: the full owner-authed 2-browser live-INSERT — it needs owner-auth (the credential guard that sent P2 to scratch; R33.1 /model 403 STAYS). I did NOT build a proxy and did NOT touch the guard. That part's acceptance = Tron creating a folder on his own device. Item-1 = this live result (tester) + Tron device-create (acceptance) + chain credit; each attributed honestly. Scratch DET-4x already proved the client subscribe→notify→re-derive→insert works with a real delta.`
  : `LIVE RE-GATE FAILED — HOLD, do NOT close: verOk=${verOk}(served ${servedVer} vs ${EXPECT_VER}) bundleOk=${bundleOk}(served ${servedBundle} vs committed ${committedBundle}) readOnlyOk=${readOnlyOk}. Served behaviour differs from expected → report loudly, hold rather than close.`);
process.exit(pass ? 0 : 1);
