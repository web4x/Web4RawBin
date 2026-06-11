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

// [impl:uuid:a3e4972c-cfb5-41b2-b382-a29afb1da568] createMessageUnit
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
      unitLinks: [],
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
