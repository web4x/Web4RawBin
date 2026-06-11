/**
// [impl:uuid:bebc0b1d-d3c8-4b5b-aa95-dc3a94132f44] SkillExpert.coSpecify
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
 * [impl:uuid:dc43dd7a-7c82-46a0-a8c1-916b6e686ce9] skill-classes
 */
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ScenarioIndex } from './index.js';
import { captureQuote as t138CaptureQuote, proposeTask as t138ProposeTask, walkChain as t138WalkChain, statusTransition as t138StatusTransition, type TaskVerb, type ChainStep } from './skills.js';

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

  private walkMd(dir: string): string[] {
    const out: string[] = [];
    if (!fs.existsSync(dir)) return out;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name.startsWith('.')) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) out.push(...this.walkMd(full));
      else if (ent.name.endsWith('.md')) out.push(full);
    }
    return out;
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
  private walkReq(reqUuid: string, hasRealImpl: (u: string) => boolean, hasRealTest: (u: string) => boolean, implRefs: Map<string, number>): ChainRow[] {
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
            const refCount = implRefs.get(implUuid) || 0;
            if (refCount > 1) {
              // HARD RULE: one marker = one unit = one method. Shared Impl = NEVER credited.
              results.push({ chainName: reqName, req: 'check', uc: 'check', cls: 'check', method: methName, impl: `open expert shared-impl(x${refCount}) ${short(implUuid)}`, test: 'open', complete: false,
                openNodes: [{ node: 'Impl', owner: 'expert', action: `Impl ${short(implUuid)} shared by ${refCount} Methods — mint fresh uuid per method (HARD RULE: one marker=one unit=one method)`, iorShort: short(implUuid) }] });
              continue;
            }
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
  private summarize(reqUuid: string, hasRealImpl: (u: string) => boolean, hasRealTest: (u: string) => boolean, implRefs: Map<string, number>): { row: ChainRow; isComplete: boolean } {
    const rows = this.walkReq(reqUuid, hasRealImpl, hasRealTest, implRefs);
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
    const implRefs = this.implRefCounts();
    const rows: ChainRow[] = [];
    let complete = 0;
    for (const uuid of included) {
      const { row, isComplete } = this.summarize(uuid, hasRealImpl, hasRealTest, implRefs);
      rows.push(row);
      if (isComplete) complete++;
    }
    return { rows, complete, total: included.length, excluded };
  }

  /** List the COMPLETE chain set (one diffable line per complete requirement) */
  listComplete(sprint?: string): CompleteEntry[] {
    const { included } = this.resolveReqSet([], sprint);
    const { hasRealImpl, hasRealTest } = this.markerScanners();
    const implRefs = this.implRefCounts();
    const out: CompleteEntry[] = [];
    for (const uuid of included) {
      const { row, isComplete } = this.summarize(uuid, hasRealImpl, hasRealTest, implRefs);
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

  private implRefCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const u of this.idx.list()) {
      const unit = this.idx.get(u);
      if (!unit || unit.ior !== 'ior:class:Method') continue;
      for (const i of ((unit.model as Record<string, unknown>).implementations as string[]) || []) {
        const iu = ior(String(i));
        counts.set(iu, (counts.get(iu) || 0) + 1);
      }
    }
    return counts;
  }

  /** Lint chain markers: invented-suffix uuids, prefix collisions, shared Impls, orphan markers (catch BEFORE a re-measure) */
  lintMarkers(): LintFinding[] {
    const findings: LintFinding[] = [];
    const all = this.idx.list();
    const SENTINEL = /^0{8}-/; // RawBin system sentinel — exempt
    // (a) fabricated uuids: >=3 consecutive +0x11 byte steps (a1->b2->c3...) or fixed telltales
    const TELLTALE = /-(a1b2|b2c3|c3d4|d4e5|e5f6|a2b3|4c3d)-/;
    const isSequentialHex = (uuid: string): boolean => {
      const hex = uuid.replace(/-/g, '');
      const bytes: number[] = [];
      for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
      let run = 0;
      for (let i = 1; i < bytes.length; i++) {
        if (bytes[i] === bytes[i - 1] + 0x11) { run++; if (run >= 3) return true; }
        else run = 0;
      }
      return false;
    };
    for (const u of all) {
      if (SENTINEL.test(u)) continue;
      if (isSequentialHex(u) || TELLTALE.test(u)) findings.push({ kind: 'invented-suffix', uuid: u, detail: `${this.unitType(u)} uuid matches fabricated pattern (HARD RULE: uuidgen-fresh or verbatim copy only)` });
    }
    // (b) prefix-sibling families (same first-8 hex, >1 unit — minted siblings)
    const byPrefix = new Map<string, string[]>();
    for (const u of all) { const p = u.slice(0, 8); if (!byPrefix.has(p)) byPrefix.set(p, []); byPrefix.get(p)!.push(u); }
    for (const [prefix, us] of byPrefix) {
      if (us.length > 1) findings.push({ kind: 'prefix-collision', uuid: prefix, detail: us.map(u => `${this.unitType(u)}:${u}`).join(' | ') });
    }
    // (c) Impls referenced by >1 Method
    for (const [iu, n] of this.implRefCounts()) {
      if (n > 1) findings.push({ kind: 'shared-impl', uuid: iu, detail: `referenced by ${n} Methods — mint fresh uuid per method` });
    }
    // (d) markers in source/test with no unit on disk
    for (const [dir, prefix] of [[this.srcDir, 'impl'], [this.testDir, 'test']] as const) {
      for (const f of this.walkFiles(dir)) {
        const text = fs.readFileSync(f, 'utf-8');
        for (const m of text.matchAll(new RegExp(`\\[${prefix}:uuid:([0-9a-f-]{36})\\]`, 'gi'))) {
          if (!this.idx.has(m[1].toLowerCase())) findings.push({ kind: 'orphan-marker', uuid: m[1], detail: `[${prefix}:uuid:] in ${path.relative(this.srcDir + '/..', f)} has NO unit on disk` });
        }
      }
    }
    return findings;
  }

  /** Write a dated COMPLETE-set snapshot and name exactly which chains flipped vs the previous snapshot */
  snapshotComplete(dir?: string): string {
    const snapDir = dir || path.join(this.srcDir, '../scrum.pmo/chain-snapshots');
    fs.mkdirSync(snapDir, { recursive: true });
    const entries = this.listComplete();
    const stamp = new Date().toISOString().slice(0, 16).replace(':', '-');
    const file = path.join(snapDir, `${stamp}-listComplete.tsv`);
    const keys = ['chain', 'reqUuid', 'name', 'method', 'impl', 'test'];
    const tsv = [keys.join('\t'), ...entries.map(e => keys.map(k => String((e as unknown as Record<string, unknown>)[k] ?? '')).join('\t'))].join('\n');
    const prior = fs.readdirSync(snapDir).filter(f => f.endsWith('-listComplete.tsv') && path.join(snapDir, f) !== file).sort().pop();
    fs.writeFileSync(file, tsv);
    const out: string[] = [`# COMPLETE-set snapshot: ${entries.length} chains -> ${path.relative(process.cwd(), file)}`];
    if (prior) {
      const prevLines = fs.readFileSync(path.join(snapDir, prior), 'utf-8').split('\n').slice(1).filter(Boolean);
      const prevSet = new Set(prevLines.map(l => l.split('\t')[1]));
      const nowSet = new Set(entries.map(e => e.reqUuid));
      const added = entries.filter(e => !prevSet.has(e.reqUuid));
      const removed = prevLines.filter(l => !nowSet.has(l.split('\t')[1]));
      out.push(`vs ${prior}: +${added.length} / -${removed.length}`);
      for (const a of added) out.push(`  + ${a.chain} (${a.reqUuid.slice(0, 8)})`);
      for (const r of removed) out.push(`  - ${r.split('\t')[0]} (${r.split('\t')[1].slice(0, 8)})`);
      if (added.length === 0 && removed.length === 0) out.push('  (no flips)');
    } else {
      out.push('(first snapshot — no prior to diff)');
    }
    return out.join('\n');
  }

  /** Rename a uuid VERBATIM everywhere: unit file, all referencing units, source/test markers (HARD-RULE-safe) */
  renameUuid(oldUuid: string, newUuid?: string): RenameResult {
    const resolved = this.resolvePrefix(oldUuid);
    if (!resolved) return { old: oldUuid, new: '', unitsRewritten: 0, filesRewritten: 0, error: 'old uuid not found' };
    const fresh = newUuid || crypto.randomUUID();
    if (this.idx.has(fresh)) return { old: resolved, new: fresh, unitsRewritten: 0, filesRewritten: 0, error: 'new uuid already exists' };
    // 1) move the unit itself
    const unit = this.idx.get(resolved)!;
    const json = JSON.stringify(unit).split(resolved).join(fresh);
    this.idx.put(fresh, JSON.parse(json));
    this.idx.remove(resolved);
    // 2) rewrite every referencing unit (verbatim full-uuid replace)
    let unitsRewritten = 0;
    for (const u of this.idx.list()) {
      if (u === fresh) continue;
      const other = this.idx.get(u);
      if (!other) continue;
      const raw = JSON.stringify(other);
      if (!raw.includes(resolved)) continue;
      this.idx.put(u, JSON.parse(raw.split(resolved).join(fresh)));
      unitsRewritten++;
    }
    // 3) rewrite source + test markers AND scrum.pmo md cross-references (NOT chain-snapshots — history)
    let filesRewritten = 0;
    const docsDir = path.join(this.srcDir, '../scrum.pmo');
    const mdFiles = fs.existsSync(docsDir)
      ? this.walkMd(docsDir).filter(f => !f.includes('chain-snapshots'))
      : [];
    for (const f of [...this.walkFiles(this.srcDir), ...this.walkFiles(this.testDir), ...mdFiles]) {
      const text = fs.readFileSync(f, 'utf-8');
      if (!text.includes(resolved)) continue;
      fs.writeFileSync(f, text.split(resolved).join(fresh));
      filesRewritten++;
    }
    return { old: resolved, new: fresh, unitsRewritten, filesRewritten };
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

// --- Scenario class (T138 skills — finally exposed as Object.verb) ---

export class Scenario {
  constructor(private idx: ScenarioIndex) {}

  /** Capture a verbatim Tron quote as a scenario unit linked to its sprint (and optional task) */
  captureQuote(text: string, sprintIor: string, taskIor?: string): { ior: string; links: string[] } {
    const r = t138CaptureQuote(this.idx, text, sprintIor, taskIor);
    return { ior: r.ior, links: r.links };
  }

  /** Propose a new Task unit under a requirement (name + description + sprint) */
  proposeTask(requirementIor: string, name: string, description: string, sprintIor: string, assigned?: string, effort?: string): { ior: string; links: string[] } {
    const r = t138ProposeTask(this.idx, requirementIor, { name, description, sprintIor, assigned, effort });
    return { ior: r.ior, links: r.links };
  }

  /** Walk the chain from a unit (down/up/both, depth-limited) — returns flat steps */
  walkChain(startIor: string, direction?: string, maxDepth?: number): ChainStep[] {
    const dir = (direction === 'down' || direction === 'up') ? direction : 'both';
    return t138WalkChain(this.idx, startIor, dir, maxDepth ?? 10);
  }

  /** Transition a Task through its FSM (startRefinement|startCreatingTestCases|startImplementing|startTesting|requestQAReview|tronApprove) */
  statusTransition(taskIor: string, verb: string, tronCommitRef?: string): { ior: string; links: string[] } {
    const r = t138StatusTransition(this.idx, taskIor, verb as TaskVerb, tronCommitRef ? { tronCommitRef } : undefined);
    return { ior: r.ior, links: r.links };
  }

  /** Tab-completion candidates for a verb's parameter (OOSH c2 contract) */
  complete(verb: string, param: string): string[] {
    if (param === 'verb') return ['startRefinement', 'startCreatingTestCases', 'startImplementing', 'startTesting', 'requestQAReview', 'tronApprove'];
    if (param === 'direction') return ['down', 'up', 'both'];
    if (param === 'sprintIor' ) return this.idx.list().filter(u => { const x = this.idx.get(u); return x?.ior === 'ior:class:Sprint'; });
    if (param === 'requirementIor') return this.idx.list().filter(u => { const x = this.idx.get(u); return x?.ior === 'ior:class:Requirement'; });
    if (param === 'taskIor' || param === 'startIor') return this.idx.list().filter(u => { const x = this.idx.get(u); return x?.ior === 'ior:class:Task'; });
    return [];
  }
}

// --- Rules class (team protocol rules, Tab-discoverable) ---

export class Rules {
  constructor(private skillsDir: string) {}

  private ruleFiles(): string[] {
    if (!fs.existsSync(this.skillsDir)) return [];
    return fs.readdirSync(this.skillsDir).filter(f => /^(rule|ship|verify)-.*\.md$/.test(f)).sort();
  }

  /** List all team protocol rules (rule-*, ship-*, verify-*) with their one-line hooks */
  list(): { name: string; title: string; hook: string }[] {
    return this.ruleFiles().map(f => {
      const text = fs.readFileSync(path.join(this.skillsDir, f), 'utf-8');
      const lines = text.split('\n');
      const title = (lines.find(l => l.startsWith('#')) || '').replace(/^#+\s*/, '');
      const hook = lines.find(l => l.trim() && !l.startsWith('#'))?.trim() || '';
      return { name: f.replace(/\.md$/, ''), title, hook: hook.slice(0, 110) };
    });
  }

  /** Show one rule's full text by name (Tab-completes over all rules) */
  show(name: string): string {
    const f = path.join(this.skillsDir, `${name.replace(/\.md$/, '')}.md`);
    if (!fs.existsSync(f)) return `Unknown rule '${name}'. Run: rules.list`;
    return fs.readFileSync(f, 'utf-8');
  }

  /** Tab-completion candidates for a verb's parameter (OOSH c2 contract) */
  complete(verb: string, param: string): string[] {
    if (param === 'name') return this.ruleFiles().map(f => f.replace(/\.md$/, ''));
    return [];
  }
}

// --- Audit class (CI gates as verbs — thin dispatch to the gate scripts) ---

export class Audit {
  constructor(private repoDir: string) {}

  private npmRun(script: string): string {
    try {
      const out = execSync(`npm run ${script}`, { encoding: 'utf-8', cwd: path.resolve(this.repoDir), timeout: 300000 });
      return `PASS — ${script}\n${out}`;
    } catch (e) {
      const err = e as { stdout?: string; stderr?: string };
      return `FAIL — ${script}\n${err.stdout || ''}${err.stderr || ''}`;
    }
  }

  /** Structural trace audit, strict mode (orphans, back-refs, cardinality) — dispatches trace:audit:strict */
  strict(): string { return this.npmRun('trace:audit:strict'); }

  /** Ship rule-pair gate #66/#67 (version bump + STATIC_SHELL) — dispatches rule-pair:strict */
  rulePair(): string { return this.npmRun('rule-pair:strict'); }

  /** Sprint markdown consistency check — dispatches check:sprint-md */
  sprintMd(): string { return this.npmRun('check:sprint-md'); }

  /** Tab-completion candidates for a verb's parameter (OOSH c2 contract) */
  complete(): string[] { return []; }
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

export interface LintFinding { kind: string; uuid: string; detail: string; }

export interface RenameResult { old: string; new: string; unitsRewritten: number; filesRewritten: number; error?: string; }

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
