<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 27.7: WebItem type-aware preview drawer

[task:uuid:b849fda2-b15d-4567-8a73-79d2567ec396]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 27 Planning](./planning.md)
    - Requirement R27.7 `[requirement:uuid:54002f11]`
  - crossRef
    - R22.2 (drawer zoom/pan parity) + R25.x
  - down
    - [UC: webItem.typeAwarePreviewDrawer](./planning.md) `[uc:uuid:d48b4dda-ee20-4af5-9136-d492f4702e1a]`

## Task Description

The WebItem detail drawer previews/routes BY TYPE: http/https show a LIVE iframe preview (server side-proxy on CORS/X-Frame block), pdf renders a pdf embed, mailto/message/tel/calendar show NO preview + a launcher Open card that opens the native app. Previewable vs launcher layouts, action buttons below the handle, zoom/pan + reset-zoom overlay preserved. Type-dispatch by url-scheme/content-type.

## Context

Regression root cause: v0.7.8 mailto-routing-all-webitems. crossRef R22.2 (drawer zoom/pan parity) + R25.x. Type-dispatch (url-scheme/content-type) so a NEW type is add-a-handler, not edit-everywhere.

## Intention

Tron directive. REGRESSION+ENHANCEMENT: v0.7.8 killed the v0.6.56 preview by routing ALL webitems through mailto — restore + generalise to a type-aware drawer.

## Acceptance Criteria

- [x] (preview) An http/https WebItem shows a LIVE preview (iframe/embed of the URL) in the detail drawer.
- [x] (preview) When CORS/X-Frame-Options blocks the iframe, the server SIDE-PROXIES the URL (server fetches it) and the preview renders the server-proxied content - never a dead/blank frame.
- [x] (preview) A pdf WebItem/file renders a pdf preview embed.
- [x] (routing) mailto / message: / tel / calendar show NO preview and a launcher/Open card that opens in the original app; this different handling must NOT kill http/https preview.
- [x] (layout) Previewable items (http/https/pdf) layout order = [handle] -> [action buttons: Preview / NewTab] -> [PREVIEW pane] -> [file details BELOW]; preview-first, details below (reversed from the old details-first order).
- [x] (layout) Non-previewable items use the launcher layout: details + Open below the handle.
- [x] (zoom) Zoom + pan is preserved (R22.2 / R25.x); the RESET-ZOOM control is an OVERLAY button INSIDE the preview pane, NOT in the action-button row.
- [x] (layout) The action buttons (Preview / NewTab / Open) sit immediately below the drawer handle.
- [x] (routing) Routing is BY WebItem type (url-scheme / content-type) via a type-dispatch; adding a NEW scheme can never kill preview for other types (regression-proof, correct-by-construction).
- [x] (security) PRE-fetch SSRF gate: guardUrl (pure socket-free predicate) DENIES non-http/https schemes, cloud-metadata (169.254.169.254/metadata.google.internal/fd00:ec2::254, all encodings), the RESOLVED IP in private/loopback/link-local/unique-local ranges (10/8,172.16/12,192.168/16,127/8,169.254/16,0.0.0.0/8,::1,fc00::/7,fe80::/10), DNS-rebind (check+pin the resolved IP, no 2nd resolution), and re-checks EVERY redirect hop. Gated by 5 adversarial Tests (cloud-metadata / DNS-rebind / redirect-to-internal / non-http-scheme / private+loopback).
- [x] (security) POST-fetch safety: fetchSanitized caps size + timeout, enforces a content-type ALLOWLIST (html/pdf/image only), SANITIZES and NEVER executes the payload, and rate-limits + audits. Gated by >=1 sanitize-never-execute Test (+ size-cap / allowlist-reject / rate-limit). NOTE: the sanitize-never-execute Test must NOT blanket-green (same rule as T26.6 never-execute-foreign-JSON).

## Implementation

SHIPPED v0.7.9 (9d2213b2e type-aware drawer + SSRF-guarded CORS proxy) -> v0.7.10 (474671bf0: architect PDCA fixed 2 exploitable SSRF bypasses). GATED GREEN: 8/8 adversarial + drawer tests DET-3x node22; security chain = 9 tests (5 guardUrl pre-fetch + 4 fetchSanitized post-fetch), never-execute gated. Architect SIGNED OFF. 11 ACs (grew from 9: +2 security — guardUrl SSRF gate + fetchSanitized size/timeout/content-type). 2 UCs: webItem.typeAwarePreviewDrawer d48b4dda + webItem.serverProxyFetch 543ff7aa (SSRF chain, independently traceable). QA Review = Tron QA gate (feature). Regression-proofed: type-dispatch so mailto can't swallow all webitems again.

## Subtasks

None (atomic task).
