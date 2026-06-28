// [impl:uuid:97015dcc-58d9-4417-8480-000000210003] R21.3 phone.indexAsSymlink
/**
 * R21.3 — PhoneIndex: phone numbers as alternate-UUID lookup keys.
 *
 * A phone number is normalized to canonical `+<digits>` and registered as an
 * `alt/phone/<key>.scenario.json` symlink that points to the owning PROFILE's
 * canonical scenario file. The symlink is declared on the Profile unit's
 * unitLinks[] (reusing ScenarioIndex.addLink → ensureSymlinkDisk), so it
 * self-syncs on write and self-removes when the profile is removed.
 * Lookup follows the symlink and returns the profile uuid.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { ScenarioIndex } from './index-store.js';
import type { ScenarioUnit } from './types.js';

/**
 * Canonical E.164 `+<CountryCode><digits>`. A country code is REQUIRED so the same
 * number always yields ONE key (the whole point of the alt-UUID dedup):
 *   '+49 1525 384-4085' → '+4915253844085'
 *   '004915253844085'   → '+4915253844085'   (00 = international prefix → +)
 *   '015253844085'      → ''  (bare national, no country code → rejected)
 */
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const s = String(raw).trim();
  let digits: string;
  if (s.startsWith('+')) {
    digits = s.slice(1).replace(/\D/g, '');
  } else if (s.replace(/[\s\-().]/g, '').startsWith('00')) {
    digits = s.replace(/\D/g, '').replace(/^00/, ''); // 00 international prefix → +
  } else {
    return ''; // national-only / no resolvable country code → reject (no bare 0152...)
  }
  if (!digits) return '';
  return '+' + digits;
}

/** E.164-ish key shape: leading + then 6..15 digits. */
export function isValidPhoneKey(key: string): boolean {
  return /^\+\d{6,15}$/.test(key);
}

export class PhoneIndex {
  constructor(private index: ScenarioIndex) {}

  /**
   * Register `alt/phone/<key>.scenario.json` → the profile's canonical file.
   * Returns the normalized key on success, null if invalid or profile missing.
   */
  // [impl:uuid:4242f9be-58d9-4417-8480-000000210003] R21.3 PhoneIndex.registerSymlink
  registerSymlink(profileUuid: string, rawPhone: string): string | null {
    const key = normalizePhone(rawPhone);
    if (!isValidPhoneKey(key)) return null;
    if (!this.index.get(profileUuid)) return null;
    this.index.addLink(profileUuid, `alt/phone/${key}.scenario.json`);
    return key;
  }

  /**
   * R21.6: mint an ior:class:Phone unit (caller supplies a v4 uuid to keep this module
   * runtime-crypto-free), link it into Profile.phones[] (multiple supported, idempotent),
   * and register the alt/phone symlink. Standardized +CountryDigits enforced at creation.
   * Returns the normalized key or null.
   */
  // [impl:uuid:4242f9be-58d9-4417-8480-000000210006] R21.6 Phone.mintAndLink
  mintAndLink(profileUuid: string, rawPhone: string, phoneUuid: string): string | null {
    const key = normalizePhone(rawPhone);
    if (!isValidPhoneKey(key)) return null;
    const profile = this.index.get(profileUuid);
    if (!profile) return null;

    const pm = profile.model as Record<string, unknown>;
    const phones: string[] = (pm.phones as string[]) || [];
    const already = phones.some(p => {
      const u = this.index.get(p.replace('ior:instance:', ''));
      return u && normalizePhone(String((u.model as Record<string, unknown>).e164 || '')) === key;
    });
    if (!already) {
      const phoneUnit: ScenarioUnit = {
        ior: 'ior:class:Phone',
        model: { uuid: phoneUuid, e164: key, ownerIor: `ior:instance:${profileUuid}` },
        ownerIor: `ior:instance:${profileUuid}`,
      };
      this.index.put(phoneUuid, phoneUnit);
      phones.push(`ior:instance:${phoneUuid}`);
      pm.phones = phones;
      this.index.put(profileUuid, profile);
    }
    this.registerSymlink(profileUuid, key);
    return key;
  }

  /** Resolve a phone (any format) → profile uuid via the symlink, or null. */
  resolveToProfile(rawPhone: string): string | null {
    const key = normalizePhone(rawPhone);
    if (!isValidPhoneKey(key)) return null;
    const linkPath = path.join(this.index.scenarioRoot, 'alt', 'phone', `${key}.scenario.json`);
    if (!fs.existsSync(linkPath)) return null;
    try {
      const unit = JSON.parse(fs.readFileSync(linkPath, 'utf-8'));
      const uuid = unit && unit.model && unit.model.uuid;
      return uuid ? String(uuid) : null;
    } catch { return null; }
  }
}
