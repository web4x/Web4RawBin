/**
 * R21.5 — EmailIndex: emails as first-class scenario units + alternate-UUID keys.
 *
 * Mirrors PhoneIndex (R21.3): an email is normalized (lowercase, trim) and registered
 * as `alt/email/<key>.scenario.json` → the owning PROFILE's canonical file (symlink
 * declared on the Profile unit's unitLinks[], reusing ScenarioIndex.addLink). In
 * addition (R21.5 AC1/AC2), each email becomes an `ior:class:Email` unit linked to the
 * profile via Profile.model.emails[] (forward IOR array; many emails per profile).
 * resolveToProfile follows the symlink → profile uuid (so R21.4 device-link works for
 * email exactly as for phone — AC4).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { ScenarioIndex } from './index-store.js';
import type { ScenarioUnit } from './types.js';
import { UnitController, type PublishFn } from './unit-controller.js'; // R37.11 slice-1: the PROFILE-side put routes via the seam (index-unit-side put stays EXEMPT — no view subscribes)

/** Lowercase + trim. '' if empty. */
export function normalizeEmail(raw: string): string {
  if (!raw) return '';
  return String(raw).trim().toLowerCase();
}

/** Basic email key shape: local@domain.tld (no spaces). */
export function isValidEmailKey(key: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
}

export class EmailIndex {
  constructor(private index: ScenarioIndex) {}

  /**
   * Register `alt/email/<key>.scenario.json` → the profile's canonical file (symlink on
   * the Profile unit). Returns normalized key, or null if invalid / profile missing.
   */
  registerSymlink(profileUuid: string, rawEmail: string): string | null {
    const key = normalizeEmail(rawEmail);
    if (!isValidEmailKey(key)) return null;
    if (!this.index.get(profileUuid)) return null;
    this.index.addLink(profileUuid, `alt/email/${key}.scenario.json`);
    return key;
  }

  /**
   * Mint an ior:class:Email unit (caller supplies a v4 uuid to keep this module
   * runtime-crypto-free), link it into Profile.emails[] (multiple supported — AC2),
   * and register the alt/email symlink. Returns the normalized key or null.
   */
  // [impl:uuid:c709147a-5596-43a7-9354-8b936b5ec3ea] R21.5 EmailIndex.mintAndLink
  mintAndLink(profileUuid: string, rawEmail: string, emailUuid: string, publish: PublishFn): string | null {
    const key = normalizeEmail(rawEmail);
    if (!isValidEmailKey(key)) return null;
    const profile = this.index.get(profileUuid);
    if (!profile) return null;

    // Idempotent: skip if this email already belongs to the profile.
    const pm = profile.model as Record<string, unknown>;
    const emails: string[] = (pm.emails as string[]) || [];
    const already = emails.some(e => {
      const u = this.index.get(e.replace('ior:instance:', ''));
      return u && normalizeEmail(String((u.model as Record<string, unknown>).address || '')) === key;
    });
    if (!already) {
      const emailUnit: ScenarioUnit = {
        ior: 'ior:class:Email',
        model: { uuid: emailUuid, address: key, ownerIor: `ior:instance:${profileUuid}` },
        ownerIor: `ior:instance:${profileUuid}`,
      };
      this.index.put(emailUuid, emailUnit); // EXEMPT (index-unit-side Email unit — no view subscribes; declared in check-mutation-seam ALLOW[])
      emails.push(`ior:instance:${emailUuid}`);
      UnitController.apply(this.index, profile.ior, profileUuid, { emails }, { publish }); // R37.11: profile.emails[] via the seam (get re-reads; no pre-mutate) — profile updates live
    }
    this.registerSymlink(profileUuid, key);
    return key;
  }

  /** Resolve an email (any case) → profile uuid via the symlink, or null. */
  resolveToProfile(rawEmail: string): string | null {
    const key = normalizeEmail(rawEmail);
    if (!isValidEmailKey(key)) return null;
    const linkPath = path.join(this.index.scenarioRoot, 'alt', 'email', `${key}.scenario.json`);
    if (!fs.existsSync(linkPath)) return null;
    try {
      const unit = JSON.parse(fs.readFileSync(linkPath, 'utf-8'));
      const uuid = unit && unit.model && unit.model.uuid;
      return uuid ? String(uuid) : null;
    } catch { return null; }
  }
}
