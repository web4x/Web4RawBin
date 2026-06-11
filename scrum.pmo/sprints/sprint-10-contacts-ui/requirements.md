[Back to Planning](./planning.md)

# Sprint 10 — Contacts UI — Requirements

Derived from Tron directives 2026-05-25. Per
[traceability standard](../../standards/traceability-standard.md):
each requirement has a `[requirement:uuid]` and a forward link to its task.

## Requirements

- [ ] R10.1 — Tapping a joined room member (name, avatar, or status dot) opens their
  read-only profile sheet with a downloadable vCard.
  [requirement:uuid:99897fb4-6876-4047-9849-bbdaa840e110]
  > Tron: "clicking a joined user in a room does nothing — I want their profile/vCard."
  → [T81](./task-81-member-click-vcard.md)

- [ ] R10.2 — In the opened profile sheet, the "Download vCard" button is visible
  (readable contrast on the white sheet) and the sheet's avatar uses the shared
  `rb-avatar` component (no duplicated inline `<img>`).
  [requirement:uuid:b252bd78-7ee5-4ccf-8c74-818d1c6e6b4a]
  > Tron (iPhone test): "vCard button is missing; the picture isn't the avatar component."
  → [T82](./task-82-vcard-visibility-avatar-dry.md)

- [ ] R10.3 — Tapping your OWN member item opens the read-only profile sheet (not the
  ProfileEditor); the self sheet shows [Download vCard, Edit→ProfileEditor]. This
  supersedes T81 AC6.
  [requirement:uuid:30c3d4e5-f6a7-4b82-9c93-1d2e3f4a5b62]
  > Tron: "when I am in a room clicking on my users item, I want the profile to open, not the profile editor."
  → [T83](./task-83-self-click-profile.md)

## Forward Traceability
| Requirement | Task | Use case | PUML | Class/method |
|-------------|------|----------|------|--------------|
| R10.1 | T81 | UC member-click→sheet→vCard | _(pending diagrams)_ | `RoomView.ts` rb-member-click handler; `ProfileSheet.open()` |
| R10.2 | T82 | UC sheet button visibility + avatar DRY | _(pending)_ | `ProfileSheet.ts`; `app.css .user-sheet .btn-secondary` |
| R10.3 | T83 | UC self-click→read-only sheet | _(pending)_ | `RoomView.ts` isSelf branch; `ProfileSheet.open(profile, isSelf)` |

PUML elements to be added in Sprint 11 / T86 (active-sprint chain backfill).

---
**Sprint:** Sprint 10 — Contacts UI
**Created:** 2026-05-25
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md)
