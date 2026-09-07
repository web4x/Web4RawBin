<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.44: Add a repository by clone URL + checkout location

[task:uuid:06623fea-ad42-4635-8b7e-bef5f216462f]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:3c9f69c1-8bee-4309-9e30-df61cea34de3]`
  - shared-enabler
    - Dynamic RepoRegistry (mutable/persisted) — supersedes R30.40 static ROOTS; shared across R30.42-45
  - ratified
    - Tron RATIFIED DESIGN + SECURITY (D1-D4 safe options + §9, 2026-07-19) — un-gated, build queued after R30.46
  - down
    - [UC](./planning.md) `[uc:uuid:eb0902d5-b5f8-4c45-b27a-c89287e89a64]`

## Task Description

The add dialog accepts a GIT CLONE URL + a CHECKOUT LOCATION (server path); clones there, registers into the dynamic registry, surfaces clone progress/failure (success→usable; failure→clear error, no half-registered repo). ⚠ SECURITY: arbitrary clone URL + write location is the attack surface.

## Context

Covers R30.44 (3c9f69c1) -> UC eb0902d5 -> Class RbDiffEditor 18165081 + RepoRegistry + server /api. Dynamic-registry SHARED enabler (RepoRegistry mutable/persisted — supersedes R30.40's static ROOTS mechanism; tracked under R30.42-45, not a separate observable). ★ HARD GATE: Tron ratifies the architect DESIGN + SECURITY decisions BEFORE any build — task stays DESIGN-stage (refinement), NO implementation until ratified. ⚠ SECURITY-sensitive (server-local-path + clone-url = path-traversal / arbitrary-clone attack surface — PO taking security decisions to Tron). ⚠ V1 BACKLOG — clone-by-URL deferred (arbitrary-clone surface); re-activate with D-guards before exposed/multi-user deploy.

## Intention

S30 diff/merge editor — R30.42-45 repo add/manage feature (Tron): register/manage repos dynamically (add by path, add by clone, manage worktrees) instead of a static ROOTS list.

## Acceptance Criteria

- [ ] **(add)** The dialog accepts a GIT CLONE URL and a CHECKOUT LOCATION (server path); it clones the repo to that location.
- [ ] **(add)** After a successful clone, the repo is registered in the dynamic registry and APPEARS in the selector.
- [ ] **(add)** Clone progress/failure is surfaced (success -> repo usable; failure -> clear error, nothing half-registered).
- [ ] **(security)** RATIFIED D1: the clone CHECKOUT LOCATION, after realpath, MUST be within the HOME subtree OR REPO_ALLOW; a location outside those bounds is REJECTED before cloning.
- [ ] **(security)** RATIFIED D2 (architect §9 Guard-2, built GitApi.assertAllowedUrl v0.7.67): The clone URL is validated by GitApi.assertAllowedUrl using the WHATWG URL parser (new URL(); NEVER legacy url.parse - its authority split is @-confusion-prone). ACCEPTED iff ALL hold: (a) scheme in {https, ssh} only (reject http/file/git/ext); (b) NO password component; (c) username is EMPTY (anonymous https) OR exactly "git" (ssh) - any other username rejected; (d) hostname EXACTLY matches an entry in HOST_ALLOW {github.com, <TEAM_GIT_HOST>}. Otherwise -> 400. The clone subprocess additionally runs env GIT_ALLOW_PROTOCOL=https:ssh + -c protocol.file.allow=never (defense-in-depth vs redirect/submodule escape). Exact-host is the PRIMARY @-confusion/SSRF defense: WHATWG sets host = substring after the LAST @, so credential-confusion forms (e.g. https://github.com@evil.com) resolve host=evil.com and are rejected.
- [ ] **(security)** RATIFIED D4: cloning requires the admin-key (all writes admin-key-gated).
- [ ] **(security)** RATIFIED D4: registration is an admin-key-gated write; a failed clone leaves NOTHING half-registered (atomic).
- [ ] **(security)** RATIFIED D2 invariant (must-hold, mirror of the R30.39 over-reject bug): EMPTY username MUST remain ALLOWED - the rule is "reject if username && username!==git", NOT "require username===git" (else it re-breaks anonymous https clones). An anonymous https URL (no username) is ACCEPTED.
- [ ] **(security)** RATIFIED D2 invariant (must-hold): the URL parser MUST be WHATWG new URL() (never legacy url.parse) - with both invariants held there is NO residual SSRF hole.
- [ ] **(gate)** GATE (DET-3x + Tron visual): clone a URL to a location -> repo appears + opens a diff; client-facing -> version-bump.

## Implementation

V1 BACKLOG — DEFERRED, NOT CANCELLED (architect §10 + PO 2026-07-19). UC5 clone-by-URL is the arbitrary-clone attack surface → EXCLUDED from V1. Re-activates POST-V1 WITH the D1/D2/D4 clone guards + multi-user auth hardening, BEFORE any exposed/multi-user deploy. Design was ratified (Tron D1-D4 + §9); the BUILD is deferred. See backlog BH-3 (deferred-risk security).

## Subtasks

None (atomic task, design-stage).
