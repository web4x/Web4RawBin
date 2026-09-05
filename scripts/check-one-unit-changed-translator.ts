// [impl:uuid:561bcfb8-89cc-4601-a20f-88537740c117] TransportBusBridge.assertSingleTranslator (Method 3494d2b3, UC
// notifyTranslator.singleOwner 089da882, Req 929a5117 = R40.91; design d5228cf40 / chain c54b83a22). Enforce, do NOT document.
//
// R40.84-B was a 4-round defect: a SECOND unit-changed→ViewBus translator (RawBinClient's inline copy) DRIFTED from the ONE
// owner (live-bridge notifyUnitChanged) — it built the OBJECT-form key viewBusKey({type,uuid}) while the tree subscribes the
// STRING-form → key mismatch → notify hit no subscriber → live folder-add invisible. This guard makes a 2nd inline translator
// IMPOSSIBLE by construction: exactly ONE MARKER-sanctioned owner, zero inline non-owner translators.
//
// MARKER-SANCTIONED (architect 561bcfb8, filename-independent): the ONE owner carries the comment marker
// [translator-owner:unit-changed] (on live-bridge notifyUnitChanged). HAZARD (scanned, not the actors): a WS-frame FRAME-CHECK
// (`type === 'unit-changed'` / `!== 'unit-changed'`) co-located with an INLINE `ViewBus.notify(` in a file that does NOT carry
// the marker = a drifted duplicate translator. The FIX-1 shape (frame-check that DELEGATES to notifyUnitChanged, no inline
// ViewBus.notify) is NOT a translator. A bare acting-tab/graph emit (`ViewBus.notify(viewBusKey({type:'task',…}))` with NO
// 'unit-changed' frame-check nearby) is NOT the hazard → 0-noise (a cry-wolf guard gets disabled = worse than none).
//
// ACs AS CODE: (1) print+assert translatorOwnerCount===1 (0 = owner deleted / marker not on a real translator = FAIL-CLOSED,
// ≥2 = duplicate owner = RED) AND inlineNonOwnerTranslators===0. (2) BUILT-IN self-bite runs EVERY invocation: it feeds
// synthetic fixtures (a planted inline translator, the EXACT pre-FIX-1 RawBinClient original, a legit bare emit, a marked
// owner, an owner-deleted file) and asserts the detector still discriminates — so a detector that silently stops detecting
// FAILS ITS OWN SELFTEST and can never rot into a green rubber-stamp. Registered in ci:gates:raw.
// Run: node --import tsx scripts/check-one-unit-changed-translator.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIR = 'src/public/ts';
const MARKER = '[translator-owner:unit-changed]'; // the ONE sanctioned owner carries this (a comment; searched in RAW src)
const MARKER_RE = /\[translator-owner:unit-changed\]/g;

// The WS-frame discriminator: a branch on the 'unit-changed' message type (both `===` and `!==`). NOT every mention of the
// literal — the FRAME-CHECK (`type` operator 'unit-changed') marks a translator handler.
const FRAME_CHECK = /\btype\s*[!=]==?\s*['"]unit-changed['"]/g;
const INLINE_NOTIFY = /ViewBus\.notify\s*\(/; // an INLINE emit (owner delegates call notifyUnitChanged(...), which is NOT this)
const WINDOW = 600; // chars forward from the frame-check = the handler body

// strip /* */ + // comments so a prose mention of unit-changed / ViewBus.notify cannot false-flag the FRAME-CHECK/notify.
export function scanCode(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

export interface TranslatorSite { rel: string; line: number; text: string; }
export interface ScanResult { ownerMarkerCount: number; owners: TranslatorSite[]; nonOwners: TranslatorSite[]; }

// owners = marker-bearing files' translator sites; nonOwners = translator sites in files WITHOUT the marker. ownerMarkerCount
// = total markers (the sanction count). A translator SITE = a frame-check whose handler window has an INLINE ViewBus.notify.
export function scanTranslators(files: Array<{ rel: string; src: string }>): ScanResult {
  let ownerMarkerCount = 0;
  const owners: TranslatorSite[] = [];
  const nonOwners: TranslatorSite[] = [];
  for (const { rel, src } of files) {
    const marked = (src.match(MARKER_RE) || []).length; // MARKER lives in a comment → search RAW src
    ownerMarkerCount += marked;
    const code = scanCode(src);
    FRAME_CHECK.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = FRAME_CHECK.exec(code)) !== null) {
      const window = code.slice(m.index, m.index + WINDOW);
      if (!INLINE_NOTIFY.test(window)) continue; // a frame-check that DELEGATES (no inline emit) → not a translator (FIX-1 shape)
      const line = code.slice(0, m.index).split('\n').length;
      const site: TranslatorSite = { rel, line, text: window.slice(0, 90).replace(/\s+/g, ' ').trim() };
      (marked > 0 ? owners : nonOwners).push(site);
    }
  }
  return { ownerMarkerCount, owners, nonOwners };
}

function readTsFiles(absDir: string): Array<{ rel: string; src: string }> {
  const out: Array<{ rel: string; src: string }> = [];
  const walk = (dir: string): void => {
    let entries: fs.Dirent[]; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'dist') continue; walk(p); continue; }
      if (!/\.(ts|js|mjs)$/.test(e.name) || /\.(test|spec|d)\.ts$/.test(e.name)) continue;
      out.push({ rel: path.relative(ROOT, p).split(path.sep).join('/'), src: fs.readFileSync(p, 'utf-8') });
    }
  };
  walk(absDir);
  return out;
}

// ── SELF-BITE (runs EVERY invocation; a detector that stops detecting FAILS HERE and can never green-rubber-stamp) ─────────
const PRE_FIX1_ORIGINAL = // the EXACT RawBinClient:113 shape that caused R40.84-B (inline object-key translator, UNMARKED)
  `this.ws.onmessage=(event)=>{const msg=JSON.parse(event.data);` +
  `if (msg.type === 'unit-changed') { const t = String(msg.ior||'').split(':')[2]?.toLowerCase()||'';` +
  `if (t && msg.uuid) ViewBus.notify(viewBusKey({ type: t, uuid: msg.uuid })); else ViewBus.notify('graph'); return; }}`;
const PLANTED_INLINE = `function foo(msg){ if (msg.type === 'unit-changed') { ViewBus.notify(viewBusKey(msg.uuid)); return; } }`;
const LEGIT_BARE_EMIT = // acting-tab emit — a bare notify with NO 'unit-changed' frame-check → must NOT flag (0-noise)
  `function handleTaskVerdict(){ ViewBus.notify(viewBusKey({ type: 'task', uuid })); ViewBus.notify('graph'); }`;
const MARKED_OWNER = `// ${MARKER} the ONE translator\nexport function notifyUnitChanged(msg){ if (msg.type !== 'unit-changed') return; const key = f(msg.uuid); ViewBus.notify(key); }`;
const OWNER_DELETED = `export function somethingElse(){ return 1; } // no translator, no marker`;
const DELEGATE_ONLY = `if (r.type === 'unit-changed') { notifyUnitChanged(r); return; }`; // FIX-1 shape — must NOT flag

function selfBite(): string[] {
  const fails: string[] = [];
  // (a) plant an inline non-owner translator → caught as a nonOwner
  if (scanTranslators([{ rel: 'src/public/ts/_planted.ts', src: PLANTED_INLINE }]).nonOwners.length !== 1) fails.push('planted inline translator NOT detected');
  // (b) the EXACT pre-FIX-1 original → caught as a nonOwner
  if (scanTranslators([{ rel: 'src/public/ts/RawBinClient.ts', src: PRE_FIX1_ORIGINAL }]).nonOwners.length < 1) fails.push('pre-FIX-1 RawBinClient original NOT detected');
  // (c) legit bare acting-tab emit (no frame-check) → NOT flagged (0-noise / no cry-wolf)
  if (scanTranslators([{ rel: 'src/public/ts/x.ts', src: LEGIT_BARE_EMIT }]).nonOwners.length !== 0) fails.push('legit bare ViewBus.notify FALSE-flagged (cry-wolf)');
  // (d) the FIX-1 delegate shape (frame-check → notifyUnitChanged, no inline notify) → NOT flagged
  if (scanTranslators([{ rel: 'src/public/ts/RawBinClient.ts', src: DELEGATE_ONLY }]).nonOwners.length !== 0) fails.push('FIX-1 delegate shape FALSE-flagged');
  // (e) a MARKED owner → counted as owner (marker + site), NOT a nonOwner
  { const r = scanTranslators([{ rel: 'src/public/ts/live-bridge.ts', src: MARKED_OWNER }]); if (r.ownerMarkerCount !== 1 || r.owners.length !== 1 || r.nonOwners.length !== 0) fails.push('marked owner NOT counted as the single owner'); }
  // (f) owner deleted (no marker, no translator) → ownerMarkerCount 0 (fail-closed detects the absence)
  if (scanTranslators([{ rel: 'src/public/ts/live-bridge.ts', src: OWNER_DELETED }]).ownerMarkerCount !== 0) fails.push('owner-deleted NOT detected (fail-closed broken)');
  return fails;
}

if (process.argv[1] && /check-one-unit-changed-translator\.(ts|js|mjs)$/.test(process.argv[1])) {
  const biteFails = selfBite();
  if (biteFails.length) { console.error('✗ check-one-unit-changed-translator SELF-BITE FAILED — the detector is INERT, RED:\n' + biteFails.map((x) => '  ✗ ' + x).join('\n')); process.exit(1); }

  const { ownerMarkerCount, owners, nonOwners } = scanTranslators(readTsFiles(path.join(ROOT, SCAN_DIR)));
  const translatorOwnerCount = owners.length; // marked translator SITES (the marker sits on a real translator)
  const inlineNonOwnerTranslators = nonOwners.length;
  console.log(`=== R40.91 one unit-changed→notify translator (marker ${MARKER}) ===`);
  console.log(`  ownerMarkerCount = ${ownerMarkerCount} (want 1)`);
  console.log(`  translatorOwnerCount = ${translatorOwnerCount} (want 1 — the marker on a real translator)`);
  console.log(`  inlineNonOwnerTranslators = ${inlineNonOwnerTranslators} (want 0)`);
  for (const o of owners) console.log(`  owner: ${o.rel}:${o.line}`);
  for (const n of nonOwners) console.error(`  NON-OWNER inline translator: ${n.rel}:${n.line}  ${n.text}`);

  const problems: string[] = [];
  if (ownerMarkerCount === 0) problems.push('ownerMarkerCount===0 — the [translator-owner:unit-changed] sanction is GONE (FAIL-CLOSED)');
  if (ownerMarkerCount >= 2) problems.push(`ownerMarkerCount===${ownerMarkerCount} — DUPLICATE owner markers (must be exactly 1)`);
  if (translatorOwnerCount === 0) problems.push('translatorOwnerCount===0 — the canonical unit-changed translator (notifyUnitChanged) is GONE or the marker is not on a real translator (FAIL-CLOSED: never pass without the one owner)');
  if (translatorOwnerCount >= 2) problems.push(`translatorOwnerCount===${translatorOwnerCount} — DUPLICATE owner translators (must be exactly 1)`);
  if (inlineNonOwnerTranslators !== 0) problems.push(`inlineNonOwnerTranslators===${inlineNonOwnerTranslators} — a 2nd inline unit-changed→ViewBus translator drifted (route it through the ONE notifyUnitChanged; this is the R40.84-B defect)`);
  if (problems.length) { console.error('\n✗ R40.91 FAIL:\n' + problems.map((p) => '  ✗ ' + p).join('\n')); process.exit(1); }
  console.log('\n✓ R40.91 PASS — exactly ONE marker-sanctioned unit-changed→notify translator, 0 inline non-owner copies (a 2nd translator cannot drift the bus key).');
}
