# Residual public credentials — the 254/116 gap MEASURED (architect, 2026-08-12)

PO class-closer: does path-unify (116) leave the majority of published credentials still authenticating? MEASURED (salt-matched sha256 membership vs revoked-token-hashes.json; counts only, no values).

## Three counts (distinct raw credential tokens in tracked units)
- **Distinct raw tokens: 223** (the "254" was field-OCCURRENCES with duplicates; distinct = 223).
- **IN the 116 revoked set: 116** (the whole revoked set maps to tracked tokens).
- **NOT in the 116: 107** (the residual).
  - **79 back a live Device/Profile IDENTITY** (all enrolled/seen/keyed) → can present at IDENTIFY and authenticate TODAY.
  - **28 only in non-identity artifacts** (Room/File/WebItem uploaderToken / allowedUsers).

## What the residual IS
- **79 = the enrolled keypair set (Tron + the `devicePublicKey`-79 devices).** Deliberately excluded from the 116 (blunt revocation would lock out real users) → remediation is secure device-key-gated ROTATION, not revocation. ★ BUT their raw tokens are PUBLIC (repo public + pushed) and STILL AUTHENTICATE. So they are LIVE PUBLIC CREDENTIALS backing real identities — URGENT, not cleanup. Tron's owner token (RCE) is in this set (highest value); the other 78 = impersonation of real users (their rooms/data), not host RCE. **Path-unify(116) does NOT touch them.**
- **28 = non-identity artifacts** — File/WebItem `uploaderToken` (forge-authz already BLUNTED by d38375098) + Room/allowedUsers. Lower urgency (no enrolled identity, forge neutralised) but still published → burned.

## The reframe (agreed, load-bearing): all 223 are BURNED
Git history retains what was published; the repo has been public. **Re-writing a unit does not un-publish a credential** — the sid: chokepoint + migration stop NEW/FUTURE exposure but cannot un-ring the bell for the 223 already pushed. So the real remediation is **INVALIDATION (revoke/rotate all 223)**, with the chokepoint ensuring it never recurs — NOT a migration that makes units look clean while the published values stay valid. Design every step on "all 223 compromised."

## Remediation on the burned assumption (sequence unchanged; 79 is URGENT not cleanup)
1. **116 dormant → auth-invalidate** (path-unify, in flight) — blunt revoke OK (dormant).
2. **79 enrolled keypair → secure device-key-gated ROTATION** (my held kill-step, incl Tron) — the residual is now proven URGENT (79 live public creds), so B1 must GENERALISE from "rotate Tron's owner token" to "rotate the whole enrolled-79 set", each prove-before-kill per device (owner/Tron first as highest-value + RCE). This is the big residual the 116 leaves open.
3. **28 artifacts → invalidate/sid-migrate** — forge already blunted; rotate/retire for completeness (burned).
4. **Chokepoint (put refuses bare-uuid in credential fields)** → prevents the 224th. Recurrence-prevention, NOT the remediation itself.
5. **repo-private + history-scrub (Tron)** → the only thing that reduces the published-forever exposure; until then every one of the 223 stays publicly readable even after it's dead.

## Bottom line
Path-unify would close 116 and leave **79 live publicly-readable identity credentials still authenticating** (incl Tron's RCE token). That is the majority-of-value residual and it is URGENT. Invalidation of all 223 (revoke 116 + rotate 79 + retire 28) is the remediation; the chokepoint + sid keep it from recurring; only repo-private+history-scrub addresses the already-published copies.
