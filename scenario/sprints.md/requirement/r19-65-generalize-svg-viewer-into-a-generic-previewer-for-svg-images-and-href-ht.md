### R19.65: Generalize SVG viewer into a generic previewer for SVG, images, and href/HTML links.

<details><summary>Tron directive</summary>

> The existing SVG fullscreen viewer (R18.34) MUST be generalized into a generic content previewer component that handles multiple content types: SVG (existing behavior), images (png/jpg/gif/webp), and href/HTML links (iframe). The component dispatches by content type to the appropriate renderer. This is the Object.verb pattern: ContentPreviewer.render(unit) where the unit's contentType determines the render strategy. Extensible for future types (pdf, video, etc.).

</details>

## Traceability

**Tasks:**
- [🔗 T-generic-previewer: generalize SVG viewer into a generic previewer for SVG/images/href](../task/generic-previewer-svg-images-href.md)

**UseCases:**
- [🔗 contentPreviewer.render](../usecase/contentpreviewer-render.md)
