// R1 VISIBILITY (PO ruling 2026-09-29): the lobby flap-fix removed the reconnect-storm's ONLY visible symptom, so
// without a signal the storm continues INVISIBLY. This is that signal — a per-token reconnect-rate tracker + a
// reasoned storm threshold. PURE (no fs/net/DOM) → directly testable; the server's ws.on('close') records each close
// per token and ALARMS when the per-minute rate exceeds a human-plausible bound. The BITE induces a close-loop → the
// counter climbs + isStorm fires; remove the threshold/counter → it goes invisible (RED-on-removal proves it load-bearing).

// >5 closes/min for one token = more than a handful a minute is NOT a human reconnecting — a reasoned bound, not a magic constant.
export const RECONNECT_ALARM_PER_MIN = 5;

export class ReconnectTracker {
  private windows = new Map<string, number[]>();

  // Record a close for `token` at `now` (ms); returns the count within the trailing 60s window = the per-token rate/min.
  record(token: string, now: number = Date.now()): number {
    if (!token) return 0;
    const w = (this.windows.get(token) || []).filter(t => now - t < 60_000);
    w.push(now);
    this.windows.set(token, w);
    return w.length;
  }

  // Storm iff the per-minute rate exceeds the reasoned bound.
  isStorm(ratePerMin: number): boolean {
    return ratePerMin > RECONNECT_ALARM_PER_MIN;
  }
}

// STORM AMPLIFIER FIX (oopPO rank 2, spec cdf69c6be): the client's FIXED 2s reconnect retry (reset on EVERY connect)
// AMPLIFIES a flap — every client hammers the server at the same 2s cadence and a bare connect (that immediately
// closes again) resets nothing to slow down. Fix = BOUNDED EXPONENTIAL BACKOFF + JITTER, and reset the attempt counter
// ONLY after a connection stays open a STABLE period (never on bare connect). PURE + deterministic-given-`rand` so the
// failable gate can assert it GROWS (not fixed) + is BOUNDED + JITTERED; the inline client mirrors this formula and the
// gate asserts the served script no longer uses a fixed setTimeout(connect,2000).
export const RECONNECT_BACKOFF_BASE_MS = 1000;
export const RECONNECT_BACKOFF_MAX_MS = 30_000;   // bound: a reconnect never waits longer than 30s
export const RECONNECT_STABLE_RESET_MS = 30_000;  // reset attempt→0 ONLY after the connection has been open this long (never on bare connect)

export function reconnectBackoffDelay(attempt: number, rand: number = Math.random()): number {
  const cap = Math.min(RECONNECT_BACKOFF_BASE_MS * Math.pow(2, Math.max(0, attempt)), RECONNECT_BACKOFF_MAX_MS);
  return Math.round(cap / 2 + rand * (cap / 2)); // [cap/2, cap] — jittered (no thundering herd), never a FIXED interval, never 0
}
