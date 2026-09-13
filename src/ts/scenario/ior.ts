// Sprint 41 (T41.1, architect ruling 2026-09-13) — the IOR is a CLASS, not a string. A fully-qualified instance
// reference has STRUCTURE (class + protocol + origin + uuid) and RULES (origin is load-bearing → never empty), so it
// IS a value-object. This `Ior` is the SINGLE owner of the fully-qualified format: File/Folder/etc. ask it, never
// hand-build the string and never duplicate the compose logic (the free-fn composeUnitIor collapsed INTO here and
// was DELETED — no shim, no facade, PO no-half-state ruling).
//
// PURE by construction — crypto/fs/DOM-free — so the ONE shared class works on server AND client (the radical-OOP
// "a File is a File class both sides" shape). GUARD#2 is by-construction: you CANNOT build an Ior without an origin
// (the constructor THROWS), so a caller physically cannot mint a cross-server-unresolvable bare ref.
//
// FOLLOW-UP (named, NOT T41.1): Ior.parse collapses parseFederatedIor so compose + parse share this one format owner.

export type IorClassName = 'File' | 'Folder';

export class Ior {
  private constructor(
    readonly className: IorClassName,
    readonly origin: string,
    readonly uuid: string,
  ) {}

  // [impl:uuid:30e39639-01cf-43eb-8b65-3d50b02995a7] Ior.compose (Class Ior d6404f28) — composes the fully-qualified IOR
  // (class+protocol+origin+uuid) + GUARD#2 by construction. File/Folder.ownIor DELEGATE here (the impl hangs on Ior, not File).
  // The ONLY way to make an Ior. GUARD#2: empty origin → THROW (a File/Folder ref without an origin resolves nowhere
  // but here — the Sprint 26 federation property). Empty uuid → THROW. Origin's trailing slashes are normalized once.
  static for(className: IorClassName, origin: string, uuid: string): Ior {
    const o = String(origin || '').trim().replace(/\/+$/, '');
    if (!o) throw new Error(`Ior GUARD#2: refusing a ${className} IOR without an origin — a bare ref is cross-server-unresolvable (Sprint 41 fully-qualified-IOR by construction).`);
    if (!uuid) throw new Error(`Ior: ${className} IOR requires a uuid.`);
    return new Ior(className, o, uuid);
  }

  // ior:class:<Class>:rest:<origin>/scenario/<uuid> — CLASS + PROTOCOL(rest) + ORIGIN + uuid.
  toString(): string {
    return `ior:class:${this.className}:rest:${this.origin}/scenario/${this.uuid}`;
  }
}
