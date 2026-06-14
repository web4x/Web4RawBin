# T-url-preview-restore: url/webitem file click opens ContentPreviewer drawer (regression fix)
[task:uuid:bec78a23-a464-49dc-a565-8dbd3785f2cc]

## Traceability

**UseCases:**
- [🔗 roomView.openUrlPreview](../usecase/roomview-openurlpreview.md)


## Task Description

Restore url/webitem file-click to drawer-open path that regressed ~862868bfe. The click handler or type check must include url-type FileUnits. Covers R19.86.

## Subtasks


