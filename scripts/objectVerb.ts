/**
 * objectVerb — generic Object.verb dispatcher (the OOSH model applied to TypeScript).
 *
 * Introspects skill-classes.ts signatures + JSDoc (like c2 scans bash signatures)
 * and derives EVERYTHING from that single source: CLI invocation, help, parameter
 * completion, the OOSH wrapper script (emitOosh) and the skill docs (emitDocs).
 * No flags-parsing per skill, no hand-written SKILL.md, no drift. DRY.
 *
 * Usage:
 *   npx tsx scripts/objectVerb.ts list
 *   npx tsx scripts/objectVerb.ts <Object> help
 *   npx tsx scripts/objectVerb.ts <Object> <verb> [positional...] [--param value] [--flag]
 *   npx tsx scripts/objectVerb.ts <Object> completion <verb> <param>
 *   npx tsx scripts/objectVerb.ts emitOosh   # regenerate scrum.pmo/skills/taskChain
 *   npx tsx scripts/objectVerb.ts emitDocs   # regenerate scrum.pmo/skills/<object>.md
 *
 * [impl:uuid:bf29a301-c4d5-4e6f-9a7b-8c0d1e2f3a4b] po.chainFollowUp (canonical dispatch)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Chain, Velocity } from '../src/ts/scenario/skill-classes.js';
import { ScenarioIndex } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(path.join(__dirname, '..'));
const SKILL_SOURCE = path.join(REPO, 'src/ts/scenario/skill-classes.ts');
const SKILLS_DIR = path.join(REPO, 'scrum.pmo/skills');

// --- Registry: Object name → factory (DI of index + paths) ---

type SkillInstance = Record<string, unknown> & { complete?: (verb: string, param: string) => string[] };

export const registry: Record<string, () => SkillInstance> = {
  Chain: () => new Chain(new ScenarioIndex(path.join(REPO, 'scenario/index')), path.join(REPO, 'src'), path.join(REPO, 'test')) as unknown as SkillInstance,
  Velocity: () => {
    const chain = new Chain(new ScenarioIndex(path.join(REPO, 'scenario/index')), path.join(REPO, 'src'), path.join(REPO, 'test'));
    return new Velocity(REPO, chain) as unknown as SkillInstance;
  },
};

// --- Introspection: scan class signatures + JSDoc from source (c2-style) ---

export interface VerbParam { name: string; type: string; optional: boolean; }
export interface VerbSig { object: string; verb: string; params: VerbParam[]; doc: string; }

export function introspect(source?: string): VerbSig[] {
  const text = source ?? fs.readFileSync(SKILL_SOURCE, 'utf-8');
  const sigs: VerbSig[] = [];
  let currentClass = '';
  let doc = '';
  let inDoc = false;
  for (const line of text.split('\n')) {
    const cls = line.match(/^export class (\w+)/);
    if (cls) { currentClass = cls[1]; doc = ''; inDoc = false; continue; }
    if (inDoc) {
      if (line.includes('*/')) { inDoc = false; continue; }
      if (!doc) { const t = line.replace(/^\s*\*\s?/, '').trim(); if (t) doc = t; }
      continue;
    }
    if (/^\s*\/\*\*/.test(line)) {
      const single = line.match(/\/\*\*\s*(.*?)\s*\*\/\s*$/);
      if (single) { doc = single[1]; continue; }
      doc = ''; inDoc = true;
      continue;
    }
    // Public method at 2-space indent (private/constructor naturally excluded: `private ` breaks \w+\()
    const m = currentClass ? line.match(/^ {2}(\w+)\(([^)]*)\)/) : null;
    if (m) {
      const [, name, rawParams] = m;
      if (name !== 'constructor') {
        const params: VerbParam[] = rawParams.trim() === '' ? [] : splitParams(rawParams).map(p => {
          const optional = p.includes('?') || p.includes('=');
          const pname = p.split(/[?:=]/)[0].trim();
          const typeMatch = p.match(/:\s*([\w[\]]+)/);
          return { name: pname, type: typeMatch ? typeMatch[1] : 'string', optional };
        });
        sigs.push({ object: currentClass, verb: name, params, doc });
      }
      doc = '';
      continue;
    }
    if (line.trim() !== '') doc = ''; // any other code line breaks doc→method adjacency
  }
  return sigs;
}

function splitParams(raw: string): string[] {
  // Our convention limits param types to primitives — top-level comma split is safe.
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

// --- Arg mapping: CLI tokens → ordered method arguments ---

export function mapArgs(sig: VerbSig, tokens: string[]): unknown[] {
  const named = new Map<string, string | boolean>();
  const positionals: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith('--')) {
      const key = t.slice(2);
      const param = sig.params.find(p => p.name === key);
      if (param?.type === 'boolean') named.set(key, true);
      else { named.set(key, tokens[i + 1] ?? ''); i++; }
    } else positionals.push(t);
  }
  return sig.params.map(p => {
    if (named.has(p.name)) {
      const v = named.get(p.name)!;
      if (p.type === 'boolean') return true;
      if (p.type === 'number') return parseFloat(String(v));
      if (p.type === 'string[]') return String(v).split(',').filter(Boolean);
      return v;
    }
    if (p.type === 'string[]') { const all = [...positionals]; positionals.length = 0; return all; }
    if (p.type === 'boolean') return undefined;
    const v = positionals.shift();
    if (v === undefined) return undefined;
    return p.type === 'number' ? parseFloat(v) : v;
  });
}

// --- Result rendering: string→raw, array-of-objects→TSV (diffable), else JSON ---

export function render(result: unknown): string {
  if (result === undefined || result === null) return '';
  if (typeof result === 'string') return result;
  if (typeof result === 'number' || typeof result === 'boolean') return String(result);
  if (Array.isArray(result)) {
    if (result.length === 0) return '(empty)';
    if (typeof result[0] === 'object' && result[0] !== null) {
      const keys = Object.keys(result[0] as object);
      const lines = [keys.join('\t')];
      for (const row of result as Record<string, unknown>[]) lines.push(keys.map(k => String(row[k] ?? '')).join('\t'));
      return lines.join('\n');
    }
    return (result as unknown[]).map(String).join('\n');
  }
  return JSON.stringify(result, null, 2);
}

// --- Help ---

export function helpText(object?: string): string {
  const sigs = introspect().filter(s => !object || s.object === object);
  const out: string[] = [];
  const byObject = new Map<string, VerbSig[]>();
  for (const s of sigs) { if (!byObject.has(s.object)) byObject.set(s.object, []); byObject.get(s.object)!.push(s); }
  for (const [obj, verbs] of byObject) {
    out.push(`${obj}:`);
    for (const v of verbs) {
      const params = v.params.map(p => p.optional ? `<?${p.name}>` : `<${p.name}>`).join(' ');
      out.push(`  ${obj.toLowerCase()}.${v.verb} ${params}`.trimEnd());
      if (v.doc) out.push(`      ${v.doc}`);
    }
  }
  return out.join('\n');
}

// --- emitOosh: generate the canonical OOSH wrapper from the introspected signatures ---

export function emitOoshText(scriptName = 'taskChain'): string {
  const sigs = introspect().filter(s => s.verb !== 'complete');
  const out: string[] = [];
  out.push('#!/usr/bin/env bash');
  out.push(`# ${scriptName} — GENERATED by 'objectVerb emitOosh' from skill-classes.ts signatures.`);
  out.push('# DO NOT EDIT — edit the class methods + JSDoc and re-emit. (DRY: code IS the doc.)');
  out.push('');
  out.push(`: \${RAWBIN_HOME:=${REPO}}`);
  out.push('');
  out.push(`private.${scriptName}.dispatch() { ( cd "$RAWBIN_HOME" && npx tsx scripts/objectVerb.ts "$@" ); }`);
  out.push('');
  for (const s of sigs) {
    const obj = s.object.toLowerCase();
    const fn = `${scriptName}.${obj}.${s.verb}`;
    const paramDoc = s.params.map(p => p.optional ? `<?${p.name}>` : `<${p.name}>`).join(' ');
    out.push(`${fn}() # ${paramDoc || ''} # ${s.doc || s.verb}`);
    out.push(`{ private.${scriptName}.dispatch ${s.object} ${s.verb} "$@"; }`);
    if (s.params.length === 0) {
      out.push(`${fn}.completion() { :; }`);
    } else {
      for (const p of s.params) {
        out.push(`${fn}.completion.${p.name}() { private.${scriptName}.dispatch ${s.object} completion ${s.verb} ${p.name}; }`);
      }
    }
    out.push('');
  }
  out.push(`${scriptName}.help() # # list all objects and verbs (introspected)`);
  out.push(`{ private.${scriptName}.dispatch list; }`);
  out.push('');
  out.push(`${scriptName}.start()`);
  out.push('{');
  out.push('  source this 2>/dev/null || source "${OOSH_DIR:-$HOME/oosh}/this"');
  out.push('  log.init.colors 2>/dev/null');
  out.push(`  [ -z "$1" ] && { ${scriptName}.help; return 0; }`);
  out.push('  this.start "$@"');
  out.push('}');
  out.push('');
  out.push(`${scriptName}.start "$@"`);
  out.push('');
  return out.join('\n');
}

// --- emitDocs: generate compact per-object skill docs from the same signatures ---

export function emitDocsText(object: string): string {
  const sigs = introspect().filter(s => s.object === object && s.verb !== 'complete');
  const out: string[] = [];
  out.push(`# ${object} — Object.verb skill`);
  out.push('');
  out.push(`> GENERATED by \`objectVerb emitDocs\` from \`skill-classes.ts\` — do not edit. The class IS the doc.`);
  out.push('');
  out.push('| Verb | Params | Description |');
  out.push('|------|--------|-------------|');
  for (const s of sigs) {
    const params = s.params.map(p => p.optional ? `\`<?${p.name}:${p.type}>\`` : `\`<${p.name}:${p.type}>\``).join(' ') || '—';
    out.push(`| \`${object.toLowerCase()}.${s.verb}\` | ${params} | ${s.doc || ''} |`);
  }
  out.push('');
  out.push('## Invocation');
  out.push('```bash');
  out.push(`taskChain ${object.toLowerCase()}.<verb> [args]                      # OOSH (Tab-completes)`);
  out.push(`npx tsx scripts/objectVerb.ts ${object} <verb> [args]    # direct`);
  out.push('```');
  out.push('');
  out.push(`Logic: \`src/ts/scenario/skill-classes.ts\` → \`class ${object}\`. Dispatcher: \`scripts/objectVerb.ts\`.`);
  out.push('');
  return out.join('\n');
}

// --- emitClaudeSkills: generate official Claude Code skills (.claude/skills/<name>/SKILL.md) ---

export function emitClaudeSkillText(object: string): string {
  const sigs = introspect().filter(s => s.object === object && s.verb !== 'complete');
  const verbsList = sigs.map(s => s.verb).join(', ');
  const out: string[] = [];
  out.push('---');
  out.push(`name: rawbin-${object.toLowerCase()}`);
  const purpose = object === 'Chain'
    ? 'Web4RawBin traceability chain operations — the CANONICAL completion measure. Use when measuring chain completion (scoreboard/followUp), listing or diffing the COMPLETE set (listComplete/snapshotComplete), wiring Method-Impl-Test nodes (wireImplNode/wireAllMissing), linting markers for invented-suffix/shared-impl violations (lintMarkers), or regenerating the traceability matrix (generateMatrix).'
    : object === 'Velocity'
      ? 'Web4RawBin team velocity dashboard — chain completion + git throughput per time window. Use when reporting team velocity, commits/hr, version bumps, or projecting time-to-complete.'
      : `Web4RawBin ${object} skill (Object.verb).`;
  out.push(`description: ${purpose}`);
  out.push('---');
  out.push('');
  out.push(`# rawbin-${object.toLowerCase()} (Object.verb)`);
  out.push('');
  out.push(`> GENERATED by \`objectVerb emitClaudeSkills\` from \`src/ts/scenario/skill-classes.ts\` — do not edit; edit the class and re-emit.`);
  out.push('');
  out.push('## Invocation');
  out.push('');
  out.push('```bash');
  out.push(`npx tsx scripts/objectVerb.ts ${object} <verb> [positional...] [--param value]   # from repo root`);
  out.push(`taskChain ${object.toLowerCase()}.<verb> [args]                                  # OOSH shells (Tab-completes)`);
  out.push('```');
  out.push('');
  out.push(`Repo: /Users/Shared/Workspaces/2cuGitHub/Web4RawBin. Run from repo root (or cd there) so the scenario index resolves.`);
  out.push('');
  out.push('## Verbs');
  out.push('');
  out.push('| Verb | Params | Description |');
  out.push('|------|--------|-------------|');
  for (const s2 of sigs) {
    const params = s2.params.map(p => p.optional ? `\`<?${p.name}:${p.type}>\`` : `\`<${p.name}:${p.type}>\``).join(' ') || '—';
    out.push(`| ${s2.verb} | ${params} | ${s2.doc || ''} |`);
  }
  out.push('');
  out.push('## Learning OOSH & this skill (Tab is the manual)');
  out.push('');
  out.push('This skill follows the OOSH Object.verb model — learn OOSH itself from `~/oosh/docs/`');
  out.push('(`first-principles.md`, `command-creation.md`, `completion-system.md`, `oosh-architecture.md`).');
  out.push('');
  out.push('You do NOT need docs to learn the skill: **Tab completion IS the documentation**.');
  out.push('The c2 engine reads the method signatures directly (DRY — code is the doc), so in any');
  out.push('OOSH shell just type the script name and explore:');
  out.push('');
  out.push('```bash');
  out.push('taskChain <Tab><Tab>            # lists every Object.verb method');
  out.push(`taskChain ${object.toLowerCase()}.<Tab><Tab>      # narrows to this object's verbs`);
  out.push(`taskChain ${object.toLowerCase()}.<verb> <Tab>    # completes the next parameter's candidates`);
  out.push('```');
  out.push('');
  out.push('To learn or verify it interactively the way a human user would, drive a REAL bash');
  out.push('shell in a tmux pane via otmux (the canonical OOSH completion-testing pattern):');
  out.push('');
  out.push('```bash');
  out.push('otmux new skillLearn                          # fresh session with an OOSH bash');
  out.push(`otmux send skillLearn 'taskChain ' Tab Tab    # send a literal Tab keypress`);
  out.push('otmux pane.capture skillLearn 20              # read what completion offered');
  out.push('otmux kill skillLearn                         # clean up');
  out.push('```');
  out.push('');
  out.push('## Rules');
  out.push('');
  out.push('- ONE canonical completion measure: Chain.followUp — never produce a competing count.');
  out.push('- HARD RULE: marker uuid = uuidgen-fresh OR verbatim 36-char copy. One marker = one unit = one method.');
  out.push('- Logic lives in the class; flags are forbidden as skill surface — verbs are methods.');
  out.push('');
  return out.join('\n');
}

// --- CLI main (guarded so tests can import without side effects) ---

function main(): void {
  const argv = process.argv.slice(2);
  const [first, second, ...rest] = argv;

  if (!first || first === 'list' || first === 'help') {
    console.log(helpText());
    return;
  }
  if (first === 'emitOosh') {
    const target = path.join(SKILLS_DIR, second || 'taskChain');
    fs.writeFileSync(target, emitOoshText(second || 'taskChain'));
    fs.chmodSync(target, 0o755);
    console.log(`Wrote ${target}`);
    return;
  }
  if (first === 'emitDocs') {
    for (const obj of Object.keys(registry)) {
      const target = path.join(SKILLS_DIR, `${obj.toLowerCase()}.md`);
      fs.writeFileSync(target, emitDocsText(obj));
      console.log(`Wrote ${target}`);
    }
    return;
  }
  if (first === 'emitClaudeSkills') {
    for (const obj of Object.keys(registry)) {
      const dir = path.join(REPO, '.claude/skills', `rawbin-${obj.toLowerCase()}`);
      fs.mkdirSync(dir, { recursive: true });
      const target = path.join(dir, 'SKILL.md');
      fs.writeFileSync(target, emitClaudeSkillText(obj));
      console.log(`Wrote ${target}`);
    }
    return;
  }

  const objectName = Object.keys(registry).find(k => k.toLowerCase() === String(first).toLowerCase());
  if (!objectName) {
    console.error(`Unknown object '${first}'. Objects: ${Object.keys(registry).join(', ')}`);
    process.exit(1);
  }
  if (!second || second === 'help') {
    console.log(helpText(objectName));
    return;
  }
  const instance = registry[objectName]();
  if (second === 'completion') {
    const [verb, param] = rest;
    const candidates = instance.complete?.(verb, param) ?? [];
    for (const c of candidates) console.log(c);
    return;
  }
  const sig = introspect().find(s => s.object === objectName && s.verb === second);
  if (!sig) {
    console.error(`Unknown verb '${second}' on ${objectName}.\n`);
    console.error(helpText(objectName));
    process.exit(1);
  }
  const args = mapArgs(sig, rest);
  const fn = instance[sig.verb] as (...a: unknown[]) => unknown;
  const result = fn.apply(instance, args);
  const text = render(result);
  if (text) console.log(text);
}

const entry = process.argv[1] || '';
if (entry.endsWith('objectVerb.ts') || entry.endsWith('objectVerb.js')) main();
