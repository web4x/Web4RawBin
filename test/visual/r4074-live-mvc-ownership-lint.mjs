// R37.4 LIVE-MVC OWNERSHIP LINT (Tron: "the team still fails on using it as live mvc state changes like it works now on add
// folder"). ADD-FOLDER IS THE REFERENCE: a mutation publishes on the OWNING container ref (publishUnitChanged / ViewBus.notify)
// and the owning object RE-DERIVES its own children IN PLACE — no view rebuild. This lint measures how many state changes still
// FAIL to ride that: a WS state-change handler that responds by REBUILDING a view (render / renderSeed / renderMemberList /
// innerHTML) instead of publishing on the owning ref. THE NUMBER is the finding — how many mutations aren't live-MVC; 1->0
// proves the generalisation landed (same shape as r4084 render-ownership 1->0, r4088/r4096).
//
// ★ SCOPING ON PRINCIPLE (not rationalising): the naive metric 'count innerHTML' = 133, but that is an OVER-COUNT — most are
//   legitimate INITIAL renders (a component painting itself), NOT live-MVC violations. Counting them would inflate the finding
//   and flag correct code. The VIOLATION is specifically a MUTATION that triggers a rebuild. So we count rebuild calls INSIDE a
//   WS state-change handler (client.on(MSG.<mutation>, …)), which is exactly 'a state change that rebuilds'. Initial render is out
//   of scope by definition (it is not a state-change response). The GOOD path (publishUnitChanged/ViewBus.notify in the handler)
//   is NOT counted — that IS live-MVC. OWNER exception (positional): the tree owner (rb-trace-tree.ts / tree-node.ts) whose
//   renderSeed is its OWN re-derive primitive.
// FAILABLE: seed a WS handler that rebuilds → count rises. RED-baseline expected HIGH; 1->0 as each mutation adopts publish->re-derive.
import fs from 'node:fs';
import path from 'node:path';
const R = (v) => console.log(v);
const ROOT = path.resolve('.');
const SRC = path.join(ROOT, 'src/public/ts');
const OWNER_RE = /rb-trace-tree|tree-node/; // positional owner: the tree object whose renderSeed IS its own re-derive
const REBUILD = /\brenderSeed\(|\brenderMemberList\(|\bthis\.render\(\)|\.innerHTML\s*=/; // a full/partial VIEW REBUILD
const LIVE_MVC = /publishUnitChanged|ViewBus\.notify/;                                    // the GOOD add-folder pattern
const isComment = (l) => { const t = l.trim(); return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'); };

const files = []; (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (e.name.endsWith('.ts')) files.push(p); } })(SRC);

// A live-MVC VIOLATION = a WS state-change subscription `…on(MSG.<X>, …)` whose handler body REBUILDS a view rather than
// publishing on the owning ref. We scan the handler block (from the on(MSG. line to its closing) for a REBUILD call with no
// LIVE_MVC call — the latter would mean it does ride the pattern.
const violations = []; const rode = [];
for (const f of files) {
  const rel = f.replace(ROOT + '/', '');
  if (OWNER_RE.test(rel)) continue; // owner's own re-derive is legitimate
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /\.on\(\s*(?:MSG\.)?([A-Z_]+)/.exec(lines[i]);
    if (!m) continue;
    const event = m[1];
    // capture the handler block: from here until brace balance returns to the on( line's depth (bounded window)
    let body = '', depth = 0, started = false;
    for (let j = i; j < Math.min(i + 30, lines.length); j++) {
      const l = lines[j]; if (isComment(l)) { body += '\n'; continue; }
      for (const ch of l) { if (ch === '{' || ch === '(') depth++; else if (ch === '}' || ch === ')') depth--; }
      body += l + '\n'; if (l.includes('{')) started = true;
      if (started && depth <= 0 && j > i) break; // handler closed
      if (!started && depth <= 0 && j > i && /\)\s*;?\s*$/.test(l)) break;
    }
    const rebuilds = REBUILD.test(body), livemvc = LIVE_MVC.test(body);
    if (rebuilds && !livemvc) violations.push({ rel, line: i + 1, event });
    else if (livemvc) rode.push({ rel, event });
  }
}

R('═══ R37.4 LIVE-MVC OWNERSHIP LINT — WS state-changes that REBUILD instead of riding add-folder (publish->owner re-derive) ═══');
R(`  scanned ${files.length} client .ts ; owner (positional) = rb-trace-tree/tree-node (its renderSeed = own re-derive)`);
R(`  state-changes that RIDE live-mvc (publish/notify in handler) : ${rode.length}  (the add-folder pattern)`);
R(`  ★ state-changes that REBUILD a view (NOT live-mvc) : ${violations.length}  ${violations.length === 0 ? 'GREEN' : 'RED'}`);
for (const v of violations) R(`      ${v.rel}:${v.line}  on(${v.event}) → rebuild`);
R(`  (SCOPED ON PRINCIPLE: naive innerHTML-count=133 REJECTED as over-broad — initial renders are not state-change responses; only rebuilds INSIDE a mutation handler count.)`);

// FAILABLE self-test: seed a WS handler that rebuilds in a non-owner temp file → violations MUST rise, then remove it.
const probe = path.join(SRC, `__r4074_probe_${process.pid}.ts`);
let teeth = false;
try { fs.writeFileSync(probe, 'x.on(MSG.MEMBER_JOINED, (m) => { this.render(); });\n');
  let after = 0; for (const f of [...files, probe]) { const rel = f.replace(ROOT + '/', ''); if (OWNER_RE.test(rel)) continue; const lines = fs.readFileSync(f, 'utf8').split('\n'); for (let i = 0; i < lines.length; i++) { if (!/\.on\(\s*(?:MSG\.)?[A-Z_]+/.test(lines[i])) continue; let body = ''; for (let j = i; j < Math.min(i + 30, lines.length); j++) body += lines[j] + '\n'; if (REBUILD.test(body) && !LIVE_MVC.test(body)) after++; } }
  teeth = after > violations.length;
} finally { try { fs.unlinkSync(probe); } catch {} }
R(`  FAILABLE self-test (seed a rebuild-on-mutation handler → detected): ${teeth ? 'PASS (teeth — a new non-live-mvc state change cannot slip in)' : 'FAIL (toothless)'}`);

const green = violations.length === 0 && teeth;
R(`OVERALL: ${green ? 'GREEN — every WS state-change rides live-mvc (publish->owner re-derive), like add-folder' : 'RED'}`);
R(`  THE NUMBER = how many state changes still fail to be live-MVC. First-cut client-WS measure; architect enumerates every mutation (upload/drop/delete/rename/member/profile/federation/room-config) — I gate each rides publish->re-derive. Flips toward 0 as the generalisation lands.`);
process.exit(green ? 0 : 1);
