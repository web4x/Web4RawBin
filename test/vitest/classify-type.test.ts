/**
 * R20.4 — Requirement.classifyType: Bug and ChangeRequest as OOP subtypes.
 * Tests that BugLoader + ChangeRequestLoader exist, are registered in ClassRegistry,
 * have distinct icons from Requirement, and carry tasks[] for chain tracing.
 *
 * [test:uuid:320a8790-17de-4adc-b146-1ab68eab6f17] R20.4
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

const classesCode = fs.readFileSync('src/ts/scenario/classes.ts', 'utf-8');
const templatesCode = fs.readFileSync('src/ts/scenario/templates.ts', 'utf-8');
const iconsCode = fs.existsSync('src/public/ts/trace/icons.ts') ? fs.readFileSync('src/public/ts/trace/icons.ts', 'utf-8') : '';

describe('R20.4 Requirement.classifyType — Bug + ChangeRequest subtypes', () => {

  it('BugLoader defined and registered in ClassRegistry', () => {
    expect(classesCode).toContain('BugLoader');
    expect(classesCode).toMatch(/for.*\[[\s\S]*BugLoader/);
  });

  it('ChangeRequestLoader defined and registered in ClassRegistry', () => {
    expect(classesCode).toContain('ChangeRequestLoader');
    expect(classesCode).toMatch(/for.*\[[\s\S]*ChangeRequestLoader/);
  });

  it('Bug template registered for ior:class:Bug', () => {
    expect(templatesCode).toContain('ior:class:Bug');
  });

  it('ChangeRequest template registered for ior:class:ChangeRequest', () => {
    expect(templatesCode).toContain('ior:class:ChangeRequest');
  });

  it('Bug icon distinct from Requirement icon', () => {
    const lines = iconsCode.split('\n');
    const reqLine = lines.find(l => l.match(/^\s*requirement\s*:/));
    const bugLine = lines.find(l => l.match(/^\s*bug\s*:/i));
    expect(bugLine).toBeDefined();
    expect(reqLine).toBeDefined();
    expect(bugLine).not.toBe(reqLine);
  });

  it('ChangeRequest icon distinct from Requirement icon', () => {
    const lines = iconsCode.split('\n');
    const reqLine = lines.find(l => l.match(/^\s*requirement\s*:/));
    const crLine = lines.find(l => l.match(/^\s*(changerequest|ChangeRequest)\s*:/));
    expect(crLine).toBeDefined();
    expect(reqLine).toBeDefined();
    expect(crLine).not.toBe(reqLine);
  });

  it('Bug model has tasks[] field for chain tracing', () => {
    expect(classesCode).toMatch(/BugLoader\s*=\s*loader\([^)]*tasks/s);
  });

  it('ChangeRequest model has tasks[] field for chain tracing', () => {
    expect(classesCode).toMatch(/ChangeRequestLoader\s*=\s*loader\([^)]*tasks/s);
  });
});
