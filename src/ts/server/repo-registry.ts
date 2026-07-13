// R30.6.7 — RepoRegistry: server-side KEY→absolute-root allowlist for multi-repo targeting (its own class/file per
// the minted chain sourceFile + R27.5 axis-3 "new class = own file"). The client sends a repo KEY ONLY (?repo=oosh),
// NEVER an absolute path; unknown key → null (route → 400). Default 'rawbin' = PROJECT_ROOT (R30.5 + existing callers
// unchanged). Consumed by GitApi + /api/files; safePath still guards WITHIN the resolved root. Add a key here (with
// its configured absolute root) to expose a new repo — never accept a client-supplied path.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class RepoRegistry {
  private static readonly ROOTS: Record<string, { root: string; label: string }> = {
    rawbin: { root: path.resolve(__dirname, '../../../'), label: 'RawBin' },
    oosh: { root: path.resolve(process.env.OOSH_DIR || '/root/oosh'), label: 'OOSH' },
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
