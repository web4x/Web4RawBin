/**
 * R21.8 — CompanyIndex: companies as SHARED scenario units (ownerIor:null).
 *
 * Dedup keys (two alt-indexes):
 *   alt/company/<nameKey>.scenario.json         — RECALL/suggestion key (collision ≠ auto-merge)
 *   alt/company-domain/<domain>.scenario.json   — AUTHORITATIVE (same domain → same unit)
 * Both symlinks are declared on the COMPANY unit's unitLinks[] (the one case where the alt-link
 * lives on the resolved unit itself, because many profiles share one company — there is no
 * single owning profile). Forward-only: no members[] back-pointer on Company.
 *
 * companyNameKey: NFKD fold + strip diacritics, lowercase, '&'→' and ', strip legal suffixes
 * (token-wise, repeated until stable), strip all non-alphanumerics. (AC-a1..a4)
 */
import fs from 'node:fs';
import path from 'node:path';
import type { ScenarioIndex } from './index-store.js';
import type { ScenarioUnit } from './types.js';
import { UnitController, type PublishFn } from './unit-controller.js'; // R37.11 slice-1: linkToProfile's PROFILE-side put routes via the seam (Company-unit-side puts stay EXEMPT — no view subscribes)

const LEGAL_SUFFIXES = new Set([
  'gmbh', 'mbh', 'ag', 'se', 'kg', 'ug', 'inc', 'llc', 'ltd', 'limited', 'corp',
  'corporation', 'co', 'company', 'plc', 'lp', 'llp', 'sa', 'sarl', 'bv', 'nv',
  'oy', 'ab', 'as', 'spa', 'srl', 'pty',
]);

/** Deterministic, pure (AC-a1). NFKD+diacritics, lc, &→and, strip legal suffixes, strip non-alnum. */
export function companyNameKey(raw: string): string {
  if (!raw) return '';
  let s = String(raw).normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); // strip combining diacritics
  s = s.toLowerCase();
  s = s.replace(/&/g, ' and ');
  // token-wise legal-suffix strip, repeated until stable (AC-a4)
  let tokens = s.split(/[^a-z0-9]+/).filter(Boolean);
  let changed = true;
  while (changed) {
    changed = false;
    // pop trailing legal suffixes; also pop a trailing 'and' connector (from '&') so
    // compound legal forms like "GmbH & Co KG" fully strip (AC-a4). Mid-name 'and'
    // (e.g. "Ben and Jerry") is never trailing, so it is preserved.
    while (tokens.length > 1 && (LEGAL_SUFFIXES.has(tokens[tokens.length - 1]) || tokens[tokens.length - 1] === 'and')) {
      tokens.pop(); changed = true;
    }
  }
  return tokens.join('').replace(/[^a-z0-9]/g, ''); // strip all non-alnum (AC-a2 final)
}

/** Registrable host from an email or URL, else null. (AC-b1) */
export function companyDomain(emailOrUrl?: string): string | null {
  if (!emailOrUrl) return null;
  const s = String(emailOrUrl).trim().toLowerCase();
  if (!s) return null;
  let host = '';
  if (s.includes('@') && !s.includes('://') && !s.includes('/')) host = s.split('@').pop() || '';
  else { try { host = new URL(s.includes('://') ? s : 'https://' + s).hostname; } catch { host = ''; } }
  host = host.replace(/^www\./, '');
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) ? host : null;
}

export interface CompanySuggestion { uuid: string; name: string; nameKey: string; domain: string | null; }

export class CompanyIndex {
  constructor(private index: ScenarioIndex) {}

  private linkFull(rel: string): string { return path.join(this.index.scenarioRoot, rel); }
  private readLinkUuid(rel: string): string | null {
    const fp = this.linkFull(rel);
    if (!fs.existsSync(fp)) return null;
    try { const u = JSON.parse(fs.readFileSync(fp, 'utf-8')); return u?.model?.uuid ? String(u.model.uuid) : null; } catch { return null; }
  }
  private linkExists(rel: string): boolean { return fs.existsSync(this.linkFull(rel)); }

  /** Alt-links for a new unit: domain always; nameKey ONLY if free (don't clobber the
   *  recall key already owned by a same-nameKey-but-different-domain unit). */
  private buildLinks(nameKey: string, dom: string | null): string[] {
    const links: string[] = [];
    if (!this.linkExists(`alt/company/${nameKey}.scenario.json`)) links.push(`alt/company/${nameKey}.scenario.json`);
    if (dom) links.push(`alt/company-domain/${dom}.scenario.json`);
    return links;
  }

  /** mintOrReuseShared (AC-d1..d4): domain authoritative, then nameKey, else mint. */
  // [impl:uuid:4a7d30bb-efc1-4cd4-b0eb-a284042facce] R21.8 CompanyIndex.mintOrReuseShared
  mintOrReuseShared(name: string, companyUuid: string, domain?: string): string | null {
    const nameKey = companyNameKey(name);
    if (!nameKey) return null;
    const dom = companyDomain(domain);
    // Step 1: domain authoritative — same domain → same unit.
    if (dom) {
      const hit = this.readLinkUuid(`alt/company-domain/${dom}.scenario.json`);
      if (hit) return hit;
      // AC-b3: a present-but-unmatched domain is POSITIVE proof of distinctness →
      // do NOT fall through to nameKey reuse; mint a separate unit below.
    } else {
      // Step 2 (no domain): nameKey recall — collision dedups (Tron "do not duplicate", AC-a5).
      const nk = this.readLinkUuid(`alt/company/${nameKey}.scenario.json`);
      if (nk) return nk;
    }
    // Step 3: mint new shared unit + declare alt-links (AC-d3, AC-e1/e2, AC-f1).
    // buildLinks keeps the existing nameKey recall key if a domain-distinct unit already owns it.
    const unit: ScenarioUnit = {
      ior: 'ior:class:Company',
      model: { uuid: companyUuid, name: String(name).trim(), nameKey, domain: dom, aliases: [], unitLinks: this.buildLinks(nameKey, dom) },
      ownerIor: null,
    };
    this.index.put(companyUuid, unit); // put() syncs the symlinks
    return companyUuid;
  }

  /** Force a brand-new unit even if a nameKey neighbour exists (explicit user override, AC-c4). */
  mintNew(name: string, companyUuid: string, domain?: string): string | null {
    const nameKey = companyNameKey(name);
    if (!nameKey) return null;
    const dom = companyDomain(domain);
    const unit: ScenarioUnit = { ior: 'ior:class:Company', model: { uuid: companyUuid, name: String(name).trim(), nameKey, domain: dom, aliases: [], unitLinks: this.buildLinks(nameKey, dom) }, ownerIor: null };
    this.index.put(companyUuid, unit);
    return companyUuid;
  }

  /** Append a raw typed variant as an alias on an existing unit (AC-c5). */
  addAlias(companyUuid: string, rawTyped: string): void {
    const unit = this.index.get(companyUuid);
    if (!unit) return;
    const m = unit.model as Record<string, unknown>;
    const aliases: string[] = (m.aliases as string[]) || [];
    const v = String(rawTyped).trim();
    if (v && !aliases.includes(v)) { aliases.push(v); m.aliases = aliases; this.index.put(companyUuid, unit); }
  }

  /** Link a company into a profile's companies[] (forward-only, AC-e3/f2). */
  linkToProfile(profileUuid: string, companyUuid: string, publish: PublishFn): void {
    const profile = this.index.get(profileUuid);
    if (!profile) return;
    const pm = profile.model as Record<string, unknown>;
    const companies: string[] = (pm.companies as string[]) || [];
    const ior = `ior:instance:${companyUuid}`;
    if (!companies.includes(ior)) { companies.push(ior); UnitController.apply(this.index, profile.ior, profileUuid, { companies }, { publish }); } // R37.11: profile.companies[] via the seam (get re-reads; no pre-mutate) — profile updates live
  }

  /** Autocomplete: up to 5, ranked exact nameKey > domain > nameKey-prefix > token-overlap (AC-c1). */
  suggest(typed: string, limit = 5): CompanySuggestion[] {
    const qKey = companyNameKey(typed);
    const qTokens = new Set(String(typed).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
    const all: Array<CompanySuggestion & { score: number }> = [];
    for (const uuid of this.index.list()) {
      const u = this.index.get(uuid);
      if (!u || u.ior !== 'ior:class:Company') continue;
      const m = u.model as Record<string, unknown>;
      const nk = String(m.nameKey || ''); const dom = (m.domain as string) || null;
      let score = 0;
      if (qKey && nk === qKey) score = 1000;
      else if (qKey && dom && dom.replace(/[^a-z0-9]/g, '').includes(qKey)) score = 800;
      else if (qKey && nk.startsWith(qKey)) score = 600;
      else {
        const nkTokens = new Set(String(m.name || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
        const inter = [...qTokens].filter(t => nkTokens.has(t)).length;
        const union = new Set([...qTokens, ...nkTokens]).size;
        if (inter > 0) score = Math.round(400 * (inter / Math.max(1, union)));
      }
      if (score > 0) all.push({ uuid: String(m.uuid), name: String(m.name || ''), nameKey: nk, domain: dom, score });
    }
    all.sort((a, b) => b.score - a.score);
    return all.slice(0, limit).map(({ score, ...s }) => { void score; return s; });
  }
}
