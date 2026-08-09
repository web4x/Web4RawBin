/**
 * R-C1 — SprintPinResolver (Class 157d1764): the ONE computed-from-files resolver of sprint identity + status.
 * Files are the single source of truth; the current/last/next pin is DERIVED (advance = RUN the resolver, never
 * hand-edit a value). Also exports the canonical sprintNumOf + sprintSlugOf so NO consumer re-parses ad-hoc.
 * ★ INV-C1-8: a sprint's NUMBER and SLUG are NEVER derived from the free-text model.name — only from the numbered
 * field or the on-disk /sprints/ path. scripts/CI + shared; no server import (no restart). R-C5 deriveStatusEnum reused.
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
export interface SprintSlot { uuid: string; number: number; name: string }
export interface SprintPin { current: SprintSlot | null; lastCompleted: SprintSlot | null; nextBacklog: SprintSlot | null }

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

// [impl:uuid:f326509a-3f40-4962-86f5-60c4ecb40f1a] SprintPinResolver.sprintSlugOf — canonical slug from the on-disk
// path, NEVER slugify(model.name) (INV-C1-8). 3-step fallback (req 936caa456), MUST resolve to an EXISTING dir else
// REFUSE (fail-closed, ties R-C3): (1) /sprints/(sprint-…)/ in sourceFile|compoundSource; (2) model.slug if its dir
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
// up via R-C5 deriveStatusEnum (single source; sprint↔tasks can't disagree, INV-C1-2). TERMINAL-RESOLVED(task) =
// deriveStatusEnum===Done OR task.supersededBy present. CLOSED = tasks non-empty AND all terminal-resolved (Done vs
// Superseded kept DISTINCT, never collapsed — INV-C1-7); Active = ≥1 In-Progress not-superseded; QA-pending = ≥1 QA
// Review (no active); else Planned. Reuses R-C5 with NO extension (supersededBy is a SEPARATE field, PO ruling B).
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
    if (cancelled) { counts.cancelled++; continue; } // R-C1-refine FIX2: cancelled is TERMINAL, DISTINCT (INV-C1-10), NOT Done
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

// R-C1-refine FIX1: the ONE shared frozen/current-era boundary — single-source, imported by BOTH resolveSprintPin
// AND R-C6's FROZEN_LEGACY (cannot drift, NOT a per-consumer heuristic). Sprints numbered <= FROZEN_LEGACY_MAX are
// frozen pre-S19 legacy (lingering In-Progress checklists frozen-in-amber) — EXCLUDED from the pin universe (all 3
// slots + the ambiguity/unresolvable throws) BY CONSTRUCTION (INV-C1-9), with NO frozen-data mutation.
export const FROZEN_LEGACY_MAX = 18;
export function isCurrentEra(num: number | null): boolean { return num != null && num > FROZEN_LEGACY_MAX; }

// [impl:uuid:af97137f-cce1-4b1c-9bb8-40d84dbd5b33] SprintPinResolver.resolveSprintPin — pure current/last/next,
// NUMBER-KEYED (never name-substring). current = the ONLY Active sprint (≥1 In-Progress not-superseded); a
// QA-pending-only sprint does NOT qualify (INV-C1-3); >1 Active = FAIL-LOUD ambiguity (INV-C1-4), never a silent
// pick; none → null. last = highest-number Closed; next = lowest-number Planned with number > current. FAIL-CLOSED
// vacuous (INV-C1-6): a sprint with an unresolvable task ref REFUSES (throws named); empty tasks[] is never Done.
export function resolveSprintPin(idx: ScenarioIndex): SprintPin {
  const sprints = [...idx.list()].map((u) => idx.get(u)).filter((u): u is ScenarioUnit => !!u && u.ior === 'ior:class:Sprint');
  const rows = sprints
    .map((s) => ({ s, num: sprintNumOf(s) }))
    // FIX1: pin universe = CURRENT-ERA only (num > FROZEN_LEGACY_MAX); frozen pre-S19 legacy is excluded here —
    // BEFORE deriveSprintStatus and BEFORE the unresolvable/ambiguity throws — so it can never count Active or throw.
    .filter((x): x is { s: ScenarioUnit; num: number } => isCurrentEra(x.num))
    .map(({ s, num }) => {
      const st = deriveSprintStatus(s, idx);
      if (st.unresolvedRef) throw new Error(`R-C1 FAIL-CLOSED: sprint '${(s.model as any).slug || (s.model as any).uuid}' has an unresolvable task ref ${st.unresolvedRef} — refusing (never silent-skip).`);
      return { uuid: String((s.model as any).uuid), num, name: String((s.model as any).name || ''), st };
    });

  const slot = (r: { uuid: string; num: number; name: string }): SprintSlot => ({ uuid: r.uuid, number: r.num, name: r.name });

  const active = rows.filter((r) => r.st.status === 'Active');
  if (active.length > 1) throw new Error(`R-C1 FAIL-LOUD (INV-C1-4): ${active.length} Active sprints [${active.map((a) => a.num).join(', ')}] — ambiguous current, never silent-pick. Resolve the checklists so exactly one sprint is In-Progress.`);
  const current = active.length === 1 ? slot(active[0]) : null;

  const closed = rows.filter((r) => r.st.status === 'Closed').sort((a, b) => b.num - a.num);
  const lastCompleted = closed.length ? slot(closed[0]) : null;

  const curNum = current?.number ?? lastCompleted?.number ?? -Infinity;
  const planned = rows.filter((r) => r.st.status === 'Planned' && r.num > curNum).sort((a, b) => a.num - b.num);
  const nextBacklog = planned.length ? slot(planned[0]) : null;

  return { current, lastCompleted, nextBacklog };
}
