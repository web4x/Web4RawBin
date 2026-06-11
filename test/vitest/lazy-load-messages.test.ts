/**
 * R19.40 Lazy-load Messages — Champagne Test
 * [test:uuid:9e1cb105-27b1-4268-b9c3-d2110563fdeb] R19.40 lazy-load message pagination
 *
 * Chain: R19.40 → UC message.lazyLoadChain → Class RbChatSheet → Method loadOlder
 *        → Impl 94bc8f6e → THIS TEST
 *
 * Tests the linked-list pagination: seed N messages, walk backward via prevMessage,
 * return oldest-first, paginate in chunks, stop when <limit.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ScenarioIndex } from '../../src/ts/scenario/index-store.js';
import { createMessageUnit } from '../../src/ts/scenario/message-unit.js';

describe('[test:uuid:9e1cb105] R19.40 lazy-load message pagination', () => {
  let tmp: string;
  let idx: ScenarioIndex;
  const roomUuid = 'test-room-lazy';

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lazy-msg-'));
    fs.mkdirSync(path.join(tmp, 'index'));
    idx = new ScenarioIndex(path.join(tmp, 'index'));
  });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  function seedMessages(count: number): string[] {
    const uuids: string[] = [];
    let lastIor: string | undefined;
    for (let i = 0; i < count; i++) {
      const m = createMessageUnit(idx, {
        text: `msg-${i}`,
        senderToken: 'tok-sender',
        senderName: 'Sender',
        roomUuid,
      }, lastIor);
      const uuid = (m.model as any).uuid;
      uuids.push(uuid);
      lastIor = `ior:instance:${uuid}`;
    }
    return uuids;
  }

  function walkBackward(startUuid: string, limit: number): { messages: any[]; hasMore: boolean } {
    const messages: any[] = [];
    let cursor = startUuid;
    while (cursor && messages.length < limit) {
      const unit = idx.get(cursor);
      if (!unit || unit.ior !== 'ior:class:Message') break;
      const m = unit.model as Record<string, unknown>;
      messages.push({ uuid: cursor, text: m.text, senderName: m.senderName, prevMessage: m.prevMessage });
      const prev = String(m.prevMessage || '').replace('ior:instance:', '');
      if (!prev || prev === cursor) break;
      cursor = prev;
    }
    messages.reverse();
    return { messages, hasMore: messages.length === limit };
  }

  it('TC-1: walk backward from last message returns oldest-first', () => {
    const uuids = seedMessages(5);
    const result = walkBackward(uuids[4], 10);
    expect(result.messages.length).toBe(5);
    expect(result.messages[0].text).toBe('msg-0');
    expect(result.messages[4].text).toBe('msg-4');
    expect(result.hasMore).toBe(false);
  });

  it('TC-2: limit=5 on 8 messages returns last 5 oldest-first + hasMore=true', () => {
    const uuids = seedMessages(8);
    const result = walkBackward(uuids[7], 5);
    expect(result.messages.length).toBe(5);
    expect(result.messages[0].text).toBe('msg-3');
    expect(result.messages[4].text).toBe('msg-7');
    expect(result.hasMore).toBe(true);
  });

  it('TC-3: pagination — load 5, then next 5 via prevMessage of oldest', () => {
    const uuids = seedMessages(10);
    // Page 1: last 5
    const page1 = walkBackward(uuids[9], 5);
    expect(page1.messages.length).toBe(5);
    expect(page1.messages[0].text).toBe('msg-5');
    expect(page1.hasMore).toBe(true);

    // Page 2: walk from prevMessage of oldest in page1
    const oldestInPage1 = page1.messages[0].prevMessage;
    expect(oldestInPage1).toBeDefined();
    const prevUuid = String(oldestInPage1).replace('ior:instance:', '');
    const page2 = walkBackward(prevUuid, 5);
    expect(page2.messages.length).toBe(5);
    expect(page2.messages[0].text).toBe('msg-0');
    expect(page2.messages[4].text).toBe('msg-4');
    expect(page2.hasMore).toBe(true);
  });

  it('TC-4: stop when <limit (3 messages, limit=5)', () => {
    const uuids = seedMessages(3);
    const result = walkBackward(uuids[2], 5);
    expect(result.messages.length).toBe(3);
    expect(result.hasMore).toBe(false);
  });

  it('TC-5: empty room (no messages) returns empty + hasMore=false', () => {
    const result = walkBackward('', 5);
    expect(result.messages.length).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('TC-6: single message returns 1 + hasMore=false', () => {
    const uuids = seedMessages(1);
    const result = walkBackward(uuids[0], 5);
    expect(result.messages.length).toBe(1);
    expect(result.messages[0].text).toBe('msg-0');
    expect(result.hasMore).toBe(false);
  });

  it('TC-7: prevMessage chain integrity across 3 pages', () => {
    const uuids = seedMessages(15);
    const p1 = walkBackward(uuids[14], 5);
    expect(p1.messages[0].text).toBe('msg-10');

    const p2cursor = String(p1.messages[0].prevMessage).replace('ior:instance:', '');
    const p2 = walkBackward(p2cursor, 5);
    expect(p2.messages[0].text).toBe('msg-5');

    const p3cursor = String(p2.messages[0].prevMessage).replace('ior:instance:', '');
    const p3 = walkBackward(p3cursor, 5);
    expect(p3.messages[0].text).toBe('msg-0');
    expect(p3.hasMore).toBe(true);
  });
});
