[Back to Sprint 17 Planning](./planning.md)

# T140: Source-Location IOR for UC/Class/Method Scenario Units

[task:uuid:8f3a2b4c-d5e6-4f70-a1b2-c3d4e5f60140]

## Tron Requirement (literal)

> TRON DIRECTIVE: "use case json must track the exact locations in the exact puml file units for tracability as well as classes and methods as iors to the git location and commit of the file"

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect)
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only.

## Traceability

`[task:uuid:8f3a2b4c-d5e6-4f70-a1b2-c3d4e5f60140]`

- up
  - [requirement:uuid:47a86209-e0bb-4142-a6ad-4fff94ff9921](./requirements.md) — R17.24: UC/Class/Method carries exact source location + git anchor
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) — 3rd extension, verbatim
- down
  - None (atomic task)
- chain
  - **requirement:** R17.24 in [requirements.md](./requirements.md)
  - **use case:** scenario.trackSourceLocation (architect to add to use case diagram)
  - **class/method:** scenario.json `model.source` field — new IOR structure

## Task Description

**R17.24** mandates that every UseCase, Class, and Method scenario unit's `model` MUST track the exact source location with git-commit anchoring. This enables point-in-time-precise traceability that survives refactors.

### Source-Location IOR Structure

Each UC/Class/Method unit's `model` gains a `source` field:

```json
{
  "ior": "ior:scenario:uuid:<uuid>",
  "model": {
    "name": "room.create",
    "type": "UseCase",
    "source": {
      "file": "scrum.pmo/sprints/sprint-9-room-identity/diagrams/use-cases.puml",
      "lines": [42, 55],
      "commit": "9bf3363",
      "repo": "web4x/Web4RawBin",
      "ior": "ior:file:scrum.pmo/sprints/sprint-9-room-identity/diagrams/use-cases.puml?commit=9bf3363&lines=42-55"
    }
  },
  "ownerIor": "ior:scenario:uuid:<sprint-uuid>"
}
```

### Source Types by Scenario Class

| Class | Source file type | Location method |
|-------|-----------------|-----------------|
| UseCase | `.puml` (use case diagram) | Line range of `usecase "..." as UC_X` block |
| Class | `.puml` (class diagram) or `.ts` (source) | Line range of `class "..." { }` block or TypeScript class declaration |
| Method | `.ts` (source code) | Line range of function/method declaration |
| Requirement | `.md` (requirements.md) | Line of `[requirement:uuid:]` tag |
| Task | `.md` (task file) | Whole file (line 1 to EOF) |

### Git Anchor

The `commit` field is the short SHA of the git commit at which the source location was recorded. This pins the file content — even if the file is later refactored, the commit resolves to the exact version where the UC/class/method was at lines X-Y.

**Capture method:** `git log --format=%h -1 -- <file>` gives the latest commit that touched the file.

### IOR Format

`ior:file:<path>?commit=<sha>&lines=<start>-<end>`

- `path`: relative to repo root
- `commit`: short SHA (7+ chars)
- `lines`: 1-indexed, inclusive range

## Acceptance Criteria
- [ ] AC1: UseCase scenario units have `model.source` with file path, line range, and git commit
- [ ] AC2: Class scenario units have `model.source` pointing to .ts source or .puml class diagram
- [ ] AC3: Method scenario units have `model.source` pointing to .ts method declaration with line range
- [ ] AC4: `model.source.ior` follows `ior:file:<path>?commit=<sha>&lines=<start>-<end>` format
- [ ] AC5: Commit SHA resolves to the correct file version (`git show <sha>:<path>` returns the expected content)
- [ ] AC6: Source locations are populated during scenario migration (T128 extension or new pass)

## Dependencies
- **Requires:** T128 scenario migration (baseline scenario units must exist), T124.3 storage layout
- **Enables:** Full chain resolution with point-in-time precision; git-anchored traceability browser

## QA Audit & User Feedback
- 2026-05-31: Tron 3rd extension directive — "use case json must track the exact locations in the exact puml file units for tracability as well as classes and methods as iors to the git location and commit of the file." Verbatim captured from compound-requirement-source.md.

## Architect Design — robbin-architect (2026-05-31)

### 1. Source Location Model

Extend the scenario unit `model` with a `source` field on UseCase, Class, and Method:

```typescript
interface SourceLocation {
  file: string;           // repo-relative path: "scrum.pmo/sprints/.../diagrams/s17-usecases.puml"
  lines: [number, number]; // 1-indexed inclusive: [42, 55]
  commit: string;          // short SHA: "9bf3363"
  repo: string;            // "Web4RawBin" (or full GitHub slug)
  ior: string;             // computed: "ior:file:<file>?commit=<sha>&lines=<start>-<end>"
}
```

The `ior` field is computed from the other fields — canonical format:
```
ior:file:scrum.pmo/sprints/sprint-9/diagrams/use-cases.puml?commit=9bf3363&lines=42-55
```

### 2. IOR Resolution for `ior:file:`

Extend the IOR resolver (T125.2) to handle `ior:file:` with query params:

```typescript
function resolveFileIor(ior: string): { path: string; commit?: string; lines?: [number, number] } {
  // ior:file:<path>?commit=<sha>&lines=<start>-<end>
  const withoutPrefix = ior.replace('ior:file:', '');
  const [pathPart, queryPart] = withoutPrefix.split('?');
  const params = new URLSearchParams(queryPart || '');
  const commit = params.get('commit') || undefined;
  const linesStr = params.get('lines');
  const lines = linesStr ? linesStr.split('-').map(Number) as [number, number] : undefined;
  return { path: pathPart, commit, lines };
}
```

To view the exact content at that commit: `git show <commit>:<path>` piped through line extraction.

### 3. Git Anchor Capture at Migration Time

Two git commands needed during migration:

```typescript
// Get the latest commit that touched a specific file
function getFileCommit(filePath: string): string {
  return execSync(`git log --format=%h -1 -- "${filePath}"`, { cwd: PROJECT_ROOT })
    .toString().trim();
}

// Get the current HEAD (fallback if file hasn't been committed yet)
function getHeadCommit(): string {
  return execSync('git rev-parse --short HEAD', { cwd: PROJECT_ROOT })
    .toString().trim();
}
```

At migration time, each unit gets its `source.commit` from the file's latest commit.

### 4. Line Range Extraction — PUML UseCase Blocks

For `<<UseCase>>` blocks in PUML, capture the line range of each class declaration:

```typescript
function extractPumlUseCaseRanges(filePath: string): Map<string, [number, number]> {
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split('\n');
  const ranges = new Map<string, [number, number]>(); // ucName → [startLine, endLine]

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/class\s+"([^"]+)"\s+<<UseCase>>/);
    if (!match) continue;
    const name = match[1];
    const startLine = i + 1; // 1-indexed
    // Find closing brace
    let endLine = startLine;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('}')) { endLine = j + 1; break; }
    }
    ranges.set(name, [startLine, endLine]);
  }
  return ranges;
}
```

### 5. Line Range Extraction — TypeScript Classes and Methods

For `.ts` files, extract class and method declarations via regex (no AST parser dependency — keeps it simple):

```typescript
function extractTsClassRanges(filePath: string): Map<string, [number, number]> {
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split('\n');
  const ranges = new Map<string, [number, number]>();

  for (let i = 0; i < lines.length; i++) {
    // Class declaration: export class Foo { or class Foo extends Bar {
    const classMatch = lines[i].match(/(?:export\s+)?class\s+(\w+)/);
    if (classMatch) {
      const name = classMatch[1];
      const start = i + 1;
      // Find matching closing brace (track depth)
      let depth = 0; let end = start;
      for (let j = i; j < lines.length; j++) {
        depth += (lines[j].match(/{/g) || []).length;
        depth -= (lines[j].match(/}/g) || []).length;
        if (depth === 0 && j > i) { end = j + 1; break; }
      }
      ranges.set(name, [start, end]);
    }
  }
  return ranges;
}

function extractTsMethodRanges(filePath: string, className: string): Map<string, [number, number]> {
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split('\n');
  const ranges = new Map<string, [number, number]>();

  // Find methods inside the class body
  const classRange = extractTsClassRanges(filePath).get(className);
  if (!classRange) return ranges;
  const [classStart, classEnd] = classRange;

  for (let i = classStart - 1; i < classEnd - 1; i++) {
    // Method: async foo(, private bar(, public baz(, static qux(
    const methodMatch = lines[i].match(/^\s+(?:async\s+)?(?:private\s+|public\s+|protected\s+|static\s+)*(\w+)\s*\(/);
    if (!methodMatch || ['constructor', 'if', 'for', 'while', 'switch'].includes(methodMatch[1])) continue;
    const name = methodMatch[1];
    const start = i + 1;
    // Find method end (next method or class end)
    let end = start;
    let depth = 0;
    for (let j = i; j < classEnd - 1; j++) {
      depth += (lines[j].match(/{/g) || []).length;
      depth -= (lines[j].match(/}/g) || []).length;
      if (depth === 0 && j > i) { end = j + 1; break; }
    }
    ranges.set(name, [start, end]);
  }
  return ranges;
}
```

### 6. Migration Extension

Extend `migrate-to-scenario.ts` to populate `model.source` on UC/Class/Method units:

```typescript
// In migrateUseCases():
const pumlRanges = extractPumlUseCaseRanges(pumlFilePath);
const pumlCommit = getFileCommit(pumlFilePath);
const relPumlPath = path.relative(PROJECT_ROOT, pumlFilePath);

for (const [name, range] of pumlRanges) {
  // ... existing UC creation ...
  ucUnit.model.source = {
    file: relPumlPath,
    lines: range,
    commit: pumlCommit,
    repo: 'Web4RawBin',
    ior: `ior:file:${relPumlPath}?commit=${pumlCommit}&lines=${range[0]}-${range[1]}`,
  };
}

// For Class units (when/if migrated from .ts):
const tsRanges = extractTsClassRanges(tsFilePath);
const tsCommit = getFileCommit(tsFilePath);
// ... set classUnit.model.source similarly

// For Method units:
const methodRanges = extractTsMethodRanges(tsFilePath, className);
// ... set methodUnit.model.source similarly
```

### 7. View Template Extension

The HTML+MD templates for UC/Class/Method show the source location as a clickable link:

**HTML:**
```html
<div class="sv-source">
  <span class="sv-source-label">Source:</span>
  <a href="/edit/${source.file}#L${source.lines[0]}" class="sv-source-link">
    ${source.file}:${source.lines[0]}-${source.lines[1]}
  </a>
  <code class="sv-source-commit" title="git show ${source.commit}:${source.file}">
    @${source.commit}
  </code>
</div>
```

**MD:**
```markdown
**Source:** [`${source.file}:${source.lines[0]}-${source.lines[1]}`](/edit/${source.file}#L${source.lines[0]}) @ `${source.commit}`
```

### 8. Validation

`trace-cli check` extension: for each UC/Class/Method unit with `model.source`:
- Verify `source.file` exists on disk
- Verify `source.commit` resolves (`git cat-file -t <commit>` returns `commit`)
- Verify `source.lines` are within file length
- WARN if file has been modified since `source.commit` (may need re-anchoring)

## Subtasks
None (atomic task).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views*
*Owner: robbin-architect (refine), robbin-expert (implement), robbin-tester (verify)*
