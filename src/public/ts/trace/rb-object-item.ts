/**
 * T105 — rb-object-item: the defaultItemView for ANY TraceModel object (all 7 types).
 *
 * Attribute-driven (ref/type/title/status) — T103 contract. Visual parity with the lobby
 * room entry (.room-card idiom → .object-item). Native-OS draggable (icon-only drag handle).
 * ViewBus-subscribed (MVC live re-render, no reload). Click → navigate(type,'show',{uuid}).
 *
// [impl:uuid:2b1e7d26-62fe-4d8a-8129-56c09b9d78ff] R15.4 defaultItemView (split for RbObjectItem.render)
// [impl:uuid:2693d9cc-4a08-4f05-ba01-597b647eb7c7] R15.4 defaultItemView (split for RbObjectItem.setIcon)
// [impl:uuid:ee80de6b-d699-4ef1-98e3-ea6f488f5686] R15.4 defaultItemView (split for RbObjectItem.setIcon)
// [impl:uuid:ef2e4365-6b3d-4198-91e8-dff0808e0068] R15.4 defaultItemView (split for RbObjectItem.expand)
// [impl:uuid:3fe1d2f2-6836-486a-9e42-fd3dfb4572f6] R15.4 defaultItemView (split for RbObjectItem.expandChildren
// [impl:uuid:4a158f5c-c502-4ee3-854d-167a40cf806b] R15.4 defaultItemView (split for RbObjectItem.render)
// [impl:uuid:db399ba7-c35b-47b4-b9ee-d995cf08bbd2] R15.4 defaultItemView (split for RbObjectItem.collapse)
// [impl:uuid:d809105d-b683-4cab-a587-fbdfdb4de809] R15.4 defaultItemView (split for RbObjectItem.drag)
// [impl:uuid:7611c7c4-1d12-4546-a57f-1dc60d6e61ff] R15.4 defaultItemView (split for RbObjectItem.expand)
// [impl:uuid:0e4446d0-72b1-4f87-af17-512cc789f5ab] R15.4 defaultItemView (split for RbObjectItem.generateName)
// [impl:uuid:0a028fb4-d3d5-476c-9dcd-977212cbaf41] R15.4 defaultItemView (split for RbObjectItem.collapse)
// [impl:uuid:09de2e8d-7933-464e-95ff-6717c068ad91] R15.4 defaultItemView (split for RbObjectItem.expandChildren
 * [impl:uuid:b4c8bf40-6b31-4acd-ad4a-0f93d6f7326b] R15.4 defaultItemView
 */
import { ViewBus } from './ViewBus.js';
import { navigate } from './nav.js';
import { TRACE_ICONS } from './icons.js';

export class RbObjectItem extends HTMLElement {
  static get observedAttributes() { return ['ref', 'type', 'title', 'status', 'name', 'description', 'child-count']; }
  private unsub: (() => void) | null = null;

  connectedCallback(): void {
    this.classList.add('object-item');
    this.render();
    this.addEventListener('click', this.onClickDelegate);
    const ref = this.getAttribute('ref');
    if (ref) this.unsub = ViewBus.subscribe(ref, () => this.render());
  }

  disconnectedCallback(): void {
    this.removeEventListener('click', this.onClickDelegate);
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
    dt.setData('text/plain', hash);
    dt.setData('text/uri-list', `${origin}/app${hash}`);
    dt.setData('application/rb-object-ref', `${type}:${uuid}`);
    dt.effectAllowed = 'copyLink';
    if (dt.setDragImage) dt.setDragImage(this, 20, 20);
  };

// [impl:uuid:4ffa86ed-ca7b-4e73-9371-89b113e2ae77] impl:RbObjectItem.onClickDelegate (split for RbObjectItem.on
  // [impl:uuid:8cc75226-527e-4c87-bed8-9885e98d46e1] RbObjectItem.onClickDelegate
  private onClickDelegate = (e: Event): void => {
    const target = e.target as HTMLElement;
    const icon = this.querySelector('.oi-icon');
    const expander = this.querySelector('.oi-expand');
    if (icon && (target === icon || icon.contains(target))) {
      e.stopPropagation();
      this.toggleAttribute('collapsed');
      return;
    }
    if (expander && (target === expander || expander.contains(target))) {
      e.stopPropagation();
      const open = this.toggleAttribute('children-open');
      this.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open } }));
      return;
    }
    const { type, uuid } = this.parts();
    if (type && uuid) navigate(type, 'show', { uuid });
  };

  render(): void {
    const { type } = this.parts();
    const rawName = this.getAttribute('name') || generateName(this.getAttribute('title'));
    const name = rawName.startsWith('>') ? rawName.replace(/^>\s*/, '').slice(0, 50) : rawName;
    const desc = this.getAttribute('description') || this.getAttribute('title') || '';
    const icon = TRACE_ICONS[type] || '•';
    const hasChildren = this.hasAttribute('has-children');
    const childCount = this.getAttribute('child-count') || '0';
    this.innerHTML = `
      <span class="oi-icon" title="${type}" draggable="true">${icon}</span>
      <div class="oi-content">
        <span class="oi-name">${esc(name)}</span>
        ${desc ? `<p class="oi-desc">${esc(desc)}</p>` : ''}
      </div>
      ${hasChildren ? `<span class="oi-badge">${childCount}</span><span class="oi-expand">›</span>` : ''}`;

    this.querySelector('.oi-icon')?.addEventListener('dragstart', this.onDragStart);
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
