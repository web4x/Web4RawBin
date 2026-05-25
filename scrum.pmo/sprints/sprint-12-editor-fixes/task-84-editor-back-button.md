[Back to Sprint 12 Planning](./planning.md)

# T84: Editor Back Button Navigates to Parent Directory, Not /app

[task:uuid:f7a2c4e6-3b8d-4f10-a5c7-9e1d3f5b7a90]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [ ] testing (tester — TS1-TS4)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, v0.4.10)
- rb-editor-toolbar.ts render(): derive parent from `this._path` with PO guard — `const parent = this._path ? this._path.split('/').slice(0,-1).join('/') : ''; const parentDir = parent ? '/md/'+parent+'/' : '/md/';`. Root-level files → `/md/` (no `//`, AC6/TS2). Label `← App` → `← Back`. 📂 browse link unchanged.
- Verified in built editor bundle (edit-SZJS7HJV.js): contains `slice(0,-1)` + "Back", no "App" back-link.
- Version v0.4.10, sw.js cache → rawbin-v0.4.10. tsc clean, esbuild build clean.

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

## Tron Requirement (literal)
> "the monaco editor has a back button on the top header, but it goes always to app and not to the directory in which the current edited file is. thats a bug."

## Task Description

**Bug:** The "← App" back button in the Monaco editor toolbar
(`rb-editor-toolbar.ts` line 36) is hardcoded to `/app`. When editing
`scrum.pmo/sprints/sprint-9-room-identity/planning.md`, Back goes to `/app` (room
lobby) instead of the parent directory `/md/scrum.pmo/sprints/sprint-9-room-identity/`.

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
For `this._path = scrum.pmo/sprints/sprint-9-room-identity/planning.md`:
- `split('/')` → `['scrum.pmo','sprints','sprint-9-room-identity','planning.md']`
- `slice(0,-1).join('/')` → `scrum.pmo/sprints/sprint-9-room-identity`
- result: `/md/scrum.pmo/sprints/sprint-9-room-identity/`

Empty `this._path` (no file open) → fall back to `/md/` (browse root).
**Label:** "← App" → "← Back". **Keep** the `📂` browse button (line 37,
`<a href="/md/">📂</a>`) unchanged.

## PO Review (refinement)
- 2026-05-25 robbin-po: Spec is delegatable. ONE edge-case fix to the proposed code: for a root-level file (`this._path = 'README.md'`), `split('/').slice(0,-1).join('/')` → `''`, so `'/md/' + '' + '/'` → **`/md//`** (double slash) — contradicts AC6/TS2 which expect `/md/`. Guard it: if the parent segment is empty, use `/md/` (no trailing concat). e.g. `const parent = this._path.split('/').slice(0,-1).join('/'); const parentDir = parent ? '/md/' + parent + '/' : '/md/';`. Expert: implement with this guard so AC6/TS2 pass.

## Acceptance Criteria
- [ ] AC1: Back button navigates to parent dir of current file (`a/b/c.md` → `/md/a/b/`)
- [ ] AC2: Back button shows "← Back" (not "← App")
- [ ] AC3: No file open → goes to `/md/` (browse root)
- [ ] AC4: `📂` browse button still goes to `/md/` (unchanged)
- [ ] AC5: Deep paths work (`scrum.pmo/sprints/sprint-9-room-identity/diagrams/use-cases.puml` → `/md/scrum.pmo/sprints/sprint-9-room-identity/diagrams/`)
- [ ] AC6: Root-level files work (`README.md` → `/md/`)
- [ ] `npm run build` succeeds; version bump + sw.js cache (PWA update detection)

## Test Scenarios
File: `test/e2e/editor-back.spec.ts`
| Test | Action | Expected |
|------|--------|----------|
| TS1 | Open deep file, click Back | lands on parent `/md/.../` |
| TS2 | Open root file, click Back | lands on `/md/` |
| TS3 | Inspect button label | reads "← Back" |
| TS4 | Click `📂` | goes to `/md/` (unchanged) |

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
