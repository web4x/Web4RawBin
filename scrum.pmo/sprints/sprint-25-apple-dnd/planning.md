# Sprint 25 — Apple DnD — Planning

**Source:** Tron 2026-06-29 + PO URL-scheme clarification. **Requirements:** [requirements.md](./requirements.md)

## Sprint Goal

Support Apple drag-and-drop items - which arrive as URL SCHEMES (mailto:/webcal:/calshow:/maps:/geo:/tel:/x-apple-reminder:), not File objects - as URL-scheme routing on the R23.2 YouTube model: detect scheme -> meaningful preview -> Open-in-New-Tab launches the native app. Phase 1 (R25.1) is the logging instrument that reveals WHICH schemes Apple actually sends, so the per-scheme handlers are specced from real logs.

## Use Case Placeholder

| Anchor | UseCase (Object.verb) | UC placeholder UUID | Covers |
|--------|----------------------|---------------------|--------|
| <a id="uc-dnd1"></a>UC-DND.1 | drop.logSchemes | 5fc59adc-6a84-4426-b892-28294bbb0612 | R25.1 |

The architect refines UC-DND.1 into a real UseCase on the drop handler (RoomView drop + DropDispatcher) and wires Class -> Method -> Impl -> Test.

## Notes

- IS (measured): RoomView.ts:178 drop reads only dt.files + getData(text/uri-list||text/plain); DropDispatcher.dispatch allowlists image/text/application/audio/video else routeUnknown logs only file.name+type. Apple URL-scheme items (non-File) are invisible today.
- Phase 2 R25.2+ (deferred): per-scheme preview+handler, created from R25.1 logs. Same detect->preview->open-in-new-tab pattern as R23.2 YouTube.
- Possibly-relevant surface (planner): drop-dispatcher.ts MIME allowlist (R22.4 PNG + v0.6.81 MP3) + content-preview.ts.

## Definition of Done (R25.1)

- A drop in Tron's test room produces a chat+server log capturing all DataTransfer types/items/files/getData + the extracted URL scheme of every item.
- The log is rich enough to spec R25.2+ per-scheme handlers without guessing.

---

*Planned by robbin-req 2026-06-29. Sprint 25 — Apple DnD.*
