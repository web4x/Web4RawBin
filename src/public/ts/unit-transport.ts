// SLICE-A — the ONE object-owned upload transport (design-upload-oop-collapse.md 4e643add7). REST per Tron: the scenario
// unit JSON is the model AND the only thing on the wire — NO FormData, NO multipart, NO xhr-with-a-file-form. The browser
// reads its OWN File bytes (FileReader → base64) and transfers unit JSON; the server never hand-parses the device multipart,
// so iOS boundary/param/encoding quirks cannot reach it (routes around the entire failure class by construction). Collapses
// drop-dispatcher.uploadFile (fetch+FormData) + uploadWithProgress (xhr+FormData) → this ONE method; progress = a PARAM.
import type { ScenarioUnitJSON } from './mime/unit-convertible.js';

export interface PutContext {
  roomId: string;
  playerToken: string;
  parent?: string;                        // R40.86: drop INTO a folder → the target folder ref (server nests it)
  relatedFile?: string;                   // WebItem → its source file
  baseUrl?: string;
  onProgress?: (pct: number) => void;     // the ONLY reason uploadWithProgress was a 2nd impl → now a param
}

// [impl:uuid:f885c473-e47e-4f75-a8e7-463834a816cc] UnitTransport.putByUuid (Class f979256f, Method beec004b, UC 06444973 =
// R40.96) — idempotent PUT-by-uuid of a scenario unit. The unit's own uuid keys it (server-side createFileUnit honours
// input.uuid + hash-dedups) so a re-send is a no-op / same result = self-heal-by-construction (no 409/419 handshake). Sends
// unit JSON to the room ingress route as application/json (the route branches JSON→unit-receive; multipart stays the native
// edge). onProgress uses xhr (upload.onprogress); without it, fetch. Returns the server's {uuid,name,size} or null on failure.
export class UnitTransport {
  static putByUuid(unit: ScenarioUnitJSON, ctx: PutContext): Promise<{ uuid: string; name: string; size: number } | null> {
    const url = `${ctx.baseUrl || ''}/api/room/${ctx.roomId}/upload`;
    const body = JSON.stringify({ unit, playerToken: ctx.playerToken, ...(ctx.parent ? { parent: ctx.parent } : {}), ...(ctx.relatedFile ? { relatedFile: ctx.relatedFile } : {}) });
    if (ctx.onProgress) {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url); // idempotent PUT-by-uuid (R40.96). NOT a file form — a unit-JSON body (no FormData).
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) ctx.onProgress!(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => { try { resolve(xhr.status >= 200 && xhr.status < 300 ? JSON.parse(xhr.responseText) : null); } catch { resolve(null); } };
        xhr.onerror = () => resolve(null);
        xhr.send(body);
      });
    }
    return fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
}

// [impl:uuid:PENDING-req-mint] fileToUnit — build a File scenario-unit JSON from a dropped/picked File: FileReader → base64
// INLINE (transfer form, R40.98). PENDING-req-mint: this folds into the Image/File natural class (UnitConvertible) once req
// mints them (scenario-first); for SLICE-A it produces the existing ior:class:File shape the server already materializes.
export async function fileToUnit(file: File): Promise<ScenarioUnitJSON> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => { const s = String(r.result || ''); resolve(s.slice(s.indexOf(',') + 1)); }; // strip the `data:<mime>;base64,` prefix
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
  return { ior: 'ior:class:File', ownerIor: null, model: { uuid: crypto.randomUUID(), name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size, contentBase64: base64 } };
}

// [impl:uuid:PENDING-req-mint] urlToUnit — a dropped URL as a unit (text/uri-list); the server ingress resolves uri-list →
// WebItem (its existing branch). Folds into the WebItem natural class (reuse 7c486fcb) on req mint.
export function urlToUnit(url: string, displayName: string): ScenarioUnitJSON {
  const b64 = btoa(unescape(encodeURIComponent(url))); // utf-8 → base64 (browser)
  return { ior: 'ior:class:File', ownerIor: null, model: { uuid: crypto.randomUUID(), name: `${displayName}.url`, mimeType: 'text/uri-list', size: url.length, contentBase64: b64 } };
}
