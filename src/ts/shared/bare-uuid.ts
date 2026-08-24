/**
 * R40.58 D2 — the ONE canonical bare-uuid normaliser. A uuid crosses producers in several forms: bare `<uuid>`,
 * ior-prefixed `ior:instance:<uuid>` / `ior:class:<uuid>`, and federated `<uuid>@<host>`. Comparing two uuids from
 * DIFFERENT producers with raw `===` is a latent bug (a federated `<uuid>@host` on one side vs a bare `<uuid>` on the
 * other → never equal → wrong result). Every cross-producer identity comparison routes through THIS — strip the ior
 * prefix AND the @host — so `bareUuid(a) === bareUuid(b)` is form-independent. Client-safe (no node deps): the drawer's
 * derive-at-render + the server producers (server.ts iorUuid, CurrentSprint designation) all import it. [[full-uuid-data-writes-and-prefix-negative-conclusions]]
 */
export function bareUuid(ref: string | null | undefined): string {
  return String(ref ?? '').replace(/^ior:(instance|class):/, '').split('@')[0];
}
