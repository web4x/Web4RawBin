<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 21 Planning — Sprint 21 — Contact Identity

## Sprint Goal

Make a profile's contact facets - phone, email, address, company - first-class scenario units in the object graph, with phone and email as alternate lookup keys that link a new device to an existing user instead of minting a duplicate. Fix the lobby first-load name, store dropped vCards beside the avatar, and seed Tron's real phone as the first Phone unit on WODA.prod. Phone/Email/Address/Company follow the class-to-method relationship pattern from the profile; Company is shared (dedup by name); Address verification is async against OpenStreetMap.

**Status:** Planned

## Tasks

- [ ] 🧪 [T21.1: vCard drop stores .vcf beside avatar](./task-t21-1.md)
- [ ] 🧪 [T21.2: Lobby renders real name on first connect](./task-t21-2.md)
- [ ] 🧪 [T21.3: Phone alt-UUID index (ln symlink)](./task-t21-3.md)
- [ ] 🧪 [T21.4: Device-link on known phone/email](./task-t21-4.md)
- [ ] 🧪 [T21.5: Emails as scenario units + alt-index](./task-t21-5.md)
- [ ] 🧪 [T21.6: Phones as scenario units (seed Tron)](./task-t21-6.md)
- [ ] 🧪 [T21.7: Addresses async OSM-verified](./task-t21-7.md)
- [ ] 🧪 [T21.8: Companies as shared dedup units](./task-t21-8.md)
- [ ] ✅ [T21.9: File detail reorder + pan/zoom](./task-t21-9.md)
