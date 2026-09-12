// v0.8.217 — "Link here" affordance GATED OFF (offered⟺succeeds; hidden until INC-6 edge-aware render lands, since
// a link's children[] edge does not yet render under the target folder = no visible effect = broken promise).
// Gate (resolver-only, no room): applicableActionsFor for a FILE does NOT offer 'link', but STILL offers move + rename
// (only link hidden, not the whole bar); INC-1 verb-dispatch lint stays 0 (the hide is a decl change, not a dispatch switch).
// GATE-WHEN-INC-6-LANDS: this flips — 'link' offered again once the tree renders the edge (re-run slice-4 render-obs).
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const NODE = '/root/.vscode-server/bin/dc96b837cf6bb4af9cd736aa3af08cf8279f7685/node';
let served = '?'; try { served = JSON.parse(execSync('curl -sk https://prod.wo-da.de:4444/api/config', { encoding: 'utf8' })).version; } catch {}

// resolver: offered verbs for a file
const tmp = `${REPO}/test/visual/.link-hidden.ts`;
const code = [
  "import { applicableActionsFor, UNIVERSAL_DECLS } from '../../src/public/ts/trace/action-applicability.ts';",
  "const off = applicableActionsFor({ type: 'file' }, {}, UNIVERSAL_DECLS).offered.map((a:any)=>a.verb);",
  "console.log(JSON.stringify(off));",
].join('\n');
let offered = [];
try { writeFileSync(tmp, code); offered = JSON.parse(execSync(`${NODE} --import tsx ${tmp} 2>/dev/null || npx tsx ${tmp}`, { cwd: REPO, encoding: 'utf8' }).trim().split('\n').pop()); } catch (e) { console.log('resolver err', String(e.message||e).slice(0,120)); } finally { try { unlinkSync(tmp); } catch {} }

const linkHidden = !offered.includes('link');
const moveStillOffered = offered.includes('move');
const renameStillOffered = offered.includes('rename');
let inc1 = false; try { execSync(`${NODE} ${REPO}/test/visual/r3720-inc1-verb-dispatch-lint.mjs`, { encoding: 'utf8' }); inc1 = true; } catch { inc1 = false; }

console.log(`=== v0.8.217 "Link here" GATED OFF — SERVED v${served} ===`);
console.log(`  file offered verbs = ${JSON.stringify(offered)}`);
console.log(`  link HIDDEN=${linkHidden} | move still offered=${moveStillOffered} | rename still offered=${renameStillOffered} | INC-1 verb-dispatch lint 0=${inc1}`);
const green = linkHidden && moveStillOffered && renameStillOffered && inc1;
console.log(green ? `\nGREEN @v${served} — 'Link here' hidden (offered⟺succeeds; no visible effect until INC-6), move+rename intact, OCP lint 0.` : `\nRED @v${served}`);
process.exit(green ? 0 : 1);
