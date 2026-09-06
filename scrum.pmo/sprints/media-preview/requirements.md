<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 23 Requirements — Media Preview

## Requirements

- [ ] **R23.1 — Audio files play in the preview (HTML5 player)**
  [requirement:uuid:480b40aa-c0ba-40dc-8876-823ebe3af91b]
  > TRON: "MP3 files must play audio in the preview. When an MP3 (or audio file) is dropped/uploaded into a room, the preview pane renders an HTML5 audio player with play/pause/seek/volume. Support mp3/wav/ogg/m4a."
  When an audio file (mp3, wav, ogg, or m4a) is dropped or uploaded into a room, the preview pane renders an HTML5 audio player with play, pause, seek, and volume controls.
  **Acceptance criteria:**
  - [ ] **(ingest)** Dropping/uploading an audio file into a room stores it and offers it in the preview.
  - [ ] **(player)** The preview pane renders an HTML5 <audio controls> player for the file.
  - [ ] **(player)** The player provides play/pause, seek, and volume controls.
  - [ ] **(types)** Supported types: mp3, wav, ogg, m4a (correct MIME/<source> per extension).
  - [ ] **(verify)** Verified live (headless): an audio file in a room renders the player and is playable.
  - [ ] **(no-regress)** The audio player still RENDERS in the room-view DETAIL DRAWER (not only a standalone preview pane) and in EVERY context the drawer opens (room / trace / app), gated @390 REAL-DEVICE by PIXEL (a <audio> in the DOM != a visible player) DET-3x -- an empty box FAILS. [Backfilled 2026-08-08: this req shipped then REGRESSED to a blank box (R40.12); AC-5 was HEADLESS and never covered the room-view-drawer render, letting the empty box through. Device-caught-regression = missing AC.]
  -> preview.renderAudio [uc:uuid:b9792582-755d-4f12-8476-42f134b6f4ef]

- [ ] **R23.2 — YouTube URLs render as embedded iframe player**
  [requirement:uuid:8f34c3e5-351c-48b3-8f33-fae45ca279b2]
  > TRON: "when a YouTube URL is discovered in the room (dropped as text/uri-list or pasted in chat), automatically render it as an EMBEDDED YouTube iframe player in the preview - extract the video ID from the URL, render as youtube.com/embed/<id>." (Heartspaces room: youtube.com/watch?v=a-_CuBOu6BA is there as a .url file but shows as text, not embedded.)
  When a YouTube URL is discovered in a room (dropped as text/uri-list or pasted in chat), the preview automatically renders it as an embedded YouTube iframe player by extracting the video ID and rendering youtube.com/embed/<id>.
  **Acceptance criteria:**
  - [ ] **(detect)** A YouTube URL discovered in the room (text/uri-list drop or chat paste) is detected.
  - [ ] **(extract)** The video ID is extracted from the URL (watch?v=<id>, youtu.be/<id>, and embed/<id> forms).
  - [ ] **(embed)** The preview renders an embedded iframe at https://www.youtube.com/embed/<id> (not raw text).
  - [ ] **(repro)** The existing Heartspaces .url (youtube.com/watch?v=a-_CuBOu6BA) renders as an embedded player, not text.
  - [ ] **(verify)** Verified live (headless): a YouTube URL in a room renders the embed.
  -> preview.embedYouTube [uc:uuid:d0d09ff8-27e1-4059-88d0-90cc20f05eb2]

- [ ] **R23.3 — Identity merge cleans up room membership (no ghost members)**
  [requirement:uuid:75853976-72f9-464a-9f23-d35173a8b48e]
  > TRON: "in the heartspaces are 2 marcel donges users. i tried to link accounts but it did not work though my secret number was correct."
  When profiles are merged (Link Account / consolidate, leaving the target tombstoned with redirectTo set), the merge MUST clean up room membership so a tombstoned profile never appears as a ghost member: a room shows exactly ONE canonical member per merged identity. Link Account MUST succeed when the secret code is correct, and the flow MUST NOT create a phantom empty profile.
  **Acceptance criteria:**
  - [ ] **(ghost-members)** After a merge, tombstoned profiles (redirectTo set) are removed/redirected from every room member list - no duplicate ghost member.
  - [ ] **(ghost-members)** A room with merged identities shows exactly ONE canonical member per person (Heartspaces shows one Marcel Donges, not two).
  - [ ] **(link-works)** Link Account / consolidate SUCCEEDS when the entered secret code matches the target's secretCode.
  - [ ] **(link-works)** A correct secret code never yields a silent failure; a wrong code yields an explicit CONSOLIDATE_FAILED 'Wrong secret code'.
  - [ ] **(no-phantom)** The identity/link flow does NOT create a phantom empty/uncommitted profile (e.g. the observed 6a27140d).
  - [ ] **(retroactive)** Existing ghost members from past merges are reconciled (cleanup is retroactive for already-tombstoned profiles in rooms).
  - [ ] **(verify)** Verified live (headless) in a real room: merge 2+ profiles, the room member list collapses to one canonical member.
  -> membership.cleanupOnMerge [uc:uuid:fc7356af-8c3f-4f2c-bdf6-30d2a6b139f9]
