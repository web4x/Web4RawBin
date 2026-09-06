// T37.20 DEFECT-2 inc-2 — per-class RENDER, registered through the SAME seam (MVC-in-object: the class owns its render).
// A natural class registers renderNatural(kind, fn); the view (rb-detail-drawer) does ONE lookup (hasNaturalRender) and
// mounts the generic rb-natural-detail, which asks the class to render itself. ★ Open/Closed: a 6th class registers its
// render here (or its own module) with ZERO edits to any central view switch (tagMap in the drawer is untouched).
export type UnitModel = Record<string, unknown>;
type Renderer = (model: UnitModel) => string;
const renderers = new Map<string, Renderer>();

export function registerNaturalRender(kind: string, fn: Renderer): void { renderers.set(kind, fn); }
export function hasNaturalRender(kind: string): boolean { return renderers.has(kind); }
export function naturalRender(kind: string, model: UnitModel): string | null { const f = renderers.get(kind); return f ? f(model) : null; }

const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const nameOf = (m: UnitModel): string => esc(m.name || String(m.uuid || '').slice(0, 8));
const contentUrl = (m: UnitModel): string => { const u = String(m.uuid || ''); const t = String(m.uploaderToken || ''); return `/api/room/file/${u}/content${t ? '?token=' + encodeURIComponent(t) : ''}`; };
const chrome = (icon: string, cls: string, title: string, body: string): string =>
  `<div class="dv-type">${cls}</div><div class="dv-title" style="display:flex;align-items:center;gap:8px;font-size:1rem"><span style="font-size:1.4rem">${icon}</span><span>${title}</span></div><div style="margin-top:10px">${body}</div>`;

// Image — renders the actual image (its own bytes), not a file row.
registerNaturalRender('image', (m) => chrome('🖼', 'Image', nameOf(m),
  `<img src="${contentUrl(m)}" alt="${nameOf(m)}" style="max-width:100%;max-height:70vh;border-radius:8px;display:block" />`));

// Email — an .eml message: subject/name + a link to open the raw message.
registerNaturalRender('email', (m) => chrome('📧', 'Email', nameOf(m),
  `<div style="color:rgba(255,255,255,0.7);font-size:0.85rem">Email message${m.mimeType ? ` (${esc(m.mimeType)})` : ''}</div><a href="${contentUrl(m)}" target="_blank" rel="noopener" style="color:#58a6ff;font-size:0.85rem">open message</a>`));

// Contact — a vCard: shows the card identity + a link to the .vcf.
registerNaturalRender('contact', (m) => chrome('👤', 'Contact', nameOf(m),
  `<div style="color:rgba(255,255,255,0.7);font-size:0.85rem">Contact card (vCard)</div><a href="${contentUrl(m)}" target="_blank" rel="noopener" style="color:#58a6ff;font-size:0.85rem">open vCard</a>`));

// CalendarEntry — an .ics event: title + a link to the calendar file.
registerNaturalRender('calendarentry', (m) => chrome('📅', 'Calendar event', nameOf(m),
  `<div style="color:rgba(255,255,255,0.7);font-size:0.85rem">Calendar event (iCalendar)</div><a href="${contentUrl(m)}" target="_blank" rel="noopener" style="color:#58a6ff;font-size:0.85rem">open event</a>`));
