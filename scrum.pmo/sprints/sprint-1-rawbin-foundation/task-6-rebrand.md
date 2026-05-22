[Back to Sprint 1 Planning](./planning.md)

# Task 6: Rebrand Assets (UpDown → RawBin)

**Status:** PLANNED
**Assigned:** robbin-expert (implement), robbin-tester (verify)
**Estimated effort:** 1h expert + 30min tester
**Priority:** 6 (MEDIUM — cosmetic but required)
**Depends on:** Tasks 3-5 (codebase exists)

## Goal

Replace all UpDown branding with RawBin. Update package.json, manifest, icons, shell scripts, TUI strings.

## Requirements

### 6.1 Expert: package.json

```json
{
  "name": "rawbin",
  "version": "0.1.0",
  "description": "RawBin — AI Server Management Interface",
  "keywords": ["server-management", "pwa", "https", "ai-assistant"],
  "author": "Web4RawBin"
}
```
- Update build scripts: multiplayer → app
- Update start script: updown.sh → rawbin.sh

### 6.2 Expert: manifest.json

```json
{
  "name": "RawBin",
  "short_name": "RawBin",
  "description": "AI Server Management",
  "categories": ["utilities", "productivity"]
}
```
- Keep icon references (update if new icon provided)

### 6.3 Expert: Shell scripts

- Rename `src/sh/updown.sh` → `src/sh/rawbin.sh`
- Update internal references in rawbin.sh
- `stop.sh` — update process name if needed

### 6.4 Expert: TUI branding (server.ts)

- All `UpDown` strings → `RawBin`
- TUI title: "RawBin Server - Terminal UI"
- Help screen: remove game references, add server management context
- Browser open URL: `/app` instead of `/ts`
- Log messages: strip game emojis, use server management context

### 6.5 Expert: HTML pages

- `/bug-report` title: "Bug Report — RawBin"
- `/profile` title: "Profile — RawBin"
- `/docs` title: "RawBin Docs"
- Landing page: RawBin welcome + link to /app

### 6.6 Expert: CSS colors (placeholder)

Keep existing `#667eea`/`#764ba2` gradient for now. Tron will decide brand colors later.
Add a CSS custom property for easy swap:
```css
:root {
  --rb-primary: #667eea;
  --rb-secondary: #764ba2;
}
```

### 6.7 Expert: Service worker

- Update cache name: `rawbin-v1`
- Update cached paths (remove game assets)

### 6.8 Expert: README.md

Update workspaces/Web4RawBin/README.md with:
- Actual project description
- Quick start instructions (npm install, npm run dev)
- Architecture overview from Task 2

### 6.9 Tester: Verify branding

- No "UpDown" string appears anywhere in the codebase (grep -r "UpDown" src/)
- No "updown" in package.json name
- TUI shows "RawBin" on all screens
- Browser pages show "RawBin" titles
- PWA installs with "RawBin" name
- manifest.json references correct icons

## Acceptance Criteria
- [ ] `grep -ri "updown" src/` returns zero results
- [ ] `grep -ri "updown" package.json` returns zero results
- [ ] TUI shows RawBin on help/status/clients screens
- [ ] Browser shows RawBin in all page titles
- [ ] PWA manifest shows RawBin
- [ ] CSS custom properties defined for future color swap
