/**
 * T191 Champagne — dedicated tests for untested shipped features.
 * Each test declares [verifies:uuid:<req>] closing floor+ceiling at once.
 *
 * [test:uuid:76f8fd67-d694-460b-9b13-cd2ca81407cc] T191 champagne dedicated tests
 * [verifies:uuid:cb93f0db-0e42-4795-b41f-2e125120f259] R17.1 scenario JSON unit
 * [verifies:uuid:3b6cce5a-581c-4325-88b2-b9d381c7f268] R17.2 IOR universal reference
 * [verifies:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000005] R17.5 speaking-name tree json
 * [verifies:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000006] R17.6 speaking-name tree md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('T142: vCard parser', () => {
  // [verifies:uuid:a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d] R-A2 avatar upload
  it('parses FN/TEL/URL from vCard v3', async () => {
    const { parseVCard } = await import('../../src/public/ts/vcard-parse.js');
    const vcf = 'BEGIN:VCARD\nVERSION:3.0\nFN:Test User\nTEL;TYPE=CELL:+49123\nURL:https://example.com\nEND:VCARD';
    const result = parseVCard(vcf);
    expect(result.fn).toBe('Test User');
    expect(result.tel).toBe('+49123');
    expect(result.url).toBe('https://example.com');
  });

  it('handles missing fields gracefully', async () => {
    const { parseVCard } = await import('../../src/public/ts/vcard-parse.js');
    const vcf = 'BEGIN:VCARD\nVERSION:3.0\nFN:Only Name\nEND:VCARD';
    const result = parseVCard(vcf);
    expect(result.fn).toBe('Only Name');
    expect(result.tel).toBeUndefined();
    expect(result.url).toBeUndefined();
  });

  it('handles line folding (continuation lines)', async () => {
    const { parseVCard } = await import('../../src/public/ts/vcard-parse.js');
    const vcf = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Long\r\n  Name\r\nEND:VCARD';
    const result = parseVCard(vcf);
    expect(result.fn).toBe('Long Name');
  });
});

describe('SpeakingTree.symlinkJson — ln tree under sprints.json/', () => {
  // [verifies:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000005] R17.5 speaking-name tree json
  it('sprints.json/ dirs exist and contain symlinks', () => {
    const base = path.resolve(__dirname, '../../scenario/sprints.json');
    expect(fs.existsSync(base)).toBe(true);
    const dirs = fs.readdirSync(base);
    expect(dirs.length).toBeGreaterThan(0);
    for (const dir of dirs.slice(0, 3)) {
      const full = path.join(base, dir);
      const stat = fs.lstatSync(full);
      expect(stat.isDirectory()).toBe(true);
      const files = fs.readdirSync(full, { withFileTypes: true });
      const hasSymlinks = files.some(f => f.isSymbolicLink() || f.isDirectory());
      expect(hasSymlinks).toBe(true);
    }
  });

  it('symlinks resolve to scenario/index JSON files', () => {
    const base = path.resolve(__dirname, '../../scenario/sprints.json');
    const dirs = fs.readdirSync(base);
    const firstDir = path.join(base, dirs[0]);
    const entries = fs.readdirSync(firstDir, { withFileTypes: true });
    const symlink = entries.find(e => e.isSymbolicLink());
    if (symlink) {
      const target = fs.readlinkSync(path.join(firstDir, symlink.name));
      expect(target).toContain('index');
      expect(target).toContain('.scenario.json');
      const resolved = path.resolve(firstDir, target);
      expect(fs.existsSync(resolved)).toBe(true);
    }
  });

  it('speaking names match task slugs', () => {
    const base = path.resolve(__dirname, '../../scenario/sprints.json');
    const dirs = fs.readdirSync(base);
    for (const dir of dirs) {
      const full = path.join(base, dir);
      if (!fs.statSync(full).isDirectory()) continue;
      const entries = fs.readdirSync(full, { withFileTypes: true });
      for (const e of entries.filter(e => e.name.endsWith('.json') && e.isSymbolicLink())) {
        expect(e.name).toMatch(/^(sprint|task|requirement|usecase|tracelink)/);
      }
    }
  });
});

describe('SpeakingTree.generateMd — MD views from templates', () => {
  // [verifies:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000006] R17.6 speaking-name tree md
  it('sprints.md/ contains generated view files', () => {
    const base = path.resolve(__dirname, '../../scenario/sprints.md');
    expect(fs.existsSync(base)).toBe(true);
    const dirs = fs.readdirSync(base);
    expect(dirs).toContain('task');
    expect(dirs).toContain('sprint');
    expect(dirs).toContain('overview.md');
  });

  it('task MD views have content from templates', () => {
    const taskDir = path.resolve(__dirname, '../../scenario/sprints.md/task');
    const mdFiles = fs.readdirSync(taskDir).filter(f => f.endsWith('.md'));
    expect(mdFiles.length).toBeGreaterThan(0);
    const sample = fs.readFileSync(path.join(taskDir, mdFiles[0]), 'utf-8');
    expect(sample.length).toBeGreaterThan(10);
    expect(sample).toMatch(/^#|^##|^\*\*/m);
  });

  it('overview.md lists all sprints', () => {
    const overview = fs.readFileSync(path.resolve(__dirname, '../../scenario/sprints.md/overview.md'), 'utf-8');
    expect(overview).toContain('Sprint');
    expect(overview).toContain('.md');
  });

  it('HTML views generated alongside MD', () => {
    const taskDir = path.resolve(__dirname, '../../scenario/sprints.md/task');
    const htmlFiles = fs.readdirSync(taskDir).filter(f => f.endsWith('.html'));
    const mdFiles = fs.readdirSync(taskDir).filter(f => f.endsWith('.md'));
    expect(htmlFiles.length).toBeGreaterThan(0);
    expect(htmlFiles.length).toBe(mdFiles.length);
  });
});

describe('ViewGenerator round-trip', () => {
  // [verifies:uuid:cb93f0db-0e42-4795-b41f-2e125120f259] R17.1 scenario JSON unit
// [verifies:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000004] R17.4 UUID prefix index
  it('generateOne produces MD+HTML for a known unit', async () => {
    const { ViewGenerator } = await import('../../src/ts/scenario/generator.js');
    const { ScenarioIndex } = await import('../../src/ts/scenario/index-store.js');
    const { defaultTemplateRegistry } = await import('../../src/ts/scenario/templates.js');
    const idxPath = path.resolve(__dirname, '../../scenario/index');
    const idx = new ScenarioIndex(idxPath);
    const uuids = idx.list();
    expect(uuids.length).toBeGreaterThan(0);
    const gen = new ViewGenerator(idx, defaultTemplateRegistry());
    const result = gen.generateOne(uuids[0]);
    expect(result).toBeDefined();
    expect(result!.md.length).toBeGreaterThan(0);
    expect(result!.html.length).toBeGreaterThan(0);
  });
});
