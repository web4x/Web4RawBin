/**
 * R40.58 D2 — the ONE canonical bare-uuid normaliser. A uuid crosses producers in several forms: bare `<uuid>`,
 * type-prefixed `ior:instance:<uuid>` / `ior:class:<uuid>` / `ior:file:<uuid>` / `task:<uuid>` / `req:<uuid>` /
 * `uc:` / `class:` / `method:` / `impl:` / `test:` / `sprint:` / `bug:` …, and federated `<uuid>@<host>`. Comparing two
 * uuids from DIFFERENT producers with raw `===` is a latent bug (a `task:<uuid>` on one side vs a bare `<uuid>` on the
 * other → never equal → wrong result; this was R40.58 ship-verify RED — the drawer ref is `task:<uuid>`, the current
 * slot uuid is bare → always 'other'). Every cross-producer identity comparison routes through THIS.
 * ★ GENERAL BY CONSTRUCTION (architect 91dd0c2d1): strip the @host, then ANY leading type-prefix chain — NOT an
 * enumerated `task:` list (scanning the known ACTORS re-opens the moment a new type-prefix appears; scan the HAZARD =
 * "a leading <word>: decoration on a uuid"). A bare uuid has no colon, so it is left untouched. Client-safe (no node
 * deps): the drawer's derive-at-render + the server producers all import it. [[scan-the-hazard-not-the-actors]] [[full-uuid-data-writes-and-prefix-negative-conclusions]]
 */
export function bareUuid(ref: string | null | undefined): string {
  return String(ref ?? '').replace(/@.*$/, '').replace(/^([a-z][a-z0-9-]*:)+/i, '');
}
