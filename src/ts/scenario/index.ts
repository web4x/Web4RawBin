/**
 * T125 — Scenario-unit module barrel export.
 * [impl:uuid:8c72876c-05a5-467d-a1da-2b14a4a7b40d] R17.1-R17.6
 */
export { type ScenarioUnit, type ClassLoader, type IORType, parseIor, iorClass, iorInstance, iorFile } from './types.js';
export { ClassRegistry, SprintLoader, TaskLoader, RequirementLoader, UseCaseLoader, ClassObjLoader, MethodLoader, TestLoader, UserLoader, FileLoader, MessageLoader, ensureRawBinUser } from './classes.js';
export { createMessageUnit, type MessageInput } from './message-unit.js';
export { createFileUnit, readFileUnitContent, type FileUnitInput } from './file-unit.js';
export { ScenarioIndex } from './index-store.js';
export { type ViewTemplate, type SlugResolver, ViewTemplateRegistry, TaskTemplate, RequirementTemplate, SprintTemplate, UseCaseTemplate, ClassTemplate, MethodTemplate, TestTemplate, defaultTemplateRegistry, renderStatusHtml, renderChainSection, setActiveResolver } from './templates.js';
export { ViewGenerator } from './generator.js';
export { IORResolver, type IORResolution } from './ior-resolver.js';
export { PhoneIndex, normalizePhone, isValidPhoneKey } from './PhoneIndex.js';
export { EmailIndex, normalizeEmail, isValidEmailKey } from './EmailIndex.js';
export { AddressIndex, osmLinkFor, gmapsLinkFor } from './AddressIndex.js';
export { type TaskState, TASK_STATES, STATE_SYMBOLS, TRANSITIONS, startRefinement, startCreatingTestCases, startImplementing, startTesting, requestQAReview, tronApprove, resetToPlanned, canTransition } from './task-fsm.js';
export { type LinkRelation, RELATION_INVERSE, TraceLinkLoader, createTraceLink, inverseRelation } from './trace-link.js';
export { type SkillResult, type ChainStep, type TaskSpec, type TaskVerb, captureQuote, proposeTask, walkChain, statusTransition } from './skills.js';
export { type SourceLocation, buildSourceIor, makeSource, getFileCommit, extractPumlUseCaseRanges, extractTsClassRanges, extractTsMethodRanges, validateSource } from './source-location.js';
export { type TraceNode, buildTraceTree, walkUp, walkDown, renderTraceTreeHtml, renderTraceTreeMd } from './trace-tree.js';
