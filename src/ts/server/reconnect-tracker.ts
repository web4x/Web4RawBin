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
