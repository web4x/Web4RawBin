/**
 * T125.3 + R18.29-31 — ScenarioIndex: UUID-prefix storage + atomic symlinks.
 * Canonical store at scenario/index/<c1>/<c2>/<c3>/<c4>/<c5>/<uuid>.scenario.json
 * model.unitLinks[] declares symlinks; put() auto-syncs them on every write.
 *
 * [impl:uuid:20cca741-0a93-4d93-8a51-9c72bdb77d92] R17.4 + R18.29-31
 */
import fs from 'node:fs';
import path from 'node:path';
import { type ScenarioUnit } from './types.js';

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

  put(uuid: string, scenario: ScenarioUnit): void {
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
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  }

  has(uuid: string): boolean {
    return fs.existsSync(this.filePath(uuid));
  }

  list(): string[] {
    if (!fs.existsSync(this.basePath)) return [];
    return this.walkForScenarios(this.basePath);
  }

  remove(uuid: string): boolean {
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
