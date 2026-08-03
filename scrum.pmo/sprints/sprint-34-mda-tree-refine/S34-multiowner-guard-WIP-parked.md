# PARKED WIP — ServerManagerGuard multi-owner allow-list (robbin-architect 2026-08-03)

**Why parked:** this was LOOSE UNCOMMITTED WIP in the working tree during the S34 deploy prep. It touches the **sacred owner-gate** (ServerManagerGuard.ts) and is a **separate Tron-item** (linked-accounts / multi-owner allow-list, from earlier ~2026-07-30) — NOT part of S34. Per PO (2026-08-03): do NOT ship it loose with S34. Captured here (recoverable) + `git stash`ed out of the S34 deploy so the tree is S34-only clean.

**Whose / what:** a Tron-authorized ADDITIVE multi-owner change — `OWNER_TOKEN` (single literal) → `OWNER_TOKENS[2]` array, adding `c09087ec-b6b8-44d2-9bbe-8a2b0e2230b6` while KEEPING the original owner `41ad88c4-…`. Adds a constant-time `isOwnerToken(token)` membership helper (timing-safe scan over all tokens, does not leak which matched); `assertOwner` / `isOwner` / `seedOwnerInto` all route through it. INV-G2 preserved (tokens still in EXACTLY ONE module location — the array).

**Recovery:** `git stash list` → the entry pathspec'd to `src/ts/server/ServerManagerGuard.ts` (stashed 2026-08-03). Full diff below (apply if the stash is lost).

**MUST land as its OWN change (not with S34):**
- Its own commit + chain (owner allow-list requirement/UC/Method).
- **Architect backstop (INV-G intact):** non-owner still → 403 on every gated route + ws upgrade (INV-G1); BOTH owner tokens accepted (owner-200 for each); constant-time membership (no timing leak, INV-G2 single-location holds); INV-G3 ws-upgrade unchanged.
- Real-restart + served-verify (server change → BOOT_VERSION re-stamp).

## Full diff (parked)
```diff
--- a/src/ts/server/ServerManagerGuard.ts
+++ b/src/ts/server/ServerManagerGuard.ts
@@ class ServerManagerGuard @@
-  // INV-G2: the OWNER_TOKEN literal appears in EXACTLY ONE module location — here.
-  private static readonly OWNER_TOKEN = '41ad88c4-4dee-49ac-afcb-8a2026657b2d';
+  // INV-G2: the owner tokens are defined in EXACTLY ONE module location — this array, here.
+  // Multi-owner allow-list. Tron-authorized additive add of c09087ec (2026-07-30) — KEEPS the original owner.
+  private static readonly OWNER_TOKENS = [
+    '41ad88c4-4dee-49ac-afcb-8a2026657b2d',
+    'c09087ec-b6b8-44d2-9bbe-8a2b0e2230b6',
+  ];
+  // Constant-time owner membership: true iff token equals ANY owner token (scans every entry; timing does not leak which).
+  private static isOwnerToken(token: string): boolean {
+    const a = Buffer.from(token);
+    let match = false;
+    for (const owner of ServerManagerGuard.OWNER_TOKENS) {
+      const b = Buffer.from(owner);
+      if (a.length === b.length && crypto.timingSafeEqual(a, b)) match = true;
+    }
+    return match;
+  }
@@ assertOwner @@
-    const a = Buffer.from(token), b = Buffer.from(ServerManagerGuard.OWNER_TOKEN);
-    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false };
+    if (!ServerManagerGuard.isOwnerToken(token)) return { ok: false };
@@ isOwner @@
-    const a = Buffer.from(token), b = Buffer.from(ServerManagerGuard.OWNER_TOKEN);
-    return a.length === b.length && crypto.timingSafeEqual(a, b);
+    return ServerManagerGuard.isOwnerToken(token);
@@ seedOwnerInto @@
-    if (!allowedUsers.includes(ServerManagerGuard.OWNER_TOKEN)) allowedUsers.push(ServerManagerGuard.OWNER_TOKEN);
+    for (const owner of ServerManagerGuard.OWNER_TOKENS) {
+      if (!allowedUsers.includes(owner)) allowedUsers.push(owner);
+    }
```
