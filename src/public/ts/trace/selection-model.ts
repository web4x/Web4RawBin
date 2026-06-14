/**
 * R20.6 — SelectionModel: singleton selection state for rb-object-item.
 */

class SelectionModelImpl {
  private selected = new Set<string>();

  // [impl:uuid:6a626fa3-9e31-437f-bb40-2fa57cc501bf] SelectionModel.select
  select(ref: string): void { this.selected.add(ref); this.dispatch(); }
  deselect(ref: string): void { this.selected.delete(ref); this.dispatch(); }
  toggle(ref: string): void { if (this.selected.has(ref)) this.selected.delete(ref); else this.selected.add(ref); this.dispatch(); }
  clear(): void { this.selected.clear(); this.dispatch(); }
  replaceWith(ref: string): void { this.selected.clear(); this.selected.add(ref); this.dispatch(); }
  has(ref: string): boolean { return this.selected.has(ref); }
  getSelected(): string[] { return [...this.selected]; }
  get size(): number { return this.selected.size; }

  private dispatch(): void {
    document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: this.getSelected() } }));
  }
}

export const selectionModel = new SelectionModelImpl();
