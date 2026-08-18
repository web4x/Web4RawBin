// R40.37 — the PURE, browser-dep-free action-applicability core (no DOM imports) so it is unit-testable in node AND
// bundled into the client. Providers SUPPLY declarations; the shared drawer bar RESOLVES applicability ONCE here
// (no per-view if-chains). The old type-conditional universalActionsFor became these declarations.
import { APPROVE_STATUSES } from '../../../ts/scenario/task-status-constants.js'; // anti-drift: SAME set the server 409-gate enforces

export type Action = { verb: string; label: string; primary?: boolean };
export type ActionDecl = {
  verb: string; label: string; primary?: boolean;
  appliesTo?: { types?: string[]; notTypes?: string[]; statuses?: string[]; kinds?: string[]; when?: (ctx: ActionCtx) => boolean };
  onInvalid?: 'hide' | { disabledReason: string };
};
export type ActionUnit = { type: string; status?: string; kind?: string };
export type ActionCtx = { hasActiveDiagram?: boolean; taskRole?: 'current' | 'next' | 'other' }; // T37.26: the shown task's DERIVED pin-role (server-computed model.pinRole) for the Set-as-Current visibility matrix

// The universal declarations (INV-E3 type-policy now DECLARED, not if-chained).
export const UNIVERSAL_DECLS: ActionDecl[] = [
  { verb: 'download-vcard', label: '📇 vCard', appliesTo: { types: ['member', 'user'] } },
  { verb: 'preview-file', label: '👁 Preview', appliesTo: { types: ['file'] } },
  { verb: 'open-newtab', label: '↗ New tab', appliesTo: { types: ['file'] } },
  { verb: 'proxy-preview', label: '⟳ Proxy preview', appliesTo: { types: ['webitem'] } },
  // AC2: qa-approve/qa-decline surface ONLY on a task whose status ∈ APPROVE_STATUSES (QA Review) → HIDDEN on Done/
  // In-Progress. That set is the SHARED APPROVE_STATUSES the server 409-gate also enforces (anti-drift, one source).
  { verb: 'qa-approve', label: '✓ Approve', appliesTo: { types: ['task'], statuses: [...APPROVE_STATUSES] }, onInvalid: 'hide' },
  { verb: 'qa-decline', label: '✗ Decline', appliesTo: { types: ['task'], statuses: [...APPROVE_STATUSES] }, onInvalid: 'hide' },
  // R40.18 RETIRED (architect 7cb9617fb): pin-current / pin-next REMOVED — the pin is now DERIVED (current = In-Progress
  // task with MAX lastAdvancedAt). A manual Set-current/Set-next is a SECOND SOURCE that can contradict the derivation —
  // the exact two-source vector that produced the stale pick 78ea801d3 (lied to Tron for days). Retire (not a when-gate)
  // makes the contradiction IMPOSSIBLE by construction; the /designate route + resolver override path go dead. If a real
  // steering workflow ever surfaces it returns as a labeled, expiring, provenance-carrying override — a future req (YAGNI).
  // T37.26 (PO ruling, architect 515260b8d): Set-as-Current RETURNS — but NOT as the retired stored pin. It ADVANCES the
  // task through the seam (bumps lastAdvancedAt) so the DERIVATION ITSELF picks it → NO second source, nothing to diverge
  // (resolves the R40.18 concern by construction). MATRIX: current task → hidden (already the one being worked); next +
  // every other task → shown. open-task-file → ALL tasks (the bar is the ONE action surface; the body renders DATA).
  { verb: 'set-current', label: '📌 Set as Current', appliesTo: { types: ['task'], when: (ctx) => ctx.taskRole !== 'current' } },
  { verb: 'open-task-file', label: '📄 Open Task file', appliesTo: { types: ['task'] } },
  // set-next: NOWHERE (architect fa799ca43, FINAL) — NO button, permanently EMPTY cell. 'next' = fixed sprint-number
  // identity; there is NO derived 'next task', and a stored nextBacklog would be the lying-pin one slot over. So there is
  // no advance-based NOR nextBacklog form — the honest cell is empty. Do NOT add a set-next decl.
  // MATRIX (final): current task → neither steer; every other task → set-current + open-task-file; ALL tasks → open-task-file.
];

// [impl:uuid:17ae8d0a-e8c6-418b-bba4-c6cbe3eafaab] universalActions.applicableActionsFor (Class universalActions
// a9019609) — R40.37 THE ONE resolution point: for the selected unit + ctx, resolve each declared action's
// applicability (appliesTo vs unit.type/status/kind + when). Applicable → OFFERED (visible+enabled); not-applicable →
// HIDDEN or DISABLED-with-reason per onInvalid (default hide). No per-view if-chains; both providers feed decls into THIS.
export function applicableActionsFor(unit: ActionUnit, ctx: ActionCtx, decls: ActionDecl[]): { offered: Action[]; disabled: Array<{ action: Action; reason: string }> } {
  const t = (unit.type || '').toLowerCase();
  const offered: Action[] = [];
  const disabled: Array<{ action: Action; reason: string }> = [];
  for (const d of decls) {
    const a = d.appliesTo || {};
    const okType = (!a.types || a.types.map((x) => x.toLowerCase()).includes(t)) && (!a.notTypes || !a.notTypes.map((x) => x.toLowerCase()).includes(t));
    const okStatus = !a.statuses || (unit.status != null && a.statuses.includes(unit.status));
    const okKind = !a.kinds || (unit.kind != null && a.kinds.includes(unit.kind));
    const okWhen = !a.when || !!a.when(ctx);
    const action: Action = { verb: d.verb, label: d.label, primary: d.primary };
    if (okType && okStatus && okKind && okWhen) { offered.push(action); continue; }
    const onInvalid = d.onInvalid ?? 'hide';
    // DISABLE-with-reason only for a TRANSIENT block (right type, not-yet-eligible status); else HIDE (structural N/A
    // or terminal — e.g. approve on a Done task → absent). AC1/AC2.
    if (onInvalid !== 'hide' && okType) disabled.push({ action, reason: onInvalid.disabledReason });
  }
  return { offered, disabled };
}
