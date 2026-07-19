// R30.6.7 — RepoRegistry: server-side KEY→absolute-root allowlist for multi-repo targeting (its own class/file per
// the minted chain sourceFile + R27.5 axis-3 "new class = own file"). The client sends a repo KEY ONLY (?repo=oosh),
// NEVER an absolute path; unknown key → null (route → 400). Default 'rawbin' = PROJECT_ROOT (R30.5 + existing callers
// unchanged). Consumed by GitApi + /api/files; safePath still guards WITHIN the resolved root. Add a key here (with
// its configured absolute root) to expose a new repo — never accept a client-supplied path.
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class RepoRegistry {
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

  // [impl:uuid:d7dc0059-b300-4469-9518-1cfaf07599f6] RepoRegistry.resolve
  static resolve(key: string | null | undefined): string | null {
    const entry = RepoRegistry.ROOTS[key || 'rawbin']; // absent → rawbin default (back-compat)
    return entry ? path.resolve(entry.root) : null;    // unknown key → null; a client abs path is never a key → null
  }

  // [impl:uuid:ef022b16-b998-4d82-84a0-6ad51c94c1e5] RepoRegistry.list
  static list(): { key: string; label: string }[] {
    return Object.entries(RepoRegistry.ROOTS).map(([key, v]) => ({ key, label: v.label }));
  }
}
