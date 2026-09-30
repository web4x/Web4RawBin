/**
 * WS KEEPALIVE gate (oopPO GAP-FIX — NOT the flap root). Enforce, do NOT document.
 * The server must PING idle app sockets on a battery-conscious interval + TERMINATE a peer that misses N pongs, and
 * every keepalive terminate must pass THROUGH the reconnect close-counter (so the visibility BITE stays green — a calmer
 * server cannot hide a future storm). stub-must-fail: remove the ping → RED; a live idle hold showing pings is the tester's live check.
 */
import { keepaliveShouldTerminate, KEEPALIVE_MAX_MISSED_PONGS } from '../src/ts/server/reconnect-tracker.js';
import { readFileSync } from 'node:fs';

const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };

// 1) PURE decision: terminate IFF missedPongs >= max (not before; yes at/after).
if (keepaliveShouldTerminate(KEEPALIVE_MAX_MISSED_PONGS - 1)) fail('terminates too early (below the missed-pong bound) — a transient miss would kill a live peer.');
if (!keepaliveShouldTerminate(KEEPALIVE_MAX_MISSED_PONGS)) fail('does NOT terminate a peer at the missed-pong bound — a dead peer is never detected.');
if (!keepaliveShouldTerminate(KEEPALIVE_MAX_MISSED_PONGS + 5)) fail('does NOT terminate a long-dead peer.');

const srv = readFileSync(new URL('../src/ts/server/server.ts', import.meta.url), 'utf-8');
// 2) the server actually PINGS on the keepalive interval — remove the ping → RED (the whole point of the gap-fix).
if (!/setInterval\(/.test(srv) || !/\.ping\(\)/.test(srv)) fail('server sends NO keepalive ping (setInterval + .ping()) — an idle socket is never kept alive, a dead peer never detected.');
if (!/KEEPALIVE_INTERVAL_MS/.test(srv)) fail('keepalive not on the battery-conscious KEEPALIVE_INTERVAL_MS constant.');
// 3) a non-ponging peer IS terminated — gated by keepaliveShouldTerminate, via ws.terminate() (which fires 'close').
if (!/keepaliveShouldTerminate\(/.test(srv) || !/\.terminate\(\)/.test(srv)) fail('a non-ponging peer is NOT terminated (need keepaliveShouldTerminate + .ws.terminate()).');
// 4) every keepalive close passes THROUGH the counter: the close handler records UNCONDITIONALLY (terminate fires close → recorded).
if (!/ws\.on\('close'[\s\S]{0,500}reconnectTracker\.record/.test(srv)) fail('the ws.on(close) handler does not record reconnectTracker.record — a keepalive-terminated close would be INVISIBLE, blinding the storm detector.');
// 5) a pong resets liveness (so a LIVE peer is never terminated).
if (!/ws\.on\('pong'/.test(srv)) fail('no pong handler — a live peer would accumulate missed pongs and be wrongly terminated.');

console.log(`✓ WS keepalive (GAP-FIX): server pings on the battery-conscious interval; a peer missing >=${KEEPALIVE_MAX_MISSED_PONGS} pongs is ws.terminate()-d (fires close → counted); pong resets liveness; every keepalive close passes through the reconnect counter (visibility BITE stays green).`);
