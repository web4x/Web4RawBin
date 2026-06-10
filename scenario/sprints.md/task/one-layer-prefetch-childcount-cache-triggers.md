# T-one-layer-prefetch: server childCount + client prefetchCache + 3 non-recursive triggers
[task:uuid:07c44272-0518-4bc1-81fe-ca26c39878e1]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement architect
  - [ ] creating test cases
  - [ ] implementing expert (in flight per PO)
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Server returns childCount per node; client prefetchCache fetches one layer ahead on 3 non-recursive triggers (expand, select, mount); badges show accurate child counts from prefetched data. Covers R19.28.

## Subtasks


