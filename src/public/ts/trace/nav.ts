/**
 * T105 — module-level navigation hook. Views (rb-object-item) call `navigate(...)` without
 * holding a TraceRouter reference; the active TraceRouter registers itself via setActiveRouter
 * (in TraceRouter.start). Keeps Views pure — routing stays in the controller.
 *
 * [impl:uuid:b4c8bf40-6b31-4acd-ad4a-0f93d6f7326b] AC6 click→navigate
 */
// [impl:uuid:8a6c772d-ebcd-4c69-bc40-5174fcb71bc6] TraceRouter.navigate
import type { Navigator } from './VerbRegistry.js';

let active: Navigator | null = null;

export function setActiveRouter(router: Navigator | null): void { active = router; }

export function navigate(type: string, verb = 'show', params: Record<string, string> = {}): void {
  active?.navigate(type, verb, params);
}
