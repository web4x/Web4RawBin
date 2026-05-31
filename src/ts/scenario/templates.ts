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

export function renderStatusHtml(checklist: string): string {
  if (!checklist) return '';
  const lines = checklist.split('\n').filter(l => l.trim());
  let html = '<div class="sv-section sv-status-checklist"><h3>Status</h3><ul class="sv-steps">';
  let inSub = false;
  for (const line of lines) {
    if (line.trimStart().startsWith('>')) continue;
    if (!/\[.\]/.test(line)) continue;
    const indent = line.search(/\S/);
    const nested = indent >= 2;
    const checked = /\[x\]/i.test(line);
    const label = line.replace(/^[\s-]*\[.\]\s*/, '').trim();
    if (!label) continue;
    if (nested && !inSub) { html += '<ul class="sv-substeps">'; inSub = true; }
    if (!nested && inSub) { html += '</ul>'; inSub = false; }
    const icon = checked ? '✅' : '⬜';
    const cls = checked ? 'sv-checked' : 'sv-unchecked';
    html += `<li class="${cls}">${icon} ${esc(label)}</li>`;
  }
  if (inSub) html += '</ul>';
  html += '</ul></div>';
  return html;
}

export const TaskTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const sections: string[] = [
      `<div class="sv-header"><span class="sv-type-badge">Task</span><h2>${esc(String(m.name || ''))}</h2><code>${esc(String(m.uuid || ''))}</code></div>`,
    ];
    if (m.statusChecklist) sections.push(renderStatusHtml(String(m.statusChecklist)));
    if (m.remainingIssues) sections.push(`<div class="sv-section"><h3>Remaining Issues</h3><p>${esc(String(m.remainingIssues))}</p></div>`);
    if (m.traceability) sections.push(`<div class="sv-section"><h3>Traceability</h3><pre>${esc(String(m.traceability))}</pre></div>`);
    if (m.description) sections.push(`<div class="sv-section"><h3>Task Description</h3><p>${esc(String(m.description))}</p></div>`);
    if (m.context) sections.push(`<div class="sv-section"><h3>Context</h3><p>${esc(String(m.context))}</p></div>`);
    if (m.intention) sections.push(`<div class="sv-section"><h3>Intention</h3><p>${esc(String(m.intention))}</p></div>`);
    if (m.acceptanceCriteria) sections.push(`<div class="sv-section"><h3>Acceptance Criteria</h3><pre>${esc(String(m.acceptanceCriteria))}</pre></div>`);
    if (m.qaAudit) sections.push(`<div class="sv-section"><h3>QA Audit &amp; User Feedback</h3><p>${esc(String(m.qaAudit))}</p></div>`);
    if (m.subtasks) sections.push(`<div class="sv-section"><h3>Subtasks</h3><p>${esc(String(m.subtasks))}</p></div>`);
    return `<div class="sv-task">${sections.join('\n')}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const lines = [`# ${m.name || '(untitled)'}`, `[task:uuid:${m.uuid || ''}]`, ''];
    if (m.statusChecklist) lines.push('## Status', '', String(m.statusChecklist), '');
    if (m.remainingIssues) lines.push('## Remaining Issues', '', String(m.remainingIssues), '');
    if (m.traceability) lines.push('## Traceability', '', String(m.traceability), '');
    if (m.description) lines.push('## Task Description', '', String(m.description), '');
    if (m.context) lines.push('## Context', '', String(m.context), '');
    if (m.intention) lines.push('## Intention', '', String(m.intention), '');
    if (m.acceptanceCriteria) lines.push('## Acceptance Criteria', '', String(m.acceptanceCriteria), '');
    if (m.qaAudit) lines.push('## QA Audit & User Feedback', '', String(m.qaAudit), '');
    if (m.subtasks) lines.push('## Subtasks', '', String(m.subtasks), '');
    return lines.join('\n');
  },
};

export const RequirementTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const status = m.statusChecklist ? renderStatusHtml(String(m.statusChecklist)) : '';
    return `<div class="sv-requirement"><h3>${esc(String(m.name || ''))}</h3><p>${esc(String(m.description || ''))}</p><span class="sv-priority">${esc(String(m.priority || ''))}</span>${status}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `### ${m.name || '(untitled)'}\n\n${m.description || ''}\n\n**Priority:** ${m.priority || 'MEDIUM'}`;
  },
};

export const SprintTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const status = m.statusChecklist ? renderStatusHtml(String(m.statusChecklist)) : `<span class="sv-status">${esc(String(m.status || ''))}</span>`;
    return `<div class="sv-sprint"><h2>${esc(String(m.name || ''))}</h2><p>${esc(String(m.goal || ''))}</p>${status}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `## ${m.name || '(untitled)'}\n\n${m.goal || ''}\n\n**Status:** ${m.status || 'PLANNED'}`;
  },
};

export const UseCaseTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const src = m.source as Record<string, unknown> | undefined;
    const srcHtml = src ? `<div class="sv-source"><a href="/edit/${esc(String(src.file || ''))}#L${(src.lines as number[])?.[0] || 1}">${esc(String(src.file || ''))}</a> <span class="sv-commit">@${esc(String(src.commit || ''))}</span></div>` : '';
    return `<div class="sv-usecase"><h3>${esc(String(m.name || ''))}</h3><code>${esc(String(m.object || ''))}.${esc(String(m.verb || ''))}</code>${srcHtml}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const src = m.source as Record<string, unknown> | undefined;
    const srcMd = src ? `\n\n**Source:** \`${src.file || ''}\` lines ${(src.lines as number[])?.[0] || '?'}-${(src.lines as number[])?.[1] || '?'} @${src.commit || '?'}` : '';
    return `### ${m.name || '(untitled)'}\n\n\`${m.object || ''}.${m.verb || ''}\`${srcMd}`;
  },
};

export const ClassTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-class"><h3>${esc(String(m.name || ''))}</h3><code>${esc(String(m.file || ''))}</code></div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `### ${m.name || '(untitled)'}\n\n**File:** \`${m.file || ''}\``;
  },
};

export const MethodTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-method"><h3>${esc(String(m.name || ''))}</h3></div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `### ${m.name || '(untitled)'}`;
  },
};

export const TestTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-test"><h3>${esc(String(m.name || ''))}</h3><span class="sv-status">${esc(String(m.status || ''))}</span><code>${esc(String(m.file || ''))}</code></div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `### ${m.name || '(untitled)'}\n\n**Status:** ${m.status || 'PENDING'} · **File:** \`${m.file || ''}\``;
  },
};

export const TraceLinkTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-tracelink"><span class="sv-relation">${esc(String(m.relation || ''))}</span> <span class="sv-from">${esc(String(m.fromType || ''))}:${esc(String(m.from || '').slice(13, 21))}</span> → <span class="sv-to">${esc(String(m.toType || ''))}:${esc(String(m.to || '').slice(13, 21))}</span>${m.label ? `<p class="sv-label">${esc(String(m.label))}</p>` : ''}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `### ${m.relation || 'link'}: ${m.fromType || '?'} → ${m.toType || '?'}\n\n${m.label || ''}`;
  },
};

export function defaultTemplateRegistry(): ViewTemplateRegistry {
  const reg = new ViewTemplateRegistry();
  reg.register('ior:class:Sprint', SprintTemplate);
  reg.register('ior:class:Task', TaskTemplate);
  reg.register('ior:class:Requirement', RequirementTemplate);
  reg.register('ior:class:UseCase', UseCaseTemplate);
  reg.register('ior:class:Class', ClassTemplate);
  reg.register('ior:class:Method', MethodTemplate);
  reg.register('ior:class:Test', TestTemplate);
  reg.register('ior:class:TraceLink', TraceLinkTemplate);
  return reg;
}
