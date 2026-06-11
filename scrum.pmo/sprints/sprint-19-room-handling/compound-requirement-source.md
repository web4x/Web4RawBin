# Sprint 19 — Room Handling — TRON LITERAL REQUIREMENTS (compound source)

**Source:** Tron, chat, 2026-06-10. Captured VERBATIM by robbin-po BEFORE decomposition. robbin-req splits into atomic requirements (each requirement:uuid links UP to this source); planner stands up the sprint; architect designs; expert implements; tester verifies. DO NOT paraphrase — the verbatim text is authoritative.

---

## LITERAL SOURCE (verbatim)

> plan a sprint 19 about room handling. in a room you can click on the room name and edit the room config scenario. a room is a scenario like every other req, task, method … scenario. unique uuid and same scenario model and test of the json. rooms can be public, by invite or with private password. private rooms are only listed for owners. by invite rooms send a invite request as a message into the room with the requesters name and uuid. the show not a join button like public rooms but an „Apply" button. the message can be accepted and they join. rooms can be live or persistent. persistent rooms add every one to the members list even if they are offline but show them as offline. but no contact gets ever lost. contacts can be added and temoved from the room member list. live mode is the current default mode. after the sprint persistpis the default mode and it can be switched to live mode in the room editor. the room content area gets a drop content here area double the size of an item view in the tree overview. below there is a tree with two nodes, Members and Files. members will be diplayes as item views below the member node. files get uploaded and are stored in the uuid indes as uuid.content and a uuid.scenario.json with the reference to the content and unitLinks[] references to the ln links eg in the room folder on the filesystem. so every file becomes a unique unit.

---

## Decomposition hints (for req — confirm/correct against literal; NOT authoritative)

### Room as a scenario unit
- **R19.1** A room IS a scenario unit like every other (req/task/method) — unique v4 uuid, same `{ior, model, ownerIor}` shape, AND a test of the json.
- **R19.2** Click the room name → open/edit the room config scenario (room editor).

### Visibility modes
- **R19.3** Room visibility = one of: PUBLIC | BY-INVITE | PRIVATE (password).
- **R19.4** PRIVATE rooms are listed ONLY for owners.
- **R19.5** BY-INVITE rooms: requester sends an invite REQUEST as a message into the room carrying the requester's name + uuid; the room shows an "Apply" button (NOT a join button like public); the request message can be ACCEPTED → requester joins.
- **R19.6** PUBLIC rooms show a join button (current behavior).

### Lifecycle modes
- **R19.7** Room mode = LIVE | PERSISTENT.
- **R19.8** PERSISTENT rooms add everyone to the members list even when offline, shown as offline — no contact is ever lost.
- **R19.9** Members (contacts) can be ADDED and REMOVED from the room member list.
- **R19.10** LIVE is the current default. AFTER this sprint, PERSISTENT becomes the default mode, switchable back to LIVE in the room editor.

### Room UI layout
- **R19.11** Room content area gets a "drop content here" drop area, DOUBLE the size of a tree-overview item view.
- **R19.12** Below it: a tree with two nodes — Members and Files.
- **R19.13** Members displayed as item views below the Members node.

### Files as units
- **R19.14** Files uploaded into a room are stored in the uuid index as `<uuid>.content` PLUS a `<uuid>.scenario.json` referencing the content, with `unitLinks[]` references to the ln links (e.g. in the room folder on the filesystem) — every file becomes a unique scenario unit.

(req: split/refine per the literal source; decompose ALL atoms + signal 'decomposition complete' BEFORE planner creates tasks, per the precedence protocol. The verbatim text is authoritative.)


## Refinements (post-decomposition)

### Component-identity (refines R19.11+12+13)
- **R19.21** (2026-06-10): the in-room Members/Files tree MUST be rendered by the SAME rb-tree component used in /trace, and items by the SAME rb-tree-item component (Lucide icon, speaky name, word-wrap description, drag, tap-to-collapse/expand, > expander). Discovered when T-room-ui v0.5.129 (commit 529d5c42) shipped an inline tree.
  > TRON: "the in room tree should be the same as in the treacability and the items the same as the itmens there!!!"
  - **R19.21 RE-OPENED** (2026-06-10): AC FAILED post-c4ff02a5. Tree and item views are still not the trace browser components. Toggle does not work.
    > TRON: "the view does not toggle. the tree and item views are still not the ones from the tracability browser."
  - **R19.21.A** (2026-06-10): 'Members' and 'Files' are THEMSELVES rb-object-item folder nodes containing child items (expand/collapse folder semantics, same item model as /trace) — NOT bespoke section headers. Fixes black-on-black contrast.
    > TRON: "members and folders black on black and basically they shall be themselves items and be treated like folders containing the other items."
  - **R19.21.B** (2026-06-10): drag preview/ghost shows the FULL item card (icon+name+description), not just the icon square. Applies to rb-object-item everywhere (/trace + in-room).
    > TRON: "the drag preview is just the icon but it should be the full item."

### rb-object-item interaction specs (R19.25-R19.27)
- **R19.25** (2026-06-10): red child-count badge left of the › expander arrow, showing N children.
  > TRON: "add left of the collapse arrow a badge with the amount of children — a red circle/var with the number."
- **R19.26** (2026-06-10): drag only activates when grabbing the icon element, not the whole item row.
  > TRON: "drag is only activated when taking it on the icon."
- **R19.27** (2026-06-10): icon-tap collapses item WIDTH to a perfect square (icon inside), height unchanged.
  > TRON: "clicking the icon once shall collapse the width of the item to a perfect square with the icon inside but keep the height."

### Tree prefetch strategy (R19.28)
- **R19.28** (2026-06-10): ONE-LAYER-AHEAD eager prefetch. Always preload exactly one sublayer beyond visible (badge counts known without expanding). On expand, eagerly prefetch the NEXT sublayer for all shown children — one layer, NON-recursive. Applies to /trace + in-room rb-tree.
  > TRON: "lets focus on the lazy loading. to know the badge and optimize ux experience, we already eager preload exactly one sub layer. and on expand the next sublayer of all shown children… but NOT recursive, just one layer… lazy but eager ahead."

### OO quality: tree owns badge+prefetch (R19.29)
- **R19.29** (2026-06-10): Tree (rb-trace-tree) OWNS badge child-count calculation+assignment AND lazy/eager prefetch as its OWN methods operating ON items. rb-object-item is a dumb view the Tree drives. Fixes badge-0 bug (some nodes show 0 despite visible children — scattered trigger sites miss updates).
  > TRON: "increase the quality by more object orientation. the badges calculation and assignment and lazy eager loading must be more a method and behavior of the tree on the items as of the individual items."

### Room navigation — intention-distinct icons (R19.30 + R19.31, refined 2026-06-11)
- **R19.30** (refined 2026-06-11): ✏️ PEN = EDIT the canonical room scenario unit (/edit/<path>, Monaco editor). Both pen and link resolve to the SAME canonical target; pen opens it EDITABLE.
  > TRON (original): "edit pen runs into an empty file…bug."
  > TRON (intention): "chain link works but there is a difference in the requirement intention between the both." — pen = edit.
- **R19.31** (refined 2026-06-11): 🔗 LINK = VIEW/NAVIGATE the canonical room scenario unit (/md/<path> or /trace?uuid=). Both pen and link resolve to the SAME canonical target; link opens it for VIEWING.
  > TRON (original): "and the room into a 404. bug. either into the room…. or the room editor."
  > TRON (intention): "chain link works but there is a difference in the requirement intention between the both." — link = view/navigate.

### Shared room link offline bug (R19.32)
- **R19.32** (2026-06-10): BUG — shared room link /app?join=<roomUuid> lands on offline page instead of loading the app + join flow. Likely SW routing gap.
  > TRON: "sharing seems broken… sending worked, but the url in a browser was ending on the offline page on that url."
  > (full context) TRON: "the link icon works into the index scenario. edit pen runs into an empty file…bug. and the room into a 404. bug. either into the room…. or the room editor."

### Room model member IORs (R19.35)
- **R19.35** (2026-06-11): Room scenario unit model MUST hold IOR references to its members as members[] (ior:instance:<memberUuid> refs, same pattern as tasks[]/useCases[]). Members become first-class linked units, not just runtime WS data.
  > TRON: "the Room model is lacking member IORs — the model needs to hold IOR references to its members."

### DnD file-upload chain + extensible dispatcher (R19.36 + R19.37)
- **R19.36** (2026-06-11): full DnD file-upload chain is FULLY TRACEABLE: drop event → file extracted → uuid.content stored → FileUnit scenario.json created (R19.14) → ln symlink into room folder (R19.20) → room file-tree updates (R19.12). Every step a traceable scenario operation.
- **R19.37** (2026-06-11): UNKNOWN drop format → log event to room chat ('Dropped [mimeType]: [name] — no handler'). Extensible dispatcher routes by mimeType: known (file) → R19.36 chain; unknown → chat log. Future handlers (vcard, mail, href) plug in via registry without modifying core.
  > TRON: "double check all drag and drop requirements and implement a fully tracable chain for dnd file upload from dropping into a room to the ln link to the file content in the room represented in the rooms file tree. on unknown drag and drop log what happened into the room chat so that we can add over time multiple drop formats like vcards, mails, href links etc."

### Drop-zone UX feedback cycle (R19.42 + R19.43 + R19.44)
- **R19.42** (2026-06-11): clear onDragEnter/onDragExit visual handlers (highlight on enter, clear on exit, no stuck state).
- **R19.43** (2026-06-11): after drop → upload STATUS BAR with progress.
- **R19.44** (2026-06-11): on success/failure → RawBin system chat message ('Uploaded <name>' or 'Upload failed: <name>').
  > TRON: "the in room drop zone ux has to be improved… clear onDropEnter / exit handlers. after drop show an upload statusbar and a upload success or failure with the corresponding system chat messages."

### Messages as scenario units + RawBin system user (R19.38 + R19.39)
- **R19.38** (2026-06-11): chat Messages are first-class scenario units (ior:class:Message) with ownerIor (sender) + model.nextMessage IOR + model.prevMessage IOR (doubly-linked list for thread order).
  > TRON: "make messages first place scenario units with clear ownerIor and a double linked list of ior to next and previous message"
- **R19.39** (2026-06-11): a system 'RawBin' User unit exists as ownerIor for DnD unknown-drop debug/log messages (R19.37). Distinguishes system-generated from user-sent.
  > TRON: "add a RawBin user that owns the debug messages from dnd"
- **R19.40** (2026-06-11): Room holds model.lastMessageIor (entry point). Chat lazy-loads last 5 messages, then 5 more on scroll-to-top (walking prevMessage IORs). Backward-pagination via R19.38 linked list.
  > TRON: "the room obviously needs to have a reference on the last message to lazy load the chat. only load the last 5 messages and continue lazyloading 5, when scrolling hits latest loaded message."

### Server log level (R19.41)
- **R19.41** (2026-06-11): server has a configurable LOG LEVEL (error<warn<info<debug<trace). All logging respects it. Settable at runtime without restart + persisted default via env/config.
  > TRON: "introduce serverside log level to increase and decrease server log details."

### Offline page recovery (R19.45)
- **R19.45** (2026-06-11): offline page adds a RED 'Flush PWA Cache' button next to Retry. Clears all SW caches + unregisters/re-registers SW. Recovers from stale-cache offline state.
  > TRON: "continue to get [offline page] — not in the pwa but in the browser. add next to retry a red flush pwa cache button."

### Room file-restore from scenario, not symlink scan (R19.46)
- **R19.46** (2026-06-11): file-restore driven by Room scenario's model.files[] IOR list (one entry per unique FileUnit), NOT blind symlink scan (duplicates). One upload = one FileUnit + one files[] append. Scenario is source of truth; symlinks are derived.
  > TRON: "now the file is restoring twice. we just need to restore the scenario, as it points to the file."

### File dedup + versioning (R19.47-50, refines R19.46)
- **R19.47** (2026-06-11): identical content (hash match) → reuse existing FileUnit UUID + add another unitLink (no new unit). Content-addressable dedup.
- **R19.48** (2026-06-11): different content, same name → register as a unit VERSION (new content stored, version[] appended, UUID stays).
- **R19.49** (2026-06-11): each FileUnit stores model.contentHash (SHA-256 hex) — dedup key for R19.47, difference key for R19.48.
- **R19.50** (2026-06-11): FileUnit gets model.version[] array of {version: N, ior: <content-ior>}. V1 = initial. Latest = last entry.
  > TRON: "if the user dropped the same file twice and its identical to an existing content file, then register it NOT as a new UUID, but as the existing UUID and as another unitLink. if its a new file with different size but new name register it as a unit version. create a content hash for each file in the file scenario. add a version[] with {version,ior}."
- **R19.51** (2026-06-11): content-hash INDEX dir at scenario/content/ — symlinks named <hash>.file.scenario.json → canonical FileUnit. O(1) dedup lookup on upload. The symlink is ALSO registered in the FileUnit's unitLinks[] (R18.29-31 bidirectional consistency).
  > TRON: "under scenarios/content/ add ln links with the name <contenthash>.file.scenario.json to the original files scenario as a content hash index to query on upload."

### Room dir standardization (R19.53)
- **R19.53** (2026-06-11): ONE canonical room location = data/users/<uuid>/rooms/<roomUuid>/. REMOVE strays: scenario/rooms/ + scenario/sprints.json/rooms/. KEEP: scenario/sprints.md/room/*.md (generated views = correct). Fix code + migrate existing strays (backup-gated).
  > TRON: "rooms directories got a mess on disk. standardize it. ONE place not many. rooms should stay under data/user/rooms."

### User + Device as scenario units (R19.54 + R19.55)
- **R19.54** (2026-06-11): Users become first-class scenario units (ior:class:User) in scenario/index. Migrate from profiles.json. Code reads/writes via scenario units.
- **R19.55** (2026-06-11): Devices become first-class scenario units (ior:class:Device) in scenario/index (ownerIor=User). Migrate from devices.json.
  > TRON: "users and devices still have to be converted to standard first class scenarios."

### Detail drawer + chain display bugs (R19.33 + R19.34)
- **R19.33** (2026-06-11, re-confirmed): detail drawer close affordance (X button) scrolls out of view. MUST stay sticky/fixed on top always (app.css:278/280). Tron re-confirmed via planner 2026-06-11.
  > TRON: "the details nudge to close scrolls out of the view"
  > TRON (re-confirmed via planner): (X) close button must STAY ON TOP ALWAYS / sticky above scrolling body.
- **R19.34** (2026-06-11): 'Traceability Chain' section shows a flat list of many UCs instead of THE singular chain (req→uc→class→method→impl→test). The 'All children' section is acceptable. Cross-refs R18.24 (same spec, regressed).

### Detail drawer full width (R19.52)
- **R19.52** (2026-06-11): detail drawer is FULL WIDTH — remove max-width:480px cap (app.css:271).
  > PO relay (Tron via planner): drawer must be FULL WIDTH.
  > TRON: "the traceability has many use cases instead of the traceability chain to test… the All children section may be right"

### Room editor wiring + pencil affordance (refines R19.2)
- **R19.2.A** (2026-06-10): the room name MUST carry a pencil edit icon (file-browser convention); clicking the pencil OR the name opens the room config/scenario editor. Captures BOTH the implementation-gap and the visual affordance.
  > TRON (gap): "the app has no room config/scenario editor yet clicking on the room name in the room."
  > TRON (addendum): "add a pencil like in the browser to see it opens an editor."

### Per-user room storage as canonical symlinks (R19.22)
- **R19.22** (2026-06-10): every data/users/<userUuid>/rooms/<roomUuid>/room.json MUST be a symlink (ln) to scenario/index/<shard>/<roomUuid>.scenario.json (the canonical Room unit). The UI MUST display a link affordance next to the edit pencil button that opens the canonical scenario unit. Aligns with R18.29-R18.31 (unitLinks lifecycle) and R19.14 / R19.20 (file unitLinks). Backfill required for existing room.json files.
  > TRON: "data/users/<uuuid>/rooms/<ruuid>/room.json is empty but should be a ln link to a uuid.scenario.json of a room in the index with a link next to the edit button. this should be true for ALL rooms."

### Removal scope (R19.23 + R19.24)
- **R19.23** (2026-06-10): REMOVE all room size/capacity limits (maxMembers, maxPlayers, room-size config in model/UI/server validation). Rooms are unbounded.
- **R19.24** (2026-06-10): REMOVE spectator functionality entirely (isSpectator, spectator mode/role, spectator UI, spectator join flow, spectator server logic, spectator message types).
  > TRON: "remove all room sizes and the spectator functionality."

### Leave-event transition: flip not prune (refines R19.8 — Royal Jungle bug)
- **R19.8.A** (2026-06-10): when a member leaves a persistent room, the server MUST flip their status from online to offline — NOT remove them from the member list. Rejoining flips back to online. R19.8 describes the steady-state; R19.8.A makes the transition event explicit.
  > PO directive: persistent rooms must RETAIN members on leave + only toggle online/offline (Royal Jungle bug anchor).
  > Anchored on TRON: "persistent rooms add every one to the members list even if they are offline but show them as offline. but no contact gets ever lost."

### Rejoin deduplication (refines R19.8.A — duplicate member bug)
- **R19.8.B** (2026-06-10): when a member rejoins a persistent room, the server MUST find the existing member by playerToken and flip disconnected→false (online). NEVER add a duplicate entry. Members are keyed by identity (playerToken), unique always.
  > TRON: "the deduplication of users in the members bar does not work. a user leaves and comes back and is then in twice. should never happen."

### Legacy index shard cleanup (R19.56)
- **R19.56** (2026-06-11): cleanup legacy multi-char index dirs (01666/, 08e36/, etc.) — migrate units to canonical single-char-per-level shards + update symlinks + remove empty legacy dirs.
  > TRON: "we need to cleanup the legacy index folder longer than one character."

### Drawer back-button regression (R19.57)
- **R19.57** (2026-06-11): full-width drawer (R19.52) hides back button. Back (←) MUST stay visible+clickable above drawer. z-index or layout fix.
  > TRON: "drawer is now full width but back button hidden underneath."

### DetailView consistency — traceability section consolidation (R19.58)
- **R19.58** (2026-06-11): ALL 7 type DetailViews show ONE consistent 'Traceability' section with the REAL singular chain (req→uc→class→method→impl→test). Label = 'Traceability' (NOT 'Champagne Chain'). Current state: first 2 types show wrong flat-methods list; second 2 show correct content under wrong label. Consolidate all types to same template + correct content + user-understandable label.
  > TRON: "the detail views became very inconsistent. the first 2 still have traceability and all children — good, but the traceability is wrong, its all methods and both are the same. all children is correct, traceability not. in the second 2 we see champagne chain — wtf, how shall a user know what that is — but THAT is the correct traceability. review and consolidate that across all types."

### HeartSpace loss fix — load-before-write + files backfill (R19.59 + R19.60)
- **R19.59** (2026-06-11): Room construction persist must LOAD existing persisted scenario FIRST, merge, THEN write. Never wipe members/files/chat on restart/createRoom.
  > PO diagnosis: construction persist wiped offline-retained members.
- **R19.60** (2026-06-11): pre-existing rooms (before files[] pattern) backfill files[] from on-disk FileUnit symlinks so old rooms restore files on join.
  > PO diagnosis: old rooms had FileUnits on disk but empty files[] array.

### View template consistency — .md + .html with chain-link + edit (R19.61)
- **R19.61** (2026-06-11): EVERY scenario type generates BOTH .md and .html view templates, each carrying chain-link (🔗) + edit (✏️) affordances. Room .html currently has NEITHER. Consistent across all types.
  > TRON: "here we see missing chain links to the scenario and the templates for room md and html have to be created. check that on all types."

### Device↔User association pattern (R19.55.A, refines R19.55)
- **R19.55.A** (2026-06-11): Device↔User mirrors Room↔User — User.devices[] forward IOR, Device.ownerIor, data/users/<uuid>/devices/ symlinks, unitLinks lifecycle (R18.29-31).
  > TRON: "devices are like rooms associated to users."

### URL drop + file preview + generic previewer (R19.62-65)
- **R19.62** (2026-06-11): dropping a URL/link into room creates a url-type scenario unit (model.href, contentType='url'). Extends R19.37 dispatcher with 'url' handler.
- **R19.63** (2026-06-11): clicking a file unit in room tree opens preview in the detail drawer.
- **R19.64** (2026-06-11): preview renders by type — href in iframe, image as img, SVG in existing viewer.
- **R19.65** (2026-06-11): generalize SVG viewer into generic ContentPreviewer (svg/image/href/html, extensible).
  > TRON: "dropped a link into room — did not work. should create something like a windows url that opens as html, best case viewed in its OWN iframe loading the href = a preview in the detail drawer when the file is clicked. same for images. maybe repurpose the existing svg viewer to make it generic — preview images AND href links too."

### Room Scenario button type-dispatch (R19.66)
- **R19.66** (2026-06-11): Room Scenario button → /scenario?ior=<roomUuid> renders 'Task not found' (route assumes Task). Must type-dispatch to Room detail view with action to open scenario editor.
  > TRON: "the in-room scenario button goes here [/scenario route] — that's not useful. at least there must be a detail view for it that then can open the scenario editor."

### Room scenario detail rendering (R19.67, refines R19.66)
- **R19.67** (2026-06-11): Room scenario detail shows type 'Room' (not 'unknown'), speaky room name, and clickable [Scenario.json] link — not bare repeated uuid. Witness: f672d29b.
  > TRON: "the in-room link to scenario jumps to scenario view with a uuid in the details view but it should be clickable. shows unknown + bare uuid. make it nicer: Room <room-name> + [Scenario.json](…uuid) clickable."

### Security: file-access authorization + iframe sandbox (R19.68 + R19.69)
- **R19.68** (2026-06-11): file access is ROOM-SCOPED — only room members may read/download files. Server validates membership before serving content. 403 for non-members.
  > Expert code-review: file access endpoints serve content without checking room membership.
- **R19.69** (2026-06-11): iframe previews of untrusted uploads use sandbox attribute (allow-same-origin, block scripts/forms/navigation). Prevents XSS from uploaded HTML.
  > Expert code-review: iframe preview loads untrusted HTML/URLs without sandbox.

### Scenario link + room children (R19.70 + R19.71)
- **R19.70** (2026-06-11, refined): Scenario link → file browser (/md/) highlighting <uuid>.scenario.json (user clicks pen to edit). NOT self-reference, NOT direct Monaco. ONE DRY shared implementation across ALL detail views.
  > TRON: "the scenario link is a SELF reference but should reference the scenario MONACO EDITOR"
  > TRON (refined): "to be consistent we should link to the browser and highlight the file so that we can then click the pen."
  > TRON (DRY): "this is how it is done on all other cases — should be consistent and in ONE DRY PLACE."
- **R19.71** (2026-06-11): room scenario detail lists files[] as children (currently shows 'no children' despite having files). Room FORWARD_KEYS includes 'files'.
  > Witness: room 440ccc82 has files but detail shows 'no children'.

### Identity reset / re-enrollment (R19.72)
- **R19.72** (2026-06-11): secret-code page gets a RED 'Remove current ID data' button — wipes local identity (keypair/token/device/localStorage) for fresh re-enrollment. Includes DANGER warning text explaining irreversible consequences + confirm step.
  > TRON: "on the page where you have to add the secret code, add a button in red — Remove current ID data — so that if a user has not remembered its generated secret they can start fully over."
  > TRON (extend): "add a danger text explaining the consequences."

### In-room preview PRIORITY + HTML render (R19.73 + R19.74)
- **R19.73** (2026-06-11, PRIORITY): in-room file-click opens ContentPreviewer (DRY reuse from /trace). Image→img, html/href→sandboxed iframe. Currently works in /trace but NOT in room.
  > TRON (PRIORITY): "prioritize making the image and html/href preview work IN THE ROOM."
- **R19.74** (2026-06-11): text/html file preview RENDERS in sandboxed iframe (displayed HTML page), NOT as raw <pre> source. Refines R19.64.
  > TRON: html preview must RENDER, not show source.

### Preview auth token passthrough (R19.75)
- **R19.75** (2026-06-11): ContentPreviewer must pass auth token in content URL so room members can preview. Currently iframe gets 'Forbidden: token required' because R19.68 auth gate rejects unauthenticated content requests. Interaction bug R19.68 × R19.64/74.
  > TRON (screenshot): in-room HTML preview iframe shows 'Forbidden: token required'.

### Security debt: preview nonce (R19.76, NOT blocking MVP)
- **R19.76** (2026-06-11): HARDEN R19.75 — replace playerToken-in-URL with short-lived (60s) preview NONCE. Eliminates token leakage via access logs + browser history. Single-use or time-limited, scoped to file+room.
  > Architect security review: playerToken-in-URL exposes credential in logs+history.

### URL preview action buttons (R19.77)
- **R19.77** (2026-06-11): URL file preview shows two buttons: (a) 'Open in preview' (inline sandboxed iframe), (b) 'Open in new tab' (window.open target=_blank). User chooses inline vs full-page.
  > TRON: "that worked well, but add in this case in the preview two buttons to open the url in preview or as a new tab."

### Preview/drawer UX polish (R19.78-81)
- **R19.78** (2026-06-11): action buttons ABOVE the filename (layout: nudge → buttons → name → content).
  > TRON: "add the action buttons above the name."
- **R19.79** (2026-06-11): drawer NUDGE/drag handle visible above action buttons — user knows drawer is resizable.
  > TRON: "above the action buttons the drawer nudge is missing…otherwise the user does not know he can drag the size."
- **R19.80** (2026-06-11): drawer resizable up to 95% viewport height (currently capped lower). R19.57 back button gets the remaining 5%.
  > TRON: "make it possible to size it to 95%."
- **R19.81** (2026-06-11): pinch-zoom works in preview iframe (pan works, pinch broken). Touch-action CSS or gesture handler needed.
  > TRON: "pan is working well in the iframe but pinch not at all."
