/**
 * R-C3 [impl]-marker AST-attach — the shared [impl] predicate (symmetric partner of test-marker-attach.ts).
 * Encodes the rule that ONLY LIVED IN DOCS (team-laws.md L7) but was NEVER an enforced ci:gate here: strict-marker-audit.ts
 * had a stale macOS ROOT + a missing /tmp/credited.json → it CRASHED, was absent from ci:gates, and never ran on Linux.
 * This module makes the [impl] rule real + single-source (trace-audit + the impl gate import THIS) — repo-relative,
 * no external input, 3-bucket (mirror-error-safe: an impl-edit riding an existing decl / a re-exported symbol / a
 * name that exists elsewhere is UNPROVEN, never auto-FICTIONAL — erasing real work mirrors inflating it).
 */
import * as ts from 'typescript';

// HONEST buckets (PO 2026-08-08, post read-pass): 'FICTIONAL' means the feature does NOT EXIST — the read proved
// that is ≈0, so the old 53 split by DEFECT (different defect ⇒ different fix, one bucket would hide that):
//  PROVEN_COMPLETE   — marker heads a named-member decl (credit stands, label-independent)
//  ANON_HANDLER      — impl real+local but in an anon handler/scope, no named decl (structural; architect policy)
//  SPLIT_FOR_CLUSTER — real method, multi-uuid markers stacked at file header '(split for X.method)'; fix = marker
//                      CONSOLIDATION (strict-marker-audit's own canonical rule ALREADY fails this — a named defect)
//  FILE_HEADER       — module-level R-tag in the top doc-comment (heads a non-member import/class); needs a POLICY
//                      call (file-scope vs must-attach-to-method) — same question as ANON_HANDLER, route to architect
//  UNPROVEN          — name appears in OTHER src = WEAK evidence → NEEDS-VERIFICATION, not denied
//  FICTIONAL         — name appears NOWHERE in src = provably no such symbol (≈0 after the read-pass)
//  COMPLETE_FILE_SCOPE — module/component-scope tag (heads a non-member class/import) whose label does NOT name a
//                        real method elsewhere → VALID credit, reported SEPARATELY from method-COMPLETE (weaker
//                        evidence; PO 2026-08-08). If the label DOES name an existing method → UNPROVEN (misplaced
//                        marker, needs-reattach THERE — not a component-scope requirement).
export type ImplBucket = 'PROVEN_COMPLETE' | 'COMPLETE_FILE_SCOPE' | 'ANON_HANDLER' | 'SPLIT_FOR_CLUSTER' | 'FILE_HEADER' | 'UNPROVEN' | 'PROVEN_FICTIONAL';
export interface Decl { fullStart: number; start: number; end: number; name: string | null; kind: 'named-member' | 'handler' | 'data' | 'non-member' }

/** All declarations in a source file, mirroring strict-marker-audit's engine (named-member = function/method/accessor/
 *  ctor/field-arrow/const-fn; data = plain const/prop; non-member = class/interface/import/type). */
export function collectDecls(src: string, filePath: string): Decl[] {
  const sf = ts.createSourceFile(filePath, src, ts.ScriptTarget.Latest, true, /\.jsx?$|\.mjs$/.test(filePath) ? ts.ScriptKind.JS : ts.ScriptKind.TS);
  const decls: Decl[] = [];
  const push = (n: ts.Node, name: string | null, kind: Decl['kind']) => decls.push({ fullStart: n.getFullStart(), start: n.getStart(sf), end: n.getEnd(), name, kind });
  const visit = (n: ts.Node): void => {
    if (ts.isFunctionDeclaration(n)) push(n, n.name ? n.name.text : null, 'named-member');
    else if (ts.isMethodDeclaration(n) && ts.isIdentifier(n.name)) push(n, n.name.text, 'named-member');
    else if ((ts.isGetAccessor(n) || ts.isSetAccessor(n)) && ts.isIdentifier(n.name)) push(n, n.name.text, 'named-member');
    else if (ts.isConstructorDeclaration(n)) push(n, 'constructor', 'named-member');
    else if (ts.isPropertyDeclaration(n) && ts.isIdentifier(n.name)) push(n, n.name.text, n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer)) ? 'named-member' : 'data');
    else if (ts.isVariableStatement(n)) { const d = n.declarationList.declarations[0]; const nm = d && ts.isIdentifier(d.name) ? d.name.text : null; const fn = n.declarationList.declarations.some((x) => x.initializer && (ts.isArrowFunction(x.initializer) || ts.isFunctionExpression(x.initializer))); push(n, nm, fn ? 'named-member' : 'data'); }
    else if (ts.isClassDeclaration(n) || ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n) || ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) push(n, null, 'non-member');
    // HANDLER-SCOPE (architect 05b63e85d policy B): an addEventListener(...) call OR an on<Event>= arrow assignment is
    // a handler node the AST can bind — a marker heading it + an explicit method label = attached (browser idiom).
    else if (ts.isExpressionStatement(n)) {
      const ex = n.expression;
      const isAEL = ts.isCallExpression(ex) && ((ts.isPropertyAccessExpression(ex.expression) && ex.expression.name.text === 'addEventListener') || (ts.isIdentifier(ex.expression) && ex.expression.text === 'addEventListener'));
      const isOnAssign = ts.isBinaryExpression(ex) && ex.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(ex.left) && /^on[a-z]/i.test(ex.left.name.text) && (ts.isArrowFunction(ex.right) || ts.isFunctionExpression(ex.right));
      if (isAEL || isOnAssign) push(n, null, 'handler');
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return decls;
}

/** The marker's label method-token (mirrors strict-marker-audit.labelMethod): first non-annotation token, last dot-segment, lowercased. */
export function labelMethod(text: string): string {
  const s = text.replace(/\([^)]*\)/g, ' ').trim();
  // skip annotation/ref tokens: sprint reqs (R19.3), FLAG, TASK-REFS (T10, T5+T33), bare numbers, #refs — the method
  // token is what remains (mis-picking a task-ref as the method was a false-fictional cause, PO mirror-error flag).
  const tok = s.split(/\s+/).filter((x) => x && !/^R[-\d]/i.test(x) && !/^FLAG/i.test(x) && !/^T\d/i.test(x) && !/^#/.test(x) && !/^\d/.test(x))[0] || '';
  return (tok.split('.').pop() || '').toLowerCase();
}

/**
 * Attached iff the marker HEADS a named-member decl — the CANONICAL strict-marker-audit rule: a marker in a decl's
 * leading-trivia gap [fullStart, start) attaches to it, and heads-named-member = credit REGARDLESS of the marker's
 * label text (the label only disambiguates the in-body fallback). Requiring label-match on the HEADS case was too
 * strict → it false-fictionaled real impls whose marker text is prose ("in-room drawer") not "Class.method".
 */
export function ownerDecl(markerOffset: number, decls: Decl[]): Decl | null {
  let own: Decl | null = null;
  for (const d of decls) if (markerOffset >= d.fullStart && markerOffset < d.start) if (!own || (d.start - d.fullStart) < (own.start - own.fullStart)) own = d;
  return own;
}
/** An explicit Class.method label = a clean JS identifier (the handler-attach intent-match; prose like 'in-room' fails). */
export function validMethodLabel(label: string): boolean { return /^[a-z_$][\w$]*$/i.test(label); }

export function isImplMarkerAttached(markerOffset: number, label: string, decls: Decl[]): boolean {
  const own = ownerDecl(markerOffset, decls);
  if (own && own.kind === 'named-member' && own.name) return true;          // heads a named member = attached (label-independent)
  if (own && own.kind === 'handler' && validMethodLabel(label)) return true; // heads a handler node + explicit method label (policy B)
  return false;
}

/**
 * 3-bucket [impl] classify (mirror of [test], fail-closed toward lower credit but NEVER erasing real work):
 *  PROVEN_COMPLETE  — heads a name-matched named-member decl (credit STANDS)
 *  UNPROVEN         — not attached here, but a decl with the label's name EXISTS somewhere in src (re-attach / impl-edit
 *                     under an existing decl / re-exported symbol) → credit SUSPENDED (the mirror-error guard)
 *  PROVEN_FICTIONAL — not attached AND NO decl with that name anywhere in src (the claimed impl does not exist) → DENIED
 */
export function classifyImplMarker(markerOffset: number, label: string, text: string, fileDecls: Decl[], fileTokens: Set<string>, globalTokens: Set<string>, globalMemberNames: Set<string>): ImplBucket {
  const own = ownerDecl(markerOffset, fileDecls);
  if (own && own.kind === 'named-member' && own.name) return 'PROVEN_COMPLETE';        // heads a named member (label-independent)
  if (own && own.kind === 'handler' && validMethodLabel(label)) return 'PROVEN_COMPLETE'; // handler-scope attach (policy B)
  if (/\(split for/i.test(text)) return 'SPLIT_FOR_CLUSTER';                            // real method, multi-uuid stacked at header
  if (own && own.kind === 'non-member') {                                              // file/component-scope tag (heads class/import)
    return label && globalMemberNames.has(label) ? 'UNPROVEN'                          //   label names a real method elsewhere → MISPLACED, reattach there
      : 'COMPLETE_FILE_SCOPE';                                                          //   genuine component-scope requirement → valid credit (PO ruling)
  }
  if (own && own.kind === 'handler') return 'ANON_HANDLER';                             // heads a handler but prose/invalid label (fallback-A residue)
  if (label && fileTokens.has(label)) return 'ANON_HANDLER';                            // local inline impl, no headed node
  if (label && globalTokens.has(label)) return 'UNPROVEN';                              // name in OTHER src = weak → NEEDS-VERIFICATION
  return 'PROVEN_FICTIONAL';                                                            // name NOWHERE = provably no such symbol (≈0)
}

export interface ImplMarkerRef { uuid: string; file: string; offset: number; label: string; text: string }
export interface ImplMarkerBuckets { complete: ImplMarkerRef[]; completeFileScope: ImplMarkerRef[]; anonHandler: ImplMarkerRef[]; splitForCluster: ImplMarkerRef[]; fileHeader: ImplMarkerRef[]; unproven: ImplMarkerRef[]; fictional: ImplMarkerRef[]; outsideScope: ImplMarkerRef[]; markerTotal: number; fileCount: number }

const IMPL_RE = /\[impl:uuid:([0-9a-f-]{8,36})\]\s*([^\n]*)/gi;
const CODE = /\.(ts|js|mjs)$/;

/** Single-source FULL SCAN of src/ (+scripts/) for [impl] markers → 3 buckets. [impl] markers belong in src — a
 *  [impl:uuid] under test/ is OUTSIDE-SCOPE (invalid, reported). Both trace-audit and the impl gate import THIS. */
export function scanImplMarkers(root: string, fsMod: { readdirSync: Function; readFileSync: Function }, pathJoin: (...p: string[]) => string): ImplMarkerBuckets {
  const declsByFile = new Map<string, Decl[]>();
  const tokensByFile = new Map<string, Set<string>>(); // per-file identifier words → the ANON_HANDLER "impl is local" test
  const globalTokens = new Set<string>();              // ALL identifier words across src → the "symbol exists somewhere" test
  const globalMemberNames = new Set<string>();         // named-member decl names → the FILE_HEADER "label names a real method" test
  const inScope: ImplMarkerRef[] = []; const outsideScope: ImplMarkerRef[] = [];
  let fileCount = 0;
  const WORD = /[a-zA-Z_$][\w$]*/g;
  const scan = (p: string, scoped: boolean) => {
    const src = String(fsMod.readFileSync(p, 'utf-8')); fileCount++;
    const decls = collectDecls(src, p); declsByFile.set(p, decls);
    for (const d of decls) if (d.kind === 'named-member' && d.name) globalMemberNames.add(d.name.toLowerCase());
    const fileTok = new Set<string>();
    let w: RegExpExecArray | null; WORD.lastIndex = 0; while ((w = WORD.exec(src))) { const t = w[0].toLowerCase(); fileTok.add(t); globalTokens.add(t); }
    tokensByFile.set(p, fileTok);
    let m: RegExpExecArray | null; IMPL_RE.lastIndex = 0;
    while ((m = IMPL_RE.exec(src))) { const ref: ImplMarkerRef = { uuid: m[1], file: p, offset: m.index, label: labelMethod(m[2] || ''), text: (m[2] || '').trim() }; (scoped ? inScope : outsideScope).push(ref); }
  };
  const walk = (d: string, scoped: boolean) => {
    let ents: any[]; try { ents = fsMod.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) { if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue; const p = pathJoin(d, e.name); if (e.isDirectory()) walk(p, scoped); else if (CODE.test(e.name) && !e.name.endsWith('.d.ts')) scan(p, scoped); }
  };
  walk(pathJoin(root, 'src'), true);
  walk(pathJoin(root, 'scripts'), true);
  walk(pathJoin(root, 'test'), false); // [impl] markers found under test/ are outside-scope
  const out: ImplMarkerBuckets = { complete: [], completeFileScope: [], anonHandler: [], splitForCluster: [], fileHeader: [], unproven: [], fictional: [], outsideScope, markerTotal: inScope.length + outsideScope.length, fileCount };
  const route: Record<ImplBucket, ImplMarkerRef[]> = { PROVEN_COMPLETE: out.complete, COMPLETE_FILE_SCOPE: out.completeFileScope, ANON_HANDLER: out.anonHandler, SPLIT_FOR_CLUSTER: out.splitForCluster, FILE_HEADER: out.fileHeader, UNPROVEN: out.unproven, PROVEN_FICTIONAL: out.fictional };
  for (const r of inScope) route[classifyImplMarker(r.offset, r.label, r.text, declsByFile.get(r.file) || [], tokensByFile.get(r.file) || new Set(), globalTokens, globalMemberNames)].push(r);
  return out;
}
