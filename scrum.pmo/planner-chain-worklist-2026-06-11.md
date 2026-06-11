# Planner Per-Owner Chain Worklist — path 19→38 (2026-06-11)

**For:** robbin-po (0.0) → routes to architect (0.4) / expert (0.2) / tester (0.6)
**Scoreboard:** 19/159 canonical (det 3×). Shared-impl = 0 (structural miscrediting eliminated — SM milestone). Expert Impl-layer WIRED 201/201 (Method.implementations[] populated); remaining expert work = **source `[impl:uuid:]` markers** (the tool gates on source markers, not just wiring).

## THE FAST PATH: 27 chains are ONE STEP from complete → clears 38 (19+27=46)

### A. EXPERT-marker-only — 16 chains [HIGHEST LEVERAGE]
Test leaf ALREADY present; chain completes the instant expert adds the real `[impl:uuid:<uuid>]` marker in source (unit + wiring already exist). **No tester needed.**
- R-A2 (avatarPersist, impl 340036b4) · R-R1 (keylessUpload, d688f96c) · R-V1 (version bar) · R16.3 (pageNav sticky-top) · **R18.34** · **R18.34.B** (SVG — Tron-device-accepted, just need source marker) · R19.3 · R19.4 · R19.41 · R19.45 · R19.46 · R19.50 · R19.53 · R19.54 · R19.55 · R19.57

### B. TESTER-only — 11 chains [HIGH LEVERAGE]
Impl-marker ALREADY present; chain completes when tester adds `[test:uuid:<full>]` + Test unit + Impl.tests[] wiring. **No expert needed.**
- R12.1 · R15.2 · R15.3 · R15.7 · R17.18 · R19.14 · **R19.22.B** · **R19.23** (finally Impl-grounded c96d458c — just needs its Test) · R19.32 · R19.51 · R19.58

### C. EXPERT-then-TESTER — 107 chains [2 steps]
Both Impl-marker AND Test missing. Expert adds source marker → then tester wires Test. Sequence behind A.

### D. ARCHITECT — 1 chain
- **R19.55.A** — upstream gap (Req.useCases / UC.class / UC.method missing). Architect designs the singular chain.

## Routing summary
| Owner | Immediate (1-step) | Total open | First move |
|-------|-------------------|------------|------------|
| EXPERT | 16 (group A) | 16 + 107 = 123 | Add source `[impl:uuid:]` markers for group A first (Tests already there → instant completions) |
| TESTER | 11 (group B) | 11 + 107 = 123 | Add Tests for group B first (Impl-markers already there → instant completions) |
| ARCHITECT | — | 1 (R19.55.A) | Close the UC/Class/Method gap |

**To 38:** A(16) + B(11) run in PARALLEL (no dependency between them) = +27 → 46, clears the 25% milestone. Then group C (expert markers → tester tests, batched) drives toward full completion.

**Method note:** "Impl wired" (Method.implementations[] populated, done 201/201) ≠ "Impl source-marked" ([impl:uuid:] comment in the .ts file). The tool requires the source marker. Group A/C expert work = add the source comment markers (verbatim full uuid per learning #46 + PO hard rule, never invented suffix).
