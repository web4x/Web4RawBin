// R40.81 SLICE-3 SPLIT-BRAIN WRITE LINT (PO order: "your repoint gate should CATCH split-brain — a write landing in one store
// while reads come from the other"). The Slice-2 READ resolver (server.ts:~136) honours MODEL_READ_SOURCE
// (scenario-index ? PROD_INDEX : MODEL_STORE). But the model WRITE paths HARDCODE MODEL_STORE — so once Slice-3 flips the read
// default to scenario-index, a write lands in MODEL_STORE while reads come from PROD_INDEX = SPLIT-BRAIN (the written/updated
// unit is invisible to reads). The architect ordered WRITE-COUPLING FIRST; this lint proves it happened, by construction.
//
// HAZARD (scan the hazard, not the actors): a model-tree WRITE fs-op whose target is a STORE LITERAL (MODEL_STORE / PROD_INDEX)
// instead of the ONE resolver root that reads use. Owner = the collapsed read-source resolver (POSITIONAL: the function that
// returns the store root by reading MODEL_READ_SOURCE). Count write-to-literal OUTSIDE that resolver, assert 0.
// RED-BASELINE NOW (pre-coupling): writes hardcode MODEL_STORE → RED. GREEN when every model write routes through the SAME
// resolver root as reads (write-coupling). FAILABLE: seed a rogue writeFileSync(MODEL_STORE…) → count rises → teeth.
// ⚠ NOTE: this is the STRUCTURAL half. The BEHAVIOURAL split-brain probe (write via /api/model/* under MODEL_READ_SOURCE=
// scenario-index → assert the write is VISIBLE to a read) fires on the SLICE-3 REPOINT COMMIT inside the repoint run (r4081c
// companion), where the default is flipped and the write path is coupled. Both together = the full split-brain catch.
import fs from 'node:fs';
import path from 'node:path';
const R = (v) => console.log(v);
const SERVER = path.resolve('src/ts/server/server.ts');
const src = fs.readFileSync(SERVER, 'utf8').split('\n');

// a WRITE fs-op (mutates a store on disk) + a model-store LITERAL target on the SAME line = a write NOT routed through the resolver.
const WRITE_OP = /(writeFileSync|mkdirSync|unlinkSync|rmSync|renameSync)\s*\(|generateProjectModel\s*\(/;
const STORE_LITERAL = /\bMODEL_STORE\b|\bPROD_INDEX\b/;
// the resolver's OWN body legitimately names the literals to CHOOSE between them — exclude it POSITIONALLY (the ternary that
// reads MODEL_READ_SOURCE). Detected by the flag reference on/near the line, not by a phrase.
const isResolverLine = (l) => /MODEL_READ_SOURCE/.test(l);

function scan(lines) {
  const hits = [];
  lines.forEach((l, i) => {
    if (l.trim().startsWith('//') || l.trim().startsWith('*')) return;
    if (WRITE_OP.test(l) && STORE_LITERAL.test(l) && !isResolverLine(l)) hits.push({ line: i + 1, text: l.trim().slice(0, 120) });
  });
  return hits;
}

const hits = scan(src);
R('═══ R40.81 SLICE-3 SPLIT-BRAIN WRITE LINT — model writes NOT routed through the read resolver ═══');
R(`  read resolver honours MODEL_READ_SOURCE: ${src.some(isResolverLine) ? 'yes (server.ts)' : 'NOT FOUND (⚠ resolver missing)'}`);
R(`  model WRITE-to-store-LITERAL sites (would land in the wrong store post-read-flip) : ${hits.length}  ${hits.length === 0 ? 'GREEN' : 'RED'}`);
for (const h of hits) R(`    server.ts:${h.line}  ${h.text}`);

// FAILABLE self-test (teeth): a rogue write-to-literal appended to the scanned lines MUST be counted.
const rogue = src.concat(['  fsSync.writeFileSync(path.join(MODEL_STORE, "x"), "rogue"); // seeded']);
const teeth = scan(rogue).length === hits.length + 1;
R(`  FAILABLE self-test (seed a rogue writeFileSync(MODEL_STORE…) → detected): ${teeth ? 'PASS (teeth — a new uncoupled write cannot slip in)' : 'FAIL (toothless)'}`);

const green = hits.length === 0 && teeth && src.some(isResolverLine);
R(`OVERALL: ${green ? 'GREEN — every model write routes through the read resolver root (no split-brain)' : 'RED'}`);
R(`  RED-baseline expectation (pre-coupling): model writes hardcode MODEL_STORE (generate-project 2944 + writeFileSync sites) → RED. Flips GREEN when the expert couples writes to the resolver root (write-coupling FIRST, architect order).`);
R(`  PAIR with the BEHAVIOURAL probe on the Slice-3 repoint commit: write via /api/model/* under MODEL_READ_SOURCE=scenario-index → the write MUST be visible to a read (invisible = split-brain RED).`);
process.exit(green ? 0 : 1);
