/**
 * T105 — rb-object-item: the defaultItemView for ANY TraceModel object (all 7 types).
 *
 * Attribute-driven (ref/type/title/status) — T103 contract. Visual parity with the lobby
 * room entry (.room-card idiom → .object-item). Native-OS draggable (3 dataTransfer payloads).
 * ViewBus-subscribed (MVC live re-render, no reload). Click → navigate(type,'show',{uuid}).
 *
 * [impl:uuid:105e4f50-6172-4384-895b-e05050505105] R15.4 defaultItemView
 */
import { ViewBus } from './ViewBus.js';
import { navigate } from './nav.js';
import { TRACE_ICONS } from './icons.js';

export class RbObjectItem extends HTMLElement {
  static get observedAttributes() { return ['ref', 'type', 'title', 'status', 'name', 'description']; }
  private unsub: (() => void) | null = null;

  connectedCallback(): void {
    this.setAttribute('draggable', 'true');
    this.classList.add('object-item');
    this.render();
    this.addEventListener('dragstart', this.onDragStart);
    this.addEventListener('click', this.onClick);
    const ref = this.getAttribute('ref');
    if (ref) this.unsub = ViewBus.subscribe(ref, () => this.render());
  }

  disconnectedCallback(): void {
    this.removeEventListener('dragstart', this.onDragStart);
    this.removeEventListener('click', this.onClick);
    this.unsub?.();
    this.unsub = null;
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    if (name === 'ref') { this.unsub?.(); const ref = this.getAttribute('ref'); this.unsub = ref ? ViewBus.subscribe(ref, () => this.render()) : null; }
    this.render();
  }

  private parts(): { type: string; uuid: string; ref: string } {
    const ref = this.getAttribute('ref') || '';
    const type = this.getAttribute('type') || ref.split(':')[0] || '';
    const uuid = ref.includes(':') ? ref.slice(ref.indexOf(':') + 1) : (this.getAttribute('uuid') || '');
    return { type, uuid, ref };
  }

  private onDragStart = (e: DragEvent): void => {
    const { type, uuid } = this.parts();
    const dt = e.dataTransfer;
    if (!dt) return;
    const hash = `#${type}.show?uuid=${uuid}`;
    const origin = (typeof location !== 'undefined' && location.origin) ? location.origin : '';
    dt.setData('text/plain', hash);                                   // paste → navigable link
    dt.setData('text/uri-list', `${origin}/app${hash}`);              // OS-recognizable native drag
    dt.setData('application/rb-object-ref', `${type}:${uuid}`);       // internal drop (T107/T108 linking)
    dt.effectAllowed = 'copyLink';
    const icon = this.querySelector('.oi-icon') as HTMLElement;
    if (icon && dt.setDragImage) dt.setDragImage(icon, 16, 16);
  };

  private onClick = (): void => {
    const { type, uuid } = this.parts();
    if (type && uuid) navigate(type, 'show', { uuid });
  };

  render(): void {
    const { type } = this.parts();
    const name = this.getAttribute('name') || generateName(this.getAttribute('title'));
    const desc = this.getAttribute('description') || this.getAttribute('title') || '';
    const icon = TRACE_ICONS[type] || '•';
    this.innerHTML = `
      <span class="oi-icon" title="${type}">${icon}</span>
      <div class="oi-content">
        <span class="oi-name">${esc(name)}</span>
        ${desc ? `<p class="oi-desc">${esc(desc)}</p>` : ''}
      </div>`;
  }
}

function generateName(title: string | null): string {
  if (!title) return '(untitled)';
  const words = title.split(/\s+/);
  if (words.length <= 5) return title;
  return words.slice(0, 5).join(' ') + '…';
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-object-item')) {
  customElements.define('rb-object-item', RbObjectItem);
}
