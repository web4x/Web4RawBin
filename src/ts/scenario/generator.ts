/**
 * T126 — ViewGenerator: reads scenario index, emits .md + .html views.
 * Generates planning.md per sprint, per-instance views, and sprint overview.
 * Files use SPEAKING names (task-1-team-bootstrap.md, not uuid.md).
 *
 * [impl:uuid:6315a667-59c4-420b-90db-f60bca2d315d] R17.7-R17.10
 */
import fs from 'node:fs';
import path from 'node:path';
import { type ScenarioUnit } from './types.js';
import { ScenarioIndex } from './index-store.js';
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

export class ViewGenerator {
  constructor(
    private index: ScenarioIndex,
    private registry: ViewTemplateRegistry,
    private outputDir: string,
  ) {}

  generateAll(): GenerateResult {
    const result: GenerateResult = { filesWritten: 0, errors: [] };
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

    for (const taskIor of taskIors) {
      const taskUuid = taskIor.replace('ior:instance:', '');
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
