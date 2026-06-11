/**
 * Skill classes — Object.verb pattern for team skills.
 *
 * ALL skill logic lives here, in typed Class methods (the OOSH model applied to TS).
 * Public methods = verbs. The generic dispatcher (scripts/objectVerb.ts) derives
 * CLI invocation, help, parameter completion, the OOSH wrapper (taskChain) and the
 * skill docs from THIS file's signatures + JSDoc — defined once, introspected (DRY).
 *
 * Conventions the dispatcher relies on:
 *  - public method = verb; `private` methods are invisible to the CLI
 *  - first line of the JSDoc = the verb's description
 *  - param types limited to: string, string[], number, boolean (optional via `?` or default)
 *  - `complete(verb, param)` returns Tab-completion candidates for a param
 *
 * [impl:uuid:f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c] skill-classes
 */
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ScenarioIndex } from './index.js';

// --- Shared helpers ---

function ior(s: string): string { return String(s || '').replace('ior:instance:', '').replace('ior:file:', ''); }
function short(uuid: string): string { return uuid.slice(0, 8); }

// --- Chain class ---

export class Chain {
  constructor(private idx: ScenarioIndex, private srcDir: string, private testDir: string) {}

  // ── private helpers ────────────────────────────────────────────────────────

  private model(uuid: string): Record<string, unknown> | null {
    const u = this.idx.get(uuid);
    return u ? u.model as Record<string, unknown> : null;
  }

  private unitType(uuid: string): string {
    const u = this.idx.get(uuid);
    return u ? u.ior.replace('ior:class:', '') : '';
  }

  private walkFiles(dir: string): string[] {
    const out: string[] = [];
    if (!fs.existsSync(dir)) return out;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name.startsWith('.')) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) out.push(...this.walkFiles(full));
      else if (ent.name.endsWith('.ts') || ent.name.endsWith('.js') || ent.name.endsWith('.mjs')) out.push(full);
    }
    return out;
  }

  private markerScanners(): { hasRealImpl: (u: string) => boolean; hasRealTest: (u: string) => boolean } {
    const srcContent: string[] = [];
    const testContent: string[] = [];
    for (const f of this.walkFiles(this.srcDir)) srcContent.push(fs.readFileSync(f, 'utf-8'));
    for (const f of this.walkFiles(this.testDir)) testContent.push(fs.readFileSync(f, 'utf-8'));
    const hasRealImpl = (uuid: string) => {
      if (!this.idx.has(uuid)) return false; // Impl UNIT must exist on disk
      const re = new RegExp(`\\[impl:uuid:${uuid}\\]`, 'i');
      return srcContent.some(c => re.test(c));
    };
    const hasRealTest = (uuid: string) => {
      if (!this.idx.has(uuid)) return false; // Test UNIT must exist on disk
      const re = new RegExp(`\\[test:uuid:${uuid}\\]`, 'i');
      return testContent.some(c => re.test(c));
    };
    return { hasRealImpl, hasRealTest };
  }

  private isOrphanByDesign(uuid: string): boolean {
    const m = this.model(uuid);
    if (!m) return false;
    if (m.orphanByDesign === true || m.orphanByDesign === 'true') return true;
    return String(m.tags || '').includes('orphanByDesign');
  }

  private sprintReqs(sprint: string): string[] {
    const num = sprint.replace(/^S/i, '');
    return this.idx.list().filter(u => {
      if (this.unitType(u) !== 'Requirement') return false;
      const m = this.model(u);
      const text = String(m?.name || '') + ' ' + String(m?.altId || '');
      return text.includes(`R${num}.`) || text.toUpperCase().includes(sprint.toUpperCase());
    });
  }

  /** Resolve included/excluded requirement set (canonical denominator). */
  private resolveReqSet(reqUuids: string[], sprint?: string): { included: string[]; excluded: number } {
    let all: string[];
    if (reqUuids.length > 0) all = reqUuids.map(u => this.resolvePrefix(u) || u);
    else if (sprint) all = this.sprintReqs(sprint);
    else all = this.idx.list().filter(u => this.unitType(u) === 'Requirement');
    const included = all.filter(u => !this.isOrphanByDesign(u));
    included.sort((a, b) => {
      const ma = this.model(a), mb = this.model(b);
      const na = String(ma?.altId || ma?.name || a), nb = String(mb?.altId || mb?.name || b);
      return na.localeCompare(nb, undefined, { numeric: true });
    });
    return { included, excluded: all.length - included.length };
  }

  /**
   * CANONICAL chain walk for ONE requirement — produces one row per
   * (UC, Class, Method, Impl, Test) combination, exactly the po-chain-follow-up
   * semantics (validated against baseline 9/154 on 2026-06-11).
   */
  private walkReq(reqUuid: string, hasRealImpl: (u: string) => boolean, hasRealTest: (u: string) => boolean): ChainRow[] {
    const reqM = this.model(reqUuid);
    if (!reqM) return [{ chainName: short(reqUuid), req: 'open', uc: 'open', cls: 'open', method: 'open', impl: 'open', test: 'open', complete: false, openNodes: [] }];
    const reqName = String(reqM.altId || reqM.name || short(reqUuid));
    const ucIors = ((reqM.useCases as string[]) || []).filter(u => this.unitType(ior(u)) === 'UseCase');

    if (ucIors.length === 0) {
      return [{ chainName: reqName, req: 'check', uc: 'open architect', cls: 'open', method: 'open', impl: 'open', test: 'open', complete: false,
        openNodes: [{ node: 'UC', owner: 'architect', action: 'Create UC + wire to Req', iorShort: short(reqUuid) }] }];
    }

    const results: ChainRow[] = [];
    for (const ucIorStr of ucIors) {
      const ucUuid = ior(ucIorStr);
      const ucM = this.model(ucUuid);
      if (!ucM) continue;
      const clsIors = (ucM.classes as string[]) || [];
      if (clsIors.length === 0) {
        results.push({ chainName: reqName, req: 'check', uc: 'check', cls: 'open architect', method: 'open', impl: 'open', test: 'open', complete: false,
          openNodes: [{ node: 'Class', owner: 'architect', action: 'Wire Class to UC', iorShort: short(ucUuid) }] });
        continue;
      }

      // UC.method → specific method (preferred over Class.methods[0])
      const ucMethodIor = String((ucM as Record<string, unknown>).method || '');
      const ucMethodUuid = ucMethodIor ? ior(ucMethodIor) : '';

      for (const clsIorStr of clsIors) {
        const clsUuid = ior(clsIorStr);
        const clsM = this.model(clsUuid);
        if (!clsM) continue;
        const methIors = ucMethodUuid ? [ucMethodIor] : ((clsM.methods as string[]) || []);
        if (methIors.length === 0) {
          results.push({ chainName: reqName, req: 'check', uc: 'check', cls: 'check', method: 'open architect', impl: 'open', test: 'open', complete: false,
            openNodes: [{ node: 'Method', owner: 'architect', action: 'Wire Method to Class', iorShort: short(clsUuid) }] });
          continue;
        }

        for (const methIorStr of methIors) {
          const methUuid = ior(methIorStr);
          const methM = this.model(methUuid);
          if (!methM) continue;
          const methName = String(methM.name || '').split('.').pop() || short(methUuid);
          const implIors = (methM.implementations as string[]) || [];

          if (implIors.length === 0) {
            const methTests = (methM.tests as string[]) || [];
            const testNote = methTests.length > 0 ? `open (Test ${methTests.map(t => short(ior(t))).join(',')} via Method — Impl missing)` : 'open';
            results.push({ chainName: reqName, req: 'check', uc: 'check', cls: 'check', method: methName, impl: `open expert ${short(methUuid)}`, test: testNote, complete: false,
              openNodes: [{ node: 'Impl', owner: 'expert', action: `Create Impl unit + add [impl:uuid:] for ${methName} + wire Method.implementations[]→Impl→tests[]`, iorShort: short(methUuid) }] });
            continue;
          }

          for (const implIorStr of implIors) {
            const implUuid = ior(implIorStr);
            const realImpl = hasRealImpl(implUuid);
            const implCell = realImpl ? `check ${short(implUuid)}` : `open expert ${short(implUuid)}`;
            const implM = this.model(implUuid);
            const testIors = implM ? ((implM.tests as string[]) || []) : [];
            const openNodes: OpenNode[] = [];

            if (!realImpl) openNodes.push({ node: 'Impl', owner: 'expert', action: `Add real [impl:uuid:${short(implUuid)}] in source`, iorShort: short(implUuid) });

            if (testIors.length === 0) {
              results.push({ chainName: reqName, req: 'check', uc: 'check', cls: 'check', method: methName, impl: implCell, test: 'open tester', complete: false,
                openNodes: [...openNodes, { node: 'Test', owner: 'tester', action: 'Add [test:uuid:] marker', iorShort: '' }] });
              continue;
            }

            for (const testIorStr of testIors) {
              const testUuid = ior(testIorStr);
              const realTest = hasRealTest(testUuid);
              const testCell = realTest ? `check ${short(testUuid)}` : `open tester ${short(testUuid)}`;
              const complete = realImpl && realTest;
              if (!realTest) openNodes.push({ node: 'Test', owner: 'tester', action: `Verify real [test:uuid:${short(testUuid)}] in test`, iorShort: short(testUuid) });
              results.push({ chainName: reqName, req: 'check', uc: 'check', cls: 'check', method: methName, impl: implCell, test: testCell, complete, openNodes });
            }
          }
        }
      }
    }

    return results.length > 0 ? results : [{ chainName: reqName, req: 'check', uc: 'open architect', cls: 'open', method: 'open', impl: 'open', test: 'open', complete: false,
      openNodes: [{ node: 'UC', owner: 'architect', action: 'Create UC', iorShort: short(reqUuid) }] }];
  }

  /** One summary row per req (dedup by method, first-incomplete representative) — canonical. */
  private summarize(reqUuid: string, hasRealImpl: (u: string) => boolean, hasRealTest: (u: string) => boolean): { row: ChainRow; isComplete: boolean } {
    const rows = this.walkReq(reqUuid, hasRealImpl, hasRealTest);
    const seen = new Set<string>();
    const dedupRows: ChainRow[] = [];
    for (const r of rows) {
      if (seen.has(r.method)) continue;
      seen.add(r.method);
      dedupRows.push(r);
    }
    const complete = dedupRows.filter(r => r.complete);
    const incomplete = dedupRows.filter(r => !r.complete);

    if (complete.length > 0 && incomplete.length === 0) {
      return { row: { ...complete[0], openNodes: [] }, isComplete: true };
    }
    if (dedupRows.length === 0) {
      const reqM = this.model(reqUuid);
      const reqName = String(reqM?.altId || reqM?.name || short(reqUuid));
      return { row: { chainName: reqName, req: 'check', uc: 'open architect', cls: 'open', method: 'open', impl: 'open', test: 'open', complete: false,
        openNodes: [{ node: 'UC', owner: 'architect', action: 'Create UC + wire chain', iorShort: short(reqUuid) }] }, isComplete: false };
    }
    const r = incomplete[0] || dedupRows[0];
    return { row: r, isComplete: false };
  }

  private findClassSourceFile(methodUuid: string): string {
    const methUnit = this.idx.get(methodUuid);
    const methName = methUnit ? String((methUnit.model as Record<string, unknown>).name || '') : '';
    for (const uuid of this.idx.list()) {
      const u = this.idx.get(uuid);
      if (!u || u.ior !== 'ior:class:Class') continue;
      const methods = (u.model as Record<string, unknown>).methods;
      if (Array.isArray(methods) && methods.some(m => ior(String(m)) === methodUuid)) {
        const sf = String((u.model as Record<string, unknown>).sourceFile || '');
        if (sf) return sf;
      }
    }
    const kebab = (methName.split('.')[0] || '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    return kebab ? `ior:file:src/ts/server/${kebab}.ts` : '';
  }

  // ── verbs ──────────────────────────────────────────────────────────────────

  /** Resolve a bare UUID prefix to the full UUID in the index */
  resolvePrefix(prefix: string): string | null {
    if (this.idx.has(prefix)) return prefix;
    return this.idx.list().find(u => u.startsWith(prefix)) || null;
  }

  /** Canonical chain completion — one summary row per Requirement (the ONLY completion measure) */
  followUp(reqUuids: string[], sprint?: string): FollowUpResult {
    const { included, excluded } = this.resolveReqSet(reqUuids, sprint);
    const { hasRealImpl, hasRealTest } = this.markerScanners();
    const rows: ChainRow[] = [];
    let complete = 0;
    for (const uuid of included) {
      const { row, isComplete } = this.summarize(uuid, hasRealImpl, hasRealTest);
      rows.push(row);
      if (isComplete) complete++;
    }
    return { rows, complete, total: included.length, excluded };
  }

  /** List the COMPLETE chain set (one diffable line per complete requirement) */
  listComplete(sprint?: string): CompleteEntry[] {
    const { included } = this.resolveReqSet([], sprint);
    const { hasRealImpl, hasRealTest } = this.markerScanners();
    const out: CompleteEntry[] = [];
    for (const uuid of included) {
      const { row, isComplete } = this.summarize(uuid, hasRealImpl, hasRealTest);
      if (!isComplete) continue;
      const m = this.model(uuid);
      out.push({
        chain: row.chainName,
        reqUuid: uuid,
        name: String(m?.name || ''),
        method: row.method,
        impl: row.impl.replace('check ', ''),
        test: row.test.replace('check ', ''),
      });
    }
    return out;
  }

  /** Render the canonical scoreboard (table + dispatch list + Summary line) as markdown */
  scoreboard(reqUuids: string[], sprint?: string): string {
    const { rows, complete, total, excluded } = this.followUp(reqUuids, sprint);
    const out: string[] = [];
    out.push(`\n# Chain Follow-Up Scoreboard (${total} requirements, excluded: ${excluded} orphanByDesign)\n`);
    out.push('| Chain | Req | UC | Class | Method | Impl | Test |');
    out.push('|-------|-----|-----|-------|--------|------|------|');
    const dispatch: { num: number; node: string; chain: string; action: string; owner: string }[] = [];
    let dispNum = 0;
    for (const r of rows) {
      out.push(`| ${r.chainName} | ${r.req} | ${r.uc} | ${r.cls} | ${r.method} | ${r.impl} | ${r.test} |`);
      for (const o of r.openNodes) dispatch.push({ num: ++dispNum, node: o.node, chain: r.chainName, action: o.action, owner: o.owner });
    }
    if (dispatch.length > 0) {
      out.push('\n## Dispatch List\n');
      out.push('| # | Node | Chain | Action | Owner |');
      out.push('|---|------|-------|--------|-------|');
      for (const d of dispatch) out.push(`| ${d.num} | ${d.node} | ${d.chain} | ${d.action} | **${d.owner}** |`);
    }
    out.push(`\n## Summary: ${complete}/${total} COMPLETE (excluded: ${excluded} orphanByDesign)`);
    if (complete === total && total > 0) out.push('ALL CHAINS CLOSED');
    return out.join('\n');
  }

  /** Wire Method→Impl→Test node: create Impl unit, move Method.tests[] to Impl (idempotent) */
  wireImplNode(methodUuid: string, dryRun?: boolean): WireResult {
    const resolved = this.resolvePrefix(methodUuid) || methodUuid;
    const methUnit = this.idx.get(resolved);
    if (!methUnit || methUnit.ior !== 'ior:class:Method') {
      return { methodUuid: resolved, methodName: '?', action: 'skipped', testsMoved: 0, sourceFile: '' };
    }
    const methModel = methUnit.model as Record<string, unknown>;
    const methName = String(methModel.name || resolved);
    const impls = (methModel.implementations as string[]) || [];

    if (impls.length > 0 && impls.every(i => this.idx.has(ior(i)))) {
      return { methodUuid: resolved, methodName: methName, action: 'already-wired', implUuid: ior(impls[0]), testsMoved: 0, sourceFile: '' };
    }

    const implUuid = crypto.randomUUID();
    const sourceFile = this.findClassSourceFile(resolved);
    const methTests = (methModel.tests as string[]) || [];

    if (!dryRun) {
      this.idx.put(implUuid, {
        ior: 'ior:class:Implementation',
        model: { uuid: implUuid, name: methName, sourceFile, tests: [...methTests] },
        ownerIor: null,
      });
      methModel.implementations = [...impls, `ior:instance:${implUuid}`];
      methModel.tests = [];
      this.idx.put(resolved, methUnit);
    }

    return { methodUuid: resolved, methodName: methName, action: 'created', implUuid, testsMoved: methTests.length, sourceFile: sourceFile.replace('ior:file:', '') };
  }

  /** Wire ALL Methods that have no Implementation node (batch wireImplNode) */
  wireAllMissing(dryRun?: boolean): WireResult[] {
    const methodUuids = this.idx.list().filter(uuid => {
      const u = this.idx.get(uuid);
      if (!u || u.ior !== 'ior:class:Method') return false;
      const impls = ((u.model as Record<string, unknown>).implementations as string[]) || [];
      return impls.length === 0;
    });
    return methodUuids.map(u => this.wireImplNode(u, dryRun));
  }

  /** Regenerate the full traceability matrix from canonical chain data */
  generateMatrix(matrixPath: string, sprint?: string): { rows: number; complete: number; total: number; excluded: number } {
    const result = this.followUp([], sprint);
    const lines = [
      '# RawBin Traceability Matrix',
      '',
      `> Generated by \`taskChain chain.generateMatrix\` — canonical source: Chain.followUp()`,
      `> ${new Date().toISOString().slice(0, 10)} | ${result.complete}/${result.total} COMPLETE (excluded: ${result.excluded} orphanByDesign)`,
      '',
      '| Chain | Req | UC | Class | Method | Impl | Test |',
      '|-------|-----|-----|-------|--------|------|------|',
    ];
    for (const r of result.rows) {
      lines.push(`| ${r.chainName} | ${r.req} | ${r.uc} | ${r.cls} | ${r.method} | ${r.impl} | ${r.test} |`);
    }
    lines.push('', `**Summary:** ${result.complete}/${result.total} COMPLETE (excluded: ${result.excluded} orphanByDesign)`);
    fs.writeFileSync(matrixPath, lines.join('\n'));
    return { rows: result.rows.length, complete: result.complete, total: result.total, excluded: result.excluded };
  }

  /** Update one requirement's row in the traceability matrix */
  updateMatrixRow(reqUuid: string, matrixPath: string): { updated: boolean; row: string } {
    const resolved = this.resolvePrefix(reqUuid) || reqUuid;
    const result = this.followUp([resolved]);
    if (result.rows.length === 0) return { updated: false, row: '' };
    const r = result.rows[0];
    const row = `| ${r.chainName} | ${r.req} | ${r.uc} | ${r.cls} | ${r.method} | ${r.impl} | ${r.test} |`;
    if (fs.existsSync(matrixPath)) {
      let content = fs.readFileSync(matrixPath, 'utf-8');
      const escapedName = r.chainName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const lineRe = new RegExp(`^\\|\\s*${escapedName}\\s*\\|.*$`, 'm');
      if (lineRe.test(content)) {
        content = content.replace(lineRe, row);
        fs.writeFileSync(matrixPath, content);
        return { updated: true, row };
      }
    }
    return { updated: false, row };
  }

  /** Tab-completion candidates for a verb's parameter (OOSH c2 contract) */
  complete(verb: string, param: string): string[] {
    if (param === 'sprint') {
      const nums = new Set<string>();
      for (const u of this.idx.list()) {
        if (this.unitType(u) !== 'Requirement') continue;
        const m = this.model(u);
        const t = String(m?.altId || '') + ' ' + String(m?.name || '');
        for (const match of t.matchAll(/R(\d+)\./g)) nums.add(`S${match[1]}`);
      }
      return [...nums].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }
    if (param === 'reqUuids' || param === 'reqUuid') {
      return this.idx.list().filter(u => this.unitType(u) === 'Requirement');
    }
    if (param === 'methodUuid') {
      return this.idx.list().filter(u => this.unitType(u) === 'Method');
    }
    if (param === 'matrixPath') return ['scrum.pmo/traceability-matrix.md'];
    return [];
  }
}

// --- Velocity class ---

export class Velocity {
  constructor(private repoDir: string, private chain: Chain) {}

  /** Chain completion + git throughput for a window (numerator = canonical Chain.followUp) */
  compute(since: string, sprint?: string): VelocityResult {
    const { complete, total, excluded } = this.chain.followUp([], sprint);
    const totalCommits = this.gitCount(since);
    const versionBumps = this.gitCount(since, 'v0\\.');
    const { first, last } = this.gitFirstLast(since);
    const hours = first && last ? Math.max(0.1, (new Date(last).getTime() - new Date(first).getTime()) / 3600_000) : 0.1;
    return { complete, total, excluded, totalCommits, versionBumps, hours, first, last };
  }

  /** Team velocity dashboard (markdown) — window via since (ISO) or hours (number), default last 24h */
  dashboard(since?: string, hours?: number, sprint?: string): string {
    let sinceDate: string;
    let windowLabel: string;
    if (since) {
      sinceDate = since;
      windowLabel = `--since ${since}`;
    } else if (hours !== undefined && !Number.isNaN(hours)) {
      sinceDate = new Date(Date.now() - hours * 3600_000).toISOString().slice(0, 19);
      windowLabel = `last ${hours}h`;
    } else {
      sinceDate = new Date(Date.now() - 24 * 3600_000).toISOString().slice(0, 19);
      windowLabel = 'last 24h (default)';
    }

    const r = this.compute(sinceDate, sprint);
    const remaining = r.total - r.complete;
    const pct = r.total > 0 ? ((r.complete / r.total) * 100).toFixed(1) : '0.0';
    const commitsPerHr = r.hours > 0 ? (r.totalCommits / r.hours).toFixed(1) : '0.0';
    const bumpsPerHr = r.hours > 0 ? (r.versionBumps / r.hours).toFixed(1) : '0.0';
    const velocityPerHr = r.hours > 0 ? (r.complete / r.hours).toFixed(2) : '0.00';

    const out: string[] = [];
    out.push(`\n# Team Velocity Dashboard`);
    out.push(`Window: ${windowLabel}`);
    out.push(`Period: ${r.first || sinceDate} → ${r.last || 'now'} (${r.hours.toFixed(1)}h)`);
    if (sprint) out.push(`Scope: ${sprint}`);
    out.push(`\n## Chain Completion (po.chainFollowUp canonical)`);
    out.push(`  Complete: ${r.complete}/${r.total} (${pct}%) — excluded: ${r.excluded} orphanByDesign`);
    out.push(`\n## Throughput`);
    out.push(`  Commits: ${r.totalCommits} (${commitsPerHr}/hr)`);
    out.push(`  Version bumps: ${r.versionBumps} (${bumpsPerHr}/hr)`);
    out.push(`\n## Session`);
    out.push(`  Duration: ${r.hours.toFixed(1)}h`);
    out.push(`  Velocity: ${velocityPerHr} chains/hr`);
    if (remaining > 0 && parseFloat(velocityPerHr) > 0) {
      const eta = remaining / parseFloat(velocityPerHr);
      out.push(`\n## Projection (ESTIMATE)`);
      out.push(`  Remaining: ${remaining} chains`);
      out.push(`  At current rate (${velocityPerHr}/hr): ~${eta.toFixed(1)}h to ${r.total}/${r.total}`);
      out.push(`  ⚠ Estimate based on current rate — not a commitment`);
    }
    out.push('');
    return out.join('\n');
  }

  /** Tab-completion candidates for a verb's parameter (OOSH c2 contract) */
  complete(verb: string, param: string): string[] {
    if (param === 'sprint') return this.chain.complete(verb, 'sprint');
    if (param === 'hours') return ['1', '5', '24'];
    return [];
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

export interface OpenNode { node: string; owner: string; action: string; iorShort: string; }

export interface ChainRow {
  chainName: string;
  req: string; uc: string; cls: string; method: string; impl: string; test: string;
  complete: boolean;
  openNodes: OpenNode[];
}

export interface FollowUpResult { rows: ChainRow[]; complete: number; total: number; excluded: number; }

export interface CompleteEntry {
  chain: string; reqUuid: string; name: string; method: string; impl: string; test: string;
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
