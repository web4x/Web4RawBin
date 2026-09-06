// P0 UPLOAD CAPTURE (architect spec, design-upload-oop-collapse 8a9144558) — PII-SAFE prod instrumentation for the
// /api/room/<id>/upload multipart ingress. Writes framing / headers / offsets / sizes ONLY, to a DEDICATED file,
// UNCONDITIONALLY — deliberately NOT via addLog (whose stdout is isTTY-gated and whose file-write is IS_PRODUCTION-gated
// = the instrument-blindness the PO named). This exists to capture what TRON'S DEVICE actually sends (his real failing
// photo) vs the synthetic control that succeeds, so we diagnose from real bytes — NOT another reconstruction.
//
// ★ PII: NEVER the part BODY bytes (the photo). Only: verbatim Content-Type, declared-vs-actual length, per-part HEADER
// block (Content-Disposition incl filename= + its ENCODING, part Content-Type), part count + field names, byte OFFSETS/
// sizes (first boundary, per-part header/body split, close-boundary), and the outcome status. A text field's VALUE (e.g.
// the playerToken) lives AFTER the header/body split → it is NEVER read here (bodyLen size only), matching the route's own
// presence-only discipline. Instrumentation ONLY: no parse change, no fix, append-only side effects (own try/catch).
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CAP_DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const CAP_DIR = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'logs') : path.join(CAP_DIRNAME, '../../../data/logs');
const CAP_FILE = path.join(CAP_DIR, 'upload-capture.log');

const esc = (s: string): string => String(s).replace(/\r/g, '\\r').replace(/\n/g, '\\n');

// Capture the multipart FRAMING of one upload request. Returns a capId to correlate with its outcome. Never throws
// (own try/catch) — instrumentation must never affect the upload path.
export function captureUploadRequest(roomId: string, headers: Record<string, unknown>, body: Buffer): string {
  const capId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  try {
    const ct = String(headers['content-type'] || '');
    const declaredRaw = headers['content-length'];
    const declared = declaredRaw != null ? Number(declaredRaw) : null;
    const actual = body.length;
    const te = String(headers['transfer-encoding'] || '');
    // RAW boundary token BEFORE dequote/param-strip — reveals iOS quoting (boundary="…") / trailing ;params
    const rawBoundaryTok = (ct.split('boundary=')[1] || '');
    const boundary = rawBoundaryTok.trim().replace(/^"(.*)"$/, '$1').split(';')[0].trim();
    const bin = body.toString('binary');
    const firstBoundaryOffset = boundary ? bin.indexOf('--' + boundary) : -1;
    const closeBoundaryPresent = boundary ? bin.includes('--' + boundary + '--') : false;
    const rawParts = boundary ? bin.split('--' + boundary) : [];

    const partRecs: Array<Record<string, unknown>> = [];
    for (const part of rawParts) {
      if (!part.includes('Content-Disposition') && !part.includes('name=')) continue; // skip preamble/epilogue
      const hdrEnd = part.indexOf('\r\n\r\n');                          // the header/body split
      const headerBlock = hdrEnd !== -1 ? part.slice(0, hdrEnd) : part; // HEADERS ONLY — never the body after the split
      const bodyLen = hdrEnd !== -1 ? Math.max(part.length - hdrEnd - 4, 0) : 0; // SIZE only, never content
      const nameM = /name="([^"]*)"/.exec(part);
      const fnRfc2231 = /filename\*=/.test(part);
      const fnQuoted = /filename="[^"]*"/.test(part);
      const filenameEncoding = fnRfc2231 ? 'RFC2231(filename*=)' : fnQuoted ? 'quoted' : (/filename=/.test(part) ? 'bare-unquoted' : 'none');
      const ctM = /Content-Type:\s*([^\r\n]+)/i.exec(part);
      partRecs.push({
        name: nameM ? nameM[1] : null,
        headerBlock: esc(headerBlock).slice(0, 400), // header text only, escaped + capped (Content-Disposition + Content-Type)
        headerLen: hdrEnd !== -1 ? hdrEnd : null,
        bodyLen,
        rawPartLen: part.length,
        filenameEncoding,
        partContentType: ctM ? ctM[1].trim() : null,
      });
    }
    const fieldNames = partRecs.map((p) => p.name).filter(Boolean);
    const rec = {
      ts: new Date().toISOString(), capId, roomId: String(roomId).slice(0, 8),
      contentTypeVerbatim: ct,
      rawBoundaryToken: esc(rawBoundaryTok),
      boundaryResolved: boundary,
      transferEncoding: te || null,
      declaredLength: declared, actualReceived: actual, lengthMatch: declared === actual,
      firstBoundaryOffset, closeBoundaryPresent,
      partCount: partRecs.length, fieldNamesFound: fieldNames,
      hasFile: fieldNames.includes('file'), hasPlayerToken: fieldNames.includes('playerToken'), hasParent: fieldNames.includes('parent'),
      parts: partRecs,
    };
    fsSync.mkdirSync(CAP_DIR, { recursive: true });
    fsSync.appendFileSync(CAP_FILE, 'REQ ' + JSON.stringify(rec) + '\n');
  } catch (e) {
    try { fsSync.appendFileSync(CAP_FILE, `REQ-CAPTURE-ERROR ${capId} ${String((e as Error)?.message || e)}\n`); } catch { /* capture must never affect the upload */ }
  }
  return capId;
}

// Correlate the request framing with its OUTCOME (HTTP status + failure mode). Never throws.
export function captureUploadOutcome(capId: string, status: number, mode: string): void {
  try {
    fsSync.mkdirSync(CAP_DIR, { recursive: true });
    fsSync.appendFileSync(CAP_FILE, `OUT ${capId} status=${status} mode=${esc(mode).slice(0, 120)} ts=${new Date().toISOString()}\n`);
  } catch { /* instrumentation only */ }
}
