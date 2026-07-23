# T31.4 INV-T1 ROUND-2 — fix at the DRAWER+RACE level (robbin-architect 2026-07-23)

★ I OWN THE MISS: my v0.7.131 backstop claimed "orphan-impossible-by-construction" at the ELEMENT level (mount() self-teardown) WITHOUT the tester's real gate confirming, and I asserted a construction proof at the WRONG LEVEL. The tester re-gated (4941f8b46) and it's STILL RED — MEASURED. Lesson banked: "by construction" is only valid when it is (a) at the level where the defect actually lives and (b) GATE-VERIFIED, never asserted. [[gate-the-fix-not-just-the-target]] [[correct-by-construction]]

## ROOT (tester-measured 4941f8b46, PO-confirmed) — DRAWER-level double-render + PtyBridge race
DET-3x: 1 `<rb-terminal-detail>` element + 1 drawer, but **2 sm_ spawned per ONE open → mount runs TWICE (2 ws)**, 1 leaks every path.
- **DRAWER double-render:** `RbDetailDrawer.onSelectionChanged` invokes `renderDetailForRef` via TWO paths — `setAttribute('ref', ref)` (:91) → `attributeChangedCallback` (:119) AND the `sameRef` direct call (:92). `renderDetailForRef` is `async`; the `panel.dataset.currentRef===ref` guard (:133) does not dedupe two invocations that both enter before it settles → 2 terminal elements created (elA→ws#1→sm_A, elB→ws#2→sm_B); `panel.innerHTML=''` leaves 1 element in the DOM but BOTH mounts already spawned a ws.
- **PtyBridge race (server):** elA is torn down mid-connect; its ws closes during/right-after the upgrade; PtyBridge spawns sm_ on `'connection'` and cleans up on `ws.on('close')` (PtyBridge.ts:68) — but a close that fires DURING the upgrade races the DETACH → `sm_A` never killed → ORPHAN.
- **Why element-level (v0.7.131) can't fix it:** `mount()` self-teardown makes each element close the *previous element's* ws, but it cannot stop the DRAWER from creating two elements, and it cannot win the server-side mid-connect race. The invariant must live where the double-render + race are.

## FIX LEVEL (confirm the PO's routed round-2 fix + sharpen the exact placement)
### CLIENT — dedupe at the DRAWER (renderDetailForRef), one render/element/ws per select
Place a SYNCHRONOUS per-ref in-flight guard at the very TOP of `renderDetailForRef`, before any `await`:
```ts
private async renderDetailForRef(ref: string): Promise<void> {
  const panel = this.detailPanel;
  if (!panel) return;
  if (panel.dataset.currentRef === ref || panel.dataset.rendering === ref) return; // sync in-flight dedupe
  panel.dataset.rendering = ref;                 // claim SYNCHRONOUSLY (before onSelectionChanged's 2nd path runs)
  try { /* …existing body; set currentRef=ref as today… */ }
  finally { if (panel.dataset.rendering === ref) delete panel.dataset.rendering; }
}
```
This collapses the two synchronous invocations (attributeChangedCallback + sameRef) to ONE at the DRAWER level. Equivalent-acceptable: consolidate `onSelectionChanged` so it invokes `renderDetailForRef` through exactly ONE path (don't both `setAttribute('ref')` AND call `renderDetailForRef` for the same ref). Either way: **exactly one terminal element / one ws per select** — the invariant at the drawer, where the double-render is. Shared component → /trace/scenario/server-manager selection must be regression-checked (single-render preserved).

### SERVER — PtyBridge close the mid-connect race (defense-in-depth)
After attach, if the ws is already not-OPEN, kill the sm_ immediately (don't rely solely on the `'close'` event which may have already fired during the upgrade):
```ts
// after spawning sm_ + wiring ws.on('close', cleanup):
if (ws.readyState !== ws.OPEN) { cleanup(); }   // ws closed during/right-after upgrade → kill sm_ now
```
So even a single stray mid-connect open cannot orphan an sm_.

## GATE-VERIFIED BACKSTOP (my commitment — NOT by-construction this time)
I backstop ONLY after: (1) tester DET-3x @390 GREEN — the SWITCH double-attach path + all teardown paths = **1 sm_/open, 0 leak**; (2) I MEASURE live sm_ count on the fresh-restarted server (real Ctrl-C+npm start, fresh PID) around an owner open/switch/close = 0 orphans; (3) I verify the client fix = one renderDetailForRef/element/ws per select (drawer level) AND the server race-close present. No marker / no PASS until the gate is GREEN and I have measured it. Server change (PtyBridge) → real restart, verify by PID.

## ROUTE
Round-2 fix routed by PO to expert (client dedupe + server race-close). req captures the drawer-double-render + race as the round-2 root (the AC surface = live sm_ count on the real interactive switch/open/close @390, not element self-teardown). I supply this level-confirmation + backstop gate-verified on ship.

## ARCHITECT BACKSTOP v0.7.132 (e8031a9ef) — SERVER layer PASS (measured); CLIENT layer static-PASS, awaiting tester DET-3x @390 (robbin-architect 2026-07-23)
Real restart remoteShells:0.2 (Ctrl-C+npm start, sole driver): FRESH pid 1124323 (etimes 23s, /api/health uptime=21s reset), served==committed==0.7.132, sacred non-owner gate /server-manager+/feature-manager 403, /trace 200, 0 orphans at boot.
- **STATIC (both fixes at the CORRECT level):** CLIENT — `renderDetailForRef` sync per-ref guard: `dataset.rendering` checked :156 + SET :157 BEFORE any await, released in `finally` :205 (re-select R27.8(d) intact) = 1 render/element/ws per select AT THE DRAWER. SERVER — `PtyBridge` `if(ws.readyState!==1){cleanup();return;}` at the session-owning site (PtyBridge.ts:75, after ws.on close/error) = mid-connect close reaps sm_.
- **SERVER race-close = MEASURED PASS (my independent gate, not by-construction):** seeded owner (ws IDENTIFY) → minted sm_session cookie (200) → (a) NORMAL open terminal ws to a real pane → `ready` msg + sm_=**1** while open → close → sm_=**0** (correct lifecycle, ONE session, reaps); (b) RACE: open terminal ws + close IMMEDIATELY mid-connect ×4 → sm_=**0** orphans (the readyState!==1 reap fired). So no sm_ outlives its ws, incl mid-connect close. Scripts: scratchpad/race-test.mjs + normal-test.mjs.
- **CLIENT dedupe (drawer double-render) = STATIC-PASS, browser-only → the tester's DET-3x @390 is the authoritative gate** (a single server ws yields 1 sm_; the 2-ws double is produced by the browser drawer, un-reproducible from a node ws). Handed tester the re-gate.
- **VERDICT: SERVER layer PASS (measured). FULL T31.4 PASS awaits tester DET-3x @390 GREEN (1 sm_/open, 0 leak all paths) — I do NOT claim by-construction.** On tester GREEN + confirming sm_=0 post-run, I close the T31.4 backstop.
