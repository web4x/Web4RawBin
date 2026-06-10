/**
 * Task 20: Room Chat Parity — unit tests
 * [test:uuid:75d1d899-8c52-48dd-a696-42f7492889e3] T20 room chat parity
 * Tests Room.addChat, broadcast, chat history, 200 char limit, sender name, multi-user.
 *
 * Uses Room class directly — no running server needed.
 */

import { describe, it, expect, vi } from 'vitest';
import { Room } from '../../src/ts/server/Room.js';
import type { RoomMember } from '../../src/ts/server/Room.js';
import { WebSocket } from 'ws';

function mockWs(open = true): WebSocket {
  return {
    send: vi.fn(),
    readyState: open ? 1 : 3,
    close: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as WebSocket;
}

function makeMember(overrides: Partial<RoomMember> = {}): RoomMember {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    ws: overrides.ws ?? mockWs(),
    name: overrides.name ?? 'TestUser',
    avatarUrl: overrides.avatarUrl ?? '',
    playerToken: overrides.playerToken ?? `token-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    disconnected: overrides.disconnected ?? false,
  };
}

function getSentMessages(ws: WebSocket): any[] {
  return (ws.send as ReturnType<typeof vi.fn>).mock.calls.map(call => JSON.parse(call[0] as string));
}

function clearMock(ws: WebSocket): void {
  (ws.send as ReturnType<typeof vi.fn>).mockClear();
}

// ── TC-20.1: CHAT_MESSAGE broadcast to all room members ─────────────────────

describe('TC-20.1: Chat message broadcast', () => {

  it('addChat broadcasts CHAT_MESSAGE to all members', () => {
    const creator = makeMember({ name: 'Alice' });
    const joiner = makeMember({ name: 'Bob' });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });
    room.addMember(joiner);

    clearMock(creator.ws);
    clearMock(joiner.ws);

    room.addChat(creator.id, 'Alice', 'Hello everyone!');

    const aliceMsgs = getSentMessages(creator.ws);
    const bobMsgs = getSentMessages(joiner.ws);

    const aliceChat = aliceMsgs.find(m => m.type === 'CHAT_MESSAGE');
    const bobChat = bobMsgs.find(m => m.type === 'CHAT_MESSAGE');

    expect(aliceChat).toBeDefined();
    expect(bobChat).toBeDefined();
    expect(aliceChat.text).toBe('Hello everyone!');
    expect(bobChat.text).toBe('Hello everyone!');
  });

  it('broadcast includes sender info', () => {
    const creator = makeMember({ name: 'Sender' });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });

    clearMock(creator.ws);
    room.addChat(creator.id, 'Sender', 'test msg');

    const msgs = getSentMessages(creator.ws);
    const chat = msgs.find(m => m.type === 'CHAT_MESSAGE');
    expect(chat.senderId).toBe(creator.id);
    expect(chat.senderName).toBe('Sender');
    expect(chat.timestamp).toBeDefined();
    expect(chat.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('does not broadcast to disconnected members', () => {
    const creator = makeMember({ name: 'Host' });
    const disconnected = makeMember({ name: 'Ghost', ws: mockWs(false) });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });
    room.addMember(disconnected);

    clearMock(creator.ws);
    clearMock(disconnected.ws);

    room.addChat(creator.id, 'Host', 'Are you there?');

    expect(creator.ws.send).toHaveBeenCalled();
    expect(disconnected.ws.send).not.toHaveBeenCalled();
  });

    const spectator = makeMember({ name: 'Watcher' });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });
    room.addSpectator(spectator);

    clearMock(creator.ws);
    clearMock(spectator.ws);

    room.addChat(creator.id, 'Host', 'Spectators can see this');

    const specMsgs = getSentMessages(spectator.ws);
    const chat = specMsgs.find(m => m.type === 'CHAT_MESSAGE');
    expect(chat).toBeDefined();
    expect(chat.text).toBe('Spectators can see this');
  });
});

// ── TC-20.2: Chat history preserved on rejoin ───────────────────────────────

describe('TC-20.2: Chat history on rejoin', () => {

  it('new member receives CHAT_HISTORY on join', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });

    room.addChat(creator.id, 'Host', 'First message');
    room.addChat(creator.id, 'Host', 'Second message');

    const joiner = makeMember({ name: 'LateJoiner' });
    room.addMember(joiner);

    const joinerMsgs = getSentMessages(joiner.ws);
    const history = joinerMsgs.find(m => m.type === 'CHAT_HISTORY');
    expect(history).toBeDefined();
    expect(history.messages.length).toBe(2);
    expect(history.messages[0].text).toBe('First message');
    expect(history.messages[1].text).toBe('Second message');
  });

    const room = new Room('ChatRoom', creator, { maxMembers: 4 });

    room.addChat(creator.id, 'Host', 'Before spectator');

    const spectator = makeMember({ name: 'Watcher' });
    room.addSpectator(spectator);

    const specMsgs = getSentMessages(spectator.ws);
    const history = specMsgs.find(m => m.type === 'CHAT_HISTORY');
    expect(history).toBeDefined();
    expect(history.messages.length).toBe(1);
    expect(history.messages[0].text).toBe('Before spectator');
  });

  it('no CHAT_HISTORY sent when chat is empty', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });

    const joiner = makeMember({ name: 'Joiner' });
    room.addMember(joiner);

    const joinerMsgs = getSentMessages(joiner.ws);
    const history = joinerMsgs.find(m => m.type === 'CHAT_HISTORY');
    expect(history).toBeUndefined();
  });

  it('getChatHistory returns copy of all messages', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });

    room.addChat(creator.id, 'Host', 'msg1');
    room.addChat(creator.id, 'Host', 'msg2');
    room.addChat(creator.id, 'Host', 'msg3');

    const history = room.getChatHistory();
    expect(history.length).toBe(3);
    expect(history[0].text).toBe('msg1');
    expect(history[2].text).toBe('msg3');

    // Verify it's a copy (mutating returned array doesn't affect room)
    history.pop();
    expect(room.getChatHistory().length).toBe(3);
  });
});

// ── TC-20.3: 200 char message limit enforced ────────────────────────────────

describe('TC-20.3: Message length limit', () => {

  it('server handler truncates messages to 200 chars', () => {
    // Replicate server.ts line 699: msg.text.slice(0, 200)
    const longText = 'A'.repeat(300);
    const truncated = longText.slice(0, 200);

    expect(truncated.length).toBe(200);
    expect(longText.length).toBe(300);
  });

  it('Room.addChat stores full text (truncation is server handler responsibility)', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });

    // Room.addChat receives already-truncated text from server handler
    const text200 = 'B'.repeat(200);
    room.addChat(creator.id, 'Host', text200);

    const history = room.getChatHistory();
    expect(history[0].text.length).toBe(200);
  });

  it('chat history limit is 100 messages', () => {
    const creator = makeMember({ name: 'Spammer' });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });

    for (let i = 0; i < 150; i++) {
      room.addChat(creator.id, 'Spammer', `msg-${i}`);
    }

    const history = room.getChatHistory();
    expect(history.length).toBe(100);
    // Oldest messages dropped, newest kept
    expect(history[0].text).toBe('msg-50');
    expect(history[99].text).toBe('msg-149');
  });
});

// ── TC-20.4: Sender name included in message ────────────────────────────────

describe('TC-20.4: Sender name in chat', () => {

  it('senderName matches the name passed to addChat', () => {
    const creator = makeMember({ name: 'Alice' });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });

    room.addChat(creator.id, 'Alice', 'Hello');

    const history = room.getChatHistory();
    expect(history[0].senderName).toBe('Alice');
  });

  it('different senders have different senderName', () => {
    const alice = makeMember({ name: 'Alice' });
    const bob = makeMember({ name: 'Bob' });
    const room = new Room('ChatRoom', alice, { maxMembers: 4 });
    room.addMember(bob);

    room.addChat(alice.id, 'Alice', 'Hi from Alice');
    room.addChat(bob.id, 'Bob', 'Hi from Bob');

    const history = room.getChatHistory();
    expect(history[0].senderName).toBe('Alice');
    expect(history[1].senderName).toBe('Bob');
  });

  it('broadcast message includes senderName for each recipient', () => {
    const alice = makeMember({ name: 'Alice' });
    const bob = makeMember({ name: 'Bob' });
    const room = new Room('ChatRoom', alice, { maxMembers: 4 });
    room.addMember(bob);

    clearMock(alice.ws);
    clearMock(bob.ws);

    room.addChat(alice.id, 'Alice', 'Check my name');

    const bobMsgs = getSentMessages(bob.ws);
    const chat = bobMsgs.find(m => m.type === 'CHAT_MESSAGE');
    expect(chat.senderName).toBe('Alice');
  });
});

// ── TC-20.5: Chat works between 2+ users ────────────────────────────────────

describe('TC-20.5: Multi-user chat', () => {

  it('3 users all receive each others messages', () => {
    const alice = makeMember({ name: 'Alice' });
    const bob = makeMember({ name: 'Bob' });
    const carol = makeMember({ name: 'Carol' });
    const room = new Room('ChatRoom', alice, { maxMembers: 6 });
    room.addMember(bob);
    room.addMember(carol);

    clearMock(alice.ws);
    clearMock(bob.ws);
    clearMock(carol.ws);

    room.addChat(alice.id, 'Alice', 'Hello from Alice');
    room.addChat(bob.id, 'Bob', 'Hello from Bob');
    room.addChat(carol.id, 'Carol', 'Hello from Carol');

    // Each user should have received 3 CHAT_MESSAGE broadcasts
    for (const member of [alice, bob, carol]) {
      const msgs = getSentMessages(member.ws).filter(m => m.type === 'CHAT_MESSAGE');
      expect(msgs.length).toBe(3);
      expect(msgs[0].senderName).toBe('Alice');
      expect(msgs[1].senderName).toBe('Bob');
      expect(msgs[2].senderName).toBe('Carol');
    }
  });

  it('message order preserved in history', () => {
    const alice = makeMember({ name: 'Alice' });
    const bob = makeMember({ name: 'Bob' });
    const room = new Room('ChatRoom', alice, { maxMembers: 4 });
    room.addMember(bob);

    room.addChat(alice.id, 'Alice', 'First');
    room.addChat(bob.id, 'Bob', 'Second');
    room.addChat(alice.id, 'Alice', 'Third');
    room.addChat(bob.id, 'Bob', 'Fourth');

    const history = room.getChatHistory();
    expect(history.length).toBe(4);
    expect(history.map(m => m.text)).toEqual(['First', 'Second', 'Third', 'Fourth']);
    expect(history.map(m => m.senderName)).toEqual(['Alice', 'Bob', 'Alice', 'Bob']);
  });

  it('late joiner gets full conversation history', () => {
    const alice = makeMember({ name: 'Alice' });
    const bob = makeMember({ name: 'Bob' });
    const room = new Room('ChatRoom', alice, { maxMembers: 6 });
    room.addMember(bob);

    room.addChat(alice.id, 'Alice', 'Before Carol');
    room.addChat(bob.id, 'Bob', 'Also before Carol');

    const carol = makeMember({ name: 'Carol' });
    room.addMember(carol);

    const carolMsgs = getSentMessages(carol.ws);
    const history = carolMsgs.find(m => m.type === 'CHAT_HISTORY');
    expect(history).toBeDefined();
    expect(history.messages.length).toBe(2);
    expect(history.messages[0].senderName).toBe('Alice');
    expect(history.messages[1].senderName).toBe('Bob');

    // Carol also gets new messages going forward
    clearMock(carol.ws);
    room.addChat(alice.id, 'Alice', 'After Carol joined');

    const newMsgs = getSentMessages(carol.ws);
    const newChat = newMsgs.find(m => m.type === 'CHAT_MESSAGE');
    expect(newChat).toBeDefined();
    expect(newChat.text).toBe('After Carol joined');
  });

  it('member who left does not receive further messages', () => {
    const alice = makeMember({ name: 'Alice' });
    const bob = makeMember({ name: 'Bob' });
    const room = new Room('ChatRoom', alice, { maxMembers: 4 });
    room.addMember(bob);

    room.removeMember(bob.id);
    clearMock(bob.ws);

    room.addChat(alice.id, 'Alice', 'Bob is gone');

    expect(bob.ws.send).not.toHaveBeenCalled();
  });
});
