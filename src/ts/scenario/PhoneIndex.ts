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

/** Strip all non-digits, return canonical `+<CountryDigits>`. '' if no digits. */
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
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
