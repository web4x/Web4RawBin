# Requirements: Monaco Editor for RawBin

**Source:** Tron directive 2026-05-24
**Author:** robbin-req (requirements engineer)
**Diagram:** [Use Case Diagram](./diagrams/use-cases.svg) ([source](./diagrams/use-cases.puml))

## Context

RawBin has a markdown browser at `/md/*` (server.ts lines 392-443) that renders .md files read-only via marked.js. It also serves .svg and .puml files. The WODA session story (session/woda/*.html) uses a similar pattern — client-side marked.js rendering static .md content.

Tron directive: add a Monaco editor alongside the rendered markdown so users can edit source files on disk. Extend beyond markdown to all source code files in the project.

## Current State

| What exists | Route | Capability |
|-------------|-------|-----------|
| Directory listing | `GET /md/<path>/` | Lists .md, .svg, .puml, other files |
| Markdown render | `GET /md/<path>.md` | marked.js rendering, link rewriting |
| SVG serving | `GET /md/<path>.svg` | Raw SVG with no-cache |
| PUML serving | `GET /md/<path>.puml` | Raw text with no-cache |
| No file write API | — | Server has no endpoint to write files |
| No editor | — | All content is read-only |

## Supported File Types

| Extension | Language ID | Preview | Priority |
|-----------|-----------|---------|----------|
| `.md` | markdown | Live rendered HTML (marked.js) | P1 — primary use case |
| `.sh` | shell | None (syntax highlight only) | P1 — OOSH scripts |
| `.puml` | plantuml | SVG render (server-side plantuml) | P1 — architecture diagrams |
| `.ts` | typescript | None | P2 — source code |
| `.css` | css | None | P2 — styles |
| `.json` | json | None | P2 — config/data |
| `.html` | html | None | P3 — templates |

---

## UC-API: File API (Backend)

### UC-API.1: api.readDir — List directory contents

**Actor:** Server
**Trigger:** User opens a directory in the file browser
**Endpoint:** `GET /api/files/<path>/`

**Flow:**
1. Client requests directory listing with relative path
2. Server resolves path relative to PROJECT_ROOT
3. Server validates: no `..` segments, path within PROJECT_ROOT
4. Server reads directory entries with `fs.readdirSync(path, { withFileTypes: true })`
5. Server returns JSON: `{ entries: [{ name, type: 'file'|'dir', size?, ext? }] }`
6. Directories first, then files, both alphabetically sorted
7. Hidden files (starting with `.`) excluded except `.env`

**Response format:**
```json
{
  "path": "scrum.pmo/sprints/",
  "entries": [
    { "name": "sprint-01-rawbin-foundation", "type": "dir" },
    { "name": "sprint-02-identity-ssh", "type": "dir" },
    { "name": "planning.md", "type": "file", "size": 2048, "ext": ".md" }
  ]
}
```

**Acceptance Criteria:**
- [ ] `GET /api/files/scrum.pmo/` returns JSON with directory entries
- [ ] `GET /api/files/src/ts/server/` returns .ts files
- [ ] Directories listed before files, both alphabetically
- [ ] `../` in path returns 403
- [ ] Path outside PROJECT_ROOT returns 403
- [ ] Non-existent directory returns 404
- [ ] Hidden files excluded (except .env)

### UC-API.2: api.readFile — Read file content

**Actor:** Server
**Trigger:** User opens a file in the editor
**Endpoint:** `GET /api/files/<path>` (no trailing slash)

**Flow:**
1. Client requests file content with relative path
2. Server resolves, validates path (same as UC-API.1)
3. Server checks file is text (not binary — reject .png, .enc, .jpg, etc.)
4. Server reads file as UTF-8
5. Server returns JSON: `{ path, content, size, mtime }`

**Response format:**
```json
{
  "path": "src/ts/server/server.ts",
  "content": "#!/usr/bin/env node\n\nimport https from 'node:https';\n...",
  "size": 45000,
  "mtime": "2026-05-24T15:00:00.000Z"
}
```

**Acceptance Criteria:**
- [ ] `GET /api/files/README.md` returns file content as JSON
- [ ] `GET /api/files/src/ts/server/server.ts` returns TypeScript source
- [ ] Binary files (.png, .enc, .jpg) return 415 Unsupported Media Type
- [ ] `../../../etc/passwd` returns 403
- [ ] File > 5MB returns 413 (editor can't handle huge files)
- [ ] Response includes `mtime` for conflict detection

### UC-API.3: api.writeFile — Write file to disk

**Actor:** Server
**Trigger:** User saves in the editor (Cmd+S)
**Endpoint:** `PUT /api/files/<path>`

**Flow:**
1. Client sends `{ content, expectedMtime }` as JSON body
2. Server resolves, validates path (same checks)
3. Server checks current file mtime against `expectedMtime` — if different, return 409 Conflict (file modified externally)
4. Server writes content to disk as UTF-8
5. Server returns `{ ok: true, mtime, size }`

**Security constraints:**
- Only text files writable (same extension allowlist as read)
- Path traversal rejected
- Files outside PROJECT_ROOT rejected
- Maximum write size: 1MB
- No creating NEW files (write only to existing paths) — prevents arbitrary file creation

**Acceptance Criteria:**
- [ ] `PUT /api/files/README.md` with `{ content: "# Test" }` writes to disk
- [ ] File content on disk matches what was sent
- [ ] `expectedMtime` mismatch returns 409 Conflict with `{ conflict: true, serverMtime }`
- [ ] Path traversal returns 403
- [ ] Binary extension returns 415
- [ ] Body > 1MB returns 413
- [ ] Writing to non-existent file returns 404 (no implicit create)
- [ ] Response includes new `mtime` for subsequent saves

### UC-API.4: api.authorize — Request authorization

**Actor:** Server (internal)
**Trigger:** Every file API request

**Flow:**
1. Check request origin — must be same-origin (Referer/Origin header matches server)
2. OR: request includes valid `X-Admin-Key` header matching ADMIN_KEY
3. OR: request includes valid playerToken in `X-Player-Token` header that is in tokenToClient map
4. If none match, return 401

**Acceptance Criteria:**
- [ ] Same-origin requests from /app are authorized
- [ ] Requests with valid ADMIN_KEY header are authorized
- [ ] Requests from external origins without credentials are rejected 401
- [ ] curl with wrong admin key returns 401

### UC-API.5: api.sanitize — Path validation

**Actor:** Server (internal)
**Trigger:** Every file API request

**Rules:**
1. Path must not contain `..`
2. Resolved path must start with PROJECT_ROOT
3. Extension must be in allowlist: `.md .sh .puml .ts .css .json .html .env .mjs`
4. File must not be in `node_modules/`, `.git/`, or `data/users/` (private keys!)
5. File must not be binary (check extension, not content)

**Acceptance Criteria:**
- [ ] `../secret` → 403
- [ ] `node_modules/ws/index.js` → 403
- [ ] `.git/config` → 403
- [ ] `data/users/abc/.ssh/id_rsa` → 403
- [ ] `src/public/icon-192.png` → 415 (binary)
- [ ] `README.md` → allowed

---

## UC-ED: Monaco Editor

### UC-ED.1: editor.open — Load file into editor

**Actor:** User
**Trigger:** Click file in file browser, or navigate to `/edit/<path>`

**Flow:**
1. File browser dispatches file selection event with path
2. Editor panel calls `GET /api/files/<path>` to fetch content
3. Monaco editor created (or model swapped) with content + language ID
4. Language ID determined from extension (see file types table)
5. Editor displays with syntax highlighting
6. If file has preview (markdown, plantuml), preview panel opens

**Monaco configuration:**
```
theme: 'vs-dark'
minimap: enabled
wordWrap: on (for .md), off (for code)
fontSize: 14
tabSize: 2
```

**Acceptance Criteria:**
- [ ] Opening .md file shows markdown syntax highlighting
- [ ] Opening .sh file shows bash/shell syntax highlighting
- [ ] Opening .puml file shows plantuml highlighting (custom monarch grammar or plain text)
- [ ] Opening .ts file shows TypeScript highlighting with type checking disabled
- [ ] Editor is scrollable, supports large files (tested with server.ts ~1200 lines)
- [ ] Word wrap ON for .md, OFF for .ts/.sh

### UC-ED.2: editor.highlight — Syntax highlighting

**Languages required:**
| Extension | Monaco Language ID | Built-in? |
|-----------|-------------------|-----------|
| .md | markdown | Yes |
| .sh | shell | Yes |
| .ts | typescript | Yes |
| .css | css | Yes |
| .json | json | Yes |
| .html | html | Yes |
| .puml | plaintext (P1), custom monarch (P2) | No — needs custom registration |
| .mjs | javascript | Yes |
| .env | ini | Yes (close enough) |

**PlantUML custom grammar (P2, optional):**
Register a Monarch tokenizer for `plantuml` language ID with keywords: `@startuml`, `@enduml`, `actor`, `usecase`, `rectangle`, `participant`, `note`, `skinparam`, `!theme`, etc.

**Acceptance Criteria:**
- [ ] All built-in languages render with correct highlighting
- [ ] .puml files render at minimum as plaintext (P1)
- [ ] .env files render with key=value highlighting

### UC-ED.3: editor.save — Write buffer to disk

**Actor:** User
**Trigger:** Cmd+S (Mac) / Ctrl+S (Windows/Linux), or Save button

**Flow:**
1. User triggers save
2. Editor captures current model value
3. Client sends `PUT /api/files/<path>` with `{ content, expectedMtime }`
4. On 200: update stored mtime, clear dirty flag, show brief "Saved" toast
5. On 409 Conflict: show dialog — "File changed on disk. Overwrite or reload?"
6. On error: show error toast, keep dirty flag

**Acceptance Criteria:**
- [ ] Cmd+S saves current file (intercepted, not browser save dialog)
- [ ] Save button in toolbar triggers save
- [ ] After save, file on disk matches editor content
- [ ] Dirty indicator clears after successful save
- [ ] Conflict detection works (edit file externally, then save from editor → 409)
- [ ] Network error shows error toast, editor content preserved

### UC-ED.4: editor.dirty — Unsaved change tracking

**Flow:**
1. Monaco fires `onDidChangeModelContent` event
2. Editor sets dirty flag, shows dot indicator on file tab/title
3. On save success, dirty flag cleared
4. On tab close with dirty flag, prompt "Unsaved changes. Discard?"
5. `beforeunload` event warns if any editor is dirty

**Acceptance Criteria:**
- [ ] Typing in editor shows dirty indicator
- [ ] Saving clears dirty indicator
- [ ] Closing browser tab with unsaved changes shows warning
- [ ] Navigating away from dirty file prompts confirmation

---

## UC-PV: Preview Panel

### UC-PV.1: preview.markdown — Live markdown preview

**Actor:** User
**Trigger:** .md file opened in editor

**Flow:**
1. When a .md file is open, preview panel renders HTML via marked.js
2. Preview updates on every content change (debounced 300ms)
3. Same CSS as current /md/ route (MD_CSS from server.ts)
4. Links in preview rewritten to open in editor (internal .md links) or new tab (external)

**Acceptance Criteria:**
- [ ] Preview renders markdown as HTML
- [ ] Preview updates live as user types (debounced)
- [ ] Code blocks have syntax highlighting (highlight.js or Prism)
- [ ] Tables, lists, headings render correctly
- [ ] Links to other .md files open in editor, not navigate away

### UC-PV.2: preview.puml — PlantUML SVG preview

**Actor:** User
**Trigger:** .puml file opened in editor

**Flow:**
1. When a .puml file is open, preview panel renders SVG
2. Rendering via server-side plantuml: `POST /api/puml-render` with content body
3. Server runs `plantuml -tsvg -pipe` with stdin content, returns SVG
4. Preview updates on save (not live — plantuml is too slow for keystroke rendering)
5. Fallback: show error message if plantuml not installed

**Acceptance Criteria:**
- [ ] Preview shows rendered PlantUML diagram as SVG
- [ ] Preview updates when file is saved (not on every keystroke)
- [ ] Invalid PlantUML shows error message from plantuml stderr
- [ ] SVG is zoomable (scroll-wheel zoom, pinch-zoom)

### UC-PV.3: preview.toggle — Show/hide preview

**Flow:**
1. Toggle button in toolbar: "Preview" / "Code" / "Split"
2. Three modes: editor-only, preview-only, split (side-by-side)
3. Default: split for .md, editor-only for .sh/.ts, split for .puml
4. Preference persisted in localStorage

**Acceptance Criteria:**
- [ ] Toggle button cycles through modes
- [ ] .md files default to split view
- [ ] .sh files default to editor-only
- [ ] Mode preference persisted across sessions

---

## UC-FB: File Browser (Tree Panel)

### UC-FB.1: file.browse — Navigate directory tree

**Actor:** User
**Trigger:** Open editor page, or click directory in tree

**Flow:**
1. Tree panel shows project root directories
2. Click directory → lazy-loads children via `GET /api/files/<path>/`
3. Click file → opens in editor panel
4. Currently open file highlighted in tree
5. Tree state (expanded directories) persisted in localStorage

**Acceptance Criteria:**
- [ ] Root shows top-level directories (src/, scrum.pmo/, docs/, etc.)
- [ ] Clicking directory expands/collapses
- [ ] Clicking file opens in editor
- [ ] Active file highlighted
- [ ] Tree state persisted across page reloads
- [ ] Scroll position preserved

### UC-FB.3: file.filter — Filter by supported types

**Flow:**
1. Only show files with supported extensions in the tree
2. Exclude: .png, .jpg, .enc, .map, .lock, binary files
3. Exclude: node_modules/, .git/, data/users/ directories
4. Show file icons by type (📄 .md, 📜 .sh, 🎨 .puml, ⚡ .ts, 🎨 .css)

**Acceptance Criteria:**
- [ ] Binary files not shown in tree
- [ ] node_modules not shown
- [ ] .git not shown
- [ ] data/users/ not shown (private keys)
- [ ] File icons match type

---

## UC-LY: Layout

### UC-LY.1: layout.split — Three-panel layout

**Flow:**
```
┌──────────┬─────────────────────┬──────────────────┐
│          │                     │                  │
│  File    │   Monaco Editor     │   Preview        │
│  Tree    │                     │   (md/puml)      │
│          │                     │                  │
│  200px   │   flex: 1           │   flex: 1        │
│          │                     │                  │
└──────────┴─────────────────────┴──────────────────┘
     ↕              ↕                    ↕
   collapsible    always visible      toggle
```

**Entry point:** `GET /edit` or `GET /edit/<path>` — new route in server.ts
**Alternative:** tab in existing /app with `<rb-header>` navigation

**Acceptance Criteria:**
- [ ] Three panels visible on desktop
- [ ] Tree panel collapsible
- [ ] Preview panel toggleable per file type
- [ ] Panels separated by draggable dividers
- [ ] Layout fills viewport height

### UC-LY.3: layout.mobile — Mobile layout

**Flow:**
1. On viewport < 768px: collapse to single-panel with tab bar
2. Tabs: Tree | Editor | Preview
3. Swipe to switch tabs (optional)
4. Active tab fills screen

**Acceptance Criteria:**
- [ ] Single panel on mobile
- [ ] Tab bar to switch panels
- [ ] Editor is usable on mobile (Monaco has mobile support)

---

## Non-Functional Requirements

### NFR-1: Monaco Loading
- Monaco editor loaded from CDN (`cdn.jsdelivr.net/npm/monaco-editor@latest`) or bundled via esbuild
- CDN preferred for P1 (avoid 5MB+ bundle increase)
- Lazy-load: only fetch Monaco when /edit route is accessed

### NFR-2: Performance
- File tree lazy-loads directories (not full tree upfront)
- Preview debounced (300ms for markdown, on-save for plantuml)
- Files > 5MB rejected by API (editor can't handle them)

### NFR-3: Security
- File API MUST NOT expose files outside PROJECT_ROOT
- File API MUST NOT expose private keys (data/users/\*/.ssh/)
- File API MUST NOT expose node_modules or .git
- Write API MUST check mtime for conflict detection
- Write API MUST be authenticated (same-origin or admin key)

### NFR-4: Backward Compatibility
- Existing `/md/*` routes continue to work unchanged
- The editor is a NEW route (`/edit` or `/edit/*`), not a replacement
- No changes to existing client code (app.ts, RoomView, etc.)

---

## Traceability

| Tron Requirement | Use Cases |
|-----------------|-----------|
| (1) Monaco editor panel alongside rendered markdown | UC-ED.1, UC-PV.1, UC-LY.1 |
| (2) Edit actual source .md files — needs backend file API | UC-API.1, UC-API.2, UC-API.3, UC-API.4, UC-API.5 |
| (3) Save writes back to disk | UC-ED.3, UC-API.3 |
| (4) Extend to ALL source code files | UC-ED.2, UC-FB.3 (supported types table) |
| (5) File browser/tree to navigate codebase | UC-FB.1, UC-FB.3, UC-FB.4, UC-FB.5 |
| (6) Syntax highlighting for bash, markdown, plantuml | UC-ED.2 (language table) |
