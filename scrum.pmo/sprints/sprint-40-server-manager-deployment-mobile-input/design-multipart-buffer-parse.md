# Multipart upload parse — buffer-based, order-independent, binary-safe (architect RULING, 2026-09-05)

Tester reproduced on Linux WebKit (NOT iOS-only): v0.8.185 room upload via the REAL client path returns **size=0** — file bytes lost between the browser File and the server parse. This is defect **(2)**, stacked with defect (1) the divergent drop paths (fixed by the container unification, design-r40.86-drop-target-container-unification.md). **Same ship.**

## Root (measured, server.ts upload endpoint ~2620)
```ts
const parts = body.toString('binary').split('--' + boundary);   // ★ (i) whole body → latin1 STRING, split as text
for (const part of parts) {
  if (part.includes('name="playerToken"')) { playerToken = part.split('\r\n\r\n')[1]?.trim()... }  // ★ (ii) .trim() on a value
  ...
  if (part.includes('name="file"')) {
    const raw = part.slice(dataStart + 4); const trimmed = raw.replace(/\r\n$/, ''); fileData = Buffer.from(trimmed, 'binary'); // ★ (iii) STRING slice of file bytes, then back to Buffer
  }
}
```
Three coincidence-not-construction faults: **(i)** the entire body (including raw file bytes) is round-tripped through a `binary`/latin1 STRING and split as text; **(ii)** `.trim()`/`.split('\r\n')[0]` on values mangles content; **(iii)** file bytes are recovered by STRING `.slice`/`.replace` then `Buffer.from(str,'binary')` — lossy/fragile for real binary. It happened to work for our gate (token-FIRST, a small TEXT Blob) and fails for the real client (file-FIRST, binary File → size=0). **A parser correct only for one accidental field ORDER + text content is the same defect class as behaviour spread across branches — works by coincidence, not construction** (PO). Likely PRE-EXISTING (tester bisecting 0.8.183/0.8.184), merely tipped over / exposed by R40.86's +32 parent-parse lines.

## Ruling: ONE buffer-based parser — Buffer.indexOf / raw slice, ANY order, ANY binary
Parse the raw `Buffer` directly; NEVER `body.toString()` the file bytes; identify each part by its own header `name` (order-independent).
```ts
// ONE correct multipart parse: buffer-native (Buffer.indexOf/slice), order-independent (keyed on each part's name),
// binary-safe (file bytes are a raw Buffer slice, never string-round-tripped). Replaces the body.toString('binary').split parse.
const bnd = Buffer.from('--' + boundary);
const CRLF2 = Buffer.from('\r\n\r\n');
let fileName = '', mimeType = 'application/octet-stream', fileData = Buffer.alloc(0), playerToken = '', relatedFile = '', parentRef = '';
let pos = body.indexOf(bnd);
while (pos !== -1) {
  const next = body.indexOf(bnd, pos + bnd.length);
  if (next === -1) break;                                        // last boundary is the closing '--boundary--'
  const part = body.slice(pos + bnd.length, next);              // ONE part, RAW bytes
  const sep = part.indexOf(CRLF2);
  if (sep !== -1) {
    const header = part.slice(0, sep).toString('latin1');       // headers are ASCII → safe to read as text
    let val = part.slice(sep + 4);                              // RAW body bytes (Buffer)
    if (val.length >= 2 && val[val.length - 2] === 0x0d && val[val.length - 1] === 0x0a) val = val.slice(0, -2); // strip ONE trailing CRLF
    const name = (header.match(/name="([^"]+)"/) || [])[1] || '';
    if (name === 'file') {
      const disp = header.match(/filename="([^"]+)"/);
      if (disp) fileName = Buffer.from(disp[1], 'latin1').toString('utf-8'); // UTF-8 filename un-mojibake (kept from before)
      const ct = header.match(/Content-Type:\s*(\S+)/i); if (ct) mimeType = ct[1];
      fileData = val;                                            // ★ RAW Buffer — binary-safe, never string round-tripped
    } else if (name === 'playerToken') playerToken = val.toString('utf8').trim();
    else if (name === 'relatedFile') relatedFile = val.toString('utf8').trim();
    else if (name === 'parent') parentRef = val.toString('utf8').trim();
  }
  pos = next;
}
```
- **Order-independent:** each part is classified by its OWN `name` header, so file-first / token-first / parent-anywhere all parse identically.
- **Binary-safe:** `fileData` is a raw `Buffer.slice` of the body — the file bytes are NEVER passed through `toString`. (Text fields are small ASCII/UTF-8 → `toString('utf8')` is correct for them only.)
- **Boundary as bytes:** `Buffer.indexOf(bnd)` finds boundaries in the raw buffer (a boundary string never appears in binary by RFC — the client picks a non-colliding boundary).

## The stacked fix, one ship
- Defect (2) — THIS parser — is the byte-integrity fix that restores uploads on ALL clients (the size=0 bug). It is independent of and complementary to defect (1).
- Defect (1) — the container unification — removes the divergent drop paths so `parent` threading can't break another path.
Ship BOTH. (2) can land first/fast to restore service; (1) makes the drop paths DRY so this class can't recur.

## Gate (must use the REAL client encoding — the miss that shipped it broken)
- Upload a REAL binary file (a PNG) via the ACTUAL browser FormData (file-FIRST, binary) → server `fileData.length === file byte length` (NOT 0); round-trip the stored bytes == the original (checksum). Our old gate used a token-first TEXT Blob → it MUST be replaced with a file-first binary fixture.
- Field-order matrix: {file-first, token-first, parent-present, parent-absent} ALL parse the file bytes intact + the right fields. stub-must-fail: revert to the string-split parse → size=0 on the file-first binary case → RED.
- End-to-end: browser drop → upload → createFileUnit → stored bytes intact + renders (composes with defect-(1) container fix).

## Handoff
Expert (0.1), service-first: replace the `body.toString('binary').split` parse with the buffer-native parser above (drop-in — same variables out: fileName/mimeType/fileData/playerToken/relatedFile/parentRef). No other endpoint change. Version bump + restart → uploads restored on all clients. I backstop (binary round-trip intact + field-order matrix) + tester re-gates with a real binary file-first fixture. This parser is the ONE correct one — not one that suits one client.
