# r311 / R31.1 RED — supersede-vs-regression diagnosis (VERDICT: SUPERSEDED, stale gate)

**By:** robbin-architect 2026-08-11, per PO. Framed at the AC SURFACE (does /profile SHOW the owner their feature grants?), measured not inferred.

## (a) Does the owner see feature grants on /profile TODAY? — YES (measured)
- `renderFeatureGrants()` is SERVER-SIDE: `server.ts:1029` (marker `[impl:uuid:f345b8ed]`, Method b4f03947, R31.1), and it is CALLED in the /profile render at `server.ts:3304` (`${renderFeatureGrants()}`).
- It is DATA-DRIVEN: the PROFILE WS msg (`server.ts:3790`) sends `serverManager: ServerManagerGuard.isOwner(profile.token)` + `features: featuresForToken(profile.token)`; renderFeatureGrants renders EVERY `m.features` entry into `#feature-grants` under a "Feature access" title (R31.8 slice-d generalized the R31.1 ServerManager-only boolean; R32.9 data-driven `Feature.launchPage`).
- The owner IS granted: the 3 Feature units all carry Tron's token `c09087ec` in `allowedUsers[]` — MDQ `901e0ece` ✓, ServerManager `16604eee` ✓, FeatureManager `2980b7d9` ✓.
⇒ /profile server-renders the Feature-access section with the owner's granted features. The AC surface is satisfied by construction (owner-VISIBLE pixel = Tron device, but the server path + grants are statically proven).

## (b) Is the client renderFeatureGrants genuinely SUPERSEDED? — YES
- Client `renderFeatureGrants` is GONE from `src/public/ts` (grep empty) — correctly removed.
- The mechanism MOVED: OLD = ProfileEditor CLIENT (`/app?editProfile=1`, `#pe-feature-grants`, `a.profile-grant`, a whoami round-trip) → NEW = server-side (`/profile`, `#feature-grants`, `m.features` data-driven, no whoami). The Impl `f345b8ed` was RE-POINTED off ProfileEditor onto `server.ts` during the S31 move (owner-accept race fix, v0.7.88).
- **r311 is a STALE GATE:** `r311-feature-grants-render-gate.mjs` still tests the OLD client surface — its header says "ProfileEditor.renderFeatureGrants", it navigates `/app?editProfile=1`, waits on `#pe-feature-grants`, reads `a.profile-grant`, and MOCKS whoami→200 (the round-trip the server move KILLED). The Impl moved; the Test's assertions did not. r311 RED = it's pointed at a removed implementation, NOT a broken feature.

## VERDICT = SUPERSEDED (gate-the-AC-surface RETARGET), NOT a regression
`[[gate-the-ac-surface]]`: r311 should gate WHERE the AC lives (the owner-facing /profile view), not the removed client function. RETARGET r311 to:
- goto `/profile` as the owner (sm_session / the profile WS identity, not a whoami mock); assert `#feature-grants` renders the "Feature access" title + the owner's granted features — and since it's now DATA-DRIVEN, assert ALL `m.features` render (Server Manager 🖥️ href=/server-manager, Feature Manager, MDQ), not just Server Manager; non-owner (SystemTester) → `#feature-grants` empty (features filtered).
- Two-key `Test 96d0d227 ↔ Impl f345b8ed` is PRESERVED (the Impl is already at server.ts:1029) — only the Test's SURFACE/assertions retarget; no chain re-mint.
⇒ **T31.1 is DONE at the AC surface; S31's one remaining item is the r311 retarget (a test fix), not implementation work.** Owner-VISIBLE end-to-end stays a Tron device confirm.
