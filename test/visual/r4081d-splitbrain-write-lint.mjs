// R40.81 SLICE-3 SPLIT-BRAIN WRITE LINT (PO order: catch a write landing in one store while reads come from the other). The
// hazard: a model store root reached by the MODEL_STORE LITERAL in CODE anywhere except the ONE owner (ModelStoreLocator) — such
// a write lands in MODEL_STORE unconditionally, so once Slice-3 flips the default to scenario-index it is invisible to reads.
// Coupling = every store access routes through ModelStoreLocator.modelDir()/dirFor() (flag-honouring), so MODEL_STORE the literal
// survives ONLY inside its owner (the const definition + the ModelStoreLocator class body).
//
// ★ CORRECTED INSTRUMENT (v2): the v1 lint matched `MODEL_STORE` in trailing COMMENTS and `PROD_INDEX` on already-coupled lines →
//   6 FALSE POSITIVES on the coupled build. Now: STRIP comments, scan the CODE token `\bMODEL_STORE\b`, owner is POSITIONAL (the
//   const-def line + the ModelStoreLocator class body, brace-tracked — NOT a name allowlist). This matches the expert's own
//   verify method (MODEL_STORE code-refs == 2: the def + the locator). Confirmed the differential still holds: pre-coupling the
//   6 write sites carried `path.join(MODEL_STORE, …)` in CODE → RED; post-coupling they use modelDir() → GREEN.
// HAZARD = a `\bMODEL_STORE\b` code token OUTSIDE the owner. assert 0. FAILABLE: inject one outside → RED.
import fs from 'node:fs';
import path from 'node:path';
const R = (v) => console.log(v);
const SERVER = path.resolve('src/ts/server/server.ts');
const src = fs.readFileSync(SERVER, 'utf8').split('\n');
const stripC = (l) => l.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, ''); // code only — a literal in a comment is not a write

// POSITIONAL owner (rich, not a name-allowlist): the `const MODEL_STORE =` definition line + the ModelStoreLocator class body
// (from `class ModelStoreLocator {` until its brace closes). A MODEL_STORE code token anywhere else = an uncoupled store access.
function ownerLineSet(lines) {
  const owner = new Set();
  lines.forEach((l, i) => { if (/^\s*const\s+MODEL_STORE\s*=/.test(stripC(l))) owner.add(i); });
  const start = lines.findIndex((l) => /class\s+ModelStoreLocator\b/.test(stripC(l)));
  if (start >= 0) { let depth = 0, seen = false; for (let i = start; i < lines.length; i++) { const c = stripC(lines[i]); for (const ch of c) { if (ch === '{') { depth++; seen = true; } else if (ch === '}') depth--; } owner.add(i); if (seen && depth === 0) break; } }
  return { owner, locatorFound: start >= 0 };
}

function scan(lines) {
  const { owner, locatorFound } = ownerLineSet(lines);
  const hits = [];
  lines.forEach((l, i) => { if (owner.has(i)) return; if (/\bMODEL_STORE\b/.test(stripC(l))) hits.push({ line: i + 1, text: stripC(l).trim().slice(0, 110) }); });
  return { hits, locatorFound };
}

const { hits, locatorFound } = scan(src);
R('═══ R40.81 SLICE-3 SPLIT-BRAIN WRITE LINT (v2, code-token + positional owner) ═══');
R(`  owner = ModelStoreLocator class + the MODEL_STORE const-def (positional, brace-tracked): ${locatorFound ? 'found' : '⚠ NOT FOUND'}`);
R(`  MODEL_STORE code-token refs OUTSIDE the owner (uncoupled store access) : ${hits.length}  ${hits.length === 0 ? 'GREEN' : 'RED'}`);
for (const h of hits) R(`    server.ts:${h.line}  ${h.text}`);

// FAILABLE self-test (teeth): a rogue MODEL_STORE code ref OUTSIDE the owner MUST be counted.
const rogue = src.concat(['  const rogue = path.join(MODEL_STORE, "x"); // stub']);
const teeth = scan(rogue).hits.length === hits.length + 1;
R(`  FAILABLE self-test (inject a stray MODEL_STORE code ref outside the owner → RED): ${teeth ? 'PASS (teeth — the lint CAN fail; a new uncoupled write cannot slip past)' : 'FAIL (toothless — a 0 that cannot go RED is worthless)'}`);

const green = hits.length === 0 && teeth && locatorFound;
R(`OVERALL: ${green ? 'GREEN — every model store access routes through ModelStoreLocator; no uncoupled MODEL_STORE literal (no split-brain by construction)' : 'RED'}`);
R(`  Differential: pre-coupling 6 write sites carried path.join(MODEL_STORE,…) in CODE = RED; post-coupling (v0.8.196 ModelStoreLocator) = 0 outside owner = GREEN. EXEMPT_OWNER unused (green by COUPLING, not by an exemption entry).`);
R(`  PAIRS with the BEHAVIOURAL probe (fires on the repoint commit after the flip): a write via /api/model/* under the flipped default MUST be visible to a read.`);
process.exit(green ? 0 : 1);
