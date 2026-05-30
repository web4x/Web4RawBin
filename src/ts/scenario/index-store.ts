/**
 * T125.3 — ScenarioIndex: UUID-prefix storage layer.
 * Canonical store at scenario/index/<5char>/<uuid>.scenario.json.
 *
 * [impl:uuid:20cca741-0a93-4d93-8a51-9c72bdb77d92] R17.4
 */
import fs from 'node:fs';
import path from 'node:path';
import { type ScenarioUnit } from './types.js';

export class ScenarioIndex {
  constructor(private basePath: string) {}

  prefix(uuid: string): string {
    return uuid.replace(/-/g, '').slice(0, 5);
  }

  filePath(uuid: string): string {
    return path.join(this.basePath, this.prefix(uuid), `${uuid}.scenario.json`);
  }

  put(uuid: string, scenario: ScenarioUnit): void {
    const dir = path.join(this.basePath, this.prefix(uuid));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${uuid}.scenario.json`), JSON.stringify(scenario, null, 2));
  }

  get(uuid: string): ScenarioUnit | null {
    const fp = this.filePath(uuid);
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  }

  has(uuid: string): boolean {
    return fs.existsSync(this.filePath(uuid));
  }

  list(): string[] {
    if (!fs.existsSync(this.basePath)) return [];
    const uuids: string[] = [];
    for (const prefix of fs.readdirSync(this.basePath)) {
      const prefixDir = path.join(this.basePath, prefix);
      if (!fs.statSync(prefixDir).isDirectory()) continue;
      for (const file of fs.readdirSync(prefixDir)) {
        if (file.endsWith('.scenario.json')) {
          uuids.push(file.replace('.scenario.json', ''));
        }
      }
    }
    return uuids;
  }

  remove(uuid: string): boolean {
    const fp = this.filePath(uuid);
    if (!fs.existsSync(fp)) return false;
    fs.rmSync(fp);
    return true;
  }
}
