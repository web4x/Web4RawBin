// Sprint 41 (T41.2, architect design sprint-41-oop-model-consistency.md) — class Folder as a real radical-OOP M1
// class (MINTED fresh; absent today). ONE shared, PURE (crypto/fs/DOM-free) class both sides — behaviour on the
// object, never a data-bag.
//
// This increment (T41.1) ships ONLY Folder.ownIor — needed because the create path also composes a Folder's IOR, and
// it must ask the SAME Ior value-object (no free-fn, no dup). T41.2 adds renderSelf() / children() / linkIn() / unlink().
import { Ior } from './ior.js';

export class Folder {
  constructor(private readonly model: { uuid: string; origin: string }) {}

  get uuid(): string { return this.model.uuid; }

  // Folder.ownIor — composes the Folder's fully-qualified IOR by ASKING the Ior value-object (single format owner +
  // GUARD#2). No impl marker: ownIor DELEGATES — the impl hangs on Ior.compose (30e39639), not Folder. Format not duplicated.
  ownIor(): string {
    return Ior.for('Folder', this.model.origin, this.model.uuid).toString();
  }
}
