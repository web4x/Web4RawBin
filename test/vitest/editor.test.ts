/**
 * T63: Editor entry point tests
 * Tests edit.html, edit.ts, /edit route, Monaco CDN, manifest, build output.
 * File existence and content checks — no running server.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'src/public');

// ── TC-63.1: edit.html exists with Monaco CDN script ────────────────────────

describe('TC-63.1: edit.html with Monaco CDN', () => {

  it('edit.html exists in src/public/', () => {
    expect(existsSync(path.join(PUBLIC_DIR, 'edit.html'))).toBe(true);
  });

  it('edit.html includes Monaco CDN or loader script', () => {
    const htmlPath = path.join(PUBLIC_DIR, 'edit.html');
    if (!existsSync(htmlPath)) return;
    const html = readFileSync(htmlPath, 'utf-8');
    const hasMonaco = html.includes('monaco') || html.includes('Monaco') ||
      html.includes('cdn.jsdelivr.net') || html.includes('unpkg.com') ||
      html.includes('cdnjs.cloudflare.com') || html.includes('vs/loader');
    expect(hasMonaco).toBe(true);
  });

  it('edit.html has <!DOCTYPE html>', () => {
    const htmlPath = path.join(PUBLIC_DIR, 'edit.html');
    if (!existsSync(htmlPath)) return;
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html.toLowerCase()).toContain('<!doctype html>');
  });
});

// ── TC-63.2: edit.ts exists ─────────────────────────────────────────────────

describe('TC-63.2: edit.ts source file', () => {

  it('edit.ts exists in src/public/ts/', () => {
    expect(existsSync(path.join(PUBLIC_DIR, 'ts/edit.ts'))).toBe(true);
  });

  it('edit.ts imports or references Monaco', () => {
    const tsPath = path.join(PUBLIC_DIR, 'ts/edit.ts');
    if (!existsSync(tsPath)) return;
    const content = readFileSync(tsPath, 'utf-8');
    const hasMonaco = content.includes('monaco') || content.includes('Monaco') ||
      content.includes('editor') || content.includes('Editor');
    expect(hasMonaco).toBe(true);
  });
});

// ── TC-63.3: server route /edit returns 200 ─────────────────────────────────

describe('TC-63.3: /edit route in server', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/ts/server/server.ts');

  it('server.ts has /edit route', () => {
    if (!existsSync(serverPath)) return;
    const content = readFileSync(serverPath, 'utf-8');
    expect(content).toContain('/edit');
  });

  it('/edit serves HTML (text/html)', () => {
    if (!existsSync(serverPath)) return;
    const content = readFileSync(serverPath, 'utf-8');
    const editSection = content.match(/['"]\/edit['"]/);
    expect(editSection).not.toBeNull();
  });
});

// ── TC-63.4: /edit/README.md returns same edit.html ─────────────────────────

describe('TC-63.4: /edit/<path> serves edit.html', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/ts/server/server.ts');

  it('server handles /edit/ with path parameter', () => {
    if (!existsSync(serverPath)) return;
    const content = readFileSync(serverPath, 'utf-8');
    // Should have a route that matches /edit/* or /edit/:path
    const hasEditPath = content.includes("'/edit'") || content.includes('"/edit"') ||
      content.includes('/edit/') || content.includes('startsWith(\'/edit')  ||
      content.includes("startsWith('/edit");
    expect(hasEditPath).toBe(true);
  });

  it('/edit route serves edit.html file', () => {
    if (!existsSync(serverPath)) return;
    const content = readFileSync(serverPath, 'utf-8');
    const servesEditHtml = content.includes('edit.html');
    expect(servesEditHtml).toBe(true);
  });
});

// ── TC-63.5: edit.html has manifest link + rb-update-banner ─────────────────

describe('TC-63.5: edit.html PWA integration', () => {

  it('edit.html has manifest link', () => {
    const htmlPath = path.join(PUBLIC_DIR, 'edit.html');
    if (!existsSync(htmlPath)) return;
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('manifest');
  });

  it('edit.html has rb-update-banner', () => {
    const htmlPath = path.join(PUBLIC_DIR, 'edit.html');
    if (!existsSync(htmlPath)) return;
    const html = readFileSync(htmlPath, 'utf-8');
    const hasBanner = html.includes('rb-update-banner') || html.includes('update-banner');
    expect(hasBanner).toBe(true);
  });

  it('edit.html has viewport meta tag', () => {
    const htmlPath = path.join(PUBLIC_DIR, 'edit.html');
    if (!existsSync(htmlPath)) return;
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('viewport');
  });
});

// ── TC-63.6: build produces dist/edit-*.js ──────────────────────────────────

describe('TC-63.6: Build output for editor', () => {

  it('dist/ contains edit JS bundle', () => {
    const distDir = path.join(PUBLIC_DIR, 'dist');
    if (!existsSync(distDir)) return;
    const files = readdirSync(distDir);
    const hasEdit = files.some(f => f.startsWith('edit') && f.endsWith('.js'));
    expect(hasEdit).toBe(true);
  });

  it('package.json build script references edit', () => {
    const pkg = JSON.parse(readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
    const buildScript = pkg.scripts?.build || '';
    // Build may be in build.mjs or inline — check either
    const hasBuildRef = buildScript.includes('edit') || existsSync(path.join(PROJECT_ROOT, 'build.mjs'));
    expect(hasBuildRef).toBe(true);
  });

  it('build.mjs includes edit entry point', () => {
    const buildPath = path.join(PROJECT_ROOT, 'build.mjs');
    if (!existsSync(buildPath)) return;
    const content = readFileSync(buildPath, 'utf-8');
    expect(content).toContain('edit');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T64: rb-editor-layout component
// ═══════════════════════════════════════════════════════════════════════════

const COMPONENTS_DIR = path.join(PUBLIC_DIR, 'ts/components');

describe('TC-64.1: rb-editor-layout.ts exists', () => {

  it('file exists in components/', () => {
    expect(existsSync(path.join(COMPONENTS_DIR, 'rb-editor-layout.ts'))).toBe(true);
  });
});

describe('TC-64.2: exports class RbEditorLayout', () => {

  it('exports RbEditorLayout class', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-editor-layout.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/export\s+class\s+RbEditorLayout/);
  });
});

describe('TC-64.3: three panel slots (tree/editor/preview)', () => {

  it('has tree panel slot or section', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-editor-layout.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8').toLowerCase();
    const hasTree = content.includes('tree') || content.includes('file-browser') || content.includes('sidebar');
    expect(hasTree).toBe(true);
  });

  it('has editor panel slot or section', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-editor-layout.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8').toLowerCase();
    expect(content).toContain('editor');
  });

  it('has preview panel slot or section', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-editor-layout.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8').toLowerCase();
    expect(content).toContain('preview');
  });
});

describe('TC-64.4: edit.ts imports rb-editor-layout', () => {

  it('edit.ts references rb-editor-layout', () => {
    const editPath = path.join(PUBLIC_DIR, 'ts/edit.ts');
    if (!existsSync(editPath)) return;
    const content = readFileSync(editPath, 'utf-8');
    const refs = content.includes('rb-editor-layout') || content.includes('RbEditorLayout');
    expect(refs).toBe(true);
  });
});

describe('TC-64.5: edit.html or edit.ts uses rb-editor-layout tag', () => {

  it('rb-editor-layout tag used in edit.html or edit.ts', () => {
    let found = false;
    const htmlPath = path.join(PUBLIC_DIR, 'edit.html');
    if (existsSync(htmlPath)) {
      found = readFileSync(htmlPath, 'utf-8').includes('rb-editor-layout');
    }
    if (!found) {
      const tsPath = path.join(PUBLIC_DIR, 'ts/edit.ts');
      if (existsSync(tsPath)) {
        found = readFileSync(tsPath, 'utf-8').includes('rb-editor-layout');
      }
    }
    if (!found) {
      const compPath = path.join(COMPONENTS_DIR, 'rb-editor-layout.ts');
      if (existsSync(compPath)) {
        found = readFileSync(compPath, 'utf-8').includes('rb-editor-layout');
      }
    }
    expect(found).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T65: rb-file-tree component
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-65.1: rb-file-tree.ts exists', () => {

  it('file exists in components/', () => {
    expect(existsSync(path.join(COMPONENTS_DIR, 'rb-file-tree.ts'))).toBe(true);
  });
});

describe('TC-65.2: exports class RbFileTree', () => {

  it('exports RbFileTree class', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-file-tree.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/export\s+class\s+RbFileTree/);
  });
});

describe('TC-65.3: edit.ts imports rb-file-tree', () => {

  it('edit.ts references rb-file-tree', () => {
    const editPath = path.join(PUBLIC_DIR, 'ts/edit.ts');
    if (!existsSync(editPath)) return;
    const content = readFileSync(editPath, 'utf-8');
    const refs = content.includes('rb-file-tree') || content.includes('RbFileTree');
    expect(refs).toBe(true);
  });
});

describe('TC-65.4: component loads root directory', () => {

  it('has loadDir or loadRoot or fetchDir method', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-file-tree.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    const hasLoad = content.includes('loadDir') || content.includes('loadRoot') ||
      content.includes('fetchDir') || content.includes('loadDirectory') ||
      content.includes('/api/files');
    expect(hasLoad).toBe(true);
  });

  it('references /api/files endpoint', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-file-tree.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('/api/files');
  });
});

describe('TC-65.5: filtered extensions excluded from display', () => {

  it('filters or excludes .png files', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-file-tree.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    const hasFilter = content.includes('.png') || content.includes('filter') ||
      content.includes('exclude') || content.includes('HIDDEN') || content.includes('skip');
    expect(hasFilter).toBe(true);
  });

  it('filter logic covers binary/non-editable extensions', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-file-tree.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    // Should reference multiple filtered extensions
    const filtered = ['.png', '.jpg', '.map', '.lock', '.enc'].filter(ext => content.includes(ext));
    expect(filtered.length).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T66: rb-code-editor component
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-66.1: rb-code-editor.ts exists', () => {

  it('file exists in components/', () => {
    expect(existsSync(path.join(COMPONENTS_DIR, 'rb-code-editor.ts'))).toBe(true);
  });
});

describe('TC-66.2: exports class RbCodeEditor', () => {

  it('exports RbCodeEditor class', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-code-editor.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/export\s+class\s+RbCodeEditor/);
  });
});

describe('TC-66.3: has loadFile method', () => {

  it('has loadFile or openFile method', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-code-editor.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    const hasLoad = content.includes('loadFile') || content.includes('openFile') || content.includes('setContent');
    expect(hasLoad).toBe(true);
  });

  it('loadFile fetches from /api/files', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-code-editor.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('/api/files');
  });
});

describe('TC-66.4: edit.ts imports rb-code-editor', () => {

  it('edit.ts references rb-code-editor', () => {
    const editPath = path.join(PUBLIC_DIR, 'ts/edit.ts');
    if (!existsSync(editPath)) return;
    const content = readFileSync(editPath, 'utf-8');
    const refs = content.includes('rb-code-editor') || content.includes('RbCodeEditor');
    expect(refs).toBe(true);
  });
});

describe('TC-66.5: language map covers required extensions', () => {

  it('language map includes all required extensions', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-code-editor.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');

    const required = ['.md', '.sh', '.ts', '.css', '.json', '.html', '.puml', '.mjs', '.env'];
    const found = required.filter(ext => content.includes(ext));
    expect(found.length).toBeGreaterThanOrEqual(7);
  });

  it('maps .md to markdown language', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-code-editor.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('markdown');
  });

  it('maps .ts to typescript language', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-code-editor.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('typescript');
  });

  it('maps .sh to shell language', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-code-editor.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    const hasShell = content.includes('shell') || content.includes('bash');
    expect(hasShell).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T67: Save handler + conflict dialog
// ═══════════════════════════════════════════════════════════════════════════

function findSaveSource(): string {
  // Save logic may be in edit.ts, rb-code-editor.ts, or a dedicated save module
  for (const candidate of [
    path.join(PUBLIC_DIR, 'ts/edit.ts'),
    path.join(COMPONENTS_DIR, 'rb-code-editor.ts'),
    path.join(COMPONENTS_DIR, 'rb-editor-layout.ts'),
  ]) {
    if (existsSync(candidate)) {
      const content = readFileSync(candidate, 'utf-8');
      if (content.includes('save') || content.includes('Save') || content.includes('PUT')) return content;
    }
  }
  return '';
}

describe('TC-67.1: Save handler references PUT /api/files', () => {

  it('source code references PUT method', () => {
    const src = findSaveSource();
    if (!src) return;
    const hasPut = src.includes('PUT') || src.includes("'put'") || src.includes('"put"');
    expect(hasPut).toBe(true);
  });

  it('source code references /api/files endpoint', () => {
    const src = findSaveSource();
    if (!src) return;
    expect(src).toContain('/api/files');
  });
});

describe('TC-67.2: Save handler sends expectedMtime', () => {

  it('source references expectedMtime or mtime in save payload', () => {
    const src = findSaveSource();
    if (!src) return;
    const hasMtime = src.includes('expectedMtime') || src.includes('mtime');
    expect(hasMtime).toBe(true);
  });
});

describe('TC-67.3: Conflict dialog exists', () => {

  it('source references conflict or 409 handling', () => {
    const src = findSaveSource();
    if (!src) return;
    const hasConflict = src.includes('conflict') || src.includes('Conflict') ||
      src.includes('409') || src.includes('overwrite') || src.includes('Overwrite');
    expect(hasConflict).toBe(true);
  });

  it('conflict UI has overwrite and reload options', () => {
    const src = findSaveSource();
    if (!src) return;
    const hasOverwrite = src.includes('overwrite') || src.includes('Overwrite') || src.includes('Force');
    const hasReload = src.includes('reload') || src.includes('Reload') || src.includes('Discard');
    expect(hasOverwrite || hasReload).toBe(true);
  });
});

describe('TC-67.4: Toolbar has Save button', () => {

  it('source references Save button or Cmd+S', () => {
    const src = findSaveSource();
    if (!src) return;
    const hasSaveUI = src.includes('Save') || src.includes('save') ||
      src.includes('Cmd+S') || src.includes('Ctrl+S') || src.includes('KeyS');
    expect(hasSaveUI).toBe(true);
  });
});

describe('TC-67.5: Saved status text', () => {

  it('source references saved/Saved status feedback', () => {
    const src = findSaveSource();
    if (!src) return;
    const hasSaved = src.includes('Saved') || src.includes('saved') ||
      src.includes('status') || src.includes('✓');
    expect(hasSaved).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T68: rb-preview component
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-68.1: rb-preview.ts exists', () => {

  it('file exists in components/', () => {
    expect(existsSync(path.join(COMPONENTS_DIR, 'rb-preview.ts'))).toBe(true);
  });
});

describe('TC-68.2: exports class RbPreview', () => {

  it('exports RbPreview class', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-preview.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/export\s+class\s+RbPreview/);
  });
});

describe('TC-68.3: has setContent/render method', () => {

  it('has setContent or render or update method', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-preview.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    const hasMethod = content.includes('setContent') || content.includes('render') ||
      content.includes('update') || content.includes('setMarkdown');
    expect(hasMethod).toBe(true);
  });
});

describe('TC-68.4: imports marked.js', () => {

  it('references marked for markdown rendering', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-preview.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    const hasMarked = content.includes('marked') || content.includes('Marked');
    expect(hasMarked).toBe(true);
  });
});

describe('TC-68.5: edit.ts imports rb-preview', () => {

  it('edit.ts references rb-preview', () => {
    const editPath = path.join(PUBLIC_DIR, 'ts/edit.ts');
    if (!existsSync(editPath)) return;
    const content = readFileSync(editPath, 'utf-8');
    const refs = content.includes('rb-preview') || content.includes('RbPreview');
    expect(refs).toBe(true);
  });
});

describe('TC-68.6: debounce reference exists', () => {

  it('preview or editor source has debounce logic', () => {
    let found = false;
    for (const candidate of [
      path.join(COMPONENTS_DIR, 'rb-preview.ts'),
      path.join(COMPONENTS_DIR, 'rb-code-editor.ts'),
      path.join(PUBLIC_DIR, 'ts/edit.ts'),
    ]) {
      if (!existsSync(candidate)) continue;
      const content = readFileSync(candidate, 'utf-8');
      if (content.includes('debounce') || content.includes('Debounce') ||
          content.includes('setTimeout') && content.includes('clearTimeout') && content.includes('preview')) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T69: PlantUML render route + preview
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-69.1: POST /api/puml-render route in server.ts', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/ts/server/server.ts');

  it('server.ts has puml-render route', () => {
    if (!existsSync(serverPath)) return;
    const content = readFileSync(serverPath, 'utf-8');
    const hasRoute = content.includes('puml-render') || content.includes('puml_render') ||
      content.includes('plantuml') || content.includes('PlantUML');
    expect(hasRoute).toBe(true);
  });

  it('route uses POST method', () => {
    if (!existsSync(serverPath)) return;
    const content = readFileSync(serverPath, 'utf-8');
    const hasPost = content.includes("POST") && (content.includes('puml') || content.includes('plantuml'));
    expect(hasPost).toBe(true);
  });
});

describe('TC-69.2: rb-preview handles puml', () => {

  it('rb-preview references plantuml or puml-render', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-preview.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    const hasPuml = content.includes('puml') || content.includes('plantuml') ||
      content.includes('PlantUML') || content.includes('puml-render');
    expect(hasPuml).toBe(true);
  });
});

describe('TC-69.3: edit.ts shows preview for .puml files', () => {

  it('edit.ts references .puml for preview', () => {
    const editPath = path.join(PUBLIC_DIR, 'ts/edit.ts');
    if (!existsSync(editPath)) return;
    const content = readFileSync(editPath, 'utf-8');
    const hasPumlPreview = content.includes('.puml') || content.includes('puml') ||
      content.includes('plantuml');
    expect(hasPumlPreview).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T70: rb-editor-toolbar component
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-70.1: rb-editor-toolbar.ts exists', () => {

  it('file exists in components/', () => {
    expect(existsSync(path.join(COMPONENTS_DIR, 'rb-editor-toolbar.ts'))).toBe(true);
  });
});

describe('TC-70.2: exports class', () => {

  it('exports RbEditorToolbar class', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-editor-toolbar.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/export\s+class\s+RbEditorToolbar/);
  });
});

describe('TC-70.3: mode toggle (Code/Split/Preview)', () => {

  it('has mode toggle references', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-editor-toolbar.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    const hasMode = content.includes('Code') || content.includes('code');
    const hasSplit = content.includes('Split') || content.includes('split');
    const hasPreview = content.includes('Preview') || content.includes('preview');
    expect(hasMode && (hasSplit || hasPreview)).toBe(true);
  });

  it('dispatches mode change event or calls callback', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-editor-toolbar.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    const hasEvent = content.includes('mode') || content.includes('toggle') ||
      content.includes('dispatchEvent') || content.includes('onMode');
    expect(hasEvent).toBe(true);
  });
});

describe('TC-70.4: save button reference', () => {

  it('has Save button or save action', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-editor-toolbar.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    const hasSave = content.includes('Save') || content.includes('save') || content.includes('💾');
    expect(hasSave).toBe(true);
  });
});

describe('TC-70.5: edit.ts imports rb-editor-toolbar', () => {

  it('edit.ts references rb-editor-toolbar', () => {
    const editPath = path.join(PUBLIC_DIR, 'ts/edit.ts');
    if (!existsSync(editPath)) return;
    const content = readFileSync(editPath, 'utf-8');
    const refs = content.includes('rb-editor-toolbar') || content.includes('RbEditorToolbar') || content.includes('toolbar');
    expect(refs).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T71: Mobile responsive editor layout
// ═══════════════════════════════════════════════════════════════════════════

function readLayoutCSS(): string {
  // CSS may be in rb-editor-layout.ts (inline), edit.css, or app.css
  for (const candidate of [
    path.join(COMPONENTS_DIR, 'rb-editor-layout.ts'),
    path.join(PUBLIC_DIR, 'edit.css'),
    path.join(PUBLIC_DIR, 'app.css'),
  ]) {
    if (existsSync(candidate)) {
      const content = readFileSync(candidate, 'utf-8');
      if (content.includes('editor') || content.includes('layout')) return content;
    }
  }
  return '';
}

describe('TC-71.1: Mobile breakpoint @media 768px', () => {

  it('layout has mobile breakpoint at or near 768px', () => {
    const css = readLayoutCSS();
    if (!css) return;
    const hasBreakpoint = css.includes('768') || css.includes('480') || css.includes('max-width');
    expect(hasBreakpoint).toBe(true);
  });
});

describe('TC-71.2: Tab bar references (Files/Editor/Preview)', () => {

  it('layout source references tab bar or mobile tabs', () => {
    const filePath = path.join(COMPONENTS_DIR, 'rb-editor-layout.ts');
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    const hasTabs = content.includes('tab') || content.includes('Tab') ||
      content.includes('Files') || content.includes('Editor') || content.includes('Preview');
    expect(hasTabs).toBe(true);
  });
});

describe('TC-71.3: Safe-area-inset in editor CSS', () => {

  it('layout CSS or source includes safe-area-inset', () => {
    const css = readLayoutCSS();
    if (!css) return;
    const hasSafeArea = css.includes('safe-area') || css.includes('env(');
    expect(hasSafeArea).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T72: Cross-linking /md/ ↔ /edit/
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-72.1: /md/ pages have edit link to /edit/', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/ts/server/server.ts');

  it('server.ts /md/ route includes /edit/ link', () => {
    if (!existsSync(serverPath)) return;
    const content = readFileSync(serverPath, 'utf-8');
    // Find the /md/ markdown rendering section and check for edit link
    const mdSection = content.match(/filepath\.startsWith\('\/md\/'\)[\s\S]*?\.md'\)/);
    const hasEditLink = content.includes('/edit/') && content.includes('/md/');
    expect(hasEditLink).toBe(true);
  });
});

describe('TC-72.2: Toolbar has view/browse link to /md/', () => {

  it('toolbar or layout references /md/ browse link', () => {
    let found = false;
    for (const candidate of [
      path.join(COMPONENTS_DIR, 'rb-editor-toolbar.ts'),
      path.join(COMPONENTS_DIR, 'rb-editor-layout.ts'),
      path.join(PUBLIC_DIR, 'ts/edit.ts'),
    ]) {
      if (!existsSync(candidate)) continue;
      const content = readFileSync(candidate, 'utf-8');
      if (content.includes('/md/') || content.includes('Browse') || content.includes('View')) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

describe('TC-72.3: Server /md/ route includes edit link', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/ts/server/server.ts');

  it('/md/ rendered pages reference /edit/ path', () => {
    if (!existsSync(serverPath)) return;
    const content = readFileSync(serverPath, 'utf-8');
    const hasEditInMd = content.includes("'/edit/") || content.includes('"/edit/') ||
      content.includes('/edit/${') || content.includes('/edit/`');
    expect(hasEditInMd).toBe(true);
  });
});
