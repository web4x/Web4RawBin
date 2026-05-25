[Back to README](../../README.md)

# Sprint 8 Planning — Monaco Editor

## Sprint Goal
Add a Monaco-powered code editor to RawBin for editing source files on disk — markdown, TypeScript, shell, PlantUML, CSS, JSON — with live preview and file browser.

## Sprint Overview
**Focus:** File API, Monaco editor, live preview, file browser tree
**Team:** robbinTeam (PO, architect, expert, tester, req-eng, planner)
**Input:** [Requirements](./requirements.md) (20 use cases, 47 AC) | [Architecture](./architecture.md) (6 decisions, 5 components)

## Task List

### Phase 1: File API + Security (backend, no UI)

- [x] [T60: FileApi.ts — readDir + readFile + sanitize + authorize](./task-60-fileapi-read.md)
  **Effort:** 2h expert + 1h tester
  - sanitizePath, authorize, readDir, readFile

- [x] [T61: FileApi.ts — writeFile with mtime conflict](./task-61-fileapi-write.md)
  **Effort:** 1.5h expert + 1h tester
  - writeFile, mtime conflict detection (409), max 1MB

- [x] [T62: FileApi vitest security tests](./task-62-fileapi-tests.md)
  **Effort:** 1h tester
  - Path traversal, blocked dirs, mtime conflict, auth

### Phase 2: Editor Shell + Monaco (read-only)

- [x] [T63: edit.html + edit.ts + edit.css + CDN Monaco](./task-63-editor-entry.md)
  **Effort:** 2h expert
  - New entry point, CDN loading, build.mjs second bundle

- [x] [T64: rb-editor-layout — three-panel layout](./task-64-editor-layout.md)
  **Effort:** 1.5h expert
  - Tree + editor + preview panels, draggable dividers

- [x] [T65: rb-file-tree — directory browser](./task-65-file-tree.md)
  **Effort:** 2h expert
  - Lazy-load dirs, expand/collapse, file icons, active highlight

- [x] [T66: rb-code-editor — Monaco wrapper](./task-66-code-editor.md)
  **Effort:** 2h expert + 0.5h tester
  - loadFile(), language detection, syntax highlighting

### Phase 3: Save + Preview

- [x] [T67: rb-code-editor save — Cmd+S + dirty + conflict](./task-67-editor-save.md)
  **Effort:** 1.5h expert + 0.5h tester
  - Save, dirty tracking, conflict dialog

- [x] [T68: rb-preview markdown — live preview](./task-68-preview-markdown.md)
  **Effort:** 1.5h expert + 0.5h tester
  - marked.js, debounced 300ms, link rewriting

- [x] [T69: rb-preview PlantUML — SVG preview](./task-69-preview-puml.md)
  **Effort:** 1h expert + 0.5h tester
  - POST /api/puml-render, update on save

- [x] [T70: rb-editor-toolbar — save, view toggle, breadcrumb](./task-70-editor-toolbar.md)
  **Effort:** 1h expert
  - Save button, split/code/preview toggle, file path

### Phase 4: Polish + Mobile

- [x] [T71: Mobile layout — single-panel + tab bar](./task-71-mobile-layout.md)
  **Effort:** 1h expert + 0.5h tester
  - Viewport < 768px, Tree/Editor/Preview tabs

- [x] [T72: Cross-links — /md/ ↔ /edit/](./task-72-cross-links.md)
  **Effort:** 0.5h expert
  - Edit button on /md/ pages, View button in editor

- [x] [T73: Playwright E2E for editor](./task-73-editor-e2e.md)
  **Effort:** 2h tester
  - Open, edit, save, conflict, mobile viewport

## Dependency Graph
```
Phase 1:
  T60 (read API) ──→ T61 (write API) ──→ T62 (security tests)
                      ↓
Phase 2:
  T63 (entry) ──→ T64 (layout) ──→ T65 (tree) ──→ T66 (editor)
                                                    ↓
Phase 3:
  T67 (save) ──→ T68 (md preview) ──→ T69 (puml) ──→ T70 (toolbar)
                                                       ↓
Phase 4:
  T71 (mobile) ──→ T72 (cross-links) ──→ T73 (E2E)
```

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 14/14 Done (T60-T73) |
| Phases | 4 |
| Version | v0.3.19 (post-QA hotfixes) |
| Tron QA | Approved (commit 415c092) |
| New server file | FileApi.ts (~200 lines) |
| New client files | edit.ts, edit.html, edit.css |
| New components | 5 (rb-editor-layout, rb-file-tree, rb-code-editor, rb-preview, rb-editor-toolbar) |
| Expert effort | ~18h |
| Tester effort | ~6.5h |
| Bundle impact | app.js unchanged. New edit.js ~50KB + Monaco CDN |

## Definition of Done
- [x] /edit route loads Monaco editor
- [x] File browser shows project tree
- [x] Open, edit, save files to disk with conflict detection
- [x] Markdown live preview
- [x] PlantUML SVG preview on save
- [x] Mobile layout works
- [x] /md/ pages link to /edit/
- [x] Path traversal + security tests pass
- [x] No regression in Sprint 1-7

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-24
**Sprint:** Sprint 8 — Monaco Editor
