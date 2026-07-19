// R30.6.7 — RepoRegistry: server-side KEY→absolute-root allowlist for multi-repo targeting (its own class/file per
// the minted chain sourceFile + R27.5 axis-3 "new class = own file"). The client sends a repo KEY ONLY (?repo=oosh),
// NEVER an absolute path; unknown key → null (route → 400). Default 'rawbin' = PROJECT_ROOT (R30.5 + existing callers
// unchanged). Consumed by GitApi + /api/files; safePath still guards WITHIN the resolved root. Add a key here (with
// its configured absolute root) to expose a new repo — never accept a client-supplied path.
// R30.42 UC3 (repo-manager foundation): the registry is now BUILTINS (hardcoded, non-removable, win-on-collision) +
// a DYNAMIC layer persisted to data/repos.json. register/unregister/persist/load added. Server-DERIVED slug keys — the
// client NEVER supplies a key (prevents overriding a builtin). NOTE: no add/delete/clone/checkout ENDPOINTS here — those
// are UC4/5/6/7, HELD for Tron's D1-D4 security decisions. This is the pure spine.
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// data/repos.json — dynamic-layer persistence (PAIRING_PATH writeFileSync precedent; data/*.json gitignored = runtime state).
const REPOS_PATH = path.resolve(__dirname, '../../../data/repos.json');

type DynEntry = { root: string; label: string; addedBy?: string; addedAt?: string };

export class RepoRegistry {
  // BUILTINS: hardcoded, non-removable, ALWAYS win on key collision.
  private static readonly ROOTS: Record<string, { root: string; label: string }> = {
    rawbin: { root: path.resolve(__dirname, '../../../'), label: 'RawBin' },
    // R30.40 (Tron): HOME/oosh is ALWAYS the ground-truth oosh — resolve to os.homedir()+'/oosh' and DROP the OOSH_DIR
    // override (it had been misconfigured to the FIXED Once.sh/dev worktree on dev-teampush-astray → center showed the wrong
    // branch + Save targeted the wrong worktree). Correct-by-construction: never rely on a misconfigurable env for ground truth.
    // HOME/oosh is a SYMLINK that `oo` mode-switch repoints to a worktree (dev/macos/mcdonges.latest/prod); path.resolve keeps
    // it as the symlink PATH (does NOT realpath/canonicalize) so git FOLLOWS it to the CURRENT oo-mode dynamically. Drives
    // diff + header + save consistently against whatever HOME/oosh points at right now (currently mcdonges.latest).
    // [impl:uuid:9b95b458-9118-44cc-959d-870c6fe1f9d0] RepoRegistry oosh-root = HOME/oosh symlink (R30.40 correct-by-construction; DISTINCT from resolve's read-path impl d7dc0059)
    oosh: { root: path.resolve(os.homedir(), 'oosh'), label: 'OOSH' },
  };
  // DYNAMIC layer (persisted). Merged UNDER builtins (a builtin key can never be overridden). Lazy-loaded on first use.
  private static dynamic: Record<string, DynEntry> = {};
  private static loaded = false;

  // R30.42 UC8 SCAFFOLD (security choke-point) — PLUGGABLE bound, HELD for Tron's DECISION-1 (allowed base roots).
  // register() + load() route every candidate root through here so the choke point is WIRED; the specific allowlist is
  // pluggable (swap in the real check — realpath(root) under os.homedir() subtree + REPO_ALLOW — on D1 ratify). Until then
  // this is only reachable via register(), which has NO endpoint yet (UC4/5 held) → not yet exposed to untrusted input.
  // [chain: UC8 security.bounds — req mints RepoRegistry.assertAllowedRoot Impl; place [impl] marker when handed]
  static assertAllowedRoot(root: string): boolean {
    // TODO(DECISION-1, HELD): confirm fs.realpathSync(root) falls under an allowed base (HOME subtree + REPO_ALLOW config).
    return typeof root === 'string' && root.length > 0;
  }

  private static ensureLoaded(): void { if (!RepoRegistry.loaded) RepoRegistry.load(); }

  // [impl:uuid:d7dc0059-b300-4469-9518-1cfaf07599f6] RepoRegistry.resolve
  static resolve(key: string | null | undefined): string | null {
    RepoRegistry.ensureLoaded();
    const entry = RepoRegistry.ROOTS[key || 'rawbin'] || RepoRegistry.dynamic[key || '']; // builtin wins; else dynamic
    return entry ? path.resolve(entry.root) : null;    // unknown key → null; a client abs path is never a key → null
  }

  // [impl:uuid:ef022b16-b998-4d82-84a0-6ad51c94c1e5] RepoRegistry.list
  static list(): { key: string; label: string; builtin: boolean; removable: boolean }[] {
    RepoRegistry.ensureLoaded();
    return [
      ...Object.entries(RepoRegistry.ROOTS).map(([key, v]) => ({ key, label: v.label, builtin: true, removable: false })),
      ...Object.entries(RepoRegistry.dynamic).map(([key, v]) => ({ key, label: v.label, builtin: false, removable: true })),
    ];
  }

  // R30.42 UC3 — chain pending req mint (Method RepoRegistry.register); place [impl] when handed. Server-DERIVED slug key
  // (never a builtin, uniqueness-checked). Routes root through the UC8 choke point. Persists. Returns the derived key.
  static register(input: { root: string; label?: string; addedBy?: string }): string {
    RepoRegistry.ensureLoaded();
    if (!RepoRegistry.assertAllowedRoot(input.root)) throw new Error('root not permitted'); // UC8 choke point
    const key = RepoRegistry.uniqueSlug(input.label || input.root);
    RepoRegistry.dynamic[key] = { root: input.root, label: input.label || key, addedBy: input.addedBy, addedAt: new Date().toISOString() };
    RepoRegistry.persist();
    return key;
  }

  // R30.42 UC3 — chain pending req mint (Method RepoRegistry.unregister). Dynamic-only; a builtin is NEVER removable.
  static unregister(key: string): boolean {
    RepoRegistry.ensureLoaded();
    if (RepoRegistry.ROOTS[key]) return false;      // builtin → non-removable
    if (!RepoRegistry.dynamic[key]) return false;
    delete RepoRegistry.dynamic[key];
    RepoRegistry.persist();
    return true;
  }

  // R30.42 UC3 — chain pending req mint (Method RepoRegistry.persist). Server-only write (data/repos.json). Best-effort.
  static persist(): void {
    try {
      fs.mkdirSync(path.dirname(REPOS_PATH), { recursive: true });
      fs.writeFileSync(REPOS_PATH, JSON.stringify(RepoRegistry.dynamic, null, 2));
    } catch { /* best-effort persistence, mirrors PAIRING_PATH */ }
  }

  // R30.42 UC3 — chain pending req mint (Method RepoRegistry.load). VALIDATE-ON-LOAD: drop entries that collide a builtin,
  // are malformed, or fail the UC8 allowlist re-check. (is-git-repo re-check needs GitApi.isGitRepo = UC4 → wired in then.)
  static load(): void {
    RepoRegistry.loaded = true;
    let raw: Record<string, DynEntry> = {};
    try { raw = JSON.parse(fs.readFileSync(REPOS_PATH, 'utf-8')) || {}; } catch { RepoRegistry.dynamic = {}; return; }
    const valid: Record<string, DynEntry> = {};
    for (const [key, e] of Object.entries(raw)) {
      if (RepoRegistry.ROOTS[key]) continue;                        // never override a builtin
      if (!e || typeof e.root !== 'string' || !e.root) continue;    // malformed
      if (!RepoRegistry.assertAllowedRoot(e.root)) continue;        // UC8 validate-on-load choke point
      valid[key] = { root: e.root, label: e.label || key, addedBy: e.addedBy, addedAt: e.addedAt };
    }
    RepoRegistry.dynamic = valid;
  }

  // server-DERIVED slug from a label/path basename; never collides a builtin or an existing dynamic key.
  private static uniqueSlug(base: string): string {
    const raw = (base.split('/').filter(Boolean).pop() || base).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'repo';
    let key = raw, n = 2;
    while (RepoRegistry.ROOTS[key] || RepoRegistry.dynamic[key]) key = `${raw}-${n++}`;
    return key;
  }
}
