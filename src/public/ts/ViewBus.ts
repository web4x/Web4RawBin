// [impl:uuid:e5145c01-f502-4g03-ah04-b05f06c07d13] T145 ViewBus singleton
type Listener = (model: Record<string, unknown>) => void;

class ViewBus {
  private subs = new Map<string, Set<Listener>>();

  subscribe(classType: string, uuid: string, listener: Listener): () => void {
    const key = `${classType}:${uuid}`;
    if (!this.subs.has(key)) this.subs.set(key, new Set());
    this.subs.get(key)!.add(listener);
    return () => { this.subs.get(key)?.delete(listener); };
  }

  publish(classType: string, uuid: string, model: Record<string, unknown>): void {
    const key = `${classType}:${uuid}`;
    for (const fn of this.subs.get(key) ?? []) fn(model);
  }
}

export const viewBus = new ViewBus();
