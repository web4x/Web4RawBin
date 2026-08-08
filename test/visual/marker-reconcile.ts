// Count-agreement reconcile (INV-T3): run the SHARED predicate analyzeTestMarkers over MY file-set so tester baseline
// and architect/expert gate CANNOT diverge. Divergence must be the file-set glob, not the predicate. Reports two
// candidate locks: (A) test/**/*.ts (expert's proposal) vs (B) test/**/*.{ts,mjs,tsx} (includes .mjs gate scripts —
// most of my browser gates are .mjs, e.g. r255-v0694-gate.mjs). Same module + same files + same regex ⇒ identical counts.
import { analyzeTestMarkers } from '../../src/ts/scenario/test-marker-attach.ts';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const walk = (dir: string, exts: string[], acc: string[] = []): string[] => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, acc);
    else if (exts.some((x) => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
};

const MARKER = /\[test:uuid:([0-9a-fA-F-]+)\]\s*([^\n]*)/g;
function analyze(label: string, exts: string[]) {
  const files = walk(path.join(ROOT, 'test'), exts);
  const fileSrcs = new Map<string, string>();
  const markers: { uuid: string; file: string; offset: number; unitName: string }[] = [];
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    const src = fs.readFileSync(f, 'utf8');
    fileSrcs.set(rel, src);
    let m: RegExpExecArray | null;
    MARKER.lastIndex = 0;
    while ((m = MARKER.exec(src))) markers.push({ uuid: m[1].toLowerCase(), file: rel, offset: m.index, unitName: (m[2] || '').trim() });
  }
  const r = analyzeTestMarkers(fileSrcs, markers);
  console.log(`[${label}] files=${files.length} markers=${markers.length} → COMPLETE=${r.complete.length} UNPROVEN=${r.unproven.length} FICTIONAL=${r.fictional.length}`);
  return { files: files.length, markers: markers.length, ...r };
}

console.log('=== count-agreement reconcile (shared predicate analyzeTestMarkers) ===');
const a = analyze('A: test/**/*.ts', ['.ts']);
const b = analyze('B: test/**/*.{ts,mjs,tsx}', ['.ts', '.mjs', '.tsx']);
console.log(`\nexpert self-test (test/**, [test:uuid:]): 437 markers → COMPLETE 45 / UNPROVEN 202 / FICTIONAL 190`);
console.log(`A matches expert 437? ${a.markers === 437 ? 'YES — file-set + predicate AGREE' : `NO (Δ markers ${a.markers - 437}) → file-set glob differs, not the predicate`}`);
console.log(`.mjs gate contribution (B−A): +${b.markers - a.markers} markers`);

// ★ VERIFY the predicate blind-spot: are KNOWN-REAL script-gate markers (two-key-closed, GREEN DET-3x) mis-flagged FICTIONAL?
const KNOWN_REAL = ['705e8a53', '57829ccc', 'd82ebcf5']; // rc7e prose-gap, rc7f narrative, r255 recognizeIdentity — all real
for (const id of KNOWN_REAL) {
  const inFictional = b.fictional.find((m) => m.uuid.startsWith(id));
  const inComplete = b.complete.find((m) => m.uuid.startsWith(id));
  console.log(`  ${id}: ${inFictional ? `FALSE-FICTIONAL (file ${inFictional.file}, no it()-block)` : inComplete ? 'complete' : 'unproven/absent'}`);
}
