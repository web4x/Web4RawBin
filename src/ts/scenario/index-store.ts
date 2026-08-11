// [impl:uuid:80e26c8c-5dbf-418f-bb88-fcdaa82c0d07] ScenarioIndex.canonicalShard impl
// [impl:uuid:0f22ecb8-ab27-40bd-aee2-0f931bc06fb9] ScenarioUnit.load(json): this
/**
 * T125.3 + R18.29-31 — ScenarioIndex: UUID-prefix storage + atomic symlinks.
 * Canonical store at scenario/index/<c1>/<c2>/<c3>/<c4>/<c5>/<uuid>.scenario.json
 * model.unitLinks[] declares symlinks; put() auto-syncs them on every write.
 *
 * [impl:uuid:8c72876c-05a5-467d-a1da-2b14a4a7b40d] R17.4 + R18.29-31
 */
import fs from 'node:fs';
import path from 'node:path';
import { type ScenarioUnit } from './types.js';
import { selfHealOnRead } from './self-heal.js'; // C4.1 self-heal on read (inert until a class registers a healer)

// [impl:uuid:5b584056-ebc9-43d4-a3f9-3ea371a9c2b8] ScenarioIndex.get(uuid): ScenarioUnit impl
// [impl:uuid:4e256ada-5598-4ae0-9182-bb2e9d1729ee] ScenarioIndex.prefix(uuid): string impl
// [impl:uuid:877ec45e-c072-4297-a034-e714abcc3259] ScenarioIndex.put(uuid impl
// [impl:uuid:9c8e9d8c-7ef1-4096-ae96-a5892dc12c8e] ScenarioIndex.prefix(uuid): string impl
// [impl:uuid:9c8d5ebb-0e56-4cae-b6de-c6d3ac583125] ScenarioIndex.put(uuid impl
// [impl:uuid:f5297314-81df-42be-b7b6-fe5c2697576a] ScenarioIndex.get(uuid): ScenarioUnit
export class ScenarioIndex {
  readonly scenarioRoot: string;

  constructor(private basePath: string) {
    this.scenarioRoot = path.dirname(basePath);
  }

  prefixPath(uuid: string): string {
    if (!uuid || typeof uuid !== 'string') return '';
    const hex = uuid.replace(/-/g, '');
    if (hex.length < 5) return '';
    return path.join(hex[0], hex[1], hex[2], hex[3], hex[4]);
  }

  filePath(uuid: string): string {
    const newPath = path.join(this.basePath, this.prefixPath(uuid), `${uuid}.scenario.json`);
    if (fs.existsSync(newPath)) return newPath;
    const hex = uuid.replace(/-/g, '').slice(0, 5);
    const legacyPath = path.join(this.basePath, hex, `${uuid}.scenario.json`);
    if (fs.existsSync(legacyPath)) return legacyPath;
    return newPath;
  }

  // R31.7 no-flush write-guard (architect design 50e7285da). The config-singleton unit is BUILD-OWNED: start.mjs
  // writes it; the server only READS it (server.ts:1286 plantumlUrl) + serves BOOT_VERSION — it must NEVER persist it.
  // put() is the SOLE disk-write for every unit, so guarding it here blocks ALL runtime flush paths BY CONSTRUCTION →
  // the version-regression antipattern (a server booted @X re-flushing config@X, dirtying the tree) cannot recur.
  // WARN (not silent) so any offending write path is visible.
  static readonly BUILD_OWNED_UUIDS = new Set(['config-singleton-0000-000000000001']);

  // [impl:uuid:7f2d9046-8362-4e42-8cdc-134ee3191692] ScenarioIndex.put (Method c2ab4e27) — R31.7 BUILD_OWNED no-flush guard
  put(uuid: string, scenario: ScenarioUnit): void {
    if (ScenarioIndex.BUILD_OWNED_UUIDS.has(uuid)) { console.warn('[ScenarioIndex] refused runtime write of BUILD-OWNED unit ' + uuid); return; }
    this.invalidateListCache();
    const dir = path.join(this.basePath, this.prefixPath(uuid));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${uuid}.scenario.json`), JSON.stringify(scenario, null, 2));
    const links = (scenario.model as Record<string, unknown>).unitLinks;
    if (Array.isArray(links) && links.length > 0) {
      this.syncLinks(uuid);
    }
  }

  get(uuid: string): ScenarioUnit | null {
    if (!uuid) return null;
    const fp = this.filePath(uuid);
    if (!fp || !fs.existsSync(fp)) return null;
    // C4.1 (T37.4.1) self-heal on READ: recompute derived fields to reality (fresh) OR refuse (throw), so a read never
    // returns a silently-drifted value. No-op for any ior with no registered healer (O(1) Map lookup) — inert until a
    // class registers via registerSelfHeal, so this changes no read behaviour until a healer is wired in.
    return selfHealOnRead(JSON.parse(fs.readFileSync(fp, 'utf-8')) as ScenarioUnit);
  }

  has(uuid: string): boolean {
    return fs.existsSync(this.filePath(uuid));
  }

  private _listCache: string[] | null = null;
  private _listCacheTime = 0;
  private static LIST_CACHE_TTL = 5000; // 5s TTL

  list(): string[] {
    if (!fs.existsSync(this.basePath)) return [];
    const now = Date.now();
    if (this._listCache && (now - this._listCacheTime) < ScenarioIndex.LIST_CACHE_TTL) return this._listCache;
    this._listCache = this.walkForScenarios(this.basePath);
    this._listCacheTime = now;
    return this._listCache;
  }

  invalidateListCache(): void { this._listCache = null; }

  remove(uuid: string): boolean {
    this.invalidateListCache();
    const unit = this.get(uuid);
    if (unit) {
      const links = (unit.model as Record<string, unknown>).unitLinks;
      if (Array.isArray(links)) {
        for (const lp of links) this.removeSymlinkDisk(String(lp));
      }
    }
    const fp = this.filePath(uuid);
    if (!fs.existsSync(fp)) return false;
    fs.rmSync(fp);
    return true;
  }

  addLink(uuid: string, linkPath: string): void {
    const unit = this.get(uuid);
    if (!unit) return;
    const links: string[] = ((unit.model as Record<string, unknown>).unitLinks as string[]) || [];
    if (!links.includes(linkPath)) links.push(linkPath);
    (unit.model as Record<string, unknown>).unitLinks = links;
    this.put(uuid, unit);
  }

  removeLink(uuid: string, linkPath: string): void {
    const unit = this.get(uuid);
    if (!unit) return;
    const links: string[] = (((unit.model as Record<string, unknown>).unitLinks as string[]) || []).filter(l => l !== linkPath);
    (unit.model as Record<string, unknown>).unitLinks = links;
    const dir = path.join(this.basePath, this.prefixPath(uuid));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${uuid}.scenario.json`), JSON.stringify(unit, null, 2));
    this.removeSymlinkDisk(linkPath);
  }

  syncLinks(uuid: string): void {
    const unit = this.get(uuid);
    if (!unit) return;
    const declared = (unit.model as Record<string, unknown>).unitLinks;
    if (!Array.isArray(declared)) return;
    for (const linkPath of declared) {
      this.ensureSymlinkDisk(uuid, String(linkPath));
    }
  }

  private ensureSymlinkDisk(uuid: string, linkPath: string): void {
    const fullPath = path.join(this.scenarioRoot, linkPath);
    const target = path.relative(path.dirname(fullPath), this.filePath(uuid));
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    try { fs.unlinkSync(fullPath); } catch {}
    try { fs.symlinkSync(target, fullPath); } catch { try { fs.symlinkSync(target, fullPath, 'junction'); } catch (e) { /* unitLinks[] in JSON stays canonical */ } }
  }

  private removeSymlinkDisk(linkPath: string): void {
    const fullPath = path.join(this.scenarioRoot, linkPath);
    try { fs.unlinkSync(fullPath); } catch {}
  }

  private walkForScenarios(dir: string): string[] {
    const uuids: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        uuids.push(...this.walkForScenarios(path.join(dir, entry.name)));
      } else if (entry.name.endsWith('.scenario.json')) {
        uuids.push(entry.name.replace('.scenario.json', ''));
      }
    }
    return uuids;
  }
}
