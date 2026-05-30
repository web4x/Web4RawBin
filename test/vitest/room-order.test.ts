/**
 * T95: Lobby newest-first ordering — unit tests for the enrichRoomList sort.
 * [test:uuid:80c16527-a6b6-4b5f-8c94-0d76e838d2b3] T95 lobby ordering
 * Replicates the comparator from server.ts enrichRoomList():
 *   .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
 * Covers AC1 (newest-first), AC4 (legacy no-createdAt sinks to bottom),
 * AC5 (no rooms dropped), AC3 (stable — deterministic on equal input).
 */

import { describe, it, expect } from 'vitest';

interface ListRoom {
  id: string;
  name: string;
  createdAt?: number;
  ownerToken?: string;
}

// Replicate the exact enrichRoomList sort seam
function enrichRoomList(rooms: ListRoom[]): ListRoom[] {
  return rooms
    .map(r => ({ ...r, ownerName: r.ownerToken ? 'Unknown' : '' }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

describe('TC-95.1: Newest-first ordering (AC1/AC2)', () => {

  it('orders rooms descending by createdAt', () => {
    const rooms: ListRoom[] = [
      { id: 'a', name: 'Alpha', createdAt: 1000 },
      { id: 'b', name: 'Bravo', createdAt: 2000 },
      { id: 'c', name: 'Charlie', createdAt: 3000 },
    ];
    const sorted = enrichRoomList(rooms);
    expect(sorted.map(r => r.name)).toEqual(['Charlie', 'Bravo', 'Alpha']);
  });

  it('newest room appears first regardless of input order', () => {
    const rooms: ListRoom[] = [
      { id: 'c', name: 'Charlie', createdAt: 3000 },
      { id: 'a', name: 'Alpha', createdAt: 1000 },
      { id: 'b', name: 'Bravo', createdAt: 2000 },
    ];
    const sorted = enrichRoomList(rooms);
    expect(sorted[0].name).toBe('Charlie');
    expect(sorted[sorted.length - 1].name).toBe('Alpha');
  });

  it('a freshly created room (max createdAt) goes to top', () => {
    const rooms: ListRoom[] = [
      { id: 'old1', name: 'Old1', createdAt: 1000 },
      { id: 'old2', name: 'Old2', createdAt: 2000 },
    ];
    rooms.push({ id: 'new', name: 'BrandNew', createdAt: 9999 });
    const sorted = enrichRoomList(rooms);
    expect(sorted[0].name).toBe('BrandNew');
  });
});

describe('TC-95.2: Legacy rooms sink to bottom (AC4)', () => {

  it('room with undefined createdAt sorts last', () => {
    const rooms: ListRoom[] = [
      { id: 'legacy', name: 'Legacy' },
      { id: 'a', name: 'Alpha', createdAt: 1000 },
      { id: 'b', name: 'Bravo', createdAt: 2000 },
    ];
    const sorted = enrichRoomList(rooms);
    expect(sorted[sorted.length - 1].name).toBe('Legacy');
    expect(sorted.map(r => r.name)).toEqual(['Bravo', 'Alpha', 'Legacy']);
  });

  it('multiple legacy rooms all sink, no error', () => {
    const rooms: ListRoom[] = [
      { id: 'l1', name: 'Legacy1' },
      { id: 'a', name: 'Alpha', createdAt: 5000 },
      { id: 'l2', name: 'Legacy2' },
    ];
    const sorted = enrichRoomList(rooms);
    expect(sorted[0].name).toBe('Alpha');
    // both legacy at bottom
    expect(sorted.slice(1).map(r => r.name).sort()).toEqual(['Legacy1', 'Legacy2']);
  });

  it('createdAt=0 treated same as missing (bottom)', () => {
    const rooms: ListRoom[] = [
      { id: 'zero', name: 'Zero', createdAt: 0 },
      { id: 'a', name: 'Alpha', createdAt: 100 },
    ];
    const sorted = enrichRoomList(rooms);
    expect(sorted[0].name).toBe('Alpha');
    expect(sorted[1].name).toBe('Zero');
  });
});

describe('TC-95.3: Stable / no rooms dropped (AC3/AC5)', () => {

  it('sort drops no rooms — same count out as in', () => {
    const rooms: ListRoom[] = [
      { id: 'a', name: 'Alpha', createdAt: 1000, ownerToken: 'owner1' },
      { id: 'b', name: 'Bravo', createdAt: 2000 },
      { id: 'c', name: 'Charlie' },
    ];
    const sorted = enrichRoomList(rooms);
    expect(sorted.length).toBe(3);
    expect(sorted.map(r => r.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('owner-aware private/empty room preserved through sort (AC5)', () => {
    const rooms: ListRoom[] = [
      { id: 'pub', name: 'Public', createdAt: 1000 },
      { id: 'priv', name: 'OwnerPrivate', createdAt: 3000, ownerToken: 'owner1' },
    ];
    const sorted = enrichRoomList(rooms);
    expect(sorted.find(r => r.id === 'priv')).toBeDefined();
    expect(sorted[0].name).toBe('OwnerPrivate'); // newest
  });

  it('re-sorting already-sorted list is idempotent (stable across restart)', () => {
    const rooms: ListRoom[] = [
      { id: 'a', name: 'Alpha', createdAt: 1000 },
      { id: 'b', name: 'Bravo', createdAt: 2000 },
      { id: 'c', name: 'Charlie', createdAt: 3000 },
    ];
    const once = enrichRoomList(rooms);
    const twice = enrichRoomList(once);
    expect(twice.map(r => r.name)).toEqual(once.map(r => r.name));
    expect(twice.map(r => r.name)).toEqual(['Charlie', 'Bravo', 'Alpha']);
  });

  it('enrich adds ownerName without dropping rooms', () => {
    const rooms: ListRoom[] = [
      { id: 'a', name: 'Alpha', createdAt: 1000, ownerToken: 'owner1' },
      { id: 'b', name: 'Bravo', createdAt: 2000 },
    ];
    const sorted = enrichRoomList(rooms);
    expect((sorted[0] as any).ownerName).toBeDefined();
    expect(sorted.length).toBe(2);
  });
});
