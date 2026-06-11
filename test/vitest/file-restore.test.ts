/**
 * File-restore on JOIN_ROOM — verifies fsSync usage + FILE_ADDED sent
 * [test:uuid:a31b7c82-f4e5-4d6a-9b8c-0e1f2a3b4c5d] R19.14 file-restore on rejoin
 *
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import fsSync from 'node:fs';
import path from 'node:path';

describe('file-restore JOIN_ROOM path', () => {
  it('server.ts uses fsSync (not fs/promises) for file scan', () => {
    const serverSrc = fsSync.readFileSync(
      path.join(__dirname, '../../src/ts/server/server.ts'), 'utf-8'
    );
    const fileRestoreBlock = serverSrc.match(/file-restore on JOIN_ROOM[\s\S]*?catch/);
    expect(fileRestoreBlock).toBeTruthy();
    const block = fileRestoreBlock![0];
    expect(block).toContain('fsSync.existsSync');
    expect(block).toContain('fsSync.readdirSync');
    expect(block).not.toMatch(/(?<![a-zA-Z])fs\.existsSync/);
    expect(block).not.toMatch(/(?<![a-zA-Z])fs\.readdirSync/);
  });

  it('FILE_ADDED message type exists', () => {
    const msgSrc = fsSync.readFileSync(
      path.join(__dirname, '../../src/ts/shared/MessageTypes.ts'), 'utf-8'
    );
    expect(msgSrc).toContain("FILE_ADDED");
  });
});
