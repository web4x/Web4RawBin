# Sprint 19 — Architecture Design

**Author:** robbin-architect · **Delivered via:** robbin-po (architect Write gated by classifier outage 2026-06-10).
**Source:** Tron literal R19.1–14 in [compound-requirement-source.md](./compound-requirement-source.md).
**Chain:** 6-step Req → UC → Class → Method → Impl → Test (UC.method singular).

---

## Section 1 — Room as Scenario Unit (R19.1, R19.2)

`ior:class:Room`. `model = {uuid, name, visibility(public|invite|private), passwordHash, mode(live|persistent), owners[], members[], memberStatus{}, files[], parent}`. `ownerIor = creating user`.

**KEY separation:** `members[]` = MEMBERSHIP, `memberStatus{}` = PRESENCE — separated so R19.8 holds (offline members remain in the list with status=offline, never dropped).

- `RoomMember.disconnected` (Room.ts:14) maps to `memberStatus`.
- `RoomInfo.isPrivate` (Room.ts:26) migrates to the 3-state visibility enum.
- `passwordHash` via `UserCrypto`; never plaintext.
- `RoomLoader` in `ClassRegistry`.
- Existing rooms migrate one-time (`mode = live`).

**Editor (R19.2):** click room name → existing `/scenario?ior=` surface, `rb-room-detail` DetailView renders `visibility` radio + `mode` + password field + members. **No new editor** — the room IS the scenario.

---

## Section 2 — Visibility & Apply-Flow (R19.3–R19.6)

- **public** = listed to all + Join button (current R19.6 behaviour).
- **invite** = listed to all + Apply button (R19.5).
- **private** = owners-only listing (R19.4) + password entry.

**R19.5 Apply-flow** = `JOIN_REQUEST` typed message INTO the room chat (REUSES `CHAT_MESSAGE` pipeline — no new infra):

```
{ type: JOIN_REQUEST, requesterName, requesterUuid, status: pending }
```

Flow: Apply click → message → renders as Accept/Decline card → accept adds uuid to `members[]` and sets `status: accepted` → requester receives `JOIN_ACCEPTED` → auto-joins. The message **stays** as audit trail.

**R19.4 filter:** `rooms.filter(r => r.model.visibility !== 'private' || r.model.owners.includes(viewer))`.

---

## Section 3 — Lifecycle: Live vs Persistent (R19.7–R19.10)

- **live** (current default) = members tracked while connected, display online only.
- **persistent** = every joiner appended, NEVER removed on disconnect (R19.8 no contact lost), offline badge.

**R19.9 member.add/remove** = owner-only via editor; the ONLY way out of a persistent room.

**R19.10 default-switch — TWO-PHASE:** feature ships with `live` default; the LAST sprint commit flips default to `persistent` + editor mode toggle. Tester verifies both phases.

---

## Section 4 — Room UI (R19.11–R19.13)

`rb-room-content` component mounts inside `RoomView.ts`. Layout: drop-zone div on top (`height: calc(2 * var(--item-view-height))` per R19.11), then a 2-node tree below (Members / Files per R19.12). Children are `rb-object-item` (existing, `type=member|file` per R19.13) — e.g. `alice(online)`, `bob(offline)` badges. Drop on the zone → upload pipeline (Section 5).

---

## Section 5 — File-as-Unit (R19.14)

`scenario/index/<5-prefix>/<uuid>.content` + `<uuid>.scenario.json`. `ior:class:File`. `model = {uuid, name, mimetype, size, contentRef:<uuid>.content, unitLinks[scenario/rooms/<slug>/file.ext], parent: room-uuid}`. `ownerIor = uploader`.

**Upload flow:** drop → `POST /api/room/<room-uuid>/upload` → server generates v4 uuid → writes `.content` + `.scenario.json` into the index → creates `ln -s` in `scenario/rooms/<slug>/` (records in `unitLinks[]`) → appends `ior:instance:<file-uuid>` to `Room.model.files[]` → ViewBus → Files tree re-render. `FileLoader` registers in `ClassRegistry`. Reuses `FileApi.ts` (`sanitizePath` + `BINARY_EXTS` validated present).

---

## Section 6 — Chain Wiring

**NEW Classes (scenario units, real v4 uuids at creation):**
- `Room` (init / visibilityCheck / memberAdd / memberRemove / fileAttach / toScenario) → extend `src/ts/server/Room.ts`
- `RoomLoader` (load / save) → register in `src/ts/scenario/classes.ts`
- `RbRoomDetail` (render / visibilitySet / modeSet / passwordSet) → NEW `src/public/ts/room/rb-room-detail.ts`
- `RbRoomContent` (render / dropHandle) → NEW `src/public/ts/room/rb-room-content.ts`
- `JoinRequestFlow` (applySend / requestRender / accept / decline)
- `FileUnit` (upload / contentWrite / scenarioWrite / linkCreate) → extend `src/ts/server/FileApi.ts`

**13 UCs (UC.class + UC.method SINGULAR at creation):**

| UC | Req | Class.method |
|----|-----|--------------|
| `room.editConfig` | R19.2 | `RbRoomDetail.render` |
| `room.visibilityCheck` | R19.3 | `Room.visibilityCheck` |
| `room.listForOwner` | R19.4 | `Room.visibilityCheck` |
| `room.applyToJoin` | R19.5 | `JoinRequestFlow.applySend` |
| `room.acceptRequest` | R19.5 | `JoinRequestFlow.accept` |
| `room.joinPublic` | R19.6 | (existing join path) |
| `room.persistMembers` | R19.8 | `Room.memberAdd` |
| `member.add` | R19.9 | `Room.memberAdd` |
| `member.remove` | R19.9 | `Room.memberRemove` |
| `room.defaultPersistent` | R19.10 | `RbRoomDetail.modeSet` |
| `roomContent.renderDropZone` | R19.11 | `RbRoomContent.render` |
| `roomTree.renderMembersFiles` | R19.12–13 | `RbRoomContent.render` |
| `file.uploadAsUnit` | R19.14 | `FileUnit.upload` |

**PlantUML:** `diagrams/s19-usecases.puml` — 13 UCs in 5 packages (RoomUnit / Visibility / Membership / UI / Files), `[uc:uuid]` + `[class:uuid]` + `[method:uuid]` annotated, UC → Class drawn. Generated WITH unit creation so PUML uuids == index uuids (NO fake-suffix per learning #17).

---

## Section 7 — Task Mapping (for planner)

7 tasks proposed:

1. **T-room-unit** (R19.1, R19.2) — `Room` class + loader + editor `DetailView`.
2. **T-visibility** (R19.3, R19.4, R19.6) — enum + listing filter + join button.
3. **T-apply-flow** (R19.5) — `JOIN_REQUEST` + Apply + accept/decline.
4. **T-persistent** (R19.7, R19.8, R19.9) — mode + persistent members + add/remove.
5. **T-default-flip** (R19.10) — LAST commit: default `persistent` + toggle.
6. **T-room-ui** (R19.11, R19.12, R19.13) — drop-zone + Members/Files tree.
7. **T-file-unit** (R19.14) — upload → `uuid.content` + `scenario.json` + `ln`.

Rule-pair (a)+(b) on every task; (c) STATIC_SHELL on new client components.

---

## R19.x → UUID Map (architect's UC.requirements[] wiring)

From PO flush `b0b6b8e8`:

| Atom | UUID |
|------|------|
| R19.1  | `3e14d73c-1ddb-4f42-8d33-481581a8ec95` |
| R19.2  | `18ecdab4-e8d1-453f-89b2-4cae64103a80` |
| R19.3  | `1f1849b5-b47a-4018-8bb1-cd9690884930` |
| R19.4  | `bcaa8cda-6ac6-4606-8443-8dd8ed80e673` |
| R19.5  | `97bb40eb-638f-463b-b66d-e601cc0802c1` |
| R19.6  | `8bd2f61f-d229-4eec-a385-47795c753ca2` |
| R19.7  | `b6b9c0ab-0f35-4801-b7f0-cd6dc3820f23` |
| R19.8  | `30dcb1a0-17b9-4fcb-9823-e71a4dc371c9` |
| R19.9  | `d6c4604a-339f-4690-8f92-7885dec8def5` |
| R19.10 | `1350d422-1133-4f04-9f9f-c0b3c4930542` |
| R19.11 | `61c2661a-fb8a-489a-9d5d-abc4e819cf5d` |
| R19.12 | `dc2e99eb-8e31-4337-887b-8204f7588c20` |
| R19.13 | `409ea58b-763b-433e-b17d-0ea156d94355` |
| R19.14 | `f1ca3cc9-a675-4a3b-9898-9e33d7876ed8` |
| Sprint | `97f513a1-db0b-4216-87c2-a85c93daae28` |

**Next:** architect generates real v4 uuids for the 13 UCs + 6 Classes + 6 Methods at unit creation, writes the .scenario.json units (or hands the byte-content to PO), and produces `diagrams/s19-usecases.puml` with matching uuid annotations.
