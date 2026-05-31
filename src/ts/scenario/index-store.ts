/**
 * T125.3 — ScenarioIndex: UUID-prefix storage layer.
 * Canonical store at scenario/index/<c1>/<c2>/<c3>/<c4>/<c5>/<uuid>.scenario.json
 * where c1-c5 are the first 5 hex chars of the UUID (hyphens stripped).
 *
 * [impl:uuid:20cca741-0a93-4d93-8a51-9c72bdb77d92] R17.4
 */
import fs from 'node:fs';
import path from 'node:path';
import { type ScenarioUnit } from './types.js';

export class ScenarioIndex {
  constructor(private basePath: string) {}

  prefixPath(uuid: string): string {
    if (!uuid || typeof uuid !== 'string') return '';
    const hex = uuid.replace(/-/g, '');
    if (hex.length < 5) return '';
    return path.join(hex[0], hex[1], hex[2], hex[3], hex[4]);
  }

  filePath(uuid: string): string {
    return path.join(this.basePath, this.prefixPath(uuid), `${uuid}.scenario.json`);
  }

  put(uuid: string, scenario: ScenarioUnit): void {
    const dir = path.join(this.basePath, this.prefixPath(uuid));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${uuid}.scenario.json`), JSON.stringify(scenario, null, 2));
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
    const fp = this.filePath(uuid);
    if (!fs.existsSync(fp)) return false;
    fs.rmSync(fp);
    return true;
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
