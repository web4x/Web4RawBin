// T40.1 BADGE-GLYPH SINGLE-SOURCE lint — the RED I OWN (PO 2026-08-29): a lint that must go RED on the LIVE band-glyph
// defect BEFORE the one-sourced fix lands. This is the strongest failability proof — the real known-bad, on current code.
// It covers the THREE things the existing check-status-symbol.ts MISSED: (1) the CLIENT render path (BADGE_MAP), not just
// the server statusSymbol; (2) the BAND status 'QA-Review-with-open-CR'; (3) EVERY server-derivable status, not a hand-list.
// Source-derived (parses both files — no hardcoded list, no DOM import), deterministic, node. When the fix one-sources the
// glyphs, this flips GREEN. Includes stub-must-fail so the lint is provably non-vacuous.
//
// DEFECT (measured live @0.8.139): server deriveStatusEnum can return 'QA-Review-with-open-CR' (statusSymbol → 🔁,
// task-status.ts:121) but the CLIENT renderStatusBadge lowercases + looks up BADGE_MAP[lc] || BADGE_MAP[lc.replace(/[^a-z ]/g,'')]
// || null (rb-object-item.ts:213/245) — the band matches NEITHER key → null → gray raw-text 'qa-review-with-open-cr', no 🔁.
import fs from 'fs';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const rd = (p) => fs.readFileSync(`${ROOT}/${p}`, 'utf8');

// (1) SERVER: every status a row can carry = STATUS_ORDER (task-status-constants.ts) + the band literal.
const constsSrc = rd('src/ts/scenario/task-status-constants.ts');
const orderM = constsSrc.match(/STATUS_ORDER[^=]*=\s*\[([^\]]+)\]/); // [^=]* skips the `: readonly TaskStatusEnum[]` type annotation (its own [])
const STATUS_ORDER = orderM ? [...orderM[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
const statusSrc = rd('src/ts/scenario/task-status.ts');
const bandLiterals = [...statusSrc.matchAll(/'(QA-Review-with-open-CR)'/g)].map(m => m[1]);
const serverStatuses = [...new Set([...STATUS_ORDER, ...bandLiterals])];

// (2) CLIENT: BADGE_MAP keys + the exact lookup normalization from rb-object-item.ts.
const itemSrc = rd('src/public/ts/trace/rb-object-item.ts');
const mapM = itemSrc.match(/BADGE_MAP[^{]*\{([\s\S]*?)\n\};/);
const badgeKeys = new Set(mapM ? [...mapM[1].matchAll(/'([^']+)'\s*:/g)].map(m => m[1]) : []);
// mirror the client lookup exactly: rb-object-item.ts:213 lowercases; :245 tries lc then lc.replace(/[^a-z ]/g,'')
const clientResolves = (status) => { const lc = status.toLowerCase(); return badgeKeys.has(lc) || badgeKeys.has(lc.replace(/[^a-z ]/g, '')); };

console.log(`SERVER row statuses (${serverStatuses.length}): ${serverStatuses.join(' · ')}`);
console.log(`CLIENT BADGE_MAP keys (${badgeKeys.size}): ${[...badgeKeys].join(' · ')}`);

// (3) every server-derivable status MUST resolve to a client badge (else the row shows gray raw-text = the defect)
const uncovered = serverStatuses.filter(s => !clientResolves(s));
console.log(`\nUNCOVERED by the client BADGE_MAP (→ gray raw-text, no glyph): ${uncovered.length ? uncovered.join(' · ') : '(none)'}`);

// stub-must-fail: prove the lint is NON-VACUOUS — it must (a) RED on the real map (band uncovered) and (b) GREEN if the
// band key were present. If adding the band key does NOT clear the finding, the lint is not actually testing coverage.
const wouldGreenIfBandAdded = serverStatuses.filter(s => { const lc = s.toLowerCase(); const k = new Set([...badgeKeys, 'qa-review-with-open-cr']); return !(k.has(lc) || k.has(lc.replace(/[^a-z ]/g, ''))); });
const nonVacuous = uncovered.length > 0 && wouldGreenIfBandAdded.length < uncovered.length;
console.log(`STUB-MUST-FAIL (non-vacuous): adding the band key clears ${uncovered.length - wouldGreenIfBandAdded.length} finding(s) → ${nonVacuous ? 'PASS (the lint genuinely tests client coverage)' : 'FAIL (lint is vacuous — not testing what it claims)'}`);

const failed = uncovered.length > 0;
console.log(`\n${failed ? '✗ RED' : '✓ GREEN'} — badge-glyph single-source lint (client BADGE_MAP covers every server-derivable status incl the band).`);
if (failed) console.log(`  X = the band status ${uncovered.map(s => `'${s}'`).join(', ')} has no client glyph → renders gray raw-text, not 🔁 (STATUS_GLYPHS has it server-side; BADGE_MAP does not = duplicate-source). This RED is the pre-fix baseline the one-sourced fix must flip GREEN.`);
if (!nonVacuous) console.log('  ⚠ lint vacuity check did not pass — treat GREEN with suspicion until fixed.');
process.exit(failed ? 1 : 0);
