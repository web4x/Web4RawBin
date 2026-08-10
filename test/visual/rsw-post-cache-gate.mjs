// [test:uuid:7d0e3ff0-b6fe-4bfd-a444-e04a1506ed31] BUG-C — sw.js networkFirst must NOT Cache.put a non-GET request (POST/PUT/DELETE):
// Cache.put on a POST throws 'Request method POST is unsupported'. Fix = guard cache.put with request.method==='GET'
// (or skip non-GET at the fetch handler). Served-source audit (deterministic, no browser). RED until the guard lands.
import https from 'node:https';
const get = (p) => new Promise((res) => { https.request({ host: 'prod.wo-da.de', port: 4444, path: p, method: 'GET', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', (c) => b += c); r.on('end', () => res(b)); }).on('error', () => res('')).end(); });

const results = [];
for (let i = 1; i <= 3; i++) {
  const sw = await get('/sw.js');
  // SCOPE to networkFirst specifically (a method===GET elsewhere in sw.js must NOT green this) — the exact site of BUG-C
  const nf = (sw.match(/async function networkFirst[\s\S]*?\n\}/) || [''])[0];
  const hasCachePut = /cache\.put\s*\(/.test(nf);                                   // anti-vacuity: networkFirst's cache.put exists
  const guardIdx = nf.search(/request\.method\s*===\s*['"]GET['"]/);               // the GET guard, INSIDE networkFirst
  const putIdx = nf.indexOf('cache.put');
  const methodGuard = guardIdx >= 0 && putIdx >= 0 && guardIdx < putIdx;           // guard must come BEFORE the cache.put it protects
  const pass = hasCachePut && methodGuard;
  results.push(pass);
  console.log(`iter ${i}: served-sw-has-cache.put=${hasCachePut}(control) | GET-guard-before-put=${methodGuard} => ${pass ? 'GREEN' : 'RED'}`);
}
console.log('\n===== BUG-C: sw.js cache.put GET-guarded (served-source, DET-3x) =====');
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED — networkFirst caches a POST (TypeError); needs a request.method===GET guard on cache.put');
process.exitCode = green ? 0 : 1;
