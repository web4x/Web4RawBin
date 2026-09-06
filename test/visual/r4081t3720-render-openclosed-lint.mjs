// T37.20 DEFECT-2 inc-2 — OPEN/CLOSED lint for the RENDER path (extends the class-dispatch lint to the render registry). Tron
// radical-OOP: the class owns its render; the VIEW does ONE lookup and mounts a generic element. So a per-natural-type conditional
// (if kind==='image' / switch(kind){case 'email'…}) ANYWHERE in the view path (rb-detail-drawer + rb-natural-detail) = NOT
// open/closed — a 6th class would force a central edit. HAZARD = a conditional on a natural-kind literal in the VIEW path; the
// registry (natural-render.ts) is the OWNER where per-type registration is legitimate (positional exception). Assert 0. Failable.
import fs from 'node:fs';
import path from 'node:path';
const R = (v) => console.log(v);
const ROOT = path.resolve('.');
const VIEW = ['src/public/ts/trace/rb-detail-drawer.ts', 'src/public/ts/trace/rb-natural-detail.ts']; // the view path (owner natural-render.ts excluded)
const KIND = '(image|email|contact|calendar(?:entry)?)';
const HAZARD = new RegExp(`(===\\s*['"\`]${KIND}['"\`])|(case\\s*['"\`]${KIND}['"\`])|(kind\\s*===\\s*['"\`]${KIND})`, 'i');
const isComment = (l) => { const t = l.trim(); return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'); };

function scan(extra) {
  const files = [...VIEW, ...(extra ? [extra] : [])];
  const hits = [];
  for (const f of files) { let lines; try { lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n'); } catch { continue; }
    lines.forEach((l, i) => { if (!isComment(l) && HAZARD.test(l)) hits.push(`${f}:${i + 1}  ${l.trim().slice(0, 90)}`); }); }
  return hits;
}

const hits = scan();
R(`═══ T37.20 inc-2 RENDER OPEN/CLOSED — per-type conditionals in the VIEW path ═══`);
R(`  view path scanned: ${VIEW.join(', ')} (registry natural-render.ts = owner, excluded)`);
R(`  per-natural-type conditionals in the view : ${hits.length}  ${hits.length === 0 ? 'GREEN (ONE lookup; class owns its render)' : 'RED'}`);
for (const h of hits) R(`      ${h}`);
// structural corroboration: the drawer hook is a single hasNaturalRender lookup; rb-natural-detail delegates via naturalRender
const drawer = (() => { try { return fs.readFileSync(path.join(ROOT, VIEW[0]), 'utf8'); } catch { return ''; } })();
const natDetail = (() => { try { return fs.readFileSync(path.join(ROOT, VIEW[1]), 'utf8'); } catch { return ''; } })();
R(`  drawer uses hasNaturalRender lookup: ${/hasNaturalRender/.test(drawer)} · rb-natural-detail delegates via naturalRender: ${/naturalRender\(/.test(natDetail)}`);

// ── FAILABLE self-test (teeth): a temp view file with a real per-type conditional MUST be detected, then removed.
const probe = path.join(ROOT, 'src/public/ts/trace', `__r4081t3720_renderprobe_${process.pid}.ts`);
let teeth = false;
try { fs.writeFileSync(probe, `if (kind === 'image') { renderImageSpecially(); }\n`); teeth = scan(path.relative(ROOT, probe)).length === hits.length + 1; }
finally { try { fs.unlinkSync(probe); } catch {} }
R(`  FAILABLE self-test (inject a per-type view conditional → detected): ${teeth ? 'PASS (teeth — a 6th class cannot re-introduce a central switch unseen)' : 'FAIL (toothless)'}`);

const green = hits.length === 0 && /hasNaturalRender/.test(drawer) && /naturalRender\(/.test(natDetail) && teeth;
R(`OVERALL: ${green ? 'GREEN — render path is open/closed; a 6th natural class registers its render with ZERO central edits' : 'RED'}`);
process.exit(green ? 0 : 1);
