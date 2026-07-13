// [test:uuid:462c8bf4-ae51-4d97-8c92-3fcf6d3eb986] R30.6.7 RepoRegistry.resolve — security-probe reject-first (bad-key/abs/traversal/PUT-non-rawbin REJECT) (DET-3x GREEN)
// R30.6.7 — RepoRegistry SECURITY-PROBE (reject-first, same discipline as R27.7 SSRF). prod v0.7.16.
// The server exposes multi-repo file/git access via ?repo=<KEY> (rawbin|oosh). Security invariants:
//   • unknown key -> RepoRegistry.resolve=null -> 400 (client can NEVER supply a path/abs, only a key)
//   • ../ traversal or abs path -> safePath=null -> 403 (stays WITHIN the resolved repo root)
//   • PUT (write) is rawbin-only -> PUT to a non-rawbin repo REJECTED
// Same-origin authorized (Origin header). READ-ONLY by construction: every mutating attempt is a
// REJECT (no write lands); the happy GETs are read-only. Nothing to restore. DET-3x.
// PRIMARY = the negatives (a reject that returns 200 is a BYPASS = RED). Happy-path secondary.

import https from 'https';

const HOST = 'prod.wo-da.de', PORT = 4444;
const req = (method, pathq, body) => new Promise((res) => {
  const data = body != null ? JSON.stringify(body) : null;
  const r = https.request({ host: HOST, port: PORT, path: pathq, method, rejectUnauthorized: false, timeout: 8000,
    headers: { 'Origin': `https://${HOST}:${PORT}`, 'Referer': `https://${HOST}:${PORT}/edit`, ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}) } },
    (resp) => { let b = ''; resp.on('data', c => b += c); resp.on('end', () => res({ status: resp.statusCode, body: b.slice(0, 200) })); });
  r.on('error', () => res({ status: 0, body: 'err' })); r.on('timeout', () => { r.destroy(); res({ status: 0, body: 'timeout' }); });
  if (data) r.write(data); r.end();
});
const rejected = (s) => s === 400 || s === 403 || s === 404; // any hard reject (NOT 200/2xx)

const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const c = {};
    // ---- PRIMARY: reject-first negatives ----
    c.nonKey     = rejected((await req('GET', '/api/files/?repo=nosuchkey_' + i)).status);           // unknown key -> resolve null -> 400
    c.absAsKey   = rejected((await req('GET', '/api/files/?repo=' + encodeURIComponent('/etc'))).status); // abs path is not a key -> null
    c.absAsKey2  = rejected((await req('GET', '/api/files/?repo=' + encodeURIComponent('/root/oosh/../../etc'))).status);
    c.traversal  = rejected((await req('GET', '/api/files/' + encodeURIComponent('../../../../etc/passwd') + '?repo=rawbin')).status); // ../ -> safePath null -> 403
    c.traversal2 = rejected((await req('GET', '/api/files/..%2F..%2F..%2Fetc%2Fpasswd?repo=rawbin')).status);
    c.putNonRawbin = rejected((await req('PUT', '/api/files/r3067probe.txt?repo=oosh', { content: 'x' })).status); // write to non-rawbin -> REJECT
    // GitApi ref: /api/git/file validates the ref (^[\w./-]+$) -> a shell-metachar ref is REJECTED (400)
    c.refInjectFile = rejected((await req('GET', '/api/git/file?ref=' + encodeURIComponent('; id') + '&path=package.json&repo=rawbin')).status);
    // The REAL invariant is no-shell-exec (execFile array-args): even where a ref isn't validated
    // (/api/git/commits is lenient, returns 200 w/ default log), the injection NEVER runs.
    const inj = await req('GET', '/api/git/commits?ref=' + encodeURIComponent('$(id)') + '&repo=rawbin');
    c.noShellInjection = !/uid=\d|gid=\d|groups=/.test(inj.body); // execFile -> $(id) never executed
    // ---- SECONDARY: happy-path keys resolve ----
    c.happyRawbin = (await req('GET', '/api/files/?repo=rawbin')).status === 200;
    c.happyOosh = (await req('GET', '/api/files/?repo=oosh')).status === 200;
    c.happyDefault = (await req('GET', '/api/files/')).status === 200; // absent -> rawbin default (back-compat)
    c.happyBranchesOosh = (await req('GET', '/api/git/branches?repo=oosh')).status === 200;

    const rejectsPass = c.nonKey && c.absAsKey && c.absAsKey2 && c.traversal && c.traversal2 && c.putNonRawbin && c.refInjectFile && c.noShellInjection;
    const happyPass = c.happyRawbin && c.happyOosh && c.happyDefault && c.happyBranchesOosh;
    const pass = rejectsPass && happyPass;
    results.push({ pass, c });
    console.log(`iter ${i}: REJECTS[nonKey=${c.nonKey} absKey=${c.absAsKey}/${c.absAsKey2} traversal=${c.traversal}/${c.traversal2} PUToosh=${c.putNonRawbin} refInject=${c.refInjectFile} noShellInj=${c.noShellInjection}]=${rejectsPass} | HAPPY[rawbin=${c.happyRawbin} oosh=${c.happyOosh} default=${c.happyDefault} branchesOosh=${c.happyBranchesOosh}]=${happyPass} => ${pass ? 'GREEN' : 'RED'}`);
  }

  console.log('\n=== VERDICT R30.6.7 RepoRegistry security-probe (reject-first, DET-3x) ===');
  results.forEach((r, i) => console.log(`  iter ${i + 1}: ${r.pass ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(r => r.pass);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED — a reject returned non-4xx = BYPASS');
  process.exitCode = green ? 0 : 1;
} finally { }
