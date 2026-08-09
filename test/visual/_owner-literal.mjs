// SECURITY (FLEET no-secrets rule): the R31.2 owner literal is a SECRET VALUE. It must NOT be hardcoded in any test
// file. Its sanctioned single-source homes are ServerManagerGuard.ts (INV-G2, in code) and /var/dev/security-local
// (chmod-600). This helper READS it at runtime so gates stay functional WITHOUT the value living in a test file.
import fs from 'node:fs';

const SRC = '/var/dev/Workspaces/web4x/Web4RawBin/src/ts/server/ServerManagerGuard.ts';
const LOCAL = '/var/dev/security-local/owner-token.value'; // preferred if present (post-rotation)

function readOwnerLiteral() {
  try { const v = fs.readFileSync(LOCAL, 'utf8').trim(); if (/^[0-9a-f-]{36}$/.test(v)) return v; } catch { /* fall through */ }
  try { return (fs.readFileSync(SRC, 'utf8').match(/OWNER_TOKEN\s*=\s*'([0-9a-f-]{36})'/) || [])[1] || ''; } catch { return ''; }
}

export const OWNER_LITERAL = readOwnerLiteral();
