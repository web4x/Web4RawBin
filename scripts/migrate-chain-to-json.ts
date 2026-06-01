/**
 * T151 — Parse MD Traceability sections → JSON model arrays.
 *
 * Usage:
 *   npx tsx scripts/migrate-chain-to-json.ts --dry-run
 *   npx tsx scripts/migrate-chain-to-json.ts --apply
 *
 * [impl:uuid:51151a01-b302-4c03-ad04-e05f06a07d14] R17.30
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const SPRINTS_DIR = path.join(__dirname, '../scrum.pmo/sprints');

interface TraceEntry {
  type: string;
  ref: string;
  label: string;
  uuid?: string;
  commit?: string;
}

function parseBullet(line: string): TraceEntry {
  const trimmed = line.replace(/^\s*-\s*/, '').trim();

  // [Link](./path.md) — description
  const linkMatch = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)(.*)$/);
  if (linkMatch) {
    const label = linkMatch[1] + (linkMatch[3] ? linkMatch[3].replace(/^\s*[—–-]\s*/, ' — ') : '');
    const ref = linkMatch[2];
    const uuidM = ref.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    let type = 'text';
    if (ref.includes('task-')) type = 'task';
    else if (ref.includes('requirement')) type = 'requirement';
    else if (ref.includes('planning')) type = 'sprint';
    else if (ref.includes('.puml')) type = 'puml';
    return { type, ref, label: label.trim(), uuid: uuidM?.[1] };
  }

  // `[requirement:uuid:<v4>]` or `[task:uuid:<v4>]`
  const uuidTag = trimmed.match(/\[(requirement|task|uc):uuid:([0-9a-f-]{36})\]/i);
  if (uuidTag) return { type: uuidTag[1], ref: `ior:instance:${uuidTag[2]}`, label: trimmed, uuid: uuidTag[2] };

  // **Bold:** text
  const boldMatch = trimmed.match(/^\*\*([^*]+)\*\*[:\s]*(.*)/);
  if (boldMatch) {
    const key = boldMatch[1].toLowerCase();
    const val = boldMatch[2].trim();
    if (key.includes('requirement')) return { type: 'requirement', ref: '', label: val || trimmed };
    if (key.includes('use case')) return { type: 'usecase', ref: '', label: val || trimmed };
    if (key.includes('puml')) return { type: 'puml', ref: '', label: val || trimmed };
    if (key.includes('class') || key.includes('method')) return { type: 'class/method', ref: '', label: val || trimmed };
    return { type: 'text', ref: '', label: trimmed };
  }

  // Plain text
  return { type: 'text', ref: '', label: trimmed };
}

function parseTraceSection(text: string): { links: { up: TraceEntry[]; down: TraceEntry[]; follows: TraceEntry[]; changes: TraceEntry[] }; chain: { requirements: TraceEntry[]; useCases: TraceEntry[]; puml: TraceEntry[]; classMethods: TraceEntry[] }; bulletCount: number } {
  const links = { up: [] as TraceEntry[], down: [] as TraceEntry[], follows: [] as TraceEntry[], changes: [] as TraceEntry[] };
  const chain = { requirements: [] as TraceEntry[], useCases: [] as TraceEntry[], puml: [] as TraceEntry[], classMethods: [] as TraceEntry[] };
  let bulletCount = 0;

  const lines = text.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('`[task:uuid:')) continue;

    // Section headers (including aliases: relates, completes, depends, gates, gated-by, context)
    if (/^-\s+up\s*$/i.test(trimmed)) { currentSection = 'up'; continue; }
    if (/^-\s+down\s*$/i.test(trimmed)) { currentSection = 'down'; continue; }
    if (/^-\s+(follows|completes|depends|gated-by)\s*$/i.test(trimmed)) { currentSection = 'follows'; continue; }
    if (/^-\s+(changes|gates)\s*$/i.test(trimmed)) { currentSection = 'changes'; continue; }
    if (/^-\s+(requires)\s*$/i.test(trimmed)) { currentSection = 'up'; continue; }
    if (/^-\s+(enables)\s*$/i.test(trimmed)) { currentSection = 'down'; continue; }
    if (/^-\s+(relates|context)\s*$/i.test(trimmed)) { currentSection = 'follows'; continue; }
    if (/^-\s+chain\b/i.test(trimmed)) { currentSection = 'chain'; continue; }

    // Chain sub-sections
    if (currentSection === 'chain') {
      if (/\*\*requirement/i.test(trimmed)) { chain.requirements.push(parseBullet(trimmed)); bulletCount++; continue; }
      if (/\*\*use case/i.test(trimmed)) { chain.useCases.push(parseBullet(trimmed)); bulletCount++; continue; }
      if (/\*\*puml/i.test(trimmed)) { chain.puml.push(parseBullet(trimmed)); bulletCount++; continue; }
      if (/\*\*class\/method/i.test(trimmed) || /\*\*class\b/i.test(trimmed) || /\*\*method\b/i.test(trimmed)) { chain.classMethods.push(parseBullet(trimmed)); bulletCount++; continue; }
      if (/\*\*test/i.test(trimmed)) { chain.classMethods.push(parseBullet(trimmed)); bulletCount++; continue; }
      if (trimmed.startsWith('-')) {
        // Generic chain bullet (e.g. "- This task IS the chain-integrity audit")
        chain.classMethods.push(parseBullet(trimmed));
        bulletCount++;
        continue;
      }
      // Continuation line (no leading dash) — append to last entry if exists
      const lastArr = chain.classMethods.length ? chain.classMethods : chain.requirements.length ? chain.requirements : chain.useCases.length ? chain.useCases : chain.puml;
      if (lastArr.length > 0) { lastArr[lastArr.length - 1].label += ' ' + trimmed; }
      continue;
    }

    // Sub-bullets under up/down/follows/changes
    if (currentSection) {
      if (trimmed.startsWith('-')) {
        const entry = parseBullet(trimmed);
        if (currentSection === 'up') links.up.push(entry);
        else if (currentSection === 'down') links.down.push(entry);
        else if (currentSection === 'follows') links.follows.push(entry);
        else if (currentSection === 'changes') links.changes.push(entry);
        bulletCount++;
      } else {
        // Continuation line — append to last entry in current section
        const arr = currentSection === 'up' ? links.up : currentSection === 'down' ? links.down : currentSection === 'follows' ? links.follows : links.changes;
        if (arr.length > 0) { arr[arr.length - 1].label += ' ' + trimmed; }
      }
    }
  }

  return { links, chain, bulletCount };
}

const idx = new ScenarioIndex(INDEX_DIR);
const dryRun = !process.argv.includes('--apply');
let totalBullets = 0;
let totalEntries = 0;
let mismatches = 0;

console.log(`\n=== T151 Chain-to-JSON Migration ${dryRun ? '(DRY RUN)' : '(APPLY)'} ===\n`);
console.log('Task | MD Bullets | JSON Entries | Match');
console.log('-----|-----------|-------------|------');

for (const sprint of fs.readdirSync(SPRINTS_DIR).filter(s => s.startsWith('sprint-'))) {
  const sprintDir = path.join(SPRINTS_DIR, sprint);
  for (const file of fs.readdirSync(sprintDir).filter(f => f.startsWith('task-') && f.endsWith('.md'))) {
    const taskPath = path.join(sprintDir, file);
    const text = fs.readFileSync(taskPath, 'utf-8');

    // Extract Traceability section
    const traceMatch = text.match(/## Traceability\s*\n([\s\S]*?)(?=\n## |\n---\s*$|$)/i);
    if (!traceMatch) continue;

    const { links, chain, bulletCount } = parseTraceSection(traceMatch[1]);
    const jsonEntries = links.up.length + links.down.length + links.follows.length + links.changes.length + chain.requirements.length + chain.useCases.length + chain.puml.length + chain.classMethods.length;

    totalBullets += bulletCount;
    totalEntries += jsonEntries;
    const match = bulletCount === jsonEntries ? '✓' : '✗';
    if (bulletCount !== jsonEntries) mismatches++;

    const slug = file.replace('.md', '');
    console.log(`${slug} | ${bulletCount} | ${jsonEntries} | ${match}`);

    if (!dryRun && jsonEntries > 0) {
      // Find the scenario unit for this task
      const uuidMatch = text.match(/\[task:uuid:([0-9a-f-]{36})\]/i);
      if (!uuidMatch) continue;
      const uuid = uuidMatch[1].toLowerCase();
      const unit = idx.get(uuid);
      if (!unit) continue;
      const m = unit.model as Record<string, unknown>;
      m.links = links;
      m.chain = chain;
      idx.put(uuid, unit);
    }
  }
}

console.log(`\nTotal: ${totalBullets} MD bullets → ${totalEntries} JSON entries. Mismatches: ${mismatches}`);
if (dryRun) console.log('Dry run complete. Use --apply to write.');
