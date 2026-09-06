// T37.20 DEFECT-2 OPEN/CLOSED LINT (PO: gate the PATTERN not the symptom). Acceptance for the Factory + self-registering
// Registry design: adding a 6th natural class (Image/Email/Contact/CalendarEntry beyond WebItem/File) must touch ZERO existing
// switch/if on the DROP/UPLOAD dispatch path. HAZARD (scan the hazard): a mime-type / file-extension CONDITIONAL that SELECTS a
// unit CLASS in the server upload/drop handler (the `isWebItem`-else-`File` if-chain). A registry-driven dispatch has NONE — the
// class comes from registry.forMime(mime); a new class = one register() call, zero if-edits. Count the class-dispatch
// conditionals on the path, assert 0. RED-BASELINE NOW (isWebItem if-chain at server.ts:2693/2777). FAILABLE: inject one → RED.
import fs from 'node:fs';
import path from 'node:path';
const R = (v) => console.log(v);
const SERVER = path.resolve('src/ts/server/server.ts');
const stripC = (l) => l.replace(/\/\/.*$/, '');

// A class-dispatch conditional = a line in server.ts that tests a mime/extension AND thereby routes to a unit class. The
// `isWebItem` decision variable IS the dispatch (mimeType===text/uri-list || name.endsWith(.url/.webloc/.desktop) → WebItem else
// File). Also count any raw per-class mime test that would gate a createXUnit. NOT WebItem.ts internal url-format parsing (that
// is a class parsing its OWN formats, not choosing WHICH class) — scope to server.ts dispatch only.
const DISPATCH = [
  { key: 'isWebItem class-decision', re: /\bisWebItem\b\s*=|\bjIsWebItem\b\s*=/ },
  { key: 'per-class mime === in upload dispatch', re: /(mimeType|dec\.mimeType)\s*===\s*['"](image|message|text\/vcard|text\/calendar|text\/uri-list)/ },
];
function scan(lines) {
  const hits = [];
  lines.forEach((l, i) => { const c = stripC(l); if (/\?\s*['"][a-z0-9]+['"]\s*:/.test(c)) return; // skip an ext-string ternary (avatar 'png'?'gif' — picks a file extension, NOT a unit class)
    for (const d of DISPATCH) if (d.re.test(c)) { hits.push({ line: i + 1, key: d.key, text: c.trim().slice(0, 100) }); break; } });
  return hits;
}
const src = fs.readFileSync(SERVER, 'utf8').split('\n');
const hits = scan(src);
R('═══ T37.20 DEFECT-2 OPEN/CLOSED LINT — mime→class dispatch conditionals in the upload/drop path ═══');
R(`  class-dispatch conditionals OUTSIDE a mime-class registry : ${hits.length}  ${hits.length === 0 ? 'GREEN' : 'RED'}`);
for (const h of hits) R(`    server.ts:${h.line} [${h.key}]  ${h.text}`);

// FAILABLE: a rogue per-class mime conditional appended MUST be counted (proves a 6th-class if-edit cannot slip past).
const rogue = src.concat([`  const isImg = mimeType === 'image/png'; // rogue per-class dispatch`]);
const teeth = scan(rogue).length === hits.length + 1;
R(`  FAILABLE self-test (inject a per-class mime conditional → RED): ${teeth ? 'PASS (teeth — a new hardcoded class-branch cannot slip in)' : 'FAIL (toothless)'}`);

const green = hits.length === 0 && teeth;
R(`OVERALL: ${green ? 'GREEN — class dispatch is registry-driven; a 6th class = one register(), zero if-edits (open/closed held)' : 'RED'}`);
R(`  RED-baseline (pre-Factory/Registry): the drop-router chooses class via the isWebItem if-chain (server.ts:2693/2777) → adding Image/Email/Contact/CalendarEntry edits it = NOT open/closed. GREEN when a self-registering mime-class registry replaces the conditional.`);
process.exit(green ? 0 : 1);
