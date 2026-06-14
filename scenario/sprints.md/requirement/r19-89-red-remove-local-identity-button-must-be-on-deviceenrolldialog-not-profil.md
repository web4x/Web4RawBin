### R19.89: Red Remove-Local-Identity button must be on DeviceEnrollDialog, not ProfileEditor.

<details><summary>Tron directive</summary>

> BUG: the red 'Remove current ID data' button (R19.72, impl 25884b0c) is placed on the WRONG screen — it is in the ProfileEditor (ProfileEditor.ts:68 gate mode) instead of the DeviceEnrollDialog 'Authorize This Device' secret-code screen. FIX: MOVE the button to the DeviceEnrollDialog where a locked-out user (without the secret code) actually needs the escape path. The ProfileEditor is for established users who are already authenticated — the button has no purpose there and is confusing. R19.72 specified 'the secret-code page' which is the DeviceEnrollDialog.

</details>

## Traceability

**Tasks:**
- [🔗 T-move-remove-id-to-enroll: relocate red Remove-Local-Identity button ProfileEditor → DeviceEnrollDialog secret-code screen](../task/move-remove-identity-to-device-enroll.md)
