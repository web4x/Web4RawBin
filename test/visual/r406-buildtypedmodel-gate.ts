// [test:uuid:c5a92e14-7b6f-4d83-9e21-0a4f8c73b6e2] T40.6 / R40.6 — DeploymentModel.buildTypedModel (Impl e009ace7) DISTINCT-INTENT: the PURE reconcile rule raw deploymentRefs → 5 typed descriptors. NOT the R40.6 graph-edge/disk-resolution ACs (those are other impls) — this asserts buildTypedModel's OWN transform: the ssh 1→2 split (Service configuredBy its ConfigFile), the domain #fragment split, 5 distinct M2 types, the FileBacked-vs-Deployable interface cross-cut, provenance (all 4 refs survive, none lost), and FAIL-LOUD refusal of an untypeable role (never silently dropped). Family: silent-drift / under-recorded-progress.
// Pure-fn tsx gate — deterministic, NO served artifact ⇒ no SW/served-guard needed (stated deliberately, per the standing rule's scope). Structural assertions (M2 sentinels are module-local, so assert relationships not string literals). node22: PATH=/opt/node22/bin:$PATH npx tsx test/visual/r406-buildtypedmodel-gate.ts
import { DeploymentModel } from '../../src/ts/server/DeploymentModel.ts';

const node = { model: { deploymentRefs: [
  { role: 'ssh-service', ref: 'ior:file:/etc/ssh/sshd_config' },
  { role: 'ssh-host-identity', ref: 'ior:file:/etc/ssh/ssh_host_ed25519_key' },
  { role: 'letsencrypt-cert', ref: 'ior:file:/etc/letsencrypt/live/prod.wo-da.de/fullchain.pem' },
  { role: 'domain', ref: 'ior:file:/srv/app/.env#LE_DOMAIN' },
] } };
const results: Record<string, boolean> = {};

const out = DeploymentModel.buildTypedModel(node);
const by = (k: string) => out.find((u) => u.key === k);

// ── (1) reconcile 5-from-4 + the ssh 1→2 SPLIT edge ──
const keys = out.map((u) => u.key).sort();
results['reconcile-5-from-4-split'] = out.length === 5
  && JSON.stringify(keys) === JSON.stringify(['le-cert', 'le-domain', 'ssh-host-key', 'sshd-config', 'sshd-service'])
  && by('sshd-service')?.configuredBy === 'sshd-config'   // the Service→ConfigFile edge the split creates
  && by('sshd-config')?.configuredBy === undefined;

// ── (2) 5 DISTINCT M2 types (ConfigFile/Service/KeyFile/Certificate/EnvValue) ──
results['five-distinct-m2-types'] = new Set(out.map((u) => u.m2Type)).size === 5 && out.every((u) => !!u.m2Type);

// ── (3) interface CROSS-CUT: the 4 Artifact subtypes realize ONE shared FileBacked; the Service realizes a DIFFERENT one ──
const fileBackedKeys = ['sshd-config', 'ssh-host-key', 'le-cert', 'le-domain'];
const fb = by('sshd-config')!.interfaces[0];
results['interface-cross-cut'] = fileBackedKeys.every((k) => by(k)!.interfaces.length === 1 && by(k)!.interfaces[0] === fb && !!by(k)!.manifestsAs)
  && by('sshd-service')!.interfaces[0] !== fb                       // Deployable ≠ FileBacked
  && by('sshd-service')!.manifestsAs === undefined;                 // the Service is not itself a file

// ── (4) domain #fragment split ──
const dom = by('le-domain')!;
results['domain-fragment-split'] = dom.fragment === 'LE_DOMAIN' && dom.manifestsAs === '/srv/app/.env' && !dom.manifestsAs.includes('#');

// ── (5) provenance — all 4 input roles survive (none lost); ssh-service split preserves its role on BOTH ──
const roles = out.map((u) => u.sourceRole);
results['all-4-survive-provenance'] = ['ssh-service', 'ssh-host-identity', 'letsencrypt-cert', 'domain'].every((r) => roles.includes(r))
  && roles.filter((r) => r === 'ssh-service').length === 2;

// ── (6) FAIL-LOUD (silent-drift guard) + STUB-MUST-FAIL: an untypeable role THROWS (never silently dropped); no-array THROWS ──
let threwUntypeable = false, errMsg = '';
try { DeploymentModel.buildTypedModel({ model: { deploymentRefs: [{ role: 'bogus-role', ref: 'ior:file:/x' }] } }); }
catch (e) { threwUntypeable = true; errMsg = (e as Error).message; }
let threwNoArray = false;
try { DeploymentModel.buildTypedModel({ model: {} } as any); } catch { threwNoArray = true; }
// STUB-MUST-FAIL: this assertion REQUIRES the throw — a silent-drop implementation (skip unknown, no error) makes it RED.
results['fail-loud-no-silent-drop'] = threwUntypeable && /untypeable|silently drop/i.test(errMsg) && threwNoArray;

console.log('===== T40.6 DeploymentModel.buildTypedModel reconcile-rule gate (DET) =====');
let green = true;
for (const [k, v] of Object.entries(results)) { console.log(`  ${k}: ${v ? 'GREEN' : 'RED'}`); if (!v) green = false; }
const need = ['reconcile-5-from-4-split', 'five-distinct-m2-types', 'interface-cross-cut', 'domain-fragment-split', 'all-4-survive-provenance', 'fail-loud-no-silent-drop'];
if (need.some((k) => !(k in results))) { green = false; console.log('  INCOMPLETE'); }
console.log('OVERALL:', green ? 'GREEN — pure reconcile rule: 5-from-4 split, distinct types, interface cross-cut, fragment split, provenance, fail-loud (no silent drop)' : 'RED');
process.exitCode = green ? 0 : 1;
