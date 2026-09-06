# Drop-path defects — design by the book (robbin-architect, 2026-09-06)

Per PO/Tron: name the established patterns, cite them, apply to the measured class/method set. No coined terminology. Two defects, both textbook.

---

## DEFECT 2 — `url → WebItem, ELSE File` (image/.eml/.vcf/.ics all land as bare File)

**Patterns:** Replace Conditional with Polymorphism (Fowler, *Refactoring*) · Factory Method / Abstract Factory (GoF) · self-registering Registry → Open/Closed Principle (SOLID).

**The conditional to remove (measured):**
- Client `src/public/ts/drop-dispatcher.ts` `dispatch()` L101: `if (file.type.startsWith('image/'||'text/'||'application/'||'audio/'||'video/'||'message/')) → saveFileUnit (File) else …`; `dispatchUrl()` → WebItem. All non-URL bytes collapse to a bare File.
- Server unit-receive: `mimeType==='text/uri-list' → WebItem, ELSE → createFileUnit (File)`.

**By the book:**
1. **`MimeType.from(contentType, name)` IS the Factory Method** — returns the natural class for the payload; the CLASS owns load/store/render (MVC-in-the-object, per Tron). Existing natural classes: `WebItem` (`src/ts/scenario/WebItem.ts`), `File` (`file-unit.ts`). New natural classes to add: `Email` (message/*, .eml), `Contact` (text/vcard, .vcf), `CalendarEntry` (text/calendar, .ics), `Image` (image/*). File = the fallback registrant (`*/*`), not a hardcoded else.
2. **Self-registering Registry (already present — reuse, don't invent):** `DropDispatcher.register(mimePrefix, handler)` / `handlers.set` (drop-dispatcher.ts:28) is the registry seam, currently bypassed by the L101 if-chain. Each natural class registers its own mime prefix(es) + factory at module load. `dispatch()` becomes a registry lookup (`MimeType.from` → registered class), the if-chain deleted. Server unit-receive routes through the same factory (one registry, shared contract) rather than the `uri-list ? WebItem : File` ternary.
3. **Open/Closed test (the design is right iff this holds):** adding a 6th natural class touches ZERO existing switch/if — only a new class file with its own `register(...)`. If a central conditional must be edited, the pattern is NOT applied. Gate (scan-the-hazard): grep asserts 0 `startsWith('…/')`-style mime branching and 0 `mimeType===…?WebItem:File` outside a class's own registration.

**Class/method set:**
- `MimeType.from(contentType, name): NaturalClassFactory` (new; the Factory Method).
- Registry = existing `DropDispatcher.register` extended to carry a class factory, not just a `DropHandler`.
- `WebItem`, `File`, + new `Email`, `Contact`, `CalendarEntry`, `Image` — each exposes `register()` (self-registration) + `toUnit()` / `render()` (MVC-in-object). (`Contact` = the planned VCard→Contact class; identity uuid stays, mime lens 'text/vcard'.)

---

## DEFECT 1 — federated-ref read first → same-origin unit origin-fetched into a 403 before local relink

**Pattern:** Proxy (GoF, *remote proxy*). (Strategy is the fallback framing for the resolution step alone.)

**The branch to delete (measured):** `src/public/ts/RoomView.ts:217-219` reads `application/rb-federated-ref`, then `if (fr.originHost !== here) remoteFed = fr` and branches: remote → server import (self-fetches a same-origin unit → "origin 403"); else falls through to `dnd-contract.resolveDropPayload`. Three prior fixes each REORDERED or patched this branch (the current `!== here` guard is the latest patch) — the branch itself is the defect.

**By the book:** a remote-origin unit is the SAME interface as a local one with a different **resolution strategy** — the textbook remote-proxy. Introduce `RefProxy` with `resolve(roomId): Promise<Unit>`; two implementations — `LocalRelinkProxy` (relinks the LOCAL unit, `contentAlreadyLocal` path) and `RemoteImportProxy` (origin fetch + import). The concrete proxy is chosen ONCE, at ref construction, by the ref's own `originHost` vs `location.origin` — **not** by an `if` in the drop handler. The drop handler calls `resolveDropPayload(dt).resolve(room)` and **branches on NOTHING**; the mime-first if-chain disappears (it is not reordered).

**Class/method set:**
- `dnd-contract.ts resolveDropPayload(dt)` returns a `RefProxy` (polymorphic) — the single entry, already the "no URL/href parse, fixed order" contract.
- `RefProxy` (interface: `resolve(roomId)`), `LocalRelinkProxy`, `RemoteImportProxy` — the proxy selects itself from `originHost === location.origin`.
- `RoomView.ts` drop handler: delete the fedRaw/originHost branch (L217-239), call `resolveDropPayload(dt).resolve(room)`.
- **Test the pattern is applied:** a same-origin federated-ref drop resolves with ZERO network fetch (no self-403); the handler contains no `originHost` comparison.

---

**Handoff:** expert owns the build (both touch live drop/upload). Defect 2 rides the SLICE-A/natural-class work already in flight (UnitConvertible/natural classes R40.99). Defect 1 is a bounded refactor of the RoomView drop handler + dnd-contract. Neither invents a mechanism — MimeType-factory + existing register-registry (D2), remote-proxy (D1).
