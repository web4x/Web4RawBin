// T37.20 DEFECT-2 — MimeType: the Factory Method (GoF) + self-registering Registry (SOLID Open/Closed). Replaces the
// `mimeType === 'text/uri-list' ? WebItem : File` server ternary and the client `file.type.startsWith('image/'|…)` if-chain.
// Each natural class registers its own mime lens here (self-registration); MimeType.from(mimeType, name) returns the
// natural-class descriptor. ★ Open/Closed: adding a 6th natural class = ONE register() call below (or in its own module),
// ZERO edits to any central switch. Shared by server unit-receive AND client dispatch (ONE registry, one contract).
export interface NaturalClass { ior: string; kind: string; }

type Matcher = (mime: string, name: string) => boolean;
const registry: Array<{ match: Matcher; nat: NaturalClass }> = [];
let fallback: NaturalClass = { ior: 'ior:class:File', kind: 'file' }; // File = the fallback registrant (*/*), NOT a hardcoded else

export const MimeType = {
  /** A natural class self-registers its mime lens. Order = registration order; first match wins. */
  register(match: Matcher, nat: NaturalClass): void { registry.push({ match, nat }); },
  /** File registers itself as the fallback (any-mime) — not an if-else tail. */
  registerFallback(nat: NaturalClass): void { fallback = nat; },
  /** THE Factory Method: the payload's natural class, by its registered mime lens. Never branches on a hardcoded list. */
  from(mimeType: string, name = ''): NaturalClass {
    const m = String(mimeType || '').toLowerCase();
    const n = String(name || '').toLowerCase();
    for (const r of registry) if (r.match(m, n)) return r.nat;
    return fallback;
  },
  /** test/introspection: current registration count (WebItem/File + naturals). */
  _count(): number { return registry.length; },
};

// ── Self-registrations (each natural class's mime lens; a new class adds ONE line, edits nothing) ────────────────────
// WebItem — a reference to a remote resource (already works): url-ish payloads.
MimeType.register((m, n) => m === 'text/uri-list' || n.endsWith('.url') || n.endsWith('.webloc') || n.endsWith('.desktop'), { ior: 'ior:class:WebItem', kind: 'webitem' });
// Image — image/* (png/jpeg/gif/webp/…): the natural Image class.
MimeType.register((m) => m.startsWith('image/'), { ior: 'ior:class:Image', kind: 'image' });
// Email — an .eml / message/rfc822 message.
MimeType.register((m, n) => m === 'message/rfc822' || m.startsWith('message/') || n.endsWith('.eml'), { ior: 'ior:class:Email', kind: 'email' });
// Contact — a vCard (VCard→Contact): text/vcard / .vcf.
MimeType.register((m, n) => m === 'text/vcard' || m === 'text/x-vcard' || n.endsWith('.vcf'), { ior: 'ior:class:Contact', kind: 'contact' });
// CalendarEntry — an iCalendar event: text/calendar / .ics.
MimeType.register((m, n) => m === 'text/calendar' || n.endsWith('.ics') || n.endsWith('.ical'), { ior: 'ior:class:CalendarEntry', kind: 'calendarentry' });
// File = fallback (any other bytes). Registered as the fallback, not a trailing else.
MimeType.registerFallback({ ior: 'ior:class:File', kind: 'file' });
