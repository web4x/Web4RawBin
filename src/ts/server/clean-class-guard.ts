// R0 CONTAINMENT (oopPO-ranked 2026-09-28) — PURE, testable. The scenario clean-classes whose M1 chain units carry
// ARBITRARY uuids (≠ keyToUuid). A LEGACY generate (resolveByKey UNSET) over them, into modelDir()=PROD by default,
// MINTS DUPLICATES of Tron's live File/Folder model — a loaded gun any restart/rebuild/demo/click/curl fires (the
// /api/model/generate-project default dir is 'src/ts/scenario', which CONTAINS them). This guard makes the legacy path
// refuse over a clean-class file, or a dir containing one, unless an explicit override. Containment (minutes); the real
// fix is FIX-1 (resolveByKey-as-default). Kept in its own module so a gate can exercise it WITHOUT importing (booting) server.ts.
import path from 'node:path';

export const CLEAN_CLASS_FILES_R0 = ['src/ts/scenario/file.ts', 'src/ts/scenario/ior.ts', 'src/ts/scenario/folder.ts'];

// true ⇒ a legacy generate over `targetAbs` would process a scenario clean-class → REFUSE (dup hazard on live model).
export function legacyGenHitsCleanClassR0(projectRoot: string, targetAbs: string, isDir: boolean): boolean {
  return CLEAN_CLASS_FILES_R0.some((rel) => {
    const cc = path.resolve(projectRoot, rel);
    return isDir ? (cc === targetAbs || cc.startsWith(targetAbs + path.sep)) : cc === targetAbs;
  });
}
