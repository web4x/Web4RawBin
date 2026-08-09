# Board Migration Gap Report — R-C7 proveComplete sweep (READ-ONLY, semantic/by-key matcher)

PASS = safe to --apply (0 gaps, 0 needs-review). REFUSE = units MISSING a stable ID (real backfill gap). NEEDS-REVIEW = an id-less row with no exact text match (likely REWORDED — a human confirms, never auto-matched, never a hard gap). FAIL-CLOSED = unresolvable/wrong-ior uuid. Match is BY-KEY (altId/number), so reworded requirements are matched not flagged. Narrative excluded (G5).

## Summary

- PASS: 14 · REFUSE: 18 · NEEDS-REVIEW: 5 · FAIL-CLOSED: 0
- total gaps: 124 · total needs-review: 363

| Sprint | Verdict | gaps | needs-review |
|---|---|---|---|
| sprint-37-consistency-by-construction | PASS | 0 | 0 |
| sprint-35-buttons-to-actions-universal-scenarios | PASS | 0 | 0 |
| sprint-01-rawbin-foundation | REFUSE | 1 | 8 |
| sprint-02-identity-ssh | REFUSE | 6 | 9 |
| sprint-36-unify-traceability-m2-uml-model | PASS | 0 | 0 |
| sprint-03-e2e-hardening | REFUSE | 10 | 4 |
| sprint-04-traceability | REFUSE | 14 | 7 |
| sprint-05-pwa-offline | REFUSE | 7 | 8 |
| sprint-06-web-components | REFUSE | 8 | 7 |
| sprint-07-encrypted-storage | REFUSE | 13 | 16 |
| sprint-08-monaco-editor | REFUSE | 14 | 91 |
| sprint-09-room-identity | REFUSE | 7 | 50 |
| sprint-10-contacts-ui | REFUSE | 1 | 0 |
| sprint-11-traceability | REFUSE | 1 | 0 |
| sprint-12-editor-fixes | PASS | 0 | 0 |
| sprint-13-stability | NEEDS-REVIEW | 0 | 5 |
| sprint-14-legacy-migration | REFUSE | 1 | 0 |
| sprint-15-traceability-browser | REFUSE | 2 | 0 |
| sprint-16-traceability-ux | PASS | 0 | 0 |
| sprint-17-scenario-units | REFUSE | 26 | 0 |
| sprint-18-chain-method-scope | REFUSE | 4 | 65 |
| sprint-19-room-handling | PASS | 0 | 0 |
| sprint-20-radical-forward-planning-traceability-first | PASS | 0 | 0 |
| sprint-21-contact-identity | NEEDS-REVIEW | 0 | 36 |
| sprint-22-traceability-view-fixes | NEEDS-REVIEW | 0 | 5 |
| sprint-23-media-preview | PASS | 0 | 0 |
| sprint-24-traceability-skills | NEEDS-REVIEW | 0 | 1 |
| sprint-25-apple-dnd | NEEDS-REVIEW | 0 | 14 |
| sprint-26-federation | REFUSE | 3 | 0 |
| sprint-27-detail-view-enhancements | REFUSE | 2 | 18 |
| sprint-28-graph-integrity-foundation | PASS | 0 | 0 |
| sprint-29-server-dev-lifecycle | REFUSE | 4 | 19 |
| sprint-30-traceability-improvement | PASS | 0 | 0 |
| sprint-31-server-manager | PASS | 0 | 0 |
| sprint-32-mda-model-driven-code-quality | PASS | 0 | 0 |
| sprint-33-mof-layered-tree | PASS | 0 | 0 |
| sprint-34-mda-tree-refine | PASS | 0 | 0 |

## REFUSE detail (real gaps = missing stable IDs → backfill worklist)

### sprint-01-rawbin-foundation — 1 gap(s)

- `task-2-rawbin-architecture-definition.md` :: id:T83
  _+ 8 needs-review_

### sprint-02-identity-ssh — 6 gap(s)

- `planning.md` :: id:T10
- `planning.md` :: id:T11
- `planning.md` :: id:T12
- `planning.md` :: id:T7
- `planning.md` :: id:T8
- `planning.md` :: id:T9
  _+ 9 needs-review_

### sprint-03-e2e-hardening — 10 gap(s)

- `planning.md` :: id:T13
- `planning.md` :: id:T14
- `planning.md` :: id:T15
- `planning.md` :: id:T16
- `planning.md` :: id:T17
- `planning.md` :: id:T18
- `planning.md` :: id:T19
- `planning.md` :: id:T20
- `planning.md` :: id:T21
- `planning.md` :: id:T22
  _+ 4 needs-review_

### sprint-04-traceability — 14 gap(s)

- `planning.md` :: id:T12
- `planning.md` :: id:T13
- `planning.md` :: id:T17
- `planning.md` :: id:T22
- `planning.md` :: id:T23
- `planning.md` :: id:T24
- `planning.md` :: id:T25
- `planning.md` :: id:T26
- `planning.md` :: id:T27
- `planning.md` :: id:T28
- `planning.md` :: id:T29
- `planning.md` :: id:T30
- `planning.md` :: id:T7
- `planning.md` :: id:T7.0
  _+ 7 needs-review_

### sprint-05-pwa-offline — 7 gap(s)

- `planning.md` :: id:T31
- `planning.md` :: id:T32
- `planning.md` :: id:T33
- `planning.md` :: id:T34
- `planning.md` :: id:T35
- `planning.md` :: id:T36
- `planning.md` :: id:T37
  _+ 8 needs-review_

### sprint-06-web-components — 8 gap(s)

- `planning.md` :: id:T39
- `planning.md` :: id:T40
- `planning.md` :: id:T41
- `planning.md` :: id:T42
- `planning.md` :: id:T43
- `planning.md` :: id:T44
- `planning.md` :: id:T45
- `planning.md` :: id:T46
  _+ 7 needs-review_

### sprint-07-encrypted-storage — 13 gap(s)

- `planning.md` :: id:T47
- `planning.md` :: id:T48
- `planning.md` :: id:T49
- `planning.md` :: id:T50
- `planning.md` :: id:T51
- `planning.md` :: id:T52
- `planning.md` :: id:T53
- `planning.md` :: id:T54
- `planning.md` :: id:T55
- `planning.md` :: id:T56
- `planning.md` :: id:T57
- `planning.md` :: id:T58
- `planning.md` :: id:T59
  _+ 16 needs-review_

### sprint-08-monaco-editor — 14 gap(s)

- `planning.md` :: id:T60
- `planning.md` :: id:T61
- `planning.md` :: id:T62
- `planning.md` :: id:T63
- `planning.md` :: id:T64
- `planning.md` :: id:T65
- `planning.md` :: id:T66
- `planning.md` :: id:T67
- `planning.md` :: id:T68
- `planning.md` :: id:T69
- `planning.md` :: id:T70
- `planning.md` :: id:T71
- `planning.md` :: id:T72
- `planning.md` :: id:T73
  _+ 91 needs-review_

### sprint-09-room-identity — 7 gap(s)

- `planning.md` :: id:T74
- `planning.md` :: id:T75
- `planning.md` :: id:T76
- `planning.md` :: id:T77
- `planning.md` :: id:T78
- `planning.md` :: id:T79
- `planning.md` :: id:T80
  _+ 50 needs-review_

### sprint-10-contacts-ui — 1 gap(s)

- `requirements.md` :: id:T86

### sprint-11-traceability — 1 gap(s)

- `requirements.md` :: id:R11.1

### sprint-14-legacy-migration — 1 gap(s)

- `requirements.md` :: id:R1

### sprint-15-traceability-browser — 2 gap(s)

- `requirements.md` :: id:R2
- `requirements.md` :: id:R3

### sprint-17-scenario-units — 26 gap(s)

- `requirements.md` :: id:R17.17
- `requirements.md` :: id:R17.18
- `requirements.md` :: id:R17.19
- `requirements.md` :: id:R17.20
- `requirements.md` :: id:R17.21
- `requirements.md` :: id:R17.22
- `requirements.md` :: id:R17.23
- `requirements.md` :: id:R17.30
- `requirements.md` :: id:R17.31
- `requirements.md` :: id:R17.32
- `requirements.md` :: id:R17.33
- `requirements.md` :: id:R17.34
- `requirements.md` :: id:R17.35
- `requirements.md` :: id:R17.36
- `requirements.md` :: id:R17.37
- `requirements.md` :: id:R17.38
- `requirements.md` :: id:R17.39
- `requirements.md` :: id:R17.40
- `requirements.md` :: id:R17.41
- `requirements.md` :: id:R17.42
- `requirements.md` :: id:R17.43
- `requirements.md` :: id:R17.44
- `requirements.md` :: id:R17.45
- `requirements.md` :: id:R17.46
- `requirements.md` :: id:R17.47
- `requirements.md` :: id:T142

### sprint-18-chain-method-scope — 4 gap(s)

- `requirements.md` :: id:R18.29
- `requirements.md` :: id:R18.30
- `requirements.md` :: id:R18.31
- `requirements.md` :: id:R18.4
  _+ 65 needs-review_

### sprint-26-federation — 3 gap(s)

- `requirements.md` :: id:R25.5
- `requirements.md` :: id:R25.6
- `requirements.md` :: id:R26

### sprint-27-detail-view-enhancements — 2 gap(s)

- `requirements.md` :: id:R27.5
- `requirements.md` :: id:R30.2
  _+ 18 needs-review_

### sprint-29-server-dev-lifecycle — 4 gap(s)

- `requirements.md` :: id:R24.5
- `requirements.md` :: id:R27.5
- `requirements.md` :: id:R28.1
- `requirements.md` :: id:R29.2
  _+ 19 needs-review_

## NEEDS-REVIEW detail (reworded? human confirms)

### sprint-13-stability — 5

- `requirements.md` :: row:r-a1: avatar must persist across sessions — must not revert 
- `requirements.md` :: row:r-a2: avatar upload must work without exposing key errors to
- `requirements.md` :: row:r-ed1: markdown preview must render hierarchical lists (nest
- `requirements.md` :: row:r-tc1: e2e tests must not flood data/ with orphan users or r
- `requirements.md` :: row:r-v1: version update bar must appear on new version (priorit

### sprint-21-contact-identity — 36

- `requirements.md` :: row:+4915253844085 exists as the first phone unit on tron's woda
- `requirements.md` :: row:a company is minted as an ior:class:company scenario unit wi
- `requirements.md` :: row:a phone is minted as an ior:class:phone scenario unit with i
- `requirements.md` :: row:a phone or email already in the index does not mint a new pr
- `requirements.md` :: row:a profile supports multiple email units
- `requirements.md` :: row:a profile supports multiple phone units
- `requirements.md` :: row:action buttons (open-in-preview, open-in-new-tab) appear at 
- `requirements.md` :: row:adding a company that already exists (by name) reuses the ex
- `requirements.md` :: row:address string is ordered large→small: country city postalco
- `requirements.md` :: row:an address is minted as an ior:class:address scenario unit l
- `requirements.md` :: row:an email is minted as an ior:class:email scenario unit with 
- `requirements.md` :: row:an ln symlink keyed by the normalized phone resolves to the 
- `requirements.md` :: row:background job verifies against openstreetmap and sets a ver
- `requirements.md` :: row:behavior is identical whether the matched key was a phone or
- `requirements.md` :: row:correct code → a new device is attached to the existing prof
- `requirements.md` :: row:dropping a .vcf onto a profile persists the file in the user
- `requirements.md` :: row:input with spaces/dashes/parens normalizes to the canonical 
- `requirements.md` :: row:looking up a profile by phone returns the same profile as it
- `requirements.md` :: row:metadata detail (name, size, type, scenario info) appears be
- `requirements.md` :: row:multiple profiles can reference the same company unit
- `requirements.md` :: row:no second reload is required for the name to appear
- `requirements.md` :: row:on first connect, the lobby shows the actual profile name (n
- `requirements.md` :: row:on verification, links to openstreetmap and google maps are 
- `requirements.md` :: row:order is reversed from the current layout (was: detail top, 
- `requirements.md` :: row:phone normalization yields +countrycode followed by digits o
- `requirements.md` :: row:preview content supports pan + zoom (pinch-zoom on mobile, s
- `requirements.md` :: row:save is immediate and never blocks on verification
- `requirements.md` :: row:the email unit is linked to the profile via the relationship
- `requirements.md` :: row:the phone unit is linked to the profile via the relationship
- `requirements.md` :: row:the preview pane renders below the buttons, sized at 75% of 
- `requirements.md` :: row:the shared company unit is reachable as a first-class node i
- `requirements.md` :: row:the stored .vcf lives in the same user dir as the avatar pho
- `requirements.md` :: row:the user is immediately prompted for the existing profile's 
- `requirements.md` :: row:unverified addresses persist and display without a badge unt
- `requirements.md` :: row:verified headless against the running app (live ux reproduct
- `requirements.md` :: row:wrong/absent code → no device created, no profile merge

### sprint-22-traceability-view-fixes — 5

- `requirements.md` :: row:clicking a png opens it in the same preview/viewer that svg 
- `requirements.md` :: row:verified live (headless) against the running app
- `requirements.md` :: row:verified live (headless) against the running app — the task 
- `requirements.md` :: row:verified live (headless) on both a touch surface and a mouse
- `requirements.md` :: row:verified live (headless) on the /md/ test/visual listing (e.

### sprint-24-traceability-skills — 1

- `requirements.md` :: row:(advance) advance moves the current pin forward only when th

### sprint-25-apple-dnd — 14

- `requirements.md` :: row:(b consolidate-evict) consolidate, after setting redirectto,
- `requirements.md` :: row:(c connect-redirect) a tombstoned connect (redirectto set) r
- `requirements.md` :: row:(c immutable) redirectto is immutable and restart-durable — 
- `requirements.md` :: row:(d idempotent) room.addmember dedups on resolved token — if 
- `requirements.md` :: row:(drop→unit) dropped urls create webitem units, not bare text
- `requirements.md` :: row:(files) log every datatransfer.files entry (name, type, size
- `requirements.md` :: row:(import .url) import from windows .url (ini format) yields w
- `requirements.md` :: row:(import .webloc) import from macos .webloc (plist) yields we
- `requirements.md` :: row:(known→switch) if a key is found, the dialog switches from "
- `requirements.md` :: row:(repair) a one-time gated migration (dry-run + count first, 
- `requirements.md` :: row:(replaces manual) this replaces today's behaviour (mint new 
- `requirements.md` :: row:(types) on every drop, log all datatransfer.types entries.
- `requirements.md` :: row:(unknown→authorize) if neither key is known, onboarding proc
- `requirements.md` :: row:(wrong code) a wrong secret code is rejected explicitly; sti

## PASS (apply-ready)

- sprint-37-consistency-by-construction
- sprint-35-buttons-to-actions-universal-scenarios
- sprint-36-unify-traceability-m2-uml-model
- sprint-12-editor-fixes
- sprint-16-traceability-ux
- sprint-19-room-handling
- sprint-20-radical-forward-planning-traceability-first
- sprint-23-media-preview
- sprint-28-graph-integrity-foundation
- sprint-30-traceability-improvement
- sprint-31-server-manager
- sprint-32-mda-model-driven-code-quality
- sprint-33-mof-layered-tree
- sprint-34-mda-tree-refine
