[Back to Sprint 18 Planning](./planning.md)

# R18.13-15: Source link on all types + Browse-File → /md/ + line param → /edit#L

[task:uuid:675cc8e3-0646-4fb7-a6a5-b2c8400747c6]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [x] testing (scenarios pre-authored by tester 2026-06-07)
- [ ] QA Review
- [ ] Done

## Test Scenarios (tester pre-authored — run on deploy)

### R18.13: Source link on ALL 7 typed detail views

| TS | Action | Expected | Method |
|----|--------|----------|--------|
| TS1 | Click Sprint → detail pane | Source link visible (📂 <file>) for Sprint with source | Playwright |
| TS2 | Click Task → detail pane | Source link visible for Task with source.file | Playwright |
| TS3 | Click Requirement → detail | Source link visible | Playwright |
| TS4 | Click UseCase → detail | Source link with PUML file + line | Playwright |
| TS5 | Click Class → detail | Source link with .ts file | Playwright |
| TS6 | Click Method → detail | Source link with .ts file + line | Playwright |
| TS7 | Click Implementation → detail | Source link with .ts file | Playwright |
| TS8 | Click Test → detail | Source link with test file + line | Playwright |
| TS9 | Unit WITHOUT source.file | NO source link rendered (graceful absence) | Playwright |

### R18.14: Browse-File opens /md/?highlight=file (NOT Monaco)

| TS | Action | Expected | Method |
|----|--------|----------|--------|
| TS10 | Click source link on a UC detail | Navigates to /md/<dir>/?highlight=<filename> (file-browser with file highlighted) | Playwright click + URL check |
| TS11 | /md/ page with ?highlight param | File is visually highlighted in the directory listing | Playwright evaluate |
| TS12 | Source link does NOT open /edit/ directly | href points to /md/ not /edit/ (browsing first, not editing) | Playwright href check |

### R18.15: Line param carries to /edit#L (from file-browser click)

| TS | Action | Expected | Method |
|----|--------|----------|--------|
| TS13 | From /md/?highlight=file listing, click the ✏️ Edit icon on the highlighted file | Navigates to /edit/<file>#L<line> | Playwright click + URL check |
| TS14 | Monaco opens at the exact line | Editor scrolls to line N (cursor/highlight at that line) | Playwright Monaco check |
| TS15 | File without line param | ✏️ Edit opens /edit/<file> (no #L) — Monaco at top | Playwright |

### Regression

| TS | Action | Expected | Method |
|----|--------|----------|--------|
| TS16 | R18.11 Browse File still works (direct /edit/ link for impl/test) | Previous behavior preserved where source link goes to /edit/ | Playwright |
| TS17 | 876/876 vitest | Full suite green | vitest |

## QA Audit & User Feedback
- 2026-06-07: Tester pre-authored 17 test scenarios from R18.13-15 ACs. Ready to execute on expert deploy.
