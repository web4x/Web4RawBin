/**
 * R25.2 — WebItem: a reference to an external resource (URL/bookmark), PARALLEL to ior:class:File.
 * File IS-A stored byte artifact; WebItem IS-A pointer to a remote resource (the value is the url).
 * Dropped .url/.webloc/.desktop/uri-list/bare-URL → WebItem (not File). Design: scrum.pmo/design-notes/r25.2-webitem-design.md.
 *
 * Pure helpers (deriveScheme/badge/favicon/name + parsers) are crypto-free → client-bundle safe.
 * createWebItemUnit takes a caller-supplied v4 uuid (server passes crypto.randomUUID()).
 */
import type { ScenarioIndex } from './index-store.js';
import type { ScenarioUnit } from './types.js';

/** url protocol, lowercased ('https', 'mailto', 'tel', …); '' if none. */
export function deriveScheme(url: string): string {
  const m = /^([a-z][a-z0-9+.\-]*):/i.exec(url || '');
  return m ? m[1].toLowerCase() : '';
}

const BADGE: Record<string, string> = {
  mailto: '📧', message: '📧',
  calshow: '📅', webcal: '📅', 'x-apple-calevent': '📅',
  maps: '📍', geo: '📍', comgooglemaps: '📍',
  tel: '📞', 'facetime-audio': '📞', facetime: '📹', sms: '💬',
  'x-apple-reminder': '✅',
  http: '🔗', https: '🔗',
};
/** scheme → emoji badge (Apple DnD schemes + http). */
export function deriveBadge(scheme: string): string {
  return BADGE[scheme] || '🔗';
}

/** favicon URL (lazy-load — store the URL, never embed bytes). Only http(s) have a host favicon. */
export function deriveFavicon(url: string): string {
  if (!/^https?:/i.test(url || '')) return '';
  const host = url.replace(/^https?:\/\//i, '').split(/[/?#]/)[0];
  return host ? `https://www.google.com/s2/favicons?domain=${host}&sz=64` : '';
}

/** display name: explicit fallback (filename minus ext) → host (http) → scheme-specific → the url. */
// R25.5: harvest a human-readable NAME. NEVER "link" — a dragged URL is named "link.url" by the OS, so
// a generic/junk fallback is ignored in favour of deriving from the URL. https with a path → "Brand Segment"
// (open.spotify.com/episode/… → "Spotify Episode"); https without a path → the full hostname
// (monumental-praline-249f71.netlify.app); at minimum the hostname/URL.
export function deriveName(url: string, fallback?: string): string {
  const fb = (fallback || '').trim().replace(/\.(url|webloc|desktop|txt)$/i, '');
  if (fb && !/^(link|untitled|document|new tab|clipboard.*)$/i.test(fb)) return fb;
  const scheme = deriveScheme(url);
  if (scheme === 'mailto') return url.replace(/^mailto:/i, '').split('?')[0] || 'Email';
  if (scheme === 'tel' || scheme === 'sms') return url.replace(/^(tel|sms):/i, '') || 'Contact';
  if (scheme === 'message') return 'Email message';
  if (/^https?:/i.test(url)) {
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, '');
      const seg = u.pathname.split('/').filter(Boolean)[0] || '';
      if (seg && seg.length <= 20) {
        const parts = host.split('.');
        const brand = (parts.length >= 2 ? parts[parts.length - 2] : parts[0]).replace(/^./, c => c.toUpperCase());
        return `${brand} ${seg.replace(/^./, c => c.toUpperCase())}`;
      }
      return host || url;
    } catch { const h = url.replace(/^https?:\/\//i, '').split(/[/?#]/)[0]; return h || url; }
  }
  return url || scheme || 'Link';
}

/** Windows .url (INI [InternetShortcut]) → URL= value. */
export function parseUrlFile(content: string): string {
  const m = /^\s*URL\s*=\s*(.+?)\s*$/im.exec(content || '');
  return m ? m[1].trim() : '';
}

/** macOS .webloc (plist XML) → <key>URL</key><string>…</string>. */
export function parseWebloc(content: string): string {
  const m = /<key>\s*URL\s*<\/key>\s*<string>\s*([^<]+?)\s*<\/string>/i.exec(content || '');
  return m ? m[1].trim() : '';
}

/** Linux .desktop ([Desktop Entry]) → URL= value. */
export function parseDesktop(content: string): string {
  const m = /^\s*URL\s*=\s*(.+?)\s*$/im.exec(content || '');
  return m ? m[1].trim() : '';
}

/** Extract a URL from any dropped url-type payload (.webloc/.url/.desktop by content or name, else uri-list/bare). */
export function extractUrl(content: string, name?: string): string {
  const n = (name || '').toLowerCase();
  let url = '';
  if (n.endsWith('.webloc') || /<plist/i.test(content)) url = parseWebloc(content);
  else if (n.endsWith('.url') || /\[InternetShortcut\]/i.test(content)) url = parseUrlFile(content);
  else if (n.endsWith('.desktop') || /\[Desktop Entry\]/i.test(content)) url = parseDesktop(content);
  // v0.6.89: bare/uri-list fallback — ALSO when a format parser found nothing (a BARE URL the drop path
  // names '<url>.url' has no [InternetShortcut] block → parseUrlFile='' → the content IS the url).
  if (!url) url = (content || '').trim().split('\n').map(l => l.trim()).find(l => l && !l.startsWith('#')) || '';
  return url;
}

export interface WebItemInput { uuid: string; url: string; name?: string; uploaderToken?: string; roomUuid?: string; parentFolder?: string; relatedFile?: string; }

/**
 * Mint an ior:class:WebItem LINK unit with derived scheme/badge/favicon/name. mimeType='text/uri-list'
 * so the existing preview (content-preview.ts fillPreviewPane url-list branch → scheme launcher card /
 * iframe / YouTube embed) renders it with zero extra wiring. Caller supplies the v4 uuid (crypto-free).
 */
// [impl:uuid:1746403f-505f-4b49-8916-f499295d726b] R25.2 WebItem.createWebItemUnit
export function createWebItemUnit(idx: ScenarioIndex, input: WebItemInput): ScenarioUnit {
  const url = (input.url || '').trim();
  const scheme = deriveScheme(url);
  const unit: ScenarioUnit = {
    ior: 'ior:class:WebItem',
    model: {
      uuid: input.uuid,
      kind: 'link',
      name: deriveName(url, input.name),
      description: url, // R25.5: description = full URL (distinct from the short harvested name)
      url,
      scheme,
      icon: deriveFavicon(url),
      badge: deriveBadge(scheme),
      mimeType: 'text/uri-list',
      roomUuid: input.roomUuid || '',   // mirrors File — the content endpoint's auth resolves the room from this
      parentFolder: input.parentFolder || (input.roomUuid ? `ior:instance:${input.roomUuid}` : null),
      // R25.2/v0.6.91: forward reference to the source artifact (e.g. the .eml a message: WebItem came from)
      children: input.relatedFile ? [`ior:instance:${input.relatedFile}`] : [],
      uploaderToken: input.uploaderToken || '',
    },
    ownerIor: input.roomUuid ? `ior:instance:${input.roomUuid}` : null,
  };
  idx.put(input.uuid, unit);
  return unit;
}
