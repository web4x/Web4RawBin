/**
 * T140 — Source location extraction + git anchor for scenario units.
 *
 * [impl:uuid:40140a01-b302-4c03-ad04-e05f06a07b10] R17.19
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

export interface SourceLocation {
  file: string;
  lines: [number, number];
  commit: string;
  repo: string;
  ior: string;
}

export function buildSourceIor(file: string, commit: string, lines: [number, number]): string {
  return `ior:file:${file}?commit=${commit}&lines=${lines[0]}-${lines[1]}`;
}

export function makeSource(file: string, lines: [number, number], projectRoot: string): SourceLocation {
  const commit = getFileCommit(file, projectRoot);
  return { file, lines, commit, repo: 'Web4RawBin', ior: buildSourceIor(file, commit, lines) };
}

export function getFileCommit(filePath: string, cwd: string): string {
  try {
    return execSync(`git log --format=%h -1 -- "${filePath}"`, { cwd, encoding: 'utf-8' }).trim() || 'HEAD';
  } catch { return 'HEAD'; }
}

export function extractPumlUseCaseRanges(filePath: string): Map<string, [number, number]> {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const ranges = new Map<string, [number, number]>();
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/class\s+"([^"]+)"\s+<<UseCase>>/);
    if (!match) continue;
    const name = match[1];
    const startLine = i + 1;
    let depth = 0; let endLine = startLine;
    for (let j = i; j < lines.length; j++) {
      depth += (lines[j].match(/{/g) || []).length;
      depth -= (lines[j].match(/}/g) || []).length;
      if (depth === 0 && j > i) { endLine = j + 1; break; }
    }
    ranges.set(name, [startLine, endLine]);
  }
  return ranges;
}

export function extractTsClassRanges(filePath: string): Map<string, [number, number]> {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const ranges = new Map<string, [number, number]>();
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/(?:export\s+)?class\s+(\w+)/);
    if (!m) continue;
    const start = i + 1;
    let depth = 0; let end = start;
    for (let j = i; j < lines.length; j++) {
      depth += (lines[j].match(/{/g) || []).length;
      depth -= (lines[j].match(/}/g) || []).length;
      if (depth === 0 && j > i) { end = j + 1; break; }
    }
    ranges.set(m[1], [start, end]);
  }
  return ranges;
}

export function extractTsMethodRanges(filePath: string, className: string): Map<string, [number, number]> {
  const ranges = new Map<string, [number, number]>();
  const classRange = extractTsClassRanges(filePath).get(className);
  if (!classRange) return ranges;
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const [cs, ce] = classRange;
  for (let i = cs - 1; i < ce - 1; i++) {
    const m = lines[i].match(/^\s+(?:async\s+)?(?:private\s+|public\s+|protected\s+|static\s+)*(\w+)\s*\(/);
    if (!m || ['constructor', 'if', 'for', 'while', 'switch', 'catch', 'return'].includes(m[1])) continue;
    const start = i + 1;
    let depth = 0; let end = start;
    for (let j = i; j < ce - 1; j++) {
      depth += (lines[j].match(/{/g) || []).length;
      depth -= (lines[j].match(/}/g) || []).length;
      if (depth === 0 && j > i) { end = j + 1; break; }
    }
    ranges.set(m[1], [start, end]);
  }
  return ranges;
}

export interface SourceIssue {
  ref: string;
  reason: string;
}

export function validateAllSources(idx: import('./index-store.js').ScenarioIndex, projectRoot: string): SourceIssue[] {
  const issues: SourceIssue[] = [];
  for (const uuid of idx.list()) {
    const unit = idx.get(uuid);
    if (!unit) continue;
    const src = (unit.model as Record<string, unknown>).source as SourceLocation | undefined;
    if (!src) continue;
    const className = unit.ior.replace('ior:class:', '').toLowerCase();
    for (const reason of validateSource(src, projectRoot)) {
      issues.push({ ref: `${className}:${uuid}`, reason: `source: ${reason}` });
    }
  }
  return issues;
}

const BACK_REF_FIELDS: Record<string, string[]> = {
  Task: ['requirements'],
  UseCase: ['requirement', 'requirements'],
  Method: ['requirement'],
  Test: ['requirements'],
};

export function validateNoBackRefs(idx: import('./index-store.js').ScenarioIndex): SourceIssue[] {
  const issues: SourceIssue[] = [];
  for (const uuid of idx.list()) {
    const unit = idx.get(uuid);
    if (!unit) continue;
    const className = unit.ior.replace('ior:class:', '');
    const fields = BACK_REF_FIELDS[className];
    if (!fields) continue;
    const m = unit.model as Record<string, unknown>;
    for (const field of fields) {
      const val = m[field];
      if (val && (Array.isArray(val) ? val.length > 0 : val !== null)) {
        issues.push({ ref: `${className.toLowerCase()}:${uuid}`, reason: `back-ref field '${field}' still present` });
      }
    }
    const links = m.links as Record<string, unknown> | undefined;
    if (links && 'up' in links) {
      const up = links.up;
      if (up && (Array.isArray(up) ? up.length > 0 : true)) {
        issues.push({ ref: `${className.toLowerCase()}:${uuid}`, reason: `back-ref field 'links.up' still present` });
      }
    }
  }
  return issues;
}

export function validateSource(src: SourceLocation, projectRoot: string): string[] {
  const issues: string[] = [];
  const fullPath = `${projectRoot}/${src.file}`;
  if (!fs.existsSync(fullPath)) { issues.push(`file not found: ${src.file}`); return issues; }
  const lineCount = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
  if (src.lines[0] < 1 || src.lines[1] > lineCount) issues.push(`lines ${src.lines[0]}-${src.lines[1]} out of range (file has ${lineCount} lines)`);
  try { execSync(`git cat-file -t ${src.commit}`, { cwd: projectRoot, encoding: 'utf-8' }); } catch { issues.push(`commit ${src.commit} not found`); }
  return issues;
}
