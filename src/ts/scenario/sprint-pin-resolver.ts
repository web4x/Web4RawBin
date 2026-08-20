/**
 * R37.1 — SprintPinResolver (Class 157d1764): the ONE computed-from-files resolver of sprint identity + status.
 * Files are the single source of truth; the current/last/next pin is DERIVED (advance = RUN the resolver, never
 * hand-edit a value). Also exports the canonical sprintNumOf + sprintSlugOf so NO consumer re-parses ad-hoc.
 * ★ INV-C1-8: a sprint's NUMBER and SLUG are NEVER derived from the free-text model.name — only from the numbered
 * field or the on-disk /sprints/ path. scripts/CI + shared; no server import (no restart). R37.5 deriveStatusEnum reused.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from './index-store.js';
import { type ScenarioUnit } from './types.js';
import { deriveStatusEnum } from './task-status.js';

const SPRINTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../scrum.pmo/sprints');

export type SprintStatusEnum = 'Planned' | 'Active' | 'QA-pending' | 'Closed';
export interface SprintStatus {
  status: SprintStatusEnum;
  // Done, Superseded and Cancelled are kept DISTINCT (INV-C1-7) — never collapsed into one "done" bucket.
  counts: { done: number; superseded: number; cancelled: number; inProgress: number; qa: number; planned: number; total: number };
  unresolvedRef?: string; // a task ref that doesn't resolve → resolveSprintPin refuses fail-closed (never silent-skip)
}
// R40.17: a slot carries its REAL derived status so the display can LABEL an owner-designated sprint honestly
// ("Sprint 37 — Closed") — designation is authoritative data, never a claim of Active. `designated` = came from an
// explicit owner designation (won over the derivation), vs a purely-derived slot.
export interface SprintSlot { uuid: string; number: number; name: string; status?: SprintStatusEnum; designated?: boolean }
export interface SprintPin { current: SprintSlot | null; lastCompleted: SprintSlot | null; nextBacklog: SprintSlot | null }
// R40.17 — the explicit owner DESIGNATION fed INTO resolveSprintPin (INPUT-ONLY, sourced from the CurrentSprint
// singleton; NOT a second store). Precedence: a valid designation WINS unconstrained (shown with its real status),
// else derive, else fail-loud. The within-Active constraint governs ONLY the derived (no-designation) path.
export interface SprintPinHint { currentSprintNumber?: number | null; nextSprintNumber?: number | null }

const bare = (ref: string): string => String(ref).replace('ior:instance:', '').split('@')[0];

// [impl:uuid:e0f62b6c-f571-4a2a-a754-1575397a915d] SprintPinResolver.sprintNumOf — model.number, else the sprint-<N>
// from the slug / sourceFile / compoundSource PATH; NEVER the free-text model.name (INV-C1-8). null = no numbered source.
export function sprintNumOf(unit: ScenarioUnit): number | null {
  const m = unit.model as Record<string, unknown>;
  if (typeof m.number === 'number' && Number.isFinite(m.number)) return m.number;
  for (const src of [m.slug, m.sourceFile, m.compoundSource]) {
    const hit = /sprint-(\d+)/.exec(String(src ?? ''));
    if (hit) return parseInt(hit[1], 10);
  }
  return null; // fail-closed: NEVER parse model.name
}

// R40.50 — THE one canonical sprint DISPLAY order (DESCENDING). Defined in the CLIENT-SAFE sprint-label atom (this
// module imports node:fs → the browser trace views cannot import it); RE-EXPORTED here so the sprintNumOf home still
// surfaces it for the server + generator callers. Single definition, single source. See sprint-label.ts for the doc.
export { bySprintDisplayOrder } from './sprint-label.js';

// [impl:uuid:f326509a-3f40-4962-86f5-60c4ecb40f1a] SprintPinResolver.sprintSlugOf — canonical slug from the on-disk
// path, NEVER slugify(model.name) (INV-C1-8). 3-step fallback (req 936caa456), MUST resolve to an EXISTING dir else
// REFUSE (fail-closed, ties R37.3): (1) /sprints/(sprint-…)/ in sourceFile|compoundSource; (2) model.slug if its dir
// exists; (3) the on-disk sprint-<num>-* dir. Returns null (refuse) when none resolves to a real directory.
export function sprintSlugOf(unit: ScenarioUnit): string | null {
  const m = unit.model as Record<string, unknown>;
  const dirExists = (slug: string): boolean => !!slug && fs.existsSync(path.join(SPRINTS_DIR, slug)) && fs.statSync(path.join(SPRINTS_DIR, slug)).isDirectory();
  // (1) path-regex on sourceFile / compoundSource
  for (const src of [m.sourceFile, m.compoundSource]) {
    const hit = /sprints\/(sprint-[^/]+)/.exec(String(src ?? ''));
    if (hit && dirExists(hit[1])) return hit[1];
  }
  // (2) model.slug if its dir exists on disk
  if (typeof m.slug === 'string' && dirExists(m.slug)) return m.slug;
  // (3) the on-disk sprint-<num>-* dir (number-keyed, zero-pad tolerant)
  const num = sprintNumOf(unit);
  if (num != null && fs.existsSync(SPRINTS_DIR)) {
    const hit = fs.readdirSync(SPRINTS_DIR).find((d) => new RegExp(`^sprint-0*${num}(-|$)`).test(d) && dirExists(d));
    if (hit) return hit;
  }
  return null; // fail-closed: no existing dir resolved + NEVER slugify(model.name)
}

// [impl:uuid:303639ce-0863-4df1-968c-c6f415c5bd70] SprintPinResolver.deriveSprintStatus — roll the sprint's tasks[]
// up via R37.5 deriveStatusEnum (single source; sprint↔tasks can't disagree, INV-C1-2). TERMINAL-RESOLVED(task) =
// deriveStatusEnum===Done OR task.supersededBy present. CLOSED = tasks non-empty AND all terminal-resolved (Done vs
// Superseded kept DISTINCT, never collapsed — INV-C1-7); Active = ≥1 In-Progress not-superseded; QA-pending = ≥1 QA
// Review (no active); else Planned. Reuses R37.5 with NO extension (supersededBy is a SEPARATE field, PO ruling B).
export function deriveSprintStatus(sprint: ScenarioUnit, idx: ScenarioIndex): SprintStatus {
  const taskIors = (((sprint.model as Record<string, unknown>).tasks as string[]) || []);
  const counts = { done: 0, superseded: 0, cancelled: 0, inProgress: 0, qa: 0, planned: 0, total: 0 };
  let unresolvedRef: string | undefined;
  for (const ref of taskIors) {
    const t = idx.get(bare(ref));
    if (!t) { unresolvedRef = unresolvedRef ?? bare(ref); continue; } // fail-closed: never silent-skip
    counts.total++;
    const tm = t.model as Record<string, unknown>;
    const superseded = tm.supersededBy != null && tm.supersededBy !== '';
    if (superseded) { counts.superseded++; continue; } // separate field — counted DISTINCT, NOT as Done
    const cancelled = tm.cancelledReason != null && tm.cancelledReason !== '';
    if (cancelled) { counts.cancelled++; continue; } // R37.1-refine FIX2: cancelled is TERMINAL, DISTINCT (INV-C1-10), NOT Done
    switch (deriveStatusEnum(String(tm.statusChecklist ?? ''))) {
      case 'Done': counts.done++; break;
      case 'In Progress': counts.inProgress++; break;
      case 'QA Review': counts.qa++; break;
      default: counts.planned++;
    }
  }
  // FAIL-CLOSED vacuous (INV-C1-6): 0 tasks (or all unresolvable) is NOT 'Closed' — empty ≠ Done.
  // TERMINAL-RESOLVED = Done + Superseded + Cancelled (all DISTINCT counts, INV-C1-7/10).
  const terminalAll = counts.total > 0 && counts.done + counts.superseded + counts.cancelled === counts.total;
  const status: SprintStatusEnum = counts.inProgress > 0 ? 'Active' : terminalAll ? 'Closed' : counts.qa > 0 ? 'QA-pending' : 'Planned';
  return { status, counts, unresolvedRef };
}

// R37.1-refine FIX1: the ONE shared frozen/current-era boundary — single-source, imported by BOTH resolveSprintPin
// AND R37.6's FROZEN_LEGACY (cannot drift, NOT a per-consumer heuristic). Sprints numbered <= FROZEN_LEGACY_MAX are
// frozen pre-S19 legacy (lingering In-Progress checklists frozen-in-amber) — EXCLUDED from the pin universe (all 3
// slots + the ambiguity/unresolvable throws) BY CONSTRUCTION (INV-C1-9), with NO frozen-data mutation.
export const FROZEN_LEGACY_MAX = 18;
export function isCurrentEra(num: number | null): boolean { return num != null && num > FROZEN_LEGACY_MAX; }

// [impl:uuid:af97137f-cce1-4b1c-9bb8-40d84dbd5b33] SprintPinResolver.resolveSprintPin — pure current/last/next,
// NUMBER-KEYED (never name-substring). current = the ONLY Active sprint (≥1 In-Progress not-superseded); a
// QA-pending-only sprint does NOT qualify (INV-C1-3); >1 Active = FAIL-LOUD ambiguity (INV-C1-4), never a silent
// pick; none → null. last = highest-number Closed; next = lowest-number Planned with number > current. FAIL-CLOSED
// vacuous (INV-C1-6): a sprint with an unresolvable task ref REFUSES (throws named); empty tasks[] is never Done.
export function resolveSprintPin(idx: ScenarioIndex, hint?: SprintPinHint): SprintPin {
  const sprints = [...idx.list()].map((u) => idx.get(u)).filter((u): u is ScenarioUnit => !!u && u.ior === 'ior:class:Sprint');
  const rows = sprints
    .map((s) => ({ s, num: sprintNumOf(s) }))
    // FIX1: pin universe = CURRENT-ERA only (num > FROZEN_LEGACY_MAX); frozen pre-S19 legacy is excluded here —
    // BEFORE deriveSprintStatus and BEFORE the unresolvable/ambiguity throws — so it can never count Active or throw.
    .filter((x): x is { s: ScenarioUnit; num: number } => isCurrentEra(x.num))
    .map(({ s, num }) => {
      const st = deriveSprintStatus(s, idx);
      if (st.unresolvedRef) throw new Error(`R37.1 FAIL-CLOSED: sprint '${(s.model as any).slug || (s.model as any).uuid}' has an unresolvable task ref ${st.unresolvedRef} — refusing (never silent-skip).`);
      return { uuid: String((s.model as any).uuid), num, name: String((s.model as any).name || ''), st };
    });

  const slot = (r: { uuid: string; num: number; name: string; st: SprintStatus }, designated = false): SprintSlot =>
    ({ uuid: r.uuid, number: r.num, name: r.name, status: r.st.status, designated });

  // R40.17 PRECEDENCE (PO ruling — owner designation is authoritative DATA, not a fabrication):
  //   explicit DESIGNATION wins → else DERIVE (the ONE Active) → else FAIL-LOUD UNRESOLVED.
  // A valid designation (names an existing current-era sprint) WINS UNCONSTRAINED — it may be non-Active and is shown
  // with its REAL derived status label (`designated:true`); we never CLAIM it is Active and never REPLACE it with a
  // fail-loud error on the owner's screen. The 'derivation-can-never-fabricate-a-non-Active-current' invariant governs
  // ONLY the no-designation branch below. The throw surfaces ONLY when there is NO designation AND >1 Active (genuine
  // ambiguity). The designation NEVER mutates status and NEVER reduces the Active count (R37.5 still audits all Active).
  let current: SprintSlot | null;
  const designated = hint?.currentSprintNumber != null ? rows.find((r) => r.num === hint.currentSprintNumber) : undefined;
  if (designated) {
    current = slot(designated, true); // owner designation → honest labeled display, never refused
  } else {
    const active = rows.filter((r) => r.st.status === 'Active');
    if (active.length === 1) current = slot(active[0]);
    else if (active.length > 1) throw new Error(`R37.1/R40.17 FAIL-LOUD (INV-C1-4): ${active.length} Active sprints [${active.map((a) => a.num).join(', ')}] and NO owner designation — ambiguous current, never silent-pick. Designate the current sprint, or resolve checklists to one In-Progress.`);
    else current = null;
  }

  // ⚠ R40.50 EXEMPT (lint allow-list): ALGORITHMIC pin-hop ordering — highest-number Closed = lastCompleted. NOT a
  // display list; MUST NOT route through bySprintDisplayOrder. Reordering breaks pin resolution.
  const closed = rows.filter((r) => r.st.status === 'Closed').sort((a, b) => b.num - a.num);
  const lastCompleted = closed.length ? slot(closed[0]) : null;

  const curNum = current?.number ?? lastCompleted?.number ?? -Infinity;
  // next = lowest-number Planned with number > current; a nextSprintNumber designation wins among Planned candidates
  // (same shape: designation wins → else lowest Planned ahead). Never fabricates a non-Planned next silently.
  // ⚠ R40.50 EXEMPT (lint allow-list): ALGORITHMIC pin-hop ordering — lowest-number Planned ahead = nextBacklog. NOT
  // a display list; MUST NOT route through bySprintDisplayOrder. Reordering breaks pin resolution.
  const plannedAhead = rows.filter((r) => r.st.status === 'Planned' && r.num > curNum).sort((a, b) => a.num - b.num);
  const designatedNext = hint?.nextSprintNumber != null ? rows.find((r) => r.num === hint.nextSprintNumber) : undefined;
  const nextBacklog = designatedNext ? slot(designatedNext, true) : (plannedAhead.length ? slot(plannedAhead[0]) : null);

  return { current, lastCompleted, nextBacklog };
}
