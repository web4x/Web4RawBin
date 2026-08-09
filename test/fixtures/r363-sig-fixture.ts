// R36.3 gate fixture — a class with methods (parentClass ⇒ Method) + a top-level function (no parentClass ⇒ Function).
// Consumed read-only by test/visual/r363-method-facet-webkit-gate.ts via the served /api/model/generate re-generate.
export class Greeter {
  count: number = 0;
  private secret(n: number): boolean { return n > 0; }
  public greet(name: string): void { void name; }
}
export function tallyUp(x: number, y: number): string { return `${x}${y}`; }
