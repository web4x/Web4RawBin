[Back to Sprint 3 Planning](./planning.md)

# T15: MD Browser PUML/SVG Support

[task:uuid:dbb6bb7a-35e1-44c7-aa2b-4af5a4d5e5b8]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done


## Traceability
- up
  - [sprint-3-e2e-hardening Planning](./planning.md)
- down
  - None
## Goal

Enhance the `/md/` route to serve SVG diagrams inline so sprint planning docs are viewable with diagrams at https://home.donges.it:4444/md/scrum.pmo/sprints/.../planning.md.

## Requirements

### 15.1 Add /md/*.svg route

In server.ts, before the `/md/*.md` handler:
```typescript
if (filepath.startsWith('/md/') && filepath.endsWith('.svg')) {
  const relPath = filepath.slice(4);
  if (relPath.includes('..')) { res.writeHead(403); res.end('Forbidden'); return; }
  const svgFile = path.join(PROJECT_ROOT, relPath);
  try {
    const svg = fsSync.readFileSync(svgFile, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' });
    res.end(svg);
  } catch { res.writeHead(404); res.end('SVG not found'); }
  return;
}
```

### 15.2 Relink .svg and .puml in markdown

Extend the relink regex in the `/md/*.md` handler:
```typescript
// Existing: .md references
let html = md.replace(/\]\(([^)]+\.md)\)/g, (_, p) => `](/md/${dirPrefix}/${p})`);
// Add: .svg references
html = html.replace(/\]\(([^)]+\.svg)\)/g, (_, p) => `](/md/${dirPrefix}/${p})`);
// Add: .puml → .svg redirect
html = html.replace(/\]\(([^)]+)\.puml\)/g, (_, p) => `](/md/${dirPrefix}/${p}.svg)`);
```

### 15.3 Also serve .puml as text

For viewing raw PlantUML source:
```typescript
if (filepath.startsWith('/md/') && filepath.endsWith('.puml')) {
  // Serve as text/plain
}
```


## QA Audit & User Feedback

## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] /md/scrum.pmo/.../diagrams/class-diagram.svg renders in browser
- [x] Markdown with `![](diagrams/class-diagram.svg)` shows inline
- [x] .puml links redirect to .svg
- [x] Sprint planning pages viewable with diagrams
