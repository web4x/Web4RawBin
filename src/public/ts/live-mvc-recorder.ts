/**
 * fact-1 live-MVC FLIGHT RECORDER (PO-ruled ACTIVE on deploy — passive, behaviour-neutral, no opt-in).
 *
 * WHY: Tron's acting iOS device — after make-current the pin updates only after a RELOAD. Not headless-reproducible.
 * A reload heals it → points at a client-side subscription that silently died. This passively records, during his
 * ORDINARY use, the seconds before he reloads, so ONE recording discriminates: stale-subscription vs iOS ws/render
 * vs suspended-socket. His fix-RELOAD is the capture trigger (sendBeacon on pagehide). Zero test work from him.
 *
 * SCOPING (PO condition 1 doubles as the scope): the recorder installs on every client, but the beacon lands on an
 * OWNER-GATED endpoint (/api/diag/live-mvc) — so only the OWNER's device (Tron's) recordings persist; every
 * non-owner beacon is refused server-side and dropped fail-silently. No fleet write flood, no per-device special-case.
 *
 * DISCRIMINATION (from ONE recording):
 *   frame present · listenerCount==0            → STALE/DEAD SUBSCRIPTION (reload re-subscribes → heals) ← lead hyp
 *   frame present · listenerCount>0 · no change → iOS RENDER (re-render fired, DOM didn't reflect)
 *   no frame near action · last socket=down     → iOS SUSPENDED THE SOCKET (backgrounded tab)
 *   frame present · render threw                → re-render EXCEPTION
 *
 * CONSTRAINTS (PO): passive/behaviour-neutral · bounded ring buffer · no PII (assertable) · fail-silent · dormant.
 * Hooks the EXPORTED ViewBus singleton + the window client — ZERO edits to RawBinClient/ViewBus seams; when NOT
 * opted-in nothing installs (truly dormant). Verified by test/visual/r4061-live-mvc-recorder-gate.mjs.
 */
import { ViewBus } from './trace/ViewBus.js';

const ENDPOINT = '/api/diag/live-mvc';
const RING_CAP = 200; // bounded — oldest dropped
const REF_MAX = 80;   // a type:uuid key is ~45 chars; cap defensively

/** The ONLY event field names that ever leave the device (assertable no-PII whitelist). */
export const RECORD_KEYS = ['k', 't', 'ref', 'conn', 'listeners', 'threw', 'state'] as const;
export type RecEvent = { k: 'frame' | 'render' | 'socket' | 'sub' | 'unsub'; t: number; ref?: string; conn?: boolean; listeners?: number; threw?: boolean; state?: string };

/**
 * Reduce a ViewBus ref to a technical key ONLY — lowercased `type:uuid` (or a bare token like `graph`).
 * Strips a federated `@host`, drops any char outside [a-z0-9:_-], caps length. A ref CANNOT carry free text/PII.
 * (Pure — the gate asserts every produced ref matches /^[a-z0-9_-]+(:[a-z0-9_-]+)?$/.)
 */
export function sanitizeRef(ref: unknown): string {
  const s = String(ref ?? '').split('@')[0].toLowerCase().replace(/[^a-z0-9:_-]/g, '');
  const i = s.indexOf(':');
  const out = (i < 0 ? s : `${s.slice(0, i)}:${s.slice(i + 1).replace(/:/g, '')}`).slice(0, REF_MAX); // at most one colon (type:uuid)
  // Self-validating: a degenerate result (empty, or an empty type before ':' e.g. a non-ascii type stripped away)
  // can NEVER leave as a malformed key — it collapses to the neutral 'graph' token. This is the assertable no-PII guarantee.
  return /^[a-z0-9_-]+(:[a-z0-9_-]+)?$/.test(out) ? out : 'graph';
}

/** A bounded ring buffer (pure, gate-testable). */
export function makeRing(cap: number = RING_CAP) {
  const buf: RecEvent[] = [];
  return {
    push(e: RecEvent) { buf.push(e); if (buf.length > cap) buf.splice(0, buf.length - cap); },
    get length() { return buf.length; },
    snapshot(): RecEvent[] { return buf.slice(); },
  };
}

/**
 * Install the recorder (ACTIVE — PO-ruled, no opt-in). Wraps ViewBus.notify (frame+listenerCount+render.threw),
 * subscribes to socket lifecycle, flushes via beacon on pagehide. Every path is try/caught → NEVER affects his page.
 * Idempotent: a second call is a no-op (guards against double-wrapping if bootstrap runs twice).
 */
let _installed = false;
export function installLiveMvcRecorder(): void {
  try {
    if (_installed) return; // idempotent — never double-wrap notify
    _installed = true;
    const ring = makeRing(RING_CAP);
    const client = (window as unknown as { __rawbinClient?: { connected?: boolean; on?: (t: string, h: (m: unknown) => void) => void } }).__rawbinClient;
    const conn = () => { try { return client?.connected === true; } catch { return undefined; } };

    // frame arrival + subscription liveness — wrap the EXPORTED singleton; always call through (fail-silent).
    const origNotify = ViewBus.notify.bind(ViewBus);
    (ViewBus as unknown as { notify: (ref: string, payload?: unknown) => void }).notify = (ref: string, payload?: unknown) => {
      let threw = false;
      try { ring.push({ k: 'frame', t: Date.now(), ref: sanitizeRef(ref), conn: conn(), listeners: ViewBus.count(ref) }); } catch { /* recording must never break notify */ }
      try { origNotify(ref, payload); } catch (e) { threw = true; throw e; } // preserve original behaviour EXACTLY (incl throws)
      finally { try { ring.push({ k: 'render', t: Date.now(), ref: sanitizeRef(ref), threw }); } catch { /* silent */ } }
    };

    // socket lifecycle (best-effort; degrades silently if the client/on() isn't present)
    try {
      for (const [evt, state] of [['online', 'online'], ['offline', 'offline'], ['disconnected', 'down'], ['reconnecting', 'reconnecting'], ['reconnected', 'reconnected']] as const) {
        client?.on?.(evt, () => { try { ring.push({ k: 'socket', t: Date.now(), state }); } catch { /* silent */ } });
      }
    } catch { /* no client / no on() → frame+listeners discriminator still works alone */ }

    // flush: his fix-RELOAD (pagehide) or a background (visibilitychange) ships the buffer. Fail-silent beacon.
    const flush = () => {
      try {
        if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
        const events = ring.snapshot();
        if (!events.length) return;
        const body = JSON.stringify({ v: 1, at: Date.now(), events }); // technical-only; no content, no token, no PII
        navigator.sendBeacon(ENDPOINT, body);
      } catch { /* a diagnostic must never degrade his page */ }
    };
    try {
      window.addEventListener('pagehide', flush);
      document.addEventListener('visibilitychange', () => { try { if (document.visibilityState === 'hidden') flush(); } catch { /* silent */ } });
    } catch { /* silent */ }
  } catch { /* installation must never throw into the shared bootstrap */ }
}
