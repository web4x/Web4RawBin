# PREP (measured, NOT a committed fix — architect owns the shape) — live-render gap = ViewBus KEY mismatch

robbin-expert 2026-08-18, for the architect's ruling on the tester's /model finding (raw 099dc2fec: client-2 received the WS frame, drawer did NOT re-render — controls + badge stayed; client-1, the acting tab, also did not update). Prep-only per PO STANDBY; I do not message the frozen architect — PO relays this commit.

## ★ CORRECTION to "the drawer has NO ViewBus/subscribe path"
The path EXISTS — three shared views each subscribe to ViewBus with a `ref` key:
- `rb-object-item.ts:73` — `ViewBus.subscribe(ref, () => refreshLive())` → pulls fresh derived status → badge (R40.10 de27341b4).
- `rb-task-detail.ts:53` — `ViewBus.subscribe(ref, () => this.render())` → detail body.
- `rb-detail-drawer.ts:469` — `ViewBus.subscribe(ref, () => universalActionBar(...))` → action-bar controls (R40.45 "controls-are-a-surface").
So it is not a MISSING subscription — it is an INERT one (L5 existence≠connection, at the ViewBus-key level).

## ★ ROOT (measured): notify-key ≠ subscribe-key
- **NOTIFY keys:** live-bridge.ts:14 → `ViewBus.notify(`${t}:${msg.uuid}`)` where `t = msg.ior.split(':')[2].toLowerCase()` (e.g. `task`) and `msg.uuid` = the FULL uuid from the server unit-changed frame ⇒ `task:<full-uuid>`. The acting tab's LOCAL emit (universal-actions, AMEND-1 TAB-A) uses `task:${uuid}` too.
- **SUBSCRIBE keys:** each view subscribes with the RAW shown `ref` it was handed (drawer `_shownRef`, detail `ref` attr, object-item `ref` attr) — NOT a resolved/canonical `${type}:${uuid}`.
- **ViewBus** (ViewBus.ts:17/32) matches subscribe(ref) ↔ notify(ref) by EXACT STRING. So if the raw shown ref ≠ `task:<full-uuid>`, NO listener fires → no re-render. ★ The acting tab (client-1) NOT updating despite its own local notify = transport is exonerated; the keys simply don't match.
- The drawer already RESOLVES the ref: `r = await resolveRefUnit(ref)` gives `r.uuid` (full) + `r.type` — but it subscribes on raw `ref`, not on `${r.type}:${r.uuid}`. That resolved key is exactly the notify key.

## Scope (architect to rule): drawer-wide code, surface-dependent SYMPTOM
The subscriptions are in SHARED components (drawer/detail/object-item), so the CODE is drawer-wide. The SYMPTOM is surface-dependent: it fails wherever the surface's ref form ≠ `${type}:${full-uuid}` (measured failing on /model; /trace may pass if its tree emits `task:<full-uuid>`). Worth the tester confirming /trace too, to bound whether it's /model-specific or every surface whose ref form differs.

## Candidate fix directions (the architect OWNS the choice — listed only so I move fast)
1. **Canonicalize the subscribe key** to the RESOLVED `${r.type}:${r.uuid}` (drawer already has r; object-item/detail resolve or are handed it) so subscribe == notify by construction. Single canonical key = the by-construction close.
2. **ViewBus matches on the uuid portion** (prefix-insensitive) — smaller blast radius but weaker invariant (two keys, reconciled at match-time).
3. **Notify also on the shown-ref form** — rejected shape (a 2nd notify key = the drift class).
Recommend #1 (one canonical key) but NOT committing — architect rules by-design-vs-gap + the shape.

## When it rules
Build the ruled shape, version-bump via SOURCE config unit, boot-check, served==committed self-verified, then the tester re-runs the two-client proof. Fix-on-demand; I hold until the ruling.
