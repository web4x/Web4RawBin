// R32.2 TS → M1 generation (design fa25b8b45 / AC requirement:4a9c6ee7, design-mda-model.md ## R32.2).
// Parse the TypeScript compiler AST → generate M1 `ior:class:ModelElement` units on the R32.1 foundation
// (REUSE ModelElement/TraceModel/ModelValidator — NO fork). Idempotent + same-UUID BY CONSTRUCTION:
//   uuid = v4-shaped sha256 of the STABLE key `<repo-relative sourceFile> :: <qualifiedName>`
//   (the migrate-to-scenario.ts:245 shape) → re-parse RE-BINDS, never re-mints (the R32.1/R31.13 law).
// On-disk form MIRRORS scripts/seed-mda-model.mjs (ior:class:ModelElement units written to sharded paths),
// so ModelValidator.validate reads generated + seed units uniformly.

import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// M2 metaclass uuids — MIRROR scripts/seed-mda-model.mjs (pinned/stable seed constants). [model facet, code facet].
const M2 = {
  UmlClass: 'a1d2e3f4-0000-4a1b-8c2d-000000000003',
  UmlInterface: 'a1d2e3f4-0000-4a1b-8c2d-000000000004',
  UmlAttribute: 'a1d2e3f4-0000-4a1b-8c2d-000000000005',
  UmlMethod: 'a1d2e3f4-0000-4a1b-8c2d-000000000006',
  UmlProperty: 'a1d2e3f4-0000-4a1b-8c2d-000000000007',
  UmlFunction: 'a1d2e3f4-0000-4a1b-8c2d-000000000008',
  UmlType: 'a1d2e3f4-0000-4a1b-8c2d-000000000009',
  UmlAssociation: 'a1d2e3f4-0000-4a1b-8c2d-000000000010',
  UmlGeneralization: 'a1d2e3f4-0000-4a1b-8c2d-000000000011',
  UmlDependency: 'a1d2e3f4-0000-4a1b-8c2d-000000000012',
  tsClass: 'a1d2e3f4-0000-4a1b-8c2d-000000000013',
  tsInterface: 'a1d2e3f4-0000-4a1b-8c2d-000000000015',
  tsMethod: 'a1d2e3f4-0000-4a1b-8c2d-000000000016',
  tsAttribute: 'a1d2e3f4-0000-4a1b-8c2d-000000000017',
  tsProperty: 'a1d2e3f4-0000-4a1b-8c2d-000000000018',
  tsFunction: 'a1d2e3f4-0000-4a1b-8c2d-000000000019',
  tsType: 'a1d2e3f4-0000-4a1b-8c2d-000000000020',
} as const;

// M1 kind → [model facet uuid, code facet uuid] (multi-facet instanceOf, per R32.1).
const FACETS: Record<string, string[]> = {
  class: [M2.UmlClass, M2.tsClass],
  interface: [M2.UmlInterface, M2.tsInterface],
  function: [M2.UmlFunction, M2.tsFunction],
  method: [M2.UmlMethod, M2.tsMethod],
  attribute: [M2.UmlAttribute, M2.tsAttribute],
  property: [M2.UmlProperty, M2.tsProperty],
  type: [M2.UmlType, M2.tsType],
};

const ref = (uuid: string): string => `ior:instance:${uuid}`;

// v4-shaped deterministic uuid from a stable key (migrate-to-scenario.ts:245 shape: forced version '4' + variant 'a').
export function keyToUuid(key: string): string {
  const h = crypto.createHash('sha256').update(key).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(12, 15)}-a${h.slice(15, 18)}-${h.slice(18, 30)}`;
}

export interface M1Model {
  uuid: string; name: string; metaLevel: 'M1'; kind: string;
  sourceFile: string; qualifiedName: string;
  instanceOf: string[];
  members?: string[]; memberOf?: string;
  relatesTo?: string[]; relatedFrom?: string[];
  relations?: { to: string; type: string }[];
  // R36.3 method/function full signature (enriched from the source decl)
  visibility?: 'public' | 'private' | 'protected'; parameters?: { name: string; type?: string }[]; returnType?: string;
  documentation?: string; parentClass?: string;
}
export interface M1Unit { ior: 'ior:class:ModelElement'; ownerIor: null; model: M1Model; }

interface Draft { uuid: string; kind: string; name: string; qn: string; sourceFile: string;
  members: string[]; memberOf?: string; typeRefs: string[]; heritage: string[]; depRefs: string[];
  // R36.3 method/function full signature (enriched from the source decl)
  visibility?: 'public' | 'private' | 'protected'; parameters?: { name: string; type?: string }[]; returnType?: string;
  documentation?: string; parentClass?: string; }

// R36.3: visibility from a member decl's modifiers (default public; a #private name is private too).
function memberVisibility(node: ts.Node): 'public' | 'private' | 'protected' {
  const mods = (ts.canHaveModifiers && ts.canHaveModifiers(node) ? ts.getModifiers(node) : (node as { modifiers?: readonly ts.Modifier[] }).modifiers) as readonly ts.Modifier[] | undefined;
  if (mods?.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword)) return 'private';
  if (mods?.some((m) => m.kind === ts.SyntaxKind.ProtectedKeyword)) return 'protected';
  const nm = (node as { name?: ts.Node }).name;
  if (nm && ts.isPrivateIdentifier(nm)) return 'private';
  return 'public';
}
// R36.3: oosh-style docs = the decl's JSDoc comment text (last block).
function jsDocText(node: ts.Node): string {
  const jsdoc = (node as unknown as { jsDoc?: { comment?: string | { text?: string }[] }[] }).jsDoc;
  if (!jsdoc || !jsdoc.length) return '';
  const c = jsdoc[jsdoc.length - 1].comment;
  return typeof c === 'string' ? c.trim() : (Array.isArray(c) ? c.map((x) => x.text || '').join('').trim() : '');
}

export class TsToModel {
  private root: string;
  constructor(root?: string) { this.root = root || process.cwd(); }

  private rel(file: string): string {
    const r = path.relative(this.root, file).split(path.sep).join('/');
    return r || path.basename(file);
  }

  // TS AST node → M1 kind (design Q1 map). null = not a modeled structure.
  private nodeKind(node: ts.Node): string | null {
    if (ts.isClassDeclaration(node)) return 'class';
    if (ts.isInterfaceDeclaration(node)) return 'interface';
    if (ts.isFunctionDeclaration(node)) return 'function';
    if (ts.isTypeAliasDeclaration(node)) return 'type';
    return null;
  }

  // The identifier text of a type node, if it is a simple named reference (for relationship resolution).
  private typeName(t?: ts.TypeNode): string | null {
    if (t && ts.isTypeReferenceNode(t) && ts.isIdentifier(t.typeName)) return t.typeName.text;
    if (t && ts.isArrayTypeNode(t)) return this.typeName(t.elementType);
    return null;
  }

  // [impl:uuid:382f8644-9e19-472e-91c8-8d4f68b198ad] TsToModel.generate (Method 970c7956, Class fc2f97c9, off UC efaea742)
  // — parse `files` into M1 ModelElement units (deterministic uuid),
  // resolve typed-member relationships (relatesTo + M2 type), write them to `indexDir` idempotently (0-churn re-run),
  // and reconcile (remove prior M1 units of the processed files that are no longer present in source).
  generate(files: string[], opts?: { indexDir?: string; write?: boolean; diagram?: boolean }): { units: M1Unit[]; wrote: number; removed: number; diagramUuid?: string } {
    const indexDir = opts?.indexDir || path.join(this.root, 'scenario', 'index');
    const write = opts?.write !== false;
    const program = ts.createProgram(files, { target: ts.ScriptTarget.ES2020, allowJs: false, noResolve: false, noLib: true });
    const want = new Set(files.map((f) => path.resolve(f)));

    const drafts = new Map<string, Draft>(); // uuid → draft
    // R33/S33-P2 AC4: name → ALL top-level decls carrying it (with their file) so multi-file relation resolution can
    // scope by file (a global simple-name map last-wins → cross-file name collisions mis-link. INV-P2 correctness).
    const nameDecls = new Map<string, { uuid: string; file: string }[]>();

    const mkKey = (sf: string, qn: string): string => `${this.rel(sf)}::${qn}`;
    const addDraft = (sf: string, qn: string, kind: string, name: string): Draft => {
      const uuid = keyToUuid(mkKey(sf, qn));
      let d = drafts.get(uuid);
      if (!d) { d = { uuid, kind, name, qn, sourceFile: this.rel(sf), members: [], typeRefs: [], heritage: [], depRefs: [] }; drafts.set(uuid, d); }
      return d;
    };

    // PASS 1 — element drafts (top-level + members). get/set of the same name PAIR into one property.
    for (const sf of program.getSourceFiles()) {
      if (!want.has(path.resolve(sf.fileName)) || sf.isDeclarationFile) continue;
      ts.forEachChild(sf, (node) => {
        const kind = this.nodeKind(node);
        if (!kind) return;
        const decl = node as ts.ClassDeclaration | ts.InterfaceDeclaration | ts.FunctionDeclaration | ts.TypeAliasDeclaration;
        if (!decl.name || !ts.isIdentifier(decl.name)) return;
        const name = decl.name.text;
        const parent = addDraft(sf.fileName, name, kind, name);
        { const arr = nameDecls.get(name) || []; arr.push({ uuid: parent.uuid, file: this.rel(sf.fileName) }); nameDecls.set(name, arr); }

        // R36.3: top-level FUNCTION full signature — NO parentClass ⇒ Function (instanceOf UmlFunction via FACETS['function']).
        if (kind === 'function' && ts.isFunctionDeclaration(node)) {
          parent.visibility = 'public';
          parent.parameters = node.parameters.map((p) => { const t = this.typeName(p.type); return { name: ts.isIdentifier(p.name) ? p.name.text : p.name.getText(sf), ...(t ? { type: t } : {}) }; });
          parent.returnType = this.typeName(node.type) || undefined;
          parent.documentation = jsDocText(node) || undefined;
        }

        // heritage (extends/implements) → UmlGeneralization
        if ((ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) && node.heritageClauses) {
          for (const hc of node.heritageClauses) for (const t of hc.types) if (ts.isIdentifier(t.expression)) parent.heritage.push(t.expression.text);
        }

        // members (class + interface)
        const members = (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) ? node.members : undefined;
        if (!members) return;
        const seenProp = new Set<string>();
        for (const mem of members) {
          if (!mem.name || !ts.isIdentifier(mem.name)) continue;
          const mn = mem.name.text;
          let mkind: string | null = null; let mtype: ts.TypeNode | undefined;
          if (ts.isMethodDeclaration(mem) || ts.isMethodSignature(mem)) { mkind = 'method'; mtype = mem.type; }
          else if (ts.isPropertyDeclaration(mem) || ts.isPropertySignature(mem)) { mkind = 'attribute'; mtype = mem.type; }
          else if (ts.isGetAccessorDeclaration(mem) || ts.isSetAccessorDeclaration(mem)) { mkind = 'property'; mtype = ts.isGetAccessorDeclaration(mem) ? mem.type : (mem.parameters[0] && mem.parameters[0].type); }
          if (!mkind) continue;
          if (mkind === 'property') { if (seenProp.has(mn)) { /* get+set pair → one property (already drafted) */ } seenProp.add(mn); }
          const md = addDraft(sf.fileName, `${name}.${mn}`, mkind, mn);
          md.memberOf = parent.uuid;
          if (mkind === 'method') { // R36.3: parentClass PRESENT ⇒ Method (instanceOf UmlMethod); enrich the full signature
            md.parentClass = parent.uuid;
            md.visibility = memberVisibility(mem);
            md.parameters = ((mem as ts.MethodDeclaration | ts.MethodSignature).parameters || []).map((p) => { const t = this.typeName(p.type); return { name: ts.isIdentifier(p.name) ? p.name.text : p.name.getText(sf), ...(t ? { type: t } : {}) }; });
            md.returnType = this.typeName(mtype) || undefined;
            md.documentation = jsDocText(mem) || undefined;
          }
          if (!parent.members.includes(md.uuid)) parent.members.push(md.uuid);
          // typed member → relationship target (attribute/property=Association; method return=Dependency)
          const tn = this.typeName(mtype);
          if (tn) { if (mkind === 'method') md.depRefs.push(tn); else md.typeRefs.push(tn); }
        }
      });
    }

    // PASS 2 — resolve relationships by name to a generated element (design Q3; relatesTo + M2 type).
    const relate = (d: Draft, targetName: string, type: string): void => {
      // R33/S33-P2 AC4: resolve file-scoped — prefer a same-file decl; else a UNIQUE global decl; else (ambiguous
      // cross-file collision) SKIP rather than mis-link (correctness > completeness for a rare ambiguous ref).
      const cands = nameDecls.get(targetName);
      if (!cands || !cands.length) return;
      const sameFile = cands.filter((c) => c.file === d.sourceFile);
      const pick = sameFile.length ? sameFile[0] : (cands.length === 1 ? cands[0] : null);
      const to = pick?.uuid;
      if (!to || to === d.uuid) return;
      const tgt = drafts.get(to); if (!tgt) return;
      d.members; // no-op keep tsc calm
      const drefs = (d as Draft & { _rel?: { to: string; type: string }[] });
      (drefs._rel ||= []).push({ to, type });
      const back = tgt as Draft & { _from?: string[] };
      (back._from ||= []).push(d.uuid);
    };
    for (const d of drafts.values()) {
      for (const tn of d.typeRefs) relate(d, tn, M2.UmlAssociation);
      for (const hn of d.heritage) relate(d, hn, M2.UmlGeneralization);
      for (const dn of d.depRefs) relate(d, dn, M2.UmlDependency);
    }

    // BUILD units
    const units: M1Unit[] = [];
    for (const d of drafts.values()) {
      const dd = d as Draft & { _rel?: { to: string; type: string }[]; _from?: string[] };
      const model: M1Model = {
        uuid: d.uuid, name: d.name, metaLevel: 'M1', kind: d.kind,
        sourceFile: d.sourceFile, qualifiedName: d.qn,
        instanceOf: (FACETS[d.kind] || []).map(ref),
      };
      if (d.members.length) model.members = d.members.map(ref);
      if (d.memberOf) model.memberOf = ref(d.memberOf);
      // R36.3 full signature: visibility + name(parameters) + returnType + docs; parentClass PRESENT ⇒ Method (else Function)
      if (d.visibility) model.visibility = d.visibility;
      if (d.parameters) model.parameters = d.parameters;
      if (d.returnType) model.returnType = d.returnType;
      if (d.documentation) model.documentation = d.documentation;
      if (d.parentClass) model.parentClass = ref(d.parentClass);
      if (dd._rel && dd._rel.length) { model.relatesTo = dd._rel.map((r) => ref(r.to)); model.relations = dd._rel.map((r) => ({ to: ref(r.to), type: ref(r.type) })); }
      if (dd._from && dd._from.length) model.relatedFrom = dd._from.map(ref);
      units.push({ ior: 'ior:class:ModelElement', ownerIor: null, model });
    }

    if (!write) return { units, wrote: 0, removed: 0 };

    // WRITE — sharded, deterministic, content-compared (0-churn re-run). Mirrors the seed's on-disk form.
    const shardPath = (uuid: string): string => path.join(indexDir, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
    let wrote = 0;
    const liveUuids = new Set<string>();
    for (const u of units) {
      liveUuids.add(u.model.uuid);
      const file = shardPath(u.model.uuid);
      const json = JSON.stringify(u, null, 2) + '\n';
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
      if (prev !== json) { fs.writeFileSync(file, json); wrote++; }
    }

    // R32.5 DEMO DIAGRAM — a Diagram unit (Layer-2 view-links, one per class/interface, DETERMINISTIC auto-layout
    // grid) so the R32.4 surface has nodes. Deterministic uuid (files key) → re-drop re-binds, 0 dup (R32.2 law).
    // Position lives on the LINK (x,y); the unit is untouched (R25.7 identity-by-ref).
    let diagramUuid: string | undefined;
    if (opts?.diagram) {
      diagramUuid = keyToUuid('diagram::' + files.map((f) => this.rel(f)).sort().join(','));
      const boxes = units.filter((u) => u.model.kind === 'class' || u.model.kind === 'interface');
      const COLS = 3;
      const views = boxes.map((u, i) => ({ unit: 'modelelement:' + u.model.uuid, x: (i % COLS) * 220 + 20, y: Math.floor(i / COLS) * 200 + 20, viewKind: 'class' }));
      const dUnit = { ior: 'ior:class:Diagram', ownerIor: null, model: { uuid: diagramUuid, name: `Model diagram (${boxes.length} classes)`, views } };
      const dfile = shardPath(diagramUuid);
      const djson = JSON.stringify(dUnit, null, 2) + '\n';
      fs.mkdirSync(path.dirname(dfile), { recursive: true });
      if ((fs.existsSync(dfile) ? fs.readFileSync(dfile, 'utf-8') : '') !== djson) { fs.writeFileSync(dfile, djson); wrote++; }
    }

    // RECONCILE — remove prior M1 units of the PROCESSED source files that are no longer present (rename/move/delete).
    const processed = new Set(units.map((u) => u.model.sourceFile));
    let removed = 0;
    if (fs.existsSync(indexDir)) {
      const stack = [indexDir];
      while (stack.length) {
        const dir = stack.pop() as string;
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
          const p = path.join(dir, ent.name);
          if (ent.isDirectory()) { stack.push(p); continue; }
          if (!ent.name.endsWith('.scenario.json')) continue;
          let unit: { ior?: string; model?: M1Model };
          try { unit = JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { continue; }
          if (unit.ior !== 'ior:class:ModelElement' || unit.model?.metaLevel !== 'M1') continue;
          if (processed.has(String(unit.model.sourceFile)) && !liveUuids.has(String(unit.model.uuid))) { fs.unlinkSync(p); removed++; }
        }
      }
    }
    return { units, wrote, removed, diagramUuid };
  }
}
