# R40.89 qualification — REQUEST-SHAPE iOS defects are desktop-gatable, NOT deferred (architect, 2026-09-06)

PO directive: record this against R40.89 (893e78df, "no real iOS Safari test capability") so the next iOS-shaped defect is not wrongly deferred as untestable. Architect note; **req folds it into the R40.89 unit's ACs** (requirements.md is generated — do not hand-edit).

## The qualification
R40.89's gap — "no real iOS Safari path → iOS-specific ACs can only be code-proof + signature-match, never device-verified-by-us" — **does NOT apply to a defect whose TRIGGER is the REQUEST SHAPE.** Proven this session: Tron's iOS upload failure was NOT an iOS-rendering/device-API bug — it was iOS Safari **quoting the multipart boundary** (`boundary="----X"` / `;charset` param). That is a property of the REQUEST BYTES, not of the device's screen or platform APIs. The tester reproduced it on **desktop** with a node-native raw multipart (r4090: V3 quoted boundary, V4 quoted+charset) and gates it there. **r4090 all-GREEN on the deployed build IS our verification** — we do not, and must not, ask the customer to check it for us.

## The sharpened rule (two classes, not one)
- **(A) Request-shape iOS defects — DESKTOP-REPRODUCIBLE + GATED, NOT deferred.** Any defect triggered by what the iOS client SENDS (header formatting, multipart boundary quoting, field order, encoding, cookie/header shape, body framing) can be reproduced by CONSTRUCTING that request shape on desktop (curl / node raw / a crafted fetch) and gated normally. These get a real GREEN that means what it says. They are NOT the R40.89 gap.
- **(B) Genuinely deferred — only real iOS RENDERING or device APIs.** What still needs a real iOS Safari path: pixel rendering @390, touch/gesture behaviour, PWA/service-worker lifecycle on-device, WebKit-only layout/paint quirks, iOS-only web APIs. THESE remain R40.89's code-proof+signature-only third state until a real iOS path is acquired.

## Why it matters
Two prior misfires this session came from treating iOS as one undifferentiated "we can't test it" bucket: (1) the parser was falsely un-indicted when a Playwright-FormData INSTRUMENT (not real serialization) gave a false size=0; (2) the fix was nearly gated on "Tron device confirm" — making the CUSTOMER the tester. Both dissolve once you split (A) from (B): a request-shape defect is OURS to reproduce and gate on desktop with REAL serialization. The customer is never the tester; our own gate on the deployed build is the verification.

## Handoff
req: add to R40.89 (893e78df) an AC capturing (A) vs (B) — a request-shape iOS defect is desktop-reproducible + must be gated by us (a "defer-as-untestable" on a request-shape trigger => RED, wrong-classification), while (B) render/device-API defects stay the code-proof+signature-only third state. Worked example: the boundary-quoting upload bug (r4090). This narrows R40.89's scope to the genuinely-deferred class and stops request-shape defects from being punted to Tron's device.
