import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ServerManagerGuard } from './ServerManagerGuard.js';

// R31.8 FeatureManager (Class 9f7f345a) — grant/revoke a Feature to a user, mirror-maintained BOTH sides atomically:
// Feature.allowedUsers[] (scenario unit on disk) ↔ profile.features[] (UserProfile). ★ ROOT-OF-TRUST (INV-F4): these
// MUTATE grants, so the CALLER (server.ts endpoint) MUST pass the HARDCODED owner gate (ServerManagerGuard.assertOwner)
// BEFORE invoking them — NOT data-driven, so no self-grant escalation. The Feature unit is read/written directly
// (fresh from disk each op) so featureAllowedUsers (which builds a fresh ScenarioIndex per request) sees the change
// immediately → grant/revoke are effective at once (revoke-immediate). INV-G2 preserved: no OWNER_TOKEN literal here.
const SCENARIO_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../scenario/index');

type MinProfile = { token: string; features?: string[] };

function featurePath(featureUuid: string): string {
  const c = featureUuid;
  return path.join(SCENARIO_DIR, c[0], c[1], c[2], c[3], c[4], `${featureUuid}.scenario.json`);
}
function readFeature(featureUuid: string): { file: string; unit: { model: { allowedUsers?: string[] } } } | null {
  try { const file = featurePath(featureUuid); return { file, unit: JSON.parse(fs.readFileSync(file, 'utf-8')) }; } catch { return null; }
}

export class FeatureManager {
  // R31.8 bootstrap: the S31 Feature instances whose allowedUsers get the hardcoded owner seeded at first run.
  private static readonly SEED_FEATURES = ['16604eee-d844-4efb-bd4d-881433ca82a6', '2980b7d9-a166-44ca-bf73-5dd1a4ba7b16']; // ServerManager, FeatureManager

  // [impl:uuid:03b2b1db-b2ba-44d4-a3f2-eeb9215540ad] FeatureManager.bootstrapSeed (Method 8762a0d5, Class 9f7f345a) —
  // idempotent first-run seed: ensure the hardcoded owner is a MEMBER of ServerManager + FeatureManager allowedUsers
  // (via ServerManagerGuard.seedOwnerInto, INV-G2==1 — no literal here). The owner enters the data-driven gate by
  // SEEDED MEMBERSHIP, not a literal-bypass; no grant path exists that doesn't originate at the hardcoded owner. Runs
  // at server startup; safe to re-run (units already carrying the owner are unchanged, so no needless write). INV-F5.
  static bootstrapSeed(): void {
    for (const featureUuid of FeatureManager.SEED_FEATURES) {
      const f = readFeature(featureUuid);
      if (!f) continue;
      const au: string[] = Array.isArray(f.unit.model.allowedUsers) ? f.unit.model.allowedUsers : [];
      const before = au.length;
      ServerManagerGuard.seedOwnerInto(au);
      if (au.length !== before) { f.unit.model.allowedUsers = au; fs.writeFileSync(f.file, JSON.stringify(f.unit, null, 2) + '\n'); }
    }
  }
  // [impl:uuid:5e2f6781-28bb-4934-9c69-a4595caeb08b] FeatureManager.grantFeature (Method ac522b4f, Class 9f7f345a) —
  // idempotently ADD `token` to Feature.allowedUsers AND `featureUuid` to profile.features (BOTH sides, atomic).
  // Owner-gated at the caller (INV-F4). Returns ok=false if the Feature unit is missing (fail-closed).
  static grantFeature(featureUuid: string, token: string, profiles: Map<string, MinProfile>, saveProfiles: () => void): { ok: boolean; error?: string } {
    const f = readFeature(featureUuid);
    if (!f) return { ok: false, error: 'feature-not-found' };
    const au: string[] = Array.isArray(f.unit.model.allowedUsers) ? f.unit.model.allowedUsers : [];
    if (!au.includes(token)) { au.push(token); f.unit.model.allowedUsers = au; fs.writeFileSync(f.file, JSON.stringify(f.unit, null, 2) + '\n'); }
    const p = profiles.get(token);
    if (p) { const feats = Array.isArray(p.features) ? p.features : []; if (!feats.includes(featureUuid)) { feats.push(featureUuid); p.features = feats; saveProfiles(); } }
    return { ok: true };
  }

  // [impl:uuid:987a31a9-cd73-43cd-997d-f58f50f6a4e3] FeatureManager.revokeFeature (Method 0c63bacc, Class 9f7f345a) —
  // REMOVE `token` from Feature.allowedUsers AND `featureUuid` from profile.features (BOTH sides, atomic). Owner-gated
  // at the caller (INV-F4). The gate (requireFeatureAccess) then denies the revoked user by membership immediately.
  static revokeFeature(featureUuid: string, token: string, profiles: Map<string, MinProfile>, saveProfiles: () => void): { ok: boolean; error?: string } {
    const f = readFeature(featureUuid);
    if (!f) return { ok: false, error: 'feature-not-found' };
    const au: string[] = Array.isArray(f.unit.model.allowedUsers) ? f.unit.model.allowedUsers : [];
    const next = au.filter((t) => t !== token);
    if (next.length !== au.length) { f.unit.model.allowedUsers = next; fs.writeFileSync(f.file, JSON.stringify(f.unit, null, 2) + '\n'); }
    const p = profiles.get(token);
    if (p && Array.isArray(p.features)) { const feats = p.features.filter((u) => u !== featureUuid); if (feats.length !== p.features.length) { p.features = feats; saveProfiles(); } }
    return { ok: true };
  }
}
