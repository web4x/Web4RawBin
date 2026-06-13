// Strict-test marker audit (planner, 2026-06-14) — encodes SM/PO locked strict-test.
// PASS iff [impl:uuid] marker (a) HEADS a named member decl (function/method/field-arrow/const-fn),
//   OR (b) is IN-BODY of a named member whose name MATCHES the marker's label-method.
// FAIL: split-for cluster / heads-const / anon-closure / in-body-name-mismatch / no-named-member / css / fake-suffix.
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
const ROOT = '/Users/Shared/Workspaces/2cuGitHub/Web4RawBin';
const roots = [path.join(ROOT, 'src'), path.join(ROOT, 'scripts')];
function walk(d: string, o: string[]) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f, o);
    else if (/\.(ts|js|mjs)$/.test(e.name) || e.name.endsWith('.css')) o.push(f);
  }
}
const files: string[] = []; for (const r of roots) walk(r, files);

type Fn = { name: string | null; start: number; end: number; kind: string };
type Decl = { fullStart: number; start: number; kind: string; name: string | null };
type Marker = { uuid: string; file: string; line: number; offset: number; text: string };
const markers: Marker[] = [];
const fileFns: Record<string, Fn[]> = {};
const fileDecls: Record<string, Decl[]> = {};
const MRE = /\[impl:uuid:([0-9a-f-]{8,36})\]\s*([^\n]*)/gi;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf-8');
  let m: RegExpExecArray | null; MRE.lastIndex = 0;
  while ((m = MRE.exec(src))) markers.push({ uuid: m[1], file: f, line: src.slice(0, m.index).split('\n').length, offset: m.index, text: (m[2] || '').trim() });
  if (f.endsWith('.css')) { fileFns[f] = []; fileDecls[f] = []; continue; }
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, /\.jsx?$/.test(f) ? ts.ScriptKind.JS : ts.ScriptKind.TS);
  const fns: Fn[] = []; const decls: Decl[] = [];
  const visit = (n: ts.Node) => {
    let fname: string | null = null, fkind = '';
    if (ts.isFunctionDeclaration(n)) { fname = n.name ? n.name.text : null; fkind = 'function'; }
    else if (ts.isMethodDeclaration(n) && ts.isIdentifier(n.name)) { fname = n.name.text; fkind = 'method'; }
    else if ((ts.isGetAccessor(n) || ts.isSetAccessor(n)) && ts.isIdentifier(n.name)) { fname = n.name.text; fkind = 'accessor'; }
    else if (ts.isConstructorDeclaration(n)) { fname = 'constructor'; fkind = 'ctor'; }
    else if (ts.isPropertyDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))) { fname = n.name.text; fkind = 'field-arrow'; }
    else if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) {
      const p = n.parent;
      if (p && ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) { fname = p.name.text; fkind = 'const-fn'; }
      else { fname = null; fkind = 'anon'; }
    }
    if (fkind) fns.push({ name: fname, start: n.getStart(sf), end: n.getEnd(), kind: fkind });
    let dk = '', dn: string | null = null;
    if (ts.isFunctionDeclaration(n)) { dk = 'named-member'; dn = n.name ? n.name.text : null; }
    else if (ts.isMethodDeclaration(n) && ts.isIdentifier(n.name)) { dk = 'named-member'; dn = n.name.text; }
    else if ((ts.isGetAccessor(n) || ts.isSetAccessor(n)) && ts.isIdentifier(n.name)) { dk = 'named-member'; dn = n.name.text; }
    else if (ts.isConstructorDeclaration(n)) { dk = 'named-member'; dn = 'constructor'; }
    else if (ts.isPropertyDeclaration(n) && ts.isIdentifier(n.name)) {
      if (n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))) { dk = 'named-member'; dn = n.name.text; }
      else { dk = 'data-prop'; dn = n.name.text; }
    }
    else if (ts.isVariableStatement(n)) {
      const hasFn = n.declarationList.declarations.some(d => d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)));
      const id = n.declarationList.declarations[0];
      dn = (id && ts.isIdentifier(id.name)) ? id.name.text : null;
      dk = hasFn ? 'named-member' : 'data-const';
    }
    else if (ts.isExpressionStatement(n)) { dk = 'expr-stmt'; dn = null; }
    else if (ts.isClassDeclaration(n) || ts.isInterfaceDeclaration(n) || ts.isImportDeclaration(n) || ts.isTypeAliasDeclaration(n)) { dk = 'non-member'; dn = null; }
    if (dk) decls.push({ fullStart: n.getFullStart(), start: n.getStart(sf), kind: dk, name: dn });
    ts.forEachChild(n, visit);
  };
  visit(sf); fileFns[f] = fns; fileDecls[f] = decls;
}

function innermostFn(file: string, off: number): Fn | null {
  let best: Fn | null = null;
  for (const fn of fileFns[file] || []) if (off >= fn.start && off < fn.end) if (!best || (fn.end - fn.start) < (best.end - best.start)) best = fn;
  return best;
}
function ownerDecl(file: string, off: number): Decl | null {
  let best: Decl | null = null;
  for (const d of fileDecls[file] || []) if (off >= d.fullStart && off < d.start) if (!best || (d.start - d.fullStart) < (best.start - best.fullStart)) best = d;
  return best;
}
function labelMethod(t: string): string {
  const s = t.replace(/\([^)]*\)/g, ' ').trim();
  const toks = s.split(/\s+/).filter(x => x && !/^R[-\d]/i.test(x) && !/^FLAG/i.test(x));
  const tok = toks[0] || ''; const parts = tok.split('.');
  return (parts[parts.length - 1] || '').toLowerCase();
}
const FAKE = /-a1b2-4c3d|-a2b3-|-b2c3-|-4c3d-8e4f/;

function classify(mk: Marker) {
  const rel = path.relative(ROOT, mk.file);
  const loc = `${rel}:${mk.line}`;
  if (mk.file.endsWith('.css')) return { v: 'FAIL', r: 'css-attr', loc };
  if (FAKE.test(mk.uuid)) return { v: 'FAIL', r: 'fake-suffix', loc };
  if (/\(split for/i.test(mk.text)) return { v: 'FAIL', r: 'split-for-cluster', loc };
  const own = ownerDecl(mk.file, mk.offset);
  if (own && own.kind === 'named-member' && own.name) return { v: 'PASS', r: `heads-named:${own.name}`, loc };
  if (own && (own.kind === 'data-const' || own.kind === 'data-prop')) return { v: 'FAIL', r: `heads-const:${own.name}`, loc };
  const inn = innermostFn(mk.file, mk.offset);
  const lbl = labelMethod(mk.text);
  if (inn && inn.kind === 'anon') return { v: 'FAIL', r: 'in-anon-closure', loc };
  if (inn && inn.name) {
    const mn = inn.name.toLowerCase();
    const match = lbl && (mn === lbl || mn.includes(lbl) || lbl.includes(mn));
    if (match) return { v: 'PASS', r: `in-body:${inn.name}`, loc };
    return { v: 'FAIL', r: `mislabeled(label=${lbl || '?'} vs member=${inn.name})`, loc };
  }
  return { v: 'FAIL', r: 'no-named-member(const/header/nothing)', loc };
}

const credited = JSON.parse(fs.readFileSync('/tmp/credited.json', 'utf-8'));
const out: any[] = [];
for (const c of credited) {
  const pre = c.implShort;
  if (!pre) { out.push({ ...c, verdict: '?', reason: 'no-short' }); continue; }
  const hits = markers.filter(mk => mk.uuid.slice(0, 8) === pre);
  if (!hits.length) { out.push({ ...c, verdict: 'FAIL', reason: 'marker-absent', loc: '' }); continue; }
  let chosen: any = null;
  for (const mk of hits) { const r = classify(mk); if (r.v === 'PASS') { chosen = { verdict: 'PASS', reason: r.r, loc: r.loc }; break; } if (!chosen) chosen = { verdict: 'FAIL', reason: r.r, loc: r.loc }; }
  out.push({ ...c, ...chosen });
}
const pass = out.filter(o => o.verdict === 'PASS').length, fail = out.filter(o => o.verdict === 'FAIL').length;
const reasons: Record<string, number> = {};
for (const o of out) if (o.verdict === 'FAIL') { const k = o.reason.replace(/\(.*/, '').replace(/:.*/, ''); reasons[k] = (reasons[k] || 0) + 1; }
console.log(`CREDITED=${out.length} PASS=${pass} FAIL=${fail}`);
console.log('FAIL:', JSON.stringify(reasons));
fs.writeFileSync('/tmp/strict_ast_results.json', JSON.stringify(out, null, 1));
