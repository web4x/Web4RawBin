### R19.81: Pinch-zoom works in the preview iframe, not just pan.

<details><summary>Tron directive</summary>

> BUG: pan gesture works in the preview iframe but pinch-zoom does nothing. FIX: the preview iframe MUST support pinch-zoom (two-finger zoom on touch devices). This may require touch-action CSS on the iframe or a gesture handler that translates pinch events into CSS transform scale on the iframe content. Both pan AND pinch must work for the preview to be usable on mobile.

</details>

## Traceability

**UseCases:**
- [🔗 contentPreviewer.iframePinchZoom](../usecase/contentpreviewer-iframepinchzoom.md)
