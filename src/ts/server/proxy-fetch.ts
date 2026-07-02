/**
 * R27.7 UC27.7b (543ff7aa webItem.serverProxyFetch) — ProxyFetch: server-side CORS/X-Frame fallback proxy for the
 * WebItem preview drawer, with a HARD SSRF guard. The proxy fetches a USER-PROVIDED url → SSRF vector; guardUrl is a
 * pure, unit-testable predicate that returns allow/deny+reason BEFORE any socket opens (adversarial tests up front).
 */
import dns from 'node:dns/promises';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';

export interface GuardResult { allow: boolean; reason: string; ip?: string; }
export type Resolver = (host: string) => Promise<string[]>;

const CONTENT_ALLOW = [/^text\/html/i, /^application\/pdf/i, /^image\//i];
const MAX_BYTES = 5 * 1024 * 1024;   // 5 MB cap
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;

/** Classify an IP literal → the blocklist bucket it falls in, or null if public. Works on the RESOLVED IP. */
export function blockedIp(ip: string): string | null {
  const fam = net.isIP(ip);
  if (fam === 4) {
    const o = ip.split('.').map(Number);
    if (o.length !== 4 || o.some(n => Number.isNaN(n) || n < 0 || n > 255)) return 'malformed';
    if (o[0] === 127) return 'loopback';
    if (o[0] === 10) return 'private-10/8';
    if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return 'private-172.16/12';
    if (o[0] === 192 && o[1] === 168) return 'private-192.168/16';
    if (o[0] === 169 && o[1] === 254) return 'link-local-169.254/16'; // includes cloud-metadata 169.254.169.254
    if (o[0] === 0) return 'this-network-0/8';
    if (o[0] === 100 && o[1] >= 64 && o[1] <= 127) return 'cgnat-100.64/10';
    return null;
  }
  if (fam === 6) {
    const a = ip.toLowerCase().replace(/^\[|\]$/g, '');
    if (a === '::1' || a === '0:0:0:0:0:0:0:1') return 'loopback-v6';
    if (a === '::') return 'unspecified-v6';
    if (/^fe[89ab]/.test(a)) return 'link-local-fe80::/10';
    if (/^f[cd]/.test(a)) return 'unique-local-fc00::/7';       // fc00::/7 incl fd00:ec2::254 (AWS metadata v6)
    // IPv4-mapped ::ffff:a.b.c.d — Node normalizes the DOTTED form to HEX (::ffff:7f00:1). Extract the embedded v4
    // from EITHER form and re-check as v4 (fixed GAP1: the old dotted-only regex let ::ffff:7f00:1 through).
    const mapped = a.match(/^::ffff:(.+)$/) || a.match(/^0:0:0:0:0:ffff:(.+)$/);
    if (mapped) {
      const tail = mapped[1];
      if (/^\d+\.\d+\.\d+\.\d+$/.test(tail)) return blockedIp(tail) || 'ipv4-mapped'; // dotted
      const g = tail.split(':'); // hex form: two 16-bit groups → 4 octets
      if (g.length === 2) { const hi = parseInt(g[0] || '0', 16), lo = parseInt(g[1] || '0', 16); return blockedIp(`${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`) || 'ipv4-mapped'; }
      return 'ipv4-mapped-unparsed'; // fail-closed on any mapped form we can't decode
    }
    if (/^(::ffff:|64:ff9b::|2002:)/.test(a)) return 'ipv4-embedded-v6'; // NAT64/6to4 embed v4 → fail-closed
    return null;
  }
  return 'not-an-ip';
}

export class ProxyFetch {
  /**
   * SSRF guard — allow/deny a user URL BEFORE any socket. Pure predicate (resolver injectable for adversarial tests):
   * scheme allowlist (http/https only) + metadata-host block + resolved-IP blocklist (loopback/private/link-local/
   * ULA/metadata/0.0.0.0). Returns the pinned IP so the caller connects to THAT (DNS-rebinding defense).
   */
  // [impl:uuid:ba8f38c0-99b6-401c-9fa6-5c7e3ea55e35] R27.7 ProxyFetch.guardUrl (SSRF allow/deny predicate)
  static async guardUrl(rawUrl: string, resolve?: Resolver): Promise<GuardResult> {
    let u: URL;
    try { u = new URL(rawUrl); } catch { return { allow: false, reason: 'invalid-url' }; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return { allow: false, reason: `scheme-not-allowed:${u.protocol.replace(':', '')}` };
    const host = u.hostname.replace(/^\[|\]$/g, '');
    if (/^metadata\.google\.internal$/i.test(host)) return { allow: false, reason: 'metadata-host' };
    if (net.isIP(host)) { const b = blockedIp(host); return b ? { allow: false, reason: `blocked-ip:${b}`, ip: host } : { allow: true, reason: 'ok', ip: host }; }
    let ips: string[];
    try { ips = (resolve ? await resolve(host) : (await dns.lookup(host, { all: true })).map(r => r.address)); } catch { return { allow: false, reason: 'dns-fail' }; }
    if (!ips.length) return { allow: false, reason: 'no-ip' };
    for (const ip of ips) { const b = blockedIp(ip); if (b) return { allow: false, reason: `blocked-ip:${b}`, ip }; } // ANY resolved IP blocked → deny (rebind-safe)
    return { allow: true, reason: 'ok', ip: ips[0] };
  }

  /** Sanitize HTML → inert (strip script/handlers/js-uris). Never executed; served under a restrictive CSP by the caller. */
  static sanitizeHtml(html: string): string {
    return String(html)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<(object|embed|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<(object|embed)\b[^>]*\/?>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/(href|src|data|action|formaction)\s*=\s*("|')?\s*javascript:[^"'>\s]*/gi, '$1="#"'); // incl data=/object (CSP+sandbox is primary; this closes the hole)
  }

  /**
   * Fetch a guarded URL, re-checking the guard on EVERY redirect hop (a 302→169.254.169.254 must be blocked),
   * capping bytes/redirects/timeout, enforcing the content-type allowlist, sanitizing HTML. Returns inert content.
   */
  // [impl:uuid:31c58c73-c52d-4785-b4ea-7c0ecb38ba56] R27.7 ProxyFetch.fetchSanitized (guarded proxy fetch)
  static async fetchSanitized(rawUrl: string, resolve?: Resolver, hop = 0): Promise<{ status: number; contentType: string; body: Buffer }> {
    if (hop > MAX_REDIRECTS) throw new Error('too-many-redirects');
    const guard = await ProxyFetch.guardUrl(rawUrl, resolve);
    if (!guard.allow || !guard.ip) throw new Error(`ssrf-blocked:${guard.reason}`);
    const u = new URL(rawUrl);
    const isHttps = u.protocol === 'https:';
    const lib = isHttps ? https : http;
    return await new Promise((resolve2, reject) => {
      // GAP2 fix (DNS-rebind TOCTOU): CONNECT to the vetted guard.ip — do NOT pass rawUrl (that re-resolves at the
      // socket, letting a TTL-0 rebind swap in an internal IP between check and connect). Host header + TLS SNI keep
      // vhost routing + cert validation against the ORIGINAL hostname.
      const opts: http.RequestOptions = {
        host: guard.ip, port: Number(u.port) || (isHttps ? 443 : 80), path: u.pathname + u.search, method: 'GET',
        timeout: TIMEOUT_MS, headers: { Host: u.host, 'User-Agent': 'RawBin-Proxy/1.0', Accept: 'text/html,application/pdf,image/*' },
        ...(isHttps ? { servername: u.hostname, rejectUnauthorized: true } : {}),
      };
      const req = lib.request(opts, res => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location) { // re-guard the redirect target
          res.resume();
          const next = new URL(res.headers.location, rawUrl).toString();
          ProxyFetch.fetchSanitized(next, resolve, hop + 1).then(resolve2, reject); return;
        }
        const ct = String(res.headers['content-type'] || '');
        if (!CONTENT_ALLOW.some(re => re.test(ct))) { res.resume(); reject(new Error(`content-type-not-allowed:${ct.split(';')[0]}`)); return; }
        const chunks: Buffer[] = []; let total = 0;
        res.on('data', c => { total += c.length; if (total > MAX_BYTES) { req.destroy(); reject(new Error('size-cap-exceeded')); return; } chunks.push(c); });
        res.on('end', () => { let body = Buffer.concat(chunks); if (/^text\/html/i.test(ct)) body = Buffer.from(ProxyFetch.sanitizeHtml(body.toString('utf8')), 'utf8'); resolve2({ status, contentType: ct, body }); });
      });
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.on('error', e => reject(e));
      req.end();
    });
  }
}
