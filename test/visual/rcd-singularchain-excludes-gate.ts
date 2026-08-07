// [test:uuid:e97850c3-fad4-46d0-b8b1-709c4ed7b350] Group-D f2 renderSingularChain chain-excludes-self-and-nonchain — GREEN DET-3x on served v0.8.65. ⚠ req-reconcile the Impl uuid: PO named 18ee26a2, but the SOURCE marker on renderSingularChain (singular-chain.ts:49) is 3542dcb3 ('BUG1 chainExcludesSelf'); wire this Test to whichever is the canonical Impl unit (verify-owner-first).
// Group-D feature 2 — singular-chain.ts chain-excludes-self-and-nonchain (impl 18ee26a2, delivered-live NO Test).
// renderSingularChain(steps, selfUuid) filters `s.uuid !== selfUuid && CHAIN_TYPES.has(type)` — so the chain view
// EXCLUDES the node itself (no self-loop) AND any non-chain type (file/webitem/etc.), keeping the real chain nodes.
// Own-oracle on source; phantom-guard confirmed served==committed==HEAD (v0.8.65), so the source logic == served logic. DET-3x.
import { renderSingularChain } from '../../src/public/ts/trace/singular-chain.ts';

const SELF = 'self-1111-2222-3333';
const steps = [
  { uuid: SELF, type: 'requirement', name: 'SELF requirement', ref: `requirement:${SELF}` }, // self (chain-TYPE but IS self) → excluded
  { uuid: 'req-aaaa', type: 'requirement', name: 'Real Req', ref: 'requirement:req-aaaa' },   // chain, not self → included
  { uuid: 'cls-bbbb', type: 'class', name: 'Real Class', ref: 'class:cls-bbbb' },             // chain, not self → included
  { uuid: 'file-cccc', type: 'file', name: 'A File', ref: 'file:file-cccc' },                 // NON-chain type → excluded
  { uuid: 'web-dddd', type: 'webitem', name: 'A WebItem', ref: 'webitem:web-dddd' },          // NON-chain type → excluded
];

const results: boolean[] = [];
for (let i = 1; i <= 3; i++) {
  const html = renderSingularChain(steps, SELF);
  const excludesSelf = !html.includes(SELF) && !html.includes('SELF requirement');
  const excludesNonChain = !html.includes('file-cccc') && !html.includes('A File') && !html.includes('web-dddd') && !html.includes('A WebItem');
  const includesChain = html.includes('req-aaaa') && html.includes('Real Req') && html.includes('cls-bbbb') && html.includes('Real Class');
  // HOLD/edge: if EVERYTHING filters out (only self present) → the 'No chain' empty state, never a broken render
  const emptyState = renderSingularChain([{ uuid: SELF, type: 'requirement', name: 'x', ref: 'x' }], SELF).includes('No chain');

  const pass = excludesSelf && excludesNonChain && includesChain && emptyState;
  results.push(pass);
  console.log(`iter ${i}: excludes-self=${excludesSelf} excludes-nonchain=${excludesNonChain} includes-chain=${includesChain} empty-state=${emptyState} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== Group-D f2 singular-chain excludes-self-and-nonchain (DET-3x, own-oracle) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (shipped-then-regressed — real finding)');
process.exitCode = green ? 0 : 1;
