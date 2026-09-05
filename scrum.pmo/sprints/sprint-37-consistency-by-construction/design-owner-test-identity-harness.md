# Owner-test-identity harness (verify owner-gated surfaces without Tron) — SPEC

**Author:** robbin-architect 2026-09-05. Per LAW-10 (Tron is the customer, not the tester): the ROOM add-folder path is MEMBER-gated (team-verifiable now, no owner needed). The genuinely OWNER-gated surface — the `/model` server-manager path (`requireOwnerHttp`/`assertOwner`/`sm_session` cookie, whoami/tree/page/terminal) — is the real remaining harness gap. This spec lets the TESTER verify it without Tron and without the prod owner. PO escalates as a gap-with-a-fix. Design-only.

## Goal
The tester drives the REAL owner-gated `/model` ops as a real, challenge-authenticated owner, in ISOLATED scratch, so verification is complete BEFORE Tron sees anything. Never the prod owner (05e58f81), never prod, never Tron.

## What the tester needs
1. A **scratch TEST-OWNER identity** (a scratch owner profile with a known secret-code) + an **enrolled TEST DEVICE keypair the tester holds** — created in an isolated `DATA_DIR`-injected environment (R40.31), separate from prod's 05e58f81.
2. The **real challenge-auth flow**, driven by the tester: server issues a challenge → the tester SIGNS it with the test device key (`verifyChallenge`, the same gate the real owner passes) → server grants the owner session (`sm_session` cookie). Then the tester exercises owner-gated ops as a real owner.

## The one change that may be required (measure first, per the lesson)
If owner resolution is hardcoded to the prod owner only (05e58f81 / a single OWNER_TOKEN), it must be **generalized to accept an INJECTED test-owner in the scratch env** — an env-configurable owner identity + enrolled test device — so the test-owner authenticates the SAME way the real owner does. Constraints:
- **Test-only injection, isolated:** only active under the scratch `DATA_DIR`/test env; prod's owner path (OWNER_TOKEN-secret, 05e58f81, enrolled devices) is UNTOUCHED. Never a second prod owner; never weakens the gate.
- **Same auth shape:** the test-owner passes the SAME `verifyChallenge` (enrolled-device signed challenge), so the harness tests the REAL gate, not a bypass. A public-uuid / no-challenge attempt still 403s (the reject-direction gate the tester also asserts).
- MEASURE the current owner-resolver before assuming a change is needed — it may already accept an injected identity (don't repeat the unverified-premise mistake).

## Assertions the harness runs (both directions)
- test-owner challenge-authed → owner access (whoami 200, /tree, /server-manager page renders, terminal attaches) @390, isolated scratch.
- non-owner / public-uuid / no-challenge → 403 on every owner-gated route + ws (INV-G reject-direction).
- Isolation: scratch DATA_DIR + scratch owner + scratch room; cleanup on failure; prod owner + real rooms never touched.

## Result
The `/model` owner-path converts from "Tron verifies in-room" to "team verifies before Tron." Combined with the member-gated room add-folder harness, the whole user surface is team-verifiable without ever asking the customer to test. I backstop the owner-resolver change (test-only/isolated/prod-untouched/same-gate) when it lands.
