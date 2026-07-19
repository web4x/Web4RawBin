# Design: Add/Manage Git Repositories via the Repo Selector (Tron feature)

**Author:** robbin-architect@WODA.prod robbinTeam2:0.3 · 2026-07-19 · scenario-first (no hotfix)
**Grounded on:** repo-registry.ts (static ROOTS), GitApi (server.ts:499, read-only, execFile array-args), /api/git/* + /api/files endpoints, auth (same-origin|adminKey|playerToken), PAIRING_PATH persist precedent.

---

## 0. Core tension (read first)
R30.6.7's invariant: **client sends a repo KEY only, NEVER a path; unknown key → null → 400.** This feature deliberately inverts that — the client now asks the server to (a) READ an arbitrary local path, (b) CLONE an arbitrary URL, (c) possibly WRITE/checkout. Every design choice below is shaped by re-containing that blast radius behind allowlists + admin auth. The security section (§6) carries the genuine decisions for Tron.

---

## 1. UI flow (§a)
- **Selector sentinel:** prepend `<option value="__add__">➕ Add repository…</option>` as the FIRST `.de-repo` option. On `change===__add__`: open the Repo Manager dialog AND revert the select to its prior value (never leave it parked on the sentinel).
- **Dialog = new component `rb-repo-manager`** (own file per R27.5 "new class = own file"; reuses the existing `overlay()` shell pattern). Three sections:
  - **Local path:** input (server-local path, e.g. `/root/oosh`, may be symlink) + label + [Validate & Add] → `POST /api/git/repos {method:'local',path,label}`.
  - **Clone URL:** input (clone URL) + **checkout-location picker** (allowlisted parent dir key + sanitized subdir name) + label + [Clone & Add] → `POST /api/git/repos {method:'clone',url,parentKey,dirName,label}`. Async (clone is slow) → status/progress line.
  - **Manage:** ALWAYS shows the currently-selected repo — key, label, resolved local path, current branch, and `git worktree list` (path+branch+HEAD per worktree). Controls: switch active repo; switch branch/worktree for the current repo (see §e + DECISION-3).
- On add success → refresh selector options, select the new repo, seed both sides (reuse the R30.39 seed path).

## 2. Backend: RepoRegistry static → dynamic + persisted (§b)
- **Builtins stay hardcoded + non-removable:** `rawbin`, `oosh` (immutable, always win on key collision).
- **Dynamic layer:** `dynamic: Record<key,{root,label,addedBy,addedAt}>` loaded at boot from `data/repos.json` (mirror PAIRING_PATH writeFileSync pattern). Merged UNDER builtins.
- **New methods on RepoRegistry:** `register({root,label})→key` (slug from label, uniqueness-checked, never collides a builtin), `unregister(key)` (dynamic only), `persist()`, `load()` (validate-on-load: drop entries whose root fails the allowlist or is-git-repo re-check).
- `resolve()`/`list()` merge builtins+dynamic; `list()` marks builtin vs removable.
- **Keys:** server-derived slug; the client NEVER supplies the key (prevents collision/override of builtins).

## 3. New endpoints
- `POST /api/git/repos` — body `{method:'local'|'clone', ...}` → add. Returns `{key,label}` or error. **admin-auth (DECISION-4).**
- `DELETE /api/git/repos/:key` — unregister (dynamic only; 403 on builtin). admin-auth.
- `GET /api/git/repo-info?repo=<key>` — `{key,label,path,currentBranch,worktrees:[{path,branch,head,bare}]}` (manage panel).
- `POST /api/git/checkout` — `{repo,target}` switch branch/worktree (WRITE; DECISION-3-gated; admin-auth).

## 4. New GitApi ops (all execFile array-args, opts(root), GIT_ALLOW_PROTOCOL pinned)
- `isGitRepo(root)` → `git rev-parse --is-inside-work-tree` (method-1 validation).
- `worktrees(root)` → `git worktree list --porcelain` → parsed array.
- `clone(url,dest)` → `git clone <url> <dest>` (url scheme/host-guarded; env `GIT_ALLOW_PROTOCOL=https:ssh`; timeout; dest must be empty/new).
- `checkout(root,target)` → `git checkout <target>` (guardRef; WRITE; DECISION-3).

## 5. Method designs
- **§c method-1 (local validate+register):** client path → `assertAllowedRoot(realpath)` (§6.1) → `isGitRepo` → `register` → `persist`. Symlink allowed (Tron wants HOME/oosh) but the realpath TARGET must also fall under an allowed base.
- **§d method-2 (clone→location→register):** `assertAllowedUrl(url)` (scheme/host §6.2) → dest = `allowedParent(parentKey)/slug(dirName)` (must not exist) → `GitApi.clone` (async job id + status poll) → `register(dest)` → `persist`.
- **§e manage panel:** `repo-info` enumerates path/branch/worktrees. Switch active repo = client-side (select + reseed, no server write). Switch worktree = **register each worktree path as its own repo key** (non-mutating, recommended) VS `git checkout`/`oo` mode-switch (global mutation, DECISION-3). Ties to R30.40: HOME/oosh is a symlink `oo` repoints; show its worktrees (dev/macos/mcdonges.latest/prod), let the user TARGET one without a global checkout.

## 6. SECURITY (§f) — bounds + FLAGGED DECISIONS for Tron
**6.1 Path-traversal / arbitrary read (method-1):** a registered path is then READABLE via `/api/files?repo=<key>`. Bound: **allowlist of permitted base roots**; realpath the target, confirm under an allowed base (defeats symlink escape); require is-git-repo; safePath still guards within root post-register.
  → **DECISION-1:** what are the allowed base roots? Proposal: `os.homedir()` subtree + an explicit `REPO_ALLOW` server-config list; must cover HOME/oosh AND its worktree targets.
**6.2 SSRF / arbitrary clone (method-2):** `git clone` can hit internal services / `file://` / `ext::sh -c`. Bound: **scheme allowlist https+ssh only** (env `GIT_ALLOW_PROTOCOL=https:ssh`, reject file/git/ext), clone only into an allowlisted CLONE_ROOT, timeout+maxBuffer.
  → **DECISION-2:** host allowlist (only github.com + the team git host?) or any https? Which clone-parent dirs are permitted?
**6.3 Arbitrary write / checkout (manage + save):** a registered writable repo means `/api/files PUT` can now write there; `git checkout` mutates HEAD (high blast radius — for oosh, the whole HOME). Bound: writes stay overwrite-only + safePath-guarded; prefer worktree-as-key over checkout.
  → **DECISION-3:** allow server-side `git checkout` at all, or restrict to read-only ref-pick + worktree-as-distinct-key (recommended — no global working-tree mutation)?
**6.4 Authz:** registry-mutating + clone + checkout are far more powerful than the read endpoints (which accept same-origin/playerToken). 
  → **DECISION-4:** require **admin key** (adminKey===ADMIN_KEY) for ALL add/delete/clone/checkout ops? (Strongly recommend YES.)
**6.5 Persistence integrity:** `data/repos.json` is attacker-interesting. Only the server writes it (via guarded endpoints); validate on load (drop entries failing allowlist/is-git-repo); builtins non-overridable.

## 7. Decomposition (scenario-first — req mints Req+UCs, planner mints Tasks)
New Requirement "Add/Manage git repositories via the repo selector". 8 UCs (one UC per task per locked chain), each → Class.Method → Impl → Test:
- **UC1 repoSelector.addOption** — sentinel + open dialog. Class RbDiffEditor · Method openRepoManager.
- **UC2 repoManager.dialogShell** — 3-section dialog. Class **RbRepoManager (NEW file)** · Methods render/showTab.
- **UC3 repoRegistry.dynamicPersist** — static→dynamic+persisted. Class RepoRegistry · Methods register/unregister/persist/load. **(spine)**
- **UC4 repo.addLocal** — validate is-git-repo under allowlist + register. Class GitApi.isGitRepo + endpoint · Method repoAddLocal.
- **UC5 repo.addClone** — guarded clone→register (async). Class GitApi.clone + endpoint · Method repoAddClone.
- **UC6 repo.manageInfo** — path+branch+worktrees. Class GitApi.worktrees + endpoint · Method repoInfo.
- **UC7 repo.switchTarget** — switch repo/worktree (DECISION-3-gated). Method repoSwitch.
- **UC8 security.bounds** — allowlist + scheme guard + admin-auth CHOKE POINTS (cross-cutting, its own unit for traceability). Class RepoRegistry.assertAllowedRoot + GitApi.assertAllowedUrl · Method repoSecurityGuard.

**Dependency DAG (build order):** UC3 (spine) → UC8 (security gates) → UC4 → UC6 → UC2 → UC1 → UC5 → UC7.

## 8. Effort / risk
Meaty: 1 new component (RbRepoManager), RepoRegistry gains persisted mutable state, 4 new GitApi ops, 4 new endpoints, a JSON persistence file. Security is the dominant risk — the 4 flagged decisions must be answered by Tron BEFORE UC4/5/7 implement. UC3+UC8 can start once decisions land. Zero overlap with the r3041 gate or R30.39/40 in-flight work (additive surface).

---

## 9. FINALIZED — Tron ratified D1-D4 (2026-07-19, all = safe option)

### D3 STRUCTURAL DROP
NO server-side `git checkout`. **REMOVE** `GitApi.checkout` op + `POST /api/git/checkout` endpoint from §3/§4. UC7 becomes: client-only active-repo switch + read-only ref-pick (reuse existing ⎇) + worktree-as-distinct-key register. No HEAD/working-tree mutation anywhere.

### UC8 = the three SOLE choke points + config (correct-by-construction: UC4/5/7 MUST route through these; NO inline path/url/auth checks elsewhere)

**Config consts (server):**
- `REPO_ALLOW` (base roots) = `[ os.homedir(), path.dirname(fs.realpathSync(path.join(os.homedir(),'oosh'))), ...REPO_ALLOW_ENV ]` — the 2nd term is the oosh worktrees' shared parent → auto-covers ALL oo-mode sibling worktrees (dev/macos/mcdonges.latest/prod) correct-by-construction (R30.40 spirit). Extra roots via REPO_ALLOW_ENV.
- `HOST_ALLOW` = `{ 'github.com', <TEAM_GIT_HOST> }` (team-host literal = known deployment value, expert fills; not an arch blocker).
- `SCHEME_ALLOW` = `{ 'https', 'ssh' }`.
- `CLONE_ROOT` = `{ <parentKey>: <allowlisted abs dir> }`, seeded e.g. `repos: path.join(os.homedir(),'repos')` (mkdir-if-missing); extra via config.

**Guard 1 — `RepoRegistry.assertAllowedRoot(input): string | null`** (UC4, UC7-worktree)
```
const real = fs.realpathSync(input);                       // follow symlinks to TRUE target
const bases = REPO_ALLOW.map(b => fs.realpathSync(b));
const ok = bases.some(b => real === b || real.startsWith(b + path.sep));
return ok ? input : null;   // STORE the ORIGINAL input (may be symlink → dynamic oo-follow like oosh); CHECK used realpath
```
TOCTOU note: a dynamic symlink entry could be repointed post-register → RE-ASSERT allowlist at resolve() for dynamic entries (cheap realpath check) + drop-on-load. Builtins exempt.

**Guard 2 — `GitApi.assertAllowedUrl(url): boolean`** (UC5) — CORRECTED v0.7.67 (ratified 2026-07-19; the original `username||password` broke ALL ssh clones since `ssh://git@github.com` has username='git')
```
const u = new URL(url);                                    // WHATWG parser MANDATORY (legacy url.parse is @-confusion-prone)
if (u.password) return false;                              // never allow a password in the URL
if (u.username && u.username !== 'git') return false;      // ssh uses git@; EMPTY (anonymous https) OK; any OTHER user rejected
if (!SCHEME_ALLOW.has(u.protocol.replace(':','')) ) return false;  // https|ssh ONLY → rejects http/file/git/ext
return HOST_ALLOW.has(u.hostname);                          // PRIMARY @-confusion/SSRF defense: host = substring after the LAST @, so github.com@evil.com → host=evil.com → rejected
```
+ clone execFile runs with env `GIT_ALLOW_PROTOCOL=https:ssh` (defense-in-depth vs submodule/redirect escape) + `-c protocol.file.allow=never`.
Rationale: exact-host is load-bearing (any @-confusion lands a non-allowlisted host → rejected); `username==='git'` is a safe secondary (any confusion also makes username≠'git'); empty username MUST stay allowed (anonymous https) — only reject non-empty non-'git'.

**Guard 3 — `requireAdmin(req): boolean`** (UC4, UC5, UC7-worktree-register, DELETE)
```
return (adminKeyFrom(req) === ADMIN_KEY);   // NOT same-origin, NOT playerToken
```
Applies to ALL write ops: add-local, add-clone, delete-repo, worktree-as-key register. Read ops (repos list, repo-info, git read, ref-pick) keep the existing same-origin/playerToken.

### Precise bounds handed to expert per UC
- **UC4 addLocal:** `requireAdmin` → `assertAllowedRoot(path)` (null→400) → `GitApi.isGitRepo(realpath)` (false→400) → `RepoRegistry.register({root: ORIGINAL path, label})` → `persist`. Distinct 400 messages per failure.
- **UC5 addClone:** `requireAdmin` → `assertAllowedUrl(url)` (false→400) → `dest = CLONE_ROOT[parentKey] + '/' + slug(dirName)` (slug `/^[\w.-]+$/`, reject `..`/abs; dest must NOT exist) → `GitApi.clone(url,dest)` (env GIT_ALLOW_PROTOCOL, timeout, maxBuffer; async job id + status poll) → `register({root: dest, label})` → `persist`.
- **UC6 manageInfo:** read-auth. `GET /api/git/repo-info?repo=<key>` → `{key,label,path: resolve(key), currentBranch, worktrees: GitApi.worktrees(root)}`.
- **UC7 switchTarget:** active-repo switch = CLIENT select + reseed (no server). Branch = read-only ref-pick (existing ⎇, no write). Worktree switch = `requireAdmin` + `assertAllowedRoot(worktreePath)` + `register` (worktree-as-key) — reuses UC3+UC8, NO checkout.

### Endpoint/op set (final, post-D3)
Endpoints: `POST /api/git/repos` (local|clone, admin) · `DELETE /api/git/repos/:key` (admin, dynamic-only) · `GET /api/git/repo-info` (read). GitApi ops: `isGitRepo`, `worktrees`, `clone` (NO checkout).

### Build order (UC7 now lighter)
UC3 → UC8 → UC4 → UC6 → UC2 → UC1 → UC5 → UC7.

---

## 10. V1 SCOPE SIMPLIFICATION (Tron 2026-07-19) — SUPERSEDES §6/§9 security-active for V1
Tron: **simple first, security → BACKLOG.** The UC8 guards (assertAllowedRoot/D1, requireAdmin/D4, assertAllowedUrl/D2) are BUILT + gated GREEN (v0.7.67) but go **DORMANT** in V1 — **DO NOT rip out**; they are the backlog security infrastructure and make re-activation a wiring change, not a rebuild.

### V1 ACTIVE
- **UC4-simple (add-local):** the ONLY condition = the chosen server-local directory contains a `.git` entry (FILE or FOLDER — folder = checkout, file = worktree). `GitApi.isGitRepo(dir)` = `.git` present (fs stat, either kind). On pass → `RepoRegistry.register({root: ORIGINAL path, label})` → persist. **NO assertAllowedRoot, NO requireAdmin.**
- **UC6 manageInfo:** repo-info (path + currentBranch + worktrees) — read.
- **UC2 dialog / UC1 sentinel:** rb-repo-manager with the Local-path section (Clone section hidden/disabled for V1) + Manage section; ➕ "Add repository" sentinel.
- **UC7 switch:** client active-repo switch + read-only ref-pick + worktree-as-key register (no checkout, no admin in V1).
- **UC3 spine:** already built + marked v0.7.67 (dynamic + persisted registry).

### V1 DORMANT / BACKLOG (built, NOT wired)
- **assertAllowedRoot (D1 REPO_ALLOW)** → deferred. V1 accepts ANY `.git` dir path → path-traversal read/write is UNGUARDED in V1.
- **requireAdmin (D4)** → deferred. V1 register uses existing read-auth (same-origin/playerToken), NOT admin.
- **assertAllowedUrl (D2) + UC5 addClone + GitApi.clone** → ENTIRE clone path BACKLOG. V1 has no clone.
- Guards stay in the codebase DORMANT as the backlog security layer.

### V1 BUILD ORDER
UC4-simple → UC6 → UC2 → UC1 → UC7. (UC3 done; UC8 dormant; UC5 backlog.)

### DEFERRED-RISK NOTE (tracked — do not lose)
V1 = **trusted-local convenience**: any same-origin/token client can register any server-local `.git` dir, then read/save files within it. Acceptable ONLY for the trusted single-user/local deployment. Before ANY multi-user/exposed deployment, the backlog MUST re-activate assertAllowedRoot + requireAdmin (+ assertAllowedUrl if clone ships). The dormant guards are the correct-by-construction re-entry point.

## 10.1 V1 SPINE REVISION — make 'dormant' REAL (resolves the expert's assertAllowedRoot-active contradiction)
**Problem (expert, correct):** the shipped UC3/UC8 spine (v0.7.67) EMBEDS `assertAllowedRoot` INSIDE `register()` (throws), `load()` (drops non-allowlisted), `resolve()` (TOCTOU re-assert). So the allowlist is ACTIVE — a V1 add-local of a `.git` dir OUTSIDE HOME/REPO_ALLOW would be REJECTED, contradicting Tron's "ONLY condition = `.git` present (ANY git dir)".
**Root cause:** `assertAllowedRoot` is POLICY but was coupled into the registry MECHANISM. Its sibling `requireAdmin` is already an ENDPOINT guard — `assertAllowedRoot` belongs at the SAME boundary. Embedding it in the primitive was the over-coupling.
**Resolution (chosen — endpoint-layer, NOT a feature-flag): registry primitive = pure mechanism; policy lives at the add-endpoint (backlog).**

EXACT V1 spine behavior (hand to req as the revised UC3/R30.47 units):
- **`isGitRepo(dir)` [add-time, at the UC4 add-local endpoint + UC7 worktree-register]:** `.git` present (fs stat, FILE or FOLDER). This is the SOLE V1 add-validation.
- **`register({root, label})`:** PURE store — slug key (from label; unique; never collides a builtin) → `dynamic[key] = {root: ORIGINAL path, label, addedAt}` → `persist()`. **REMOVE the `assertAllowedRoot` throw.** (Callers — add-local endpoint + worktree-register — run `isGitRepo` first.)
- **`load()`:** read `data/repos.json` → keep each entry IFF `.git` still present at its root (stale-drop by EXISTENCE, mechanism) → merge under builtins. **REMOVE the `assertAllowedRoot` allowlist-drop.**
- **`resolve(key)`:** pure lookup (builtins + dynamic) → root | null. **REMOVE the TOCTOU `assertAllowedRoot` re-assert.**
- **`assertAllowedRoot`:** function STAYS in the codebase (dormant, gated GREEN). Its 3 spine call-sites are REMOVED. BACKLOG re-wire target = the ADD endpoint, symmetric with `requireAdmin`: `requireAdmin(req)` + `assertAllowedRoot(path)` BEFORE `register()` — wired when the security feature is picked up. Mechanism (registry) / policy (endpoint) stays cleanly separated; re-activation = add two endpoint guard calls, no primitive rewrite.

This is a spine REVISION to shipped v0.7.67 (UC3/R30.47): expert removes the 3 embedded `assertAllowedRoot` calls, adds the `.git`-present existence check to `load()`, keeps `isGitRepo` at the add-local endpoint. `assertAllowedRoot` + `requireAdmin` remain built + dormant as the backlog endpoint-guard layer. (Feature-flag alt considered + rejected: it leaves policy entangled in the primitive + a flag to manage; endpoint-layer is the correct-by-construction separation.)
