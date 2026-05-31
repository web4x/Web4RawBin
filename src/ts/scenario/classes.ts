/**
 * T125.2 — 7 class loaders (Sprint/Task/Requirement/UseCase/Class/Method/Test)
 * + ClassRegistry for IOR resolution.
 *
 * [impl:uuid:20cca741-0a93-4d93-8a51-9c72bdb77d92] R17.3
 */
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
export const TaskLoader = loader('Task', { description: '', status: '', assigned: '', effort: '', children: [], requirements: [], useCases: [], implementations: [] });
export const RequirementLoader = loader('Requirement', { description: '', priority: '', source: '', tasks: [], tests: [] });
export const UseCaseLoader = loader('UseCase', { object: '', verb: '', tasks: [], classes: [], requirement: null });
export const ClassObjLoader = loader('Class', { file: null, useCases: [], methods: [] });
export const MethodLoader = loader('Method', { class: null, implementations: [], tests: [], task: null, requirement: null });
export const TestLoader = loader('Test', { file: null, methods: [], requirements: [], status: '' });
export const UserLoader = loader('User', { displayName: '', token: '', avatarHash: '', deviceId: '', sshPubKey: '', createdAt: '', updatedAt: '' });

export class ClassRegistry {
  private loaders = new Map<string, ClassLoader>();

  constructor() {
    for (const l of [SprintLoader, TaskLoader, RequirementLoader, UseCaseLoader, ClassObjLoader, MethodLoader, TestLoader, TraceLinkLoader, UserLoader]) {
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
