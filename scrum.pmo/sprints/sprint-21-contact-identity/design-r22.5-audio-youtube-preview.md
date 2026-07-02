# R22.5 Design — Audio + YouTube Preview Renderers

**Author:** robbin-architect · 2026-06-29 · from Heartspaces room (Tron).
**Single landing point:** `fillPreviewPane()` in `src/public/ts/trace/content-preview.ts` — the DRY mime→content builder now reused by rb-file-detail, RoomView, and rb-detail-view (verified: rb-file-detail.ts:70 delegates to it). Add both branches here; all surfaces inherit them.

## Measured current state (the gap)
`content-preview.ts` is ALREADY marked v0.6.80 / R22.5 (header comment + impl-marker `ca54081e`) but the body implements NEITHER feature — it's stubbed-not-done:
- **No `audio/*` branch** → audio files fall through to the generic `else` → "⬇ Download" link.
- **`.url`/`text/uri-list` branch (line 46) iframes the RAW url** → for a YouTube *watch* URL this renders a blocked frame: `youtube.com/watch` sends `X-Frame-Options: DENY`/`frame-ancestors` and REFUSES to embed. Only `youtube.com/embed/<id>` is embeddable.
- MIME_MAP (line 103) has no audio extensions → `guessMimeFromName` returns '' for .mp3/.wav/.ogg/.m4a.

## Feature 1 — Audio preview (mp3/wav/ogg/m4a)
**MIME_MAP additions:** `.mp3→audio/mpeg, .wav→audio/wav, .ogg→audio/ogg, .m4a→audio/mp4, .aac→audio/aac, .flac→audio/flac`.
**New branch in fillPreviewPane (place BEFORE the generic text/else):**
```ts
} else if (mimeType.startsWith('audio/')) {
  pane.setContent(
    `<audio controls preload="metadata" src="${contentUrl}" style="width:100%;display:block;padding:24px 12px"></audio>`,
    { interactive: true }   // see §pan-zoom — do NOT wrap audio controls in the gesture layer
  );
}
```
- `controls` gives play/scrub/volume; `preload="metadata"` loads duration without the whole file.
- Native `<audio>` covers mp3/wav/ogg/m4a across browsers (m4a = audio/mp4).

## Feature 2 — YouTube auto-embed (text/uri-list with a YouTube URL)
**videoId extractor (pure, shared):**
```ts
function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;   // 11-char id; ignores trailing &t=/&list= etc.
}
```
Validated on Tron's `youtube.com/watch?v=a-_CuBOu6BA` → `a-_CuBOu6BA` (11 chars ✓).
**Enhance the existing `.url`/`text/uri-list` branch** — after extracting `url` from the file content, detect YouTube and rewrite to the embeddable `/embed/` form:
```ts
const url = text.trim().split('\n').filter(l => l.startsWith('http'))[0] || '';
const yt = youTubeId(url);
if (yt) {
  pane.setContent(
    `<iframe src="https://www.youtube.com/embed/${yt}"
       allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
       allowfullscreen
       style="${frameStyle}"></iframe>`,
    { interactive: true }
  );
} else if (url) {
  // existing raw-iframe fallback (note: many sites also block framing — acceptable best-effort)
  pane.setContent(`<iframe src="${esc(url)}" sandbox="allow-same-origin allow-scripts allow-popups" style="${frameStyle}"></iframe>`);
} else {
  pane.setContent(`<pre style="${preStyle}">No URL found</pre>`);
}
```
**Critical correctness notes:**
- MUST use `youtube.com/embed/<id>`, NOT the raw watch URL (watch URL is X-Frame-blocked — the current code's bug).
- NO restrictive `sandbox` on the YouTube iframe — the embed needs scripts; `allow="autoplay; encrypted-media; picture-in-picture; fullscreen"` + `allowfullscreen` is the correct capability grant.
- **Autoplay caveat:** browsers block autoplay-WITH-SOUND without a user gesture. `allow="autoplay"` permits it but it only fires muted or post-gesture. Do NOT force `?autoplay=1` (annoying + usually blocked). If autoplay is desired, append `?autoplay=1&mute=1` — recommend leaving it user-initiated (just the embed).
- Privacy option (optional): `youtube-nocookie.com/embed/<id>` for no-cookie embed.

## Pan/zoom interaction — `interactive` flag on rb-preview-pane.setContent
Audio controls and the YouTube iframe are INTERACTIVE; the RbPanZoom gesture layer would intercept wheel (zoom instead of scrub/scroll) and drags. Static media (img/pdf/text) still want pan/zoom. Design: extend `RbPreviewPane.setContent(html, opts?: { interactive?: boolean })`:
- `interactive:true` → set the content WITHOUT attaching RbPanZoom (or attach disabled); pointer/wheel pass straight to the audio/iframe. Still tears down any prior controller (AC-e4) and resets on file change (AC-e6).
- default (static) → current behavior (attach RbPanZoom).
This keeps pan/zoom for documents and hands full control to media players.

## Traceability / chain
R22.5 (Heartspaces). Needs: requirement unit(s) for "audio preview" + "YouTube embed" (req-eng), UC `preview.renderAudio` + `preview.embedYouTube`, Class `ContentPreviewer` (existing, content-preview.ts), Method `fillPreviewPane` (existing impl-marker ca54081e — extend), + `RbPreviewPane.setContent` interactive option. Tests: (a) audio mime → `<audio controls>` present; (b) .url with watch?v=ID → iframe src = youtube.com/embed/ID (NOT the raw watch URL); (c) youtu.be/ID + shorts/ID + embed/ID all extract the 11-char id; (d) non-YouTube url → raw-iframe fallback; (e) interactive media not wrapped by RbPanZoom (wheel scrolls/scrubs, not zooms).

## Gaps to flag
1. The R22.5 marker + v0.6.80 comment were added to content-preview.ts WITHOUT the implementation (stub) — the body must actually get the two branches.
2. The current `.url` branch is a latent BUG for YouTube (raw watch URL iframe → blocked frame); this design fixes it.
3. `rb-preview-pane.setContent` needs the `interactive` option (small change) or media gets gesture-hijacked.
