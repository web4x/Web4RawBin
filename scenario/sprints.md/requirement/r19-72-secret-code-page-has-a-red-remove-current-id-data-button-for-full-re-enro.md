### R19.72: Secret-code page has a red 'Remove current ID data' button for full re-enrollment.

<details><summary>Tron directive</summary>

> The secret-code-entry page during FIRST-TIME ONBOARDING (initial device enrollment) MUST display a RED "Remove current ID data" button that wipes all local identity data: generated keypair, token, device data from localStorage, and any local SSH/profile artifacts. After wipe, the user starts fresh from the enrollment flow as a new device. This is the recovery path for a user who has lost/forgotten their generated secret code during initial setup. SCOPE: the button+danger-text are ONLY visible during first-time onboarding (the secret-code-entry step of initial enrollment) — NOT for already-enrolled/established users. A DANGER warning text MUST appear with/before the button explaining the IRREVERSIBLE consequences: wiping permanently loses the current identity/keypair/secret, all rooms+files owned by that identity become inaccessible, and the action cannot be undone. A confirm step (dialog or second-click) is recommended before executing the wipe.

</details>

## Traceability

**UseCases:**
- [🔗 profile.removeLocalIdentity](../usecase/profile-removelocalidentity.md)
