/**
 * R31.15 DEVICE-AC LINT — correct-by-construction backstop for the iOS-WebKit tap-fire false-green CLASS (audit F1).
 * Run: node scripts/check-device-ac-lint.mjs   (ci:gates:raw). Touches no server source; needs no restart.
 *
 * FAILS any test/visual GATE that asserts a REAL-DEVICE behaviour (iOS tap / gesture / soft-keyboard / codicon glyph)
 * via a SYNTHETIC event in a CHROMIUM/emulation context WITHOUT deferring to a real-WebKit run or to Tron's device.
 * Chromium (incl. Playwright device emulation) fires tap/click on fragile non-native elements that real iOS Safari does
 * NOT — the gate goes GREEN while the device fails (proven ≥3×: R31.12 h2-title, R31.12 config radios, R30.53 codicon
 * chevrons). This makes the blind pattern impossible to ADD, not merely known. See test/visual/HEADLESS-ONLY-AC-AUDIT.md.
 *
 * PROVE-THE-PROVER (own doctrine applied to the lint itself): before scanning, the detector MUST flag every KNOWN-BAD
 * fixture (drift-injection: the 3 proven F1 instances) AND clear every KNOWN-GOOD fixture; a stubbed always-pass detector
 * fails this self-check → the suite exits non-zero. A lint that cannot fail is worthless.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const GATE_DIR = path.join(ROOT, 'test/visual');

// ── signals ──
const SYNTHETIC = /page\.click\(|page\.tap\(|\.dispatchEvent\(\s*new\s+(Mouse|Pointer|Touch)Event\(\s*['"](click|tap|pointerup|pointerdown|touchstart|touchend)/;
const CHROMIUM = /chromium\.launch/;
const WEBKIT = /webkit\.launch/;                                    // a real-WebKit run is NOT the blind pattern
const DEVICE_CLAIM = /real iOS|real-WebKit|iOS (tap|Safari)|soft keyboard|on-screen keyboard|\bcodicon\b|tap-fire|physical (finger|tap|device)|\bgesture\b/i;
const DEFERS = /→\s*Tron|->\s*Tron|device-only|DEVICE-ONLY|hand(ed)?[^.\n]*Tron|Tron'?s? (device|owner-device)|NEVER (headless|reportable)|owner-device QA/i;

// A gate is BLIND iff it synthetically drives an interaction, in a chromium(only) context, claims a real-device
// behaviour, and does NOT defer that behaviour to real-WebKit or Tron.
const isBlind = (src) => SYNTHETIC.test(src) && CHROMIUM.test(src) && !WEBKIT.test(src) && DEVICE_CLAIM.test(src) && !DEFERS.test(src);

// ── PROVE-THE-PROVER: drift-injection with the 3 proven F1 instances + known-good controls ──
const KNOWN_BAD = [
  `const b = await chromium.launch(); await page.click('h2.room-title'); /* R31.12: real iOS tap must select */`,   // h2-title
  `chromium.launch(); el.dispatchEvent(new MouseEvent('click', {bubbles:true})); // radio selects on real iOS`,       // config radios
  `await chromium.launch(); await page.click('.codicon-folding-collapsed'); // fold chevron on real-WebKit @390`,     // R30.53 codicon
];
const KNOWN_GOOD = [
  `webkit.launch(); await page.tap('button.real'); // real WebKit pointer`,                                          // real webkit → not blind
  `chromium.launch(); await page.click('.x'); // the drag→drop→box VISUAL → Tron owner-device`,                       // defers → not blind
  `chromium.launch(); const r = await httpGet('/api/config'); // server logic only, no device claim`,                // no device claim → not blind
];
const proverOk = KNOWN_BAD.every(isBlind) && KNOWN_GOOD.every((s) => !isBlind(s));
if (!proverOk) {
  console.error('✗ check:device-ac PROVER BROKEN — detector failed its own known-bad/known-good fixtures (stub-must-fail).');
  console.error(`   known-bad flagged: ${KNOWN_BAD.map(isBlind).join(',')} (want true,true,true); known-good flagged: ${KNOWN_GOOD.map(isBlind).join(',')} (want false,false,false)`);
  process.exit(2);
}

// ── scan real gates ──
const files = fs.readdirSync(GATE_DIR).filter((f) => /\.(mjs|ts)$/.test(f) && f !== 'HEADLESS-ONLY-AC-AUDIT.md');
const offenders = files.filter((f) => isBlind(fs.readFileSync(path.join(GATE_DIR, f), 'utf8')));

if (offenders.length) {
  console.error(`\n✗ check:device-ac FAIL — ${offenders.length} gate(s) assert a REAL-DEVICE behaviour via a SYNTHETIC event in a CHROMIUM context, without deferring to real-WebKit or Tron:`);
  console.error('  FAMILY = iOS-WebKit tap-fire false-green (R31.15): Chromium/emulation fires tap/click on fragile non-native elements that real iOS Safari does NOT → the gate is GREEN while the device fails.');
  console.error('  FIX = use webkit.launch() + a real pointer (pointerup/touchend + change / native control), OR hand the device sliver to Tron (never headless-green).');
  for (const o of offenders) console.error(`   - test/visual/${o}`);
  process.exit(1);
}
console.log('✓ check:device-ac — no gate synthetically asserts a real-device behaviour in a chromium context (F1 blind pattern absent). prover OK (3/3 known-bad flagged, 0/3 known-good).');
