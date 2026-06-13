/**
 * R20.6 — SelectionModel: singleton selection state for rb-object-item.
 */

class SelectionModelImpl {
  private selected = new Set<string>();

  // [impl:uuid:10f3d3d4-4451-4b8e-a88c-1f99cfa40086] SelectionModel.select
  select(ref: string): void { this.selected.add(ref); this.dispatch(); }
  deselect(ref: string): void { this.selected.delete(ref); this.dispatch(); }
  toggle(ref: string): void { if (this.selected.has(ref)) this.selected.delete(ref); else this.selected.add(ref); this.dispatch(); }
  clear(): void { this.selected.clear(); this.dispatch(); }
  has(ref: string): boolean { return this.selected.has(ref); }
  getSelected(): string[] { return [...this.selected]; }
  get size(): number { return this.selected.size; }

  private dispatch(): void {
    document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: this.getSelected() } }));
  }
}

export const selectionModel = new SelectionModelImpl();
