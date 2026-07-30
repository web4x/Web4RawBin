/**
 * R20.15 — Single source of truth for all forward-key maps.
 * Replaces 5 parallel maps (SCENARIO_FWD, TRACE_FWD, EXPECTED_CHILD_TYPE,
 * client FORWARD_KEYS, TraceModel links). Adding a type = one entry here.
 */

export interface ChainTypeConfig {
  scenarioFwd: string[];
  traceFwd: string[];
  expectedChildren: string[];
  clientFwd: string[];
}

// [impl:uuid:d4ad31f3-c33e-4311-806c-61ce2364d2ad] R20.15 CHAIN_TYPE_CONFIG
export const CHAIN_TYPE_CONFIG: Record<string, ChainTypeConfig> = {
  Requirement:    { scenarioFwd: ['useCases', 'gates'],                                  traceFwd: ['useCases', 'gates'],           expectedChildren: ['UseCase', 'Task', 'Gate'], clientFwd: ['useCases', 'gates'] },
  Task:           { scenarioFwd: ['subtasks', 'useCases', 'coveredRequirements', 'children', 'gates'], traceFwd: ['useCases', 'coveredRequirements', 'gates'], expectedChildren: ['Task', 'UseCase', 'Requirement', 'Gate'], clientFwd: ['useCases', 'gates'] },
  UseCase:        { scenarioFwd: ['class', 'classes'],                                   traceFwd: ['class', 'classes'],            expectedChildren: ['Class', 'Method'],    clientFwd: ['class', 'classes'] }, // R31.11: read canonical SINGULAR 'class' + legacy PLURAL 'classes' in ALL modes (was scenario/client=plural, trace=singular → S31 UCs store singular 'class' → scenario/app tree resolved [] + stopped at UC). Resolver (server.ts:1600-1608) handles string+array; server.ts:1610 de-dups the S30 both-keys case.
  Class:          { scenarioFwd: ['methods'],                                           traceFwd: ['methods'],                     expectedChildren: ['Method'],             clientFwd: ['methods'] },
  Method:         { scenarioFwd: ['implementations'],                                   traceFwd: ['implementations'],             expectedChildren: ['Implementation'],     clientFwd: ['implementations'] },
  Implementation: { scenarioFwd: ['tests'],                                             traceFwd: ['tests'],                       expectedChildren: ['Test'],               clientFwd: ['tests'] },
  Sprint:         { scenarioFwd: ['tasks'],                                             traceFwd: ['tasks'],                       expectedChildren: ['Task'],               clientFwd: [] },
  Room:           { scenarioFwd: ['files', 'members'],                                  traceFwd: ['files', 'members'],            expectedChildren: [],                     clientFwd: [] },
  Bug:            { scenarioFwd: ['useCases', 'tasks'],                                  traceFwd: ['useCases', 'tasks'],           expectedChildren: ['UseCase', 'Task'],    clientFwd: ['useCases', 'tasks', 'tests'] },
  ChangeRequest:  { scenarioFwd: ['useCases', 'tasks'],                                  traceFwd: ['useCases', 'tasks'],           expectedChildren: ['UseCase', 'Task'],    clientFwd: ['useCases', 'tasks', 'tests'] },
  Test:           { scenarioFwd: ['testCases', 'gates'],                                  traceFwd: ['testCases', 'gates'],          expectedChildren: ['TestCase', 'Gate'],   clientFwd: ['testCases', 'gates'] },
  TestCase:       { scenarioFwd: [],                                                     traceFwd: [],                              expectedChildren: [],                     clientFwd: [] },
  Gate:           { scenarioFwd: [],                                                     traceFwd: [],                              expectedChildren: [],                     clientFwd: [] },
  Feature:        { scenarioFwd: ['allowedUsers'],                                       traceFwd: ['allowedUsers'],                expectedChildren: ['Profile'],            clientFwd: ['allowedUsers'] }, // R31.8c: FeatureManager native tree — a Feature's allowedUsers render as granted-user child-nodes (server resolver maps each token→a profile node)
  CurrentSprint:  { scenarioFwd: [],                                                     traceFwd: [],                              expectedChildren: ['Task'],               clientFwd: [] },
  ModelElement:   { scenarioFwd: ['members'],                                            traceFwd: ['members'],                     expectedChildren: [],                     clientFwd: ['members'] }, // R32.3: MDA model tree — a class/interface's `members` (attributes/methods/properties, reverse `memberOf`) render as composition children via the SHARED rb-trace-tree; ONE additive entry (all model units are ior:class:ModelElement). relatesTo is NOT a child (detail/R32.6 only).
};

function resolve(type: string): ChainTypeConfig | undefined {
  return CHAIN_TYPE_CONFIG[type] || CHAIN_TYPE_CONFIG[type.charAt(0).toUpperCase() + type.slice(1)];
}
export function scenarioFwd(type: string): string[] { return resolve(type)?.scenarioFwd || []; }
export function traceFwd(type: string): string[] { return resolve(type)?.traceFwd || []; }
export function expectedChildTypes(type: string): string[] { return resolve(type)?.expectedChildren || []; }
export function clientFwd(type: string): string[] { return resolve(type)?.clientFwd || []; }
export function forwardKeysForMode(type: string, mode: 'scenario' | 'trace'): string[] {
  return mode === 'trace' ? traceFwd(type) : scenarioFwd(type);
}

/**
 * THE single forward-ref reader. Reads a unit model's refs across ALL forward keys for its type
 * (per CHAIN_TYPE_CONFIG), unioned + deduped, tolerating a singular string OR an array value.
 * Fixes the class/classes (canonical singular 'class' vs legacy plural 'classes') mismatch BY
 * CONSTRUCTION: UseCase forward keys = ['class','classes'], so any read routed here credits the
 * Class-hop regardless of which key stores it — no per-UC mirroring, no Nth-site recurrence.
 */
export function fwdRefs(model: Record<string, unknown> | undefined | null, type: string, mode: 'scenario' | 'trace' = 'scenario'): string[] {
  if (!model) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const k of forwardKeysForMode(type, mode)) {
    const v = model[k];
    const refs = Array.isArray(v) ? v : (v != null && v !== '' ? [v] : []);
    for (const r of refs) {
      const s = String(r);
      const bare = s.replace('ior:instance:', '');
      if (!bare || seen.has(bare)) continue;
      seen.add(bare);
      out.push(s);
    }
  }
  return out;
}
