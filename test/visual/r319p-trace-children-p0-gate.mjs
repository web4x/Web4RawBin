// R31.8c P0 SECURITY — /api/trace/children Feature-branch owner-gate (credential-leak fix 6c6359285, v0.7.113).
// verify-by-pid: gated ONLY on a server whose pid POST-dates the fix commit (the earlier 2h-old pid was the version-lie
// phantom I caught). DET-3x. INDEPENDENT of the architect's backstop (I probe raw, assert no leak + no over-gate).
// (a) /api/trace/children/<Feature> NON-MEMBER → 403 + NO member token/name leak (short forbidden body, not a children
//     payload) — both ServerManager 16604eee + FeatureManager 2980b7d9. (b) non-Feature node → 200 (no over-gate).
// (c) /trace public page → 200 (public browsing unaffected). Grant→owner-only-child is architect-backstopped + covered
// by my r318b flip; the P0 here is the PUBLIC LEAK (must be 403+no-leak).
import https from 'node:https';
const HOST = 'prod.wo-da.de', PORT = 4444, OWNER = '41ad88c4-4dee-49ac-afcb-8a2026657b2d';
const SM = '16604eee-d844-4efb-bd4d-881433ca82a6', FM = '2980b7d9-a166-44ca-bf73-5dd1a4ba7b16';
const NONFEATURE = '2173e549-ca99-43e5-aea8-946b02141c13'; // Sprint 30 (non-Feature scenario unit → public)
const get = (path) => new Promise((res) => { const q = https.request({ host: HOST, port: PORT, path, method: 'GET', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => res({ status: r.statusCode, body: b })); }); q.on('error', () => res({ status: 0, body: '' })); q.end(); });
const noLeak = (body) => !new RegExp(OWNER).test(body) && !/allowedUsers|"token"|profile:[0-9a-f]{8}.*:[0-9a-f]{8}/i.test(body) && body.length < 200; // plain forbidden, no member data

const results = [];
for (let i = 1; i <= 3; i++) {
  const sm = await get(`/api/trace/children/${SM}`);
  const fm = await get(`/api/trace/children/${FM}`);
  const nf = await get(`/api/trace/children/${NONFEATURE}`);
  const tr = await get('/trace');
  const smGated = sm.status === 403 && noLeak(sm.body);
  const fmGated = fm.status === 403 && noLeak(fm.body);
  const noOverGate = (nf.status >= 200 && nf.status < 300) && tr.status === 200;
  const pass = smGated && fmGated && noOverGate;
  results.push(pass);
  console.log(`iter ${i}: SM-Feature=${sm.status}(gated+noleak=${smGated}) FM-Feature=${fm.status}(gated+noleak=${fmGated}) | non-Feature=${nf.status} /trace=${tr.status} (no-over-gate=${noOverGate}) => ${pass ? 'GREEN' : 'RED'}`);
}
console.log('\n===== R31.8c P0 /api/trace/children Feature owner-gate (DET-3x) =====');
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
