/**
 * T125.2 — 7 class loaders (Sprint/Task/Requirement/UseCase/Class/Method/Test)
 * + ClassRegistry for IOR resolution.
 *
 * [impl:uuid:20cca741-0a93-4d93-8a51-9c72bdb77d92] R17.3
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
// T-file-unit R19.14: files become unique scenario units (<uuid>.content + <uuid>.scenario.json + unitLinks[])
export const FileLoader = loader('File', { contentPath: '', size: 0, mimeType: '', uploadedAt: '', uploaderToken: '', roomUuid: '' });
export const MessageLoader = loader('Message', { text: '', timestamp: 0, senderIor: '', senderName: '', roomIor: '', prevMessage: null, nextMessage: null, kind: 'chat' });

const RAWBIN_SYSTEM_UUID = '00000000-0000-4000-8000-rawb1n000000';

// [impl:uuid:971e3531-b2c3-4d4e-9f5a-6b7c8d9e0f04] ensureRawBinUser
export function ensureRawBinUser(idx: { get(uuid: string): any; put(uuid: string, unit: any): void }): string {
  if (!idx.get(RAWBIN_SYSTEM_UUID)) {
    idx.put(RAWBIN_SYSTEM_UUID, { ior: 'ior:class:User', model: { uuid: RAWBIN_SYSTEM_UUID, name: 'RawBin', displayName: 'RawBin', token: RAWBIN_SYSTEM_UUID, role: 'system' }, ownerIor: null });
  }
  return RAWBIN_SYSTEM_UUID;
}

export class ClassRegistry {
  private loaders = new Map<string, ClassLoader>();

  constructor() {
    for (const l of [SprintLoader, TaskLoader, RequirementLoader, UseCaseLoader, ClassObjLoader, MethodLoader, TestLoader, TraceLinkLoader, UserLoader, SkillLoader, FileLoader, MessageLoader]) {
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
