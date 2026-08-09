# R31.13 — Deterministic build (architect design, robbin-architect 2026-07-27)

**Origin:** my R31.7 deploy-lag flag (4948e6e49) formalized — req captured (5c34c6721, ior 335cb740). Runs PARALLEL to Tron's R31.12 device check (independent: R31.12=visual, R31.13=build).
**Goal:** same source bytes → BYTE-IDENTICAL bundle hashes + manifest, so a restart on unchanged source = ZERO dist churn → R31.7 INV-V3 tree-clean holds every deploy WITHOUT a churn-commit. Gate = rebuild-twice byte-identical.

## MEASURED root causes (build.mjs + start.mjs)
1. **★ CERTAIN — manifest timestamp.** `build.mjs:69` `const manifest = { version, 'app.js': jsBasename, built: new Date().toISOString() }` → build-manifest.json changes EVERY build regardless of source. This alone breaks byte-identical output. (Confirmed live: committed manifest carries `"built":"2026-07-27T15:51:44.221Z"`.)
2. **Bundle `[hash]` = esbuild content-hash** (`build.mjs:39` `entryNames:'[name]-[hash]'`). esbuild's `[hash]` is DETERMINISTIC for identical input. Input-variance sources: (a) `__BUILD_VERSION__` (`build.mjs:43`, define) = the Config-unit version — STABLE per version; (b) the `//# sourceMappingURL=<name>-<hash>.js.map` comment — sourcemap is ON (`sourcemap:!isProduction`, and `start.mjs:70` runs `node build.mjs` with NO `NODE_ENV=production` → dev build → 9 .map files committed). esbuild sourcemaps are deterministic for same source+cwd, so the `.js` `[hash]` SHOULD be rebuild-stable.
3. **★ STALENESS (the churn I actually hit).** The observed BMUUHGOZ→WENIBRDQ swap was NOT (necessarily) non-determinism — it's that a version bump (edit Config unit → `generateVersion` write-back package.json, build.mjs:23-31) can land WITHOUT a fresh `node build.mjs` + dist commit, so committed dist stays stamped at the PRIOR `__BUILD_VERSION__`; the next restart's rebuild stamps the new version → different content → different hash. i.e. committed dist ≠ the committed version's real build output.

## FIX (weighed the PO's 3 options; recommend esbuild-native content-hash determinism = option a)
| # | Fix | File | Why |
|---|-----|------|-----|
| A (PRIMARY, required) | REMOVE the manifest timestamp — drop `built: new Date().toISOString()` (or set `built: version`, a deterministic value) | build.mjs:69 | kills the CERTAIN per-build churn; manifest byte-identical for same source |
| B (determinism guarantee) | PIN the build MODE so the same source always builds the same bytes: deploys build with a FIXED `NODE_ENV=production` (start.mjs:70) → `sourcemap:!isProduction`=OFF → no `.map`, no `sourceMappingURL` comment → pure-content `.js` `[hash]`, fully deterministic + smaller. (If sourcemaps must stay, keep the mode CONSISTENT so `.map` hashes are stable.) | start.mjs:70 / build.mjs:41 | esbuild's native content-`[hash]` is deterministic ONCE input is fixed — no pinned-hash/rename step needed (rejects PO options b/c as workarounds that fight esbuild) |
| C (process, closes the staleness) | a version bump MUST rebuild+commit dist in the SAME commit — the Config-unit version edit + `node build.mjs` + `git add dist sw.js package.json` are ONE atomic change (or a pre-commit/CI check: committed dist `[hash]` == a fresh rebuild's) | build/deploy process | so committed dist == the committed version's real bundles → no stale-dist divergence on restart |

**Recommendation: A + B + C.** A is mandatory (the certain culprit). B makes esbuild's content-hash byte-stable by fixing the input (option a — native determinism, not a pinned hash or post-rename). C closes the staleness process-gap that produced my observed churn.

## GATE (rebuild-twice byte-identical) — expert runs to CONFIRM which fixes are load-bearing
1. On unchanged source: `node build.mjs` → `git add -A src/public/dist src/public/sw.js && git stash` (or snapshot). `node build.mjs` again → `git diff` the dist+sw.js+manifest = **ZERO diff** (byte-identical). 
2. If bundles already match after A (only the manifest timestamp differed) → B was belt-and-suspenders; if bundle `[hash]`es still differ → B (mode/sourcemap) is load-bearing. Either way A is required.
3. R31.7 INV-V3 acceptance: a restart on unchanged source leaves the deploy-critical tree (server.ts/package.json/sw.js/config-unit + dist) CLEAN with NO churn-commit.

## SCOPE / HANDOFF
- build.mjs + start.mjs only (build config). No app behavior change. NOT on the runtime path → no server-behavior regression; but a wrong sourcemap/mode flip affects debuggability — keep the mode choice explicit.
- Independent of R31.12 (device/visual). Parallel track.
- Hand to the FRESH expert (0.1 mid-rewind via ARON) — the design is self-contained on disk (this doc); a fresh expert picks it up. Expert runs the gate, applies A (+B/C per the gate result), and the R31.7 versionGuardTreeClean (start.mjs) then holds every deploy.

---

## R31.13 CROSS-ENV PIN-FIX (architect design, 2026-07-27) — the REAL completion (within-env clean was necessary NOT sufficient)
**Reconcile (measured):** within-env determinism HOLDS (fresh `node build.mjs` in the deploy env == committed dist, 0 churn; FIX-A drop-timestamp landed v0.7.142). But the tester's ISOLATED-WORKTREE rebuild differs 17/19 = CROSS-ENV nondeterminism. Ruled OUT sourcemap-paths (committed `.map` sources are RELATIVE, 0 absolute). LOCALIZED to TOOLCHAIN: esbuild `^0.28.0` CARET (package.json:46) + the two envs use different node binaries (deploy = node22 `/opt/node22`; tester worktree = vscode-server node) and potentially a different esbuild install (a worktree that `npm install`ed can drift within the caret; only `npm ci` is lock-exact). 17/19 = bundle-level (not the 1-file manifest). [Tester confirming exact node+esbuild delta — fix holds either way.]

### FIX — pin the toolchain so ANY independent rebuild is byte-identical to committed
| # | Fix | File | Why |
|---|-----|------|-----|
| PIN-1 (PRIMARY) | EXACT-pin esbuild: `"esbuild": "0.28.0"` (DROP the `^` caret) | package.json:46 | esbuild output is deterministic PER esbuild version; the caret lets different installs resolve different 0.28.x → different minified bytes. Exact-pin removes the drift. |
| PIN-2 (PRIMARY) | Build with `npm ci` (lock-exact), NEVER `npm install`, before every build/deploy/gate | build.mjs / start.mjs (pre-build) | guarantees node_modules == package-lock so the pinned esbuild is the one that runs — closes the worktree-drift (the tester's env). |
| PIN-3 (belt) | Fix the build NODE to one version (e.g. node22) across deploy + gate; document it | start.mjs (findNode18 currently picks node22|20|18 — a RANGE) | esbuild output is largely node-version-independent (Go binary), so PIN-1+2 should suffice; but a fixed build node removes the last variable + makes the gate reproducible. Confirm via the gate whether node alone moves bytes. |

### GATE (the TRUE cross-env AC — supersedes within-env-clean as the credit bar)
INDEPENDENT rebuild == committed, in a CLEAN room: fresh `git worktree` (or clean checkout) → `npm ci` → `node build.mjs` → `git diff` the committed dist == **ZERO**. Run in ≥2 envs (deploy node22 + the tester's worktree node) → both byte-identical to committed. Only THEN credit R31.13 deploy-hygiene ACs (no-churn / clean-git-status). Within-env-clean (my restart) is necessary but NOT sufficient.

### SCOPE / HANDOFF
- CONFINED: package.json (1 char, drop caret) + build.mjs/start.mjs (`npm ci` gate) — PO-flagged lean-proceed for the fresh/current expert. Folds into R31.13's HELD ACs (req holds them; a sub-AC "independent-rebuild byte-identical across envs" optional). No runtime/behavior change.
- Design on disk for the expert (0.1 mid-rewind — HANDS OFF until SM/ARON confirm rewound; DO NOT dispatch). Served v0.7.142 stays valid (deploy-env reproducible); cross-env pin = the remaining work to credit the ACs.
