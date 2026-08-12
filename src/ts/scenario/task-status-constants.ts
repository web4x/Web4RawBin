// R40.37 — dependency-free task-status constants shared by BOTH the browser client (the R40.37 action-declaration
// affordance) and the node server/generators. Deliberately IMPORT-FREE (no ScenarioIndex/fs) so the client bundle can
// import it WITHOUT pulling server-only deps. This is the ONE source for APPROVE_STATUSES — the affordance (client
// hides qa-approve/qa-decline off these statuses) and the server 409-gate (approveByOwner) both import it → they
// CANNOT drift (correct-by-construction). Server remains the authority; the client only hides the impossible.
export type TaskStatusEnum = 'Planned' | 'In Progress' | 'QA Review' | 'Done';
export const STATUS_ORDER: readonly TaskStatusEnum[] = ['Planned', 'In Progress', 'QA Review', 'Done'];
export const APPROVE_STATUSES: readonly TaskStatusEnum[] = ['QA Review'];
