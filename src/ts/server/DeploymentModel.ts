/**
 * T40.11 Slice 1 (design-r40.11-depref-migration-split.md, architect 674d77fa1) — DeploymentModel.buildTypedModel.
 *
 * PURE: maps a deployment node's raw `deploymentRefs` → the typed-unit DESCRIPTOR set per the CLOSED reconcile rule
 * (reusing R40.6 M2 types 0022-0033 — NO new type machinery, NO I/O, NO `ScenarioIndex.put`). This is the deterministic
 * core the later migration slices consume (Slice-2 emitter, Slice-3 view, Slice-4 array-removal). An UNTYPEABLE ref
 * THROWS (fail-loud) — it is NEVER silently dropped. Keeping this fn pure means Slice-1's core touches NO chokepoint;
 * the persisting steps (minting the 5 units, removing the array) are SEPARATE gated authoring steps held for the
 * architect's confirm (design §CHOKEPOINT).
 *
 * Reconcile rule (CLOSED — 4 refs → 5 units):
 *   ssh-service       → Service (Deployable) `configuredBy →` ConfigFile(/etc/ssh/sshd_config)   [1→2 SPLIT]
 *   ssh-host-identity → KeyFile (FileBacked, manifestsAs the real path)
 *   letsencrypt-cert  → Certificate (FileBacked, manifestsAs the real path)
 *   domain            → EnvValue (FileBacked, manifestsAs `.env`, fragment `LE_DOMAIN`)
 */

// R40.6 M2 type sentinels (catalog shard a1d2e…): REUSED by ior-reference, never re-minted.
const M2 = (n: string): string => `ior:instance:a1d2e3f4-0000-4a1b-8c2d-0000000000${n}`;
const SERVICE = M2('25'), CONFIGFILE = M2('27'), CERTIFICATE = M2('28'), KEYFILE = M2('29'), ENVVALUE = M2('30');
const FILEBACKED = M2('31'), DEPLOYABLE = M2('32');

/** A typed-unit descriptor (pre-mint): a caller mints a real scenario unit from it in a later, gated step. */
export interface TypedUnit {
  key: string;             // stable descriptor key — the edge target before real uuids exist (mint step maps key→uuid)
  name: string;
  m2Type: string;          // instanceOf: the M2 CLASS sentinel (Service / ConfigFile / KeyFile / Certificate / EnvValue)
  interfaces: string[];    // instanceOf: the M2 INTERFACE sentinels it realises (Deployable / FileBacked)
  manifestsAs?: string;    // real file path (FileBacked units resolve a real leaf)
  fragment?: string;       // in-file fragment (EnvValue: the .env key, e.g. LE_DOMAIN)
  configuredBy?: string;   // `key` of the ConfigFile descriptor (the Service→ConfigFile edge)
  sourceRole: string;      // provenance: the originating deploymentRef.role
}

interface DeploymentRef { role: string; ref: string; note?: string }
interface DeploymentNodeLike { model?: { deploymentRefs?: DeploymentRef[] } }

const bareFile = (r: string): string => String(r ?? '').replace(/^ior:file:/, '');

export class DeploymentModel {
  // [impl:uuid:e009ace7-9f2e-4188-80fb-b14f844c0e5d] DeploymentModel.buildTypedModel — pure raw-deploymentRefs → 5 typed descriptors (reconcile rule)
  static buildTypedModel(node: DeploymentNodeLike): TypedUnit[] {
    const refs = node?.model?.deploymentRefs;
    if (!Array.isArray(refs)) throw new Error('buildTypedModel: node has no deploymentRefs array');
    const out: TypedUnit[] = [];
    for (const r of refs) {
      const filePath = bareFile(r.ref);
      switch (r.role) {
        case 'ssh-service': {
          // 1→2 SPLIT: the ssh Service (Deployable) is configuredBy its ConfigFile (the ref IS the config path).
          out.push({ key: 'sshd-config', name: 'sshd_config', m2Type: CONFIGFILE, interfaces: [FILEBACKED], manifestsAs: filePath, sourceRole: r.role });
          out.push({ key: 'sshd-service', name: 'sshd', m2Type: SERVICE, interfaces: [DEPLOYABLE], configuredBy: 'sshd-config', sourceRole: r.role });
          break;
        }
        case 'ssh-host-identity':
          out.push({ key: 'ssh-host-key', name: 'ssh host identity key', m2Type: KEYFILE, interfaces: [FILEBACKED], manifestsAs: filePath, sourceRole: r.role });
          break;
        case 'letsencrypt-cert':
          out.push({ key: 'le-cert', name: "Let's Encrypt certificate", m2Type: CERTIFICATE, interfaces: [FILEBACKED], manifestsAs: filePath, sourceRole: r.role });
          break;
        case 'domain': {
          const [file, fragment] = filePath.split('#');
          out.push({ key: 'le-domain', name: 'LE_DOMAIN', m2Type: ENVVALUE, interfaces: [FILEBACKED], manifestsAs: file, fragment: fragment || undefined, sourceRole: r.role });
          break;
        }
        default:
          throw new Error(`buildTypedModel: untypeable deploymentRef role '${r.role}' (ref ${r.ref}) — no M2 mapping; refusing to silently drop it`);
      }
    }
    return out;
  }
}
