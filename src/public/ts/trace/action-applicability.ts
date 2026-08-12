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
export type ActionCtx = { hasActiveDiagram?: boolean };

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
  // pin designation applies to ANY task regardless of status (steering is unconstrained + server-authoritative).
  { verb: 'pin-current', label: '📌 Set current', appliesTo: { types: ['task'] } },
  { verb: 'pin-next', label: '📋 Set next', appliesTo: { types: ['task'] } },
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
