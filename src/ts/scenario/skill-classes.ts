/**
 * Skill classes — Object.verb pattern for team skills.
 *
 * Logic lives in typed Class methods. CLI scripts are thin dispatch:
 *   scriptname method args → Class.method(args)
 *
 * Each class = a traceable unit (Class → Method → Impl → Test).
 * Skills are routes to class instances with method anchors.
 *
 * [impl:uuid:f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c] skill-classes
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ScenarioIndex, type ScenarioUnit } from './index.js';

// --- Shared helpers ---

function ior(s: string): string { return String(s || '').replace('ior:instance:', '').replace('ior:file:', ''); }
function short(uuid: string): string { return uuid.slice(0, 8); }

// --- Chain class ---

export class Chain {
  constructor(private idx: ScenarioIndex, private srcDir: string, private testDir: string) {}

  private model(uuid: string): Record<string, unknown> | null {
    const u = this.idx.get(uuid);
    return u ? u.model as Record<string, unknown> : null;
  }

  private unitType(uuid: string): string {
    const u = this.idx.get(uuid);
    return u ? u.ior.replace('ior:class:', '') : '';
  }

  private hasRealMarker(dir: string, uuid: string, prefix: string): boolean {
    const re = new RegExp(`\\[${prefix}:uuid:${uuid}\\]`, 'i');
    return this.walkFiles(dir).some(f => {
      try { return re.test(fs.readFileSync(f, 'utf-8')); } catch { return false; }
    });
  }

  private walkFiles(dir: string): string[] {
    const out: string[] = [];
    if (!fs.existsSync(dir)) return out;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name.startsWith('.')) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) out.push(...this.walkFiles(full));
      else if (ent.name.endsWith('.ts')) out.push(full);
    }
    return out;
  }

  /** po.chainFollowUp — walk chain per Req, produce scoreboard */
  followUp(reqUuids: string[]): { rows: ChainRow[]; complete: number; total: number; excluded: number } {
    const allReqs = reqUuids.length > 0 ? reqUuids : this.idx.list().filter(u => this.unitType(u) === 'Requirement');
    const included = allReqs.filter(u => !this.isOrphanByDesign(u));
    const excluded = allReqs.length - included.length;
    included.sort((a, b) => {
      const na = String(this.model(a)?.altId || this.model(a)?.name || a);
      const nb = String(this.model(b)?.altId || this.model(b)?.name || b);
      return na.localeCompare(nb, undefined, { numeric: true });
    });

    const rows: ChainRow[] = [];
    let complete = 0;

    // Cache file contents for marker scanning
    const srcContent = new Map<string, string>();
    const testContent = new Map<string, string>();
    for (const f of this.walkFiles(this.srcDir)) srcContent.set(f, fs.readFileSync(f, 'utf-8'));
    for (const f of this.walkFiles(this.testDir)) testContent.set(f, fs.readFileSync(f, 'utf-8'));

    const hasRealImpl = (uuid: string) => {
      const re = new RegExp(`\\[impl:uuid:${uuid}\\]`, 'i');
      for (const [, c] of srcContent) if (re.test(c)) return true;
      return false;
    };
    const hasRealTest = (uuid: string) => {
      const re = new RegExp(`\\[test:uuid:${uuid}\\]`, 'i');
      for (const [, c] of testContent) if (re.test(c)) return true;
      return false;
    };

    for (const reqUuid of included) {
      const row = this.walkReqChain(reqUuid, hasRealImpl, hasRealTest);
      rows.push(row);
      if (row.complete) complete++;
    }

    return { rows, complete, total: included.length, excluded };
  }

  /** chain.wireImplNode — wire Method→Impl→Test */
  wireImplNode(methodUuid: string, dryRun: boolean): WireResult {
    const methUnit = this.idx.get(methodUuid);
    if (!methUnit || methUnit.ior !== 'ior:class:Method') {
      return { methodUuid, methodName: '?', action: 'skipped', testsMoved: 0, sourceFile: '' };
    }
    const methModel = methUnit.model as Record<string, unknown>;
    const methName = String(methModel.name || methodUuid);
    const impls = (methModel.implementations as string[]) || [];

    if (impls.length > 0 && impls.every(i => this.idx.has(ior(i)))) {
      return { methodUuid, methodName: methName, action: 'already-wired', implUuid: ior(impls[0]), testsMoved: 0, sourceFile: '' };
    }

    const implUuid = crypto.randomUUID();
    const sourceFile = this.findClassSourceFile(methodUuid);
    const methTests = (methModel.tests as string[]) || [];

    if (!dryRun) {
      this.idx.put(implUuid, {
        ior: 'ior:class:Implementation',
        model: { uuid: implUuid, name: methName, sourceFile, tests: [...methTests] },
        ownerIor: null,
      });
      methModel.implementations = [...impls, `ior:instance:${implUuid}`];
      methModel.tests = [];
      this.idx.put(methodUuid, methUnit);
    }

    return { methodUuid, methodName: methName, action: 'created', implUuid, testsMoved: methTests.length, sourceFile: sourceFile.replace('ior:file:', '') };
  }

  private isOrphanByDesign(uuid: string): boolean {
    const m = this.model(uuid);
    if (!m) return false;
    if (m.orphanByDesign === true || m.orphanByDesign === 'true') return true;
    return String(m.tags || '').includes('orphanByDesign');
  }

  private walkReqChain(reqUuid: string, hasRealImpl: (u: string) => boolean, hasRealTest: (u: string) => boolean): ChainRow {
    const reqM = this.model(reqUuid);
    const reqName = String(reqM?.altId || reqM?.name || short(reqUuid));
    if (!reqM) return { chainName: reqName, req: 'open', uc: 'open', cls: 'open', method: 'open', impl: 'open', test: 'open', complete: false };

    const ucIors = ((reqM.useCases as string[]) || []).filter(u => this.unitType(ior(u)) === 'UseCase');
    if (ucIors.length === 0) return { chainName: reqName, req: 'check', uc: 'open architect', cls: 'open', method: 'open', impl: 'open', test: 'open', complete: false };

    for (const ucIorStr of ucIors) {
      const ucM = this.model(ior(ucIorStr));
      if (!ucM) continue;
      for (const clsIorStr of ((ucM.classes as string[]) || [])) {
        const clsM = this.model(ior(clsIorStr));
        if (!clsM) continue;
        for (const methIorStr of ((clsM.methods as string[]) || [])) {
          const methM = this.model(ior(methIorStr));
          if (!methM) continue;
          const methName = String(methM.name || '').split('.').pop() || short(ior(methIorStr));
          for (const implIorStr of ((methM.implementations as string[]) || [])) {
            const implUuid = ior(implIorStr);
            const realImpl = hasRealImpl(implUuid);
            const implM = this.model(implUuid);
            for (const testIorStr of ((implM?.tests as string[]) || [])) {
              const testUuid = ior(testIorStr);
              const realTest = hasRealTest(testUuid);
              if (realImpl && realTest) {
                return { chainName: reqName, req: 'check', uc: 'check', cls: 'check', method: methName, impl: `check ${short(implUuid)}`, test: `check ${short(testUuid)}`, complete: true };
              }
            }
          }
        }
      }
    }

    // Not complete — find first break
    return this.findFirstBreak(reqName, reqM, ucIors);
  }

  private findFirstBreak(reqName: string, reqM: Record<string, unknown>, ucIors: string[]): ChainRow {
    for (const ucIorStr of ucIors) {
      const ucM = this.model(ior(ucIorStr));
      if (!ucM) continue;
      const clsIors = (ucM.classes as string[]) || [];
      if (clsIors.length === 0) return { chainName: reqName, req: 'check', uc: 'check', cls: 'open architect', method: 'open', impl: 'open', test: 'open', complete: false };
      for (const clsIorStr of clsIors) {
        const clsM = this.model(ior(clsIorStr));
        if (!clsM) continue;
        const methIors = (clsM.methods as string[]) || [];
        if (methIors.length === 0) return { chainName: reqName, req: 'check', uc: 'check', cls: 'check', method: 'open architect', impl: 'open', test: 'open', complete: false };
        for (const methIorStr of methIors) {
          const methM = this.model(ior(methIorStr));
          if (!methM) continue;
          const methName = String(methM.name || '').split('.').pop() || '';
          const implIors = (methM.implementations as string[]) || [];
          if (implIors.length === 0) return { chainName: reqName, req: 'check', uc: 'check', cls: 'check', method: methName, impl: `open expert ${short(ior(methIorStr))}`, test: 'open', complete: false };
          return { chainName: reqName, req: 'check', uc: 'check', cls: 'check', method: methName, impl: `open expert ${short(ior(implIors[0]))}`, test: 'open tester', complete: false };
        }
      }
    }
    return { chainName: reqName, req: 'check', uc: 'open architect', cls: 'open', method: 'open', impl: 'open', test: 'open', complete: false };
  }

  private findClassSourceFile(methodUuid: string): string {
    for (const uuid of this.idx.list()) {
      const u = this.idx.get(uuid);
      if (!u || u.ior !== 'ior:class:Class') continue;
      const methods = (u.model as Record<string, unknown>).methods;
      if (Array.isArray(methods) && methods.some(m => ior(String(m)) === methodUuid)) {
        return String((u.model as Record<string, unknown>).sourceFile || '');
      }
    }
    return '';
  }
}

// --- Velocity class ---

export class Velocity {
  constructor(private repoDir: string, private chain: Chain) {}

  compute(since: string, sprint?: string): VelocityResult {
    const { complete, total, excluded } = this.chain.followUp(
      sprint ? this.filterBySprint(sprint) : []
    );

    const totalCommits = this.gitCount(since);
    const versionBumps = this.gitCount(since, 'v0\\.');
    const { first, last } = this.gitFirstLast(since);
    const hours = first && last ? Math.max(0.1, (new Date(last).getTime() - new Date(first).getTime()) / 3600_000) : 0.1;

    return { complete, total, excluded, totalCommits, versionBumps, hours, first, last };
  }

  private filterBySprint(sprint: string): string[] {
    const idx = this.chain['idx'] as ScenarioIndex;
    const num = sprint.replace(/^S/i, '');
    return idx.list().filter(u => {
      const unit = idx.get(u);
      if (!unit || unit.ior !== 'ior:class:Requirement') return false;
      const text = String(unit.model.name || '') + ' ' + String(unit.model.altId || '');
      return text.includes(`R${num}.`) || text.toUpperCase().includes(sprint.toUpperCase());
    });
  }

  private gitCount(since: string, grepPattern?: string): number {
    const repo = path.resolve(this.repoDir);
    try {
      if (grepPattern) {
        const all = execSync(`git -C "${repo}" log --oneline --since="${since}"`, { encoding: 'utf-8' });
        return (all.match(new RegExp(grepPattern, 'gim')) || []).length;
      }
      return parseInt(execSync(`git -C "${repo}" log --oneline --since="${since}" | wc -l`, { encoding: 'utf-8' }).trim()) || 0;
    } catch { return 0; }
  }

  private gitFirstLast(since: string): { first: string; last: string } {
    const repo = path.resolve(this.repoDir);
    try {
      const all = execSync(`git -C "${repo}" log --format=%aI --since="${since}"`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
      return { first: all[all.length - 1] || '', last: all[0] || '' };
    } catch { return { first: '', last: '' }; }
  }
}

// --- Types ---

export interface ChainRow {
  chainName: string;
  req: string; uc: string; cls: string; method: string; impl: string; test: string;
  complete: boolean;
}

export interface WireResult {
  methodUuid: string; methodName: string; action: 'created' | 'already-wired' | 'skipped';
  implUuid?: string; testsMoved: number; sourceFile: string;
}

export interface VelocityResult {
  complete: number; total: number; excluded: number;
  totalCommits: number; versionBumps: number; hours: number;
  first: string; last: string;
}
