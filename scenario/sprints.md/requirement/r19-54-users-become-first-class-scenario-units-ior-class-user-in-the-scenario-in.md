### R19.54: Users become first-class scenario units (ior:class:User) in the scenario index.

<details><summary>Tron directive</summary>

> Each User MUST be a first-class scenario unit (ior:class:User) stored at scenario/index/<shard>/<userUuid>.scenario.json with the standard {ior, model, ownerIor} shape. model fields mapped from profiles.json: model.name (display name), model.phone, model.url, model.avatar (path), model.avatarCrop, model.secretCode (4-digit auth code for account linking per R18 BR-011), model.profileCommitted (bool), model.sshKeysGenerated (bool), model.sshKeyGeneratedAt (ISO date), model.consolidatedFrom[] (merged account IORs), model.bugReports[] (bug report entries). ownerIor = null (User is a root entity). unitLinks[] = symlinks to per-user data dirs (data/users/<uuid>/). devices[] = IOR refs to Device units (R19.55) owned by this User. rooms[] = IOR refs to Room units the User is a member of. Migration: 145 profiles in profiles.json → 145 User scenario units. Token field becomes the uuid. profiles.json becomes deprecated/derived (regeneratable from scenario units).

</details>

## Traceability

**Tasks:**
- [🔗 T-user-scenarios: Users become first-class scenario units (ior:class:User)](../task/user-first-class-scenario-units.md)

**UseCases:**
- [🔗 user.scenarioUnit](../usecase/user-scenariounit.md)
