<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T84: Editor Back Button Navigates to Parent Directory, Not /app

[task:uuid:f7a2c4e6-3b8d-4f10-a5c7-9e1d3f5b7a90]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [x] testing (tester — TS1-TS4)
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [requirement:uuid:12a4b6c8-5d2e-4f30-9a17-3b5c7d9e1f02](./requirements.md) — R12.1 editor back → parent dir
  - [Sprint 12 Planning](./planning.md)
  - Tron directive 2026-05-25 (confirmed bug)
- down
  - None (atomic task)
- chain
  - **requirement:** R12.1 in [requirements.md](./requirements.md)
  - **use case:** UC-FB.1 file.browse (Sprint 8 requirements)
  - **puml:** N/A
  - **class/method:** `src/public/ts/components/rb-editor-toolbar.ts:36` — hardcoded `<a href="/app">`

## Task Description

**Bug:** The "← App" back button in the Monaco editor toolbar
(`rb-editor-toolbar.ts` line 36) is hardcoded to `/app`. When editing
`scrum.pmo/sprints/sprint-09-room-identity/planning.md`, Back goes to `/app` (room
lobby) instead of the parent directory `/md/scrum.pmo/sprints/sprint-09-room-identity/`.

**Root cause:** `rb-editor-toolbar.ts:36`:
```typescript
<a href="/app" style="color:#ccc;text-decoration:none">← App</a>
```
The href is a static string. It must derive the parent directory from `this._path`.

**Fix:**
```typescript
const parentDir = this._path ? '/md/' + this._path.split('/').slice(0, -1).join('/') + '/' : '/md/';
// renders: <a href="${parentDir}">← Back</a>
```
For `this._path = scrum.pmo/sprints/sprint-09-room-identity/planning.md`:
- `split('/')` → `['scrum.pmo','sprints','sprint-09-room-identity','planning.md']`
- `slice(0,-1).join('/')` → `scrum.pmo/sprints/sprint-09-room-identity`
- result: `/md/scrum.pmo/sprints/sprint-09-room-identity/`

Empty `this._path` (no file open) → fall back to `/md/` (browse root).
**Label:** "← App" → "← Back". **Keep** the `📂` browse button (line 37,
`<a href="/md/">📂</a>`) unchanged.

## Acceptance Criteria

- [x] AC1: Back button navigates to parent dir of current file (`a/b/c.md` → `/md/a/b/`)
- [x] AC2: Back button shows "← Back" (not "← App")
- [x] AC3: No file open → goes to `/md/` (browse root) — code path: empty `_path` → `/md/` (same guard as AC6)
- [x] AC4: `📂` browse button still goes to `/md/` (unchanged)
- [x] AC5: Deep paths work (`scrum.pmo/sprints/sprint-09-room-identity/planning.md` → `/md/scrum.pmo/sprints/sprint-09-room-identity/`)
- [x] AC6: Root-level files work (`README.md` → `/md/`)
- [x] `npm run build` succeeds; version bump + sw.js cache (expert; live server now v0.5.4)

## Dependencies

- **Requires:** None (Sprint 8 Monaco editor already shipped)
- **Enables:** None (atomic fix)

## Definition of Done

- [ ] All AC met; chain links resolve
- [ ] Tests pass, build clean, version bumped
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-05-25: Tron bug report (literal quote above). Promoted from backlog B1 → T84 by PO.

## Subtasks

None (atomic task).

---
*Sprint 12 — Editor Fixes*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 1 (HIGH — confirmed Tron bug)*
