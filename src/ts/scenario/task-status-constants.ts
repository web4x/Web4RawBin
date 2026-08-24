// R40.37 — dependency-free task-status constants shared by BOTH the browser client (the R40.37 action-declaration
// affordance) and the node server/generators. Deliberately IMPORT-FREE (no ScenarioIndex/fs) so the client bundle can
// import it WITHOUT pulling server-only deps. This is the ONE source for APPROVE_STATUSES — the affordance (client
// hides qa-approve/qa-decline off these statuses) and the server 409-gate (approveByOwner) both import it → they
// CANNOT drift (correct-by-construction). Server remains the authority; the client only hides the impossible.
// R40.59 (T40.1 decline-band, Tron-ruled + architect design 0557e1532): 'QA-Review-with-open-CR' is a NEW DERIVED band
// between 'In Progress' and 'QA Review' — a task that reached QA Review but has an OPEN change request being processed.
// It is DERIVED (never a checkbox label, never stored directly — see deriveStatusEnum) and is CURRENT-ABLE (processing a
// CR IS working). It is NOT approvable: APPROVE_STATUSES stays ['QA Review'] so the band cannot manufacture Done by
// construction (the Done-gate rejects it → 409). Placed at index 2 so it ranks past In-Progress but below clean QA Review.
export type TaskStatusEnum = 'Planned' | 'In Progress' | 'QA-Review-with-open-CR' | 'QA Review' | 'Done';
export const STATUS_ORDER: readonly TaskStatusEnum[] = ['Planned', 'In Progress', 'QA-Review-with-open-CR', 'QA Review', 'Done'];
export const APPROVE_STATUSES: readonly TaskStatusEnum[] = ['QA Review']; // band NOT approvable → Done-gated by construction
