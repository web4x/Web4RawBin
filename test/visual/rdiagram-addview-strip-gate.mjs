// [test:uuid:READY-ON-DEPLOY] BUG-B — dropping a UseCase onto a diagram must NOT 400. Root (measured, not guessed):
// rb-object-item drags a type-prefixed ref ('usecase:<uuid>'); onDropAddView (rb-diagram-detail:242) strips it via
// stripRef before POST /api/model/diagram/add-view; the server (server.ts:2083) 400s 'bad-uuid' unless elementUuid
// matches /^[0-9a-fA-F-]{16,40}$/. BUG-B was that stripRef stripped ior:instance:/modelelement: but NOT the 'usecase:'
// (type) prefix — so elementUuid stayed 'usecase:<uuid>' → 400. FIX: stripRef is now the ONE generic parser stripping
// ALL leading 'type:' prefixes. This gate = source-audit (the generic regex IS present) + functional (the real drag
// refs strip to a clean uuid that PASSES the server regex). GREEN=fixed regression lock. Drag GESTURE splits to Tron.
import fs from 'node:fs';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const SERVER_UUID = /^[0-9a-fA-F-]{16,40}$/;                      // the exact regex the server enforces (server.ts:2083)

const src = fs.readFileSync(`${REPO}/src/public/ts/trace/diagram-view-model.ts`, 'utf8');
// (a) source-audit: stripRef is the GENERIC all-type-prefix stripper (not a per-prefix list that misses 'usecase:').
// Extract the ACTUAL .replace() regex off the stripRef line (loose between-tokens so a return-type annotation can't break it).
const m = src.match(/stripRef[^\n]*\.replace\((\/.+?\/[a-z]*)\s*,/);
const stripRe = m ? eval(m[1]) : null;                            // the ACTUAL regex from source (own-oracle, not a copy)
const genericStripper = !!stripRe && /\[a-z\]/i.test(m[1]) && /:/.test(m[1]) && /\+/.test(m[1]);

// (b) functional: apply the REAL source regex to the REAL drag refs → clean uuid passing the server regex
const strip = (r) => stripRe ? String(r).replace(stripRe, '') : r;
const U = '02cfb6ae-2242-41a2-bf11-b37d773d5af4';
const cases = [
  ['usecase:' + U, true], ['diagram:' + U, true], ['requirement:' + U, true],
  ['ior:instance:' + U, true], ['modelelement:' + U, true], [U, true],           // bare uuid stays clean
];
const funcOk = stripRe && cases.every(([ref]) => SERVER_UUID.test(strip(ref)));   // every real drag ref → server-accepted uuid
// (c) anti-vacuity: the stripper must NOT bless genuine garbage (a non-uuid stays rejected by the server regex)
const antiVacuous = stripRe && !SERVER_UUID.test(strip('usecase:not_a_uuid!!'));

const pass = genericStripper && funcOk && antiVacuous;
console.log(`source-generic-stripper=${genericStripper}(${m ? m[1] : 'NOT FOUND'})`);
console.log(`functional: all real drag refs → server-valid uuid=${funcOk} (${cases.map(([r]) => strip(r).slice(0, 8)).join(',')})`);
console.log(`anti-vacuity: garbage ref stays rejected=${antiVacuous}`);
console.log('\n===== BUG-B: stripRef strips the UseCase type-prefix → add-view 200 not 400 (source+functional) =====');
console.log('OVERALL:', pass ? 'GREEN — BUG-B fixed in source (generic stripRef); UseCase elementUuid is server-valid'
  : 'RED — stripRef leaves a type-prefix on elementUuid → server 400 bad-uuid');
process.exitCode = pass ? 0 : 1;
