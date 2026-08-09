# DIAGNOSIS — music-player empty-black-box regression (Tron v0.8.71, Heartspaces mp3)

**Author:** robbin-architect · 2026-08-08. Root cause FIRST, no fix (PO). MEASURED, not inferred.

## ROOT CAUSE (measured): commit `ea7443e87` — "R35.1 INV-2 residuals + (A) file-preview unification (v0.8.50)"
The S23 media-preview (audio `<audio>` player + YouTube embed) still EXISTS in `content-preview.ts:47` (`fillPreviewPane` → `<audio controls src=…>`). But `ea7443e87` changed rb-file-detail from **EAGER** render to **TOGGLE-DRIVEN**, and that is the regression. The diff (rb-file-detail.ts):
- REMOVED the eager call `fillPreviewPane(pane, uuid, mimeType, name, token)` AND its import (`import { guessMimeFromName, fillPreviewPane }` → `import { guessMimeFromName }`).
- Made the pane **`<rb-preview-pane class="cv-preview-content" style="display:none">`** — hidden by default.
- The preview now fills ONLY when the universalActionBar **`preview-file` ('👁 Preview')** action is clicked → `universal-actions.ts:48-55` toggles the pane visible + lazy-fills via the SAME `fillPreviewPane` on first show.

⇒ On selecting the mp3, the audio player NO LONGER auto-renders (the eager render was dropped); the pane is hidden/empty until a manual Preview-click, and in the room/drawer the visible-but-unfilled 75vh `rb-preview-pane` reads as **the large empty black box** he sees. The container (rb-file-detail metadata: File badge/filename/uuid/Parent) renders; the media content does not.

## HYPOTHESES — verified against the PO's leads
- **H1 (R30.21 unregistered element) — RULED OUT.** `rb-preview-pane` IS registered (rb-preview-pane.ts:35-36) and `rb-file-detail` IS registered (:95); `registerUniversalActions` runs on the drawer (rb-detail-drawer.ts:73). Not an unregistered-element bug.
- **H2 (dropped chunk/refactor) — CONFIRMED, this is it.** The `ea7443e87` "unification" refactor dropped the eager media render (import + call removed), replacing S23's auto-play-on-select with a manual toggle whose lazy-fill lands empty in this context.
- **H3 (silent failure = empty box) — COMPOUNDING.** Whether unfilled-by-default or lazy-fill-miss (the toggle reads `data-uuid/data-mime` off the pane — if those attrs aren't set in the room/drawer path, `fillPreviewPane` gets an empty mime → the `audio/` branch is skipped → empty pane), the result is a SILENT empty box, the same fail-loud sin as R40.11's eternal spinner.

## FIX SHAPE (for the expert; PO said fix after)
- **Restore media auto-render:** File MEDIA subtypes (audio/video/image/youtube) render their player on select, not behind a manual toggle (S23 was auto). Either re-add the eager `fillPreviewPane` for media mimes, or make the type-driven default view auto-fill for media types (keep toggle only for large/other files if wanted).
- **FAIL-LOUD:** an unfilled/failed preview shows an explicit state ("preview unavailable: <mime>") — NEVER an empty black box (R40.11's principle).
- If keeping the lazy path: verify rb-file-detail SETS `data-uuid/data-mime/data-name/data-token` on the `cv-preview-content` pane so the toggle's `fillPreviewPane` gets a real mime.

## ★ CONVERGENCE with R40.11 (fix the class ONCE)
Both are "container renders, CONTENT does not": R40.11 = synthetic ref → eternal Loading; here = File(audio) → empty box. The PO's steer is right — **R40.11's ONE generic type-driven default view should own File subtypes (audio/video/image/youtube) too**, so a File(audio) renders its media player BY TYPE (auto), a deploymentRef renders its typed view, and BOTH fail-loud on unresolvable. Fix the "type-driven default view renders real content for the unit's type" class once, not twice.
