// R40.11 slice-3 (AC-3 field SOURCE). ONE type-driven field extraction, shared by the server
// (/api/trace/children `fields`) AND the gate (check-deployment-default-view) so the two can never drift.
// The M2 TYPE determines which fields exist — each type carries its own (ConfigFile→manifestsAs,
// Service→configuredBy, EnvValue→fragment, …) — so rendering ALL scalar fields IS type-driven by construction.

const IDENTITY_FIELDS = new Set(['uuid', 'name', 'sourceFile', 'sourceLine']);

// Scalar model fields minus identity/links — the renderable field set for the generic default view.
// Arrays/objects are links/children (rendered separately), not scalar fields.
// [impl:uuid:ae806e45-c5ac-4cd8-aff1-4c95b4dd940e] detailScalarFields — R40.11 slice-3 (AC-3 scalar field source)
export function detailScalarFields(model: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(model || {})) {
    if (IDENTITY_FIELDS.has(k) || v === null || v === undefined || v === '' || typeof v === 'object') continue;
    out[k] = String(v);
  }
  return out;
}
