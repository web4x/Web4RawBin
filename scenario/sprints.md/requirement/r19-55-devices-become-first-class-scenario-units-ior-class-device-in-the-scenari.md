### R19.55: Devices become first-class scenario units (ior:class:Device) in the scenario index.

<details><summary>Tron directive</summary>

> Each Device MUST be a first-class scenario unit (ior:class:Device) stored at scenario/index/<shard>/<deviceUuid>.scenario.json with the standard {ior, model, ownerIor} shape. ownerIor = ior:instance:<userUuid> (the User that owns this device). model fields mapped from devices.json: model.userAgent, model.ip (last known), model.screenSize, model.platform, model.firstSeen (ISO), model.lastSeen (ISO), model.connectionCount (int), model.enrolled (bool), model.devicePublicKey, model.enrolledAt (ISO). unitLinks[] = symlink to User unit (reverse navigation). Migration: 205 devices in devices.json → 205 Device scenario units. deviceId field becomes the uuid. ownerToken → ownerIor = ior:instance:<ownerToken>. devices.json becomes deprecated/derived.

</details>

## Traceability

**Tasks:**
- [🔗 T-device-scenarios: Devices become first-class scenario units (ior:class:Device)](../task/device-first-class-scenario-units.md)

**UseCases:**
- [🔗 device.scenarioUnit](../usecase/device-scenariounit.md)
