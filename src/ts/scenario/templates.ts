/**
 * T125.4 — ViewTemplateRegistry: per-class HTML+MD renderers.
 * Pure functions: template(scenario) → string. No DOM state.
 *
 * [impl:uuid:8c72876c-05a5-467d-a1da-2b14a4a7b40d] R17.6
 */
// [impl:uuid:1d2024fb-f7be-4bd8-b452-b154b0150ee3] ViewTemplateRegistry.register(className
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

function speakingSlug(unit: ScenarioUnit): string {
  const slug = unit.model.slug as string;
  if (slug) return slug;
  const name = String(unit.model.name || unit.model.uuid || 'untitled');
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

const CHAIN_FIELDS = ['requirements', 'tasks', 'useCases', 'classes', 'methods', 'implementations', 'tests', 'children'];

export type SlugResolver = (uuid: string) => { slug: string; type: string; name: string } | null;

let _activeResolver: SlugResolver | undefined;
export function setActiveResolver(r: SlugResolver | undefined): void { _activeResolver = r; }

function renderChainLinkMd(ior: string, resolve?: SlugResolver): string {
  const uuid = ior.replace('ior:instance:', '');
  const info = resolve?.(uuid);
  if (info) return `[🔗 ${info.name}](../${info.type}/${info.slug}.md)`;
  return `[🔗 ${uuid.slice(0, 8)}](/scenario?ior=${encodeURIComponent(uuid)})`;
}

function renderChainLinkHtml(ior: string, resolve?: SlugResolver): string {
  const uuid = ior.replace('ior:instance:', '');
  const info = resolve?.(uuid);
  if (info) return `<a href="/md/scenario/sprints.md/${info.type}/${info.slug}.md" class="chain-link">🔗 ${esc(info.name)}</a>`;
  return `<a href="/scenario?ior=${encodeURIComponent(uuid)}" class="chain-link">🔗 ${esc(uuid.slice(0, 8))}</a>`;
}

export function renderChainSection(model: Record<string, unknown>, format: 'md' | 'html', resolve?: SlugResolver): string {
  const render = (ior: string) => format === 'md' ? renderChainLinkMd(ior, resolve) : renderChainLinkHtml(ior, resolve);
  const sections: string[] = [];
  for (const field of CHAIN_FIELDS) {
    const arr = model[field] as string[] | undefined;
    if (!arr?.length) continue;
    const label = field.charAt(0).toUpperCase() + field.slice(1);
    const items = arr.filter(i => typeof i === 'string' && i.startsWith('ior:instance:')).map(i => render(i));
    if (!items.length) continue;
    if (format === 'md') {
      sections.push(`**${label}:**`, ...items.map(i => `- ${i}`), '');
    } else {
      sections.push(`<div class="sv-chain-group"><h4>${label}</h4>${items.map(i => `<div class="sv-chain-item">${i}</div>`).join('')}</div>`);
    }
  }
  if (!sections.length) return '';
  return format === 'md' ? `## Traceability\n\n${sections.join('\n')}` : `<div class="sv-section sv-trace-tree"><h3>Traceability</h3>${sections.join('')}</div>`;
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
    const chainHtml = renderChainSection(m, 'html', _activeResolver);
    if (chainHtml) sections.push(chainHtml);
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
    const chainMd = renderChainSection(m, 'md', _activeResolver);
    if (chainMd) lines.push(chainMd, '');
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
    const name = esc(String(m.name || 'Untitled'));
    const desc = esc(String(m.description || ''));
    const status = m.statusChecklist ? renderStatusHtml(String(m.statusChecklist)) : '';
    const details = desc ? `<details><summary>Tron directive</summary><blockquote>${desc}</blockquote></details>` : '';
    return `<div class="sv-requirement"><h3>${name}</h3>${details}${status}${renderChainSection(m, 'html', _activeResolver)}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const name = String(m.name || '(untitled)');
    const desc = String(m.description || '');
    const chain = renderChainSection(m, 'md', _activeResolver);
    const details = desc ? `\n\n<details><summary>Tron directive</summary>\n\n> ${desc.split('\n').join('\n> ')}\n\n</details>` : '';
    return `### ${name}${details}${chain ? '\n\n' + chain : ''}`;
  },
};

export const SprintTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const status = m.statusChecklist ? renderStatusHtml(String(m.statusChecklist)) : `<span class="sv-status">${esc(String(m.status || ''))}</span>`;
    return `<div class="sv-sprint"><h2>${esc(String(m.name || ''))}</h2><p>${esc(String(m.goal || ''))}</p>${status}${renderChainSection(m, 'html', _activeResolver)}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const chain = renderChainSection(m, 'md', _activeResolver);
    return `## ${m.name || '(untitled)'}\n\n${m.goal || ''}\n\n**Status:** ${m.status || 'PLANNED'}${chain ? '\n\n' + chain : ''}`;
  },
};

export const UseCaseTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const src = m.source as Record<string, unknown> | undefined;
    const srcHtml = src ? `<div class="sv-source"><a href="/edit/${esc(String(src.file || ''))}#L${(src.lines as number[])?.[0] || 1}">${esc(String(src.file || ''))}</a> <span class="sv-commit">@${esc(String(src.commit || ''))}</span></div>` : '';
    return `<div class="sv-usecase"><h3>${esc(String(m.name || ''))}</h3><code>${esc(String(m.object || ''))}.${esc(String(m.verb || ''))}</code>${srcHtml}${renderChainSection(m, 'html', _activeResolver)}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const src = m.source as Record<string, unknown> | undefined;
    const srcMd = src ? `\n\n**Source:** \`${src.file || ''}\` lines ${(src.lines as number[])?.[0] || '?'}-${(src.lines as number[])?.[1] || '?'} @${src.commit || '?'}` : '';
    const chain = renderChainSection(m, 'md', _activeResolver);
    return `### ${m.name || '(untitled)'}\n\n\`${m.object || ''}.${m.verb || ''}\`${srcMd}${chain ? '\n\n' + chain : ''}`;
  },
};

export const ClassTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-class"><h3>${esc(String(m.name || ''))}</h3><code>${esc(String(m.file || ''))}</code>${renderChainSection(m, 'html', _activeResolver)}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const chain = renderChainSection(m, 'md', _activeResolver);
    return `### ${m.name || '(untitled)'}\n\n**File:** \`${m.file || ''}\`${chain ? '\n\n' + chain : ''}`;
  },
};

export const MethodTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-method"><h3>${esc(String(m.name || ''))}</h3>${renderChainSection(m, 'html', _activeResolver)}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const chain = renderChainSection(m, 'md', _activeResolver);
    return `### ${m.name || '(untitled)'}${chain ? '\n\n' + chain : ''}`;
  },
};

export const TestTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-test"><h3>${esc(String(m.name || ''))}</h3><span class="sv-status">${esc(String(m.status || ''))}</span><code>${esc(String(m.file || ''))}</code>${renderChainSection(m, 'html', _activeResolver)}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const chain = renderChainSection(m, 'md', _activeResolver);
    return `### ${m.name || '(untitled)'}\n\n**Status:** ${m.status || 'PENDING'} · **File:** \`${m.file || ''}\`${chain ? '\n\n' + chain : ''}`;
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

export const UserTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const token = String(m.token || '').slice(0, 8);
    return `<div class="sv-user"><h3>${esc(String(m.displayName || m.name || ''))}</h3><code>${esc(token)}</code></div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const token = String(m.token || '').slice(0, 8);
    return `### ${m.displayName || m.name || '(unnamed)'}\n\nToken: \`${token}\``;
  },
};

// [impl:uuid:b83c2639-7c94-429e-8a98-eb5ec3d7f5d0] R19.61 six missing templates
function renderSourceEdit(m: Record<string, unknown>): string {
  const sf = String(m.sourceFile || '').replace('ior:file:', '');
  if (!sf) return '';
  const sl = m.sourceLine ? `:${m.sourceLine}` : '';
  return `<a href="/edit/${sf}" class="sv-source-edit" style="color:#ff9800;font-size:0.75rem;text-decoration:none">✏️ ${sf}${sl}</a>`;
}

function renderScenarioLink(uuid: string): string {
  if (!uuid) return '';
  return `<a href="/scenario?ior=${uuid}" style="color:#ff9800;font-size:0.75rem;text-decoration:none">🔗 Scenario</a>`;
}

export const ImplementationTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-impl"><div class="sv-header"><span class="sv-type-badge">Implementation</span><h2>${esc(String(m.name || ''))}</h2><code>${esc(String(m.uuid || ''))}</code></div>${renderScenarioLink(String(m.uuid || ''))} ${renderSourceEdit(m)}${renderChainSection(m, 'html', _activeResolver)}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const sf = String(m.sourceFile || '').replace('ior:file:', '');
    return `# ${m.name || '(untitled)'}\n\n**Source:** \`${sf}${m.sourceLine ? ':' + m.sourceLine : ''}\`\n\n${renderChainSection(m, 'md', _activeResolver)}`;
  },
};

export const RoomTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    const members = Array.isArray(m.members) ? m.members.length : 0;
    const files = Array.isArray(m.files) ? m.files.length : 0;
    return `<div class="sv-room"><div class="sv-header"><span class="sv-type-badge">Room</span><h2>${esc(String(m.name || ''))}</h2><code>${esc(String(m.uuid || '').slice(0, 8))}</code></div>${renderScenarioLink(String(m.uuid || ''))}<div class="sv-section"><div class="sv-field"><label>Mode</label><span>${esc(String(m.mode || 'persistent'))}</span></div><div class="sv-field"><label>Visibility</label><span>${esc(String(m.visibility || 'public'))}</span></div><div class="sv-field"><label>Members</label><span>${members}</span></div><div class="sv-field"><label>Files</label><span>${files}</span></div></div></div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `# ${m.name || '(untitled)'}\n\n**Mode:** ${m.mode || 'persistent'} · **Visibility:** ${m.visibility || 'public'}\n\n**Members:** ${Array.isArray(m.members) ? m.members.length : 0} · **Files:** ${Array.isArray(m.files) ? m.files.length : 0}`;
  },
};

export const MessageTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-message"><div class="sv-header"><span class="sv-type-badge">Message</span><strong>${esc(String(m.senderName || ''))}</strong><time>${String(m.timestamp || '')}</time></div><p>${esc(String(m.text || ''))}</p></div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `**${m.senderName || '?'}** (${m.timestamp || '?'}): ${m.text || ''}`;
  },
};

export const FileTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-file"><div class="sv-header"><span class="sv-type-badge">File</span><h2>${esc(String(m.name || ''))}</h2><code>${esc(String(m.uuid || '').slice(0, 8))}</code></div>${renderScenarioLink(String(m.uuid || ''))}<div class="sv-section"><div class="sv-field"><label>Size</label><span>${m.size || 0} bytes</span></div><div class="sv-field"><label>Type</label><span>${esc(String(m.mimeType || ''))}</span></div>${m.contentHash ? `<div class="sv-field"><label>Hash</label><code>${String(m.contentHash).slice(0, 16)}…</code></div>` : ''}</div></div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `# ${m.name || '(untitled)'}\n\n**Size:** ${m.size || 0} bytes · **Type:** ${m.mimeType || '?'}${m.contentHash ? ` · **Hash:** \`${String(m.contentHash).slice(0, 16)}…\`` : ''}`;
  },
};

export const DeviceTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-device"><div class="sv-header"><span class="sv-type-badge">Device</span><h2>${esc(String(m.name || m.deviceId || ''))}</h2></div><div class="sv-section"><div class="sv-field"><label>Owner</label><span>${esc(String(m.ownerToken || '').slice(0, 8))}</span></div></div></div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `### ${m.name || m.deviceId || '(device)'}\n\nOwner: \`${String(m.ownerToken || '').slice(0, 8)}\``;
  },
};

export const SkillTemplate: ViewTemplate = {
  renderHtml(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `<div class="sv-skill"><div class="sv-header"><span class="sv-type-badge">Skill</span><h2>${esc(String(m.name || ''))}</h2></div><p>${esc(String(m.description || ''))}</p>${renderSourceEdit(m)}${renderChainSection(m, 'html', _activeResolver)}</div>`;
  },
  renderMd(s: ScenarioUnit): string {
    const m = s.model as Record<string, unknown>;
    return `# ${m.name || '(untitled)'}\n\n${m.description || ''}\n\n${renderChainSection(m, 'md', _activeResolver)}`;
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
  reg.register('ior:class:User', UserTemplate);
  reg.register('ior:class:Implementation', ImplementationTemplate);
  reg.register('ior:class:Room', RoomTemplate);
  reg.register('ior:class:Message', MessageTemplate);
  reg.register('ior:class:File', FileTemplate);
  reg.register('ior:class:Device', DeviceTemplate);
  reg.register('ior:class:Skill', SkillTemplate);
  return reg;
}
