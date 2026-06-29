# Sprint 23 — Media Preview — Planning

**Source:** Tron directive 2026-06-29 (Heartspaces room), via robbin-po.
**Requirements:** [requirements.md](./requirements.md)

## Sprint Goal

Extend the room content preview (the R21.9 rb-preview-pane / ContentPreviewer drawer) to richer media: audio files play in an HTML5 player, and YouTube URLs discovered in a room render as embedded iframe players instead of plain text.

## Use Case Placeholders

| Anchor | UseCase (Object.verb) | UC placeholder UUID | Covers |
|--------|----------------------|---------------------|--------|
| <a id="uc-mp1"></a>UC-MP.1 | preview.renderAudioPlayer | b9792582-755d-4f12-8476-42f134b6f4ef | R23.1 |
| <a id="uc-mp2"></a>UC-MP.2 | preview.renderYouTubeEmbed | d0d09ff8-27e1-4059-88d0-90cc20f05eb2 | R23.2 |

The architect refines these into real UseCase units on the content-preview class (likely the ContentPreviewer / rb-preview-pane renderer) and wires Class → Method → Implementation → Test.

## Notes

- Builds on R21.9 (file detail reorder + rb-preview-pane pan/zoom) and the room ContentPreviewer drawer.
- R23.2 video-ID extraction must handle watch?v=, youtu.be/, and embed/ URL forms.
- Repro for R23.2: Heartspaces room holds youtube.com/watch?v=a-_CuBOu6BA as a .url that currently shows as text.

## Definition of Done (Strict Verify Bar)

- Audio file in a room → HTML5 player with play/pause/seek/volume (mp3/wav/ogg/m4a).
- YouTube URL in a room → embedded iframe player (not text).
- Both verified live headless.

---

*Planned by robbin-req 2026-06-29. Sprint 23 — Media Preview.*
