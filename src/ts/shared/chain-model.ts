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
  UseCase:        { scenarioFwd: ['classes'],                                           traceFwd: ['class'],                       expectedChildren: ['Class', 'Method'],    clientFwd: ['classes'] },
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
