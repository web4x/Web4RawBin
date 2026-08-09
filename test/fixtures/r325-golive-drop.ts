// R32.5 go-live gate fixture — a known .ts drop (distinct R325-prefixed names, no seed/real collision).
export class R325Base {}
export interface R325Iface { id: string; }
export class R325Widget extends R325Base {
  face: R325Iface;
  size: number;
  render(): R325Iface { return this.face; }
}
