### R19.89: Move Remove-Local-Identity button from ProfileEditor gate to DeviceEnrollDialog.

<details><summary>Tron directive</summary>

> Red Remove-Local-Identity button (ProfileEditor L68, handler L154, impl 25884b0c) is on the gate screen (profile commit). It belongs on the DeviceEnrollDialog (Authorize This Device / 4-digit secret code). Move button + handler to DeviceEnrollDialog. Logic stays identical.

</details>

## Traceability

**Tasks:**
- [🔗 T-move-remove-identity: re-home Remove-Local-Identity button from ProfileEditor to DeviceEnrollDialog](../task/move-remove-identity-to-device-enroll.md)
