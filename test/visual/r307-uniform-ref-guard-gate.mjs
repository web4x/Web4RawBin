// [test:uuid:c6f9a76b-6264-47dc-8633-15c20736f6e5] R30.7 GitApi.guardRef — uniform ref-guard: commits+file reject bad refs, no injection (RED->GREEN of my R30.6.7 finding)
// R30.7 — GitApi.guardRef uniform ref-allowlist CHOKE POINT (impl 4e52b300, prod v0.7.17). Hardening
// from MY R30.6.7 finding: /api/git/commits was LENIENT (200 on a bad ref) while /api/git/file
// rejected — now BOTH route through the single guardRef, so every git endpoint rejects a bad ref
// identically. READ-ONLY (all GET; rejects mutate nothing). DET-3x. Reject-first.
//   PRIMARY (the fix): commits bad ref (';id' / $(id)) -> 400 (was 200 @v0.7.16 = my finding, now GUARDED).
//   UNCHANGED:         file  bad ref -> 400.
//   VALID:             commits & file ref=main -> 200.  ABSENT: commits no-ref -> HEAD default -> 200.

import https from 'https';
const HOST = 'prod.wo-da.de', PORT = 4444;
const req = (pathq) => new Promise((res) => {
  const r = https.request({ host: HOST, port: PORT, path: pathq, method: 'GET', rejectUnauthorized: false, timeout: 8000,
    headers: { 'Origin': `https://${HOST}:${PORT}`, 'Referer': `https://${HOST}:${PORT}/edit` } },
    (resp) => { let b = ''; resp.on('data', c => b += c); resp.on('end', () => res({ status: resp.statusCode, body: b.slice(0, 200) })); });
  r.on('error', () => res({ status: 0, body: 'err' })); r.on('timeout', () => { r.destroy(); res({ status: 0, body: 'timeout' }); });
  r.end();
});
const rejected = (s) => s === 400 || s === 403;
const bad = ['; id', '$(id)', '`id`', 'main;id', '../evil'];

const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const c = {};
    // PRIMARY — commits now guarded (the fix): every bad ref -> 400, and NO injection ever ran
    const commitsBad = [];
    for (const b of bad) commitsBad.push((await req('/api/git/commits?repo=rawbin&ref=' + encodeURIComponent(b))).status);
    c.commitsRejectAll = commitsBad.every(rejected);
    const inj = await req('/api/git/commits?repo=rawbin&ref=' + encodeURIComponent('$(id)'));
    c.noInjection = !/uid=\d|gid=\d|groups=/.test(inj.body);
    // UNCHANGED — file still rejects bad refs
    const fileBad = [];
    for (const b of bad) fileBad.push((await req('/api/git/file?repo=rawbin&path=package.json&ref=' + encodeURIComponent(b))).status);
    c.fileRejectAll = fileBad.every(rejected);
    // VALID — main resolves on both
    c.commitsMain = (await req('/api/git/commits?repo=rawbin&ref=main')).status === 200;
    c.fileMain = (await req('/api/git/file?repo=rawbin&path=package.json&ref=main')).status === 200;
    // ABSENT — commits with no ref -> HEAD default
    c.commitsHead = (await req('/api/git/commits?repo=rawbin')).status === 200;

    const pass = c.commitsRejectAll && c.noInjection && c.fileRejectAll && c.commitsMain && c.fileMain && c.commitsHead;
    results.push({ pass, c, commitsBad, fileBad });
    console.log(`iter ${i}: commitsRejectAll=${c.commitsRejectAll}[${commitsBad.join(',')}] noInj=${c.noInjection} fileRejectAll=${c.fileRejectAll} | valid[commits=${c.commitsMain} file=${c.fileMain}] absentHEAD=${c.commitsHead} => ${pass ? 'GREEN' : 'RED'}`);
  }

  console.log('\n=== VERDICT R30.7 uniform guardRef choke point (DET-3x) ===');
  results.forEach((r, i) => console.log(`  iter ${i + 1}: ${r.pass ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(r => r.pass);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  console.log('(RED→GREEN: commits bad-ref was 200 @v0.7.16 [my R30.6.7 finding] → 400 @v0.7.17 uniform guard.)');
  process.exitCode = green ? 0 : 1;
} finally { }
