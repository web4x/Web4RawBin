import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ServerManagerGuard } from './ServerManagerGuard.js';
import { ScenarioIndex } from '../scenario/index.js';

// R31.8 FeatureManager (Class 9f7f345a) — grant/revoke a Feature to a user, mirror-maintained BOTH sides atomically:
// Feature.allowedUsers[] (scenario unit on disk) ↔ profile.features[] (UserProfile). ★ ROOT-OF-TRUST (INV-F4): these
// MUTATE grants, so the CALLER (server.ts endpoint) MUST pass the HARDCODED owner gate (ServerManagerGuard.assertOwner)
// BEFORE invoking them — NOT data-driven, so no self-grant escalation. The Feature unit is read/written directly
// (fresh from disk each op) so featureAllowedUsers (which builds a fresh ScenarioIndex per request) sees the change
// immediately → grant/revoke are effective at once (revoke-immediate). INV-G2 preserved: no OWNER_TOKEN literal here.
const SCENARIO_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../scenario/index');

type MinProfile = { token: string; features?: string[] };
// R31.8c searchUsers I/O: SearchProfile = the live-profile fields it reads (UserProfile is assignable); UserHit = a
// masked search result carrying the REAL token (the grant key) + masked identifiers for display.
type SearchProfile = { token: string; name?: string; phone?: string; avatar?: string };
type UserHit = { token: string; name: string; avatar?: string; uuid?: string; identifiers: string[] };

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

  // [impl:uuid:4fa93651-1e42-4306-842a-33d65385ca6f] FeatureManager.listFeatures (Method 5e338054, Class 9f7f345a) —
  // R31.8b VIEW read: scan ior:class:Feature → [{uuid,name,icon,allowedUsers}] for the FeatureManager management view
  // (GET /api/feature-manager, owner/membership-gated at the caller). Fresh ScenarioIndex per call so a grant/revoke
  // is reflected at once. Read-only (no mutation → not a root-of-trust write path). Fail-closed to [] on any error.
  static listFeatures(): { uuid: string; name: string; icon: string; allowedUsers: string[] }[] {
    const out: { uuid: string; name: string; icon: string; allowedUsers: string[] }[] = [];
    try {
      const idx = new ScenarioIndex(SCENARIO_DIR);
      for (const uuid of idx.list()) {
        const u = idx.get(uuid);
        if (u?.ior !== 'ior:class:Feature') continue;
        const m = u.model as { name?: string; icon?: string; allowedUsers?: unknown };
        out.push({ uuid, name: String(m.name || 'Feature'), icon: String(m.icon || ''), allowedUsers: Array.isArray(m.allowedUsers) ? (m.allowedUsers as string[]) : [] });
      }
    } catch { /* fail-closed → empty */ }
    return out;
  }

  // [impl:uuid:cb20fd6e-a5e3-4dd3-a942-62724ddbddf8] FeatureManager.searchUsers (Method 1e75e388, Class 9f7f345a) —
  // R31.8c NODE-1 owner-gated user search (caller GET /api/feature-manager/users = requireOwnerHttp, INV-F4). Matches
  // the query against LIVE profiles (name/phone/token) + ALT-IDENTITY Profile units (scenario/alt/{phone,email,company}
  // keyed by identifier, model.uuid = the token). Resolves to a token → returns the REAL token (the grant key) with
  // MASKED identifiers (privacy), RANKED exact→prefix→substring, capped at 10 (truncated flag). mask/rank = private.
  static searchUsers(query: string, profiles: Map<string, SearchProfile>): { results: UserHit[]; truncated: boolean } {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return { results: [], truncated: false };
    const cand = new Map<string, UserHit & { rank: number }>();
    const consider = (token: string, name: string, avatar: string | undefined, uuid: string | undefined, ids: string[], hays: string[]): void => {
      if (!token) return;
      const rank = FeatureManager.rankMatch(q, hays);
      if (rank < 0) return;
      const ex = cand.get(token);
      if (!ex) { cand.set(token, { token, name, avatar, uuid, identifiers: ids, rank }); return; }
      if (rank < ex.rank) ex.rank = rank;
      for (const id of ids) if (!ex.identifiers.includes(id)) ex.identifiers.push(id);
      if (!ex.name && name) ex.name = name;
      if (!ex.uuid && uuid) ex.uuid = uuid;
    };
    // (1) LIVE profiles
    for (const [token, p] of profiles) consider(token, p.name || '', p.avatar || undefined, undefined, [FeatureManager.maskToken(token)], [p.name || '', p.phone || '', token]);
    // (2) ALT-IDENTITY Profile units (keyed by identifier; model.uuid = the token/identity)
    for (const kind of ['phone', 'email', 'company']) {
      const dir = path.join(SCENARIO_DIR, '..', 'alt', kind);
      let files: string[] = [];
      try { files = fs.readdirSync(dir).filter(f => f.endsWith('.scenario.json')); } catch { continue; }
      for (const file of files) {
        const identifier = file.replace(/\.scenario\.json$/, '');
        let unit: { ior?: string; model?: { uuid?: string; name?: string } };
        try { unit = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')); } catch { continue; }
        if (unit?.ior !== 'ior:class:Profile') continue;
        const token = String(unit.model?.uuid || '');
        consider(token, String(unit.model?.name || ''), undefined, token, [FeatureManager.maskIdentifier(kind, identifier)], [String(unit.model?.name || ''), identifier]);
      }
    }
    const sorted = [...cand.values()].sort((a, b) => a.rank - b.rank || (a.name || '').localeCompare(b.name || ''));
    const CAP = 10;
    const results = sorted.slice(0, CAP).map(({ rank, ...hit }) => hit); // strip the internal rank
    return { results, truncated: sorted.length > CAP };
  }

  // R31.8c private helpers for searchUsers — rank (exact 0 < prefix 1 < substring 2 < no-match -1) + identifier masking.
  private static rankMatch(q: string, hays: string[]): number {
    let best = -1;
    for (const h of hays) {
      const s = String(h || '').toLowerCase(); if (!s) continue;
      const r = s === q ? 0 : s.startsWith(q) ? 1 : s.includes(q) ? 2 : -1;
      if (r >= 0 && (best < 0 || r < best)) best = r;
    }
    return best;
  }
  private static maskToken(t: string): string { return t.length <= 8 ? t : t.slice(0, 4) + '…' + t.slice(-2); }
  private static maskIdentifier(kind: string, v: string): string {
    if (kind === 'phone') return v.length <= 5 ? v : v.slice(0, 3) + '••••' + v.slice(-3);
    if (kind === 'email') { const [u, d] = v.split('@'); return d ? (u.slice(0, 1) + '•••@' + d) : v; }
    return v; // company (name-ish) — no mask
  }

  // [impl:uuid:79b22596-e108-4075-a924-78d8c0a81cab] FeatureManager.featureRoots (Method e07352c9, Class 9f7f345a) —
  // R31.8c gap-B: itemView ROOTS for the native FeatureManager tree — scan ior:class:Feature → [{uuid, type:'feature',
  // name, icon, hasChildren:allowedUsers.length>0}]. Seeds the REAL Feature roots (replaces the synthetic 'feature:
  // manager' so a grant targets the real Feature uuid). Fail-closed to [].
  static featureRoots(): { uuid: string; type: string; name: string; icon: string; hasChildren: boolean }[] {
    const out: { uuid: string; type: string; name: string; icon: string; hasChildren: boolean }[] = [];
    try {
      const idx = new ScenarioIndex(SCENARIO_DIR);
      for (const uuid of idx.list()) {
        const u = idx.get(uuid);
        if (u?.ior !== 'ior:class:Feature') continue;
        const m = u.model as { name?: string; icon?: string; allowedUsers?: unknown };
        const au = Array.isArray(m.allowedUsers) ? (m.allowedUsers as string[]) : [];
        out.push({ uuid, type: 'feature', name: String(m.name || 'Feature'), icon: String(m.icon || ''), hasChildren: au.length > 0 });
      }
    } catch { /* fail-closed → empty */ }
    return out;
  }

  // [impl:uuid:ad622052-baee-4ff7-9258-d4d66b46f638] FeatureManager.allowedUsersChildren (Method 72c660f9, Class
  // 9f7f345a) — R31.8c gap-A: a Feature's allowedUsers TOKENS → itemView child-nodes with a COMPOSITE uuid
  // '<featureUuid>:<token>' (the ref becomes 'profile:<featureUuid>:<token>' → rb-profile-detail parses the feature
  // context for REVOKE). name = live-profile name or masked token. Called by /api/trace/children on a Feature unit
  // (the raw tokens aren't ior:instance refs, so the default forward-ref resolver can't build these).
  static allowedUsersChildren(featureUuid: string, profiles: Map<string, SearchProfile>): { uuid: string; type: string; name: string; hasChildren: boolean }[] {
    const f = readFeature(featureUuid);
    const au = f && Array.isArray(f.unit.model.allowedUsers) ? (f.unit.model.allowedUsers as string[]) : [];
    return au.map(token => ({ uuid: `${featureUuid}:${token}`, type: 'profile', name: (profiles.get(token)?.name || FeatureManager.maskToken(token)), hasChildren: false }));
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
