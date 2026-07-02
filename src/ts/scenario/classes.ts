/**
 * T125.2 — 7 class loaders (Sprint/Task/Requirement/UseCase/Class/Method/Test)
 * + ClassRegistry for IOR resolution.
 *
 * [impl:uuid:8c72876c-05a5-467d-a1da-2b14a4a7b40d] R17.3
 */
// [impl:uuid:7de1d230-8174-4ea5-b1e9-7b52bb6e63e8] ClassRegistry.loader): void
import { type ScenarioUnit, type ClassLoader, iorClass } from './types.js';
import { TraceLinkLoader } from './trace-link.js';

function loader(className: string, defaults: Record<string, unknown>): ClassLoader {
  return {
    className,
    defaults: () => ({ uuid: '', name: '', ...defaults }),
    create(unit: ScenarioUnit): ScenarioUnit {
      return { ior: iorClass(className), model: { ...this.defaults(), ...unit.model }, ownerIor: unit.ownerIor };
    },
  };
}

export const SprintLoader = loader('Sprint', { number: 0, goal: '', status: '', tasks: [], requirements: [] });
// T159: forward-only chain — no back-refs (task→req, uc→req, method→req removed)
export const TaskLoader = loader('Task', { description: '', status: '', assigned: '', effort: '', children: [], useCases: [], implementations: [], links: { down: [], follows: [], changes: [] }, chain: { useCases: [], puml: [], classMethods: [] } });
export const RequirementLoader = loader('Requirement', { description: '', priority: '', source: '', tasks: [], tests: [], altId: '' });
export const UseCaseLoader = loader('UseCase', { object: '', verb: '', tasks: [], classes: [] });
export const ClassObjLoader = loader('Class', { file: null, useCases: [], methods: [] });
export const MethodLoader = loader('Method', { class: null, implementations: [], tests: [], task: null });
export const TestLoader = loader('Test', { file: null, methods: [], status: '' });
export const UserLoader = loader('User', { displayName: '', token: '', avatarHash: '', deviceId: '', sshPubKey: '', createdAt: '', updatedAt: '' });
export const SkillLoader = loader('Skill', { description: '', object: '', verb: '', parameters: [], returns: {}, impl: '', requirement: '', roles: [], examples: [] });
// S30 R30.1: AgentMessage — first-class inter-agent message (owned by its Task, forward-linked from
// Task.messages[]). Async mailbox: written+committed by AgentMessage.send, pulled via inbox — never
// injected into a live prompt. Default shape mirrors AgentMessage.defineUnitType() in agent-message.ts.
export const AgentMessageLoader = loader('AgentMessage', { from: '', to: '', task: '', kind: 'report', body: '', sentAt: '', read: false });
// T-file-unit R19.14: files become unique scenario units (<uuid>.content + <uuid>.scenario.json + unitLinks[])
export const FileLoader = loader('File', { contentPath: '', size: 0, mimeType: '', uploadedAt: '', uploaderToken: '', roomUuid: '' });
export const MessageLoader = loader('Message', { text: '', timestamp: 0, senderIor: '', senderName: '', roomIor: '', prevMessage: null, nextMessage: null, kind: 'chat' });
// [impl:uuid:76bbedda-b1c2-4d3e-9f4a-6b7c8d9e0f06] R20.4 BugLoader + ChangeRequestLoader
export const BugLoader = loader('Bug', { description: '', priority: '', source: '', tasks: [], tests: [], useCases: [], altId: '' });
export const ChangeRequestLoader = loader('ChangeRequest', { description: '', priority: '', source: '', tasks: [], tests: [], useCases: [], altId: '' });
// R20.20 TestCase + R20.21 Gate — both leaf types (no forward children)
export const TestCaseLoader = loader('TestCase', { file: '', describe: '', it: '', testUuid: '', status: '' });
// R20.21 Gate — real verification events (deploy-gate, DET-3x, parity, tron-qa). Few units, created by role at gate-time.
export const GateLoader = loader('Gate', { gateType: '', verdict: '', evidence: '', gatedItems: [], timestamp: '', gatedBy: '' });

const RAWBIN_SYSTEM_UUID = '00000000-0000-4000-8000-rawb1n000000';

// [impl:uuid:3ddc7da8-a38a-470c-95f7-e48e3e7757c9] ensureRawBinUser
// [impl:uuid:6ef8bfc5-1d97-41b6-bbea-0dd52e575957] impl:ensureRawBinUser (split for ClassRegistry.register(name
// [impl:uuid:693cd5d1-8993-4d1f-8374-a9224a18ea66] impl:ensureRawBinUser (split for ClassRegistry.get(name): Cl
// [impl:uuid:9de8264f-fbbf-4c0c-9eff-da59d432354e] impl:ensureRawBinUser (split for ClassRegistry.get(name): Cl
export function ensureRawBinUser(idx: { get(uuid: string): any; put(uuid: string, unit: any): void }): string {
  if (!idx.get(RAWBIN_SYSTEM_UUID)) {
    idx.put(RAWBIN_SYSTEM_UUID, { ior: 'ior:class:User', model: { uuid: RAWBIN_SYSTEM_UUID, name: 'RawBin', displayName: 'RawBin', token: RAWBIN_SYSTEM_UUID, role: 'system' }, ownerIor: null });
  }
  return RAWBIN_SYSTEM_UUID;
}

export class ClassRegistry {
  private loaders = new Map<string, ClassLoader>();

  constructor() {
    for (const l of [SprintLoader, TaskLoader, RequirementLoader, UseCaseLoader, ClassObjLoader, MethodLoader, TestLoader, TraceLinkLoader, UserLoader, SkillLoader, FileLoader, MessageLoader, BugLoader, ChangeRequestLoader, TestCaseLoader, GateLoader, AgentMessageLoader]) {
      this.loaders.set(l.className, l);
    }
  }

  resolve(classIor: string): ClassLoader | undefined {
    const name = classIor.replace(/^ior:class:/, '');
    return this.loaders.get(name);
  }

  has(classIor: string): boolean {
    return !!this.resolve(classIor);
  }

  all(): string[] {
    return [...this.loaders.keys()];
  }
}
