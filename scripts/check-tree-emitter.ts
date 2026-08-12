/**
 * R40.11 slice-2 GATE — the server-manager tree emitter (OtmuxBridge.buildRootedTree, the ONE shared
 * emitter after the server.ts:1561 inline duplicate was deleted) must emit REAL typed-unit iors for the
 * node's deployment refs, NEVER the synthetic 'depref:'+role that missed in the drawer. Plus INV-T: the
 * session subtree (sessions/windows/panes) must be byte-identical regardless of the ref rows.
 *
 * Run: /opt/node22/bin/node --import tsx scripts/check-tree-emitter.ts   (exits 1 on any failure)
 */
import { OtmuxBridge } from '../src/ts/server/OtmuxBridge.js';

const sessions: any = [{ name: 'projectTeam', windows: [{ index: 0, panes: [{ paneId: '%13', label: 'expert', title: 'robbin-expert' }] }] }];
const node: any = { model: { uuid: 'fc327458', name: 'WODA.prod', kind: 'node', deploymentRefs: [{ role: 'ssh-service', ref: 'ior:file:/etc/ssh/sshd_config' }, { role: 'domain', ref: 'ior:file:/x/.env' }] } };
const typed = [{ uuid: '71bd2de9-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'sshd_config' }, { uuid: 'b49a18ff-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'LE_DOMAIN' }];

const fails: string[] = [];
const check = (c: boolean, m: string) => { if (!c) fails.push(m); };

const withUnits = OtmuxBridge.buildRootedTree(sessions, node, 'fc327458', typed);
const noUnits = OtmuxBridge.buildRootedTree(sessions, node, 'fc327458', []);

// (1) no synthetic depref: anywhere in the emitted tree
check(!/depref:/.test(JSON.stringify(withUnits)), 'emitted tree still contains a synthetic depref: id');
// (2) deployment-ref rows carry the REAL typed-unit iors
const refRows = (withUnits[0]?.children || []).filter((r: any) => r.type === 'deploymentUnit');
check(refRows.length === typed.length && refRows.every((r: any) => typed.some(t => t.uuid === r.uuid)), 'ref-rows do not carry the real typed-unit uuids');
// (3) INV-T — session subtree byte-identical whether or not ref units are present
const sess = (t: any) => JSON.stringify((t[0]?.children || []).filter((r: any) => r.type === 'otmuxSession'));
check(sess(withUnits) === sess(noUnits), 'INV-T VIOLATED: session subtree changed with the ref rows');
// (4) stub-must-fail — a planted depref: id IS detected by assertion (1)
const stub = OtmuxBridge.buildRootedTree(sessions, node, 'fc327458', [{ uuid: 'depref:ssh', name: 'x' }]);
check(/depref:/.test(JSON.stringify(stub)), 'stub-must-fail broken: a planted depref: was not detectable');

if (fails.length) { console.error('✗ check-tree-emitter FAILED:'); for (const f of fails) console.error('  - ' + f); process.exit(1); }
console.log('✓ check-tree-emitter PASS — real-ior ref rows, 0 synthetic depref:, INV-T session subtree stable, stub-must-fail holds.');
