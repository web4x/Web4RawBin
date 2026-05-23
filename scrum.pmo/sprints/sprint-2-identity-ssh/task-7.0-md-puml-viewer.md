[Back to Sprint 2 Planning](./planning.md)

# T7.0: MD Browser PlantUML SVG Support

**Status:** DONE
**Assigned:** robbin-expert (implement)
**Effort:** 1h expert
**Dependencies:** None (prerequisite for Sprint 2 task references)

## Goal

Enhance the `/md/` markdown browser to serve PlantUML SVG diagrams inline, so sprint task files can reference PUML diagrams.

## Requirements

### 7.0.1 Serve .svg files from project root

Add a route for `/md/*.svg` that serves SVG files with correct MIME type:
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

### 7.0.2 Serve .puml files as rendered SVG (optional, if plantuml available)

Add a route for `/md/*.puml` that either:
- Serves a pre-rendered SVG with the same basename (e.g., `class-diagram.puml` → `class-diagram.svg`)
- Or renders on-the-fly if plantuml.jar is available (stretch goal)

Simplest approach: serve the pre-rendered SVG companion file.

### 7.0.3 Relink .puml references in markdown

In the `/md/*.md` handler, extend the relink regex to also handle `.puml` and `.svg` references:
```typescript
// Existing: relink .md references
const relinked = md.replace(/\]\(([^)]+\.md)\)/g, (_, p) => `](/md/${dirPrefix}/${p})`);
// Add: relink .svg and .puml references  
const relinked2 = relinked.replace(/\]\(([^)]+\.svg)\)/g, (_, p) => `](/md/${dirPrefix}/${p})`);
const relinked3 = relinked2.replace(/\]\(([^)]+\.puml)\)/g, (_, p) => `](/md/${dirPrefix}/${p.replace('.puml', '.svg')})`);
```

### 7.0.4 Inline SVG in markdown

When markdown contains `![...](*.svg)` image references, the rendered HTML will have `<img src="/md/...svg">` tags. The SVG route from 7.0.1 serves the image.

## Acceptance Criteria
- [x] `/md/path/to/diagram.svg` serves SVG with correct Content-Type
- [x] Markdown files with `![](diagram.svg)` show inline SVGs
- [x] `.puml` references auto-redirect to `.svg` companion
- [x] Sprint task files can reference PUML diagrams
