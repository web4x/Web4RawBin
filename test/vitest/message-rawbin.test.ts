/**
 * R19.38 Message + R19.39 RawBin System User — Champagne Tests
 * [test:uuid:8289ef98-6aba-49a2-be74-89e95658f1a7] R19.38 Message scenario unit chain
 * [test:uuid:f2122854-51e0-4e5e-850e-9d86acebed3b] R19.39 RawBin system user chain
 *
 * Chain R19.38: Req → UC message.persist → Class Message → Method createMessage → Impl 7a983076 → THIS TEST
 * Chain R19.39: Req → UC rawbin.ensureSystem → Class RawBinUser → Method ensureUser → Impl 971e3531 → THIS TEST
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ScenarioIndex } from '../../src/ts/scenario/index-store.js';
import { createMessageUnit } from '../../src/ts/scenario/message-unit.js';
import { ensureRawBinUser } from '../../src/ts/scenario/classes.js';

// ── R19.38: Message scenario unit ──────────────────────────────────────────

describe('[test:uuid:8289ef98-6aba-49a2-be74-89e95658f1a7] R19.38 Message scenario unit', () => {
  let tmp: string;
  let idx: ScenarioIndex;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'msg-test-'));
    fs.mkdirSync(path.join(tmp, 'index'));
    idx = new ScenarioIndex(path.join(tmp, 'index'));
  });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('TC-1: createMessageUnit produces ior:class:Message with ownerIor=sender', () => {
    const m = createMessageUnit(idx, { text: 'hello', senderToken: 'tok-a', senderName: 'Alice', roomUuid: 'room-1' });
    expect(m.ior).toBe('ior:class:Message');
    expect(m.ownerIor).toBe('ior:instance:tok-a');
    const model = m.model as Record<string, unknown>;
    expect(model.text).toBe('hello');
    expect(model.senderName).toBe('Alice');
    expect(model.roomIor).toBe('ior:instance:room-1');
    expect(model.kind).toBe('chat');
    expect(model.timestamp).toBeGreaterThan(0);
  });

  it('TC-2: prevMessage/nextMessage doubly-linked (2 msgs → m2.prev=m1, m1.next=m2)', () => {
    const m1 = createMessageUnit(idx, { text: 'first', senderToken: 'tok-a', senderName: 'Alice', roomUuid: 'room-1' });
    const m1Uuid = (m1.model as any).uuid;
    const m1Ior = `ior:instance:${m1Uuid}`;

    const m2 = createMessageUnit(idx, { text: 'second', senderToken: 'tok-b', senderName: 'Bob', roomUuid: 'room-1' }, m1Ior);
    const m2Uuid = (m2.model as any).uuid;

    expect((m2.model as any).prevMessage).toBe(m1Ior);

    const m1Reloaded = idx.get(m1Uuid);
    expect(m1Reloaded).toBeDefined();
    expect((m1Reloaded!.model as any).nextMessage).toBe(`ior:instance:${m2Uuid}`);
  });

  it('TC-3: kind tag customizable', () => {
    const m = createMessageUnit(idx, { text: 'sys', senderToken: 'tok-sys', senderName: 'System', roomUuid: 'r1', kind: 'drop-debug' });
    expect((m.model as any).kind).toBe('drop-debug');
  });

  it('TC-4: unitLinks is empty (no stray room-dir symlinks)', () => {
    const m = createMessageUnit(idx, { text: 'x', senderToken: 'tok-a', senderName: 'A', roomUuid: 'room-abc' });
    const links = (m.model as any).unitLinks as string[];
    expect(links).toEqual([]);
  });

  it('TC-5: first message has prevMessage=null', () => {
    const m = createMessageUnit(idx, { text: 'first', senderToken: 'tok-a', senderName: 'A', roomUuid: 'r1' });
    expect((m.model as any).prevMessage).toBeNull();
    expect((m.model as any).nextMessage).toBeNull();
  });

  it('TC-6: 3-message chain maintains full linked list', () => {
    const m1 = createMessageUnit(idx, { text: 'a', senderToken: 'tok', senderName: 'X', roomUuid: 'r' });
    const m1Ior = `ior:instance:${(m1.model as any).uuid}`;
    const m2 = createMessageUnit(idx, { text: 'b', senderToken: 'tok', senderName: 'X', roomUuid: 'r' }, m1Ior);
    const m2Ior = `ior:instance:${(m2.model as any).uuid}`;
    const m3 = createMessageUnit(idx, { text: 'c', senderToken: 'tok', senderName: 'X', roomUuid: 'r' }, m2Ior);

    const loaded1 = idx.get((m1.model as any).uuid)!;
    const loaded2 = idx.get((m2.model as any).uuid)!;
    expect((loaded1.model as any).nextMessage).toBe(m2Ior);
    expect((loaded2.model as any).prevMessage).toBe(m1Ior);
    expect((loaded2.model as any).nextMessage).toBe(`ior:instance:${(m3.model as any).uuid}`);
    expect((m3.model as any).prevMessage).toBe(m2Ior);
  });
});

// ── R19.39: RawBin system user ─────────────────────────────────────────────

describe('[test:uuid:f2122854-51e0-4e5e-850e-9d86acebed3b] R19.39 RawBin system user', () => {
  let tmp: string;
  let idx: ScenarioIndex;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rawbin-test-'));
    fs.mkdirSync(path.join(tmp, 'index'));
    idx = new ScenarioIndex(path.join(tmp, 'index'));
  });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('TC-7: ensureRawBinUser creates system user with known UUID', () => {
    const uuid = ensureRawBinUser(idx);
    expect(uuid).toBe('00000000-0000-4000-8000-rawb1n000000');
    const user = idx.get(uuid);
    expect(user).toBeDefined();
    expect(user!.ior).toBe('ior:class:User');
    expect((user!.model as any).name).toBe('RawBin');
    expect((user!.model as any).role).toBe('system');
  });

  it('TC-8: ensureRawBinUser idempotent (2nd call returns same UUID, no dup)', () => {
    const uuid1 = ensureRawBinUser(idx);
    const uuid2 = ensureRawBinUser(idx);
    expect(uuid1).toBe(uuid2);
    const user = idx.get(uuid1);
    expect(user).toBeDefined();
  });

  it('TC-9: drop-debug message ownerIor = RawBin system user', () => {
    const rbUuid = ensureRawBinUser(idx);
    const m = createMessageUnit(idx, {
      text: 'Dropped [unknown]: test.xyz — no handler registered',
      senderToken: rbUuid,
      senderName: 'RawBin',
      roomUuid: 'room-test',
      kind: 'drop-debug',
    });
    expect(m.ownerIor).toBe(`ior:instance:${rbUuid}`);
    expect((m.model as any).kind).toBe('drop-debug');
    expect((m.model as any).senderName).toBe('RawBin');
  });
});
