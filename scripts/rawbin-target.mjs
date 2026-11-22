// R42.1 tests-never-touch-prod — the ONE resolver of where a test connects. FAIL-CLOSED: no env → the
// isolated local server (same port as playwright.config.ts isolation, HTTPS 4445). Prod is reached ONLY
// with an explicit RAWBIN_TARGET=prod, and that prints a warning.
export const PROD_TARGET = Object.freeze({ host: 'prod.wo-da.de', port: 4444 });

// [impl:uuid:261d0214-e434-44bc-bc84-1e8589f9dfa9] RawbinTarget.resolveRawbinTarget
export function resolveRawbinTarget(env = process.env, warn = console.warn) {
  const isProd = String(env.RAWBIN_TARGET || 'local').toLowerCase() === 'prod';
  const t = isProd ? PROD_TARGET : { host: env.RAWBIN_HOST || 'localhost', port: Number(env.RAWBIN_PORT || 4445) };
  if (isProd) warn('[rawbin-target] ⚠ RAWBIN_TARGET=prod — this gate talks to the LIVE server');
  return { host: t.host, port: t.port, base: `https://${t.host}:${t.port}`, wss: `wss://${t.host}:${t.port}`, isProd };
}
