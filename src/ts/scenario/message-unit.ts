/**
 * Message as scenario unit — doubly-linked list per room.
 * Each message: ior:class:Message, ownerIor=senderIor, prev/next links.
 */
import crypto from 'node:crypto';
import { type ScenarioUnit } from './types.js';
import { ScenarioIndex } from './index-store.js';

export interface MessageInput {
  text: string;
  senderToken: string;
  senderName: string;
  roomUuid: string;
  kind?: string;
}

// [impl:uuid:7a983076-a1b2-4c3d-8e4f-5a6b7c8d9e03] createMessageUnit
export function createMessageUnit(idx: ScenarioIndex, input: MessageInput, lastMessageIor?: string): ScenarioUnit {
  const uuid = crypto.randomUUID();
  const unit: ScenarioUnit = {
    ior: 'ior:class:Message',
    model: {
      uuid,
      name: `${input.senderName}: ${input.text.slice(0, 50)}`,
      text: input.text,
      timestamp: Date.now(),
      senderIor: `ior:instance:${input.senderToken}`,
      senderName: input.senderName,
      roomIor: `ior:instance:${input.roomUuid}`,
      prevMessage: lastMessageIor || null,
      nextMessage: null,
      kind: input.kind || 'chat',
      unitLinks: [`sprints.json/rooms/${input.roomUuid}/messages/${uuid}.json`],
    },
    ownerIor: `ior:instance:${input.senderToken}`,
  };
  idx.put(uuid, unit);

  if (lastMessageIor) {
    const prevUuid = lastMessageIor.replace('ior:instance:', '');
    const prev = idx.get(prevUuid);
    if (prev) {
      (prev.model as Record<string, unknown>).nextMessage = `ior:instance:${uuid}`;
      idx.put(prevUuid, prev);
    }
  }

  return unit;
}
