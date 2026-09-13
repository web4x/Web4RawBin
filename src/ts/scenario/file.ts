// Sprint 41 (T41.1, architect design sprint-41-oop-model-consistency.md + ruling 2026-09-13) — class File as a
// real radical-OOP M1 class: behaviour on the object (ask-the-object), NOT a data-bag. ONE shared class for BOTH
// server and client → PURE by construction (crypto/fs/DOM-free): its methods produce DATA (an IOR string, a
// view-model, a command), never effects. Effects live at the thin adapters (server file-unit.ts persist/create;
// client DOM render + transport). This is the MVC Model half of the 41.3 observer kernel — same object.
//
// This increment = File.ownIor() only (chain: UC file.resolveOwnIor → Class File 13782f0c → Method 8d5a11e6).
// renderSelf() (view-model) and moveTo(target) (command) land in the next increments.
import { Ior } from './ior.js';

export class File {
  constructor(private readonly model: { uuid: string; origin: string }) {}

  get uuid(): string { return this.model.uuid; }

  // [impl:uuid:8d5a11e6-a5c0-4237-a218-afbe19699bf6] File.ownIor — the File composes its OWN fully-qualified IOR by
  // ASKING the Ior value-object (single owner of the format + GUARD#2). No hand-built string, no free-fn shim: the
  // deleted composeUnitIor's knowledge collapsed into Ior. GUARD#2 (empty origin → throw) is enforced by Ior's constructor.
  ownIor(): string {
    return Ior.for('File', this.model.origin, this.model.uuid).toString();
  }
}
