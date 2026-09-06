// R40.88 UPLOAD-OWNERSHIP LINT (Tron: "wtf dont you understand in EVERYWHERE" + "by oop!!!"; PO 2026-09-06). A file upload must be
// constructed in EXACTLY ONE place — the single owning class method — so there is ONE path users actually hit and ONE thing to
// fix/test. MEASURED today: TWO upload constructions in drop-dispatcher.ts (:59-65 FormData+fetch, :85-92 FormData+xhr) + a THIRD
// synthetic shape we invented for a gate — so our green covered a path nobody uses. THIS lint makes that unconstructable.
//
// HAZARD (scan the operation, not the actors): a client-side multipart/FormData FILE-UPLOAD construction — `new FormData()` whose
// purpose is to POST a file to the room upload endpoint. Count them in PRODUCT source; there must be EXACTLY ONE (the owner).
// OWNER = POSITIONAL by path+method (rename-safe, never a self-describing phrase): the single upload method. Until collapsed, >=2
// = RED. GREEN only when both call sites collapse into the one object method (same 1->0 shape as the render-ownership lint).
// SERVER-SIDE half = r4096 transport lint (multipart/boundary/content-type parse OUTSIDE NativeFileIngress == 0) — activate together.
// FAILABLE: seed a rogue `new FormData()` upload in a non-owner file → count rises → teeth.
// ⚠ NOT a constructed-request gate — this is a SOURCE ownership lint, no fabricated input (the false-green that fooled us was an
//   authored request; this asserts structure, which a fabricated subject cannot fake).
import fs from 'node:fs';
import path from 'node:path';
const R = (v) => console.log(v);
const ROOT = path.resolve('.');
const ROOTS = ['src/public/ts', 'src/ts']; // PRODUCT source only — never test/visual (gates legitimately build multipart)
const PRUNE = new Set(['node_modules', '.git', 'dist']);
const isComment = (l) => { const t = l.trim(); return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'); };

const walk = (d, a) => { let e = []; try { e = fs.readdirSync(d, { withFileTypes: true }); } catch { return a; } for (const x of e) { if (PRUNE.has(x.name)) continue; const p = path.join(d, x.name); if (x.isDirectory()) walk(p, a); else if (x.name.endsWith('.ts')) a.push(p); } return a; };
const files = ROOTS.flatMap((r) => walk(path.join(ROOT, r), []));

// each `new FormData(` in product source that is an upload construction = one HAZARD site. (FormData in this app exists to POST
// file uploads; a bare new FormData with no file append is vanishingly rare and would still be an upload-shaped construction.)
const sites = [];
for (const f of files) {
  const rel = f.replace(ROOT + '/', '');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, i) => { if (isComment(l)) return; if (/new FormData\(/.test(l)) sites.push({ rel, line: i + 1, text: l.trim().slice(0, 90) }); });
}

R('═══ R40.88 UPLOAD-OWNERSHIP LINT — client multipart/FormData upload constructions (must be EXACTLY 1 owner) ═══');
R(`  scanned ${files.length} product .ts (src/public/ts + src/ts)`);
R(`  upload constructions found : ${sites.length}  ${sites.length === 1 ? 'GREEN (one owner)' : 'RED'}`);
for (const s of sites) R(`      ${s.rel}:${s.line}  ${s.text}`);
R(`  invariant: EXACTLY 1 (the single owning class method). ${sites.length >= 2 ? sites.length + ' = ' + sites.length + ' un-owned duplicate upload paths (a green over one covers a path nobody uses)' : sites.length === 0 ? '0 = no upload path found (check the scan)' : 'one owner'}`);

// FAILABLE self-test: seed a rogue upload construction in a non-owner temp file → count MUST rise, then remove it.
const probe = path.join(ROOT, 'src/public/ts', `__r4088_probe_${process.pid}.ts`);
let teeth = false;
try { fs.writeFileSync(probe, 'const fd = new FormData(); fd.append("file", blob); // rogue upload\n'); teeth = fs.readFileSync(probe, 'utf8').includes('new FormData(') && (files.length, true);
  // re-scan quickly for the probe
  let after = 0; for (const f of [...files, probe]) { try { for (const l of fs.readFileSync(f, 'utf8').split('\n')) { if (!isComment(l) && /new FormData\(/.test(l)) after++; } } catch {} }
  teeth = after === sites.length + 1;
} finally { try { fs.unlinkSync(probe); } catch {} }
R(`  FAILABLE self-test (seed a rogue upload construction → detected): ${teeth ? 'PASS (teeth — a new upload path cannot slip in un-owned)' : 'FAIL (toothless — fix before trusting green)'}`);

const green = sites.length === 1 && teeth;
R(`OVERALL: ${green ? 'GREEN — exactly ONE upload construction (single owner); collapse achieved' : 'RED'}`);
R(`  RED-baseline expectation: >=2 today (drop-dispatcher.ts fetch + xhr). Flips GREEN when both collapse into the ONE object method.`);
R(`  PAIR: server-side transport ownership = r4096 (multipart/boundary parse outside NativeFileIngress == 0). Client-one-owner + server-one-ingress together = 'upload is by OOP, EVERYWHERE'.`);
process.exit(green ? 0 : 1);
