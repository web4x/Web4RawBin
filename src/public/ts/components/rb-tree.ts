/**
 * T-room-ui-shared — rb-tree: reusable collapsible tree component.
 * Renders a list of rb-tree-item children grouped under a label with
 * expand/collapse toggle and item count badge.
 *
 * [impl:uuid:ae090710-5c3a-4e8b-b217-9f3d7c1a5e40] R19.21
 */

export interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  badge?: string;
  children?: TreeNode[];
}

export class RbTree extends HTMLElement {
  static get observedAttributes() { return ['label', 'open']; }
  private items: TreeNode[] = [];

  connectedCallback(): void { this.render(); }
  attributeChangedCallback(): void { if (this.isConnected) this.render(); }

  setItems(items: TreeNode[]): void {
    this.items = items;
    this.render();
  }

  private render(): void {
    const label = this.getAttribute('label') || '';
    const isOpen = this.hasAttribute('open');
    const count = this.items.length;

    this.innerHTML = `
      <div class="rrc-node">
        <div class="rrc-node-row">
          <span class="rrc-node-toggle">${isOpen ? '▾' : '▸'}</span>
          <span class="rrc-node-label">${label}</span>
          <span class="rrc-node-count">${count}</span>
        </div>
        <div class="rrc-node-children" style="display:${isOpen ? '' : 'none'}">
          ${count === 0 ? '<div class="rrc-empty">— empty —</div>' : this.items.map(item =>
            `<rb-tree-item data-id="${item.id}" label="${esc(item.label)}" ${item.icon ? `icon="${esc(item.icon)}"` : ''} ${item.badge ? `badge="${esc(item.badge)}"` : ''}></rb-tree-item>`
          ).join('')}
        </div>
      </div>`;

    this.querySelector('.rrc-node-row')?.addEventListener('click', () => {
      this.toggleAttribute('open');
      this.render();
    });
  }
}

export class RbTreeItem extends HTMLElement {
  static get observedAttributes() { return ['label', 'icon', 'badge']; }

  connectedCallback(): void { this.render(); }
  attributeChangedCallback(): void { if (this.isConnected) this.render(); }

  private render(): void {
    const label = this.getAttribute('label') || '';
    const icon = this.getAttribute('icon') || '';
    const badge = this.getAttribute('badge') || '';
    this.className = 'rrc-item';
    this.innerHTML = `${icon ? `<span class="rrc-item-icon">${icon}</span>` : ''}<span class="rrc-item-name">${esc(label)}</span>${badge ? `<span class="rrc-item-badge">${esc(badge)}</span>` : ''}`;
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (!customElements.get('rb-tree')) customElements.define('rb-tree', RbTree);
if (!customElements.get('rb-tree-item')) customElements.define('rb-tree-item', RbTreeItem);
