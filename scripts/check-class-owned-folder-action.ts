/**
 * T37.21 (Tron: "add-folder is part of CLASS Folder, ALWAYS") — CLASS-OWNED action-keying gate. Enforce, do NOT document.
 *
 * Tron's structural test: could someone render a Folder unit on a NEW surface / under a new DISPLAY TYPE and silently
 * lack add-folder? Under class keying the answer must be STRUCTURALLY NO. Two assertions, both failable + self-biting:
 *   A. a Folder-classed unit (ior:class:Folder) offers `add-folder` under EVERY display type (the ~7 a Folder presents as).
 *   B. NO folder-class action keys on a display-type `types`/`notTypes` (else "sometimes a button" is back at the type layer).
 */
import { UNIVERSAL_DECLS, applicableActionsFor, classOf, type ActionDecl, type ActionUnit } from '../src/public/ts/trace/action-applicability.js';

// the display types one ior:class:Folder presents as (architect-measured: folder/collection/mof-project/puml/diagram/trace/mof-layer)
// plus the ref-prefix tokens the drawer derives (dir/rawbin/roomcoll/project) — a Folder must offer add-folder under ALL.
const FOLDER_DISPLAY_TYPES = ['folder', 'collection', 'mof-project', 'puml', 'diagram', 'trace', 'mof-layer', 'dir', 'rawbin', 'roomcoll', 'project'];
const FOLDER_CLASS = 'ior:class:Folder';
const offers = (verb: string, unit: ActionUnit, decls: ActionDecl[]) => applicableActionsFor(unit, {}, decls).offered.some((a) => a.verb === verb);
const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };

// classes the guard governs = every class named by a `classes` decl (today: Folder). Each such action is a "class-owned action".
const classOwnedActions = UNIVERSAL_DECLS.filter((d) => d.appliesTo?.classes && d.appliesTo.classes.length);
if (!classOwnedActions.some((d) => d.verb === 'add-folder' && d.appliesTo!.classes!.includes('Folder'))) fail('add-folder is not class-keyed on Folder in UNIVERSAL_DECLS (Tron ruling regressed).');

// --- SELF-BITE: a class-keyed Folder action MUST still offer when the display type varies; and the detector MUST catch
// a decl that (wrongly) re-introduces display-type keying on a folder-class action. ---
const biteClassKeyed: ActionDecl[] = [{ verb: 'add-folder', label: 'x', appliesTo: { classes: ['Folder'] } }];
if (!offers('add-folder', { type: 'puml', ior: FOLDER_CLASS }, biteClassKeyed)) fail('SELF-BITE: class keying failed to offer a Folder action under a variant display type — the engine is not class-aware.');
const biteTypeKeyed: ActionDecl[] = [{ verb: 'add-folder', label: 'x', appliesTo: { classes: ['Folder'], notTypes: ['puml'] } }];
if (offers('add-folder', { type: 'puml', ior: FOLDER_CLASS }, biteTypeKeyed)) fail('SELF-BITE: a folder-class action with notTypes STILL offered under the excluded type — the notTypes-detection below would be inert.');
if (classOf(FOLDER_CLASS) !== 'Folder') fail('SELF-BITE: classOf is inert.');

// ASSERTION A — a Folder-classed unit offers add-folder under EVERY display type.
const missA = FOLDER_DISPLAY_TYPES.filter((dt) => !offers('add-folder', { type: dt, ior: FOLDER_CLASS }, UNIVERSAL_DECLS));
if (missA.length) fail(`A FAIL — a Folder unit LACKS add-folder under display type(s): ${missA.join(', ')} (class keying is not structural).`);

// ASSERTION B — no folder-class action keys on a display-type types/notTypes (must be class-only).
const badB = classOwnedActions.filter((d) => d.appliesTo?.types || d.appliesTo?.notTypes).map((d) => d.verb);
if (badB.length) fail(`B FAIL — folder-class action(s) also key on a display-type types/notTypes: ${badB.join(', ')} ("sometimes a button" relocated to the type layer).`);

console.log(`✓ T37.21 class-owned-folder-action PASS — add-folder offered on ior:class:Folder under all ${FOLDER_DISPLAY_TYPES.length} display types; 0 folder-class actions key on display type (structural, self-bite live).`);
