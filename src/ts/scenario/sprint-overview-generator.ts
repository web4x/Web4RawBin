/**
 * R-C6 — SprintOverviewGenerator: sprints.overview.md becomes generated-where-it-drifts + preserved-where-it's-narrative.
 * (design-rc6-overview-generated-frozen-legacy.md, chain d8ef9ad1a). Region-granularity: the sprint INDEX between
 * `<!-- GENERATED-INDEX:BEGIN/END -->` is regenerated from Sprint units + R-C1 pin + R-C5 rollup; EVERYTHING outside
 * the markers is PRESERVED byte-identical hand-narrative. Frozen-legacy (S01-FROZEN_LEGACY_MAX) is EXCLUDED from the
 * gate but EXPLICITLY LISTED (INV-C6-3, never a silent cap). Fail-closed vacuous via R-C3 refuseIfVacuous.
 *
 * Pure producers (no I/O in the methods) so the first run is a reviewable dry-run, never a blind clobber of a
 * Tron-facing board — the CLI (scripts/sprint-overview.ts) does --check (default) / --write.
 */
import { ScenarioIndex } from './index-store.js';
import type { ScenarioUnit } from './types.js';
import { resolveSprintPin, deriveSprintStatus, sprintNumOf, isCurrentEra, FROZEN_LEGACY_MAX } from './sprint-pin-resolver.js';
import { refuseIfVacuous } from './consistency-guard.js';

export const BEGIN = '<!-- GENERATED-INDEX:BEGIN -->';
export const END = '<!-- GENERATED-INDEX:END -->';
// G5 set 2: design-doc planning.md kept hand-authored (R-C7 classification) — declared, not inferred.
export const FROZEN_DESIGN_DOC_PLANNING = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export interface OverviewCheck { ok: boolean; reasons: string[]; currentUnresolved?: string }

export class SprintOverviewGenerator {
  constructor(private idx: ScenarioIndex) {}

  private sprintRows(): { num: number; name: string; status: string; frozen: boolean }[] {
    const sprints = [...this.idx.list()].map((u) => this.idx.get(u)).filter((u): u is ScenarioUnit => !!u && u.ior === 'ior:class:Sprint');
    return sprints
      .map((s) => ({ num: sprintNumOf(s), s }))
      .filter((x): x is { num: number; s: ScenarioUnit } => x.num != null)
      .sort((a, b) => a.num - b.num)
      .map(({ num, s }) => ({ num, name: String((s.model as any).name || ''), status: deriveSprintStatus(s, this.idx).status, frozen: !isCurrentEra(num) }));
  }

  /** Pin line — LOUD + count + cause when unresolvable (guard: impossible to mistake for a resolved value). */
  private pinLines(): { md: string; unresolved?: string } {
    try {
      const pin = resolveSprintPin(this.idx);
      const fmt = (s: { number: number; name: string } | null) => (s ? `S${s.number} ${s.name}` : '—');
      if (!pin.current) {
        const msg = 'no current-era Active sprint';
        return { md: `- **current:** ⚠️ UNRESOLVED — ${msg}\n- **last completed:** ${fmt(pin.lastCompleted)}\n- **next backlog:** ${fmt(pin.nextBacklog)}`, unresolved: msg };
      }
      return { md: `- **current:** ${fmt(pin.current)}\n- **last completed:** ${fmt(pin.lastCompleted)}\n- **next backlog:** ${fmt(pin.nextBacklog)}` };
    } catch (e) {
      // INV-C1-4 ambiguity (multiple current-era Active) — carry the FULL count+cause so a reader can act (live TODO).
      const cause = (e as Error).message.replace(/^R-C1 FAIL-LOUD[^:]*:\s*/, '');
      const msg = `pin ambiguous — ${cause} (pending sprint closure: Tron A1 sign-off + A2 dispositions)`;
      return { md: `- **current:** ⚠️ UNRESOLVED — ${msg}`, unresolved: msg };
    }
  }

  private frozenLegacySection(): string {
    const frozen = this.sprintRows().filter((r) => r.frozen).map((r) => `S${r.num}`);
    return [
      `**FROZEN-LEGACY** (excluded from the consistency gate — Tron-bounded scope, [[no silent caps]]):`,
      `- sprints S01–S${FROZEN_LEGACY_MAX} (needs-backfill ancient set, FROZEN not backfilled): ${frozen.join(', ') || '(none on disk)'}`,
      `- design-doc planning.md (hand-authored): ${FROZEN_DESIGN_DOC_PLANNING.map((n) => `S0${n}`).join(', ')}`,
    ].join('\n');
  }

  /** Regenerate ONLY the between-markers index block (the content that goes inside BEGIN/END). Pure. */
  private renderIndex(): string {
    const rows = this.sprintRows();
    const vac = refuseIfVacuous(rows, { name: 'R-C6 overview/sprint-set', expect: 'non-empty-array' });
    if (!vac.ok) throw new Error(`R-C6 FAIL-CLOSED (INV-C6-4): ${vac.reason} — refusing to emit an empty index (would read as "no sprints").`);
    const pin = this.pinLines();
    // Frozen-legacy rows show 'frozen-legacy' NOT the R-C5 rollup: their unit data is the 694-gap/needs-backfill set,
    // so a derived status would be wrong (e.g. an ancient-Done sprint rolling up 'Planned') — honoring no-status-invention
    // (INV-C6-5) means NOT asserting an unreliable status for a sprint we've deliberately frozen out of the gate.
    const table = ['| # | Sprint | Status |', '|---|--------|--------|',
      ...rows.map((r) => `| ${r.num} | ${r.name} | ${r.frozen ? 'frozen-legacy (excluded from gate)' : r.status} |`)];
    return ['## 📌 Sprint pointers (generated — R-C1 pin + R-C5 rollup)', pin.md, '', ...table, '', this.frozenLegacySection()].join('\n');
  }

  // [impl:uuid:1f38e07e-2635-433a-b9ee-045584c3a669] SprintOverviewGenerator.generateOverview — preserve narrative OUTSIDE markers, regenerate
  // the index INSIDE (INV-C6-1/2/5). First run (markers absent): wrap the existing `| # | Sprint |` table in place.
  generateOverview(existing: string): string {
    const vac = refuseIfVacuous(existing, { name: 'R-C6 overview/existing-content', expect: 'non-empty-string' });
    if (!vac.ok) throw new Error(`R-C6 FAIL-CLOSED (INV-C6-4): ${vac.reason} — refusing (missing overview file is a FAIL, not an empty regen).`);
    const block = `${BEGIN}\n${this.renderIndex()}\n${END}`;
    const b = existing.indexOf(BEGIN), e = existing.indexOf(END);
    if (b !== -1 && e !== -1 && e > b) {
      // markers present → replace ONLY between them; preserve every byte outside (INV-C6-1).
      return existing.slice(0, b) + block + existing.slice(e + END.length);
    }
    // first run: markers absent → wrap the existing hand-maintained `| # | Sprint |` table in place.
    const lines = existing.split('\n');
    let start = lines.findIndex((l) => /^\|\s*#\s*\|\s*Sprint\s*\|/.test(l));
    if (start === -1) throw new Error('R-C6 FAIL-CLOSED (INV-C6-4): no GENERATED-INDEX markers AND no `| # | Sprint |` table found — refusing to guess the index location.');
    let end = start;
    while (end + 1 < lines.length && lines[end + 1].trimStart().startsWith('|')) end++;
    return [...lines.slice(0, start), block, ...lines.slice(end + 1)].join('\n');
  }

  // [impl:uuid:4d21edf3-6037-4e0a-82a0-48867e032584] SprintOverviewGenerator.checkOverview — between-markers drift FAIL + frozen-legacy VISIBLE
  // + missing-file FAIL; the outside-markers narrative is NOT checked (hand-owned). Reports current-unresolved (live TODO).
  checkOverview(existing: string | null): OverviewCheck {
    const reasons: string[] = [];
    if (existing === null) return { ok: false, reasons: ['R-C6 FAIL (INV-C6-4): overview file missing — FAIL, not skip-as-match.'] };
    const b = existing.indexOf(BEGIN), e = existing.indexOf(END);
    if (b === -1 || e === -1 || e <= b) return { ok: false, reasons: ['R-C6 FAIL (INV-C6-4): GENERATED-INDEX markers missing/malformed — cannot verify the index region.'] };
    const current = existing.slice(b + BEGIN.length, e).replace(/^\n|\n$/g, '');
    const expected = this.renderIndex();
    if (current !== expected) reasons.push('R-C6 DRIFT (INV-C6-2): the between-markers index != regenerated (Sprint units + pin + rollup). Run --write.');
    const pin = this.pinLines();
    // guard 2: surface unresolved as a REPORTABLE live-TODO, never a silent pass.
    const currentUnresolved = pin.unresolved;
    if (currentUnresolved) reasons.push(`R-C6 REPORT: overview current = UNRESOLVED (${currentUnresolved}) — live TODO, not a resolved value.`);
    return { ok: reasons.length === 0, reasons, currentUnresolved };
  }
}
