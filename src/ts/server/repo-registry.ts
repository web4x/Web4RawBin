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

// R30.42 UC8 config (design §9, D1). REPO_ALLOW = permitted base roots for add-local/worktree-register. The 2nd term is the
// oosh worktrees' SHARED PARENT (dirname of realpath(HOME/oosh)) → auto-covers ALL oo-mode sibling worktrees
// (dev/macos/mcdonges.latest/prod) correct-by-construction (R30.40 spirit) without hardcoding paths. Extra roots via
// REPO_ALLOW_ENV (path-delimiter list). Guarded realpathSync (HOME/oosh may be absent in some envs → term dropped).
function ooshWorktreeParent(): string | null {
  try { return path.dirname(fs.realpathSync(path.join(os.homedir(), 'oosh'))); } catch { return null; }
}
const REPO_ALLOW: string[] = [
  os.homedir(),
  ooshWorktreeParent(),
  ...(process.env.REPO_ALLOW_ENV ? process.env.REPO_ALLOW_ENV.split(path.delimiter).filter(Boolean) : []),
].filter((x): x is string => !!x);

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

  // R30.42 UC8 GUARD 1 (design §9, D1) — SOLE add-local/worktree path choke point. realpath(input) MUST fall under an
  // allowed base (REPO_ALLOW, also realpath'd) → defeats symlink escape. Returns the ORIGINAL input on success (stored
  // as-is so a dynamic symlink like HOME/oosh keeps oo-mode follow; the CHECK used the realpath). null → reject (→ 400).
  // [impl:uuid:90569c5e-c931-4d9b-9e2b-d3a0ca6a2788] RepoRegistry.assertAllowedRoot — R30.42 UC8 GUARD 1 / D1 realpath allowlist (Method d57a14c5)
  static assertAllowedRoot(input: string): string | null {
    if (typeof input !== 'string' || !input) return null;
    try {
      const real = fs.realpathSync(input); // follow symlinks to the TRUE target
      const ok = REPO_ALLOW.some(b => {
        try { const rb = fs.realpathSync(b); return real === rb || real.startsWith(rb + path.sep); } catch { return false; }
      });
      return ok ? input : null;
    } catch { return null; } // realpath fails (nonexistent path) → reject
  }

  private static ensureLoaded(): void { if (!RepoRegistry.loaded) RepoRegistry.load(); }

  // [impl:uuid:d7dc0059-b300-4469-9518-1cfaf07599f6] RepoRegistry.resolve
  static resolve(key: string | null | undefined): string | null {
    RepoRegistry.ensureLoaded();
    const builtin = RepoRegistry.ROOTS[key || 'rawbin']; // builtin wins + exempt from the re-check (trusted, hardcoded)
    if (builtin) return path.resolve(builtin.root);
    const dyn = RepoRegistry.dynamic[key || ''];
    if (!dyn) return null;                                // unknown key → null; a client abs path is never a key → null
    if (!RepoRegistry.assertAllowedRoot(dyn.root)) return null; // R30.42 UC8 TOCTOU: a dynamic symlink could be repointed post-register → re-assert allowlist here
    return path.resolve(dyn.root);
  }

  // [impl:uuid:ef022b16-b998-4d82-84a0-6ad51c94c1e5] RepoRegistry.list
  static list(): { key: string; label: string; builtin: boolean; removable: boolean }[] {
    RepoRegistry.ensureLoaded();
    return [
      ...Object.entries(RepoRegistry.ROOTS).map(([key, v]) => ({ key, label: v.label, builtin: true, removable: false })),
      ...Object.entries(RepoRegistry.dynamic).map(([key, v]) => ({ key, label: v.label, builtin: false, removable: true })),
    ];
  }

  // [impl:uuid:6c408f9b-0354-4732-8d7a-bccd3a6cb027] RepoRegistry.register (Method 7681caa6) — R30.42 UC3. Server-DERIVED slug key
  // (never a builtin, uniqueness-checked). Routes root through the UC8 choke point. Persists. Returns the derived key.
  static register(input: { root: string; label?: string; addedBy?: string }): string {
    RepoRegistry.ensureLoaded();
    if (!RepoRegistry.assertAllowedRoot(input.root)) throw new Error('root not permitted'); // UC8 choke point
    const key = RepoRegistry.uniqueSlug(input.label || input.root);
    RepoRegistry.dynamic[key] = { root: input.root, label: input.label || key, addedBy: input.addedBy, addedAt: new Date().toISOString() };
    RepoRegistry.persist();
    return key;
  }

  // [impl:uuid:559b508b-91e7-4961-8b62-1bc531d3df94] RepoRegistry.unregister (Method 8611520d) — R30.42 UC3. Dynamic-only; a builtin is NEVER removable.
  static unregister(key: string): boolean {
    RepoRegistry.ensureLoaded();
    if (RepoRegistry.ROOTS[key]) return false;      // builtin → non-removable
    if (!RepoRegistry.dynamic[key]) return false;
    delete RepoRegistry.dynamic[key];
    RepoRegistry.persist();
    return true;
  }

  // [impl:uuid:854943d3-8979-4ea4-bf5e-5480bfbcd558] RepoRegistry.persist (Method 1c1ebda4) — R30.42 UC3. Server-only write (data/repos.json). Best-effort.
  static persist(): void {
    try {
      fs.mkdirSync(path.dirname(REPOS_PATH), { recursive: true });
      fs.writeFileSync(REPOS_PATH, JSON.stringify(RepoRegistry.dynamic, null, 2));
    } catch { /* best-effort persistence, mirrors PAIRING_PATH */ }
  }

  // [impl:uuid:2c67c8d1-e80e-4b53-92f1-0f8a54cbcb08] RepoRegistry.load (Method f3d1fe64) — R30.42 UC3. VALIDATE-ON-LOAD: drop entries that collide a builtin,
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
