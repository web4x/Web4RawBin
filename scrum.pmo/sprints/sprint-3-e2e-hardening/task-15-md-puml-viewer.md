[Back to Sprint 3 Planning](./planning.md)

# T15: MD Browser PUML/SVG Support

**Status:** DONE
**Assigned:** robbin-expert
**Effort:** 1h expert
**Dependencies:** None (carried from Sprint 2 T7.0)

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

## Acceptance Criteria
- [x] /md/scrum.pmo/.../diagrams/class-diagram.svg renders in browser
- [x] Markdown with `![](diagrams/class-diagram.svg)` shows inline
- [x] .puml links redirect to .svg
- [x] Sprint planning pages viewable with diagrams
