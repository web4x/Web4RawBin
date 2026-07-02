/**
 * R27.7 UC27.7b — adversarial SSRF tests for ProxyFetch.guardUrl (the allow/deny predicate before any socket).
 * Resolver is injected so DNS-rebind / metadata cases are deterministic without real DNS.
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { ProxyFetch, blockedIp } from '../../src/ts/server/proxy-fetch.js';

const pub: Record<string, string[]> = { 'example.com': ['93.184.216.34'] }; // a public IP
const resolveOf = (map: Record<string, string[]>) => async (h: string) => map[h] || ['93.184.216.34'];

describe('ProxyFetch.guardUrl — adversarial SSRF suite', () => {
  // [test:uuid:96928159-a79f-4154-81c6-cd91075b47b5] guardUrl blocks non-http schemes
  it('blocks non-http(s) schemes (file/gopher/ftp/data/dict)', async () => {
    for (const url of ['file:///etc/passwd', 'gopher://x/', 'ftp://x/f', 'data:text/html,<b>x', 'dict://x/']) {
      const r = await ProxyFetch.guardUrl(url, resolveOf(pub));
      expect(r.allow, url).toBe(false);
      expect(r.reason).toMatch(/scheme-not-allowed/);
    }
    expect((await ProxyFetch.guardUrl('http://example.com/', resolveOf(pub))).allow).toBe(true); // http still allowed — not a route-all-to-deny
  });

  // [test:uuid:ba0b8aa7-eb2d-4530-94b8-ca82df96e0d7] guardUrl blocks private+loopback ranges
  it('blocks loopback + private + link-local + v6 ranges (IP-literal and via DNS)', async () => {
    for (const url of ['http://127.0.0.1/', 'http://10.1.2.3/', 'http://172.16.0.1/', 'http://192.168.0.5/', 'http://169.254.10.10/', 'http://0.0.0.0/', 'http://[::1]/', 'http://[fd00::1]/']) {
      const r = await ProxyFetch.guardUrl(url);
      expect(r.allow, url).toBe(false);
      expect(r.reason).toMatch(/blocked-ip/);
    }
    // hostname that RESOLVES to a private IP is also blocked
    const r = await ProxyFetch.guardUrl('http://intranet.corp/', resolveOf({ 'intranet.corp': ['10.0.0.9'] }));
    expect(r.allow).toBe(false); expect(r.reason).toMatch(/private-10/);
    // GAP1 regression: IPv4-mapped IPv6 (Node normalizes ::ffff:127.0.0.1 → HEX ::ffff:7f00:1) must be blocked
    expect((await ProxyFetch.guardUrl('http://[::ffff:127.0.0.1]/')).allow).toBe(false);
    expect((await ProxyFetch.guardUrl('http://[::ffff:169.254.169.254]/')).allow).toBe(false);
    expect(blockedIp('::ffff:7f00:1')).toBeTruthy();       // hex loopback
    expect(blockedIp('::ffff:a9fe:a9fe')).toBeTruthy();    // hex 169.254.169.254 metadata
  });

  // [test:uuid:56b4283e-299a-46cb-b26e-c6c25b302cae] guardUrl blocks cloud-metadata 169.254.169.254
  it('blocks cloud-metadata (169.254.169.254 + metadata.google.internal + fd00:ec2::254)', async () => {
    expect((await ProxyFetch.guardUrl('http://169.254.169.254/latest/meta-data/')).allow).toBe(false);
    expect((await ProxyFetch.guardUrl('http://metadata.google.internal/computeMetadata/v1/', resolveOf(pub))).allow).toBe(false);
    expect((await ProxyFetch.guardUrl('http://metadata.google.internal/', resolveOf(pub))).reason).toMatch(/metadata-host/);
    expect(blockedIp('fd00:ec2::254')).toMatch(/unique-local/); // AWS IMDS v6
    // even if a hostname resolves to the metadata IP
    expect((await ProxyFetch.guardUrl('http://sneaky.test/', resolveOf({ 'sneaky.test': ['169.254.169.254'] }))).allow).toBe(false);
  });

  // [test:uuid:5459c7b6-58d0-49e9-801d-86670d091aeb] guardUrl blocks DNS-rebinding
  it('blocks DNS-rebinding — ANY resolved IP internal ⇒ deny (no public-decoy bypass)', async () => {
    const r = await ProxyFetch.guardUrl('http://evil.test/', resolveOf({ 'evil.test': ['1.2.3.4', '127.0.0.1'] }));
    expect(r.allow).toBe(false); // one public + one loopback → still denied
    expect(r.reason).toMatch(/blocked-ip/);
    const r2 = await ProxyFetch.guardUrl('http://rebind.test/', resolveOf({ 'rebind.test': ['169.254.169.254'] }));
    expect(r2.allow).toBe(false);
  });

  // [test:uuid:53cc58c5-8ee0-46b8-b641-44efb6b28710] guardUrl blocks redirect-to-internal
  it('blocks redirect-to-internal — the per-hop re-guard rejects an internal 302 target', async () => {
    // fetchSanitized re-runs guardUrl on every redirect target; the internal hop is rejected by the same predicate.
    const internalHop = await ProxyFetch.guardUrl('http://169.254.169.254/latest/');
    expect(internalHop.allow).toBe(false);
    await expect(ProxyFetch.fetchSanitized('http://169.254.169.254/', resolveOf(pub))).rejects.toThrow(/ssrf-blocked/);
  });

  it('sanitizeHtml strips script / handlers / javascript: (incl data= + object/embed)', () => {
    const dirty = '<div onclick="steal()"><script>evil()</script><a href="javascript:x()">y</a><object data="javascript:z()"></object><embed src="q"></div>';
    const clean = ProxyFetch.sanitizeHtml(dirty);
    expect(clean).not.toMatch(/<script/i);
    expect(clean).not.toMatch(/onclick=/i);
    expect(clean).not.toMatch(/javascript:/i);
    expect(clean).not.toMatch(/<object/i);
    expect(clean).not.toMatch(/<embed/i);
  });

  // [test:uuid:1b0b7123-dbe1-4659-aab1-a73be7e74dfd] guardUrl blocks IPv4-mapped IPv6 (hex-normal form)
  // GAP1 (architect independent-PDCA): `http://[::ffff:127.0.0.1]` — net.isIP normalizes the host to the
  // HEX-normal `::ffff:7f00:1`; blockedIp caught the dotted `::ffff:127.0.0.1` but NOT the hex form → bypass.
  it('blocks IPv4-mapped IPv6 in BOTH dotted and hex-normal form (::ffff:7f00:1 = 127.0.0.1, ::ffff:a9fe:a9fe = metadata)', async () => {
    for (const url of [
      'http://[::ffff:127.0.0.1]/',          // dotted → net.isIP returns hex ::ffff:7f00:1
      'http://[::ffff:7f00:1]/',             // hex-normal loopback
      'http://[::ffff:169.254.169.254]/',    // IPv4-mapped cloud metadata
      'http://[::ffff:a9fe:a9fe]/',          // hex-normal metadata
      'http://[::ffff:10.0.0.1]/',           // IPv4-mapped private
      'http://[::ffff:a00:1]/',              // hex-normal private (10.0.0.1)
    ]) {
      const r = await ProxyFetch.guardUrl(url);
      expect(r.allow, url).toBe(false);
      expect(r.reason, url).toMatch(/blocked-ip/);
    }
    // blockedIp MUST catch the hex-normal form (net.isIP yields hex, never the dotted embedded IPv4)
    expect(blockedIp('::ffff:7f00:1'), '::ffff:7f00:1 (127.0.0.1)').toBeTruthy();
    expect(blockedIp('::ffff:a9fe:a9fe'), '::ffff:a9fe:a9fe (169.254.169.254)').toBeTruthy();
    expect(blockedIp('::ffff:a00:1'), '::ffff:a00:1 (10.0.0.1)').toBeTruthy();
  });

  // [test:uuid:8ce68dcc-70c5-4f98-9ef1-f0f418c8087d] DNS-rebind — connect pins guard.ip (no re-resolve)
  // GAP2 (architect independent-PDCA): a TTL-0 rebind resolves PUBLIC at check time then INTERNAL at connect.
  // guardUrl must RETURN the vetted IP so fetchSanitized connects to guard.ip (never re-resolving the host).
  it('DNS-rebind: guardUrl PINS the vetted IP (returned), and ANY internal in the resolved set denies', async () => {
    const ok = await ProxyFetch.guardUrl('http://rebind.test/', resolveOf({ 'rebind.test': ['93.184.216.34'] }));
    expect(ok.allow).toBe(true);
    expect(ok.ip).toBe('93.184.216.34');               // vetted IP is pinned + returned → caller connects to THIS
    // public-decoy + internal in one resolve → deny (the pinned-IP defense never trusts a re-resolve)
    const decoy = await ProxyFetch.guardUrl('http://rebind.test/', resolveOf({ 'rebind.test': ['93.184.216.34', '127.0.0.1'] }));
    expect(decoy.allow).toBe(false);
    expect(decoy.reason).toMatch(/blocked-ip/);
  });
});
