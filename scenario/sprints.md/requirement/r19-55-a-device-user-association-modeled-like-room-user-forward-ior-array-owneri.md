### R19.55.A: Device↔User association modeled like Room↔User — forward IOR array, ownerIor, per-user storage, unitLinks.

<details><summary>Tron directive</summary>

> The Device↔User relationship MUST be modeled identically to Room↔User: User scenario unit gets a model.devices[] forward IOR array (like model.rooms[]), Device.ownerIor points to its User unit (back-ref), per-user association uses data/users/<userUuid>/devices/ directory with symlinks to Device scenario units (same pattern as data/users/<uuid>/rooms/), and the symlinks are registered in Device.unitLinks[] (R18.29-31 always-consistent lifecycle). This makes Device association navigable, persistent, and consistent with the Room pattern.

</details>

## Traceability

**Tasks:**
- [🔗 T-device-user-association: Device↔User association modeled like Room↔User](../task/device-user-association-like-room-user.md)

**UseCases:**
- [🔗 user.deviceAssociation](../usecase/user-deviceassociation.md)
