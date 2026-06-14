### BUG8: /trace collection node (Members/Files) detail shows 'Loading/no children' — synthetic UUID 404.

<details><summary>Tron directive</summary>

> BUG: in /trace, clicking a COLLECTION node (Members or Files — synthetic UUID like 'members-<roomUuid>' or 'files-<roomUuid>') opens the detail drawer which shows 'Loading...' or 'no children'. Root cause: synthetic-UUID collections are NOT real scenario units in the index — fetch-by-uuid returns 404. FIX: collection detail MUST render its children by fetching from the PARENT Room's /api/trace/children (the Room knows its members[]/files[]). The detail for a synthetic collection resolves via its parent's children API, not by fetching the synthetic UUID as a unit. Tron evidence: IMG_4018-20.

</details>

## Traceability

**UseCases:**
- [🔗 collectionDetail.resolveViaParent](../usecase/collectiondetail-resolveviaparent.md)

**Implementations:**
- [🔗 renderDetailForRef.collectionHandler impl](../implementation/renderdetailforref-collectionhandler-impl.md)
