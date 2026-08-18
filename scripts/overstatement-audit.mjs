#!/usr/bin/env node
// overstatement-audit.mjs — the CONVERSE of checklist-chain-audit (family: over-recorded-progress).
//
// UNDER (checklist-chain-audit): checklist LAGS the chain (Planned but Impl shipped) = hides delivered work.
// OVER (this): checklist/status is AHEAD of the chain evidence — a step is TICKED but the chain has NOT
// reached it (implementing[x] with no shipped-credited Impl; testing[x]/QA-Review with no two-keyed passing
// Test). This is the direction that would let a task READ ready-to-verdict when the evidence is not there —
// exactly what we must NOT create while fixing the understated set.
//
// Uses the ONE shared real-chain-edge predicate (StepEvidence) — same source as statusNext + checklist-chain-audit,
// so "recorded" means the same thing in all three. Coverage counts ONLY on a two-keyed passing Test / shipped Impl.
//
// Usage: node --import tsx scripts/overstatement-audit.mjs [--sprint <name-substr>]  (default: all, highlight none)

import fs from 'fs';
import path from 'path';
import { StepEvidence } from '../src/ts/scenario/step-evidence.js';

const ref = s => String(s || '').replace('ior:instance:', '');
const ORDER = ['Planned', 'In Progress', 'QA Review', 'Done'];
function deriveStatusEnum(cl) {
  if (typeof cl !== 'string') return 'Planned';
  let best = 'Planned';
  for (const line of cl.split('\n')) {
    const m = line.match(/^- \[x\] (Planned|In Progress|QA Review|Done)/);
    if (m && ORDER.indexOf(m[1]) > ORDER.indexOf(best)) best = m[1];
  }
  return best;
}
const ticked = (cl, step) => typeof cl === 'string' && new RegExp('^\\s*- \\[x\\] ' + step, 'm').test(cl);
const qaChecked = cl => typeof cl === 'string' && /^- \[x\] QA Review/m.test(cl);

// load graph
const root = process.argv.includes('--sprint') ? undefined : undefined;
const IDX = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'scenario', 'index');
const byUuid = new Map();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.scenario.json')) {
      try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if (j.model && j.model.uuid) byUuid.set(j.model.uuid, { ior: j.ior, m: j.model }); } catch {}
    }
  }
})(IDX);
const get = u => byUuid.get(ref(u));

const tasks = [...byUuid.values()].filter(x => x.ior === 'ior:class:Task');
const over = [];
for (const t of tasks) {
  const m = t.m;
  const cl = m.statusChecklist;
  const shippedImpl = StepEvidence.evidenceForStep(get, t, 'implementing');
  const coveredByTest = StepEvidence.evidenceForStep(get, t, 'testing');
  const label = { uuid: (m.uuid || '').slice(0, 8), sprint: m.sprintName || '?', name: (m.name || '').slice(0, 46) };
  // implementing ticked but no shipped Impl on the chain
  if (ticked(cl, 'implementing') && !shippedImpl)
    over.push({ ...label, kind: 'IMPLEMENTING[x] but chain has NO shipped/credited Impl' });
  // testing ticked (or QA-Review checked) but no two-keyed passing Test
  if ((ticked(cl, 'testing') || qaChecked(cl)) && !coveredByTest)
    over.push({ ...label, kind: (qaChecked(cl) ? 'QA-Review' : 'testing[x]') + ' but chain has NO two-keyed passing Test' });
}
over.sort((a, b) => (a.sprint + a.uuid).localeCompare(b.sprint + b.uuid));
console.log(`== overstatement-audit (family: over-recorded-progress) — scanned ${tasks.length} tasks ==`);
console.log(`OVER (${over.length}) — checklist ticked AHEAD of chain evidence:`);
for (const o of over) console.log(`  [${o.sprint}] ${o.uuid} | ${o.name} | ${o.kind}`);
