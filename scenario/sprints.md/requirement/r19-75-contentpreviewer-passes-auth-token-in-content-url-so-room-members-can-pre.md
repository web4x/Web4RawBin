### R19.75: ContentPreviewer passes auth token in content URL so room members can preview files.

<details><summary>Tron directive</summary>

> BUG: in-room HTML/image preview iframe shows 'Forbidden: token required' because the content URL (/api/file/<uuid>/content) does not include the authenticated member's token. R19.68 (room-scoped file auth) correctly rejects unauthenticated requests with 403, but the ContentPreviewer does not pass the token. FIX: the ContentPreviewer MUST include the member's auth token in the content URL (e.g. ?token=<memberToken> query param, or use a session cookie/header that the iframe inherits). Room MEMBERS see the preview; non-members still get 403. This is an interaction bug between R19.68 (auth gate) and R19.64/74 (preview rendering).

</details>

## Traceability

**UseCases:**
- [🔗 contentPreviewer.authToken](../usecase/contentpreviewer-authtoken.md)
