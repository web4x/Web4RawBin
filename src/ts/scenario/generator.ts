/**
 * T126 — ViewGenerator: reads scenario index, emits .md + .html views.
 * Generates planning.md per sprint, per-instance views, and sprint overview.
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

    for (const uuid of uuids) {
      const unit = this.index.get(uuid);
      if (!unit) { result.errors.push(`Failed to load ${uuid}`); continue; }

      const md = this.registry.renderMd(unit);
      const html = this.registry.renderHtml(unit);
      const unitUuid = (unit.model.uuid as string) || uuid;
      const classType = unit.ior.replace('ior:class:', '').toLowerCase();

      fs.mkdirSync(path.join(this.outputDir, classType), { recursive: true });
      fs.writeFileSync(path.join(this.outputDir, classType, `${unitUuid}.md`), md);
      fs.writeFileSync(path.join(this.outputDir, classType, `${unitUuid}.html`), html);
      result.filesWritten += 2;

      if (unit.ior === 'ior:class:Sprint') sprints.push(unit);
    }

    if (sprints.length > 0) {
      this.generateSprintOverview(sprints, result);
      for (const sprint of sprints) this.generatePlanningMd(sprint, result);
    }

    return result;
  }

  private generateSprintOverview(sprints: ScenarioUnit[], result: GenerateResult): void {
    const lines = ['# Sprint Overview\n'];
    const sorted = [...sprints].sort((a, b) => ((a.model.number as number) || 0) - ((b.model.number as number) || 0));
    for (const s of sorted) {
      const m = s.model as Record<string, unknown>;
      const uuid = m.uuid as string || '';
      lines.push(`- [${m.name || '(untitled)'}](./sprint/${uuid}.md) — ${m.status || 'PLANNED'}`);
    }
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(path.join(this.outputDir, 'overview.md'), lines.join('\n'));
    result.filesWritten++;
  }

  private generatePlanningMd(sprint: ScenarioUnit, result: GenerateResult): void {
    const m = sprint.model as Record<string, unknown>;
    const tasks = (m.tasks as string[]) || [];
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

    for (const taskIor of tasks) {
      const taskUuid = taskIor.replace('ior:instance:', '');
      const taskUnit = this.index.get(taskUuid);
      if (taskUnit) {
        const tm = taskUnit.model as Record<string, unknown>;
        const done = String(tm.status || '').toLowerCase() === 'done';
        lines.push(`- [${done ? 'x' : ' '}] [${tm.name || taskUuid}](./${taskUuid}.md)`);
      } else {
        lines.push(`- [ ] ${taskIor} *(not found)*`);
      }
    }

    const sprintUuid = (m.uuid as string) || '';
    fs.mkdirSync(path.join(this.outputDir, 'sprint'), { recursive: true });
    fs.writeFileSync(path.join(this.outputDir, 'sprint', `${sprintUuid}-planning.md`), lines.join('\n'));
    result.filesWritten++;
  }

  generateOne(uuid: string): { md: string; html: string } | null {
    const unit = this.index.get(uuid);
    if (!unit) return null;
    return { md: this.registry.renderMd(unit), html: this.registry.renderHtml(unit) };
  }
}
