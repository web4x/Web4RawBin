// [impl:uuid:031ca481-3210-4a89-8c2e-c730847d44a3] UnitConvertible (Class 16c41b03, Method 44d0350e, UC f4b10768 = R40.99)
// — the interface EVERY natural domain class (WebItem/Image/Email/Contact/CalendarEntry) implements so a file-bearing
// gesture becomes an OBJECT that saves ITSELF as a scenario unit. Tron's law (design-mimetype-class-model.md REV-2/3):
// the unit JSON is BOTH the model AND the wire format — one representation, no second shape; a caller ASKS the object,
// never inspects a content-type string or guesses binary-ness. `toUnit()` yields the wire+model representation (binary
// content base64-INLINE for transfer, R40.98 BinaryUnit); `fromUnit()` reconstructs the object (server decodes base64 →
// .content sidecar + sha256 hash-dedup, the EXISTING file-unit.ts mechanism). This is the SLICE-A seam: the browser
// reads its own File bytes (FileReader) and transfers unit JSON via UnitTransport.putByUuid — no multipart on this path.
//
// SCENARIO-FIRST: this interface's chain is minted (design-ahead). The CONCRETE natural classes (Image/CalendarEntry)
// are NOT yet minted — they are req's to mint before their code lands here; this file ships the interface only.

// A scenario unit as it moves on the wire / lives in the model. Binary payload (if any) rides base64-inline in `model`
// (transfer form); at rest the server materializes it to a .content sidecar + content-ref (R40.98). Shape kept minimal
// + structural on purpose — the natural class owns the field meanings, not this interface.
export interface ScenarioUnitJSON {
  ior: string;
  ownerIor: string | null;
  model: Record<string, unknown>; // includes uuid; binary carriers add e.g. { contentBase64, mimeType, size } on the wire
}

export interface UnitConvertible {
  isBinary(): boolean;                 // owned by the class, NEVER sniffed/guessed at a call site
  load(raw: Blob | ArrayBuffer | string): Promise<void> | void; // become itself from dropped bytes/text
  toUnit(): Promise<ScenarioUnitJSON> | ScenarioUnitJSON;       // its representation AS a scenario unit (wire + model)
}

// Reconstruct a natural-class instance from a unit (static side of the contract; each class provides its own fromUnit).
export interface UnitConvertibleStatic {
  fromUnit(u: ScenarioUnitJSON): UnitConvertible;
}
