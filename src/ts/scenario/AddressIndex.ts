/**
 * R21.7 — AddressIndex: addresses as first-class scenario units, async OSM-verified.
 *
 * An address is ONE string `oneLine` ordered large→small:
 *   "Country City PostalCode Street HouseNumber"  (e.g. "DE Berlin 10115 Strasse 7")
 * mintAddress() puts the unit SYNCHRONOUSLY (verified:false, links null) and returns —
 * it NEVER does a network call (AC-c1). Verification is a background VerifyJob (server
 * side) that, on a Nominatim hit, calls applyVerification() to set verified:true + links.
 * Addresses are NOT alternate-UUID lookup keys, so there is no alt/ symlink here.
 */
import type { ScenarioIndex } from './index-store.js';
import type { ScenarioUnit } from './types.js';

export function osmLinkFor(lat: string | number, lon: string | number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`;
}
export function gmapsLinkFor(lat: string | number, lon: string | number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

export class AddressIndex {
  constructor(private index: ScenarioIndex) {}

  /**
   * Mint an ior:class:Address unit (caller supplies v4 uuid) and link into
   * Profile.addresses[]. Synchronous, no network. Idempotent by oneLine.
   * Returns the address uuid (existing one if duplicate), or null if profile missing.
   */
  // [impl:uuid:ce2501d3-0c49-4148-8c4a-795d2fbaba24] R21.7 AddressIndex.mintAddress
  mintAddress(profileUuid: string, oneLine: string, addrUuid: string): string | null {
    const line = String(oneLine || '').trim().replace(/\s+/g, ' ');
    if (!line) return null;
    const profile = this.index.get(profileUuid);
    if (!profile) return null;

    const pm = profile.model as Record<string, unknown>;
    const addresses: string[] = (pm.addresses as string[]) || [];
    for (const a of addresses) {
      const u = this.index.get(a.replace('ior:instance:', ''));
      if (u && String((u.model as Record<string, unknown>).oneLine || '').trim().replace(/\s+/g, ' ') === line) {
        return String((u.model as Record<string, unknown>).uuid); // idempotent: already present
      }
    }
    // AC-b2/b3: exact model shape, verified:false, links null at creation.
    const unit: ScenarioUnit = {
      ior: 'ior:class:Address',
      model: { uuid: addrUuid, oneLine: line, verified: false, osmLink: null, gmapsLink: null, ownerIor: `ior:instance:${profileUuid}` },
      ownerIor: `ior:instance:${profileUuid}`,
    };
    this.index.put(addrUuid, unit); // AC-c1: synchronous put before any network
    addresses.push(`ior:instance:${addrUuid}`);
    pm.addresses = addresses;
    this.index.put(profileUuid, profile);
    return addrUuid;
  }

  /** Background-job result: mark verified + store both links (AC-c4, AC-d1/d2/d3). */
  applyVerification(addrUuid: string, lat: string | number, lon: string | number): boolean {
    const unit = this.index.get(addrUuid);
    if (!unit) return false;
    const m = unit.model as Record<string, unknown>;
    m.verified = true;
    m.osmLink = osmLinkFor(lat, lon);
    m.gmapsLink = gmapsLinkFor(lat, lon);
    this.index.put(addrUuid, unit);
    return true;
  }

  /** Badge state for GET /api/address/:uuid. */
  badgeState(addrUuid: string): { verified: boolean; osmLink: string | null; gmapsLink: string | null; oneLine: string } | null {
    const unit = this.index.get(addrUuid);
    if (!unit || unit.ior !== 'ior:class:Address') return null;
    const m = unit.model as Record<string, unknown>;
    return { verified: !!m.verified, osmLink: (m.osmLink as string) ?? null, gmapsLink: (m.gmapsLink as string) ?? null, oneLine: String(m.oneLine || '') };
  }
}
