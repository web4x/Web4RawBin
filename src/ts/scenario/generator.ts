/**
// [impl:uuid:7958f8bf-25de-43e2-a022-287c809d84cb] SpeakingTree.symlinkJson(sprint
// [impl:uuid:b9fa3577-1479-40e1-8e63-88c07c979cce] SpeakingTree.generateMd(sprint
// [impl:uuid:7bab1a71-8d2e-4d19-bd4a-ce5547291b03] SpeakingTree.symlinkJson(sprint
// [impl:uuid:e80ca651-5441-4a2c-948a-1ba0b8ae0944] SpeakingTree.generateMd(sprint
 * T126 — ViewGenerator: reads scenario index, emits .md + .html views.
 * Generates planning.md per sprint, per-instance views, and sprint overview.
 * Files use SPEAKING names (task-1-team-bootstrap.md, not uuid.md).
 *
 * [impl:uuid:f388c185-1352-45c5-9bc2-ff91417061e6] R17.7-R17.10
 */
// [impl:uuid:fef8a6d5-2a23-4be8-8075-3eae9f699472] SpeakingTree.generateMd(sprint
// [impl:uuid:e420b8b7-fa4a-4b95-8279-c9a45feadc14] SpeakingTree.generateMd(sprint
// [impl:uuid:b539d1d8-5cc9-488e-bb18-160ee73f5a56] SpeakingTree.symlinkJson(sprint
// [impl:uuid:1b3f2848-785c-46c9-9a42-4abbf8bfbe3a] SpeakingTree.symlinkJson(sprint
import fs from 'node:fs';
import path from 'node:path';
import { type ScenarioUnit } from './types.js';
import { ScenarioIndex } from './index-store.js';
import { setActiveResolver } from './templates.js';
import { type ViewTemplateRegistry } from './templates.js';

export interface GenerateResult {
  filesWritten: number;
  errors: string[];
}

function speakingName(unit: ScenarioUnit): string {
  const slug = unit.model.slug as string;
  if (slug) return slug;
  const name = String(unit.model.name || unit.model.uuid || 'untitled');
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

// [impl:uuid:68a3d760-09fb-4b1a-96e9-f5df97282c86] SpeakingTree.extendClasses
export class ViewGenerator {
  constructor(
    private index: ScenarioIndex,
    private registry: ViewTemplateRegistry,
    private outputDir: string,
  ) {}

  generateAll(): GenerateResult {
    const result: GenerateResult = { filesWritten: 0, errors: [] };
    const idx = this.index;
    setActiveResolver((uuid) => {
      const u = idx.get(uuid);
      if (!u) return null;
      const name = (u.model.name as string) || uuid.slice(0, 8);
      const slug = (u.model.slug as string) || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
      const type = u.ior.replace('ior:class:', '').toLowerCase();
      return { slug, type, name };
    });
    const uuids = this.index.list();
    const sprints: ScenarioUnit[] = [];
    const allUnits: ScenarioUnit[] = [];

    for (const uuid of uuids) {
      const unit = this.index.get(uuid);
      if (!unit) { result.errors.push(`Failed to load ${uuid}`); continue; }
      allUnits.push(unit);

      const md = this.registry.renderMd(unit);
      const html = this.registry.renderHtml(unit);
      const slug = speakingName(unit);
      const classType = unit.ior.replace('ior:class:', '').toLowerCase();

      const dir = path.join(this.outputDir, classType);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${slug}.md`), md);
      fs.writeFileSync(path.join(dir, `${slug}.html`), html);
      result.filesWritten += 2;

      if (unit.ior === 'ior:class:Sprint') sprints.push(unit);
    }

    if (sprints.length > 0) {
      this.generateSprintOverview(sprints, result);
      for (const sprint of sprints) this.generatePlanningMd(sprint, allUnits, result);
    }

    return result;
  }

  private generateSprintOverview(sprints: ScenarioUnit[], result: GenerateResult): void {
    const lines = ['# Sprint Overview\n'];
    const sorted = [...sprints].sort((a, b) => ((a.model.number as number) || 0) - ((b.model.number as number) || 0));
    for (const s of sorted) {
      const m = s.model as Record<string, unknown>;
      const slug = speakingName(s);
      lines.push(`- [${m.name || '(untitled)'}](./sprint/${slug}.md) — ${m.status || 'PLANNED'}`);
    }
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(path.join(this.outputDir, 'overview.md'), lines.join('\n'));
    result.filesWritten++;
  }

  private generatePlanningMd(sprint: ScenarioUnit, allUnits: ScenarioUnit[], result: GenerateResult): void {
    const m = sprint.model as Record<string, unknown>;
    const taskIors = (m.tasks as string[]) || [];
    const sprintSlug = speakingName(sprint);
    const lines = [
      `# Sprint ${m.number || '?'} Planning — ${m.name || '(untitled)'}`,
      '',
      `## Sprint Goal`,
      '',
      String(m.goal || ''),
      '',
      `**Status:** ${m.status || 'PLANNED'}`,
      '',
      '## Tasks',
      '',
    ];

    const unitByUuid = new Map<string, ScenarioUnit>();
    for (const u of allUnits) unitByUuid.set(u.model.uuid as string, u);

    // Build set of UUIDs that are children of another task — skip them at top level
    const childUuids = new Set<string>();
    for (const taskIor of taskIors) {
      const taskUuid = taskIor.replace('ior:instance:', '');
      const taskUnit = unitByUuid.get(taskUuid);
      if (taskUnit) {
        for (const cIor of ((taskUnit.model.children as string[]) || [])) {
          childUuids.add(cIor.replace('ior:instance:', ''));
        }
      }
    }

    for (const taskIor of taskIors) {
      const taskUuid = taskIor.replace('ior:instance:', '');
      if (childUuids.has(taskUuid)) continue;
      const taskUnit = unitByUuid.get(taskUuid);
      if (taskUnit) {
        this.renderTaskLine(taskUnit, unitByUuid, lines, 0);
      } else {
        lines.push(`- [ ] ${taskIor} *(not found)*`);
      }
    }

    fs.mkdirSync(path.join(this.outputDir, 'sprint'), { recursive: true });
    fs.writeFileSync(path.join(this.outputDir, 'sprint', `${sprintSlug}-planning.md`), lines.join('\n'));
    result.filesWritten++;
  }

  private renderTaskLine(unit: ScenarioUnit, byUuid: Map<string, ScenarioUnit>, lines: string[], depth: number): void {
    const tm = unit.model as Record<string, unknown>;
    const done = String(tm.status || '').toLowerCase() === 'done';
    const slug = speakingName(unit);
    const indent = '  '.repeat(depth);
    lines.push(`${indent}- [${done ? 'x' : ' '}] [${tm.name || slug}](../task/${slug}.md)`);

    const children = (tm.children as string[]) || [];
    for (const childIor of children) {
      const childUuid = childIor.replace('ior:instance:', '');
      const childUnit = byUuid.get(childUuid);
      if (childUnit) this.renderTaskLine(childUnit, byUuid, lines, depth + 1);
    }
  }

  generateOne(uuid: string): { md: string; html: string } | null {
    const unit = this.index.get(uuid);
    if (!unit) return null;
    return { md: this.registry.renderMd(unit), html: this.registry.renderHtml(unit) };
  }
}
