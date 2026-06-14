### R19.76: Replace playerToken-in-URL with short-lived preview nonce for file content auth.

<details><summary>Tron directive</summary>

> SECURITY DEBT (NOT blocking MVP): R19.75 passes playerToken in the content URL query param (?token=) which exposes the long-lived auth credential in server access logs and browser history (same-origin, low but real risk). HARDEN: the server issues a short-lived (60s TTL) preview NONCE on request; the client appends the nonce instead of the playerToken to the content URL. The nonce is single-use or time-limited, scoped to the specific file UUID + room. This eliminates token leakage via URL while preserving R19.68 room-scoped auth.

</details>