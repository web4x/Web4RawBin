[Back to Planning](./planning.md)

# Sprint 23 — Media Preview — Requirements

**Source:** Tron directive 2026-06-29 (Heartspaces room observation), via robbin-po.
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md) — 6-step chain: Requirement → UseCase → Class → Method → Implementation → Test.
**Theme:** extend the room content preview (R21.9 rb-preview-pane / ContentPreviewer) to richer media types — audio playback and embedded YouTube.

---

## Requirements

- [ ] **R23.1 — Audio files play in the preview (HTML5 player)**
  [requirement:uuid:480b40aa-c0ba-40dc-8876-823ebe3af91b]
  > TRON: "MP3 files must play audio in the preview. When an MP3 (or audio file) is dropped/uploaded into a room, the preview pane renders an HTML5 audio player with play/pause/seek/volume. Support mp3/wav/ogg/m4a."
  When an audio file (mp3, wav, ogg, or m4a) is dropped or uploaded into a room, the preview pane renders an HTML5 audio player with play, pause, seek, and volume controls.
  **Acceptance criteria:**
  - [ ] Dropping/uploading an audio file into a room stores it and offers it in the preview
  - [ ] The preview pane renders an HTML5 `<audio controls>` player for the file
  - [ ] The player provides play/pause, seek, and volume controls
  - [ ] Supported types: mp3, wav, ogg, m4a (correct MIME/`<source>` per extension)
  - [ ] Verified live (headless) — an audio file in a room renders the player and is playable
  → [UC-MP.1: preview.renderAudioPlayer](./planning.md#uc-mp1) `[uc:uuid:b9792582-755d-4f12-8476-42f134b6f4ef]` *(placeholder)*

- [ ] **R23.2 — YouTube URLs render as embedded iframe player**
  [requirement:uuid:8f34c3e5-351c-48b3-8f33-fae45ca279b2]
  > TRON: "when a YouTube URL is discovered in the room (dropped as text/uri-list or pasted in chat), automatically render it as an EMBEDDED YouTube iframe player in the preview — extract the video ID from the URL, render as youtube.com/embed/<id>." (Found in the Heartspaces room: youtube.com/watch?v=a-_CuBOu6BA is there as a .url file but shows as text, not embedded.)
  When a YouTube URL is discovered in a room (dropped as text/uri-list or pasted in chat), the preview automatically renders it as an embedded YouTube iframe player by extracting the video ID and rendering `youtube.com/embed/<id>`.
  **Acceptance criteria:**
  - [ ] A YouTube URL discovered in the room (text/uri-list drop or chat paste) is detected
  - [ ] The video ID is extracted from the URL (watch?v=<id>, youtu.be/<id>, and embed/<id> forms)
  - [ ] The preview renders an embedded iframe at `https://www.youtube.com/embed/<id>` (not raw text)
  - [ ] The existing Heartspaces `.url` (youtube.com/watch?v=a-_CuBOu6BA) renders as an embedded player, not text
  - [ ] Verified live (headless) — a YouTube URL in a room renders the embed
  → [UC-MP.2: preview.renderYouTubeEmbed](./planning.md#uc-mp2) `[uc:uuid:d0d09ff8-27e1-4059-88d0-90cc20f05eb2]` *(placeholder)*

---

## Traceability Matrix

| Req | Concise name | Requirement UUID | UC placeholder UUID |
|-----|--------------|------------------|---------------------|
| R23.1 | Audio files play in preview (HTML5) | 480b40aa-c0ba-40dc-8876-823ebe3af91b | b9792582-755d-4f12-8476-42f134b6f4ef |
| R23.2 | YouTube URL → embedded iframe player | 8f34c3e5-351c-48b3-8f33-fae45ca279b2 | d0d09ff8-27e1-4059-88d0-90cc20f05eb2 |

---

*Captured by robbin-req 2026-06-29. Verbatim Tron directive is authoritative; concise names are for display.*
