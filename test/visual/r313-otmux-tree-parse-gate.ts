// [test:uuid:9467b1c6-e414-4ec6-8e9f-236a1ece740f] R31.3 OtmuxBridge.readSessionTree (Impl 5c1701bc) — PARSE-MATCH + reject. DET-3x.
// A1: the impl's parsed sessions→windows→panes tree reconstructs the SAME (session|window_index|pane_index|pane_id %N)
//     tuples as raw `tmux list-panes -a -F`, and every pane carries a %-prefixed paneId + label `session:win.pane`.
//     Measured by IMPORTING the real impl (not the API) so it's engine-independent + owner-token-free (parsing is the
//     mint target 5c1701bc; the owner-gated /api/server-manager/tree that wraps it is A2/r312's reject job).
// A2: /api/server-manager/tree + /server-manager page, no owner token → 403 and NEVER leak the shell / session tree.
// Read-only (list-panes verb, execFile array args = no shell/injection). Run: npx tsx test/visual/r313-otmux-tree-parse-gate.ts
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import https from 'node:https';
import { OtmuxBridge } from '../../src/ts/server/OtmuxBridge.ts';

const execFileAsync = promisify(execFile);
const HOST = 'prod.wo-da.de', PORT = 4444;
const FMT = ['#{session_name}', '#{window_index}', '#{window_name}', '#{window_active}',
  '#{pane_index}', '#{pane_id}', '#{pane_active}', '#{pane_title}'].join('\t');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function rawKeys(): Promise<Set<string>> {
  const r = await execFileAsync('tmux', ['list-panes', '-a', '-F', FMT], { timeout: 5000, maxBuffer: 1 << 20 });
  const keys = new Set<string>();
  for (const line of r.stdout.split('\n')) {
    if (!line.trim()) continue;
    const p = line.split('\t');
    keys.add(`${p[0]}|${p[1]}|${p[4]}|${p[5]}`); // session_name|window_index|pane_index|pane_id
  }
  return keys;
}
function implKeys(sessions: any[]): Set<string> {
  const keys = new Set<string>();
  for (const s of sessions) for (const w of s.windows) for (const p of w.panes) keys.add(`${s.name}|${w.index}|${p.index}|${p.paneId}`);
  return keys;
}
const httpGet = (path: string): Promise<{ status: number; body: string }> => new Promise((res) => {
  const req = https.request({ host: HOST, port: PORT, path, method: 'GET', rejectUnauthorized: false }, (r) => {
    let b = ''; r.on('data', (c) => b += c); r.on('end', () => res({ status: r.statusCode || 0, body: b }));
  });
  req.on('error', () => res({ status: 0, body: '' })); req.end();
});

const results: boolean[] = [];
for (let i = 1; i <= 3; i++) {
  // A1 — capture raw + impl back-to-back (same tmux server), compare the structural key set
  const raw = await rawKeys();
  const tree = await OtmuxBridge.readSessionTree();
  const impl = implKeys(tree);
  const missing = [...raw].filter(k => !impl.has(k));   // in raw, impl failed to parse
  const extra = [...impl].filter(k => !raw.has(k));     // impl invented / stale
  const parseMatch = impl.size > 0 && missing.length === 0 && extra.length === 0;
  const labelOk = tree.every((s: any) => s.windows.every((w: any) => w.panes.every((p: any) =>
    p.paneId.startsWith('%') && p.label === `${s.name}:${w.index}.${p.index}`)));

  // A2 — non-owner reject + never-shell on the tree API + the page
  const treeApi = await httpGet('/api/server-manager/tree');
  const page = await httpGet('/server-manager');
  const rejectOk = treeApi.status === 403 && page.status === 403;
  const neverShell = !/"sessions"|window_index|"panes"|"paneId"/i.test(treeApi.body) && !/<script|sessions|panes/i.test(page.body);

  const pass = parseMatch && labelOk && rejectOk && neverShell;
  results.push(pass);
  console.log(`iter ${i}: parseMatch=${parseMatch}(impl=${impl.size} raw=${raw.size} miss=${missing.length} extra=${extra.length}) labelOk=${labelOk} reject=${rejectOk}(tree=${treeApi.status} page=${page.status}) neverShell=${neverShell} => ${pass ? 'GREEN' : 'RED'}`);
  await sleep(200);
}

console.log('\n===== R31.3 otmux tree parse-match + reject (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: owner-200 tree-VISIBLE (real owner live session showing the live tmux tree) = Tron-facing, not gated here.');
process.exitCode = green ? 0 : 1;
