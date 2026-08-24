// R40.1 CR#86-1 BITE — RC is a STANDARD universalActionBar action (verb 'open-rc'), NOT a bespoke private button (the
// custom button was exactly what Tron declined on T40.1). Proves: (1) 'open-rc' is OFFERED on an otmuxpane/terminal
// detail via the ONE applicability resolver; (2) it does NOT leak onto task/file/member details; (3) the bespoke RC
// button + openRc method are GONE from rb-terminal-detail.ts (grep the source). Stub-must-fail: re-adding the bespoke
// button → the grep assertion goes RED. Node-testable (applicableActionsFor is pure). Run: node --import tsx scripts/r4059-rc-universal-action-bite.ts
import { applicableActionsFor, UNIVERSAL_DECLS } from '../src/public/ts/trace/action-applicability.js';
import fs from 'node:fs';
import path from 'node:path';

const verbs = (type: string) => applicableActionsFor({ type }, {}, UNIVERSAL_DECLS).offered.map((a) => a.verb);
let pass = true;
const chk = (name: string, ok: boolean, got?: unknown) => { console.log(`${ok ? '✓' : '✗ FAIL'} ${name}${ok ? '' : ' — got ' + JSON.stringify(got)}`); pass = pass && ok; };

// (1) open-rc is a STANDARD action, offered on the otmuxpane (terminal/pane) detail.
const pane = verbs('otmuxpane');
chk("open-rc OFFERED on an otmuxpane detail (RC = standard universal action)", pane.includes('open-rc'), pane);

// (2) type-policy: open-rc does NOT leak onto other detail types.
chk('open-rc NOT on task', !verbs('task').includes('open-rc'), verbs('task'));
chk('open-rc NOT on file', !verbs('file').includes('open-rc'), verbs('file'));
chk('open-rc NOT on member', !verbs('member').includes('open-rc'), verbs('member'));

// (3) the bespoke button is GONE from rb-terminal-detail.ts — this is the stub-must-fail: re-adding it → RED.
const termSrc = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '../src/public/ts/trace/rb-terminal-detail.ts'), 'utf8');
chk('NO bespoke openRc method in rb-terminal-detail.ts', !/\bopenRc\b/.test(termSrc));
chk('NO bespoke RC <button> (createElement button + Claude.ai RC) in rb-terminal-detail.ts', !/Claude\.ai RC/.test(termSrc) || !/createElement\(['"]button['"]\)/.test(termSrc));

// (4) the handler + resolver wiring exists in universal-actions.ts (the standard path, reusing the existing chain).
const uaSrc = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '../src/public/ts/trace/universal-actions.ts'), 'utf8');
chk("universal-actions handles 'open-rc' via RcLinkResolver.resolveRcLink (reuse, not redesign)", /verb === 'open-rc'/.test(uaSrc) && /RcLinkResolver\.resolveRcLink/.test(uaSrc));

if (!pass) { console.log('\n✗ CR#86-1 RC-universal-action bite FAILED'); process.exit(1); }
console.log('\n✓ CR#86-1: RC is a standard universal action (offered on otmuxpane, not leaked); bespoke button GONE; handler reuses resolveRcLink');
