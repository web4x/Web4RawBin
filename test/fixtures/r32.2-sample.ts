// R32.2 gate fixture — a small but representative TS file exercising every AST→M2 mapping:
// interface (+method), type alias, function, class (+attribute), class (+typed attribute→Association,
// get/set→ONE property, method, implements→Generalization).
export interface Shape {
  area(): number;
}

export type Id = string;

export function makeId(): Id {
  return 'id';
}

export class Point {
  x: number = 0;
  y: number = 0;
}

export class Circle implements Shape {
  center: Point = new Point();   // typed attribute → relatesTo Point (UmlAssociation)
  private _r: number = 1;
  get radius(): number { return this._r; }   // get + set of the SAME name → ONE property 'radius'
  set radius(v: number) { this._r = v; }
  area(): number { return Math.PI * this._r * this._r; }   // method
}
