// R40.84 AXIS (c) — RENDER-OWNERSHIP LINT (Tron radical-OOP: "a container renders its OWN children; not fixed everywhere
// again as a DRY violation"). Companion to r4023's behavioural (a) no-collapse + (b) renders+persists. SCAN THE HAZARD, NOT
// THE ACTORS: count every implementation of "add a child to the tree and render it" — a whole-tree RE-SEED call, or a manual
// node-append into a `.tt-children` kids container — that lives OUTSIDE the ONE owning CLASS. Owner-identity = the CLASS METHOD
// the container-object owns its child-rendering through: Node.renderChildren()/onChildAdded() (architect class model 996a39408;
// this ABSORBS + DELETES the old free-function reDeriveDirectChildren). The exception is POSITIONAL — the owner's FILE
// (trace/rb-trace-tree.ts), NEVER a symbol name (rename-safe: reDeriveDirectChildren→renderChildren must not false-flip this)
// and NEVER a phrase the file writes about itself. That count MUST be 0. One number proves BOTH unevadability AND completeness
// across EVERY add path (folder-add / upload / drop / federation-import / FILE_ADDED / room-collection): a fix that only repairs
// folder-add is a FALSE GREEN under Tron's DRY law — this lint still REDs on any other path that re-seeds or hand-appends.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const SRC = path.join(ROOT, 'src/public/ts');
const OWNER = 'trace/rb-trace-tree.ts'; // POSITIONAL exception — the ONE class that owns adding+rendering a tree child

const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.ts')) files.push(p); } })(SRC);

const isComment = (l) => /^\s*(\/\/|\*|\/\*)/.test(l);
// a CALL to renderSeed (whole-tree re-render), not its definition: a receiver-dot then renderSeed(  (incl optional-chaining)
const isReseedCall = (l) => /\.renderSeed\s*\??\.?\s*\(/.test(l);
// a manual node-append into a tree kids container (adding a child node by hand instead of via the owner)
const isKidsAppend = (l) => /\.tt-children/.test(l) && /appendChild\s*\(/.test(l);

function scan(extraFiles) {
  const hits = [];
  const all = [...files.map((p) => [p, fs.readFileSync(p, 'utf8')]), ...(extraFiles || [])];
  for (const [p, txt] of all) {
    const rel = p.replace(ROOT + '/', '');
    if (rel.endsWith(OWNER)) continue; // POSITIONAL exception
    txt.split('\n').forEach((l, i) => {
      if (isComment(l)) return;
      if (isReseedCall(l)) hits.push({ hazard: 'reseed-call', at: `${rel}:${i + 1}`, line: l.trim().slice(0, 110) });
      if (isKidsAppend(l)) hits.push({ hazard: 'manual-kids-append', at: `${rel}:${i + 1}`, line: l.trim().slice(0, 110) });
    });
  }
  return hits;
}

const R = (v) => console.log(v);
const hits = scan();

// FAILABLE self-test (unevadability proof): inject a synthetic violation in a fake file → the detector MUST count it.
const SELF = [['__selftest__/fake-add-path.ts', 'someTree.renderSeed(this.roomId); // a rogue add-path re-seed']];
const withSelf = scan(SELF);
const selfProven = withSelf.length === hits.length + 1;

R('═══ R40.84 AXIS (c) RENDER-OWNERSHIP LINT (add+render owned by ONE class) ═══');
R(`  scanned ${files.length} .ts ; owner (positional) = ${OWNER}`);
R(`  add+render hazards OUTSIDE the owner : ${hits.length}  ${hits.length ? 'RED' : 'GREEN'}`);
hits.forEach((h) => R(`     [${h.hazard}] ${h.at}  ${h.line}`));
R(`  FAILABLE self-test (inject a rogue re-seed → detected): ${selfProven ? 'PASS (teeth proven — the lint cannot be evaded by a new add-path)' : 'FAIL (lint is blind — FIX THE LINT)'}`);
const green = hits.length === 0 && selfProven;
R(`OVERALL: ${green ? 'GREEN — every add path routes through the ONE owner (reDeriveDirectChildren); no external re-seed/hand-append' : (hits.length ? 'RED (an add path renders outside the owner — DRY violation of the render-ownership law)' : 'RED (self-test failed — lint not trustworthy)')}`);
process.exit(green ? 0 : 1);
