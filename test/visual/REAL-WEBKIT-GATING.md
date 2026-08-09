# Real-WebKit @390 visual gating (removes Tron as the per-item oracle)

WHY: visual features were held "awaiting Tron @390" because Chromium-emulation ≠ WebKit
(false-greens/negatives on native-widget/font render). That made Tron a required serial gate.
FIX (Tron-authorized 2026-07-31): installed Playwright WebKit + sys-deps so the tester gates
at REAL WebKit @390 = iOS Safari engine. Tron is now a spot-checker BY CHOICE, not a gate.

VERIFIED: webkit.launch() @390 → UA "AppleWebKit/605.1.15 ... Safari/605.1.15" (= iPhone Safari).

RUN (node22 required — playwright needs it):
  /opt/node22/bin/node node_modules/playwright/cli.js test <gate>   # or a launch script
  Browser: WEBKIT (not chromium), viewport {width:390,height:844}.

Install (idempotent, root; one-time, reproducible):
  /opt/node22/bin/node node_modules/playwright/cli.js install-deps webkit
  /opt/node22/bin/node node_modules/playwright/cli.js install webkit
  apt-get install -y libwebpmux3        # the one extra lib install-deps misses

GATE POLICY: a visual AC gated GREEN under real-WebKit @390 (pixel-sample + DET-3x) → flip
QA-Review → Done. Tron reviews only if he wants. No item should sit "awaiting Tron" that the
tester can gate here.
