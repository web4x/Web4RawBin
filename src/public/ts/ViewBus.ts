// [impl:uuid:e5145c01-f502-4b03-a904-b05f06c07d13] T145/T37.25 ViewBus — THE ONE BUS
// T37.25 (PO, Tron live-MVC): there were TWO ViewBus singleton instances on disk — this one (viewBus, model-carrying,
// keyed classType:uuid) and trace/ViewBus.ts (ViewBus, ref-keyed notify). The RawBinClient transport→bus bridge
// notify()d ONLY the trace instance, so a mutation never reached views importing THIS one = "a change on one surface
// never re-renders the other." UNIFIED: this module now re-exports the SINGLE trace instance and exposes `viewBus` as a
// thin compat ADAPTER over it (publish→notify with the model as payload; subscribe→subscribe passing that payload to the
// model-listener). ONE instance → every surface (list row, icon, badge, detail) subscribes to and re-renders from the
// SAME emit, regardless of which import it used.
import { ViewBus } from './trace/ViewBus.js';
export { ViewBus };

type Listener = (model: Record<string, unknown>) => void;

// viewBus: the model-carrying API (publish/subscribe by classType+uuid) preserved for its 3 consumers (ProfileEditor
// publishes displayName; ProfileSheet + rb-member-badge subscribe) — now backed by the ONE trace instance, keyed
// `classType:uuid`. A bridge notify() with no payload delivers {} → the listener re-renders from its own state.
export const viewBus = {
  subscribe(classType: string, uuid: string, listener: Listener): () => void {
    return ViewBus.subscribe(`${classType}:${uuid}`, (payload) => listener((payload as Record<string, unknown>) || {}));
  },
  publish(classType: string, uuid: string, model: Record<string, unknown>): void {
    ViewBus.notify(`${classType}:${uuid}`, model);
  },
};
