// Single source for where test/visual gates connect. FAIL-CLOSED: the default is an isolated
// local server (same ports as playwright.config.ts isolation: HTTPS 4445). Prod is reached ONLY
// with an explicit RAWBIN_TARGET=prod (consolidation plan, phase 1: "never test on prod").
const target = (process.env.RAWBIN_TARGET || 'local').toLowerCase();
const PROD = { host: 'prod.wo-da.de', port: 4444 };
const LOCAL = { host: process.env.RAWBIN_HOST || 'localhost', port: Number(process.env.RAWBIN_PORT || 4445) };
const t = target === 'prod' ? PROD : LOCAL;
if (target === 'prod') console.warn('[rawbin-target] ⚠ RAWBIN_TARGET=prod — this gate talks to the LIVE server');
export const RB_HOST = t.host;
export const RB_PORT = t.port;
export const RB_BASE = `https://${t.host}:${t.port}`;
export const RB_WSS = `wss://${t.host}:${t.port}`;
export const RB_IS_PROD = target === 'prod';
