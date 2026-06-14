### R19.85: Iframe pinch gesture SCALES the preview content, not just pans.

<details><summary>Tron directive</summary>

> BUG: pinch gesture in the preview iframe only PANS (translates) — it does not SCALE (zoom in/out). Pinch-out must make the content bigger; pinch-IN must make it smaller. FIX: the pinch gesture handler must apply CSS transform: scale() on the iframe content (or the iframe wrapper), not just translate. R19.81 captured the pinch-zoom requirement but the implementation only achieved pan. R19.85 re-asserts: pinch = SCALE, not pan. Both pinch-to-scale AND pan (single-finger drag) must coexist.

</details>

## Traceability

**Tasks:**
- [🔗 T-iframe-pinch-scale: a pinch gesture inside the preview iframe must SCALE the pre](../task/iframe-pinch-gesture-scales-preview.md)
