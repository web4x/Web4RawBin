// R37.28 / T37.32 (b43278f7) — the ONE registry of gates KNOWN-BROKEN-AT-INVOCATION: they EXECUTE but cannot INVOKE their
// spawned tool (suspected stale spawn cwd / output-parse) while the TOOL ITSELF passes standalone. MARK-not-silence: these
// gates STAY in the suite + KEEP RUNNING; their RED must read 'tracked infra, NOT a product regression' so a reader is not
// misled. COUNTED here so the set is VISIBLE + can only SHRINK (each fix removes an entry; adding one is a deliberate edit).
// NEVER remove/disable a gate to hide its RED (= the check-status-weakening mistake). Owner: robbin-expert (R37.28/T37.32).
export const KNOWN_BROKEN_TASK = 'R37.28 / T37.32 (b43278f7) — gate-invocation fix, owner robbin-expert';

export const KNOWN_BROKEN_INVOCATION = {
  'r241-objectverb-gate': 'scoreboard + followUp spawn return null, though `objectVerb Chain scoreboard` passes standalone (537 reqs, full table). lintMarkers/emitSkills GREEN → the INVOCATION path (spawn cwd/parse), not the tool.',
  'r245-s24-tooling-gate': 'T24.4 generate-md spawn returns null though the tool passes standalone; T24.5 audit.strict false. Same invocation-null class as r241.',
};

// A gate prints this on its RED so the failure reads honest (infra, tracked) not 'product broken'. Empty for non-listed gates.
export function knownBrokenBanner(gateFile) {
  const reason = KNOWN_BROKEN_INVOCATION[gateFile];
  if (!reason) return '';
  return `\n⚠ KNOWN-BROKEN-INVOCATION [${gateFile}] — tracked: ${KNOWN_BROKEN_TASK}\n   ${reason}\n   ⇒ this RED = the gate cannot INVOKE its tool (infra), NOT a product regression.`;
}

// A suite runner prints this so the known-broken set is COUNTED + listed (visible, shrink-only) — never a quiet dumping ground.
export function knownBrokenSummary() {
  const keys = Object.keys(KNOWN_BROKEN_INVOCATION);
  return `known-broken-invocation: ${keys.length} gate(s) [${keys.join(', ')}] — tracked ${KNOWN_BROKEN_TASK}`;
}
