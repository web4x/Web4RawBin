// R37.20 SHARED DnD CONTRACT — STRUCTURAL gate (AC shared-contract-fleet-wide + AC-A2 serialize). Source-scan, no build/
// browser: the disease is "per-target format + URL fallback" (architect design-r37.20). Post-fix there is ONE serializer +
// ONE resolver in src/public/ts/dnd-contract.ts, and NO drop target reads the buffer directly. Assert BY CONSTRUCTION:
//   H1 no per-target getData/setData — dataTransfer get/setData appears ONLY in dnd-contract.ts (the ONE home).
//   H2 no *.show serialize (AC-A2) — no drag source writes a `#<type>.show?uuid=` hash into a drag payload (unit ref ONLY).
//   H3 no URL/href parse in a drop handler — no getData('text/html') href/anchor regex in any drop path.
// RED now (3 ad-hoc resolvers + the *.show serialize + RoomView's text/html parse) → GREEN when the contract lands. Any
// violation lists file:line so the fix target is exact. (SCOPE: dnd/drop payload handling only — HTML rendering href= is not a drop parse.)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const SRC = path.join(ROOT, 'src/public/ts');
const CONTRACT = 'dnd-contract.ts'; // the ONE home (new module); allowed to hold get/setData

const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.ts')) files.push(p); } })(SRC);

const H1 = [], H2 = [], H3 = [];
for (const p of files) {
  const rel = p.replace(ROOT + '/', '');
  const isContract = p.endsWith(CONTRACT);
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  const isComment = (l) => /^\s*(\/\/|\*|\/\*)/.test(l);
  lines.forEach((l, i) => {
    if (isComment(l)) return;
    const ln = i + 1;
    // H1: ANY DataTransfer get/setData outside the contract home (receiver may be `dt` OR `dataTransfer` — catch both)
    if (!isContract && /\.(get|set)Data\s*\(/.test(l)) {
      H1.push(`${rel}:${ln}  ${l.trim().slice(0, 100)}`);
    }
    // H2: a drag payload serialized as a *.show hash (AC-A2). The offender writes `#<type>.show?uuid=` (a *.show URL) into a slot.
    if (!isContract && /\.show\?uuid=/.test(l) && !/TraceRouter/.test(rel) && /(setData|hash\s*=|`#)/.test(l)) {
      H2.push(`${rel}:${ln}  ${l.trim().slice(0, 100)}`);
    }
    // H3: a drop handler parsing text/html href/anchor (URL soup)
    if (!isContract && /getData\(\s*['"]text\/html['"]/.test(l)) {
      H3.push(`${rel}:${ln}  ${l.trim().slice(0, 100)}`);
    }
  });
}

const R = (v) => console.log(v);
R('═══ R37.20 DnD-CONTRACT STRUCTURAL GATE (shared-contract-fleet-wide + A2) ═══');
R(`  scanned ${files.length} .ts under src/public/ts ; contract home = ${CONTRACT} (exists=${files.some((p) => p.endsWith(CONTRACT))})`);
R(`  H1 per-target get/setData OUTSIDE ${CONTRACT} : ${H1.length}  ${H1.length ? 'RED' : 'GREEN'}`);
H1.forEach((v) => R(`       ${v}`));
R(`  H2 *.show serialize into a drag payload (A2)  : ${H2.length}  ${H2.length ? 'RED' : 'GREEN'}`);
H2.forEach((v) => R(`       ${v}`));
R(`  H3 text/html href/anchor parse in drop handler: ${H3.length}  ${H3.length ? 'RED' : 'GREEN'}`);
H3.forEach((v) => R(`       ${v}`));
const green = H1.length === 0 && H2.length === 0 && H3.length === 0;
R(`OVERALL: ${green ? 'GREEN — one serializer + one resolver, no per-target format, no URL fallback' : 'RED (expected pre-fix: the 4 ad-hoc resolvers + *.show serialize + text/html parse still present)'}`);
process.exit(green ? 0 : 1);
