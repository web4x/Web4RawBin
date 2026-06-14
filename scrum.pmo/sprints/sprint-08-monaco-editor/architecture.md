# Architecture: Monaco Editor for RawBin

**Author:** robbin-architect
**Date:** 2026-05-24
**Input:** [Requirements](./requirements.md) (20 use cases, 47 acceptance criteria)

## Diagrams

| Diagram | Source | Description |
|---------|--------|-------------|
| [Class Diagram](./diagrams/class-diagram.svg) | [class-diagram.puml](./diagrams/class-diagram.puml) | Server FileApi + 5 Web Components + entry point |
| [Edit Sequence](./diagrams/sequence-edit.svg) | [sequence-edit.puml](./diagrams/sequence-edit.puml) | File open → edit → save → conflict detection flow |

## 1. Component Breakdown

### Server (1 new module + 3 routes in server.ts)

**FileApi.ts** (~200 lines) — new file at `src/ts/server/FileApi.ts`

Handles all file read/write operations with security validation. Imported by server.ts and called from route handlers.

| Method | Maps to | Description |
|--------|---------|-------------|
| `sanitizePath(relPath)` | UC-API.5 | Validates path: no `..`, within PROJECT_ROOT, allowed extension, not in blocked dirs |
| `authorize(req)` | UC-API.4 | Checks same-origin, admin key, or player token |
| `readDir(relPath)` | UC-API.1 | Returns `{ path, entries[] }` — dirs first, alphabetical, hidden files excluded |
| `readFile(relPath)` | UC-API.2 | Returns `{ path, content, size, mtime }` — text files only, max 5MB |
| `writeFile(relPath, content, expectedMtime)` | UC-API.3 | Writes to disk with mtime conflict detection, max 1MB |
| `renderPuml(content)` | UC-PV.2 | Pipes content through `plantuml -tsvg -pipe`, returns SVG string |

**Why a separate module, not inline in server.ts?** Server.ts is already 1,249 lines. The file API adds ~200 lines of logic. Keeping it in a separate module follows the same pattern as UserKeys.ts (192 lines) and UserCrypto.ts (112 lines).

**Routes added to server.ts** (~30 lines of delegation):

```
GET  /api/files/<path>/  → FileApi.readDir     (trailing slash = directory)
GET  /api/files/<path>   → FileApi.readFile     (no trailing slash = file)
PUT  /api/files/<path>   → FileApi.writeFile    (write)
POST /api/puml-render    → FileApi.renderPuml   (plantuml rendering)
GET  /edit               → serve edit.html      (editor page)
GET  /edit/<path>        → serve edit.html      (editor with file pre-selected)
```

### Client (1 new entry point + 5 new Web Components)

**Separate entry point: `edit.ts` → `edit.html`**

The editor is a completely separate page from the app (`/app`). It has its own entry point (`edit.ts`), HTML file (`edit.html`), CSS (`edit.css`), and build output (`dist/edit.js`).

Rationale:
- Monaco is ~5MB. Bundling it into app.js would triple the bundle size for users who never open the editor.
- The editor has no overlap with room/chat/member UI — no shared state, no shared components (except rb-update-banner).
- Separate build means `npm run build` produces two bundles: `dist/app-HASH.js` (64KB) and `dist/edit-HASH.js` (~5MB with Monaco, or ~50KB without if CDN).

**5 new Web Components:**

| Component | Shadow DOM? | Lines (est.) | Description |
|-----------|-------------|-------------|-------------|
| `<rb-editor-layout>` | No | ~80 | Three-panel layout manager: tree + editor + preview. Draggable dividers. Responsive (single-panel on mobile). |
| `<rb-file-tree>` | No | ~120 | Directory tree with lazy-loading, expand/collapse, file icons, active file highlight. Persists state in localStorage. |
| `<rb-code-editor>` | Yes | ~150 | Wraps Monaco editor instance. Handles file loading, save (Cmd+S), dirty tracking, language detection. Shadow DOM to isolate Monaco styles. |
| `<rb-preview>` | Yes | ~100 | Renders markdown (marked.js) or PlantUML (server-side). Shadow DOM for isolated styling. Debounced updates. |
| `<rb-editor-toolbar>` | No | ~60 | Save button, view mode toggle, file path breadcrumb, dirty indicator. |

## 2. Monaco Loading Strategy

**CDN for P1, with bundle fallback for offline.**

```html
<!-- edit.html -->
<script>
  // CDN primary, local fallback
  window.MonacoEnvironment = {
    getWorkerUrl: function(workerId, label) {
      return `https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/base/worker/workerMain.js`;
    }
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js"></script>
<script>
  require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } });
  require(['vs/editor/editor.main'], function() {
    // Monaco ready — import edit.ts entry point
    import('/dist/edit.js');
  });
</script>
```

**Why CDN over bundling:**
- Monaco is 5MB+ minified. Bundling via esbuild would quadruple the total build output.
- CDN leverages browser cache across sites — users who've visited any Monaco-powered site already have it cached.
- The SW doesn't cache CDN resources (different origin) — this is correct because Monaco updates shouldn't be managed by our SW.
- Offline fallback: if CDN unavailable, show a message "Editor requires internet connection" rather than bundling a 5MB fallback.

**Lazy loading:** Monaco is only loaded when the user navigates to `/edit`. The `/app` route never loads it. This keeps app.js at 64KB.

## 3. Route Design

### New routes

```
GET  /edit           → edit.html (editor root — shows file tree, no file open)
GET  /edit/<path>    → edit.html (editor with file pre-selected via URL path)
GET  /api/files/     → FileApi.readDir (project root listing)
GET  /api/files/src/ → FileApi.readDir (src/ directory)
GET  /api/files/README.md → FileApi.readFile
PUT  /api/files/README.md → FileApi.writeFile
POST /api/puml-render     → FileApi.renderPuml
```

### URL structure

`/edit/scrum.pmo/sprints/sprint-08-monaco-editor/planning.md` opens the editor with that file loaded. The path after `/edit/` is the relative file path from PROJECT_ROOT. This enables direct linking to files — share a URL to open a specific file in the editor.

### Security boundaries

| Path pattern | Access |
|-------------|--------|
| `../` | BLOCKED — 403 |
| `node_modules/` | BLOCKED — 403 |
| `.git/` | BLOCKED — 403 |
| `data/users/` | BLOCKED — 403 (private keys) |
| `data/rooms/` | Allowed (room state is not sensitive) |
| `.enc`, `.png`, `.jpg` | BLOCKED — 415 (binary) |
| Allowed extensions | `.md .sh .puml .ts .css .json .html .env .mjs` |

### Existing routes unchanged

`/md/*` continues to work as read-only rendered markdown. `/edit` is additive. Users can navigate from `/md/` to `/edit/` via a link, and back.

## 4. Build Configuration

**build.mjs** updated to produce two entry points:

```javascript
// Existing app bundle
await esbuild.build({
  entryPoints: ['src/public/ts/app.ts'],
  outdir: 'src/public/dist',
  entryNames: 'app-[hash]',
  // ...existing config
});

// New editor bundle (no Monaco — loaded from CDN)
await esbuild.build({
  entryPoints: ['src/public/ts/edit.ts'],
  outdir: 'src/public/dist',
  entryNames: 'edit-[hash]',
  external: ['monaco-editor'],  // CDN, not bundled
  // ...same config
});

// build-manifest.json now has both entries
{ "app.js": "app-HASH.js", "edit.js": "edit-HASH.js", "built": "..." }
```

## 5. Phase Plan (Incremental Delivery)

Each phase produces a working, deployable increment. No big-bang.

### Phase 1: File API + Security (backend only, no UI)

**Tasks:**
- T55: FileApi.ts — sanitizePath, authorize, readDir, readFile
- T56: FileApi.ts — writeFile with mtime conflict detection
- T57: Vitest tests for FileApi (path traversal, blocked dirs, mtime conflict)

**Deliverable:** `GET /api/files/` and `PUT /api/files/` work from curl. No UI yet. This is the security-critical phase — gets reviewed before any UI is built on top.

**Estimated effort:** 4h expert + 2h tester

### Phase 2: Editor Shell + Monaco (read-only)

**Tasks:**
- T58: edit.html + edit.ts + edit.css — entry point with CDN Monaco loading
- T59: `<rb-editor-layout>` — three-panel layout with dividers
- T60: `<rb-file-tree>` — directory tree with lazy loading + file selection
- T61: `<rb-code-editor>` — Monaco wrapper, loadFile(), language detection

**Deliverable:** Navigate to `/edit`, browse files in tree, click to open in Monaco with syntax highlighting. Read-only (no save yet).

**Estimated effort:** 6h expert + 1h tester

### Phase 3: Save + Preview

**Tasks:**
- T62: `<rb-code-editor>` save — Cmd+S, dirty tracking, conflict dialog
- T63: `<rb-preview>` — markdown rendering (marked.js, debounced)
- T64: `<rb-preview>` — PlantUML rendering (POST /api/puml-render)
- T65: `<rb-editor-toolbar>` — save button, view mode toggle, breadcrumb

**Deliverable:** Full edit-save cycle works. Markdown preview live. PlantUML preview on save. Conflict detection for external edits.

**Estimated effort:** 5h expert + 1.5h tester

### Phase 4: Polish + Mobile

**Tasks:**
- T66: Mobile layout — single-panel with tab bar for viewport < 768px
- T67: Cross-links — `/md/` pages get "Edit" button linking to `/edit/`, editor gets "View" button to `/md/`
- T68: E2E Playwright tests for editor (open, edit, save, conflict)

**Deliverable:** Works on mobile. Integrated with existing md browser. Full test coverage.

**Estimated effort:** 3h expert + 2h tester

### Sprint Totals

| Metric | Value |
|--------|-------|
| Tasks | 14 (T55-T68) |
| Phases | 4 |
| New server file | 1 (FileApi.ts ~200 lines) |
| New client files | 3 (edit.ts, edit.html, edit.css) |
| New components | 5 (rb-editor-layout, rb-file-tree, rb-code-editor, rb-preview, rb-editor-toolbar) |
| Expert effort | ~18h |
| Tester effort | ~6.5h |
| Bundle impact | app.js unchanged (64KB). New edit.js ~50KB + Monaco from CDN (~5MB cached) |

## 6. Key Design Decisions

### D1: Separate page (/edit) vs tab in /app

**Decision: Separate page.**

The editor is a different tool with different dependencies (Monaco 5MB), different layout (three-panel), and no overlap with room/chat. Putting it in /app would force all users to download Monaco even if they never edit. A separate route with lazy CDN loading keeps /app fast.

### D2: FileApi as module vs inline in server.ts

**Decision: Separate module (FileApi.ts).**

server.ts is 1,249 lines. File API adds ~200 lines of security-critical path validation and fs operations. Same pattern as UserKeys.ts and UserCrypto.ts — keep domain-specific logic in focused modules.

### D3: Monaco CDN vs esbuild bundle

**Decision: CDN with offline degradation.**

5MB+ is too large to bundle. CDN is cached globally. The editor is an advanced feature — requiring internet for first load is acceptable. The SW does NOT cache CDN resources (different origin), which is correct.

### D4: Shadow DOM for rb-code-editor and rb-preview

**Decision: Shadow DOM for both.**

Monaco injects its own CSS (hundreds of rules). Without Shadow DOM, Monaco styles would bleed into the rest of the page. Preview also needs isolated styles (markdown CSS shouldn't affect the toolbar or tree).

### D5: mtime-based conflict detection (not content hash)

**Decision: mtime.**

Simple, fast, no computation overhead. Server compares `file.mtime` with the `expectedMtime` the client sends. If they differ, someone edited the file externally. The client can then choose to overwrite or reload. Content hashing would be more precise but adds unnecessary complexity for a single-user dev tool.

### D6: No new file creation via API

**Decision: Write-only to existing files.**

The requirements say "No creating NEW files" (UC-API.3). This prevents arbitrary file creation on disk. If users need new files, they create them via the terminal. The editor edits existing files only. This is a security boundary.
