// Single source for where test/visual gates connect — delegates to scripts/rawbin-target.mjs (R42.1).
// FAIL-CLOSED: default is the isolated local server (HTTPS 4445); prod only with RAWBIN_TARGET=prod.
import { resolveRawbinTarget } from '../../scripts/rawbin-target.mjs';

const t = resolveRawbinTarget();
export const RB_HOST = t.host;
export const RB_PORT = t.port;
export const RB_BASE = t.base;
export const RB_WSS = t.wss;
export const RB_IS_PROD = t.isProd;
