// T37.20 — the ONE shared DnD contract (Class DndContract 822e663b, UC dnd.carryUnitPayload 5474886a). THE canonical
// home for drag serialization + drop resolution (NOT DropDispatcher, which is the upload mechanism). Every drag source
// writes the scenario UNIT ref(s) via serializeDragUnit; every drop target reads via resolveDragUnit. NO per-target
// getData/setData outside this module; NO *.show URL; NO URL/href parse in any resolver (AC-A2 + AC-shared-contract-fleet-wide).
import { selectionModel } from './trace/selection-model.js';
import { isLocalOrigin, parseFederatedIor } from '../../ts/scenario/federated-ior.js'; // T37.20 DEFECT-1 (Proxy): THE ONE origin-decision helper (pure) — local vs remote chosen ONCE, no scattered if

// THE ONE canonical drag type: the scenario UNIT identity (resolvable ref/ior/uuid; multi-select = JSON list). Never a URL.
// T37.20.1: the drag SOURCES + drop READERS in the wild emit/read `application/rb-object-ref` (rb-object-item.onDragStart,
// rb-diagram-detail.onDropAddView), while this contract historically used `application/rb-unit` → resolver + sources did NOT
// connect for any target routed through the contract (in-app object-ref = a REAL shape Tron drops, PO P0). Fix = accept BOTH
// (rb-object-ref primary since that is what the sources put on the wire; rb-unit as the alias) so the shape is HANDLED, not
// rejected. serialize writes both; resolve reads both, robust to JSON-list OR comma/newline (the sources' historical format).
export const RB_OBJECT_REF_MIME = 'application/rb-object-ref'; // what the drag sources actually emit — the canonical read
export const RB_UNIT_MIME = 'application/rb-unit';             // alias (kept; some paths still reference it)

export type DragUnits = { units: string[] };      // in-app drag OR touch-selection: the resolved unit ref(s)
export type DragMint = { mintFrom: File[] };       // external OS file(s): no unit yet → the target MINTS one, then rides the same contract
export type DragResolution = DragUnits | DragMint | null;
export const isUnits = (r: DragResolution): r is DragUnits => !!r && 'units' in r;
export const isMint = (r: DragResolution): r is DragMint => !!r && 'mintFrom' in r;

// A unit ref is an ior/uuid/type:uuid — NEVER a URL or a #*.show hash. This guard keeps the text/plain fallback (step 2)
// from re-introducing the URL fallback T37.20 kills: a scheme URL (mailto:/webcal:/https://…), a #hash, or a *.show link
// is NOT a unit and is rejected here (it falls through to files/selection, or to the caller's own external-ingestion path).
function isUnitRef(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (/^#/.test(t)) return false;                              // #type.show?uuid= (the deleted serialize) / any hash
  if (/\.show(\?|$)/i.test(t)) return false;                   // *.show URL
  if (/^[a-z][a-z0-9+.\-]*:\/\//i.test(t)) return false;       // scheme://… (http, etc.)
  if (/^(https?|mailto|webcal|calshow|geo|tel|maps|x-apple-[a-z]+|message|sms|facetime):/i.test(t)) return false; // Apple/comm scheme URLs
  return true;                                                 // ior:instance:<uuid> / <uuid> / <type>:<uuid> → a real unit ref
}

export class DndContract {
  // [impl:uuid:d464497f-dafd-4e15-b9a8-fa386e1b35dd] DndContract.serializeDragUnit (Method 4d4d6a68) — THE ONE serializer.
  // Every drag source calls it. Writes the scenario UNIT ref(s) under RB_UNIT_MIME (canonical) + a bare-ref text/plain
  // fallback (iOS custom-MIME strip / cross-app) — NEVER a #type.show URL (AC-A2; the old #type.show serialize is DELETED).
  static serializeDragUnit(dt: DataTransfer | null, refs: string | string[]): void {
    if (!dt) return;
    const list = (Array.isArray(refs) ? refs : [refs]).map((r) => String(r || '').trim()).filter(Boolean);
    if (!list.length) return;
    dt.setData(RB_OBJECT_REF_MIME, JSON.stringify(list));                            // T37.20.1: the canonical type the readers read
    dt.setData(RB_UNIT_MIME, JSON.stringify(list));                                  // alias (back-compat)
    dt.setData('text/plain', list.length > 1 ? list.join('\n') : list[0]);           // bare unit ref fallback (NOT a URL)
    dt.effectAllowed = 'copyLink';
  }

  // [impl:uuid:ee03f867-d437-4c96-9399-5fcbd0f10de9] DndContract.resolveDragUnit (Method dc4938a6) — THE ONE resolver at
  // every drop target, FIXED order, NO URL/href parse: (1) rb-object-ref THEN rb-unit → the unit(s) [canonical, T37.20.1]; (2) text/plain bare
  // unit-ref [iOS strip fallback, URL-guarded]; (3) dataTransfer.files → external OS file, no unit yet → MINT then ride the
  // same contract; (4) selectionModel [touch / buffer stripped]. Returns null only when nothing unit-like AND no file AND no
  // selection — the caller may then run its own external-content ingestion (e.g. an external scheme URL → WebItem).
  static resolveDragUnit(dt: DataTransfer | null): DragResolution {
    if (dt) {
      // (1) canonical — rb-object-ref (what the sources emit) THEN rb-unit (alias). Robust to a JSON list OR the sources'
      // historical comma/newline format (rb-object-item wrote refs.join(',')). URL-guarded via isUnitRef.
      for (const mime of [RB_OBJECT_REF_MIME, RB_UNIT_MIME]) {
        const canon = dt.getData(mime);
        if (!canon) continue;
        let arr: string[] = [];
        try { const u = JSON.parse(canon); arr = (Array.isArray(u) ? u : [u]).map((s) => String(s).trim()); }
        catch { arr = canon.split(/[\n,]/).map((s) => s.trim()); }
        arr = arr.filter((s) => isUnitRef(s));
        if (arr.length) return { units: arr };
      }
      // (2) text/plain bare unit ref (never a URL)
      const tp = (dt.getData('text/plain') || '').trim();
      if (tp) { const arr = tp.split('\n').map((s) => s.trim()).filter((s) => isUnitRef(s)); if (arr.length) return { units: arr }; }
      // (3) external OS file → mint then ride
      const files = Array.from(dt.files || []);
      if (files.length) return { mintFrom: files };
    }
    // (4) touch / stripped buffer → the shipped tap-select complement
    const sel = selectionModel.getSelected();
    return sel.length ? { units: sel } : null;
  }
}

// T37.20 DEFECT-1 — Proxy (GoF remote-proxy). A dropped unit resolves through ONE polymorphic RefProxy; local vs remote is
// chosen ONCE, here, by the unit's own originHost (isLocalOrigin) — NOT by an if in the drop handler. The handler calls
// resolveDropPayload(dt)?.resolve(ctx) and branches on NOTHING; the origin-first branch in RoomView is DELETED, not reordered.
export interface DropResolveCtx { roomId: string; token: string; log?: (t: string) => void; }
export interface RefProxy { resolve(ctx: DropResolveCtx): Promise<{ uuid?: string; action?: string; error?: string } | null>; }

async function postImport(ref: unknown, ctx: DropResolveCtx): Promise<{ uuid?: string; action?: string; error?: string }> {
  try { return await fetch('/api/federation/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ ref, roomId: ctx.roomId, token: ctx.token }) }).then((r) => r.json()); }
  catch (e) { return { error: (e as Error)?.message || String(e) }; }
}

// LOCAL: the unit lives on THIS server → relink the LOCAL unit into the room. The ref carries NO fetchUrl, so the server
// reads it from its own store (contentAlreadyLocal) — ZERO origin fetch, no self-403.
class LocalRelinkProxy implements RefProxy {
  constructor(private readonly uuid: string) {}
  async resolve(ctx: DropResolveCtx) {
    const here = (typeof location !== 'undefined' && location.origin) || '';
    const res = await postImport({ ior: `ior:instance:${this.uuid}`, originHost: here }, ctx); // no fetchUrl → server local read
    if (res?.uuid) ctx.log?.(`[drop] linked object ${String(res.uuid).slice(0, 8)} (${res.action})`); else ctx.log?.(`[drop] object link failed: ${res?.error || '?'}`);
    return res;
  }
}
// REMOTE: a genuinely cross-origin unit → the server fetches its origin + reconciles + imports (T26.6).
class RemoteImportProxy implements RefProxy {
  constructor(private readonly fedRef: unknown) {}
  async resolve(ctx: DropResolveCtx) {
    const res = await postImport(this.fedRef, ctx);
    if (res?.uuid) ctx.log?.(`[federation] imported ${String(res.uuid).slice(0, 8)} (${res.action})`); else ctx.log?.(`[federation] import failed: ${res?.error || '?'}`);
    return res;
  }
}

function bareUnitUuid(ref: string): string { return String(ref || '').replace(/^ior:instance:/, '').replace(/^[a-z][\w-]*:/i, '').split('@')[0]; }

// resolveDropPayload — THE ONE drop entry for a UNIT payload. Returns the polymorphic RefProxy (local vs remote chosen ONCE
// by isLocalOrigin), or null when the buffer carries NO unit (→ the caller runs its own external file/URL ingestion). The
// drop handler contains NO originHost comparison — it just asks the proxy to resolve itself.
export function resolveDropPayload(dt: DataTransfer | null): RefProxy | null {
  const here = (typeof location !== 'undefined' && location.origin) || '';
  const fedRaw = dt?.getData('application/rb-federated-ref'); // a cross-instance ref carries its own originHost → proxy chosen from it
  if (fedRaw) {
    try {
      const fr = JSON.parse(fedRaw) as { ior?: string; originHost?: string };
      const uuid = parseFederatedIor(String(fr?.ior || '')).uuid;
      if (uuid) return isLocalOrigin(String(fr?.originHost || '') || null, here) ? new LocalRelinkProxy(uuid) : new RemoteImportProxy(fr);
    } catch { /* not a parseable fed ref → fall through to the unit contract */ }
  }
  const r = DndContract.resolveDragUnit(dt); // a same-origin in-app unit (rb-object-ref / rb-unit / bare text / selection)
  if (isUnits(r)) { const uuid = bareUnitUuid(r.units[0]); if (uuid) return new LocalRelinkProxy(uuid); }
  return null; // no unit → the caller's external file/URL ingestion (the mint/null case)
}
