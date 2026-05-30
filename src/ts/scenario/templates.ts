/**
 * T125.4 — ViewTemplateRegistry: per-class HTML+MD renderers.
 * Pure functions: template(scenario) → string. No DOM state.
 *
 * [impl:uuid:20cca741-0a93-4d93-8a51-9c72bdb77d92] R17.6
 */
import { type ScenarioUnit } from './types.js';

export interface ViewTemplate {
  renderHtml(scenario: ScenarioUnit): string;
  renderMd(scenario: ScenarioUnit): string;
}

export class ViewTemplateRegistry {
  private templates = new Map<string, ViewTemplate>();

  register(classIor: string, template: ViewTemplate): this {
    this.templates.set(classIor, template);
    return this;
  }

  resolve(classIor: string): ViewTemplate | undefined {
    return this.templates.get(classIor);
  }

  renderHtml(scenario: ScenarioUnit): string {
    const tmpl = this.resolve(scenario.ior);
    if (!tmpl) return `<div class="sv-unknown">No template for ${esc(scenario.ior)}</div>`;
    return tmpl.renderHtml(scenario);
  }

  renderMd(scenario: ScenarioUnit): string {
    const tmpl = this.resolve(scenario.ior);
    if (!tmpl) return `> No template for ${scenario.ior}`;
    return tmpl.renderMd(scenario);
  }

  has(classIor: string): boolean {
    return this.templates.has(classIor);
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

export const TaskTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-task"><h3>${esc(String(m.name || ''))}</h3><p>${esc(String(m.description || ''))}</p><span class="sv-status">${esc(String(m.status || ''))}</span></div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `### ${m.name || '(untitled)'}\n\n${m.description || ''}\n\n**Status:** ${m.status || 'PLANNED'}`;
  },
};

export const RequirementTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-requirement"><h3>${esc(String(m.name || ''))}</h3><p>${esc(String(m.description || ''))}</p><span class="sv-priority">${esc(String(m.priority || ''))}</span></div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `### ${m.name || '(untitled)'}\n\n${m.description || ''}\n\n**Priority:** ${m.priority || 'MEDIUM'}`;
  },
};

export const SprintTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-sprint"><h2>${esc(String(m.name || ''))}</h2><p>${esc(String(m.goal || ''))}</p><span class="sv-status">${esc(String(m.status || ''))}</span></div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `## ${m.name || '(untitled)'}\n\n${m.goal || ''}\n\n**Status:** ${m.status || 'PLANNED'}`;
  },
};

export function defaultTemplateRegistry(): ViewTemplateRegistry {
  const reg = new ViewTemplateRegistry();
  reg.register('ior:class:Task', TaskTemplate);
  reg.register('ior:class:Requirement', RequirementTemplate);
  reg.register('ior:class:Sprint', SprintTemplate);
  return reg;
}
