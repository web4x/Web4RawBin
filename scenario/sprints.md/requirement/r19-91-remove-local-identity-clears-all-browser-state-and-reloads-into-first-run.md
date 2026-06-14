### R19.91: Remove Local Identity clears ALL browser state and reloads into first-run ProfileEditor.

<details><summary>Tron directive</summary>

> The removeLocalIdentity handler MUST: (1) CLEAR ALL browser state that holds identity — localStorage (token, keypair, device data, name, secret), IndexedDB entries, and any cached identity in SW caches, (2) reset the app to first-run state (no token, no device, no profile), (3) reload the page which opens the ProfileEditor in new-user onboarding mode (as if visiting for the first time). Currently likely a partial clear that leaves residual state preventing a true fresh start.

</details>

## Traceability

**Tasks:**
- [🔗 T-remove-id-full-wipe: removeLocalIdentity clears ALL browser state → first-run → ProfileEditor](../task/remove-identity-full-state-wipe-first-run.md)
