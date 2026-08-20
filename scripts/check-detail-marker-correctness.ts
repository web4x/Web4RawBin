// R37.12 (B) SIBLING LINT — upsertSection MARKER correctness. The first lint (check-detail-idempotent-render) proves
// every detail insert goes THROUGH upsertSection, but upsertSection's marker is a HAND-SUPPLIED per-call string literal —
// so "goes through the primitive" says NOTHING about whether the marker is correct + unique. The hazard this closes is
// WORSE than duplication because it is INVISIBLE (fail-QUIET, against our fail-loud doctrine): upsertSection does
// root.querySelectorAll('.'+marker).forEach(remove) — so if two DIFFERENT sections in ONE host share a marker, the 2nd
// call SILENTLY DELETES the first (data loss, nothing on screen); and if the inserted content root does NOT carry the
// marker class, the NEXT render's querySelectorAll matches nothing → removes nothing → APPENDS = Tron's duplication
// silently RE-ENTERS through a call site that looks correct. This lint asserts, per upsertSection call:
//   (1) the marker argument is a STRING LITERAL (a computed/varying marker would append forever — the duplication returns);
//   (2) within one host (file), no two calls share a marker literal (the silent-overwrite vector);
//   (3) ★ the inserted content carries the marker class (else the next render can't find + replace it → silent re-append).
// Content-scan of the HAZARD (upsertSection call sites) across the whole client source — NOT a component shape-matcher
// (nothing to route through structuralDiscover; the operation names itself, same law as the sibling lint). ★ (3) is now
// enforced BY CONSTRUCTION (DELEGATION), not inspection: upsertSection STAMPS the marker onto the inserted root for ANY
// content (detail-render.ts), so the section is findable+replaceable regardless of what classes the caller passed — no
// call site or wrapper edit can break it. The static (3) check here is defense-in-depth for string-LITERAL content; the
// wrapper layer (detail-children.ts upsertSourceLink/upsertParentLink) passes function-call content the static check can't
// see through and is exempt from (3) NOT because it was inspected, but because the primitive it DELEGATES to guarantees
// the marker. detail-render.ts (the definition) is skipped entirely (its signature is not a call site).
// Registered in ci:gates:raw. Run: node --import tsx scripts/check-detail-marker-correctness.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_DIR = 'src/public/ts'; // DOM code lives only here (derived root — see sibling lint)
const PRIMITIVE_LAYER = ['src/public/ts/trace/detail-render.ts', 'src/public/ts/trace/detail-children.ts']; // defines upsertSection + the verified wrappers

export function scanCode(src: string): string {
  // blank out comment CONTENT but preserve newlines so reported line numbers stay accurate.
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// Split a call's arg string on TOP-LEVEL commas (respecting (), [], {}, and ' " ` strings).
export function splitTopLevel(s: string): string[] {
  const parts: string[] = []; let depth = 0, q = '', cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { cur += c; if (c === q && s[i - 1] !== '\\') q = ''; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; cur += c; continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    if (c === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

export interface Call { file: string; line: number; marker: string; content: string; }
// Extract every upsertSection(...) call with its raw marker (arg 2) + content (arg 3) expressions.
export function extractUpsertCalls(src: string, file: string): Call[] {
  const code = scanCode(src);
  const calls: Call[] = []; const re = /upsertSection\s*\(/g; let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    let i = re.lastIndex, depth = 1, q = '', args = '';
    while (i < code.length && depth > 0) {
      const c = code[i];
      if (q) { args += c; if (c === q && code[i - 1] !== '\\') q = ''; i++; continue; }
      if (c === "'" || c === '"' || c === '`') q = c;
      else if (c === '(') depth++;
      else if (c === ')') { depth--; if (depth === 0) { i++; break; } }
      args += c; i++;
    }
    const parts = splitTopLevel(args);
    const line = code.slice(0, m.index).split('\n').length;
    calls.push({ file, line, marker: (parts[1] || '').trim(), content: (parts[2] || '').trim() });
  }
  return calls;
}

const isStringLiteral = (a: string): boolean => /^(['"`]).*\1$/s.test(a);
const literalValue = (a: string): string => a.slice(1, -1);
const isBareIdent = (a: string): boolean => /^[a-zA-Z_$][\w$]*$/.test(a); // an element variable → upsertSection does classList.add(marker) → self-correct

export interface Finding { file: string; line: number; rule: '1-literal' | '2-collision' | '3-missing-class'; detail: string; }
export function scanMarkerCorrectness(root: string): Finding[] {
  const findings: Finding[] = [];
  const walk = (d: string): void => {
    let ents: fs.Dirent[]; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'dist') continue; walk(p); continue; }
      if (!/\.(ts|js)$/.test(e.name) || /\.(test|spec|d)\.ts$/.test(e.name)) continue;
      const rel = path.relative(root, p).split(path.sep).join('/');
      if (rel === 'src/public/ts/trace/detail-render.ts') continue; // DEFINES upsertSection (the fn signature is not a call site)
      const calls = extractUpsertCalls(fs.readFileSync(p, 'utf-8'), rel);
      const seen = new Map<string, number>(); // REAL-insert marker literal → first line, per FILE (=host)
      for (const c of calls) {
        // (1) marker must be a string literal
        if (!isStringLiteral(c.marker)) { findings.push({ file: rel, line: c.line, rule: '1-literal', detail: `marker is not a string literal: ${c.marker.slice(0, 40)} — a computed marker appends forever (duplication returns)` }); continue; }
        const mv = literalValue(c.marker);
        // (2) collision = two REAL section inserts (non-null content) sharing a marker → the 2nd deletes the 1st. A pure
        // CLEAR (content 'null', e.g. "no CRs → clear any prior") paired with an insert is the SAME section's clear-or-
        // insert, mutually exclusive, NOT a collision.
        if (c.content !== 'null') {
          if (seen.has(mv)) findings.push({ file: rel, line: c.line, rule: '2-collision', detail: `marker '${mv}' also inserted at line ${seen.get(mv)} in the same host → the 2nd upsert SILENTLY DELETES the 1st section` });
          else seen.set(mv, c.line);
        }
        // (3) inserted content must carry the marker class (else next render can't find+replace → silent re-append)
        if (PRIMITIVE_LAYER.includes(rel)) continue;                 // primitive/wrapper layer — verified home
        if (isBareIdent(c.content)) continue;                         // element form → upsertSection classList.add(marker) guarantees it
        if (!c.content.includes(mv)) findings.push({ file: rel, line: c.line, rule: '3-missing-class', detail: `content does not carry the marker class '${mv}' → the next render's querySelectorAll('.${mv}') matches nothing → APPENDS (Tron's duplication re-enters silently)` });
      }
    }
  };
  walk(path.join(root, CLIENT_DIR));
  return findings;
}

// SELF-BITE + STUB-MUST-FAIL: the detector MUST flag a computed marker, a duplicate marker in one host, and content
// missing the marker class; and MUST NOT flag a correct call. A gate green with any of these re-inserted is vacuous.
const OK = "upsertSection(this, 'dv-parent', `<div class=\"dv-parent\">x</div>`, head, 'afterend');";
const B1 = "upsertSection(this, computedMarker, `<div class=\"dv-x\">x</div>`);";                 // (1) computed marker
const B2 = "upsertSection(this,'dv-dup','<div class=\"dv-dup\">a</div>'); upsertSection(this,'dv-dup','<div class=\"dv-dup\">b</div>');"; // (2) collision
const B3 = "upsertSection(this, 'dv-status-checklist', `<div class=\"dv-other\">x</div>`);";        // (3) content lacks the marker class
const rulesOf = (s: string): string[] => extractUpsertCalls(s, 'x.ts').flatMap((c, i, all) => {
  const out: string[] = [];
  const seen = all.slice(0, i).filter((k) => isStringLiteral(k.marker) && k.content !== 'null').map((k) => literalValue(k.marker));
  if (!isStringLiteral(c.marker)) { out.push('1'); return out; }
  const mv = literalValue(c.marker);
  if (c.content !== 'null' && seen.includes(mv)) out.push('2');
  if (!isBareIdent(c.content) && !c.content.includes(mv)) out.push('3');
  return out;
});

if (process.argv[1] && /check-detail-marker-correctness\.(ts|js|mjs)$/.test(process.argv[1])) {
  const okClean = rulesOf(OK).length === 0;
  const b1 = rulesOf(B1).includes('1'), b2 = rulesOf(B2).includes('2'), b3 = rulesOf(B3).includes('3');
  if (!okClean || !b1 || !b2 || !b3) {
    console.error(`✗ check-detail-marker-correctness: SELF-BITE FAILED (okClean=${okClean}, computed=${b1}, collision=${b2}, missingClass=${b3}) — the lint is INERT. RED.`);
    process.exit(1);
  }
  const findings = scanMarkerCorrectness(ROOT);
  if (findings.length) {
    console.error(`✗ check-detail-marker-correctness: ${findings.length} upsertSection marker defect(s) — a silent section-overwrite or silent re-append vector:`);
    for (const f of findings) console.error(`  [${f.rule}] ${f.file}:${f.line}  ${f.detail}`);
    process.exit(1);
  }
  console.log(`✓ check-detail-marker-correctness — every upsertSection marker is a unique-per-host string literal + its content carries the marker class (self-BITE: flags computed marker ✓ + in-host collision ✓ + missing content class ✓, ignores a correct call ✓).`);
}
