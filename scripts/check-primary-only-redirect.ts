/**
 * RANK-3 PRIMARY-ONLY INVARIANT gate (write-time, oopPO rank 3 — SPLIT: invariant now, collapse HELD). Enforce, do NOT document.
 * A consolidation must write redirectTo = the TERMINAL primary (resolveRedirectChain), so a NEW multi-hop chain can NEVER be
 * created — a chain that cannot exist beats one that is followed. stub-must-fail: revert the write to the bare immediate
 * `friend.redirectTo = myToken` → RED.
 * ★ GRANDFATHER-AWARE BY CONSTRUCTION: this gate tests WRITE-TIME behaviour + the pure resolver ONLY. It DOES NOT scan
 *   existing userProfiles for pre-existing chains — Tron's 3 live chains are GRANDFATHERED pending the architect's
 *   tombstone-immutability ruling ((a) immutable-grandfather vs (b) path-not-answer), and a gate that red on them would be
 *   red-by-construction (the FIX-2 trap we deliberately avoided). The one-time collapse is a SEPARATE, HELD item.
 */
import { resolveRedirectChain } from '../src/ts/server/redirect-chain.js';
import { readFileSync } from 'node:fs';

const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };

// 1) the resolver collapses a chain a→b→c to the TERMINAL c — so writing resolveRedirectChain(target) is ALWAYS terminal.
const chain = new Map<string, string>([['a', 'b'], ['b', 'c']]); // c = terminal (no redirect)
const redirectOf = (t: string): string | undefined => chain.get(t);
if (resolveRedirectChain('a', redirectOf) !== 'c') fail('resolveRedirectChain(a) != terminal c — a mid-hop would be written.');
if (resolveRedirectChain('b', redirectOf) !== 'c') fail('resolveRedirectChain(b) != terminal c.');
if (resolveRedirectChain('c', redirectOf) !== 'c') fail('resolveRedirectChain(terminal) != itself.');
const cyc = new Map<string, string>([['a', 'b'], ['b', 'a']]); // cycle must terminate (bounded), not hang
if (!resolveRedirectChain('a', (t: string) => cyc.get(t))) fail('cycle not terminated (resolver must be cycle-safe).');

// 2) WRITE-TIME INVARIANT at the consolidation site: server.ts writes redirectTo = redirectTombstoneToPrimary(myToken)
//    (= resolveRedirectChain, terminal primary), NOT the bare immediate myToken. stub-must-fail: bare assignment → RED.
const srv = readFileSync(new URL('../src/ts/server/server.ts', import.meta.url), 'utf-8');
if (/friend\.redirectTo\s*=\s*myToken\b/.test(srv)) fail('consolidation writes the IMMEDIATE myToken (not the terminal primary) — a NEW multi-hop chain can form.');
if (!/friend\.redirectTo\s*=\s*redirectTombstoneToPrimary\(myToken\)/.test(srv)) fail('consolidation write must use redirectTombstoneToPrimary(myToken) (the terminal-primary invariant).');

console.log('✓ primary-only invariant (write-time): consolidation writes redirectTo = TERMINAL primary (resolveRedirectChain); a new multi-hop chain cannot be created. Grandfather-aware (no scan of existing data); collapse held for the architect ruling.');
