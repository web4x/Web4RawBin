/**
 * Owned-Output Delete-Guard — the single chokepoint every generator / regen / reconcile / prune
 * routes its scrum.pmo writes AND deletes through.
 *
 * Design: robbin-architect `scrum.pmo/design-notes/knowledge-doc-deletion-diagnosis-guard.md` (38ba4a160).
 * Build:  robbin-skill-expert 2026-08-09 (generate-sprint-md is my lane).
 * Contract: matches robbin-tester's BITEs (d0eee3e89, scripts/owned-output-guard-bites.ts).
 *
 * THE RULE (correct-by-construction, same principle as the C7 rule: legacy is authoritative until a
 * completeness proof) — a generator may only touch files it OWNS:
 *   - WRITE (create/replace) ONLY: a path-confined name that passes the caller's isOwned() whitelist AND is
 *     either NEW or already carries the generator's ownership marker. Never clobber an unmarked (= hand-authored) file.
 *   - DELETE ONLY a file that carries the marker. NEVER delete an UNMARKED file — unmarked = hand-authored
 *     until proven otherwise. Absent/unreadable/markerless → refuse (leave it).
 *   - Fail-closed on ambiguity: no marker / unreadable → refuse, never "assume generated".
 *
 * WHY A SHARED HELPER (the valuable half — architect's B2): a confinement living only as INLINE code can
 * silently REVERT. On 2026-08-09 an Option-1 code-revert reverted build.mjs (and 13 other tracked files) to a
 * stale state; it would revert an inline whitelist just as quietly, and "a confinement that can silently
 * disappear is not a guard." Routing every generator write/delete through this ONE module lets the tester's
 * anti-regression BITE assert (statically, B2a) that no generator writes/unlinks a scrum.pmo path EXCEPT via
 * here — so a silent revert of the protection breaks CI instead of a knowledge doc.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Path-confinement: no parent-traversal anywhere in the path. Shared by every guard fn (DRY). */
function isTraversalFree(filePath: string): boolean {
  return !filePath.split(/[\\/]/).includes('..');
}

/**
 * Create/replace ONLY an owned, prefix-marked file. Returns true iff it wrote; false (writes NOTHING) if:
 *   - the path traverses ('..'), or
 *   - basename fails the caller's isOwned() whitelist, or
 *   - an EXISTING file does not START WITH generatedHeader (hand-authored — never clobber).
 * (Matches robbin-tester's B2b/B3 contract exactly: prefix-match, filePath-based, boolean.)
 */
// [impl:uuid:3a716334-7a7b-4995-b9a0-7c7c138086ca] guardedWrite — owned-output write chokepoint (prefix-marker guard)
export function guardedWrite(
  filePath: string,
  content: string,
  generatedHeader: string,
  isOwned: (basename: string) => boolean,
): boolean {
  if (!isTraversalFree(filePath)) return false;
  if (!isOwned(path.basename(filePath))) return false;
  if (fs.existsSync(filePath)) {
    let existing: string;
    try { existing = fs.readFileSync(filePath, 'utf-8'); } catch { return false; } // fail-closed
    if (!existing.startsWith(generatedHeader)) return false; // hand-authored → never clobber
  }
  fs.writeFileSync(filePath, content);
  return true;
}

/**
 * Delete ONLY a file that STARTS WITH generatedHeader. Returns true iff it deleted; false (removes NOTHING) if
 * the file is absent, unreadable, or does not carry the header (unmarked = hand-authored → NEVER delete).
 * (Matches robbin-tester's guardedDelete contract exactly.)
 */
// [impl:uuid:e1ff295f-be7e-4111-8f58-7cbb98f26cb9] guardedDelete — delete-only-if-marker-carrying chokepoint (never delete unmarked)
export function guardedDelete(filePath: string, generatedHeader: string): boolean {
  if (!isTraversalFree(filePath)) return false;
  if (!fs.existsSync(filePath)) return false;
  let existing: string;
  try { existing = fs.readFileSync(filePath, 'utf-8'); } catch { return false; } // fail-closed
  if (!existing.startsWith(generatedHeader)) return false; // unmarked → NEVER delete
  fs.unlinkSync(filePath);
  return true;
}

/**
 * REGION-generated variant (e.g. sprints.overview.md): the ownership marker sits INSIDE the file — hand-narrative
 * outside a BEGIN/END region the caller's generator preserves byte-identical. Ownership = the existing file
 * CONTAINS the region marker (contains-match, not prefix). Same fail-closed / never-clobber-unmarked guarantee.
 * Lives in this module so it is still "via the owned-output-guard" for the B2a static chokepoint check.
 */
// [impl:uuid:fc520411-1a61-420d-8fb4-842e4c0b2343] guardedWriteRegion — region-marker (contains-match) write chokepoint
export function guardedWriteRegion(
  filePath: string,
  content: string,
  regionMarker: string,
  isOwned: (basename: string) => boolean,
): boolean {
  if (!isTraversalFree(filePath)) return false;
  if (!isOwned(path.basename(filePath))) return false;
  if (!content.includes(regionMarker)) return false; // never write output that lacks the region marker
  if (fs.existsSync(filePath)) {
    let existing: string;
    try { existing = fs.readFileSync(filePath, 'utf-8'); } catch { return false; } // fail-closed
    if (!existing.includes(regionMarker)) return false; // markerless/hand-authored → never clobber
  }
  fs.writeFileSync(filePath, content);
  return true;
}
