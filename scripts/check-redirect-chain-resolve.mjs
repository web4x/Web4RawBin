/**
 * R1 AC1 multi-hop gate (PO ruling 2026-09-29) — the canonical identity resolver follows the .redirectTo chain to the
 * true PRIMARY, MULTI-HOP and CYCLE-SAFE. A 3+-hop consolidation chain must resolve to the owner (single-hop lost it);
 * a redirect CYCLE must TERMINATE (proven by a seeded cycle, not inspection); a primary/unknown resolves to itself.
 * stub-must-fail (LOUD + FAST, never a hang): remove the bounded-depth throw → an over-depth chain no longer throws
 * → this gate's expect-throw assertion fails → RED with a message. (The `seen` set still gracefully terminates real cycles.)
 */
import { resolveRedirectChain, MAX_REDIRECT_DEPTH } from '../src/ts/server/redirect-chain.js';

const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };
const throws = (fn) => { try { fn(); return false; } catch { return true; } };
const map = { A: 'B', B: 'C', C: 'D', X: 'Y', Y: 'X', Z: 'Z' }; // A→B→C→D (primary); cycle X→Y→X; self-loop Z→Z
const of = (t) => map[t];

// MULTI-HOP: a 3-hop chain resolves to the true primary D (a single-hop resolver would stop at B)
if (resolveRedirectChain('A', of) !== 'D') fail(`3-hop A→B→C→D did not resolve to primary D (got ${resolveRedirectChain('A', of)}) — not multi-hop (the exact/single-hop bug).`);
if (resolveRedirectChain('B', of) !== 'D') fail('2-hop B→C→D did not reach D.');
if (resolveRedirectChain('D', of) !== 'D') fail('a primary (no redirectTo) must resolve to itself.');
if (resolveRedirectChain('unknown', of) !== 'unknown') fail('an unmapped token must resolve to itself.');

// CYCLE-SAFE: seeded cycles TERMINATE (return a value; do not hang). If this line hangs, the cycle-guard was removed = RED.
const cyc = resolveRedirectChain('X', of);
if (cyc !== 'X' && cyc !== 'Y') fail(`cycle X→Y→X must terminate at a cycle node (got ${cyc}).`);
const self = resolveRedirectChain('Z', of);
if (self !== 'Z') fail(`self-loop Z→Z must terminate (got ${self}).`);

// BOUNDED-DEPTH backstop (LOUD + FAST, not a hang): an over-depth linear chain THROWS the named error.
const longMap = {};
for (let i = 0; i < MAX_REDIRECT_DEPTH + 5; i++) longMap['n' + i] = 'n' + (i + 1); // n0→n1→…→n(MAX+5): longer than the bound
if (!throws(() => resolveRedirectChain('n0', (t) => longMap[t]))) fail(`an over-depth chain (>${MAX_REDIRECT_DEPTH} hops) did NOT throw — the bounded-depth guard is missing; a malformed redirect could hang the request path.`);

console.log(`✓ R1 AC1 multi-hop: 3-hop chain → primary D; cycle X→Y→X + self-loop Z→Z TERMINATE (cycle-safe); over-depth (>${MAX_REDIRECT_DEPTH}) THROWS loud+fast; primary/unknown → self.`);
