// R40.96-101 TRANSPORT-OWNERSHIP LINT (charter dim 4, radical-OOP REST unit-JSON transport). Tron: "transport IS the scenario,
// unit JSON is the only thing transferred." Native files legitimately arrive as multipart binaries at EXACTLY ONE place
// (NativeFileIngress) and become scenario units THERE — multipart/boundary/content-type handling must NEVER propagate inward.
// So this is NOT "delete multipart" (that would RED the legit ingress + the upload POST that stays) — it is an OWNERSHIP lint:
// count the multipart-transport HAZARD (scan the hazard, not the actors) in PRODUCT source OUTSIDE the ingress owner FILE, assert 0.
//
// OWNER = POSITIONAL by path (rename-safe, never a self-describing phrase): any file whose path matches /native-?file-?ingress/i.
// HAZARD = the operations that only exist to parse/serialize a multipart wire body (not a generic HTTP Content-Type header):
//   multipart/form-data · boundary= extraction / --boundary split · new FormData( · .append( on a FormData · Content-Disposition
//   · body.toString('binary') (multipart body decode). Comments are ignored (a design note is not handling).
// RED-BASELINE NOW (pre-refactor): the parser (server.ts) + the client drop path (drop-dispatcher.ts) hold this OUTSIDE any
// ingress owner (which does not exist yet) → count > 0 = RED. GREEN when the refactor consolidates ALL of it into the ONE
// NativeFileIngress. FAILABLE: seed a real hazard in a non-owner temp file → the count rises → teeth proven. Pairs with r4090
// (behaviour-unchanged: uploads still WORK end-to-end through the refactor) — structural ownership + behavioural proof together.
import fs from 'node:fs';
import path from 'node:path';
const R = (v) => console.log(v);
const ROOT = path.resolve('.');
const ROOTS = ['src/ts', 'src/public/ts']; // PRODUCT source only — never test/visual (those gates legitimately build multipart)
const OWNER_RE = /native-?file-?ingress/i; // POSITIONAL owner: the ONE legitimate native-file ingress class file, by PATH

// Each hazard is a literal multipart-transport operation. `content-type` alone is NOT a hazard (every JSON response sets one) —
// only a content-type used to carry/extract a multipart boundary is, which `boundary=` / `multipart/form-data` already capture.
const HAZARDS = [
  { key: 'multipart/form-data', re: /multipart\/form-data/ },
  { key: 'boundary-extract', re: /boundary\s*=|--['"`]?\s*\+\s*boundary|split\(\s*['"`]boundary=/ },
  { key: 'FormData', re: /new FormData\(|FormData\(\)/ },
  { key: 'Content-Disposition', re: /Content-Disposition/i },
  { key: "toString('binary')", re: /toString\(\s*['"]binary['"]\s*\)/ },
];
const isComment = (l) => { const t = l.trim(); return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'); };

function walk(dir, acc) { let e = []; try { e = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const d of e) { const p = path.join(dir, d.name); if (d.name === 'node_modules' || d.name === 'dist' || d.name === '.git') continue;
    if (d.isDirectory()) walk(p, acc); else if (d.name.endsWith('.ts')) acc.push(p); } return acc; }

function scan() {
  const files = ROOTS.flatMap((r) => walk(path.join(ROOT, r), []));
  const hits = []; let ownerFileFound = null;
  for (const f of files) {
    const rel = f.replace(ROOT + '/', '');
    const isOwner = OWNER_RE.test(rel);
    if (isOwner) ownerFileFound = rel;
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    // skip comments AND log calls: a `boundary=` literal inside an addLog/console string is diagnostics, NOT multipart handling
    // (tighten after r4096 false-positived on server.ts:2682 `addLog('[upload] parsed: … boundary=yes …')` — noted, does not move the RED baseline).
    lines.forEach((l, i) => { if (isComment(l) || /addLog\(|console\.(log|error|warn|info)/.test(l)) return; for (const h of HAZARDS) { if (h.re.test(l)) { if (!isOwner) hits.push({ rel, line: i + 1, key: h.key, text: l.trim().slice(0, 90) }); break; } } });
  }
  return { hits, ownerFileFound, fileCount: files.length };
}

const { hits, ownerFileFound, fileCount } = scan();
R(`═══ R40.96 TRANSPORT-OWNERSHIP LINT — multipart handling OUTSIDE the NativeFileIngress owner ═══`);
R(`  scanned ${fileCount} product .ts (src/ts + src/public/ts) ; owner file (positional /native-file-ingress/) = ${ownerFileFound || 'NONE YET (pre-refactor)'}`);
R(`  multipart-transport hazards OUTSIDE the owner : ${hits.length}  ${hits.length === 0 ? 'GREEN' : 'RED'}`);
const byFile = {}; for (const h of hits) (byFile[h.rel] = byFile[h.rel] || []).push(h);
for (const rel of Object.keys(byFile)) { R(`    ${rel} (${byFile[rel].length}):`); for (const h of byFile[rel].slice(0, 6)) R(`      :${h.line} [${h.key}] ${h.text}`); }

// ── FAILABLE self-test (teeth): seed a REAL hazard in a non-owner temp file inside a scanned root → the count MUST rise, then remove it.
const probe = path.join(ROOT, 'src/ts', `__r4096_probe_${process.pid}.ts`);
let teeth = false;
try { fs.writeFileSync(probe, `const fd = new FormData(); // multipart/form-data rogue\n`); const after = scan().hits.length; teeth = after === hits.length + 1; }
finally { try { fs.unlinkSync(probe); } catch {} }
R(`  FAILABLE self-test (seed a rogue FormData in a non-owner file → detected): ${teeth ? 'PASS (teeth proven — a new inward multipart use cannot slip past)' : 'FAIL (lint is toothless — FIX before trusting a green)'}`);

const green = hits.length === 0 && teeth;
R(`OVERALL: ${green ? 'GREEN — multipart lives ONLY at NativeFileIngress; unit-JSON transport everywhere else' : 'RED'}`);
R(`  RED-baseline expectation (pre-refactor): hazards scattered in the parser + client drop path, no ingress owner yet → RED. Flips GREEN when the refactor consolidates them into the ONE NativeFileIngress.`);
R(`  PAIR: behaviour-unchanged is r4090 (uploads must still WORK end-to-end through the refactor) — ownership GREEN + r4090 GREEN together, never one alone.`);
process.exit(green ? 0 : 1);
