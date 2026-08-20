#!/usr/bin/env node
// [impl:uuid:78beddd9-61f4-4604-bb1b-846fd98bbe60] PageNav.stickyTop
// [impl:uuid:88de8ad9-1332-492a-9e3e-7e0308af5aa3] MdPreview.renderList
// [impl:uuid:417dfd9c-bf02-4da5-b7be-0e76d686370b] UserScenario.scenarioUnit
// [impl:uuid:b3020e1b-6736-4037-8b9f-47dfb0d27cee] MdListing.chainIcon
// [impl:uuid:2c3612cc-193f-4082-a3f1-c882641b5495] MdPreview.renderList
// [impl:uuid:07c16d73-27c9-4185-89de-ca81cc9ba01f] server.sprintsDedupe
// [impl:uuid:a232ce97-c336-45fa-9e0f-68e2507729dc] ContentPreviewer.render
// [impl:uuid:cc549bbd-84e3-432b-a188-7c81cc6c8856] server.sprintZeroPad
// [impl:uuid:eef80308-52d5-4ecf-93fe-c678ac04b412] server.sprintNameFormat

// [impl:uuid:e94199c4-5c74-458e-92ad-2e75f8bc2926] T4 server core
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { exec, execFile, execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { scenarioFwd, traceFwd, expectedChildTypes, forwardKeysForMode } from '../shared/chain-model.js';
import readline from 'node:readline';
import { WebSocketServer, WebSocket } from 'ws';
import fetch from 'node-fetch';
import { marked } from 'marked';
import { Room, RoomManager, type RoomMember } from './Room.js';
import { ServerManagerGuard } from './ServerManagerGuard.js';
import { isRevoked, EXPECTED_REVOKED_COUNT, REVOKED_ARMED, REVOKED_LIST_PATH, revokedArmedHealth, loadRevokedListStatus } from './revoked-tokens.js';
import { OtmuxBridge } from './OtmuxBridge.js';
import { sprintPrefix, sprintDisplayName } from '../scenario/sprint-label.js'; // R40.4(-phase2) single-source sprint atoms
import { generateProjectModel } from './generate-project.js'; // T36.3 shared generate-project core (HTTP handler + local CLI)
import { PtyBridge } from './PtyBridge.js';
import { TsToModel } from '../scenario/TsToModel.js';
import { pumlToModel } from '../shared/puml-serializer.js'; // S33-P3f-1: REUSE the R32.7 PUML parser (INV-F-1, no new parser)

// [impl:uuid:449d830a-d488-407c-8cc7-81a6bce649f2] server.modelFacetType (Method 2d98903b, Class c0a0921d, off UC dbbf2bdb)
// R32.3 MDA model tree: a model node's DISPLAY type = its M2 MODEL-facet metaclass (the Uml* instanceOf), so
// rb-object-item renders the model-kind icon (rb-trace-tree lowercases it → TRACE_ICONS['umlclass'] etc.).
// Data-shaping only (NO tree mechanics). Falls back to 'ModelElement' when no Uml* facet resolves.
function modelFacetType(model: Record<string, unknown> | undefined, idx: { get(u: string): { model?: Record<string, unknown> } | null }): string {
  const io = Array.isArray(model?.instanceOf) ? (model!.instanceOf as string[]) : [];
  for (const r of io) {
    const n = String(idx.get(String(r).replace('ior:instance:', ''))?.model?.name || '');
    if (n.startsWith('Uml')) return n;
  }
  return 'ModelElement';
}

// R32.5 GO-LIVE: the MDA model lives in an ISOLATED store, NEVER prod scenario/index (don't-force-prod-mutation law).
// generate writes ONLY here; model reads reroute here; trace reads stay prod; store is resettable (rm data/model-store).
// MODEL_STORE / PROD_INDEX moved BELOW the __dirname shim (R32.5 boot-crash fix): referencing __dirname at module-top = TDZ ReferenceError (shim is a const at :105).
// Seed the store's M2/M3 metaclasses once (copy from prod's a1d2e… shard) so instanceOf/modelFacetType + ModelValidator resolve self-contained.
function ensureStoreSeeded(): void {
  const src = path.join(PROD_INDEX, 'a', '1', 'd', '2', 'e'), dst = path.join(MODEL_STORE, 'a', '1', 'd', '2', 'e');
  fsSync.mkdirSync(dst, { recursive: true });
  if (fsSync.existsSync(src)) for (const f of fsSync.readdirSync(src)) { const d = path.join(dst, f); if (!fsSync.existsSync(d)) fsSync.copyFileSync(path.join(src, f), d); }
}
// [impl:uuid:010f3e23-7d0e-49d4-9308-679388d00989] server.isModelUnit (Method 20eee8b0, Class c0a0921d, off UC 91b1b643)
// A model unit (ModelElement/Diagram) present in the store → its reads reroute to the store (trace units stay prod). Reads the shard directly (no index scan).
function isModelUnit(uuid: string): boolean {
  try {
    const p = path.join(MODEL_STORE, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
    if (!fsSync.existsSync(p)) return false;
    const ior = JSON.parse(fsSync.readFileSync(p, 'utf-8')).ior;
    return ior === 'ior:class:ModelElement' || ior === 'ior:class:Diagram';
  } catch { return false; }
}
import { FeatureManager, loadProtectedIdentities } from './FeatureManager.js';
import { ProfileView, type ServerProfileRecord } from './ProfileView.js';
import { MSG } from '../shared/MessageTypes.js';
import { detailScalarFields } from '../shared/detail-fields.js';
import { createUserHome, getUserHomeDir, generateUserKeypair, writeUserProfile, enrollDevice, verifyChallenge } from './UserKeys.js';
import { initStorageMap, REKEY_APPLIED, homeKeyFor } from './storage-id.js';
import { createRoomHome, generateRoomKeypair, writeRoomJson, scanAllRooms, scanUserRooms, getRoomDir } from './RoomKeys.js';
import { encryptFile, decryptFile, fileExists, rekeyUser } from './UserCrypto.js';
import { scanRepo, validate as validateTrace } from './TraceConsistency.js';
import { TraceGraph, makeObject, FORWARD_KEYS, type ObjectType, type FlatObject } from '../shared/TraceModel.js';
import { ScenarioIndex, IORResolver, defaultTemplateRegistry, createFileUnit, createMessageUnit, PhoneIndex, normalizePhone, EmailIndex, AddressIndex, CompanyIndex, createWebItemUnit, extractUrl } from '../scenario/index.js';
import { APPROVE_STATUSES, deriveStatusEnum } from '../scenario/task-status.js'; // R40.37 anti-drift: server 409-gate + client affordance share this ONE set; deriveStatusEnum = T37.26 derived-current pin-role
import { FolderService } from './FolderService.js'; // R40.37 AC5: mint+persist Folder unit atomically + return it (supersedes createFolder 28000b00, additive)
import { resolveSprintPin, sprintNumOf, bySprintDisplayOrder } from '../scenario/sprint-pin-resolver.js'; // R40.17: the ONE current-sprint resolver + canonical sprint-number reader; R40.50: the ONE canonical sprint DISPLAY order (server-side; CurrentSprint.slotsFrom stays fs-free)
import { deriveViewKind } from '../shared/facet-type.js'; // R32.11-B2 / BUG D: the ONE ior-class→facet-type derivation (shared w/ client renderFacet)
import { keyToUuid } from '../scenario/TsToModel.js'; // R-A A2 (R32.2): deterministic uuid for lazy-minted Folder/File units
import { Transfer } from './federation-transfer.js'; // T26.6: federation import wiring
import { ProxyFetch } from './proxy-fetch.js'; // R27.7 UC27.7b: SSRF-guarded CORS/X-Frame fallback proxy
import { parseFederatedIor, isLocalOrigin } from '../scenario/federated-ior.js';
import { CurrentSprint } from '../scenario/CurrentSprint.js'; // PIN-KEEP: recompute-on-read for the /trace CurrentSprint node
import { UnitController } from '../scenario/unit-controller.js'; // R37.11 slice-1: THE mutation seam — every unit persist routes via apply/create (persist+emit inseparable)
import '../scenario/task-policy.js'; // ★ R40.45 ROOT: side-effect import → registerPolicy(TASK_IOR, TaskPolicy). WITHOUT this NOTHING imports task-policy → the Task FSM is UNREGISTERED → UnitController.apply falls to DEFAULT-MERGE (blindly merges approvedBy, NO evidence-gate, NO Done advance, orphan approvedBy) = the approve-never-worked-~10-iterations root, masked by the ownerTok8 crash.
import { readDir, readFile, writeFile } from './FileApi.js';
import { RepoRegistry } from './repo-registry.js'; // R30.6.7 repo key→root allowlist

const execAsync = promisify(exec);
const ADMIN_KEY = process.env.ADMIN_KEY || crypto.randomUUID();
const PKG_VERSION = JSON.parse(fsSync.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../package.json'), 'utf-8')).version;

// R31.7 SINGLE-SOURCE VERSION: read the BUILD-STAMPED version from build-manifest.json (generated from the ONE typed
// ior:class:Config unit at build time), NOT a per-request package.json read. Served == what was actually BUILT +
// deployed BY CONSTRUCTION, so a stray package.json edit can no longer make /api/config lie (the phantom-7.99 root:
// the per-request package.json read was exactly what let a hand-edit desync served-vs-built). A version change now
// requires a rebuild — which it did anyway, to re-stamp sw.js; a bump without a rebuild WAS the desync we kill here.
// Manifest is still per-request (picks up a rebuild without a server restart) but its value is build-stamped, not editable.
// R31.7 INV-V4: BOOT-STAMP the version — read the build-stamped manifest version ONCE at module load, FROZEN for the
// process lifetime. So /api/config reflects the version the RUNNING PROCESS booted with; a rebuild-WITHOUT-restart
// leaves it UNCHANGED (honest — no version-lie), and only a REAL restart re-reads. Ends the verify-by-pid workaround:
// /api/config becomes a VALID deploy signal. (Was per-request → showed the LATEST-BUILT version even if the process
// wasn't restarted = the lie we fought all session.) BOOT_VERSION runs after PKG_VERSION (:49) — no TDZ.
const BOOT_VERSION: string = (() => {
  try {
    const mf = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../src/public/dist/build-manifest.json');
    return JSON.parse(fsSync.readFileSync(mf, 'utf-8')).version || PKG_VERSION;
  } catch { return PKG_VERSION; }
})();
function getVersion(): string { return BOOT_VERSION; } // R31.7 INV-V4: frozen at boot (NOT per-request) → /api/config == booted version

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// R32.5 GO-LIVE: isolated MDA store (NEVER prod scenario/index). Defined HERE — after the __dirname shim — because
// referencing __dirname at module-top (was :48) is a const-TDZ ReferenceError that crashed boot. (emergency fix)
const MODEL_STORE = path.join(__dirname, '../../../data/model-store/index');
const PROD_INDEX = path.join(__dirname, '../../../scenario/index');

// Load .env
const ENV_PATH = path.join(__dirname, '../../../.env');
const envVars: Record<string, string> = {};
if (fsSync.existsSync(ENV_PATH)) {
  fsSync.readFileSync(ENV_PATH, 'utf-8').split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });
}

import os from 'node:os';
function getLocalIP(): string {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    if (!ifaces) continue;
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

// T100: process.env overrides .env so an isolated test server can bind a DIFFERENT port
// (with DATA_DIR=tmp + reuseExistingServer:false) alongside the live server — no shared-port
// reuse race, no downtime. INVARIANT: unset → .env value → exact prod port (4444/4000).
const PORT = parseInt(process.env.PORT || envVars['PORT'] || '4000');
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || envVars['HTTPS_PORT'] || '4444');
const LOG_LEVEL = envVars['LOG_LEVEL'] || 'info';
const MAX_ROOMS = parseInt(envVars['MAX_ROOMS'] || '100');
const IS_PRODUCTION = envVars['NODE_ENV'] === 'production' || process.env.NODE_ENV === 'production';
const BASE_DOMAIN = envVars['BASE_DOMAIN'] || '';
const PUBLIC_DIR = path.join(__dirname, '../../public');
const SELF_SIGNED_DIR = path.join(__dirname, '.certs');
const LE_DOMAIN = envVars['LE_DOMAIN'] || 'home.donges.it';
const LE_CERT = `/etc/letsencrypt/live/${LE_DOMAIN}/fullchain.pem`;
const LE_KEY = `/etc/letsencrypt/live/${LE_DOMAIN}/privkey.pem`;
const hasLeCert = fsSync.existsSync(LE_CERT) && fsSync.existsSync(LE_KEY);
const CERT_DIR = hasLeCert ? path.dirname(LE_CERT) : SELF_SIGNED_DIR;
const CERT_FILE = hasLeCert ? LE_CERT : path.join(SELF_SIGNED_DIR, 'cert.pem');
const KEY_FILE = hasLeCert ? LE_KEY : path.join(SELF_SIGNED_DIR, 'key.pem');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
} as const;

interface ClientSession {
  id: string; ip: string; userAgent: string; connectedAt: Date;
  requestCount: number; lastRequest: Date;
}

interface WebSocketClient {
  ws: WebSocket; id: string; ip: string; userAgent: string;
  connectedAt: number; avatarUrl: string; deviceId: string; playerToken: string;
  authenticated: boolean;
  authMethod: 'none' | 'token' | 'device-key';
  challenge: string;
}

const clientSessions = new Map<string, ClientSession>();
const wsClients = new Set<WebSocketClient>();
// R37.11 slice-1 STEP-0: the ONE server-side publish for UnitController — generalizes the ad-hoc CurrentSprint
// UNIT_CHANGED broadcast (was inline at the pin-designate handler) over the EXISTING wsClients transport (all-clients,
// broadcast-safe — architect endorsed). Passed as {publish} into every routed apply/create so persist+emit are inseparable.
const publishUnitChanged: (ior: string, uuid: string) => void = (ior, uuid) => {
  wsClients.forEach((c) => { if (c.ws.readyState === 1) c.ws.send(JSON.stringify({ type: 'unit-changed', ior, uuid })); });
  // R40.18 LIVE-on-advance (architect rule: an emit must reach every ref whose DERIVED value changed, not just the mutated
  // ref): a Task change (advance/status/name) can change the DERIVED pin (current = max-lastAdvancedAt In-Progress task) —
  // whose row subscribes to the CurrentSprint SINGLETON, not the task ref. So ALSO emit the singleton → the pin re-derives
  // live with NO reload. server.ts owns this derived-consumer knowledge; the generic UnitController stays transport/derivation-agnostic.
  if (ior === 'ior:class:Task') {
    const CSU = 'current-sprint-singleton-0000-000000000001';
    wsClients.forEach((c) => { if (c.ws.readyState === 1) c.ws.send(JSON.stringify({ type: 'unit-changed', ior: 'ior:class:CurrentSprint', uuid: CSU })); });
  }
};
const tokenToClient = new Map<string, string>();
let totalRequests = 0;

// --- User Profiles ---

interface UserProfile {
  token: string;
  name: string;
  phone: string;
  url: string;
  avatar: string;
  avatarCrop: { scale: number; x: number; y: number } | null;
  secretCode: string;
  profileCommitted: boolean;
  sshKeysGenerated: boolean;
  sshKeyGeneratedAt: string;
  consolidatedFrom: string[];
  redirectTo?: string;
  bugReports: { date: string; text: string; status: string }[];
  features?: string[]; // R31.8: Feature-uuid refs the user is granted — mirror of Feature.allowedUsers[] (FeatureManager grant/revoke writes both sides)
}

interface DeviceRecord {
  deviceId: string;
  ownerToken: string;
  userAgent: string;
  ip: string;
  screenSize: string;
  platform: string;
  firstSeen: string;
  lastSeen: string;
  connectionCount: number;
  enrolled: boolean;
  devicePublicKey: string;
  enrolledAt: string;
}

// T100: data base is configurable via DATA_DIR env so E2E can run against an isolated tmp
// dir. INVARIANT: unset → EXACTLY the current prod path (path.join(__dirname,'../../../data'))
// — zero behavior change for prod. All data paths below derive from this single base.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');
const PROFILES_PATH = path.join(DATA_DIR, 'profiles.json');
const DEVICES_PATH = path.join(DATA_DIR, 'devices.json');
// R40.22 step-3: FROZEN list of the 116 auth-invalidated dormant dev/test Device tokens. Loaded ONCE at
// boot (fail-open if absent); the running server never re-derives it (can't silently widen). Reversible —
// the list is data. Generated by scripts/gen-revoked-tokens.ts; guarded by scripts/check-revoked-tokens.ts.
// R40.22 path-unify: the revoked list is loaded from the SINGLE-SOURCE REVOKED_LIST_PATH (imported from
// revoked-tokens.ts, resolved to the repo-root tracked hash list) — server + CI gate share ONE path so the
// data/-vs-repo-root divergence that caused fail-open cannot recur.
let revokedHealthError: string | null = null; // (b) LOUD-ABSENCE: set at boot when ARMED but the list is absent/unreadable/short → /api/health 503.
const userProfiles = new Map<string, UserProfile>();
const deviceRecords: DeviceRecord[] = [];
let revokedTokens: Set<string> = new Set();

function loadProfiles(): void {
  try {
    if (fsSync.existsSync(PROFILES_PATH)) {
      const data = JSON.parse(fsSync.readFileSync(PROFILES_PATH, 'utf-8'));
      for (const p of data) {
        const profile: UserProfile = {
          token: p.token, name: p.name || '', phone: p.phone || '', url: p.url || '',
          avatar: p.avatar || '', avatarCrop: p.avatarCrop || null, secretCode: p.secretCode || generateSecretCode(),
          profileCommitted: p.profileCommitted || false,
          sshKeysGenerated: p.sshKeysGenerated || false,
          sshKeyGeneratedAt: p.sshKeyGeneratedAt || '',
          consolidatedFrom: p.consolidatedFrom || [],
          redirectTo: p.redirectTo, bugReports: p.bugReports || [],
        };
        userProfiles.set(profile.token, profile);
      }
    }
  } catch {}
  try {
    if (fsSync.existsSync(DEVICES_PATH)) {
      const data = JSON.parse(fsSync.readFileSync(DEVICES_PATH, 'utf-8'));
      deviceRecords.push(...data);
    }
  } catch {}
}

function saveProfiles(): void {
  try {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
    fsSync.writeFileSync(PROFILES_PATH, JSON.stringify([...userProfiles.values()], null, 2));
  } catch {}
}

// Ensure an ior:class:Profile scenario unit exists for this token, then register
// alt/phone/<+digits> → that profile unit. Wrapped: phone-index failure never breaks profile save.
function indexProfilePhone(token: string, name: string, phone: string): void {
  try {
    const scenarioDir = path.join(__dirname, '../../../scenario/index');
    const idx = new ScenarioIndex(scenarioDir);
    let unit = idx.get(token);
    if (!unit) {
      unit = { ior: 'ior:class:Profile', model: { uuid: token, name, phones: [], emails: [], addresses: [], companies: [], unitLinks: [] }, ownerIor: null };
      UnitController.create(idx, 'ior:class:Profile', token, unit, { publish: publishUnitChanged }); // R37.11: new Profile via the seam (create primitive; emit → appears live)
    }
    new PhoneIndex(idx).mintAndLink(token, phone, crypto.randomUUID(), publishUnitChanged); // R21.6: Phone unit + Profile.phones[] + symlink. R37.11 slice-1: seam publish (profile updates live)
  } catch (e: any) { addLog(`phone index error: ${e?.message || e}`); }
}

// Mint ior:class:Email unit(s) + link into Profile.emails[] + alt/email symlink.
// Ensures a Profile scenario unit exists (mirrors indexProfilePhone). Self-healing.
function indexProfileEmail(token: string, name: string, emails: string[]): void {
  try {
    const scenarioDir = path.join(__dirname, '../../../scenario/index');
    const idx = new ScenarioIndex(scenarioDir);
    let unit = idx.get(token);
    if (!unit) {
      unit = { ior: 'ior:class:Profile', model: { uuid: token, name, phones: [], emails: [], addresses: [], companies: [], unitLinks: [] }, ownerIor: null };
      UnitController.create(idx, 'ior:class:Profile', token, unit, { publish: publishUnitChanged }); // R37.11: new Profile via the seam (create primitive; emit → appears live)
    }
    const ei = new EmailIndex(idx);
    for (const e of emails) { if (e) ei.mintAndLink(token, e, crypto.randomUUID(), publishUnitChanged); }
  } catch (e: any) { addLog(`email index error: ${e?.message || e}`); }
}

// Background, off the request path, rate-limited <=1 req/s, cached by oneLine (AC-c2/c3/c5).
const addrVerifyQueue: Array<{ uuid: string; oneLine: string }> = [];
const addrVerifyCache = new Map<string, { lat: string; lon: string } | null>();
let addrVerifyPumping = false;

function enqueueAddressVerify(uuid: string, oneLine: string): void {
  addrVerifyQueue.push({ uuid, oneLine });
  if (!addrVerifyPumping) { addrVerifyPumping = true; setTimeout(pumpAddressVerify, 0); }
}

function pumpAddressVerify(): void {
  const job = addrVerifyQueue.shift();
  if (!job) { addrVerifyPumping = false; return; }
  const finish = () => setTimeout(pumpAddressVerify, 1100); // <=1 req/s
  const cached = addrVerifyCache.get(job.oneLine);
  if (cached !== undefined) {
    if (cached) { try { const sd = path.join(__dirname, '../../../scenario/index'); new AddressIndex(new ScenarioIndex(sd)).applyVerification(job.uuid, cached.lat, cached.lon); } catch {} }
    return finish();
  }
  try {
    const q = encodeURIComponent(job.oneLine);
    const opts = { hostname: 'nominatim.openstreetmap.org', path: `/search?q=${q}&format=json&limit=1`, headers: { 'User-Agent': 'Web4RawBin/0.6 (contact-address-verify; https://prod.wo-da.de)' } };
    https.get(opts, (r) => {
      let body = '';
      r.on('data', (c) => body += c);
      r.on('end', () => {
        try {
          const arr = JSON.parse(body);
          if (Array.isArray(arr) && arr[0] && arr[0].lat && arr[0].lon) {
            const hit = { lat: String(arr[0].lat), lon: String(arr[0].lon) };
            addrVerifyCache.set(job.oneLine, hit);
            const sd = path.join(__dirname, '../../../scenario/index');
            new AddressIndex(new ScenarioIndex(sd)).applyVerification(job.uuid, hit.lat, hit.lon);
            addLog(`Address verified: ${job.uuid.slice(0,8)} (${job.oneLine.slice(0,30)})`);
          } else {
            addrVerifyCache.set(job.oneLine, null); // miss → stays unverified (AC-c5)
          }
        } catch { addrVerifyCache.set(job.oneLine, null); }
        finish();
      });
    }).on('error', (e) => { addLog(`Address verify net err: ${e.message}`); finish(); });
  } catch (e: any) { addLog(`Address verify err: ${e?.message || e}`); finish(); }
}

// Mint Address unit(s) + Profile.addresses[] (sync) then enqueue async OSM verify. Self-healing.
function indexProfileAddress(token: string, name: string, addresses: string[]): void {
  try {
    const scenarioDir = path.join(__dirname, '../../../scenario/index');
    const idx = new ScenarioIndex(scenarioDir);
    let unit = idx.get(token);
    if (!unit) {
      unit = { ior: 'ior:class:Profile', model: { uuid: token, name, phones: [], emails: [], addresses: [], companies: [], unitLinks: [] }, ownerIor: null };
      UnitController.create(idx, 'ior:class:Profile', token, unit, { publish: publishUnitChanged }); // R37.11: new Profile via the seam (create primitive; emit → appears live)
    }
    const ai = new AddressIndex(idx);
    for (const line of addresses) {
      if (!line) continue;
      const u = crypto.randomUUID();
      const addrUuid = ai.mintAddress(token, line, u, publishUnitChanged); // synchronous, no network (AC-c1). R37.11 slice-1: seam publish (profile updates live)
      if (addrUuid) enqueueAddressVerify(addrUuid, String(line).trim().replace(/\s+/g, ' '));
    }
  } catch (e: any) { addLog(`address index error: ${e?.message || e}`); }
}

// Mint-or-reuse SHARED Company unit (dedup by domain then nameKey) + link into Profile.companies[].
function indexProfileCompany(token: string, name: string, companies: Array<string | { name: string; domain?: string }>): void {
  try {
    const scenarioDir = path.join(__dirname, '../../../scenario/index');
    const idx = new ScenarioIndex(scenarioDir);
    let unit = idx.get(token);
    if (!unit) {
      unit = { ior: 'ior:class:Profile', model: { uuid: token, name, phones: [], emails: [], addresses: [], companies: [], unitLinks: [] }, ownerIor: null };
      UnitController.create(idx, 'ior:class:Profile', token, unit, { publish: publishUnitChanged }); // R37.11: new Profile via the seam (create primitive; emit → appears live)
    }
    const ci = new CompanyIndex(idx);
    for (const c of companies) {
      const cname = typeof c === 'string' ? c : c?.name;
      const dom = typeof c === 'string' ? undefined : c?.domain;
      if (!cname) continue;
      const cuuid = ci.mintOrReuseShared(cname, crypto.randomUUID(), dom); // reuses existing → no dup
      if (cuuid) ci.linkToProfile(token, cuuid, publishUnitChanged); // R37.11 slice-1: seam publish (profile.companies updates live)
    }
  } catch (e: any) { addLog(`company index error: ${e?.message || e}`); }
}

// [impl:uuid:ff91e891-57b8-4d82-b3d5-fa45219b9db1] R21.4 identity.deviceLinkOnKnownKey
// Resolve a phone OR email to an existing profile uuid via the alt-UUID index.
// Identical mechanism for both keys (AC5). Returns null on miss/invalid.
// [impl:uuid:cc6df739-135f-46a9-a53b-e8441571abbc] R21.4 server.resolveKeyToProfile
function resolveKeyToProfile(phone?: string, email?: string): string | null {
  try {
    const scenarioDir = path.join(__dirname, '../../../scenario/index');
    const idx = new ScenarioIndex(scenarioDir);
    if (phone) {
      const hit = new PhoneIndex(idx).resolveToProfile(phone);
      if (hit) return hit;
    }
    if (email) {
      const hit = new EmailIndex(idx).resolveToProfile(email);
      if (hit) return hit;
    }
  } catch (e: any) { addLog(`resolveKeyToProfile error: ${e?.message || e}`); }
  return null;
}

// v0.6.98 (R25.5): fetch a page <title> for an http(s) WebItem name (async, 3s timeout, ≤3 redirects,
// 200KB cap). Resolves '' on any failure → caller falls back to deriveName (hostname). Never throws.
function fetchPageTitle(url: string, depth = 0): Promise<string> {
  return new Promise((resolve) => {
    if (depth > 3 || !/^https?:/i.test(url)) return resolve('');
    let settled = false; const ok = (s: string) => { if (!settled) { settled = true; resolve(s); } };
    try {
      const lib = url.startsWith('https:') ? https : http;
      const req = lib.get(url, { headers: { 'User-Agent': 'Web4RawBin/0.6 (+https://prod.wo-da.de)', 'Accept': 'text/html' }, timeout: 3000 } as any, (r) => {
        const sc = r.statusCode || 0;
        if (sc >= 300 && sc < 400 && r.headers.location) { r.resume(); try { fetchPageTitle(new URL(r.headers.location, url).href, depth + 1).then(ok); } catch { ok(''); } return; }
        if (sc !== 200) { r.resume(); return ok(''); }
        let body = ''; let len = 0;
        r.on('data', (c: Buffer) => { len += c.length; body += c.toString('utf8'); if (len > 200000 || /<\/title>/i.test(body)) r.destroy(); });
        const done = () => { const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(body); ok(m ? m[1].replace(/\s+/g, ' ').trim().slice(0, 120) : ''); };
        r.on('end', done); r.on('close', done);
      });
      req.on('timeout', () => { req.destroy(); ok(''); });
      req.on('error', () => ok(''));
    } catch { ok(''); }
  });
}

// ── T26.3: server-to-server federation fetch API (capability-grant auth) ──────────────────────────────
// A capability grant = base64url({uuid,exp}).HMAC-SHA256(secret): short-lived, scoped to one uuid's subtree,
// minted by the origin at drag-start, embedded in fetchUrl?grant=, held only by the drag recipient.
const FED_GRANT_SECRET = crypto.randomBytes(32).toString('hex'); // per-process; grants are minutes-lived so restart-loss is fine
const FED_TRUST_LIST: string[] = []; // standing federation: canonical origins whose keypair-signed requests are trusted (empty = capability-only)
function mintFederationGrant(uuid: string, ttlMs = 5 * 60_000): string {
  const payload = Buffer.from(JSON.stringify({ uuid, exp: Date.now() + ttlMs })).toString('base64url');
  const sig = crypto.createHmac('sha256', FED_GRANT_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}
function verifyFederationGrant(grant: string, uuid: string): boolean {
  try {
    const [payload, sig] = String(grant || '').split('.');
    if (!payload || !sig) return false;
    const expect = crypto.createHmac('sha256', FED_GRANT_SECRET).update(payload).digest('base64url');
    const a = Buffer.from(sig), b = Buffer.from(expect);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    const { uuid: u, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return u === uuid && typeof exp === 'number' && Date.now() < exp; // scope: this uuid + its /content + /children
  } catch { return false; }
}
// Standing federation (AC auth-standing): a caller server signs with its per-server keypair; origin verifies
// signature + explicit trust list. Stub: honour the trust list header until server keypairs are wired.
function verifyTrustedServer(req: http.IncomingMessage): boolean {
  const origin = String(req.headers['x-rawbin-origin'] || '');
  return !!origin && FED_TRUST_LIST.includes(origin); // (signature verification lands with per-server keypairs)
}
// Rate-limit federated fetches per remote IP (abuse guard + audit).
const fedRate = new Map<string, number[]>();
function fedRateOk(ip: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now(); const hits = (fedRate.get(ip) || []).filter(t => now - t < windowMs);
  hits.push(now); fedRate.set(ip, hits); return hits.length <= limit;
}

// [impl:uuid:3089d066-07bf-4e79-9b8b-ea4c2fcca50a] R26.3 FederationApi.fetchScenario — GET /api/scenario/<uuid>{,/content,/children}
async function fetchScenario(uuid: string, sub: string, req: http.IncomingMessage, res: http.ServerResponse, urlParams: URLSearchParams): Promise<void> {
  const ip = req.socket.remoteAddress || 'unknown';
  if (!fedRateOk(ip)) { res.writeHead(429); res.end('federation: rate limited'); return; }
  // auth: a valid capability grant for this uuid, OR a trusted signing server (standing federation)
  if (!verifyFederationGrant(urlParams.get('grant') || '', uuid) && !verifyTrustedServer(req)) {
    res.writeHead(403); res.end('federation: no valid grant/signature'); return;
  }
  addLog(`[federation] fetch ${uuid.slice(0, 8)}/${sub || 'unit'} ← ${ip}`); // audit every federated fetch
  const idx = new ScenarioIndex(path.join(__dirname, '../../../scenario/index'));
  const unit = idx.get(uuid);
  if (!unit) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); return; }
  const m = unit.model as any;
  if (sub === 'content') {
    // content-addressable: skip the byte transfer if the receiver already stores this hash
    if (m.contentHash && urlParams.get('have') === m.contentHash) { res.writeHead(304); res.end(); return; }
    const { readFileUnitContent } = await import('../scenario/file-unit.js');
    const bytes = readFileUnitContent(idx, uuid);
    if (!bytes) { res.writeHead(404); res.end('no content'); return; }
    res.writeHead(200, { 'Content-Type': m.mimeType || 'application/octet-stream', 'Content-Length': String(bytes.byteLength), 'X-Content-Hash': m.contentHash || '' });
    res.end(bytes); return;
  }
  if (sub === 'children') {
    // forward children (mirrors /api/trace/children forward-only) — each stamped with this origin for lazy federated resolve
    const originHost = `https://${String(req.headers.host || '').replace(/^https?:\/\//, '')}`;
    const refs = Array.isArray(m.children) ? m.children : [];
    const children = refs.map((r: string) => { const cu = String(r).replace('ior:instance:', ''); const c = idx.get(cu); return { ior: `ior:instance:${cu}@${originHost}`, uuid: cu, type: (c?.ior || '').replace('ior:class:', ''), name: String((c?.model as any)?.name || '') }; });
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ uuid, children })); return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ unit, contentHash: m.contentHash })); // the unit JSON
}

// T26.6: server-to-server GET → JSON (federation import fetches the origin's /api/scenario). Self-signed OK.
function fedGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const lib = url.startsWith('https:') ? https : http;
      const opts: any = url.startsWith('https:') ? { rejectUnauthorized: false } : {};
      const rq = lib.get(url, opts, (r) => {
        if ((r.statusCode || 0) !== 200) { r.resume(); return reject(new Error(`origin ${r.statusCode}`)); }
        let body = ''; r.on('data', (c) => body += c); r.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
      });
      rq.on('error', reject); rq.setTimeout(5000, () => { rq.destroy(); reject(new Error('timeout')); });
    } catch (e) { reject(e); }
  });
}

// T26.6: import a federated unit — (1)/(2) fetch from the origin (server-to-server), (3) resolve children
// lazily (T26.4), (4) reconcile uuid conflicts (T26.5), (5) store locally with originHost provenance (T26.1).
// [impl:uuid:3132c189-4027-49d5-ab1b-7da4a2e4bd87] R26.6 FederationApi.federationImport (/api/federation/import)
async function federationImport(ref: any, roomId: string): Promise<{ uuid: string; action: string } | { error: string }> {
  const idx = new ScenarioIndex(path.join(__dirname, '../../../scenario/index'));
  const originHost = String(ref?.originHost || '');
  const uuid = parseFederatedIor(String(ref?.ior || '')).uuid;
  if (!uuid) return { error: 'bad ref' };
  let unit: any = ref?.inline || null; // inline optimization for tiny units
  if (!unit) {
    if (isLocalOrigin(originHost || null) || !ref?.fetchUrl) { unit = idx.get(uuid) || null; }       // self-origin → local
    else { try { const d = await fedGet(String(ref.fetchUrl)); unit = d?.unit || d; } catch (e: any) { return { error: `origin fetch failed: ${e?.message || e}` }; } }
  }
  if (!unit || !unit.ior) return { error: 'unit not resolved' };
  const contentDir = path.join(__dirname, '../../../scenario/content');
  const t = new Transfer({ index: idx, hasContentHash: (h) => { try { return fsSync.existsSync(path.join(contentDir, `${h}.file.scenario.json`)); } catch { return false; } } });
  const remap = new Map<string, string>();
  const rc = t.reconcileConflict(unit, originHost, remap);                 // T26.5
  if (rc.action !== 'noop') { // T26.5 remap + T26.1 provenance — route through the seam so an imported/updated unit appears LIVE in the room
    const routed = t.rewriteForwardRefs(rc.unit, originHost, remap) as ScenarioUnit;
    const rIor = String(routed.ior || rc.unit.ior);
    // mint/remint = a NEW localUuid → create; update (same-uuid newer federated version) = apply the incoming model onto the existing unit.
    if (idx.get(rc.localUuid)) UnitController.apply(idx, rIor, rc.localUuid, routed.model as Record<string, unknown>, { publish: publishUnitChanged });
    else UnitController.create(idx, rIor, rc.localUuid, routed, { publish: publishUnitChanged });
  }
  t.resolveChildrenLazily(rc.unit, originHost);                            // T26.4 — children/members stay lazy federated refs, never minted
  const room = roomManager.getRoom(roomId);
  if (room) room.addFileUnit(rc.localUuid);                               // link into the receiving room
  addLog(`[federation] import ${uuid.slice(0, 8)}@${originHost} → ${rc.localUuid.slice(0, 8)} (${rc.action}) room ${roomId.slice(0, 8)}`);
  return { uuid: rc.localUuid, action: rc.action };
}

function maskName(name: string): string {
  if (!name) return 'an existing user';
  const parts = name.trim().split(/\s+/);
  return parts.map(p => p.length <= 1 ? p : p[0] + '*'.repeat(Math.min(p.length - 1, 4))).join(' ');
}

function saveDevices(): void {
  try {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
    fsSync.writeFileSync(DEVICES_PATH, JSON.stringify(deviceRecords, null, 2));
  } catch {}
}

loadProfiles();
// R40.22 storage-rekey: init the token→storageId resolver map from the ROOT-ONLY runtime config (env
// RAWBIN_STORAGE_MAP, default /root/.rawbin/token-storage-map.json — the SAME path the migration writes).
// INERT while REKEY_APPLIED=false (homeKeyFor returns the raw token regardless of the map = zero behavior
// change); the map only takes effect when REKEY_APPLIED flips atomically in the migration window.
initStorageMap(process.env.RAWBIN_STORAGE_MAP || '/root/.rawbin/token-storage-map.json');
console.log(`[boot] storage-rekey: REKEY_APPLIED=${REKEY_APPLIED}`);
// R40.22 step-3: load the frozen revoked-token list (fail-open if absent → nobody revoked). LOUD boot log
// so an operator sees whether the kill is armed and at the expected count.
// R40.22 path-unify (a)(b)(f): load from the SINGLE-SOURCE path, presence-aware. FAIL-LOUD when ARMED but the
// list is ABSENT/UNREADABLE (the silent-divergence bug) — DISTINCT from a legitimately-empty list; fail-open
// for an unlisted token stays a DELIBERATE, OBSERVABLE choice (armed=false in /api/health, never a silent gap).
// console.* (not addLog — serverLogs' TDZ is later).
{
  const _rev = loadRevokedListStatus(REVOKED_LIST_PATH);
  revokedTokens = _rev.tokens;
  if (REVOKED_ARMED && !_rev.present) {
    revokedHealthError = `revoked-tokens ARMED but list ABSENT/UNREADABLE at ${REVOKED_LIST_PATH} — revocation NOT enforced (fail-open). Silent-divergence bug, now LOUD.`;
    console.error(`[boot][UNHEALTHY] ${revokedHealthError}`);
  } else {
    revokedHealthError = revokedArmedHealth(revokedTokens.size); // armed && loaded!=116 → error; not-armed or exact → null
    if (revokedHealthError) console.error(`[boot][UNHEALTHY] ${revokedHealthError}`);
    else console.log(`[boot] revoked-tokens: loaded ${revokedTokens.size} (armed=${REVOKED_ARMED}, listPresent=${_rev.present}, expected ${EXPECTED_REVOKED_COUNT} when armed; unlisted token = deliberate fail-open)`);
  }
}
// Inject the redirect resolver so rooms collapse consolidated (redirectTo) members to the PRIMARY profile.
Room.resolveToken = (token: string) => userProfiles.get(token)?.redirectTo || token;
// v0.7.1 (R25.7): let room-load dedup detect orphan members (token whose profile was deleted) and self-heal.
Room.profileExists = (token: string) => userProfiles.has(token);

// [impl:uuid:6b459f04-e326-4f8a-b375-ddb33f2d4ffb] R25.7 redirectTombstoneToPrimary — resolve a connecting (possibly tombstoned)
// token to its PRIMARY. IDENTIFY uses this to redirect a consolidated token → primary (TOKEN_REDIRECT),
// never re-minting/clearing the immutable redirectTo.
function redirectTombstoneToPrimary(token: string): string { return userProfiles.get(token)?.redirectTo || token; }

function generateSecretCode(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}

// Bug report forwarding
const execFileAsync = promisify(execFile);

// R30.42 UC8 config + guards (design §9) — SOLE choke points (UC4/5/7 route through these; NO inline url/auth checks elsewhere).
const SCHEME_ALLOW = new Set(['https', 'ssh']);            // D2: https|ssh ONLY (rejects http/file/git/ext)
// D2: EXACT-host allowlist. github.com covers both team orgs (web4x + Cerulean-Circle-GmbH); extra hosts via GIT_HOST_ALLOW env (comma-list).
const HOST_ALLOW = new Set(['github.com', ...(process.env.GIT_HOST_ALLOW ? process.env.GIT_HOST_ALLOW.split(',').map(s => s.trim()).filter(Boolean) : [])]);
const CLONE_ROOT: Record<string, string> = { repos: path.join(os.homedir(), 'repos') }; // D2: allowlisted clone-parent dirs (UC5); extra via config

// R30.42 UC8 GUARD 3 (D4) — SOLE write-auth choke point: registry-mutating/clone ops require the ADMIN KEY (NOT same-origin,
// NOT playerToken). Used by POST/DELETE /api/git/repos + worktree-register (UC4/5/7). Read ops keep same-origin/playerToken.
// [impl:uuid:54a1a5c7-5c21-4430-b943-e6cc43303123] requireAdmin — R30.42 UC8 GUARD 3 / D4 admin-auth (Method defe4e43)
function requireAdmin(req: http.IncomingMessage): boolean {
  return ((req.headers['x-admin-key'] as string) || '') === ADMIN_KEY;
}

// R30.6 — GitApi: read-only git endpoints for the diff/merge editor. SECURITY: execFile with ARRAY args only
// (never exec/shell → no injection), ref validated against an allowlist, path resolved within the per-request repo
// ROOT (R30.6.7: RepoRegistry.resolve, no `..`), read-only verbs (branch/log/show) only, timeout + maxBuffer.
// R27.5 axis-3: server.ts is the allowlisted monolith; GitApi is a distinct logical class here.
class GitApi {
  private static readonly REF_RE = /^[\w./-]+$/;
  private static opts(root: string) { return { cwd: root, timeout: 15000, maxBuffer: 8 * 1024 * 1024 }; }

  // R30.42 UC8 GUARD 2 (design §9, D2) — SOLE clone-URL choke point (UC5). WHATWG parse; reject embedded creds (@-host
  // confusion), non-https/ssh schemes (file/git/ext → SSRF/RCE), and any host not EXACTLY allowlisted (no subdomain trick).
  // The clone execFile additionally pins env GIT_ALLOW_PROTOCOL=https:ssh + -c protocol.file.allow=never (defense-in-depth).
  // [impl:uuid:4fb69bb5-fc16-46ea-b3ae-a81318ca7b66] GitApi.assertAllowedUrl — R30.42 UC8 GUARD 2 / D2 clone-URL allowlist (Method 43c22878)
  static assertAllowedUrl(url: string): boolean {
    try {
      const u = new URL(url);
      // §9 CORRECTION (flagged to architect): §9's `u.username||u.password` rejects the STANDARD ssh user (ssh://git@github.com
      // → username='git') → would break ALL ssh clones. Real risks: embedded PASSWORD (secret leak) + @-host confusion.
      // → reject any password, and allow only the conventional 'git' username; EXACT-host check below is the primary @-confusion defense.
      if (u.password) return false;
      if (u.username && u.username !== 'git') return false;
      if (!SCHEME_ALLOW.has(u.protocol.replace(':', ''))) return false;
      return HOST_ALLOW.has(u.hostname);
    } catch { return false; }
  }

  // [impl:uuid:3d1b156d-abf9-4182-935c-12290910b1c2] GitApi.isGitRepo — R30.43 UC4 V1 SOLE add-local check (Method 153c01f0):
  // the dir contains a .git ENTRY — FOLDER (normal checkout) OR FILE (git worktree's gitdir pointer). fs stat, no shell,
  // no allowlist (V1 §10 = trusted-local convenience; assertAllowedRoot stays DORMANT for the backlog).
  static isGitRepo(dir: string): boolean {
    try { fsSync.statSync(path.join(dir, '.git')); return true; } catch { return false; }
  }

  // R30.45 UC6 manageInfo — `git worktree list --porcelain` → [{path,branch,head,bare}]. Read-only, execFile array-args.
  // Surfaces oo-mode sibling worktrees (HOME/oosh symlink target's siblings) for the manage panel.
  // [impl:uuid:dceff494-d684-486e-8204-b5c6f3ceb04f] GitApi.worktrees — R30.45 UC6 manageInfo (Method 07760462; repo-info handler = endpoint glue)
  static async worktrees(root: string): Promise<{ path: string; branch: string; head: string; bare: boolean }[]> {
    try {
      const { stdout } = await execFileAsync('git', ['worktree', 'list', '--porcelain'], GitApi.opts(root));
      const out: { path: string; branch: string; head: string; bare: boolean }[] = [];
      let cur: { path: string; branch: string; head: string; bare: boolean } | null = null;
      for (const line of stdout.split('\n')) {
        if (line.startsWith('worktree ')) { cur = { path: line.slice(9), branch: '', head: '', bare: false }; out.push(cur); }
        else if (cur && line.startsWith('HEAD ')) cur.head = line.slice(5, 12);
        else if (cur && line.startsWith('branch ')) cur.branch = line.slice(7).replace('refs/heads/', '');
        else if (cur && line === 'bare') cur.bare = true;
      }
      return out;
    } catch { return []; }
  }

  // path must be relative, within the resolved repo root, no traversal — returns the safe rel path or null.
  private static safeRelPath(root: string, p: string): string | null {
    if (!p || p.includes('..') || p.startsWith('/')) return null;
    const base = path.resolve(root);
    const abs = path.resolve(base, p);
    return (abs === base || abs.startsWith(base + path.sep)) ? p : null;
  }

  // [impl:uuid:4e52b300-aa7d-46dd-ad1c-f932d624c011] GitApi.guardRef — R30.7 uniform ref-allowlist CHOKE POINT: every
  // git endpoint routes its ref through here; a ref outside ^[\w./-]+$ throws → 400 before any git call (defense-in-depth
  // over execFile array-args). Empty/malformed rejected. Callers with an OPTIONAL ref call this only when a ref is present.
  static guardRef(ref: string): string {
    if (!GitApi.REF_RE.test(ref)) throw new Error('bad ref');
    return ref;
  }

  // [impl:uuid:5b367f7e-cd62-470f-8636-675669b2aad0] GitApi.branches
  static async branches(root: string): Promise<string[]> {
    const { stdout } = await execFileAsync('git', ['branch', '--format=%(refname:short)'], GitApi.opts(root));
    return stdout.split('\n').map(s => s.trim()).filter(Boolean);
  }

  // R30.38 save-404: the repo's currently checked-out branch (git rev-parse --abbrev-ref HEAD) — the working tree a diff/
  // merge Save writes to. Read-only, execFile array-args (no shell). Detached HEAD → 'HEAD'.
  // [impl:uuid:a2cbd78e-b127-4d60-886b-6b137943758d] GitApi.currentBranch (R30.38 merge.currentBranchApi 9757bf00 → Method currentBranch b9e8ba29)
  static async currentBranch(root: string): Promise<string> {
    const { stdout } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], GitApi.opts(root));
    return stdout.trim();
  }

  // [impl:uuid:e2c70b0f-a4de-4ac8-8d35-d72890327d47] GitApi.commits
  static async commits(root: string, ref: string, pathArg: string, limit: number): Promise<{ hash: string; subject: string; author: string; date: string }[]> {
    const n = String(Math.max(1, Math.min(200, Math.floor(limit) || 20)));
    const args = ['log', '--format=%H%x00%s%x00%an%x00%aI', '-n', n];
    if (ref) args.splice(1, 0, GitApi.guardRef(ref)); // R30.7: optional git log <ref>, routed through the uniform guard
    if (pathArg) { const rel = GitApi.safeRelPath(root, pathArg); if (!rel) throw new Error('bad path'); args.push('--', rel); }
    const { stdout } = await execFileAsync('git', args, GitApi.opts(root));
    return stdout.split('\n').filter(Boolean).map(l => {
      const [hash, subject, author, date] = l.split('\0');
      return { hash, subject, author, date };
    });
  }

  // [impl:uuid:9bd3b360-e4d9-4bcc-9af2-ec78a72f6cb3] GitApi.fileAtRef
  static async fileAtRef(root: string, ref: string, p: string): Promise<string> {
    GitApi.guardRef(ref); // R30.7: uniform ref guard (was an inline REF_RE check)
    const rel = GitApi.safeRelPath(root, p);
    if (!rel) throw new Error('bad path');
    const { stdout } = await execFileAsync('git', ['show', `${ref}:${rel}`], GitApi.opts(root));
    return stdout;
  }

  // [impl:uuid:b17ad1df-b277-44e9-adab-74ee087cbccb] GitApi.mergeBase — R30.9: the common ancestor of two refs
  // (`git merge-base a b`) = the BASE for base-aware 3-way diff3. Both refs uniform-guarded; read-only. Empty
  // stdout (unrelated histories / no common ancestor) → '' → client falls back to 2-way (design no-base fallback).
  static async mergeBase(root: string, refA: string, refB: string): Promise<string> {
    GitApi.guardRef(refA); GitApi.guardRef(refB);
    try {
      const { stdout } = await execFileAsync('git', ['merge-base', refA, refB], GitApi.opts(root));
      return stdout.trim();
    } catch { return ''; } // no common ancestor → empty (fallback path), not a 500
  }

  // [impl:uuid:e9cfaab3-5166-4ab4-ab7c-699481b3d681] GitApi.fileHistory — R30.10: the version history of ONE file
  // (`git log --follow -- <path>`), newest-first, for the diff editor's right-side default. Path guarded via
  // safeRelPath (it is a PATH, not a ref → no guardRef); read-only execFile array-args; cwd = resolved repo root.
  static async fileHistory(root: string, p: string): Promise<{ hash: string; subject: string; author: string; date: string }[]> {
    const rel = GitApi.safeRelPath(root, p);
    if (!rel) throw new Error('bad path');
    const { stdout } = await execFileAsync('git', ['log', '--follow', '--format=%H%x00%s%x00%an%x00%aI', '--', rel], GitApi.opts(root));
    return stdout.split('\n').filter(Boolean).map(l => {
      const [hash, subject, author, date] = l.split('\0');
      return { hash, subject, author, date };
    });
  }
}

let bugReportTarget = 'robbinTeam:0.0';
const PAIRING_PATH = path.join(DATA_DIR, 'agent-pairing.json');
try { const p = JSON.parse(fsSync.readFileSync(PAIRING_PATH, 'utf-8')); if (p.bugReportTarget) bugReportTarget = p.bugReportTarget; } catch {}

function sanitizeBugReport(text: string): string {
  return text.slice(0, 500).replace(/[`$\\'";\n\r]/g, '').replace(/[^\x20-\x7E]/g, '').trim();
}
function appendBugReport(name: string, text: string, token: string = ''): void {
  const file = path.join(DATA_DIR, 'bug-reports.json');
  let reports: any[] = [];
  try { reports = JSON.parse(fsSync.readFileSync(file, 'utf-8')); } catch {}
  reports.push({ name, token, text, timestamp: new Date().toISOString() });
  fsSync.writeFileSync(file, JSON.stringify(reports, null, 2));
}

// Room manager
const ROOMS_DIR = path.join(DATA_DIR, 'rooms');
const roomManager = new RoomManager(ROOMS_DIR);
// T99: legacy roomManager.loadFromDisk(data/rooms) REMOVED — per-user/UUID dirs are now the
// SOLE source of truth. Rooms load only from the per-user scan below.

// T93/T99: register every per-user room from its UUID dir (creatorToken carried in room.json).
// (Pre-T99 this also backfilled creatorToken onto legacy-loaded copies; with the legacy load
// gone, every per-user room is registered fresh here.)
{
  let registered = 0, backfilled = 0;
  for (const { userToken, roomId, data } of scanAllRooms()) {
    const existing = roomManager.getRoom(roomId);
    if (existing) {
      if (!existing.creatorToken) { existing.creatorToken = data.ownerToken; backfilled++; }
      continue;
    }
    // Build persisted data for constructor (prevents wipe on first persist)
    const persistedMembers = Array.isArray((data as any).members)
      ? (data as any).members.map((pm: any) => {
          const token = String(pm.ior || '').replace('ior:instance:', '');
          return { id: `persisted-${token.slice(0,8)}`, name: pm.name || '', playerToken: token, disconnected: true };
        }).filter((m: any) => m.playerToken)
      : [];
    const persistedFiles = Array.isArray((data as any).files)
      ? (data as any).files.map((f: string) => String(f).replace('ior:instance:', '')).filter(Boolean)
      : [];
    const placeholder: RoomMember = { id: 'dormant', ws: null as any, name: '', avatarUrl: '', playerToken: userToken, disconnected: true };
    const room = roomManager.createRoom(data.name, placeholder, {
      id: roomId, isPrivate: data.isPrivate, visibility: (data.visibility as any) || undefined,
      mode: (data.mode as any) || undefined, roomKey: data.roomKey || '', creatorToken: data.ownerToken,
      persistedMembers, persistedFiles, chatHistory: data.chatHistory,
    });
    room.creatorToken = data.ownerToken;
    room.members.delete('dormant');
    const chatCount = data.chatHistory?.length || 0;
    const memberCount = persistedMembers.length;
    room.lastMessageIor = (data as any).lastMessageIor || null;
    room.firstMessageIor = (data as any).firstMessageIor || null;
    room.messageCount = (data as any).messageCount || 0;
    console.log(`  room ${roomId.slice(0,8)}: chat=${chatCount} members=${memberCount} lastMsg=${room.lastMessageIor?.slice(0,20) || 'null'} name=${data.name}`);
    registered++;
  }
  console.log(`Per-user rooms: ${registered} registered, ${backfilled} creatorToken backfilled`);
}

let serverStartTime = new Date();
// [impl:uuid:51b7a457-7dd2-48ac-8dcc-9c00e9f6caf4] Logger.logAtLevel (split for Device.createDeviceUnit)
// [impl:uuid:2f809076-5cca-42b3-806b-7f390890fa2b] Logger.logAtLevel (split for PageNav.raiseAboveDrawer)
// [impl:uuid:32005bc3-7bce-4214-aeb7-f50794cedca4] Logger.logAtLevel (split for Room.restoreFilesFromScenario)
// [impl:uuid:340036b4-8689-4cdb-b18f-fbbb7d36e0c5] Logger.logAtLevel (split for Assets.avatarPersist)
// [impl:uuid:37e9f3e2-0130-4f34-8c44-a90bc83495d4] Logger.logAtLevel (split for SvgViewer.onPinchEnd)
// [impl:uuid:408edc8c-b6a1-4577-80a0-e35adc7f137a] Logger.logAtLevel (split for server.detailNavSync)
// [impl:uuid:d688f96c-1144-4299-aba6-e1dd7271f704] Logger.logAtLevel (split for Assets.keylessUpload)
// [impl:uuid:cda50b0f-be12-4e42-a436-72c4c8e0744e] Logger.logAtLevel (split for Logger.logAtLevel)
// [impl:uuid:8298c379-38af-4b1c-b6ae-f2569425c48c] Logger.logAtLevel (split for User.createUserUnit)
// [impl:uuid:7c4a9d74-636c-44e0-b5da-86ce7a684975] Logger.logAtLevel (split for FileUnit.uploadEndpoint)
const serverLogs: string[] = [];
const MAX_LOGS = 1000;

const LOGS_DIR = path.join(DATA_DIR, 'logs');

function getLogFileName(): string {
  const d = new Date();
  return `rawbin-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.log`;
}

// [impl:uuid:b1751446-effd-45f2-a4e2-e70ae5a19d27] server.ucScopedMethodResolve
// [impl:uuid:dcc18fd3-48ca-4e9a-a8b7-23fcd05cee5f] server.detailNavSync
// [impl:uuid:7f1774c9-1f78-403e-b078-c1b21d8a6b8e] Logger.logAtLevel
// [impl:uuid:c8888f6d-4177-4a1f-abdf-027752dc76db] R29.1 ServerTUI.addLog (stream to pane on isTTY)
function addLog(message: string): void {
  const timestamp = new Date().toLocaleTimeString();
  const entry = `[${timestamp}] ${message}`;
  serverLogs.push(entry);
  if (serverLogs.length > MAX_LOGS) serverLogs.shift();
  if (IS_PRODUCTION) {
    try {
      fsSync.mkdirSync(LOGS_DIR, { recursive: true });
      fsSync.appendFileSync(path.join(LOGS_DIR, getLogFileName()), entry + '\n');
    } catch {}
  }
  // R29.1 AC-2: stream the request-log to the pane when a TTY is present (isTTY, NOT IS_PRODUCTION: env-agnostic —
  // headless prod → file only, no ANSI/log-noise on a non-TTY stdout). [marker on the addLog declaration above]
  if (process.stdout.isTTY) process.stdout.write(entry + '\n');
}

// R40.18 StaleSteerLog — the observability facet for pin auto-progress (BITE-6b). LOG-ONLY: it OBSERVES the
// explicit-steer→auto transition; it NEVER writes the pin (a pin write here would be the two-source hook R40.17 bans).
class StaleSteerLog {
  // [impl:uuid:c0cfbbad-8702-45fb-bbc1-7960c48537be] StaleSteerLog.logStaleSteerExpiry — R40.18 BITE-6b observable
  // stale-steer: called ONCE at the R40.10 approve→Done transition; if the just-completed task IS the current explicit
  // currentTaskUuid steer, that designation is "used up" → auto-progress resumes. State it (never a silent drop-to-auto).
  static logStaleSteerExpiry(idx: ScenarioIndex, taskUuid: string): void {
    const cu = idx.get('current-sprint-singleton-0000-000000000001');
    const steer = String((cu?.model as Record<string, unknown>)?.currentTaskUuid || '').replace('ior:instance:', '');
    if (steer && steer === taskUuid.replace('ior:instance:', '')) addLog(`[pin] explicit current-task steer for ${taskUuid.slice(0, 8)} expired (reached Done) → auto-progress resumed`);
  }
}

function cleanupOldLogs(): void {
  try {
    if (!fsSync.existsSync(LOGS_DIR)) return;
    const files = fsSync.readdirSync(LOGS_DIR).filter(f => f.startsWith('rawbin-') && f.endsWith('.log'));
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const f of files) {
      const fpath = path.join(LOGS_DIR, f);
      const stat = fsSync.statSync(fpath);
      if (stat.mtimeMs < cutoff) fsSync.unlinkSync(fpath);
    }
  } catch {}
}

function getBannerScript(): string {
  try {
    const manifest = JSON.parse(fsSync.readFileSync(path.join(PUBLIC_DIR, 'dist', 'build-manifest.json'), 'utf-8'));
    if (manifest['rb-update-banner.js']) return `/dist/${manifest['rb-update-banner.js']}`;
  } catch {}
  return '/dist/rb-update-banner.js';
}

function getBundleScript(key: string, fallback: string): string {
  try {
    const manifest = JSON.parse(fsSync.readFileSync(path.join(PUBLIC_DIR, 'dist', 'build-manifest.json'), 'utf-8'));
    if (manifest[key]) return `/dist/${manifest[key]}`;
  } catch {}
  return `/dist/${fallback}`;
}

function pageHead(title: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title} — RawBin</title><link rel="stylesheet" href="/app.css"><script type="module" src="${getBannerScript()}"></script></head><body style="padding-top:max(env(safe-area-inset-top),12px)"><rb-update-banner></rb-update-banner><button onclick="history.back()" style="position:fixed;bottom:calc(20px + env(safe-area-inset-bottom));right:20px;width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,0.6);color:white;border:none;font-size:1.5rem;cursor:pointer;z-index:100">✕</button>`;
}

function pageNav(backHref: string = '/', backLabel: string = 'Home', editPath?: string): string {
  const editLink = editPath ? ` · <a href="/edit/${editPath}" style="color:#ff9800;text-decoration:none;font-size:0.9rem">✏️ Edit</a>` : '';
  // [impl:uuid:de0847e2-9351-4dce-80e6-70a2be803417] R19.57 pageNav z-index above drawer
  return `<div style="padding:12px 16px;padding-top:calc(12px + env(safe-area-inset-top));position:sticky;top:0;z-index:101;background:#1a1a2e"><a href="${backHref}" style="color:#ffffff;text-decoration:none;font-size:0.9rem">← ${backLabel}</a> · <a href="/app" style="color:#ffffff;text-decoration:none;font-size:0.9rem">App</a> · <a href="/trace" style="color:#ffffff;text-decoration:none;font-size:0.9rem">Traceability</a>${editLink}</div>`;
}

function trackClient(req: http.IncomingMessage): void {
  const ip = req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const sessionId = `${ip}-${userAgent}`;
  const url = req.url || '/';
  const method = req.method || 'GET';
  totalRequests++;
  if (!clientSessions.has(sessionId)) {
    clientSessions.set(sessionId, { id: sessionId, ip, userAgent, connectedAt: new Date(), requestCount: 1, lastRequest: new Date() });
    addLog(`New client: ${ip}`);
  } else {
    const session = clientSessions.get(sessionId)!;
    session.requestCount++;
    session.lastRequest = new Date();
  }
  addLog(`${method} ${url} - ${ip}`);
}

// --- HTTP Request Handler ---

// ── R31.2 Server-Manager OWNER-GATE — thin server-side wrappers over the SINGLE shared guard
// ServerManagerGuard.assertOwner (architect Method 8bb1842f). The OWNER_TOKEN literal lives ONLY in
// ServerManagerGuard.ts (INV-G2). resolveOwner stays the ONE guard (INV-G1) — used by the /api/server-manager/*
// choke-point, the /server-manager page, AND the terminal ws upgrade.
// R31.4-PRE/B1: httpOnly Server-Manager session cookie. Minted by POST /api/server-manager/session (owner-gated via
// the live x-player-token) so the cookie-less /server-manager page + its /tree fetch + the terminal ws all
// authenticate WITHOUT a live ws session or a token-in-URL. The id is RANDOM (crypto.randomUUID, NOT OWNER_TOKEN →
// INV-G2 stays 1).
const smSessions = new Map<string, { owner: boolean; expiresAt: number; token: string }>(); // R31.8: value carries the minting TOKEN (cookie value stays the opaque sid) → requireFeatureAccess resolves cookie→token→Feature.allowedUsers
function cookieFrom(req: http.IncomingMessage, name: string): string {
  const raw = (req.headers['cookie'] as string) || '';
  for (const part of raw.split(';')) { const i = part.indexOf('='); if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim(); }
  return '';
}
function resolveOwner(req: http.IncomingMessage): { ok: true; token: string } | { ok: false } {
  // Cookie path: a valid sm_session IS the proof (minted after an owner-gated POST) — no tokenToClient live-session
  // needed (the standalone /server-manager page holds no ws). Prune expired on read.
  const sid = cookieFrom(req, 'sm_session');
  if (sid) { const s = smSessions.get(sid); if (s && s.owner && s.expiresAt > Date.now()) return { ok: true, token: 'sm_session' }; if (s) smSessions.delete(sid); }
  // Token path: the OWNER_TOKEN literal (ServerManagerGuard, INV-G2) — OR (R40.45 OWNER SINGLE-SOURCE, PO): the caller's
  // REAL identity ∈ the ONE root-only PROTECTED-IDENTITY set (which already contains his profile 05e58f81). Fixes the
  // defect Tron hit — the real owner was 403'd on /trace while the PUBLIC literal 41ad88c4 would pass — by making BOTH
  // owner gates trust the SAME set. Fail-closed: set absent/empty → ids=[] → only the literal path (unchanged), no bypass.
  const g = ServerManagerGuard.assertOwner(req, (t) => tokenToClient.has(t));
  if (g.ok) return g;
  const tok = ServerManagerGuard.playerTokenFrom(req);
  if (tok) {
    const puid = FeatureManager.profileUuidOf(tok, userProfiles as unknown as Map<string, { redirectTo?: string }>); // token → his Profile-unit uuid (redirectTo→primary→uuid)
    if (loadProtectedIdentities().ids.includes(puid)) return { ok: true, token: tok }; // real owner by protected-identity membership (root-only, fail-closed)
  }
  return { ok: false };
}
function requireOwnerHttp(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  if (resolveOwner(req).ok) return true;
  const ip = req.socket.remoteAddress || 'unknown';
  addLog(`[server-manager] DENY kind=http path=${req.url} token=${(ServerManagerGuard.playerTokenFrom(req) || 'none').slice(0, 8)} ip=${ip}`);
  res.writeHead(403, { 'Content-Type': 'application/json' }); res.end('{"error":"forbidden"}');
  return false;
}

// R31.8: resolve the caller's authenticated TOKEN for data-driven feature access — cookie path (sm_session sid →
// stored token, the owner-gated mint proof; no live-ws needed, matches resolveOwner) OR a live header session; '' if
// neither. Returns the REAL token (not resolveOwner's 'sm_session' placeholder) so requireFeatureAccess can check
// Feature.allowedUsers membership.
function resolveSessionToken(req: http.IncomingMessage): string {
  const sid = cookieFrom(req, 'sm_session');
  if (sid) { const s = smSessions.get(sid); if (s && s.expiresAt > Date.now()) return s.token; if (s) smSessions.delete(sid); }
  const t = ServerManagerGuard.playerTokenFrom(req);
  return (t && tokenToClient.has(t)) ? t : '';
}
// R31.8: allowedUsers of a Feature by name (scan the ior:class:Feature units on disk). Fail-closed: unknown/empty → []
// (INV-F5). Admin-only low-QPS path; a fresh ScenarioIndex per call keeps it revoke-immediate (no stale cache).
function featureAllowedUsers(name: string): string[] {
  try {
    const fidx = new ScenarioIndex(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../scenario/index'));
    for (const uuid of fidx.list()) {
      const u = fidx.get(uuid);
      if (u?.ior === 'ior:class:Feature' && String((u.model as { name?: string })?.name) === name) {
        const au = (u.model as { allowedUsers?: unknown }).allowedUsers;
        return Array.isArray(au) ? au as string[] : [];
      }
    }
  } catch { /* fail-closed */ }
  return [];
}
// R31.8c round-4-fix RED-1: the ONE shared "profile → ProfileViewData" ENRICH. devices live in the SEPARATE
// deviceRecords store (NOT on the profile record), so BOTH the /profile feed AND the FM granted-user handler must
// merge deviceRecords.filter(ownerToken===token) BEFORE ProfileView.profileViewData — else the drawer shows devices:[].
// (FIX-B shared the builder; this shares the ENRICH → FM drawer render === /profile by construction.) opts.profile lets
// the /profile feed pass its already-resolved session profile (zero-drift); the granted-user path resolves by token.
function profileViewDataForToken(token: string, opts?: { connectedDeviceIds?: string[]; profileUuid?: string; profile?: unknown }) {
  const p = opts?.profile ?? userProfiles.get(token);
  const myDevices = deviceRecords.filter(d => d.ownerToken === token);
  const connectedDeviceIds = opts?.connectedDeviceIds ?? [...wsClients].filter(c => c.playerToken === token && c.deviceId).map(c => c.deviceId);
  const base = p ? { ...(p as object) } : { token };
  return ProfileView.profileViewData({ ...base, devices: myDevices } as unknown as ServerProfileRecord, { connectedDeviceIds, profileUuid: opts?.profileUuid });
}

// [impl:uuid:e86f0736-a05a-427c-b2b2-1c2d36b68965] server.attachChainMethod (Method 0fc54115, Class c0a0921d) — R31.10:
// attach the UseCase's UC.method (ucMethodIor) as entry.chainMethod so the tree resolves the correct UC→Method in ALL
// query modes (trace + non-trace/scenario), not just /trace. The ucMethodIor guard → fires ONLY when the UC has a genuine
// method link (else the Class.methods[] fallback). EXTRACTED from the anonymous /api/trace/children .map callback into
// this NAMED decl so the [impl] marker strict-AST-credits (an anon inline block can't name-match 'attachChainMethod').
function attachChainMethod(entry: Record<string, unknown>, type: string, ct: string, ucMethodIor: string, idx: ScenarioIndex): void {
  if (type === 'UseCase' && ct === 'Class' && ucMethodIor) {
    const meth = idx.get(ucMethodIor);
    if (meth) entry.chainMethod = { uuid: ucMethodIor, type: 'Method', name: String(meth.model?.name || '') };
  }
}

// R31.8 slice-d: the Features a token is a MEMBER of (token ∈ Feature.allowedUsers) → {uuid,name,icon} for the profile
// 'Feature access' render. Membership-driven (generalizes the R31.1 ServerManager-only boolean), fail-closed on error.
function featuresForToken(token: string): { uuid: string; name: string; icon: string; launchPage: string }[] {
  const out: { uuid: string; name: string; icon: string; launchPage: string }[] = [];
  if (!token) return out;
  try {
    const fidx = new ScenarioIndex(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../scenario/index'));
    for (const uuid of fidx.list()) {
      const u = fidx.get(uuid);
      if (u?.ior !== 'ior:class:Feature') continue;
      const m = u.model as { name?: string; icon?: string; launchPage?: string; allowedUsers?: unknown };
      // R32.9 (C) INV-D3: carry the Feature's data-driven launchPage → the profile launch is Feature.launchPage, not a name-ternary.
      if (Array.isArray(m.allowedUsers) && (m.allowedUsers as string[]).includes(token)) out.push({ uuid, name: String(m.name || 'Feature'), icon: String(m.icon || ''), launchPage: String(m.launchPage || '') });
    }
  } catch { /* fail-closed */ }
  return out;
}
// R31.8 HTTP wrapper for the ServerManager feature gate (the /api/server-manager/* + /server-manager choke-point).
function requireFeatureAccessHttp(req: http.IncomingMessage, res: http.ServerResponse, featureName: string): boolean {
  if (ServerManagerGuard.requireFeatureAccess(req, featureName, resolveSessionToken, featureAllowedUsers).ok) return true;
  const ip = req.socket.remoteAddress || 'unknown';
  addLog(`[server-manager] DENY kind=http feature=${featureName} path=${req.url} token=${(resolveSessionToken(req) || 'none').slice(0, 8)} ip=${ip}`);
  res.writeHead(403, { 'Content-Type': 'application/json' }); res.end('{"error":"forbidden"}');
  return false;
}

// R31.3 owner-only Server-Manager PAGE shell (served ONLY after requireOwnerHttp passes — 6th AC). Static HTML +
// inline renderer that fetches the owner-gated /api/server-manager/tree (same-origin sm_session cookie auto-sent) and
// draws the sessions→windows→panes tree. R31.2 cookie-only: auth = the sm_session cookie, NOT ?token= (removed). No backticks/${} inside.
// R31.4 step-2/3: the Server Manager page mounts the SHARED rb-trace-tree renderer (bundled esbuild
// module) fed by /api/server-manager/tree `roots` (typed otmuxSession→otmuxWindow→otmuxPane). The old
// bespoke inline tree is retired. Page is owner-only (choke-point 403s non-owners before this shell).
function serverManagerPage(): string {
  const script = getBundleScript('server-manager.js', 'server-manager.js');
  const termCss = getBundleScript('server-manager.css', 'server-manager.css'); // R31.4: bundled xterm.css for the terminal overlay
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Server Manager</title><link rel="stylesheet" href="/app.css"><link rel="stylesheet" href="${termCss}"><style>
/* R31.4 ITEM1: SM-page-local viewport flex column so the shared .trace-page fills below the natural-height header (the SM header != /trace's 44px pageNav, so the shared calc(100vh-44px) is wrong here). Positioning-only; touches NO shared rule. */
body{font-family:system-ui,sans-serif;margin:0;background:#0d1117;color:#e6edf3;display:flex;flex-direction:column;height:100dvh;overflow:hidden}
header{padding:max(env(safe-area-inset-top),12px) 16px 12px;background:#161b22;border-bottom:1px solid #30363d;display:flex;align-items:center;gap:12px}
h1{font-size:1rem;margin:0;flex:1}button{background:#238636;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer}
.trace-page{height:auto;flex:1;min-height:0}
#err{color:#f85149;padding:12px 16px}
</style></head><body>
<header><a href="/profile" style="color:#58a6ff;text-decoration:none;font-size:.9rem;white-space:nowrap">&larr; Back to Profile</a><h1>&#128421;&#65039; Server Manager &mdash; otmux tree</h1><button id="refresh">Refresh</button></header>
<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="sm-tree"></rb-trace-tree><div id="err"></div></div></div>
<script type="module" src="${script}"></script></body></html>`;
}

// R31.8b Feature-Manager PAGE shell — membership-gated (requireFeatureAccess 'Feature Manager') at the route. Loads the
// feature-manager bundle, which mounts rb-feature-manager-detail in the SHARED drawer (DRY, like /server-manager).
function featureManagerPage(): string {
  const script = getBundleScript('feature-manager.js', 'feature-manager.js');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Feature Manager</title><link rel="stylesheet" href="/app.css"><style>
body{font-family:system-ui,sans-serif;margin:0;background:#0d1117;color:#e6edf3;display:flex;flex-direction:column;height:100dvh;overflow:hidden}
header{padding:max(env(safe-area-inset-top),12px) 16px 12px;background:#161b22;border-bottom:1px solid #30363d;display:flex;align-items:center;gap:12px}
h1{font-size:1rem;margin:0;flex:1}button{background:#238636;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer}
.trace-page{height:auto;flex:1;min-height:0}
#err{color:#f85149;padding:12px 16px}
</style></head><body>
<header><a href="/profile" style="color:#58a6ff;text-decoration:none;font-size:.9rem;white-space:nowrap">&larr; Back to Profile</a><h1>&#128273; Feature Manager</h1><button id="refresh">Refresh</button></header>
<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="fm-tree"></rb-trace-tree><div id="err"></div></div></div>
<script type="module" src="${script}"></script></body></html>`;
}

// R32.9 (D) Model-Driven Code Quality PAGE shell — membership-gated (requireFeatureAccess 'Model-Driven Code Quality')
// at the /model route (INV-D4 fail-closed). Loads the model bundle, which mounts the SHARED rb-trace-tree over
// /api/model/tree (R32.3 model-tree UX reused; R32.5 ISOLATED store). Mirrors featureManagerPage (DRY, no fork).
// [impl:uuid:152c8e0f-6f69-4daa-9a1d-08d3c3ea990c] server.serverModelPage (Method 4668508c, Class c0a0921d, UC b08ac411 feature.launch)
function serverModelPage(): string {
  const script = getBundleScript('model.js', 'model.js');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Model-Driven Code Quality</title><link rel="stylesheet" href="/app.css"><style>
body{font-family:system-ui,sans-serif;margin:0;background:#0d1117;color:#e6edf3;display:flex;flex-direction:column;height:100dvh;overflow:hidden}
header{padding:max(env(safe-area-inset-top),12px) 16px 12px;background:#161b22;border-bottom:1px solid #30363d;display:flex;align-items:center;gap:12px}
h1{font-size:1rem;margin:0;flex:1}button{background:#238636;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer}
.trace-page{height:auto;flex:1;min-height:0}
#err{color:#f85149;padding:12px 16px}
</style></head><body>
<header><a href="/profile" style="color:#58a6ff;text-decoration:none;font-size:.9rem;white-space:nowrap">&larr; Back to Profile</a><h1>&#129504; Model-Driven Code Quality</h1><button id="gen-rawbin" title="Generate the RawBin M1 model from src/ts/scenario (bounded)">Generate RawBin</button><button id="refresh">Refresh</button></header>
<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree" data-always-expanded></rb-trace-tree><div id="err"></div></div></div>
<script type="module" src="${script}"></script></body></html>`;
}

// [impl:uuid:f345b8ed-c853-46c8-8b3c-102375f528dc] renderFeatureGrants (Method b4f03947, off UC a3958f85) — R31.1,
// MOVED to the read-only /profile VIEWER per Tron (was ProfileEditor edit-form). Returns the inline client JS that,
// at the BOTTOM of 'My Profile' (after My Bug Reports, into #feature-grants), fetches the owner-gated
// /api/server-manager/whoami (assertOwner, R31.2) and on 200 appends the owner-only 'Server Manager' entry.
// SERVER-gated (whoami 200/403), NOT UI-hidden: non-owner → 403 → no entry even if markup forced; fail-closed.
// (NOTE to req/architect: the unit name still says ProfileEditor.* — please re-point to the viewer; token-match
// on renderFeatureGrants holds.)
function renderFeatureGrants(): string {
  // Inserted INSIDE the /profile PROFILE ws handler (m = message, token = the identified token, both in scope).
  // Renders the owner-only 'Server Manager' entry IFF the server-computed m.serverManager flag is set — NO whoami
  // round-trip (kills the owner-accept race + the client can't self-grant). R31.2 cookie-only: the entry mints the
  // sm_session cookie (onclick POST /session with the x-player-token HEADER) then navigates — NO ?token= in the URL.
  // R31.8 slice-d: render EVERY Feature the user is a member of (m.features, data-driven) — generalizes the R31.1
  // ServerManager-only boolean so FeatureManager (and future features) appear too. Server Manager keeps its cookie-mint
  // → /server-manager nav; other features are listed interactive (per-feature page is a later slice).
  return `
      if(m.features && m.features.length){
        var fg=document.getElementById('feature-grants');
        if(fg){
          fg.innerHTML='<h3>Feature access</h3>';
          m.features.forEach(function(f){
            var a=document.createElement('a');
            a.href='#';
            a.style.cssText='display:flex;align-items:center;gap:8px;padding:10px;margin-top:6px;background:rgba(102,126,234,0.08);border-radius:10px;color:#667eea;text-decoration:none;font-weight:600';
            a.textContent=(f.name==='Server Manager'?'\u{1F5A5}\u{FE0F} ':'\u{1F511} ')+f.name;
            var page=(f.launchPage||'/feature-manager'); // R32.9 (C) INV-D3: data-driven launch = Feature.launchPage (was a name-ternary; new features launch by their own data)
            a.onclick=function(ev){ev.preventDefault();fetch('/api/server-manager/session',{method:'POST',headers:{'x-player-token':token}}).then(function(r){if(r.ok)location.href=page;}).catch(function(){});}; // R31.8b: mint the sm_session cookie (carries the live owner token) THEN navigate to the feature's page — FIXES the dead else-branch (Tron 'renders but does not open'); Server Manager→/server-manager, every other feature (Feature Manager, …)→/feature-manager
            fg.appendChild(a);
          });
        }
      }`;
}

// [impl:uuid:5afeafe9-14a7-480c-8d02-91e76539a3ae] mofLayerRoots (Method 3d308526, Class c0a0921d, off UC d42e1a1e
// model.mofTree) — R33.1 MOF folder roots for the SHARED rb-trace-tree. S33-P2b (R33.2, INV-P2b-1/2): emit ONLY the
// TOP layer (M2/M1 folders, hasChildren+childCount, NO inline deep tree). Every deeper layer (metaclass→instances,
// project→file-folders→classes→members) lazy-loads via /api/trace/children → mofChildren (MODEL_STORE) on expand →
// bounds the initial payload+DOM at 390px (was: inline ~1195 nodes = @390 flood). Members already lazy (mofElNode).
type MofNode = { uuid: string; type: string; name: string; hasChildren: boolean; childCount: number; icon?: string; children?: MofNode[] };
type MofEl = { uuid: string; ior: string; m: Record<string, unknown> };
const MOF_STRIP = (r: string): string => String(r).replace(/^ior:instance:/, '').replace(/^modelelement:/, '');
// bounded folder: hasChildren + childCount, NO inline children array → client lazy-fetches via /api/trace/children.
const mofFolder = (uuid: string, name: string, childCount: number, icon: string, type = 'collection'): MofNode => ({ uuid, type, name, hasChildren: childCount > 0, childCount, icon });
// a real ModelElement (class) node — members stay LAZY (hasChildren+childCount, no inline members), INV-MOF3 uuid unchanged.
const mofElNode = (x: MofEl): MofNode => { const memberCount = (Array.isArray(x.m.members) ? (x.m.members as string[]) : []).length; return { uuid: String(x.m.uuid || x.uuid), type: 'modelelement', name: String(x.m.name || ''), hasChildren: memberCount > 0, childCount: memberCount, icon: String(x.m.kind || 'class') }; };
function mofModelEls(idx: ScenarioIndex): { els: MofEl[]; m1: MofEl[]; m2: MofEl[]; m1Roots: MofEl[] } {
  const els = [...idx.list()].map((u) => { const un = idx.get(u); return un ? { uuid: u, ior: un.ior, m: un.model as Record<string, unknown> } : null; }).filter(Boolean) as MofEl[];
  const modelEls = els.filter((x) => x.ior === 'ior:class:ModelElement');
  const m1 = modelEls.filter((x) => x.m.metaLevel === 'M1');
  return { els, m1, m2: modelEls.filter((x) => x.m.metaLevel === 'M2'), m1Roots: m1.filter((e) => !e.m.memberOf) };
}
// S33-P2b (INV-P2b-2/3, NO fork): resolve ONE bounded layer for a SYNTHETIC MOF folder uuid. Shared by mofLayerRoots
// (top layer) + /api/trace/children (deeper layers). Returns null when the uuid is NOT synthetic (a real ModelElement →
// the member path resolves it). Scheme: mof-m2 | mof-m2:<mc> | mof-m1 | project:RawBin | project:<sf> | file:<sf>.
// [impl:uuid:b6c88d83-a838-46ad-ba9a-874e803ca479] mofChildren (Method 7c460f8a, Class c0a0921d, off UC 8bdeda90
// model.mofChildren) — R33.2/S33-P2b bounded/lazy layer resolver. DISTINCT from mofLayerRoots 5afeafe9 (R33.1) — no re-credit.
// [impl:uuid:9eb2c39c-5961-4b3d-bf35-072223c46d23] server.pumlChildren (Method e78b5eaf) — R33.5 item4 (Tron opt-a):
// enumerate the EXISTING SOURCE .puml (scrum.pmo/sprints/*/diagrams/*.puml) as itemviews (mirror ts/). Each node's
// uuid 'puml-src:<sprint>/<file>' carries the relpath → a click → Import (R32.7 pumlToModel) → interactive diagram.
// Also surfaces any already-imported PumlArtifact units. Read-only enumeration; import happens via /import-puml.
// [impl:uuid:7ecb9a8d-41dd-4709-8b5c-bea9367e8c0d] server.newElement (R33.9 unit-verb) — mint a new M1 ModelElement
// UNIT in MODEL_STORE (store-only, INV: prod scenario/index NEVER touched). Returns the new uuid. NOT a diagram/view op.
function newElement(name: string, kind: string): { ok: boolean; uuid?: string; error?: string; status?: number } {
  const nm = String(name || '').trim();
  if (!nm) return { ok: false, error: 'bad-name', status: 400 };
  const uuid = crypto.randomUUID();
  const unit = { ior: 'ior:class:ModelElement', ownerIor: null, model: { uuid, name: nm, metaLevel: 'M1', kind: kind || 'class', members: [], relations: [] } };
  const f = path.join(MODEL_STORE, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
  fsSync.mkdirSync(path.dirname(f), { recursive: true });
  fsSync.writeFileSync(f, JSON.stringify(unit, null, 2) + '\n');
  return { ok: true, uuid };
}
// [impl:uuid:28000b00-55d3-4a94-ba37-dd7486ffb851] server.createFolder (Method 67a9f60f, Class c0a0921d) — R34.3 (R-B):
// mint an ior:class:Folder unit in MODEL_STORE (store-only, prod scenario/index NEVER touched; mirrors diagram/create + newElement).
function createFolder(name: string, parent: string): { ok: boolean; uuid?: string; error?: string } {
  const uuid = crypto.randomUUID();
  const unit = { ior: 'ior:class:Folder', ownerIor: null, model: { uuid, name: String(name || 'New folder').slice(0, 80), parent: String(parent || '') || null, children: [] } };
  const f = path.join(MODEL_STORE, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
  fsSync.mkdirSync(path.dirname(f), { recursive: true });
  fsSync.writeFileSync(f, JSON.stringify(unit, null, 2) + '\n'); // INV store-only (MODEL_STORE, prod untouched)
  return { ok: true, uuid };
}

// R36.4 increment-2 (design b0d16ec5e): mint an AUTHORED UmlTraceRelationship (EXTENDS TraceLink) in MODEL_STORE — a
// user-DRAWN trace between two on-diagram units with no existing chain link (derived UC→method needs NO unit). Store-
// only (prod scenario/index NEVER touched; NOT build-owned → the R31.7 put-guard allows it). Deterministic uuid =
// keyToUuid('umltrace::'+from+'::'+to+'::'+relation) → idempotent (re-draw = same uuid, overwrite-identical, no dup).
// [impl:uuid:a79f6091-9024-4b36-a350-3d71668083fb] server.authorTrace (Method fde7eecc, Class c0a0921d) — R36.4 inc-2 AUTHORED-trace persist.
function authorTrace(from: string, to: string, relation: string, fromType?: string, toType?: string): { ok: boolean; uuid?: string; error?: string } {
  const f0 = String(from || '').replace(/^ior:instance:/, ''); const t0 = String(to || '').replace(/^ior:instance:/, '');
  const rel = relation === 'decomposes' ? 'decomposes' : 'traces';
  if (!f0 || !t0 || f0 === t0) return { ok: false, error: 'bad-endpoints' };
  const uuid = keyToUuid(`umltrace::${f0}::${t0}::${rel}`);
  const unit = { ior: 'ior:class:UmlTraceRelationship', ownerIor: null, model: { uuid, from: `ior:instance:${f0}`, to: `ior:instance:${t0}`, fromType: String(fromType || 'usecase'), toType: String(toType || 'method'), relation: rel, direction: 'directed', label: rel } };
  const file = path.join(MODEL_STORE, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
  fsSync.mkdirSync(path.dirname(file), { recursive: true });
  fsSync.writeFileSync(file, JSON.stringify(unit, null, 2) + '\n'); // idempotent (same uuid) — INV store-only (prod untouched)
  return { ok: true, uuid };
}

// R36.4 increment-2: list all AUTHORED UmlTraceRelationship units (MODEL_STORE) for the client to render as trace
// connectors (those whose from+to are both on the open diagram). Bounded scan (authored traces are few).
function listTraces(): Array<{ uuid: string; from: string; to: string; relation: string }> {
  try {
    const idx = new ScenarioIndex(MODEL_STORE);
    const out: Array<{ uuid: string; from: string; to: string; relation: string }> = [];
    for (const u of idx.list()) {
      const x = idx.get(u); if (!x || x.ior !== 'ior:class:UmlTraceRelationship') continue;
      const m = x.model as Record<string, unknown>;
      out.push({ uuid: u, from: String(m.from || '').replace(/^ior:instance:/, ''), to: String(m.to || '').replace(/^ior:instance:/, ''), relation: String(m.relation || 'traces') });
    }
    return out;
  } catch { return []; }
}

// [impl:uuid:a09b474d-c1de-44de-9cd3-d4eda13943b6] server.ensureViewUnit (Method 64c4f023, Class c0a0921d, off UC
// c3902503 modelTree.ensureViewUnit / 8f1eed4d modelTree.populateViewUnitFields) — R35.2/R35.3, GENERALIZES the R34.2 A2
// ensureFolderFileUnit (architect fork-A) so EVERY synthetic view ref maps to a REAL lazy-minted ior:class:X unit in
// MODEL_STORE → OScenario(/scenario?ior) + OEdit(scenarioEditorHref) ALWAYS resolve (never dead). Covered: dir:<rel>→Folder,
// file:<rel>→File (R34.2 subset, Test 23a9f9fd still holds), puml-src:<path>→PumlArtifact, project:<x>→Project,
// rawbin:*/mof-m1/mof-m2[:mc]→Folder. uuid=keyToUuid(<prefix>::<body>) → LAZY idempotent (INV-A2-2: same uuid on re-open,
// no dup). R35.3 POPULATE: model fields written per-type AT MINT (name+location+kind + File.sourceFile/ext ·
// PumlArtifact.sourceFile/format · Folder.metaLevel · Project.projectKey) — no empty stubs. MODEL_STORE-only, prod
// scenario/index NEVER touched (INV-A2-3). Tree/mofChildren BYTE-unchanged (INV-A2-1, fork-A). Non-view ref → null.
function ensureViewUnit(ior: string): { ior: string; ownerIor: null; model: Record<string, unknown> } | null {
  const ref = String(ior).replace(/^ior:instance:/, '');
  if (ref.includes('..')) return null; // path-safety (no traversal into the shard/store path)
  let iorClass: string, key: string, kind: string, location: string, name: string;
  const extra: Record<string, unknown> = {};
  if (ref.startsWith('dir:') || ref.startsWith('file:')) {
    const isDir = ref.startsWith('dir:');
    const rel = (isDir ? ref.slice('dir:'.length) : ref.slice('file:'.length)).replace(/^\/+/, '');
    if (!rel) return null;
    iorClass = isDir ? 'ior:class:Folder' : 'ior:class:File'; key = (isDir ? 'folder::' : 'file::') + rel;
    kind = isDir ? 'folder' : 'file'; location = rel; name = rel.split('/').pop() || rel;
    if (!isDir) { extra.sourceFile = `ior:file:${rel}`; const e = rel.split('.').pop(); if (e && e !== rel) extra.ext = e; } // R35.3 File fields
  } else if (ref.startsWith('puml-src:')) {
    const p = ref.slice('puml-src:'.length).replace(/^\/+/, ''); if (!p) return null;
    iorClass = 'ior:class:PumlArtifact'; key = 'puml::' + p; kind = 'puml'; location = p; name = p.split('/').pop() || p;
    extra.sourceFile = `ior:file:scrum.pmo/sprints/${p}`; extra.format = 'plantuml'; // R35.3 PumlArtifact fields
  } else if (ref.startsWith('project:')) {
    const proj = ref.slice('project:'.length) || 'RawBin';
    iorClass = 'ior:class:Project'; key = 'folder::' + ref; kind = 'project'; location = ref; name = proj;
    extra.projectKey = proj; // R35.3 Project fields (keyToUuid('folder::'+ref) per R35.2)
  } else if (ref.startsWith('rawbin:') || ref === 'mof-m1' || ref.startsWith('mof-m2')) {
    iorClass = 'ior:class:Folder'; key = 'folder::' + ref; location = ref;
    // inc-3 AC4: the diagrams container carries a DISTINCT kind so add-diagram (appliesTo:{kinds:['diagrams']}) is offered
    // ONLY there (resolveRefUnit reads model.kind). Other rawbin:*/mof folders stay generic 'folder'.
    kind = ref === 'rawbin:diagram' ? 'diagrams' : 'folder';
    name = ref.startsWith('rawbin:') ? ref.slice('rawbin:'.length) : ref.startsWith('mof-m2') ? (ref.includes(':') ? ref.slice(ref.indexOf(':') + 1) : 'M2') : 'M1';
    if (ref.startsWith('mof-m2')) extra.metaLevel = 'M2'; else if (ref === 'mof-m1') extra.metaLevel = 'M1'; // R35.3 MOF-Folder fields
    extra.synthetic = true;
  } else return null; // non-view ref → normal resolver
  const uuid = keyToUuid(key);
  const dfile = path.join(MODEL_STORE, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
  if (fsSync.existsSync(dfile)) { try { return JSON.parse(fsSync.readFileSync(dfile, 'utf-8')); } catch { /* corrupt → re-mint below */ } }
  const unit = { ior: iorClass, ownerIor: null as null, model: { uuid, name, location, kind, ...extra } };
  fsSync.mkdirSync(path.dirname(dfile), { recursive: true });
  fsSync.writeFileSync(dfile, JSON.stringify(unit, null, 2) + '\n'); // INV-A2-3 store-only (MODEL_STORE, prod scenario/index untouched)
  return unit;
}

// [impl:uuid:0dca728f-0372-4edc-ac28-51f9f5943bd4] server.renameElement (R33.9 unit-verb) — set model.name on an M1
// unit in MODEL_STORE (store-only, prod-safe).
function renameElement(elementUuid: string, name: string): { ok: boolean; error?: string; status?: number } {
  const UUID = /^[0-9a-fA-F-]{16,40}$/; const nm = String(name || '').trim();
  if (!UUID.test(elementUuid)) return { ok: false, error: 'bad-uuid', status: 400 };
  if (!nm) return { ok: false, error: 'bad-name', status: 400 };
  const f = path.join(MODEL_STORE, ...elementUuid.slice(0, 5).split(''), `${elementUuid}.scenario.json`);
  if (!fsSync.existsSync(f)) return { ok: false, error: 'no-element', status: 404 };
  const unit = JSON.parse(fsSync.readFileSync(f, 'utf-8'));
  unit.model.name = nm;
  fsSync.writeFileSync(f, JSON.stringify(unit, null, 2) + '\n');
  return { ok: true };
}
// [impl:uuid:14b7004a-7452-4f88-b3cb-b0c6d2e02730] server.deleteElement (R33.9 unit-verb, DESTRUCTIVE) — delete an M1
// unit from MODEL_STORE (store-only; prod scenario/index NEVER touched). ≠ R33.8 remove-view (drops only a view-link).
function deleteElement(elementUuid: string): { ok: boolean; error?: string; status?: number } {
  const UUID = /^[0-9a-fA-F-]{16,40}$/;
  if (!UUID.test(elementUuid)) return { ok: false, error: 'bad-uuid', status: 400 };
  const f = path.join(MODEL_STORE, ...elementUuid.slice(0, 5).split(''), `${elementUuid}.scenario.json`);
  if (!fsSync.existsSync(f)) return { ok: false, error: 'no-element', status: 404 };
  fsSync.unlinkSync(f);
  return { ok: true };
}
// count .ts recursively under dir (for the R33.10 dir-folder child count — expandable iff > 0).
function countTsUnder(dir: string): number {
  let n = 0;
  try { for (const e of fsSync.readdirSync(dir, { withFileTypes: true })) { if (e.isDirectory()) n += countTsUnder(path.join(dir, e.name)); else if (e.name.endsWith('.ts')) n++; } } catch { /* unreadable → 0 */ }
  return n;
}
// [impl:uuid:cfb6acef-a67b-49df-b998-f62686db1d5f] server.sourceDirTree (R33.10 tree completeness+folders) — walk
// src/<rel> ONE level: directory folders (dir:<rel>) + .ts file leaves (file:src/<rel>) for ALL ts on disk (the full
// 123, not just the ~25 with generated M1 elements). Mirrors pumlChildren's disk walk. file: leaf childCount = its
// MODEL_STORE M1 element count (0 = a source file not yet modeled; the file: case still resolves its elements, else empty).
function sourceDirTree(rel: string, m1Count: Map<string, number>): MofNode[] {
  const abs = path.join(__dirname, '../../..', 'src', rel); // R33.10 fix (architect backstop): PROJECT_ROOT is NOT module-level (only a local in the /md handler) → ReferenceError → {}; mirror pumlChildren's __dirname join
  let entries: fsSync.Dirent[] = [];
  try { entries = fsSync.readdirSync(abs, { withFileTypes: true }); } catch { return []; }
  const dirs: MofNode[] = [], files: MofNode[] = [];
  for (const e of entries) {
    const childRel = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) { const n = countTsUnder(path.join(abs, e.name)); if (n > 0) dirs.push(mofFolder(`dir:${childRel}`, e.name, n, 'mof-project')); } // folders only if they contain .ts
    else if (e.name.endsWith('.ts')) files.push(mofFolder(`file:src/${childRel}`, e.name, m1Count.get(`src/${childRel}`) || 0, 'mof-project'));
  }
  return [...dirs.sort((a, b) => a.name.localeCompare(b.name)), ...files.sort((a, b) => a.name.localeCompare(b.name))];
}

// [impl:uuid:2c64aa7b-9840-4bdc-8b60-2e6e0ae891a2] server.persistRemoveView (R33.8, INVERSE of add-view) — drop a
// class's VIEW-LINK from the Diagram unit in MODEL_STORE (store-only, INV-RM2 prod scenario/index NEVER touched). The
// ModelElement unit file is NEVER touched → re-addable (INV-RM1, NOT a delete). Idempotent: absent link → removed:false
// (INV-RM4). Same UUID path-safety as add-view. Callers (the /remove-view route) do body-parse + HTTP; this does the store write.
function persistRemoveView(diagramUuid: string, elementUuid: string): { ok: boolean; removed?: boolean; views?: number; error?: string; status?: number } {
  const UUID = /^[0-9a-fA-F-]{16,40}$/;
  if (!UUID.test(diagramUuid) || !UUID.test(elementUuid)) return { ok: false, error: 'bad-uuid', status: 400 };
  const dfile = path.join(MODEL_STORE, ...diagramUuid.slice(0, 5).split(''), `${diagramUuid}.scenario.json`);
  if (!fsSync.existsSync(dfile)) return { ok: false, error: 'no-diagram', status: 404 };
  const unit = JSON.parse(fsSync.readFileSync(dfile, 'utf-8'));
  const views: { unit: string }[] = Array.isArray(unit.model.views) ? unit.model.views : [];
  const link = `modelelement:${elementUuid}`;
  const before = views.length;
  unit.model.views = views.filter((v) => v.unit !== link); // drop ONLY the view-link; the ModelElement unit file is NEVER touched (INV-RM1)
  if (unit.model.views.length === before) return { ok: true, removed: false, views: before }; // INV-RM4 absent → no-op
  fsSync.writeFileSync(dfile, JSON.stringify(unit, null, 2) + '\n'); // INV-RM2 store-only (prod scenario/index NEVER touched)
  removeUsedIn(elementUuid, diagramUuid); // R36.5: bidirectional inverse — drop this diagram from the element's usedIn (never one-sided)
  return { ok: true, removed: true, views: unit.model.views.length };
}

// R36.5 usedIn[] BIDIRECTIONAL usage-refs (usage ⟷ Diagram.views). R36.2(c) SIDE-INDEX (architect ca49f1826 / 19b6217be):
// usedIn now lives in a DEDICATED MODEL_STORE usage-index (data/model-store/usage-index.json) keyed by the element's
// CANONICAL deterministic uuid (=keyToUuid(sourceFile::qualifiedName) for a generated M1 unit) — OUTSIDE the element
// file (and OUTSIDE the scanned index shards), so the generated element stays PRISTINE (INV-RM1 strict, never written)
// and usedIn SURVIVES TsToModel re-generation BY CONSTRUCTION (TsToModel never touches the side-index). Transparent
// backend swap: add-view/remove-view callers + GET /api/model/used-in + /api/ior behavior UNCHANGED. Tree-INVISIBLE
// (INV-T byte-diff==0 — usedIn was never in the tree; now not even on the element file). Bidirectional, both sides.
const usageIndexPath = (): string => path.join(MODEL_STORE, '..', 'usage-index.json'); // one level ABOVE the index shards → never scanned as a unit
function readUsageIndex(): Record<string, { kind: string; ref: string }[]> {
  try { return JSON.parse(fsSync.readFileSync(usageIndexPath(), 'utf-8')); } catch { return {}; }
}
function writeUsageIndex(idx: Record<string, { kind: string; ref: string }[]>): void {
  fsSync.mkdirSync(path.dirname(usageIndexPath()), { recursive: true });
  fsSync.writeFileSync(usageIndexPath(), JSON.stringify(idx, null, 2) + '\n');
}
function addUsedIn(elementUuid: string, kind: 'diagram' | 'folder', ref: string): void {
  const UUID = /^[0-9a-fA-F-]{16,40}$/; if (!UUID.test(elementUuid) || !ref) return;
  const idx = readUsageIndex();
  const used = idx[elementUuid] || (idx[elementUuid] = []);
  if (used.some((x) => x.kind === kind && x.ref === ref)) return; // dedup → idempotent
  used.push({ kind, ref }); writeUsageIndex(idx); // R36.2(c): element file NEVER written (INV-RM1 strict)
}
function removeUsedIn(elementUuid: string, ref: string): void {
  const UUID = /^[0-9a-fA-F-]{16,40}$/; if (!UUID.test(elementUuid) || !ref) return;
  const idx = readUsageIndex(); const arr = idx[elementUuid]; if (!Array.isArray(arr)) return;
  const kept = arr.filter((x) => x.ref !== ref);
  if (kept.length !== arr.length) { if (kept.length) idx[elementUuid] = kept; else delete idx[elementUuid]; writeUsageIndex(idx); }
}
// [impl:uuid:2f44e112-ce56-4fe5-892c-a55aab5f3bf3] server.resolveUsedIn (Method e48832b2, Class c0a0921d, off UC
// e46c6407 modelElement.usedInResolver) — R36.5 where-used RESOLVER, R36.2(c) reads the SIDE-INDEX (resolve-at-detail):
// the back-refs are the usage-index entry for the element's canonical uuid (survives re-gen; element file pristine).
// Served via GET /api/model/used-in/<uuid> + attached to the unit model at /api/ior. Behavior identical to R36.5.
function resolveUsedIn(elementUuid: string): { kind: string; ref: string }[] {
  const UUID = /^[0-9a-fA-F-]{16,40}$/; if (!UUID.test(elementUuid)) return [];
  return readUsageIndex()[elementUuid] || [];
}

// [impl:uuid:37c08fd5-3880-47e9-bb8b-4dcb15244a89] server.reconcileCanonical (Method 5530ea76) — R36.1/R36.2 part-2
// A-merge (architect design 0f13d9d87; the 119ca06d9 ior:-prefix fix is an impl-edit to THIS method, same unit).
// COMPUTE-ON-READ at /api/ior — NEVER writes either file, so INV-T (tree
// bytes) + isolation (prod untouched) + INV-RM1 (generated M1 pristine) hold BY CONSTRUCTION. Dedup by the
// deterministic key keyToUuid(sourceFile::qualifiedName) (R32.2 = the generated M1's OWN uuid). Field-precedence:
// TRACEABILITY wins identity/chain (name + methods/implementations/tests/chain links — left untouched on the base),
// generated M1 wins structure/signature, instanceOf facets UNION, usedIn from the R36.2 side-index. Enriches the
// resolution's model IN MEMORY only.
// R40.10 BUG-A — surface a task's decline-minted ChangeRequests by their DURABLE backref (CR.task / CR.ownerIor → this
// task), NOT the losable task.changeRequests forward mirror. MEASURED: 0 tasks carry a non-empty changeRequests[] on
// disk (the corruption/reset history wiped every forward mirror) while the CR units survive — so a declined CR was
// INVISIBLE on the task surface Tron declined it from (gate-the-AC-surface). The backref (task/ownerIor on the CR) is
// durable. COMPUTE-ON-READ at /api/ior — NEVER writes the file (INV-T byte-diff==0); unions any live mirror so a
// populated mirror is never lost. The client renderChangeRequests reads model.changeRequests → renders each CR reachable.
// T37.26 — the DERIVED current task = the In-Progress task with the MAX lastAdvancedAt (CurrentSprint.ts:247, the value
// Tron watches; single-source with the pin). attachTaskPinRole tags a Task's SERVED model with pinRole ∈ {current, other}
// so the action-bar's Set-as-Current matrix (current→hide, everyone-else→show) resolves from ONE server-side truth — no
// client re-derivation, no second source. Compute-on-read, NEVER persisted (the seam never sees pinRole). 'next' role is
// deferred to the architect's set-next ruling.
function derivedCurrentTaskUuid(idx: ScenarioIndex): string {
  let best = '', bestAt = '';
  for (const u of idx.list()) {
    const unit = idx.get(u); if (!unit || unit.ior !== 'ior:class:Task') continue;
    const m = unit.model as Record<string, unknown>;
    if (deriveStatusEnum(String(m.statusChecklist ?? '')) !== 'In Progress') continue; // derive (not stored status) — the same 4-state source the pin uses
    const at = String(m.lastAdvancedAt || '');
    if (best === '' || at.localeCompare(bestAt) > 0) { best = String(m.uuid || u); bestAt = at; } // max ISO timestamp; untimestamped ranks last
  }
  return best;
}
function attachTaskPinRole(taskUuid: string, m: Record<string, unknown>, idx: ScenarioIndex): void {
  m.pinRole = derivedCurrentTaskUuid(idx) === taskUuid ? 'current' : 'other';
}
// T37.26 — the task's OWN MD href, computed server-side so the bar's 📄 Open-Task-file ACTION has ONE source (the inline
// body link is removed — the bar is the action surface). Mirrors R22.1 taskMdHref: sourceFile (its own .md, not the shared
// planning.md) else the parent sprint's PINNED slug + the task slug. Compute-on-read, never persisted.
function attachTaskMdHref(taskUuid: string, m: Record<string, unknown>, idx: ScenarioIndex): void {
  const sf = String(m.sourceFile || '').replace(/^ior:file:/, '');
  if (sf && !/(^|\/)planning\.md$/.test(sf)) { m.taskMdHref = `/md/${sf}`; return; }
  const slug = String(m.slug || '');
  if (!slug) { m.taskMdHref = ''; return; }
  let sprintSlug = '';
  for (const u of idx.list()) { // the parent sprint = the Sprint unit whose tasks[] contains this task (pinned slug, drift-proof)
    const su = idx.get(u); if (su?.ior !== 'ior:class:Sprint') continue;
    const tasks = Array.isArray((su.model as Record<string, unknown>).tasks) ? ((su.model as Record<string, unknown>).tasks as string[]) : [];
    if (tasks.some((t) => String(t).replace('ior:instance:', '') === taskUuid)) { sprintSlug = String((su.model as Record<string, unknown>).slug || ''); break; }
  }
  m.taskMdHref = sprintSlug ? `/md/scrum.pmo/sprints/${sprintSlug}/${slug}.md` : '';
}

// design-control-visibility-by-status-not-membership.md (architect ed3442d10): the /api/ior Task READ boundary must
// surface the DERIVED status so control visibility (action-bar Approve/Decline) follows STATUS, not graph MEMBERSHIP. As
// stored, model.status is undefined for a non-eager task (deep-link / prior sprint / post-rotation / ref-from-/trace) →
// the action-bar hid Approve/Decline on Tron's own actionable QA-Review task. FIX: m.status = deriveStatusEnum(checklist)
// — the status-getter north-star applied at READ, single-source with the FSM. COMPUTE-ON-READ: mutates only the SERVED
// model object, NEVER persists (mirror the attach* pattern; INV-T byte-diff==0 on disk).
function attachTaskStatus(m: Record<string, unknown>): void {
  m.status = deriveStatusEnum(String(m.statusChecklist ?? ''));
}

function attachTaskChangeRequests(taskUuid: string, m: Record<string, unknown>, idx: ScenarioIndex): void {
  const bare = (s: unknown) => String(s || '').replace('ior:instance:', '');
  const crs = new Set<string>((Array.isArray(m.changeRequests) ? m.changeRequests as string[] : []).map(bare).filter(Boolean));
  for (const u of idx.list()) {
    const cu = idx.get(u);
    if (cu?.ior !== 'ior:class:ChangeRequest') continue;
    const cm = cu.model as Record<string, unknown>;
    if (bare(cm.task) === taskUuid || bare(cu.ownerIor) === taskUuid) crs.add(String(cm.uuid || u));
  }
  m.changeRequests = [...crs].map((x) => `ior:instance:${x}`);
}

function reconcileCanonical(uuid: string, m: Record<string, unknown>, ior?: string): void {
  // R36.1: UseCase → UmlUseCase M2 projection (server.projectUmlUseCase — rides this reconcileCanonical Impl
  // 37c08fd5). UNION the UmlUseCase metaclass facet into instanceOf so renderFacet draws the ellipse on the
  // tree/diagram. COMPUTE-ON-READ — never writes the file (INV-T byte-diff==0). Runs BEFORE the sourceFile/qn
  // early-return below because a UseCase unit carries no sourceFile/qualifiedName.
  if (ior === 'ior:class:UseCase') {
    const umlUseCaseFacet = 'ior:instance:792cd09c-8a94-48da-abc6-b890d5f880ea';
    const io = Array.isArray(m.instanceOf) ? m.instanceOf as string[] : [];
    if (!io.includes(umlUseCaseFacet)) m.instanceOf = [...io, umlUseCaseFacet];
  }
  const sourceFileRaw = String(m.sourceFile || ''); const qn = String(m.qualifiedName || m.name || '');
  if (!sourceFileRaw || !qn) return; // no key → no counterpart; base IS canonical
  // R36.1/R36.2 (A) fix (verified: 5 counterpart classes matched only after this): traceability units store
  // sourceFile as `ior:file:<repo-rel-path>`, but the generated M1 keys off the PLAIN repo-rel path
  // (keyToUuid(rel(sf)::qn), R32.2 mkKey). Strip the ior:*: prefix so the dedup key matches the M1's uuid —
  // without this the merge NEVER fires (every /api/ior showed base-only; the architect-caught defect).
  const sourceFile = sourceFileRaw.replace(/^ior:(file|instance|class):/, '');
  const key = keyToUuid(`${sourceFile}::${qn}`); // = the generated M1's uuid by construction (R32.2 mkKey)

  // Trace base (prod) → merge the generated M1 counterpart from MODEL_STORE (deterministic key). Files stay pristine.
  if (!isModelUnit(uuid) && key !== uuid && isModelUnit(key)) {
    let g: Record<string, unknown> | undefined;
    try { g = (new ScenarioIndex(MODEL_STORE).get(key) as { model?: Record<string, unknown> } | undefined)?.model; } catch { /* no counterpart */ }
    if (g) {
      const facets = new Set<string>([...(Array.isArray(m.instanceOf) ? m.instanceOf as string[] : []), ...(Array.isArray(g.instanceOf) ? g.instanceOf as string[] : [])]);
      if (facets.size) m.instanceOf = [...facets]; // UNION — never drop a side's facet
      for (const f of ['members', 'memberOf', 'kind', 'relatesTo', 'relatedFrom', 'relations', 'visibility', 'parameters', 'returnType', 'docs', 'parentClass']) {
        if (g[f] !== undefined) m[f] = g[f]; // generated M1 wins structure/signature (source is truth)
      }
      m.canonicalKey = key; // the M1 alias key — both resolve to this ONE canonical unit
    }
  }
  // usedIn from the R36.2 side-index (keyed by the canonical/M1 key; the M1's uuid IS that key)
  const usedIn = resolveUsedIn(isModelUnit(uuid) ? uuid : key);
  if (usedIn.length) m.usedIn = usedIn;
}

// R33.10 BUG-B (PLANTUML docker re-wire, PO): the prod host runs a plantuml-server container. Render via HTTP to it
// (deflate + PlantUML-base64 → GET /svg/<encoded>) instead of a local `plantuml` binary. The URL is R31.7 typed-config
// — env PLANTUML_URL, else the Config unit's model.plantumlUrl, else the docker default — never hardcoded (so it can't
// be lost/wrong again). Callers keep a 501 fallback when the server is unreachable.
function plantumlBaseUrl(): string {
  const clean = (u: string): string => u.replace(/\/+$/, '');
  if (process.env.PLANTUML_URL) return clean(process.env.PLANTUML_URL);
  try {
    const cfg = JSON.parse(fsSync.readFileSync(path.join(PROD_INDEX, 'c', 'o', 'n', 'f', 'i', 'config-singleton-0000-000000000001.scenario.json'), 'utf-8'));
    if (cfg?.model?.plantumlUrl) return clean(String(cfg.model.plantumlUrl));
  } catch { /* fall through to default */ }
  return 'http://localhost:8089';
}
// PlantUML text encoding: raw-deflate → PlantUML's custom base64 (alphabet 0-9A-Za-z-_), the canonical plantuml-encoder
// (0-pads the final 1-2 bytes). Result goes in the URL path: GET <base>/svg/<encoded>.
function encodePlantuml(text: string): string {
  const data = zlib.deflateRawSync(Buffer.from(text, 'utf8'));
  const e6 = (n: number): string => { let b = n & 0x3F; if (b < 10) return String.fromCharCode(48 + b); b -= 10; if (b < 26) return String.fromCharCode(65 + b); b -= 26; if (b < 26) return String.fromCharCode(97 + b); b -= 26; return b === 0 ? '-' : b === 1 ? '_' : '?'; };
  const a3 = (b1: number, b2: number, b3: number): string => e6(b1 >> 2) + e6(((b1 & 0x3) << 4) | (b2 >> 4)) + e6(((b2 & 0xF) << 2) | (b3 >> 6)) + e6(b3 & 0x3F);
  let r = '';
  for (let i = 0; i < data.length; i += 3) r += a3(data[i], i + 1 < data.length ? data[i + 1] : 0, i + 2 < data.length ? data[i + 2] : 0);
  return r;
}

function pumlChildren(els: MofEl[]): MofNode[] {
  const out: MofNode[] = [];
  try {
    const base = path.join(__dirname, '../../..', 'scrum.pmo', 'sprints');
    for (const sp of fsSync.readdirSync(base).sort()) {
      let entries: string[] = [];
      try { entries = fsSync.readdirSync(path.join(base, sp, 'diagrams')); } catch { continue; }
      for (const f of entries) if (f.endsWith('.puml')) out.push(mofFolder(`puml-src:${sp}/diagrams/${f}`, f, 0, 'puml', 'puml')); // R33.6.3-fix: ref must carry the FULL relpath incl 'diagrams/' (files live at <sprint>/diagrams/<f>) — else /md fetch + import-puml 404
    }
  } catch { /* no sprints dir → just imported artifacts */ }
  for (const x of els.filter((x) => x.ior === 'ior:class:PumlArtifact')) out.push(mofFolder(String(x.m.uuid || x.uuid), String(x.m.name || 'puml'), 0, 'puml', 'pumlartifact'));
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
// R35.4 DRY fix (architect cb9168e8c) — the ONE ordered-Sprint source: ior:class:Sprint by number (= /trace's
// sprints.overview order). SHARED so the /api/trace/sprints endpoint (which /trace consumes) AND traceabilityRoots()
// derive the SAME sprint set+order → the traceability folder CANNOT drift from /trace (parity BY CONSTRUCTION). Zero fork.
function sprintOverviewNodes(idx: ScenarioIndex): Array<{ uuid: string; name: string; number: number; taskCount: number }> {
  const sprints = idx.list().map((u) => {
    const g = idx.get(u);
    if (g?.ior !== 'ior:class:Sprint') return null;
    return { uuid: u, name: String(g.model?.name || ''), number: Number(g.model?.number || 0), taskCount: Array.isArray(g.model?.tasks) ? (g.model!.tasks as string[]).length : 0 };
  }).filter(Boolean) as Array<{ uuid: string; name: string; number: number; taskCount: number }>;
  return sprints.sort(bySprintDisplayOrder); // R40.50: the ONE canonical order (was ASC a.number-b.number, Tron's bug) → /model + traceability folder inherit DESCENDING by construction
}

// R35.4 (uncredited helper of mofChildren b6c88d83, UC beb0af0d mofTree.traceabilityFolder) — the traceability folder
// mirrors /trace's TOP-LEVEL by construction: the CurrentSprint singleton node + the ordered Sprints (the SHARED
// sprintOverviewNodes source). Each node expands via the EXISTING /api/trace/children walk (CurrentSprint→slots,
// Sprint→tasks→req→chain — a plain uuid ≠ a MOF ref → routes to the trace walk, no reinvented hierarchy, no fork).
// Was flat-497 Requirement roots (drifted from /trace's sprint structure — the reopened DRY bug).
function traceabilityRoots(): MofNode[] {
  const tidx = new ScenarioIndex(path.join(__dirname, '../../..', 'scenario', 'index'));
  const out: MofNode[] = [];
  // CurrentSprint node — SAME singleton uuid /trace uses (rb-trace-tree) → its expand rides the identical CurrentSprint slots.
  out.push(mofFolder('current-sprint-singleton-0000-000000000001', 'CurrentSprint', 3, 'trace', 'currentsprint'));
  for (const s of sprintOverviewNodes(tidx)) out.push(mofFolder(s.uuid, sprintDisplayName(s.name, s.number), s.taskCount, 'trace', 'sprint')); // R40.4-phase2: ONE renderer, 'Sprint N: title'
  return out;
}
function mofChildren(idx: ScenarioIndex, uuid: string): MofNode[] | null {
  if (!/^(mof-m1|mof-m2|project:|file:|rawbin:|dir:)/.test(uuid)) return null;
  const { els, m1, m2, m1Roots } = mofModelEls(idx);
  const instancesOf = (mcU: string): MofEl[] => m1.filter((x) => (Array.isArray(x.m.instanceOf) ? (x.m.instanceOf as string[]) : []).map(MOF_STRIP).includes(mcU));
  const isSrc = (x: MofEl): boolean => String(x.m.sourceFile || '').startsWith('src/');
  if (uuid === 'mof-m2') return m2.map((mc) => { const mcU = String(mc.m.uuid || mc.uuid); return mofFolder('mof-m2:' + mcU, String(mc.m.name || ''), instancesOf(mcU).length, String(mc.m.kind || 'class'), 'modelelement'); }).sort((a, b) => a.name.localeCompare(b.name));
  if (uuid.startsWith('mof-m2:')) return instancesOf(uuid.slice('mof-m2:'.length)).map(mofElNode).sort((a, b) => a.name.localeCompare(b.name));
  if (uuid === 'mof-m1') {
    const rawbinFiles = new Set(m1Roots.filter(isSrc).map((x) => String(x.m.sourceFile)));
    const otherFiles = [...new Set(m1Roots.filter((x) => !isSrc(x)).map((x) => String(x.m.sourceFile || 'model')))].sort();
    return [
      ...(rawbinFiles.size ? [mofFolder('project:RawBin', 'RawBin', 4, 'mof-project')] : []), // S33-P3f-1 + R35.4: RawBin has 4 folders (ts/puml/diagrams/traceability)
      ...otherFiles.map((sf) => mofFolder('project:' + sf, sf, m1Roots.filter((x) => String(x.m.sourceFile || 'model') === sf).length, 'mof-project')),
    ];
  }
  if (uuid === 'project:RawBin') { // S33-P3f-1 (INV-F-2): RawBin → 3 artifact FOLDERS (ts / puml / diagram) over MODEL_STORE — reuse rb-trace-tree folders, no fork
    const tsCount = new Set(m1Roots.filter(isSrc).map((x) => String(x.m.sourceFile))).size; // file-folders of generated M1 classes
    const pumlCount = els.filter((x) => x.ior === 'ior:class:PumlArtifact').length;
    const diagramCount = els.filter((x) => x.ior === 'ior:class:Diagram').length;
    return [
      mofFolder('rawbin:ts', 'ts', tsCount, 'mof-project'),
      mofFolder('rawbin:puml', 'puml', pumlCount, 'puml'),
      mofFolder('rawbin:diagram', 'diagrams', diagramCount, 'diagram'), // R33.3 AC3: PLURAL label; Diagram ITEMS live directly under diagrams/
      mofFolder('rawbin:traceability', 'traceability', traceabilityRoots().length, 'trace'), // R35.4: 4th folder → expands into the real Req→…→Test trace tree
    ];
  }
  if (uuid === 'rawbin:ts' || uuid.startsWith('dir:')) { // R33.10: ts/ = the FULL src/ directory tree (ALL 123 .ts + folder hierarchy), not just the ~25 files with generated M1 elements (INV-T1/T2 completeness+folders)
    const m1Count = new Map<string, number>();
    for (const x of m1Roots.filter(isSrc)) { const sf = String(x.m.sourceFile); m1Count.set(sf, (m1Count.get(sf) || 0) + 1); } // per-file generated-element count → file: leaf childCount
    return sourceDirTree(uuid === 'rawbin:ts' ? '' : uuid.slice('dir:'.length), m1Count);
  }
  if (uuid === 'rawbin:traceability') return traceabilityRoots(); // R35.4: 4th folder expands into the REAL trace tree (each Requirement root walks via /api/trace/children — reuse rb-trace-tree, no fork)
  if (uuid === 'rawbin:puml') return pumlChildren(els); // R33.5 item4: 55 source .puml + imported artifacts
  if (uuid === 'rawbin:diagram') return els.filter((x) => x.ior === 'ior:class:Diagram').map((x) => mofFolder(String(x.m.uuid || x.uuid), String(x.m.name || 'Diagram'), 0, 'diagram', 'diagram')).sort((a, b) => a.name.localeCompare(b.name));
  if (uuid.startsWith('file:')) { const sf = uuid.slice('file:'.length); return m1Roots.filter((x) => String(x.m.sourceFile || '') === sf).map(mofElNode).sort((a, b) => a.name.localeCompare(b.name)); }
  if (uuid.startsWith('project:')) { const sf = uuid.slice('project:'.length); return m1Roots.filter((x) => String(x.m.sourceFile || 'model') === sf).map(mofElNode).sort((a, b) => a.name.localeCompare(b.name)); }
  return [];
}
function mofLayerRoots(idx: ScenarioIndex): MofNode[] {
  const { m2, m1Roots } = mofModelEls(idx);
  const projectCount = (m1Roots.some((x) => String(x.m.sourceFile || '').startsWith('src/')) ? 1 : 0) + new Set(m1Roots.filter((x) => !String(x.m.sourceFile || '').startsWith('src/')).map((x) => String(x.m.sourceFile || 'model'))).size;
  return [
    mofFolder('mof-m2', 'M2 · UML Profile', m2.length, 'mof-layer', 'mof-layer'),
    mofFolder('mof-m1', 'M1 · Projects', projectCount, 'mof-layer', 'mof-layer'),
  ];
}

// R40.8 — resolve a unit's REAL on-disk shard path via the ONE shard rule, single-sourced with PROD_INDEX
// (ScenarioIndex.filePath — the SAME function get()/has() use, never a re-derived or composed path). FAIL-CLOSED:
// if the unit is not actually on disk, return null → the caller 404s; the UI NEVER shows a guessed/composed path.
// [impl:uuid:3ee03bde-aa3c-4d95-92c1-71e9c599f46a] ServerManagerApi.unitRealPath (/api/unit/<uuid>/path, shard-rule single-sourced, fail-closed)
function unitRealPath(uuid: string): { realPath: string; dir: string } | null {
  const idx = new ScenarioIndex(PROD_INDEX);
  if (!idx.has(uuid)) return null;                                   // fail-closed: no on-disk file → NO path (never composed/guessed)
  const repoRoot = path.join(__dirname, '../../../');
  const realPath = path.relative(repoRoot, idx.filePath(uuid));      // reuse the ONE shard rule; repo-relative real path
  return { realPath, dir: path.dirname(realPath) };
}

// R40.10 — TaskQaVerdict: the owner's QA verdict on a task, recorded AS DATA (not asserted). approveByOwner makes
// "Done requires Tron QA" PROVABLE — it writes approvedBy/approvedAt onto the task and only then flips status→Done,
// and it FAIL-CLOSED refuses unless the task already carries the evidence (status 'QA Review' = the pipeline advanced
// it, work+tests done) → a Done can NEVER be manufactured from an un-reviewed task. Extracted as named functions so
// the verdict logic is gateable directly (not inline-in-handler). Owner-gate is applied by the caller (requireOwnerHttp).
// [impl:uuid:36b6ce2e-efe9-4ad8-9382-104ee07d0266] TaskQaVerdict.approveByOwner (owner-gated; approvedBy/approvedAt as data; evidence-precondition; flips Done-gate)
function approveByOwner(idx: ScenarioIndex, taskUuid: string, approver: { id: string; name: string }, now: string): { code: number; payload: Record<string, unknown> } {
  const unit = idx.get(taskUuid);
  if (!unit || unit.ior !== 'ior:class:Task') return { code: 404, payload: { ok: false, error: 'task-not-found' } };
  const m = unit.model as any;
  if (!APPROVE_STATUSES.includes(m.status as typeof APPROVE_STATUSES[number])) return { code: 409, payload: { ok: false, error: 'no-evidence', detail: `status '${m.status}' not in ${JSON.stringify(APPROVE_STATUSES)} — cannot manufacture Done` } }; // R40.37: same set the client affordance hides on (anti-drift)
  // AC-1 (provenance, PO ruling): approvedBy = the owner's STABLE identity uuid (NOT resolveOwner's 'sm_session' placeholder,
  // NOT a truncated token, NEVER the raw OWNER_TOKEN credential — hygiene #0). approvedByName = the human label.
  // ★ NAMED GAP (architect 8f4f70430, not silent): the verdict is ATTRIBUTABLE (owner-only endpoint, 403 non-owner) +
  // TAMPER-EVIDENT (R40.45 bypass-gate detects a direct unit-file write) — but NOT YET UNFORGEABLE. The root-only-HMAC
  // server signature is a B1-gated follow-up; do NOT over-claim.
  const approvedIntegrity = 'attributable + tamper-evident (owner-gated endpoint + R40.45 bypass-gate); NOT yet unforgeable — root-only HMAC signature is a B1-gated follow-up';
  // AC-2 ATOMIC (R40.45, PO): fold approvedBy/approvedAt INTO the SAME UnitController.apply intent → validate→apply→persist
  // is ONE transaction. A refused advance (evidence-gate / step-legality) throws BEFORE any write → NOTHING persists. The OLD
  // code did idx.put(verdict) FIRST then threw on refuse, leaving approvedBy on disk on a 409 = the leak Tron hit. Now the
  // seam writes the verdict WITH the Done tick + derives model.status (sole 4-state writer) + EMITS unit-changed (AC-3 live).
  try {
    UnitController.apply(idx, 'ior:class:Task', taskUuid, { target: 'Done', approvedBy: approver.id, approvedByName: approver.name, approvedAt: now, approvedIntegrity }, { actor: approver, publish: publishUnitChanged });
  } catch (e: any) {
    return { code: 409, payload: { ok: false, error: 'seam-refused', detail: String(e?.message || e) } }; // ATOMIC: nothing was persisted (validate threw before apply/persist)
  }
  const after = idx.get(taskUuid)!.model as any;
  return { code: 200, payload: { ok: true, status: after.status, approvedBy: after.approvedBy, approvedAt: after.approvedAt } };
}

// [impl:uuid:90089602-d819-4df3-80a9-ef5524931ae3] TaskQaVerdict.declineToChangeRequest (owner-gated; mints ior:class:ChangeRequest linked to task/req)
function declineToChangeRequest(idx: ScenarioIndex, taskUuid: string, ownerTok8: string, reason: string, now: string): { code: number; payload: Record<string, unknown> } {
  const unit = idx.get(taskUuid);
  if (!unit || unit.ior !== 'ior:class:Task') return { code: 404, payload: { ok: false, error: 'task-not-found' } };
  const m = unit.model as any;
  const crUuid = crypto.randomUUID();
  const requirements = Array.isArray(m.requirements) ? m.requirements : [];   // link the CR to the task's requirement(s)
  UnitController.create(idx, 'ior:class:ChangeRequest', crUuid, { ior: 'ior:class:ChangeRequest', model: { uuid: crUuid, name: `Change Request: ${m.name || taskUuid}`, task: `ior:instance:${taskUuid}`, requirements, reason, createdBy: ownerTok8, createdAt: now, status: 'Open' }, ownerIor: `ior:instance:${taskUuid}` }, { publish: publishUnitChanged }); // R37.11: new ChangeRequest via the seam (create; emit → appears live)
  // (5a) DERIVED-STATUS (architect 794c8c23a): reopen via the SEAM — TaskPolicy unticks QA Review/Done so deriveStatusEnum
  // derives 'In Progress' (the SOLE status writer; NO direct m.status), the raw idx.put is GONE (UnitController persists ONCE
  // + EMITS unit-changed → the task re-renders LIVE, no reload), and the CR-link rides the SAME transaction. Declined →
  // back into the pipeline; NEVER silently Done. A refused reopen (task not in QA-Review/Done) throws → 409, nothing written.
  let reopened;
  try {
    reopened = UnitController.apply(idx, 'ior:class:Task', taskUuid, { reopen: true, addChangeRequest: `ior:instance:${crUuid}` }, { actor: ownerTok8, publish: publishUnitChanged });
  } catch (e: any) {
    return { code: 409, payload: { ok: false, error: 'reopen-refused', detail: String(e?.message || e), changeRequest: crUuid } }; // CR minted (create persisted); status reopen refused
  }
  return { code: 200, payload: { ok: true, changeRequest: crUuid, status: String((reopened.model as Record<string, unknown>).status || '') } };
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  trackClient(req);
  try {
    const rawUrl = req.url || '/';
    let filepath = rawUrl.split('?')[0];
    const urlParams = new URLSearchParams(rawUrl.includes('?') ? rawUrl.split('?')[1] : '');

    // R31.2/R31.3 server-manager OWNER-GATE choke-point (by construction, INV-G1): the /server-manager PAGE AND
    // every /api/server-manager/* route are gated HERE first by the SOLE assertOwner guard — no route (page or API)
    // can bypass it, and a future sub-route added inside this block inherits the gate. Handlers below run ONLY for
    // an authenticated OWNER; add R31.4 routes inside this block. (Page-route ?token= = flagged R31.4 hardening.)
    if (filepath === '/server-manager' || filepath.startsWith('/api/server-manager/') || filepath.startsWith('/api/unit/')) {
      if (!requireFeatureAccessHttp(req, res, 'Server Manager')) return; // R31.8: data-driven ServerManager Feature gate (was requireOwnerHttp) — access by allowedUsers membership, INV-F6
      // R40.8: /api/unit/<uuid>/path — the REAL measured shard path (single-sourced, fail-closed). ServerManagerApi family
      // → gated HERE by construction (existence-oracle stays owner-only). No composed/guessed path ever leaves the server.
      const unitPathMatch = req.method === 'GET' ? filepath.match(/^\/api\/unit\/([0-9a-fA-F-]+)\/path$/) : null;
      if (unitPathMatch) {
        const rp = unitRealPath(unitPathMatch[1]);
        if (!rp) { res.writeHead(404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ ok: false, error: 'not-on-disk' })); return; } // fail-closed
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ ok: true, ...rp }));
        return;
      }
      if (req.method === 'GET' && filepath === '/server-manager') { // R31.3 owner-only page shell (6th AC: non-owner already 403'd above, shell never leaks)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(serverManagerPage());
        return;
      }
      if (req.method === 'GET' && filepath === '/api/server-manager/whoami') { // minimal gated endpoint (exercises the gate)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, owner: true, token8: ServerManagerGuard.playerTokenFrom(req).slice(0, 8) }));
        return;
      }
      if (req.method === 'GET' && filepath === '/api/server-manager/tree') { // R31.3/R31.4 read-only otmux tree
        const sessions = await OtmuxBridge.readSessionTree();
        // R31.4 step-1: also emit itemView `roots` (3-level, inline children) for the shared rb-trace-tree renderer —
        // otmuxSession → otmuxWindow → otmuxPane. pane uuid = the STABLE pane_id (%N) = the terminal target.
        const sessionRows = sessions.map((s) => ({
          // R31.3 badge-via-references: session carries hasChildren too (windows/panes already do) — parity with the
          // scenario tree so the chevron/count is deterministic (client stamps dataset.childRefCount from children.length).
          uuid: 'sess:' + s.name, type: 'otmuxSession', name: s.name, hasChildren: s.windows.length > 0,
          children: s.windows.map((w) => ({
            // R31.3: real window label 'window N' (NOT the active-command placebo w.name) + explicit hasChildren
            // (belt-and-suspenders; the client also derives the chevron from children.length).
            uuid: 'win:' + s.name + ':' + w.index, type: 'otmuxWindow', name: 'window ' + w.index, hasChildren: true,
            children: w.panes.map((p) => ({
              uuid: p.paneId, type: 'otmuxPane', name: p.label + (p.title ? '  —  ' + p.title : ''), hasChildren: false,
            })),
          })),
        }));
        // R41 RE-ROOT (Tron's open question — Server Manager showed a FLAT session list, no client surface for WODA.prod):
        // re-root under the WODA.prod deployment node (fc327458), MODEL-DRIVEN (read the node unit, don't hardcode). The
        // node is the single ROOT row; the live otmux sessions are its CHILDREN (a LIVE LENS — read fresh here, never a
        // mirrored copy); the node's 4 measured deploymentRefs (sshd_config · host key · .env domain · LE cert) surface as
        // leaf rows so the deployment surface is visible where the owner works. Fail-OPEN to the flat lens if the node unit
        // is ever missing — never break the live session surface. The UML-diagram facet (renderedBy) is untouched: this ADDS.
        let roots: any[] = sessionRows;
        const NODE_UUID = 'fc327458-03d1-4b90-847d-ab52a7d82237';
        try {
          // R40.11 slice-2/3 WIRING: the ONE served emitter — resolves the node's deploymentRefs to the REAL
          // slice-1 typed units (by sourceRole) + emits real 'deploymentUnit' rows. Replaces the deleted inline
          // synthetic 'depref:' construction (the row shape that hung the drawer). Same fn the gate asserts (path-unify).
          roots = OtmuxBridge.buildServerManagerTree(sessions, new ScenarioIndex(path.join(__dirname, '../../../scenario/index')), NODE_UUID);
        } catch (e: any) {
          console.warn(`[server-manager] WARN: WODA.prod re-root failed (${e?.message || e}) → tree DEGRADED to flat session list (fail-open).`);
          roots = [{ uuid: 'depnode:error', type: 'notice', name: '⚠ WODA.prod deployment node re-root failed — showing flat session list', hasChildren: sessionRows.length > 0, children: sessionRows }];
        }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ ok: true, roots, sessions })); // `sessions` kept for the current display shell (removed when step-2 switches to rb-trace-tree)
        return;
      }
      if (req.method === 'GET' && filepath === '/api/server-manager/rc') { // R40.1 per-pane RC deep-link (owner-gated by the block above)
        const paneId = String(urlParams.get('pane') || '').trim();
        if (!paneId) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"ok":false,"error":"pane required"}'); return; }
        const link = await OtmuxBridge.resolveRcLink(paneId); // { url: string|null, reason?, agent? } — url=null is fail-closed, NOT an error
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ ok: true, ...link })); // client opens link.url (app-else-web) OR shows link.reason when null
        return;
      }
      if (req.method === 'POST' && filepath === '/api/server-manager/session') { // R31.4-PRE/B1: mint the httpOnly owner cookie (caller already owner-gated above via the LIVE x-player-token)
        const sid = crypto.randomUUID(); // RANDOM — NOT OWNER_TOKEN (INV-G2 stays 1)
        smSessions.set(sid, { owner: true, expiresAt: Date.now() + 30 * 60 * 1000, token: ServerManagerGuard.playerTokenFrom(req) }); // R31.8: store the minting caller's token for data-driven feature membership
        res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': `sm_session=${sid}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=1800` });
        res.end('{"ok":true}');
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{"error":"not-found"}');
      return;
    }

    // API: bug status update
    // R31.8b FeatureManager VIEW — membership-gated (requireFeatureAccess 'Feature Manager', INV-F6): the page shell +
    // the read-only listFeatures. Distinct from the WRITE below (POST, HARDCODED owner). The condition matches only the
    // page + the GET api, so POST /api/feature-manager falls through to the owner-gated writer.
    if (req.method === 'GET' && filepath === '/model') { // R32.9 (D): gated Model-Driven Code Quality view page
      if (!requireFeatureAccessHttp(req, res, 'Model-Driven Code Quality')) return; // INV-D4 fail-closed: non-member → 403, never leaks the shell
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
      res.end(serverModelPage());
      return;
    }
    if (filepath === '/feature-manager' || (req.method === 'GET' && filepath === '/api/feature-manager')) {
      if (!requireFeatureAccessHttp(req, res, 'Feature Manager')) return; // VIEW-open = membership
      if (req.method === 'GET' && filepath === '/feature-manager') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(featureManagerPage());
        return;
      }
      if (req.method === 'GET' && filepath === '/api/feature-manager') {
        // R31.8c gap-B: serve the itemView ROOTS (real Feature units) for the native tree-seed (was the superseded
        // listFeatures reshape). The client (feature-manager.ts) sets tree.items = roots.
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ ok: true, roots: FeatureManager.featureRoots(userProfiles as unknown as Map<string, { token: string; name?: string; phone?: string; avatar?: string }>) })); // R31.8c round-4 FIX-A1: inline allowedUsers children for live grant/revoke reconcile
        return;
      }
    }
    // R31.8c NODE-1: owner-gated user search for granting — search live profiles + alt-identity units → masked/ranked
    // hits (each carries the REAL token = the grant key). HARDCODED owner (requireOwnerHttp, INV-F4) — it exposes tokens
    // to the admin, so it is a root-of-trust read, NOT the data-driven membership gate.
    if (req.method === 'GET' && filepath === '/api/feature-manager/users') {
      if (!requireOwnerHttp(req, res)) return;
      const q = new URLSearchParams((req.url || '').split('?')[1] || '').get('q') || '';
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ ok: true, ...FeatureManager.searchUsers(q, userProfiles) }));
      return;
    }
    // R31.8 FeatureManager grant/revoke — ROOT-OF-TRUST (INV-F4): HARDCODED owner gate (requireOwnerHttp→assertOwner),
    // NOT the data-driven feature gate → a non-owner (even a ServerManager member) CANNOT self-grant/escalate. Mirrors
    // Feature.allowedUsers[] ↔ profile.features[] both sides atomically. Distinct path (/api/feature-manager) so it is
    // NOT swallowed by the /api/server-manager/* data-driven choke-point.
    if (req.method === 'POST' && filepath === '/api/feature-manager') {
      if (!requireOwnerHttp(req, res)) return; // HARDCODED owner ONLY (root-of-trust)
      let body = '';
      req.on('data', (chunk: Buffer) => body += chunk);
      req.on('end', () => {
        try {
          const { action, feature, token } = JSON.parse(body || '{}');
          if ((action !== 'grant' && action !== 'revoke') || !feature || !token) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"bad-request"}'); return; }
          const r = action === 'grant'
            ? FeatureManager.grantFeature(String(feature), String(token), userProfiles, saveProfiles)
            : FeatureManager.revokeFeature(String(feature), String(token), userProfiles, saveProfiles);
          addLog(`[feature-manager] ${action} feature=${String(feature).slice(0, 8)} token=${String(token).slice(0, 8)} ok=${r.ok}${r.error ? ' err=' + r.error : ''}`);
          res.writeHead(r.ok ? 200 : 404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(r));
        } catch { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"bad-json"}'); }
      });
      return;
    }
    // R31.8c: owner-gated GET → MASKED full profile of a granted user by OPAQUE id (FIX-2 sha256[:16]) → backs
    // rb-profile-detail. INV-F7: server resolves id→token→profile; response carries ONLY masked display, no raw token.
    if (req.method === 'GET' && filepath === '/api/feature-manager/granted-user') {
      if (!requireOwnerHttp(req, res)) return; // owner-gated (consistent with the owner-gated Feature tree it backs)
      const q = new URLSearchParams((req.url || '').split('?')[1] || '');
      const feature = q.get('feature') || '', id = q.get('id') || '';
      if (!feature || !id) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"bad-request"}'); return; }
      const resolved = FeatureManager.grantedUserProfile(String(feature), String(id), userProfiles as unknown as Map<string, { token: string; name?: string; phone?: string; avatar?: string }>);
      // R31.8c round-4-fix RED-1: grantedUserProfile now only resolves userId→token (INV-F7); server.ts builds the FULL
      // ProfileViewData via the SHARED profileViewDataForToken (devices ENRICH from deviceRecords) → drawer === /profile.
      const viewData = resolved ? profileViewDataForToken(resolved.token, { profileUuid: resolved.profileUuid }) : null;
      res.writeHead(viewData ? 200 : 404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(viewData || { error: 'not-found' }));
      return;
    }
    // R31.8c round-3: the OPAQUE granted-user avatar route is RETIRED (scope-creep). grantedUserProfile +
    // allowedUsersChildren now return the REAL avatar (/api/avatar/<token>) for the owner (root-of-trust) console.
    if (req.method === 'POST' && filepath === '/api/bug-status') {
      let body = '';
      req.on('data', (chunk: Buffer) => body += chunk);
      req.on('end', () => {
        try {
          const { adminKey, playerToken, bugIndex, status } = JSON.parse(body);
          if (adminKey !== ADMIN_KEY) { res.writeHead(403); res.end('Forbidden'); return; }
          if (!['PLANNED', 'IN PROGRESS', 'FIXED', 'WONTFIX'].includes(status)) { res.writeHead(400); res.end('Invalid status'); return; }
          const profile = userProfiles.get(playerToken);
          if (!profile || !profile.bugReports || !profile.bugReports[bugIndex]) { res.writeHead(404); res.end('Bug report not found'); return; }
          profile.bugReports[bugIndex].status = status;
          saveProfiles();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, updated: profile.bugReports[bugIndex] }));
          addLog(`Bug status updated: ${playerToken.slice(0,8)} #${bugIndex} -> ${status}`);
        } catch { res.writeHead(400); res.end('Bad request'); }
      });
      return;
    }

    // R40.10 — owner-gated task QA verdict: POST /api/task/<uuid>/{approve,decline}. Owner-only (403 non-owner);
    // approve records Tron's QA as DATA + is evidence-gated (cannot manufacture Done); decline mints a ChangeRequest.
    const taskVerdictMatch = filepath.match(/^\/api\/task\/([0-9a-fA-F-]+)\/(approve|decline)$/);
    if (req.method === 'POST' && taskVerdictMatch) {
      if (!requireOwnerHttp(req, res)) return; // owner-gated 403 — a non-owner can never record a QA verdict
      const taskUuid = taskVerdictMatch[1], verb = taskVerdictMatch[2];
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const idx = new ScenarioIndex(PROD_INDEX);
          // AC-1 (architect d82149492): record the owner's STABLE identity, NOT resolveOwner's 'sm_session' placeholder nor a
          // truncated token. Resolve the REAL owner token (the sm_session cookie stores it; else the header) → the owner's
          // profile NAME (attributable to HIM, non-credential — the raw token is NEVER written to disk). ROOT-1 server
          // SIGNATURE (unforgeable) is a fast-follow pending the architect's signing-key mechanism (no server secret exists yet).
          const _sid = cookieFrom(req, 'sm_session');
          const _ownerTok = (_sid ? smSessions.get(_sid)?.token : '') || ServerManagerGuard.playerTokenFrom(req) || '';
          // AC-1 (architect 8f4f70430): id = the owner's PROFILE-UNIT uuid via profileUuidOf (stable, non-credential, resolves
          // to his Profile unit = verifiable) — NOT the raw token (hygiene #0), NOT the renameable name (name rides as display).
          const approver = { id: FeatureManager.profileUuidOf(_ownerTok, userProfiles as unknown as Map<string, { redirectTo?: string }>) || 'owner:unresolved', name: String(userProfiles.get(_ownerTok)?.name || 'RawBin Owner') };
          const now = new Date().toISOString();
          let out: { code: number; payload: Record<string, unknown> };
          if (verb === 'approve') out = approveByOwner(idx, taskUuid, approver, now);
          else { let reason = ''; try { reason = String(JSON.parse(body || '{}').reason || '').slice(0, 2000); } catch { /* reason optional */ } out = declineToChangeRequest(idx, taskUuid, approver.id, reason, now); }
          // R40.18 BITE-6b observable stale-steer (LOG-ONLY, never a pin write): if the just-approved-to-Done task is
          // the current explicit steer, its designation is used up → auto-progress resumes. Delegated to StaleSteerLog.
          if (verb === 'approve' && out.code >= 200 && out.code < 300) StaleSteerLog.logStaleSteerExpiry(idx, taskUuid);
          res.writeHead(out.code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify(out.payload));
          addLog(`[task-verdict] ${verb} ${taskUuid.slice(0, 8)} by ${approver.name} → ${out.code}`); // FIX: was ${ownerTok8} — UNDECLARED here (only a declineToChangeRequest PARAM) → ReferenceError AFTER res.end → catch double-writeHead → ERR_HTTP_HEADERS_SENT → server CRASH on every approve (the ~10-iteration live-MVC failure root)
        } catch (e: any) { if (!res.headersSent) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: String(e?.message || e) })); } else { console.error(`[route] ★ POST-RESPONSE throw SWALLOWED (fail-SAFE now fail-LOUD, L15) on ${filepath} — a defect ran after res.end:`, e); } } // headersSent guard: a throw AFTER the response was sent must never re-write headers (that IS the crash); else = fail-loud so the hardening is OBSERVABLE, never a silent swallow
      });
      return;
    }

    // T37.26 (PO ruling, architect 515260b8d) — owner-gated "Set as Current": POST /api/task/<uuid>/make-current.
    // R40.49 (architect R40.44-REVERSAL 5c330e44d — SUPERSEDES the "advance-only, no stored pin" design that was here): the
    // tap DESIGNATES this task as current (writes singleton.currentTaskUuid through the SEAM) for ANY status — the removed
    // T37.26 status-gate was OUR invented policy (Tron: "reviewing IS working"). getThreeSlots honors the designation
    // EXPLICIT-WINS-WHILE-VALID (valid through QA-Review, re-checked per read, expires at Done / re-designation, expiry
    // OBSERVED by StaleSteerLog — that observability is what makes it recorded INTENT, not the retired silent lying pin).
    // NO auto-advance: a Planned tapped-current STAYS Planned; status advances via its own checklist flow. Seam EMITS → live.
    const makeCurrentMatch = filepath.match(/^\/api\/task\/([0-9a-fA-F-]+)\/make-current$/);
    if (req.method === 'POST' && makeCurrentMatch) {
      if (!requireOwnerHttp(req, res)) return; // owner-gated 403 — only the owner steers what is current
      const taskUuid = makeCurrentMatch[1];
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const idx = new ScenarioIndex(PROD_INDEX);
          const t0 = idx.get(taskUuid);
          if (!t0 || t0.ior !== 'ior:class:Task') { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'task not found' })); return; }
          const _sid = cookieFrom(req, 'sm_session');
          const _ownerTok = (_sid ? smSessions.get(_sid)?.token : '') || ServerManagerGuard.playerTokenFrom(req) || '';
          const actor = FeatureManager.profileUuidOf(_ownerTok, userProfiles as unknown as Map<string, { redirectTo?: string }>) || 'owner';
          const unit = UnitController.apply(idx, 'ior:class:Task', taskUuid, { makeCurrent: true }, { actor, publish: publishUnitChanged });
          const status = String((unit.model as Record<string, unknown>).status || '');
          // R40.49 (architect R40.44-REVERSAL 5c330e44d): DESIGNATE this task as current — EXPLICIT-WINS-WHILE-VALID. Write
          // singleton.currentTaskUuid through the ONE seam (getThreeSlots honors it while valid: status ∈ {Planned,In-Progress,
          // QA-Review}, expires at Done/re-designation — re-checked per read, expiry observed by StaleSteerLog). ALWAYS designate
          // on the tap regardless of status (one rule per intent-kind, no status branch). Also pins the current SPRINT so the
          // resolver lands on the designated task's sprint. Same designate seam used by /api/current-sprint/designate.
          let mcSprintNum: number | null = null;
          for (const u of idx.list()) { const su = idx.get(u); if (su?.ior !== 'ior:class:Sprint') continue; const tasks = (((su.model as Record<string, unknown>).tasks as string[]) || []).map((t) => String(t).replace('ior:instance:', '')); if (tasks.includes(taskUuid)) { mcSprintNum = sprintNumOf(su); break; } }
          const MC_CU = 'current-sprint-singleton-0000-000000000001';
          const desIntent: Record<string, unknown> = { currentTaskUuid: taskUuid };
          if (mcSprintNum != null) desIntent.sprintName = sprintPrefix(mcSprintNum);
          if (idx.get(MC_CU)) UnitController.apply(idx, 'ior:class:CurrentSprint', MC_CU, desIntent, { publish: publishUnitChanged });
          else UnitController.create(idx, 'ior:class:CurrentSprint', MC_CU, { ior: 'ior:class:CurrentSprint', model: { uuid: MC_CU, name: 'Current', ...desIntent }, ownerIor: null }, { publish: publishUnitChanged });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify({ ok: true, status, uuid: taskUuid, designated: true }));
          addLog(`[make-current] ${taskUuid.slice(0, 8)} by ${String(actor).slice(0, 8)} → DESIGNATED current (status ${status}, EXPLICIT-WINS-WHILE-VALID)`); // FIX: was ${ownerTok8} (undeclared → same ReferenceError-double-writeHead crash class as approve)
        } catch (e: any) {
          const msg = String(e?.message || e);
          const code = /cannot make a|only a Planned|In-Progress task can be/.test(msg) ? 409 : 400; // validate-refuse (QA-Review/Done) → 409
          if (!res.headersSent) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: msg })); } else { console.error(`[route] ★ POST-RESPONSE throw SWALLOWED (fail-SAFE now fail-LOUD, L15) on ${filepath} — a defect ran after res.end:`, e); } // headersSent guard: never re-write after the response was sent; else = fail-loud so a post-response defect is OBSERVABLE, never silently swallowed
        }
      });
      return;
    }

    // R40.17 — owner designates the current/next task+sprint for the pin. POST /api/current-sprint/designate
    // { taskUuid, slot?: 'current'|'next' }. INPUT-ONLY: writes the designation onto the CurrentSprint SINGLETON
    // (sprintName/nextSprintName = the task's sprint → the resolveSprintPin designation; currentTaskUuid /
    // nextBacklogOverride = the task → the slotsFrom slot). ★ NEVER writes the task's own status — reactivating a task
    // is the owner's separate R37.5 checklist act, never a pin-button side-effect (would be the authored-status disease).
    // Designation is UNCONSTRAINED: a Closed sprint is fine (shown labeled 'Closed', NEVER refused — that IS the point).
    if (req.method === 'POST' && filepath === '/api/current-sprint/designate') {
      if (!requireOwnerHttp(req, res)) return; // owner-gated 403 — only the owner steers the pin
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          const tu = String(parsed.taskUuid || '').replace('ior:instance:', '').trim();
          const slot = parsed.slot === 'next' ? 'next' : 'current';
          const idx = new ScenarioIndex(PROD_INDEX);
          const task = idx.get(tu);
          if (!task || task.ior !== 'ior:class:Task') { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'task not found' })); return; }
          // task → its sprint = the Sprint unit whose tasks[] contains it (NUMBER-keyed, robust; INV-C1-8).
          let sprintNum: number | null = null;
          for (const u of idx.list()) { const su = idx.get(u); if (su?.ior !== 'ior:class:Sprint') continue; const tasks = (((su.model as Record<string, unknown>).tasks as string[]) || []).map((t) => String(t).replace('ior:instance:', '')); if (tasks.includes(tu)) { sprintNum = sprintNumOf(su); break; } }
          if (sprintNum == null) { res.writeHead(409, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'task is not in any numbered sprint — cannot designate' })); return; }
          const sprintName = sprintPrefix(sprintNum); // R40.4 single-source (byte-identical)
          const CU = 'current-sprint-singleton-0000-000000000001';
          const cur = idx.get(CU);
          // R37.11 slice-1: route the designation write through the ONE mutation seam. apply (existing) default-merges the
          // INPUT fields; create (first-ever) mints the singleton. The seam's step-4 emit fans out UNIT_CHANGED via the
          // injected publishUnitChanged (was the inline wsClients broadcast) → the pin re-derives LIVE (R40.17, Tron's win),
          // now inseparable from the persist. INPUT-ONLY; the task unit's status is NEVER touched. INV-T byte-diff==0
          // (default-merge = the old inline model.X=Y; wrapper/model key order + ownerIor:null preserved).
          const intent = slot === 'next' ? { nextSprintName: sprintName, nextBacklogOverride: tu } : { sprintName, currentTaskUuid: tu };
          if (cur) UnitController.apply(idx, 'ior:class:CurrentSprint', CU, intent, { publish: publishUnitChanged });
          else UnitController.create(idx, 'ior:class:CurrentSprint', CU, { ior: 'ior:class:CurrentSprint', model: { uuid: CU, name: 'Current', ...intent }, ownerIor: null }, { publish: publishUnitChanged });
          let label = '';
          try { const pin = resolveSprintPin(idx, slot === 'next' ? { nextSprintNumber: sprintNum } : { currentSprintNumber: sprintNum }); const s = slot === 'next' ? pin.nextBacklog : pin.current; if (s) label = `${sprintPrefix(s.number)} — ${s.status}${s.designated ? ' (designated)' : ''}`; } catch { /* label best-effort — never blocks the designation */ }
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify({ ok: true, slot, taskUuid: tu, sprint: sprintName, label }));
          addLog(`[pin-designate] ${slot} task ${tu.slice(0, 8)} -> ${sprintName} (label: ${label || '?'}) INPUT-ONLY no-status-write`);
        } catch (e: any) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: String(e?.message || e) })); }
      });
      return;
    }

    if (req.method === 'POST' && filepath === '/api/avatar') {
      let body = '';
      req.on('data', (chunk: Buffer) => body += chunk);
      req.on('end', () => {
        try {
          const { playerToken, data, mimeType } = JSON.parse(body);
          if (!playerToken || !tokenToClient.has(playerToken)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Unauthenticated' })); return; }
          if (!data || !mimeType) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Missing data or mimeType' })); return; }
          if (!mimeType.startsWith('image/')) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'mimeType must be image/*' })); return; }
          const buf = Buffer.from(data, 'base64');
          const profile = userProfiles.get(playerToken);
          if (!profile) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Upload failed, please try again' })); return; }
          // T92: a normal upload must JUST SUCCEED — no key error ever surfaces. Guarantee
          // usable key material in THIS request before encrypting: createUserHome makes the
          // .ssh tree, generateUserKeypair is idempotent. Keys are never the user's concern.
          createUserHome(playerToken);
          generateUserKeypair(playerToken);
          if (!profile.sshKeysGenerated) { profile.sshKeysGenerated = true; saveProfiles(); }
          const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/gif' ? 'gif' : mimeType === 'image/webp' ? 'webp' : 'jpg';
          addLog(`Avatar POST: token=${playerToken.slice(0,8)} buf=${buf.length}bytes mime=${mimeType}`);
          // Encrypt in-request with one self-healing retry: if the key is present-but-corrupt,
          // encrypt throws — force a clean regen and retry once so the happy path always wins.
          try {
            encryptFile(playerToken, buf, mimeType, `avatar.${ext}`, 'avatar');
          } catch (encErr: any) {
            // Rekey via rekeyUser (not bare regenerate) so any OTHER decryptable files are
            // re-encrypted with the new key and not orphaned (avatar-fallback fix). The fresh
            // avatar is then written below with the new key.
            addLog(`Avatar POST: encrypt failed, rekeying and retrying — ${encErr?.message || encErr}`);
            rekeyUser(playerToken);
            encryptFile(playerToken, buf, mimeType, `avatar.${ext}`, 'avatar');
          }
          const avatarUrl = `/api/avatar/${playerToken}`;
          profile.avatar = avatarUrl;
          saveProfiles();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, avatarUrl }));
          addLog(`Avatar uploaded: ${playerToken.slice(0,8)} (${buf.length} bytes)`);
        } catch (e: any) { addLog(`Avatar POST error: ${e?.message || e}`); res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Upload failed, please try again' })); }
      });
      return;
    }

    // [impl:uuid:f15434f9-b6c9-45ba-b9b8-b8d025ce39e4] R20.31 storeVCard POST /api/vcard
    if (req.method === 'POST' && filepath === '/api/vcard') {
      let body = '';
      req.on('data', (chunk: Buffer) => body += chunk);
      req.on('end', () => {
        try {
          const { playerToken, data } = JSON.parse(body);
          if (!playerToken || !tokenToClient.has(playerToken)) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Unauthenticated' })); return; }
          if (!data) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Missing data' })); return; }
          const buf = Buffer.from(data, 'base64');
          const profile = userProfiles.get(playerToken);
          if (!profile) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'No profile' })); return; }
          createUserHome(playerToken);
          generateUserKeypair(playerToken);
          if (!profile.sshKeysGenerated) { profile.sshKeysGenerated = true; saveProfiles(); }
          try {
            encryptFile(playerToken, buf, 'text/vcard', 'contact.vcf', 'vcard');
          } catch (encErr: any) {
            addLog(`vCard POST: encrypt failed, rekeying — ${encErr?.message || encErr}`);
            rekeyUser(playerToken);
            encryptFile(playerToken, buf, 'text/vcard', 'contact.vcf', 'vcard');
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, vcardUrl: `/api/vcard/${playerToken}` }));
          addLog(`vCard uploaded: ${playerToken.slice(0,8)} (${buf.length} bytes)`);
        } catch (e: any) { addLog(`vCard POST error: ${e?.message || e}`); res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Upload failed' })); }
      });
      return;
    }

    if (filepath === '/api/bugs') {
      const allBugs: any[] = [];
      userProfiles.forEach((p, token) => {
        (p.bugReports || []).forEach((b, i) => {
          allBugs.push({ token: token.slice(0, 8), name: p.name, index: i, ...b });
        });
      });
// [impl:uuid:ae8312af-8169-41f8-9fa3-c428573be042] chat lazy-load (split for Assets.rekeyFix)
// [impl:uuid:8c6c7f69-ae21-47a2-88a6-244bd5c3da2f] chat lazy-load (split for server.ucScopedMethodResolve)
      allBugs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify(allBugs));
      return;
    }

    // [impl:uuid:e9dfad4e-95a1-44b8-bc96-c6c6802b4037] chat lazy-load
    if (req.method === 'GET' && filepath.startsWith('/api/room/') && filepath.includes('/messages')) {
      const parts = filepath.split('/');
      const roomId = parts[3];
      const room = roomManager.getRoom(roomId);
      if (!room) { res.writeHead(404); res.end(JSON.stringify({ error: 'Room not found' })); return; }
      const urlObj = new URL(filepath, `https://${req.headers.host || 'localhost'}`);
      const before = urlObj.searchParams.get('before') || '';
      const limit = Math.min(parseInt(urlObj.searchParams.get('limit') || '5') || 5, 50);
      try {
        const scenarioDir = path.join(__dirname, '../../../scenario/index');
        const idx = new ScenarioIndex(scenarioDir);
        const messages: any[] = [];
        let cursor = before ? before.replace('ior:instance:', '') : (room.lastMessageIor || '').replace('ior:instance:', '');
        while (cursor && messages.length < limit) {
          const unit = idx.get(cursor);
          if (!unit || unit.ior !== 'ior:class:Message') break;
          const m = unit.model as Record<string, unknown>;
          messages.push({ uuid: cursor, text: m.text, senderName: m.senderName, timestamp: m.timestamp, kind: m.kind, prevMessage: m.prevMessage });
          const prev = String(m.prevMessage || '').replace('ior:instance:', '');
          if (!prev || prev === cursor) break;
          cursor = prev;
        }
        messages.reverse();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify({ messages, hasMore: messages.length === limit }));
      } catch (e: any) {
        res.writeHead(500); res.end(JSON.stringify({ error: e?.message || 'Failed' }));
      }
      return;
    }

    // [impl:uuid:e872cf5c-b500-49c0-9836-b3779f33dd78] R19.68 file-access auth
    // T26.6: federation import — the RECEIVER posts a dropped rb-federated-ref; the server fetches from the
    // origin, reconciles + resolves children lazily, and stores locally (wires T26.1-T26.5 into the drop flow).
    if (req.method === 'POST' && filepath === '/api/federation/import') {
      let body = '';
      req.on('data', (c) => body += c);
      req.on('end', async () => {
        try {
          const { ref, roomId, token } = JSON.parse(body || '{}');
          if (!userProfiles.has(String(token || ''))) { res.writeHead(403, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'identify first' })); return; }
          const result = await federationImport(ref, String(roomId || ''));
          res.writeHead((result as any).error ? 400 : 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result));
        } catch (e: any) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'bad request' })); }
      });
      return;
    }
    // T26.3: federation grant mint — an identified origin user gets a short-lived capability for a uuid (at drag-start).
    if (req.method === 'GET' && filepath.match(/^\/api\/scenario\/[^/]+\/grant$/)) {
      const guuid = filepath.split('/')[3];
      if (!userProfiles.has(urlParams.get('token') || '')) { res.writeHead(403); res.end('federation: identify first'); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ grant: mintFederationGrant(guuid) })); return;
    }
    // T26.3: federation fetch API — GET /api/scenario/<uuid>{,/content,/children} (server-to-server, grant/signature auth)
    const fedMatch = filepath.match(/^\/api\/scenario\/([^/]+)(?:\/(content|children))?$/);
    if (req.method === 'GET' && fedMatch) { await fetchScenario(fedMatch[1], fedMatch[2] || '', req, res, urlParams); return; }

    if (req.method === 'GET' && filepath.match(/^\/api\/room\/file\/[^/]+\/content$/)) {
      const fileUuid = filepath.split('/')[4];
      try {
        // F1 auth: fail CLOSED — require valid token + room membership
        const authToken = urlParams.get('token') || '';
        if (!authToken) { res.writeHead(403); res.end('Forbidden: token required'); return; }
        // v0.6.98: authorize the requester as UPLOADER, member of the file's stored room, OR member of
        // ANY loaded room that references the file (files can be shared across rooms, and the stored
        // roomUuid may point at a room that is no longer loaded — that used to 403 valid viewers → broken image).
        const fu0 = (() => { const idx2 = new ScenarioIndex(path.join(__dirname, '../../../scenario/index')); return idx2.get(fileUuid); })();
        const fileRoomUuid = fu0 ? String((fu0.model as any).roomUuid || '') : '';
        const memberOf = (r: any) => !!r && (r.creatorToken === authToken || [...r.members.values()].some((m: any) => m.playerToken === authToken));
        // R40.22 step-1(a) RE-POINT (before scrub): authorize by OWNER-REF (room creator = owner) / room-membership ONLY.
        // The leaked-copy clause `uploaderToken === authToken` is REMOVED — a request presenting only the embedded
        // uploaderToken value is no longer authorized by that value, so scrubbing the field is safe (re-point BEFORE scrub).
        let authorized = false;
        if (fileRoomUuid) authorized = memberOf(roomManager.getRoom(fileRoomUuid));
        if (!authorized) authorized = roomManager.roomsWithFile(fileUuid).some(memberOf);
        if (!authorized) { res.writeHead(403); res.end('Forbidden'); return; }
        const scenarioDir = path.join(__dirname, '../../../scenario/index');
        const idx = new ScenarioIndex(scenarioDir);
        const unit = idx.get(fileUuid);
        if (!unit) { res.writeHead(404); res.end('File not found'); return; }
        // R25.2: a WebItem is a reference, not stored bytes — serve its url as text/uri-list so the
        // existing preview (scheme launcher card / iframe / YouTube embed) renders it.
        if (unit.ior === 'ior:class:WebItem') {
          res.writeHead(200, { 'Content-Type': 'text/uri-list', 'Cache-Control': 'no-cache' });
          res.end(String((unit.model as any).url || ''));
          return;
        }
        const { readFileUnitContent } = await import('../scenario/file-unit.js');
        const content = readFileUnitContent(idx, fileUuid);
        if (!content) { res.writeHead(404); res.end('File not found'); return; }
        const mimeType = (unit.model as any).mimeType || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mimeType, 'Content-Length': content.byteLength.toString(), 'Cache-Control': 'no-cache', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" });
        res.end(content);
      } catch (e: any) { res.writeHead(500); res.end(e?.message || 'Error'); }
      return;
    }

    // [impl:uuid:dnd01001-a1b2-4c3d-8e4f-000000000001] DropDispatcher.upload R19.14
    if (req.method === 'POST' && filepath.startsWith('/api/room/') && filepath.endsWith('/upload')) {
      const parts = filepath.split('/');
      const roomId = parts[3];
      const MAX_UPLOAD = 50 * 1024 * 1024; // 50MB
      const chunks: Buffer[] = [];
      let totalSize = 0;
      req.on('data', (chunk: Buffer) => { totalSize += chunk.length; if (totalSize <= MAX_UPLOAD) chunks.push(chunk); });
      req.on('end', async () => {
        try {
          if (totalSize > MAX_UPLOAD) { res.writeHead(413); res.end(JSON.stringify({ error: `File too large (max ${MAX_UPLOAD / 1024 / 1024}MB)` })); return; }
          const body = Buffer.concat(chunks);
          addLog(`[upload] received ${body.length}b for room ${roomId.slice(0,8)} content-type=${req.headers['content-type']?.slice(0,60)}`);
          const boundary = (req.headers['content-type'] || '').split('boundary=')[1];
          if (!boundary) { addLog(`[upload] ERROR: no boundary in content-type`); res.writeHead(400); res.end(JSON.stringify({ error: 'No boundary' })); return; }
          const parts = body.toString('binary').split('--' + boundary);
          let fileName = '', mimeType = 'application/octet-stream', fileData = Buffer.alloc(0), playerToken = '', relatedFile = '';
          for (const part of parts) {
            if (part.includes('name="playerToken"')) {
              playerToken = part.split('\r\n\r\n')[1]?.trim().split('\r\n')[0] || '';
            }
            if (part.includes('name="relatedFile"')) { // v0.6.91: WebItem forward-ref to its source file
              relatedFile = part.split('\r\n\r\n')[1]?.trim().split('\r\n')[0] || '';
            }
            if (part.includes('name="file"')) {
              const disp = part.match(/filename="([^"]+)"/);
              // v0.6.92: the body is read as 'binary' (Latin-1) for safe multipart split, so a UTF-8
              // filename (e.g. "…für…") arrives mojibake'd ("…fÃ¼r…") → re-decode the bytes as UTF-8.
              if (disp) fileName = Buffer.from(disp[1], 'binary').toString('utf-8');
              const ct = part.match(/Content-Type:\s*(\S+)/i);
              if (ct) mimeType = ct[1];
              const dataStart = part.indexOf('\r\n\r\n');
              if (dataStart !== -1) {
                const raw = part.slice(dataStart + 4);
                const trimmed = raw.replace(/\r\n$/, '');
                fileData = Buffer.from(trimmed, 'binary');
              }
            }
          }
          addLog(`[upload] parsed: file=${fileName} mime=${mimeType} size=${fileData.length}b token=${playerToken.slice(0,8)}`);
          if (!playerToken || !tokenToClient.has(playerToken)) { addLog(`[upload] ERROR: auth failed token=${playerToken.slice(0,8)}`); res.writeHead(401); res.end(JSON.stringify({ error: 'Unauthenticated' })); return; }
          const room = roomManager.getRoom(roomId);
          if (!room) { addLog(`[upload] ERROR: room ${roomId.slice(0,8)} not found`); res.writeHead(404); res.end(JSON.stringify({ error: 'Room not found' })); return; }
          addLog(`[upload] creating unit...`);
          const scenarioDir = path.join(__dirname, '../../../scenario/index');
          const idx = new ScenarioIndex(scenarioDir);
          // R25.2 drop-router (single dispatch point): url-types (uri-list / .url / .webloc / .desktop) → WebItem
          // (a reference to a remote resource), NOT a File (a stored byte artifact). Everything else → File.
          const lname = fileName.toLowerCase();
          const isWebItem = mimeType === 'text/uri-list' || lname.endsWith('.url') || lname.endsWith('.webloc') || lname.endsWith('.desktop');
          let unit;
          if (isWebItem) {
            const url = extractUrl(fileData.toString('utf-8'), fileName);
            if (url) {
              unit = createWebItemUnit(idx, { uuid: crypto.randomUUID(), url, name: fileName, uploaderToken: playerToken, roomUuid: roomId, relatedFile: relatedFile || undefined }, publishUnitChanged); // R37.11 slice-1: seam publish (new WebItem appears live)
              addLog(`[upload] WebItem: ${(unit.model as any).badge} ${(unit.model as any).name} (${(unit.model as any).scheme}) url=${url.slice(0,60)}`);
              // v0.6.98 (R25.5): for http(s), fetch the page <title> as the NAME (distinct from description=url);
              // falls back to deriveName's hostname on timeout/failure. Only overrides a generic (non-fetched) name.
              if (/^https?:/i.test(url)) {
                const title = await fetchPageTitle(url);
                if (title) { (unit.model as any).name = title; idx.put((unit.model as any).uuid, unit); addLog(`[upload] WebItem title → ${title.slice(0,60)}`); }
              }
              // v0.6.92: the WebItem is PRIMARY; its source file (.eml) becomes its child (WebItem.children),
              // NOT a room sibling — so demote it from the room's top-level file list (no duplicate entry).
              if (relatedFile) { room.removeFileUnit(relatedFile); addLog(`[upload] demoted source ${relatedFile.slice(0,8)} → child of WebItem`); }
            }
          }
          if (!unit) unit = createFileUnit(idx, { name: fileName, content: fileData, mimeType, uploaderToken: playerToken, fsKey: homeKeyFor(playerToken, { mint: true }), roomUuid: roomId }, publishUnitChanged); // R40.22 path regrowth-kill: fsKey=storageId in the roomFsLink PATH (inert while REKEY_APPLIED=false). R37.11 slice-1: seam publish (new File appears live)
          const fileUuid = (unit.model as any).uuid;
          addLog(`[upload] unit created: ${fileUuid} contentPath=${(unit.model as any).contentPath}`);
          room.addFileUnit(fileUuid);
          room.broadcast({ type: MSG.FILE_ADDED, roomId, fileUuid, name: fileName, size: fileData.length, mimeType });
          addLog(`[upload] SUCCESS: ${fileName} (${fileData.length}b) uuid=${fileUuid} room=${roomId.slice(0,8)}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ uuid: fileUuid, name: fileName, size: fileData.length }));
        } catch (e: any) {
          addLog(`[upload] ERROR: ${e?.message || e}\n${e?.stack || ''}`);
          res.writeHead(500); res.end(JSON.stringify({ error: 'Upload failed' }));
        }
      });
      return;
    }

    // R27.7 UC27.7b: CORS/X-Frame fallback proxy — GET /api/proxy?url= (SSRF-guarded, rate-limited, audit-logged, sanitized)
    if (req.method === 'GET' && filepath === '/api/proxy') {
      const pip = req.socket.remoteAddress || 'unknown';
      if (!fedRateOk(pip, 30)) { res.writeHead(429, { 'Content-Type': 'text/plain' }); res.end('proxy: rate limited'); return; }
      const target = urlParams.get('url') || '';
      const guard = await ProxyFetch.guardUrl(target);
      addLog(`PROXY ${guard.allow ? 'ALLOW' : 'DENY:' + guard.reason} ${target.slice(0, 120)} ip=${pip}`); // audit-log every fetch
      if (!guard.allow) { res.writeHead(403, { 'Content-Type': 'text/plain' }); res.end(`proxy blocked: ${guard.reason}`); return; }
      try {
        const out = await ProxyFetch.fetchSanitized(target);
        res.writeHead(out.status || 200, {
          'Content-Type': out.contentType || 'text/html',
          'Content-Security-Policy': "default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; font-src data: https:; sandbox",
          'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store',
        });
        res.end(out.body);
      } catch (e) { res.writeHead(502, { 'Content-Type': 'text/plain' }); res.end(`proxy fetch failed: ${(e as Error).message}`); }
      return;
    }

    if (filepath === '/api/config') {
      const domain = BASE_DOMAIN || getLocalIP();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify({ baseDomain: domain, httpsPort: HTTPS_PORT, version: getVersion(), branch: 'rawbin' }));
      return;
    }

    // R40.25 (7fee0120) INV-PDG-3/6/7 — is what is served RIGHT NOW verified on a real device, at which version?
    // Owner-gated (the badge is Tron's last-resort view). Reads the LATEST device-gate unit for the SERVED version;
    // NO unit for the served version → NOT-RUN (fail-closed INV-PDG-2: not-known-GREEN == RED; a green from an older
    // version can never certify the live one, INV-PDG-7 freshness — we filter on the served version so a stale green
    // simply doesn't match). Read-only.
    if (filepath === '/api/gate-status') {
      if (!requireOwnerHttp(req, res)) return;
      const served = getVersion();
      let latest: Record<string, any> | null = null;
      try {
        const idx = new ScenarioIndex(PROD_INDEX);
        for (const u of idx.list()) {
          const g = idx.get(u); const m = g?.model as Record<string, any> | undefined;
          if (g?.ior === 'ior:class:Gate' && m?.gateType === 'device-gate' && m?.version === served) {
            if (!latest || String(m.timestamp || '') > String(latest.timestamp || '')) latest = m;
          }
        }
      } catch { /* index unreadable → NOT-RUN (fail-closed) */ }
      const verdict = latest ? String(latest.verdict) : 'NOT-RUN'; // no device-gate for the served version → NOT-RUN=RED
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ ok: true, servedVersion: served, verdict, verified: verdict === 'GREEN', gateVersion: latest?.version || null, gateCommit: latest?.commit || null, evidence: latest?.evidence || 'no device-gate recorded for the served version — UNVERIFIED', timestamp: latest?.timestamp || null }));
      return;
    }

    // T108 (relocated): standalone Traceability browser page — docs top-nav choice (peer to
    // browser/App). Mounts rb-trace-tree + detail pane off /api/trace.
    if (filepath === '/trace' || filepath === '/trace/') {
      const script = getBundleScript('trace-page.js', 'trace-page.js');
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
      // NOTE: do NOT reference MD_CSS here — it's a const declared later in handleRequest (TDZ).
      // pageHead already links /app.css which carries the trace component styles.
      res.end(`${pageHead('Traceability')}${pageNav('/md/', 'Browse')}
        <div class="trace-page">
          <div class="trace-tree-panel" id="trace-tree"><div style="color:#888;padding:20px">Loading traceability graph…</div></div>
          <div id="trace-detail"></div>
        </div>
        <script type="module" src="${script}"></script></body></html>`);
      return;
    }

    // T174 R-M3: /scenario?ior=<uuid> — single-instance focused tree view
    if (filepath === '/scenario' || filepath === '/scenario/') {
      const script = getBundleScript('scenario-view.js', 'scenario-view.js');
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
      res.end(`${pageHead('Scenario')}${pageNav('/trace', 'Trace')}
        <div class="trace-page" id="scenario-app"></div>
        <script type="module" src="${script}"></script></body></html>`);
      return;
    }

    // Phase 2: /api/trace built entirely from ScenarioIndex (no scanRepo)
    if (filepath === '/api/model/tree') { // R32.3: MDA model-tree ROOTS = M1 top-level class/interface/function/type units,
      // as `.items` for the SHARED rb-trace-tree. Data-only; each root's members nest as children via the ModelElement
      // forward-key (/api/trace/children). type = the M2 MODEL-facet metaclass (icon); childCount = members.length (badge).
      try {
        ensureStoreSeeded();
        const idx = new ScenarioIndex(MODEL_STORE); // R32.5/INV-MOF4: reads the ISOLATED store only (prod scenario/index untouched)
        const roots = mofLayerRoots(idx); // R33.1: extracted → named mofLayerRoots (Impl 5afeafe9, strict-AST credit)
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify({ roots }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: String(e) }));
      }
      return;
    }
    if (req.method === 'POST' && filepath === '/api/model/generate') { // R32.5 GO-LIVE: drop→TsToModel.generate→ISOLATED store (prod scenario/index NEVER mutated) + demo Diagram
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const { file } = JSON.parse(body || '{}');
          const projectRoot = path.join(__dirname, '../../..');
          const abs = path.resolve(projectRoot, String(file || ''));
          if (!String(file) || !abs.startsWith(projectRoot + path.sep) || !abs.endsWith('.ts') || !fsSync.existsSync(abs)) { // path-safety: repo-relative existing .ts only (no traversal)
            res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"bad-file: must be an existing repo-relative .ts path"}'); return;
          }
          ensureStoreSeeded();
          const r = new TsToModel(projectRoot).generate([abs], { indexDir: MODEL_STORE, write: true, diagram: true });
          const roots = r.units.filter((u) => u.model.metaLevel === 'M1' && !u.model.memberOf).length;
          addLog(`[model] generate ${path.relative(projectRoot, abs)} → ${r.units.length} units (${roots} roots) diagram=${r.diagramUuid?.slice(0, 8)} wrote=${r.wrote} (store-only, prod untouched)`);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, units: r.units.length, roots, diagramUuid: r.diagramUuid, wrote: r.wrote }));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'generate-failed' })); }
      });
      return;
    }
    if (req.method === 'POST' && filepath === '/api/model/generate-project') { // S33-P2a: BOUNDED multi-file RawBin M1
      if (!requireFeatureAccessHttp(req, res, 'Model-Driven Code Quality')) return; // owner/member-gated (INV-P2, reuse R32.9 gate)
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const projectRoot = path.join(__dirname, '../../..'); // __dirname used INSIDE the handler (runtime-safe, not module-top) — R32.5 boot lesson honored
          const { dir } = JSON.parse(body || '{}');
          const t0 = Date.now();
          // T36.3: the generate-project CORE is now the ONE shared generateProjectModel — HTTP handler + the local CLI
          // (scripts/regen-model.ts) run the SAME path/invariants (INV-P2 bounded/CAP/MODEL_STORE-only). Owner-gate above UNCHANGED.
          const g = generateProjectModel(projectRoot, String(dir || 'src/ts/scenario'), MODEL_STORE, PROD_INDEX);
          if (!g.ok) { res.writeHead(g.status || 400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: g.error })); return; }
          addLog(`[model] generate-project ${g.dir} → ${g.files} files → ${g.units} units (${g.roots} roots) wrote=${g.wrote} removed=${g.removed} ${Date.now() - t0}ms (store-only, prod untouched)`);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, dir: g.dir, files: g.files, units: g.units, roots: g.roots, wrote: g.wrote, removed: g.removed }));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'generate-project-failed' })); }
      });
      return;
    }
    if (req.method === 'GET' && filepath.startsWith('/api/model/used-in/')) { // R36.5 where-used resolver: the element's usedIn[] back-refs (bidirectional mirror of Diagram.views)
      const uuid = decodeURIComponent(filepath.slice('/api/model/used-in/'.length)).replace(/^ior:instance:/, '').trim();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify({ uuid, usedIn: resolveUsedIn(uuid) }));
      return;
    }
    if (req.method === 'POST' && filepath === '/api/model/diagram/add-view') { // R32.11 (INV-R1): drop/select a class → append a view-link to the Diagram (MODEL_STORE ONLY, dedup, prod untouched)
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const { diagramUuid, elementUuid, x, y } = JSON.parse(body || '{}');
          const UUID = /^[0-9a-fA-F-]{16,40}$/; // path-safety: hex+dash only (no traversal into the shard path)
          if (!UUID.test(String(diagramUuid || '')) || !UUID.test(String(elementUuid || ''))) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"bad-uuid"}'); return; }
          const dfile = path.join(MODEL_STORE, ...String(diagramUuid).slice(0, 5).split(''), `${diagramUuid}.scenario.json`);
          if (!fsSync.existsSync(dfile)) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{"error":"no-diagram"}'); return; }
          const unit = JSON.parse(fsSync.readFileSync(dfile, 'utf-8'));
          const views: { unit: string; x: number; y: number; viewKind: string }[] = Array.isArray(unit.model.views) ? unit.model.views : (unit.model.views = []);
          const link = `modelelement:${elementUuid}`;
          if (views.some((v) => v.unit === link)) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, added: false, views: views.length })); return; } // INV-R2: dedup → idempotent
          // R32.11-B2 / Tron BUG D: viewKind DERIVED FROM THE UNIT TYPE (single source deriveViewKind, same fn the client
          // renderFacet uses) — NOT the old hardcoded 'class' that rendered every drop as a class box. Resolve the element
          // (prod index, else MODEL_STORE), FAIL-CLOSED on an unknown/unresolvable type (400 — never store a silent 'class').
          let elUnit: { ior?: string; model?: Record<string, unknown> } | null = null;
          try { elUnit = new ScenarioIndex(PROD_INDEX).get(elementUuid) as any; } catch { /* fall through to model-store */ }
          if (!elUnit) { try { const ef = path.join(MODEL_STORE, ...String(elementUuid).slice(0, 5).split(''), `${elementUuid}.scenario.json`); if (fsSync.existsSync(ef)) elUnit = JSON.parse(fsSync.readFileSync(ef, 'utf-8')); } catch { /* unresolvable */ } }
          const viewKind = elUnit ? deriveViewKind(elUnit.ior, elUnit.model) : null;
          if (!viewKind) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"unknown-view-kind","detail":"element type has no facet mapping — refusing to store a silent class default"}'); return; }
          const COLS = 3, i = views.length; // INV-R1: explicit drop coords, else auto-grid (the select-class complement sends none)
          const vx = Number.isFinite(x) ? Math.max(0, Math.round(x)) : (i % COLS) * 220 + 20;
          const vy = Number.isFinite(y) ? Math.max(0, Math.round(y)) : Math.floor(i / COLS) * 200 + 20;
          views.push({ unit: link, x: vx, y: vy, viewKind });
          fsSync.writeFileSync(dfile, JSON.stringify(unit, null, 2) + '\n'); // INV-R3 store-only (MODEL_STORE, prod scenario/index NEVER touched) + INV-R4 persist
          addUsedIn(elementUuid, 'diagram', diagramUuid); // R36.5: bidirectional — the element unit tracks this diagram (usedIn ⟷ diagram.views), store-only
          addLog(`[model] add-view ${String(elementUuid).slice(0, 8)} → diagram ${String(diagramUuid).slice(0, 8)} @(${vx},${vy}) views=${views.length}`);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, added: true, views: views.length }));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'add-view-failed' })); }
      });
      return;
    }
    if (req.method === 'POST' && filepath === '/api/model/diagram/remove-view') { // R33.8 (INVERSE of add-view) — delegates to persistRemoveView (store-only, prod untouched, model unit re-addable)
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const { diagramUuid, elementUuid } = JSON.parse(body || '{}');
          const out = persistRemoveView(String(diagramUuid || ''), String(elementUuid || ''));
          if (!out.ok) { res.writeHead(out.status || 500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: out.error })); return; }
          if (out.removed) addLog(`[model] remove-view ${String(elementUuid).slice(0, 8)} ✕ diagram ${String(diagramUuid).slice(0, 8)} views=${out.views}`);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'remove-view-failed' })); }
      });
      return;
    }
    if (req.method === 'POST' && filepath === '/api/model/element/new') { // R33.9 unit-verb: mint an M1 unit (store-only, delegates to newElement)
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const { name, kind } = JSON.parse(body || '{}');
          const out = newElement(String(name || ''), String(kind || 'class'));
          if (!out.ok) { res.writeHead(out.status || 500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: out.error })); return; }
          addLog(`[model] element/new ${out.uuid?.slice(0, 8)} name=${String(name).slice(0, 30)}`);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'element-new-failed' })); }
      });
      return;
    }
    if (req.method === 'POST' && filepath === '/api/model/element/rename') { // R33.9 unit-verb: rename an M1 unit (store-only)
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const { elementUuid, name } = JSON.parse(body || '{}');
          const out = renameElement(String(elementUuid || ''), String(name || ''));
          if (!out.ok) { res.writeHead(out.status || 500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: out.error })); return; }
          addLog(`[model] element/rename ${String(elementUuid).slice(0, 8)} → ${String(name).slice(0, 30)}`);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'element-rename-failed' })); }
      });
      return;
    }
    if (req.method === 'POST' && filepath === '/api/model/element/delete') { // R33.9 unit-verb: DESTRUCTIVE delete of an M1 unit (≠ R33.8 remove-view)
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const { elementUuid } = JSON.parse(body || '{}');
          const out = deleteElement(String(elementUuid || ''));
          if (!out.ok) { res.writeHead(out.status || 500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: out.error })); return; }
          addLog(`[model] element/delete ${String(elementUuid).slice(0, 8)}`);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'element-delete-failed' })); }
      });
      return;
    }
    if (req.method === 'POST' && filepath === '/api/model/diagram/move-view') { // R33.3 (INV-S33V-2/4): drag a box → persist its view-link x,y in MODEL_STORE → survives reload. Ungated like add-view (same drag loop). markerPending (req IMPL-mints)
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const { diagramUuid, elementUuid, x, y } = JSON.parse(body || '{}');
          const UUID = /^[0-9a-fA-F-]{16,40}$/; // path-safety: hex+dash only (no shard-path traversal)
          if (!UUID.test(String(diagramUuid || '')) || !UUID.test(String(elementUuid || ''))) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"bad-uuid"}'); return; }
          if (!Number.isFinite(x) || !Number.isFinite(y)) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"bad-coords"}'); return; }
          const dfile = path.join(MODEL_STORE, ...String(diagramUuid).slice(0, 5).split(''), `${diagramUuid}.scenario.json`);
          if (!fsSync.existsSync(dfile)) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{"error":"no-diagram"}'); return; }
          const unit = JSON.parse(fsSync.readFileSync(dfile, 'utf-8'));
          const views: { unit: string; x: number; y: number; viewKind: string }[] = Array.isArray(unit.model.views) ? unit.model.views : [];
          const view = views.find((v) => v.unit === `modelelement:${elementUuid}`);
          if (!view) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{"error":"no-view"}'); return; }
          view.x = Math.max(0, Math.round(x)); view.y = Math.max(0, Math.round(y));
          fsSync.writeFileSync(dfile, JSON.stringify(unit, null, 2) + '\n'); // INV-S33V-4 store-only (prod scenario/index NEVER touched)
          addLog(`[model] move-view ${String(elementUuid).slice(0, 8)} → diagram ${String(diagramUuid).slice(0, 8)} @(${view.x},${view.y})`);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, x: view.x, y: view.y }));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'move-view-failed' })); }
      });
      return;
    }
    // [impl:uuid:80440bf0-c512-4fb8-aa95-8fb56547af88] server.persistDiagramZoom (R33.7.1 INV-Z2): persist per-diagram zoom in MODEL_STORE (mirror move-view; prod scenario/index NEVER touched)
    if (req.method === 'POST' && filepath === '/api/model/diagram/zoom') {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const { diagramUuid, zoom } = JSON.parse(body || '{}');
          const UUID = /^[0-9a-fA-F-]{16,40}$/; // path-safety: hex+dash only (no shard-path traversal)
          if (!UUID.test(String(diagramUuid || ''))) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"bad-uuid"}'); return; }
          const z = Number(zoom);
          if (!Number.isFinite(z) || z < 0.25 || z > 8) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"bad-zoom"}'); return; } // INV-Z1 range [0.25,8]
          const dfile = path.join(MODEL_STORE, ...String(diagramUuid).slice(0, 5).split(''), `${diagramUuid}.scenario.json`);
          if (!fsSync.existsSync(dfile)) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{"error":"no-diagram"}'); return; }
          const unit = JSON.parse(fsSync.readFileSync(dfile, 'utf-8'));
          unit.model.zoom = z;
          fsSync.writeFileSync(dfile, JSON.stringify(unit, null, 2) + '\n'); // INV-Z2 store-only (prod scenario/index NEVER touched)
          addLog(`[model] zoom ${String(diagramUuid).slice(0, 8)} → ${z}`);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, zoom: z }));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'zoom-failed' })); }
      });
      return;
    }
    if (req.method === 'POST' && filepath === '/api/model/diagram/create') { // S33-P3f-1 Add-diagram: create an EMPTY Diagram unit in diagram/ → curate via R32.11 add-view. markerPending (req IMPL-mints per-action)
      if (!requireFeatureAccessHttp(req, res, 'Model-Driven Code Quality')) return; // owner/member-gated
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          ensureStoreSeeded();
          const { name } = JSON.parse(body || '{}');
          const diagramUuid = crypto.randomUUID();
          const dfile = path.join(MODEL_STORE, ...diagramUuid.slice(0, 5).split(''), `${diagramUuid}.scenario.json`);
          fsSync.mkdirSync(path.dirname(dfile), { recursive: true });
          fsSync.writeFileSync(dfile, JSON.stringify({ ior: 'ior:class:Diagram', ownerIor: null, model: { uuid: diagramUuid, name: String(name || 'New diagram').slice(0, 80), views: [] } }, null, 2) + '\n'); // INV-F-3 MODEL_STORE only, prod untouched
          addLog(`[model] add-diagram → empty Diagram ${diagramUuid.slice(0, 8)} (store-only)`);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, diagramUuid }));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'add-diagram-failed' })); }
      });
      return;
    }
    if (req.method === 'POST' && filepath === '/api/model/folder/create') { // R34.3 (R-B) Add-folder: mint a Folder unit in MODEL_STORE (mirror diagram/create, store-only). markerPending (req IMPL-mints → createFolder)
      if (!requireFeatureAccessHttp(req, res, 'Model-Driven Code Quality')) return; // owner/member-gated (mirror diagram/create)
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          ensureStoreSeeded();
          const { name, parent } = JSON.parse(body || '{}');
          // R40.37 AC5: FolderService.createPhysicalWithUnit supersedes createFolder (28000b00, additive) — mint+persist
          // the unit atomically + RETURN it so the itemview is one-step; write-or-nothing → a failed persist returns
          // {ok:false} and NO unit → the client renders no phantom node (no 200-with-uuid on failure).
          const out = FolderService.mintRealUnit(MODEL_STORE, String(name || ''), String(parent || ''));
          if (!out.ok) { addLog(`[model] add-folder FAILED (no unit persisted) — ${out.error}`); res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: out.error || 'add-folder-failed' })); return; }
          addLog(`[model] add-folder → Folder ${out.unit!.model.uuid.slice(0, 8)} parent=${String(parent || '').slice(0, 8)} (store-only, unit returned)`);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, uuid: out.unit!.model.uuid, unit: out.unit }));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'add-folder-failed' })); }
      });
      return;
    }
    if (req.method === 'POST' && filepath === '/api/model/trace/create') { // R36.4 inc-2: author a UmlTraceRelationship (MODEL_STORE, idempotent). markerPending (req IMPL-mints → authorTrace, trails per PO)
      if (!requireFeatureAccessHttp(req, res, 'Model-Driven Code Quality')) return; // owner/member-gated (mirror folder/create)
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          ensureStoreSeeded();
          const { from, to, relation, fromType, toType } = JSON.parse(body || '{}');
          const out = authorTrace(String(from || ''), String(to || ''), String(relation || 'traces'), fromType, toType);
          addLog(`[model] author-trace → ${out.ok ? 'UmlTraceRelationship ' + out.uuid?.slice(0, 8) : 'FAIL ' + out.error} (store-only)`);
          res.writeHead(out.ok ? 200 : 400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'author-trace-failed' })); }
      });
      return;
    }
    if (req.method === 'GET' && filepath === '/api/model/traces') { // R36.4 inc-2: authored UmlTraceRelationship units for the diagram surface to render
      if (!requireFeatureAccessHttp(req, res, 'Model-Driven Code Quality')) return;
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ traces: listTraces() }));
      return;
    }
    if (req.method === 'POST' && filepath === '/api/model/import-puml') { // S33-P3f-1 Import-PUML (Tron feat D): REUSE R32.7 pumlToModel (INV-F-1) → M1 units (ts/) + auto-grid Diagram (diagram/) + PumlArtifact (puml/). markerPending (req IMPL-mints)
      if (!requireFeatureAccessHttp(req, res, 'Model-Driven Code Quality')) return; // owner/member-gated
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          ensureStoreSeeded();
          const body0 = JSON.parse(body || '{}');
          let puml = String(body0.text || '');
          let name = body0.name;
          if (!puml && body0.srcPath) { // R33.5 item4: import an EXISTING source .puml by relpath (the puml/ tree node's click → Import)
            const rel = String(body0.srcPath).replace(/^\/+/, '');
            const sprintsDir = path.join(__dirname, '../../..', 'scrum.pmo', 'sprints');
            const abs = path.join(sprintsDir, rel);
            if (/\.\./.test(rel) || !/^[\w./-]+\.puml$/.test(rel) || !abs.startsWith(sprintsDir + path.sep)) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"bad-srcPath"}'); return; }
            try { puml = fsSync.readFileSync(abs, 'utf-8'); name = name || (rel.split('/').pop() || rel); } catch { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{"error":"no-puml-file"}'); return; }
          }
          if (!puml.trim()) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"empty-puml"}'); return; }
          const { elements, relations } = pumlToModel(puml); // INV-F-1: the R32.7 parser (class/interface + <|--/-->/..>), NO new parser
          if (elements.length === 0) { // sequence/activity/unknown → NOT a class model → clean 'not importable' (triage/out-of-scope, no crash)
            addLog(`[model] import-puml '${String(name || '').slice(0, 40)}' → 0 class elements (sequence/activity? out-of-scope)`);
            res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, reason: 'not-importable: no class/interface found (likely a sequence/activity diagram — class model only)' })); return;
          }
          const base = (String(name || 'imported').replace(/\.puml$/i, '').replace(/[^\w.-]/g, '_').slice(0, 60)) || 'imported';
          const sourceFile = `src/imported/${base}.puml`; // src/ prefix → groups under rawbin:ts (isSrc) as a file-folder
          const detUuid = (key: string): string => { const h = crypto.createHash('sha256').update(key).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`; };
          const relsFrom = (u: string): { to: string; type: string }[] => relations.filter((r) => r.from === u).map((r) => ({ to: `ior:instance:${r.to}`, type: String(r.kind) }));
          const writeUnit = (ior: string, model: Record<string, unknown>): void => { const uuid = String(model.uuid); const p = path.join(MODEL_STORE, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`); fsSync.mkdirSync(path.dirname(p), { recursive: true }); fsSync.writeFileSync(p, JSON.stringify({ ior, ownerIor: null, model }, null, 2) + '\n'); }; // INV-F-3 MODEL_STORE only
          let memberCount = 0;
          for (const el of elements) {
            const members: string[] = [];
            for (const a of el.attrs) { const mu = detUuid(`${el.uuid}::attr:${a}`); members.push(`ior:instance:${mu}`); writeUnit('ior:class:ModelElement', { uuid: mu, name: a, metaLevel: 'M1', kind: 'property', sourceFile, qualifiedName: `${el.name}.${a}`, instanceOf: [], memberOf: `ior:instance:${el.uuid}` }); memberCount++; }
            for (const m of el.methods) { const mu = detUuid(`${el.uuid}::method:${m}`); members.push(`ior:instance:${mu}`); writeUnit('ior:class:ModelElement', { uuid: mu, name: m, metaLevel: 'M1', kind: 'method', sourceFile, qualifiedName: `${el.name}.${m}()`, instanceOf: [], memberOf: `ior:instance:${el.uuid}` }); memberCount++; }
            writeUnit('ior:class:ModelElement', { uuid: el.uuid, name: el.name, metaLevel: 'M1', kind: el.kind, sourceFile, qualifiedName: el.name, instanceOf: [], members, relations: relsFrom(el.uuid) });
          }
          const COLS = 3; // auto-grid Diagram over the imported classes → R32.4 interactive (boxes + relation edges)
          const views = elements.map((el, i) => ({ unit: `modelelement:${el.uuid}`, x: (i % COLS) * 220 + 20, y: Math.floor(i / COLS) * 200 + 20, viewKind: deriveViewKind('ior:class:ModelElement', { kind: el.kind }) })); // R40.23: single-sourced (el.kind, not hardcoded 'class' — interfaces now correct)
          const diagramUuid = detUuid(`diagram::${sourceFile}`);
          writeUnit('ior:class:Diagram', { uuid: diagramUuid, name: `${base} (${elements.length} classes)`, views });
          const pumlUuid = detUuid(`puml::${sourceFile}`); // the .puml source text → puml/
          writeUnit('ior:class:PumlArtifact', { uuid: pumlUuid, name: `${base}.puml`, text: puml, sourceFile });
          addLog(`[model] import-puml '${base}' → ${elements.length} classes / ${memberCount} members / ${relations.length} relations → diagram ${diagramUuid.slice(0, 8)} + puml ${pumlUuid.slice(0, 8)} (store-only, prod untouched)`);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, elements: elements.length, members: memberCount, relations: relations.length, diagramUuid, pumlUuid }));
        } catch (e: any) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e?.message || 'import-puml-failed' })); }
      });
      return;
    }
    if (filepath === '/api/trace') {
      try {
        const scenarioDir = path.join(__dirname, '../../../scenario/index');
        const idx = new ScenarioIndex(scenarioDir);
        const graph = new TraceGraph();
        for (const uuid of idx.list()) {
          const unit = idx.get(uuid);
          if (!unit) continue;
          const iorType = unit.ior.replace('ior:class:', '').toLowerCase();
          const baseType = (iorType === 'bug' || iorType === 'changerequest') ? 'requirement' : (iorType === 'testcase' || iorType === 'gate') ? 'test' : (iorType === 'currentsprint') ? 'task' : iorType;
          if (!graph.has(uuid)) {
            try { makeObject(graph, baseType as ObjectType, uuid, String(unit.model.name || '')); } catch { continue; }
          }
          const obj = graph.get(uuid);
          if (!obj) continue;
          if (iorType !== baseType) (obj as any).type = iorType;
          if (unit.model.name) obj.title = String(unit.model.name);
          if (unit.model.status) obj.status = String(unit.model.status);
          if (iorType === 'gate' && (unit.model as any).verdict) obj.status = String((unit.model as any).verdict);
          for (const key of scenarioFwd(iorType)) {
            const refs = (unit.model as Record<string, unknown>)[key];
            if (!Array.isArray(refs)) continue;
            for (const ref of refs) {
              const childUuid = String(ref).replace('ior:instance:', '');
              if (childUuid && /^[0-9a-f]{8}-/.test(childUuid)) obj.addRef(key, childUuid);
            }
          }
        }
        const forwardOnlyObjects = graph.toJSON().map((obj: FlatObject) => {
          const fwdKeys = scenarioFwd(obj.type);
          const links: Record<string, string[]> = {};
          for (const k of fwdKeys) { if (obj.links[k]) links[k] = obj.links[k]; }
          return { ...obj, links };
        });
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify({ objects: forwardOnlyObjects, broken: [], issueCount: 0 }));
      } catch (e: any) {
        addLog(`/api/trace error: ${e?.message || e}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'trace scan failed' }));
      }
      return;
    }

    // T187: /api/trace/sprints — Sprint navigation roots (Sprint→Tasks)
    if (filepath === '/api/trace/sprints') {
      try {
        const idx = new ScenarioIndex(path.join(__dirname, '../../../scenario/index'));
        // R35.4 DRY: SAME shared ordered-Sprint source as the traceability folder (parity by construction). Shape unchanged.
        const sprints = sprintOverviewNodes(idx).map((s) => ({ uuid: s.uuid, type: 'Sprint', name: sprintDisplayName(s.name, s.number), number: s.number, hasChildren: s.taskCount > 0, childCount: s.taskCount })); // R40.4-phase2: compose display once at the server node → clients render verbatim
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(sprints));
      } catch { res.writeHead(500); res.end('[]'); }
      return;
    }

    // T173: /api/trace/roots — Requirement roots for lazy tree
    if (filepath === '/api/trace/roots') {
      try {
        const scenarioDir = path.join(__dirname, '../../../scenario/index');
        const idx = new ScenarioIndex(scenarioDir);
        const roots = idx.list().map(uuid => {
          const u = idx.get(uuid);
          if (!u || u.ior !== 'ior:class:Requirement') return null;
          return { uuid, type: 'Requirement', name: String(u.model?.name || ''), hasChildren: (Array.isArray(u.model?.useCases) && (u.model.useCases as string[]).length > 0) || (Array.isArray(u.model?.tasks) && (u.model.tasks as string[]).length > 0) };
        }).filter(Boolean);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(roots));
      } catch { res.writeHead(500); res.end('[]'); }
      return;
    }

    // T173: /api/trace/children/<uuid> — one-hop forward children per LOCKED chain
    if (filepath.startsWith('/api/trace/children/')) {
      const uuid = decodeURIComponent(filepath.slice('/api/trace/children/'.length)).replace(/^ior:instance:/, '').replace(/\.scenario\.json$/, '').trim();
      try {
        // S33-P2b (INV-P2b-2): a SYNTHETIC MOF folder uuid (mof-*/project:*/file:*) resolves ONE bounded layer LAZILY
        // from the ISOLATED MODEL_STORE via mofChildren — the deep MOF tree is NEVER inlined in /api/model/tree's roots
        // payload. Public parity with /api/model/tree (also ungated, data-only). Real ModelElement uuids fall through.
        if (/^(mof-m1|mof-m2|project:|file:|rawbin:|dir:)/.test(uuid)) { // R33.3-BUG fix: dispatch must include rawbin: (matches mofChildren's guard :1073) — else rawbin:ts|puml|diagram fell through to the ModelElement path → 404 {} → empty expand
          ensureStoreSeeded();
          const mofKids = mofChildren(new ScenarioIndex(MODEL_STORE), uuid) || [];
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
          res.end(JSON.stringify({ uuid, type: 'collection', name: '', hasChildren: mofKids.length > 0, children: mofKids, parent: null }));
          return;
        }
        // R32.5: a ModelElement/Diagram uuid resolves from the ISOLATED store (its members are model units too); trace units stay prod (union).
        const scenarioDir = isModelUnit(uuid) ? MODEL_STORE : path.join(__dirname, '../../../scenario/index');
        const idx = new ScenarioIndex(scenarioDir);
        const unit = idx.get(uuid);
        if (!unit) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{}'); return; }
        const type = (unit.ior || '').split(':')[2] || '';
        const queryMode = urlParams.get('mode') || 'scenario';
        // [impl:uuid:28f244c7-1a9c-49c5-ab6c-249d906cb9a4] R19.71 Room forward keys
        // [impl:uuid:29730376-7832-477d-8960-98c937f8c2bb] BUG12 Bug+ChangeRequest forward keys
        // R20.15: unified CHAIN_TYPE_CONFIG replaces inline maps
        const fwdKeys = forwardKeysForMode(type, queryMode as 'scenario' | 'trace');
        // R31.8c gap-A: a Feature's children = its allowedUsers, but those are raw TOKENS (not ior:instance refs) so the
        // generic forward-ref resolver below can't build them → delegate to FeatureManager.allowedUsersChildren, which
        // emits composite-ref user-nodes ('profile:<featureUuid>:<token>', carrying the feature ctx for rb-profile-detail revoke).
        if (type === 'Feature') {
          // R31.8c P0 SECURITY (release-blocker, architect 2919770c3): a Feature's children expose MEMBER IDENTITIES →
          // owner/member-gate THIS branch (non-member → 403). Non-Feature units on /api/trace/children stay PUBLIC
          // (the gate is scoped to the Feature branch only → /trace browsing unaffected, INV-F1 no member-token leak).
          if (!requireFeatureAccessHttp(req, res, 'Feature Manager')) return;
          const children = FeatureManager.allowedUsersChildren(uuid, userProfiles);
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
          res.end(JSON.stringify({ uuid, type, name: String(unit.model?.name || ''), children }));
          return;
        }
        // R20.22: CurrentSprint → 3 task children from slots
        if (type === 'CurrentSprint') {
          const model = unit.model as Record<string, unknown>;
          // R40.17 SINGLE-SOURCE + PIN-KEEP (ROOT-1): recompute LIVE each read (never the frozen slots snapshot).
          // The current SPRINT comes from the ONE resolver — resolveSprintPin(idx, designation) — using the singleton's
          // owner designation (sprintName→number + currentTaskUuid). An owner designation WINS and is shown with its
          // REAL derived status ('Sprint 37 — QA-pending'); a genuinely ambiguous NO-designation state fails loud →
          // surfaced HONESTLY as UNRESOLVED, never a silent guess and never a 500. slotsFrom no longer self-derives.
          let slots: any = { current: null, lastCompleted: null, nextBacklog: null, inProgress: [] }; // R40.18: inProgress[] default so a consumer never hits undefined.map
          let pinSprintLabel = '';
          try {
            const desNum = /\d+/.exec(String(model.sprintName || ''))?.[0];
            const nextNum = /\d+/.exec(String(model.nextSprintName || ''))?.[0];
            const pin = resolveSprintPin(idx, { currentSprintNumber: desNum ? Number(desNum) : null, nextSprintNumber: nextNum ? Number(nextNum) : null });
            const cur = pin.current;
            if (cur) pinSprintLabel = `${sprintPrefix(cur.number)} — ${cur.status}${cur.designated ? ' (designated)' : ''}`;
            slots = CurrentSprint.slotsFrom(idx, cur ? { number: cur.number, uuid: cur.uuid, name: cur.name } : undefined, String(model.currentTaskUuid || '') || undefined) as any;
          } catch (e: any) {
            pinSprintLabel = `⚠ UNRESOLVED — ${String(e?.message || e).slice(0, 160)}`; // honest fail-loud, not a crash
          }
          const slotEntries: Array<{ label: string; slot: any }> = [
            { label: '📌 Current', slot: slots.current },
            { label: '✅ Last Completed', slot: slots.lastCompleted },
            { label: '📋 Next Backlog', slot: slots.nextBacklog },
          ];
          const hopStates = (model.hopStates as Record<string, any>) || {};
          const isGateProven = hopStates.test?.status === 'gate-proven';
          const children = slotEntries.filter(s => s.slot?.taskUuid).map(s => {
            const taskUnit = idx.get(s.slot.taskUuid);
            const taskName = taskUnit ? String(taskUnit.model?.name || s.slot.taskName) : s.slot.taskName;
            const isCurrent = s.label.includes('Current');
            const status = isCurrent ? (isGateProven ? 'GATE-PROVEN' : (hopStates.impl?.status === 'done' ? 'IMPL-DONE' : 'IN-PROGRESS')) : '';
            return { uuid: s.slot.taskUuid, type: 'Task', name: `${s.label} — ${taskName}`, hasChildren: true, status, pinSlot: true }; // R40.18: em-dash (role=slot label + entity=taskName, one word one owner, no double-colon); pinSlot flags the client to un-truncate (scoped)
          });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
          // node name surfaces the resolved sprint + its HONEST status label (R40.17); model.name as the fallback.
          res.end(JSON.stringify({ uuid, type, name: pinSprintLabel || String(model.name || 'Current Sprint'), hasChildren: children.length > 0, children }));
          return;
        }
        // Room type: build Members + Files collection children
        if (type === 'Room') {
          const model = unit.model as Record<string, unknown>;
          const membersArr = Array.isArray(model.members) ? model.members : [];
          const filesArr = Array.isArray(model.files) ? model.files : [];
          const memberItems = membersArr.map((m: any) => ({
            uuid: String(m.ior || m.uuid || m.token || '').replace('ior:instance:', ''),
            type: 'Member', name: String(m.name || '?'),
            description: String(m.status || m.role || ''), hasChildren: false,
          }));
          const fileItems = filesArr.map((f: any) => {
            const fUuid = String(f).replace('ior:instance:', '');
            const fu = idx.get(fUuid);
            return { uuid: fUuid, type: fu ? ((fu.ior || '').split(':')[2] || 'File') : 'File', name: fu ? String(fu.model?.name || fUuid.slice(0, 8)) : fUuid.slice(0, 8), hasChildren: false };
          });
          const roomChildren = [
            { uuid: 'members-' + uuid, type: 'collection', name: `Members (${memberItems.length})`, hasChildren: memberItems.length > 0, children: memberItems },
            { uuid: 'files-' + uuid, type: 'collection', name: `Files (${fileItems.length})`, hasChildren: fileItems.length > 0, children: fileItems },
          ];
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
          const ownerIor2 = String(unit.ownerIor || '').replace('ior:instance:', '');
          let parent2: { uuid: string; type: string; name: string } | null = null;
          if (ownerIor2) { const pu = idx.get(ownerIor2); if (pu) parent2 = { uuid: ownerIor2, type: (pu.ior || '').split(':')[2] || '', name: String(pu.model?.name || '') }; }
          res.end(JSON.stringify({ uuid, type, name: String(model.name || ''), hasChildren: true, children: roomChildren, parent: parent2 }));
          return;
        }
        // T192: server-side cycle guard — skip children that are the node itself
        let childRefs: string[] = [];
        for (const key of (fwdKeys)) {
          const val = (unit.model as Record<string, unknown>)[key];
          if (Array.isArray(val)) {
            for (const r of val) {
              const raw = (typeof r === 'object' && r) ? ((r as any).ior || (r as any).uuid || '') : String(r);
              const clean = String(raw).replace('ior:instance:', '');
              if (/^[0-9a-f]{8}-/.test(clean)) childRefs.push(clean);
            }
          } else if (typeof val === 'string') {
            const clean = val.replace('ior:instance:', '');
            if (/^[0-9a-f]{8}-/.test(clean)) childRefs.push(clean);
          }
        }
        childRefs = [...new Set(childRefs)].filter(ref => ref !== uuid); // R31.11: de-dup — an S30 UC carries BOTH 'class'+'classes' keys, so the ['class','classes'] resolve would push the SAME Class twice → double-render without this Set
        // Fallback: if scenario index has no forward UUID arrays, consult scanRepo graph
        if (childRefs.length === 0) {
          try {
            const sprintsDir = path.join(__dirname, '../../../scrum.pmo/sprints');
            const srcDir = path.join(__dirname, '../../../src');
            const testDir = path.join(__dirname, '../../../test');
            const { graph } = scanRepo(sprintsDir, srcDir, testDir);
            const graphObj = graph.get(uuid);
            if (graphObj) {
              const links = graphObj.toJSON().links || {};
              for (const key of (fwdKeys)) {
                if (links[key]) for (const r of links[key]) childRefs.push(r.replace(/^[a-z]+:/, ''));
              }
            }
          } catch { /* scanRepo fallback failed — empty children */ }
        }
        // R20.15: unified expectedChildTypes from chain-model
        const allowedTypes = expectedChildTypes(type);
        const ucMethodIor = type === 'UseCase' ? String((unit.model as Record<string, unknown>).method || '').replace('ior:instance:', '') : '';
        const children = childRefs.filter(ref => ref !== uuid).map(ref => {
          const child = idx.get(ref);
          if (child) {
            const ct = (child.ior || '').split(':')[2] || '';
            if (allowedTypes.length > 0 && !allowedTypes.includes(ct)) return null;
            const childModel = child.model as Record<string, unknown> || {};
            // R31.11 RESIDUAL: childCount via the SAME forward-key resolution as the walk (was a hard-coded plural-only
            // key list + filter(Array.isArray) that dropped SINGULAR 'class' AND string refs → S31 UC childCount=0 →
            // hasChildren=false → rendered a LEAF, no chevron). Set-DEDUP is REQUIRED: an S30 UC carries BOTH 'class'+
            // 'classes' (same Class) → a naive string(1)+array(len) count would regress its badge 1→2.
            const cRefSet = new Set<string>();
            for (const k of forwardKeysForMode(ct, queryMode as 'scenario' | 'trace')) {
              const v = (childModel as Record<string, unknown>)[k];
              const addRef = (r: unknown): void => { const s = String((typeof r === 'object' && r) ? ((r as { ior?: string; uuid?: string }).ior || (r as { ior?: string; uuid?: string }).uuid || '') : r).replace('ior:instance:', ''); if (/^[0-9a-f]{8}-/.test(s)) cRefSet.add(s); };
              if (Array.isArray(v)) v.forEach(addRef); else if (typeof v === 'string') addRef(v);
            }
            const childCount = cRefSet.size;
            const childStatus = ct === 'Gate' ? String(childModel.verdict || childModel.status || '') : String(childModel.status || '');
            // R22.3 per-child sourceFile+sourceLine (mirrors top-level logic below) — plumbing in an anon route callback, no chain Method
            const cRawSrc = String(childModel.sourceFile || '').replace('ior:file:', '');
            const cSrc = (cRawSrc && !cRawSrc.includes('.scenario.json')) ? cRawSrc : undefined;
            const cLine = cSrc ? ((childModel.sourceLine as number) || undefined) : undefined;
            const entry: Record<string, unknown> = { uuid: ref, type: ct === 'ModelElement' ? modelFacetType(childModel, idx) : ct, name: String(child.model?.name || ''), hasChildren: childCount > 0, childCount, ...(childModel.assigned ? { assignee: String(childModel.assigned) } : {}), ...(childStatus ? { status: childStatus } : {}), ...(cSrc ? { sourceFile: cSrc, sourceLine: cLine } : {}) };
            attachChainMethod(entry, type, ct, ucMethodIor, idx); // R31.10: attach UC.method as entry.chainMethod in ALL modes (extracted to the named attachChainMethod decl below for strict-impl credit)
            return entry;
          }
          return null; // v0.6.92: skip dangling refs (unit removed/missing) — never render a raw UUID as a name
        }).filter(Boolean);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        const ownerIor = String(unit.ownerIor || '').replace('ior:instance:', '');
        let parent: { uuid: string; type: string; name: string } | null = null;
        if (ownerIor) {
          const parentUnit = idx.get(ownerIor);
          if (parentUnit) parent = { uuid: ownerIor, type: (parentUnit.ior || '').split(':')[2] || '', name: String(parentUnit.model?.name || '') };
        }
        if (!parent) {
          const FWD_SCAN: Record<string, string[]> = { Requirement: ['tasks','useCases'], Task: ['useCases','children','subtasks','coveredRequirements'], UseCase: ['class','classes'], Class: ['methods'], Method: ['implementations'], Implementation: ['tests'], Sprint: ['tasks','requirements'] }; // R31.11: UseCase parent-scan symmetry (singular 'class' + legacy 'classes')
          for (const pUuid of idx.list()) {
            if (parent) break;
            const pUnit = idx.get(pUuid);
            if (!pUnit) continue;
            const pType = (pUnit.ior || '').split(':')[2] || '';
            for (const key of (FWD_SCAN[pType] || [])) {
              const arr = (pUnit.model as Record<string, unknown>)[key];
              if (!Array.isArray(arr)) continue;
              if (arr.some(r => String(r).replace('ior:instance:', '') === uuid)) {
                parent = { uuid: pUuid, type: pType, name: String(pUnit.model?.name || '') };
                break;
              }
            }
          }
        }
        const rawSource = String(unit.model?.sourceFile || '').replace('ior:file:', '');
        const sourceFile = (rawSource && !rawSource.includes('.scenario.json')) ? rawSource : undefined;
        const sourceLine = sourceFile ? ((unit.model?.sourceLine as number) || undefined) : undefined;
        const extra: Record<string, unknown> = {};
        if (type === 'Room') { extra.mode = unit.model?.mode; extra.visibility = unit.model?.visibility; extra.memberCount = Array.isArray(unit.model?.members) ? (unit.model.members as unknown[]).length : 0; extra.fileCount = Array.isArray(unit.model?.files) ? (unit.model.files as unknown[]).length : 0; }
        // R40.11 slice-3 (AC-3): the unit's own type-driven SCALAR fields, so ONE GENERIC default view renders
        // identity + FIELDS + parent/children for ANY unit. Extraction shared with the gate (detailScalarFields).
        const fields = detailScalarFields(unit.model as Record<string, unknown>);
        res.end(JSON.stringify({ uuid, type: type === 'ModelElement' ? modelFacetType(unit.model as Record<string, unknown>, idx) : type, name: String(unit.model?.name || ''), children, parent, sourceFile, sourceLine, fields, ...extra })); // R32.3: model node display type = M2 model-facet (walk still uses real 'ModelElement' type); R40.11 slice-3: +fields (type-driven)
      } catch { res.writeHead(500); res.end('{}'); }
      return;
    }

    // T127.2: IOR universal resolver endpoint
    if (filepath.startsWith('/api/ior/')) {
      const ior = decodeURIComponent(filepath.slice('/api/ior/'.length));
      try {
        // R35.2 (fork A): ANY synthetic view ref (dir/file/puml-src/project/rawbin/mof) → its REAL lazy-minted MODEL_STORE unit (detail + A1).
        const ff = ensureViewUnit(ior);
        if (ff) { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }); res.end(JSON.stringify({ unit: ff })); return; }
        // R32.5: model units (ModelElement/Diagram) resolve from the ISOLATED store (diagram surface + tree fetch); trace units stay prod.
        const iorUuid = ior.replace(/^ior:(instance|class):/, '');
        const scenarioDir = isModelUnit(iorUuid) ? MODEL_STORE : path.join(__dirname, '../../../scenario/index');
        const idx = new ScenarioIndex(scenarioDir);
        const resolver = new IORResolver(idx, defaultTemplateRegistry(), path.join(__dirname, '../../..'));
        const result = resolver.resolve(ior);
        if (result.unit?.model) reconcileCanonical(iorUuid, result.unit.model as Record<string, unknown>, result.unit.ior); // R36.1/R36.2 part-2: compute-on-read A-merge + UseCase→UmlUseCase facet (canonical view; never writes)
        if (result.unit?.ior === 'ior:class:Task' && result.unit.model) attachTaskChangeRequests(iorUuid, result.unit.model as Record<string, unknown>, idx); // R40.10 BUG-A: durable-backref CRs so a declined CR is reachable on the task surface (compute-on-read, never writes)
        if (result.unit?.ior === 'ior:class:Task' && result.unit.model) { attachTaskPinRole(iorUuid, result.unit.model as Record<string, unknown>, idx); attachTaskMdHref(iorUuid, result.unit.model as Record<string, unknown>, idx); } // T37.26: derived pin-role (Set-as-Current matrix) + task-md href (Open-Task-file action) — compute-on-read, never writes
        if (result.unit?.ior === 'ior:class:Task' && result.unit.model) attachTaskStatus(result.unit.model as Record<string, unknown>); // ed3442d10: derived status at the READ boundary → action-bar control visibility follows STATUS not membership (compute-on-read, never writes)
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(result));
      } catch (e: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e?.message || 'resolve failed' }));
      }
      return;
    }

    if (filepath === '/api/health') {
      const uptime = Math.floor((Date.now() - serverStartTime.getTime()) / 1000);
      // (c) OBSERVABLE revocation state — armed:true ONLY when actually enforcing (intended-armed AND no health
      // error); loaded = count in memory. A 200 alone was ambiguous (not-armed vs armed-correct); this makes the
      // running state independently verifiable, and (b) returns 503 when ARMED but the list is absent/short.
      // option-(iii) OBSERVABILITY (PO refinement): surface the trusted protected-identity config state so an
      // absent/malformed config is VISIBLE here immediately (not discovered weeks later via another cast-out) —
      // computed live per health call. error != null => the owner-safety re-seed fell back to owner-only.
      const _pi = loadProtectedIdentities();
      const base = { uptime, version: getVersion(), connections: wsClients.size, rooms: roomManager.size, revoked: { armed: REVOKED_ARMED && !revokedHealthError, loaded: revokedTokens.size }, protectedIdentities: { configured: _pi.ids.length, error: _pi.error } };
      if (revokedHealthError) {
        res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify({ status: 'unhealthy', reason: revokedHealthError, ...base }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify({ status: 'ok', ...base }));
      return;
    }

    if (req.method === 'POST' && filepath === '/api/puml-render') {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; if (body.length > 500000) { res.writeHead(413); res.end('Too large'); } });
      req.on('end', async () => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 15000);
        try {
          const url = `${plantumlBaseUrl()}/svg/${encodePlantuml(body)}`; // R33.10 BUG-B: render via the plantuml-server docker (configurable URL, deflate+base64)
          const r = await fetch(url, { signal: ctrl.signal as any });
          if (!r.ok) throw new Error(`plantuml-server HTTP ${r.status}`);
          const svg = await r.text();
          res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' });
          res.end(svg);
        } catch (e: any) {
          // Keep the honest 501 when the plantuml-server is unreachable/errored (BUG-B fallback per PO) — NOT a 500.
          res.writeHead(501, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'plantuml render unavailable', detail: String(e?.message || e) }));
        } finally { clearTimeout(timer); }
      });
      return;
    }

    if (filepath.startsWith('/api/files/')) {
      const playerToken = req.headers['x-player-token'] as string || '';
      const adminKey = req.headers['x-admin-key'] as string || '';
      const origin = req.headers['origin'] || req.headers['referer'] || '';
      const isSameOrigin = origin.includes(`localhost:${HTTPS_PORT}`) || origin.includes(BASE_DOMAIN);
      const isAuthorized = isSameOrigin || adminKey === ADMIN_KEY || (playerToken && tokenToClient.has(playerToken));
      if (!isAuthorized) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Unauthorized' })); return; }

      const relPath = decodeURIComponent(filepath.slice('/api/files/'.length));

      if (req.method === 'PUT') {
        // R30.x save-404: writes route to the ALLOWLISTED repo root (RepoRegistry), mirroring the read path — so a diff/
        // merge Save targets the CORRECT repo (?repo=oosh → /root/oosh/<file>), not always rawbin (which 404'd 'cannot
        // create new files' since the file only exists in oosh). Safe: only the 2 allowlisted roots, sanitizePath guards
        // traversal, writeFile still refuses to CREATE new files (overwrite-only). Unknown key → 400.
        const wRoot = RepoRegistry.resolve(urlParams.get('repo'));
        if (!wRoot) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Unknown repo' })); return; }
        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk; if (body.length > 1100000) { res.writeHead(413); res.end('Too large'); } });
        req.on('end', () => {
          try {
            const { content, expectedMtime } = JSON.parse(body);
            if (typeof content !== 'string') { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Missing content' })); return; }
            const result = writeFile(relPath, content, expectedMtime, wRoot);
            const status = 'ok' in result ? 200 : result.status;
            res.writeHead(status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Bad request' })); }
        });
        return;
      }

      // R30.6.7: optional ?repo=<key> → allowlisted root (default rawbin); unknown key → 400. READ across repos.
      const fileRoot = RepoRegistry.resolve(urlParams.get('repo'));
      if (!fileRoot) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Unknown repo' })); return; }
      const isDir = relPath.endsWith('/') || relPath === '';
      const result = isDir ? readDir(relPath, fileRoot) : readFile(relPath, fileRoot);
      if ('error' in result) {
        res.writeHead(result.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: result.error }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(result));
      }
      return;
    }

    // R30.6 — GitApi read-only endpoints (diff/merge editor). Authorized same as /api/files.
    if (filepath.startsWith('/api/git/')) {
      const origin = req.headers['origin'] || req.headers['referer'] || '';
      const isSameOrigin = origin.includes(`localhost:${HTTPS_PORT}`) || origin.includes(BASE_DOMAIN);
      const playerToken = req.headers['x-player-token'] as string || '';
      if (!(isSameOrigin || (playerToken && tokenToClient.has(playerToken)))) {
        res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Unauthorized' })); return;
      }
      try {
        if (filepath === '/api/git/repos') {
          if (req.method === 'POST') { // R30.43 UC4 V1 add-local — read-auth (NOT admin per §10 V1); SOLE check = isGitRepo (.git present); NO allowlist (assertAllowedRoot DORMANT).
            let body = '';
            req.on('data', (c: Buffer) => { body += c; if (body.length > 100000) { res.writeHead(413); res.end('Too large'); } });
            req.on('end', () => {
              try {
                const { method, path: repoPath, label } = JSON.parse(body || '{}');
                if (method !== 'local' || typeof repoPath !== 'string' || !repoPath) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Bad request: expected {method:"local", path, label}' })); return; }
                if (!GitApi.isGitRepo(repoPath)) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Not a git repository — no .git found in ' + repoPath })); return; }
                const key = RepoRegistry.register({ root: repoPath, label: (typeof label === 'string' && label) ? label : undefined });
                const entry = RepoRegistry.list().find(r => r.key === key);
                res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ key, label: entry?.label }));
              } catch { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Bad request' })); }
            });
            return;
          }
          if (req.method === 'DELETE') { // R30.49 delete-for-removable — read-auth (V1 §10.1, D4 admin deferred); BUILTIN-PROTECTED inside RepoRegistry.unregister (559b508b): builtin/unknown key → false → 400.
            const delKey = urlParams.get('key') || '';
            if (!delKey) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Missing key' })); return; }
            const ok = RepoRegistry.unregister(delKey); // dynamic-only; a builtin (rawbin/oosh) is NEVER removable
            res.writeHead(ok ? 200 : 400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(ok ? { ok: true, key: delKey } : { error: 'Not removable (builtin or unknown key)' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ repos: RepoRegistry.list() })); return; // GET: repo picker source (key+label+builtin/removable)
        }
        // R30.6.7: resolve the repo KEY → allowlisted abs root (default rawbin); unknown key → 400 (never a client path).
        const root = RepoRegistry.resolve(urlParams.get('repo'));
        if (!root) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Unknown repo' })); return; }
        if (filepath === '/api/git/current-branch') { // R30.x save-404: the working-tree branch a Save targets (for the center header 'file@branch')
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ branch: await GitApi.currentBranch(root) })); return;
        }
        if (filepath === '/api/git/repo-info') { // R30.45 UC6 manageInfo — key+label+resolved path+currentBranch+worktrees (manage panel); read-auth
          const infoKey = urlParams.get('repo') || 'rawbin';
          const infoLabel = RepoRegistry.list().find(r => r.key === infoKey)?.label || infoKey;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ key: infoKey, label: infoLabel, path: root, currentBranch: await GitApi.currentBranch(root), worktrees: await GitApi.worktrees(root) }));
          return;
        }
        if (filepath === '/api/git/branches') {
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ branches: await GitApi.branches(root) })); return;
        }
        if (filepath === '/api/git/commits') {
          const commits = await GitApi.commits(root, urlParams.get('ref') || '', urlParams.get('path') || '', Number(urlParams.get('limit') || 20));
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ commits })); return;
        }
        if (filepath === '/api/git/file') {
          const content = await GitApi.fileAtRef(root, urlParams.get('ref') || '', urlParams.get('path') || '');
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ content })); return;
        }
        if (filepath === '/api/git/merge-base') { // R30.9: common ancestor of two refs (base for diff3)
          const base = await GitApi.mergeBase(root, urlParams.get('a') || '', urlParams.get('b') || '');
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ base })); return;
        }
        if (filepath === '/api/git/file-history') { // R30.10: version history of one file (right-side default)
          const history = await GitApi.fileHistory(root, urlParams.get('path') || '');
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ history })); return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Unknown git endpoint' })); return;
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: String((e as Error)?.message || e) })); return;
      }
    }

    if (filepath.startsWith('/api/avatar/')) {
      const token = filepath.slice('/api/avatar/'.length).split('/')[0];
      if (!token || !fileExists(token, 'avatar')) {
        const fallback = path.join(PUBLIC_DIR, 'icon-192.png');
        try {
          const data = await fs.readFile(fallback);
          res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' });
          res.end(data);
        } catch { res.writeHead(404); res.end('Not found'); }
        return;
      }
      try {
        const encPath = path.join(getUserHomeDir(token, { mint: false }), 'files', 'avatar.enc'); // R40.22: routed through the chokepoint (was raw data/users/token); READ, no-home throw caught by this block's try/catch → 404
        const encData = await fs.readFile(encPath);
        const etag = '"' + crypto.createHash('md5').update(encData).digest('hex') + '"';
        if (req.headers['if-none-match'] === etag) { res.writeHead(304); res.end(); return; }
        const { data, mimeType } = decryptFile(token, 'avatar');
        addLog(`Avatar GET: token=${token.slice(0,8)} mime=${mimeType} size=${data.length}`);
        res.writeHead(200, { 'Content-Type': mimeType, 'ETag': etag, 'Cache-Control': 'no-cache, must-revalidate' });
        res.end(data);
      } catch { res.writeHead(500); res.end('Decrypt error'); }
      return;
    }

    // [impl:uuid:50a26658-8fac-4fa5-aa8b-cc57ff50870a] R20.31 serveVCard GET /api/vcard/:token
    if (filepath.startsWith('/api/vcard/')) {
      const token = filepath.slice('/api/vcard/'.length).split('/')[0];
      if (!token || !fileExists(token, 'vcard')) { res.writeHead(404); res.end('No vCard stored'); return; }
      try {
        const { data, mimeType } = decryptFile(token, 'vcard');
        res.writeHead(200, { 'Content-Type': (mimeType || 'text/vcard') + '; charset=utf-8', 'Cache-Control': 'no-cache, must-revalidate' });
        res.end(data.toString('utf-8'));
      } catch { res.writeHead(500); res.end('Decrypt error'); }
      return;
    }

        if (filepath.startsWith('/api/phone/')) {
      const raw = decodeURIComponent(filepath.slice('/api/phone/'.length).split('/')[0]);
      const scenarioDir = path.join(__dirname, '../../../scenario/index');
      const phoneIdx = new PhoneIndex(new ScenarioIndex(scenarioDir));
      const phoneIdx2 = phoneIdx;
      let profileUuid = phoneIdx2.resolveToProfile(raw);
      if (!profileUuid) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found', key: normalizePhone(raw) })); return; }
      // v0.6.93: follow a consolidated (redirectTo) profile to its PRIMARY, and return the masked name
      // so onboarding can recognise an existing user ("Unlock device with your secret code — M••• D•••").
      const resolved = userProfiles.get(profileUuid);
      if (resolved?.redirectTo) profileUuid = resolved.redirectTo;
      const maskedName = maskName(userProfiles.get(profileUuid)?.name || '');
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify({ key: normalizePhone(raw), profileUuid, maskedName }));
      return;
    }

        if (filepath === '/api/company/suggest') {
      const q = urlParams.get('q') || '';
      const scenarioDir = path.join(__dirname, '../../../scenario/index');
      const suggestions = q ? new CompanyIndex(new ScenarioIndex(scenarioDir)).suggest(q, 5) : [];
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      // AC-c2: always include a permanent "Create <typed>" bottom row
      res.end(JSON.stringify({ suggestions, create: q ? `Create "${q}"` : null }));
      return;
    }

        if (filepath.startsWith('/api/address/')) {
      const uuid = decodeURIComponent(filepath.slice('/api/address/'.length).split('/')[0]);
      const scenarioDir = path.join(__dirname, '../../../scenario/index');
      const state = new AddressIndex(new ScenarioIndex(scenarioDir)).badgeState(uuid);
      if (!state) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); return; }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify(state));
      return;
    }

    // Docs
    const PROJECT_ROOT = path.join(__dirname, '../../../');
    const DOCS_DIR = path.join(__dirname, '../../../docs');
    const MD_CSS = 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#e0e0e0;line-height:1.6}a{color:#ffffff}a:visited{color:#a8c8ff}a:hover{color:#b8d8ff;text-decoration:underline}h1,h2,h3{margin-top:1.5em;color:white}code{background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:0.9em;color:#e0e0e0}pre{background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;overflow-x:auto}pre code{background:none;padding:0}table{border-collapse:collapse;width:100%}th,td{border:1px solid rgba(255,255,255,0.2);padding:8px;text-align:left}th{background:rgba(255,255,255,0.1)}ul,ol{padding-left:1.5em;margin:0.5em 0}ul ul,ol ol,ul ol,ol ul{padding-left:1.5em;margin:0.25em 0}li{margin:0.2em 0}li>ul,li>ol{margin-top:0.2em}input[type="checkbox"]{margin-right:0.4em;vertical-align:middle;accent-color:#667eea}.bc-link{color:#ffffff;text-decoration:none}.bc-link:visited{color:#a8c8ff}.bc-link:hover{color:#b8d8ff;text-decoration:underline}';

    if (filepath === '/docs' || filepath === '/docs/') {
      try {
        const files = fsSync.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
        const list = files.map(f => `<li><a href="/docs/${f}">${f.replace('.md', '')}</a></li>`).join('');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`${pageHead('Docs')}<style>${MD_CSS}</style>${pageNav()}<div style="max-width:700px;margin:0 auto;padding:0 20px"><h1>RawBin Docs</h1><ul>${list}</ul></div></body></html>`);
      } catch { res.writeHead(404); res.end('Docs not found'); }
      return;
    }
    if (filepath.startsWith('/docs/') && filepath.endsWith('.md')) {
      const relPath = filepath.slice(6);
      if (relPath.includes('..')) { res.writeHead(403); res.end('Forbidden'); return; }
      const mdFile = path.join(DOCS_DIR, relPath);
      try {
        const md = fsSync.readFileSync(mdFile, 'utf-8');
        const html = marked(md) as string;
        const backLink = path.dirname(relPath) === '.' ? '/docs' : `/docs/${path.dirname(relPath)}`;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`${pageHead(path.basename(filepath, '.md'))}<style>${MD_CSS}</style>${pageNav(backLink, 'Back', `docs/${relPath}`)}<div style="max-width:700px;margin:0 auto;padding:0 20px">${html}</div></body></html>`);
      } catch { res.writeHead(404); res.end('Doc not found'); }
      return;
    }
    if (filepath.startsWith('/md/') && filepath.endsWith('/')) {
      const relPath = filepath.slice(4);
      if (relPath.includes('..')) { res.writeHead(403); res.end('Forbidden'); return; }
      const dirPath = path.join(PROJECT_ROOT, relPath);
      try {
        const entries = fsSync.readdirSync(dirPath, { withFileTypes: true });
        const editExts = new Set(['.md', '.sh', '.puml', '.ts', '.css', '.json', '.html', '.env', '.mjs']);
        const highlightFile = urlParams.get('highlight') || '';
        const highlightLine = urlParams.get('line') || '';
        const editIcon = (name: string) => {
          if (!editExts.has(path.extname(name))) return '';
          const lineHash = (name === highlightFile && highlightLine) ? `#L${highlightLine}` : '';
          return ` <a href="/edit/${relPath}${name}${lineHash}" style="opacity:0.5;text-decoration:none;font-size:0.8em" title="Edit">✏️</a>`;
        };
        const isHighlighted = (name: string) => name === highlightFile;
        const symlinkIcon = (e: any) => { if (!e.isSymbolicLink()) return ''; try { const target = fsSync.readlinkSync(path.join(dirPath, e.name)); const abs = path.resolve(dirPath, target); const mdRel = path.relative(PROJECT_ROOT, abs); return ` <a href="/edit/${mdRel}" style="text-decoration:none;font-size:0.8em" title="→ ${target}">🔗</a>`; } catch { return ' 🔗'; } };
        const scenarioLink = (e: any) => {
          if (!relPath.startsWith('scenario/sprints.md/') || !e.name.endsWith('.md')) return '';
          const slug = e.name.replace('.md', '');
          // Strategy 1: UUID slug → direct index lookup
          const uuidMatch = slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
          if (uuidMatch) {
            const hex = slug.replace(/-/g, '');
            const idxPath = `scenario/index/${hex[0]}/${hex[1]}/${hex[2]}/${hex[3]}/${hex[4]}/${slug}.scenario.json`;
            if (fsSync.existsSync(path.join(PROJECT_ROOT, idxPath))) return ` <a href="/edit/${idxPath}" style="text-decoration:none;font-size:0.8em" title="Scenario JSON">🔗</a>`;
          }
          // Strategy 2: speaking-name slug → sprint tree scan (flat + class subdirs)
          const sjDir = path.join(PROJECT_ROOT, 'scenario', 'sprints.json');
          try { for (const sp of fsSync.readdirSync(sjDir)) { const spDir = path.join(sjDir, sp); let jp = path.join(spDir, `${slug}.json`); if (fsSync.existsSync(jp)) return ` <a href="/edit/scenario/sprints.json/${sp}/${slug}.json" style="text-decoration:none;font-size:0.8em" title="Scenario JSON">🔗</a>`; try { for (const cd of fsSync.readdirSync(spDir).filter((d: string) => { try { return fsSync.statSync(path.join(spDir, d)).isDirectory(); } catch { return false; } })) { jp = path.join(spDir, cd, `${slug}.json`); if (fsSync.existsSync(jp)) return ` <a href="/edit/scenario/sprints.json/${sp}/${cd}/${slug}.json" style="text-decoration:none;font-size:0.8em" title="Scenario JSON">🔗</a>`; } } catch {} } } catch {}
          return '';
        };
        const breadcrumb = (rel: string): string => { if (!rel) return '<h1>/</h1>'; const parts = rel.replace(/\/$/, '').split('/'); const crumbs: string[] = []; for (let i = 0; i < parts.length; i++) { const href = '/md/' + parts.slice(0, i + 1).join('/') + '/'; const isLast = i === parts.length - 1; if (isLast) { crumbs.push(`<span>${parts[i]}</span>`); } else { crumbs.push(`<a href="${href}" class="bc-link">${parts[i]}</a>`); } } return `<h1 style="font-size:1.1rem">${crumbs.join('<span style="color:#555;margin:0 2px">/</span>')}</h1>`; };
        const inSprintsMd = relPath.startsWith('scenario/sprints.md/');
        const jsonHref = (e: any) => { if (e.name.endsWith('.scenario.json')) { const uuid = e.name.replace('.scenario.json', ''); return `/scenario?ior=${encodeURIComponent(uuid)}`; } return `/md/${relPath}${e.name}`; };
        const isFileOrLink = (e: any) => e.isFile() || e.isSymbolicLink();
        const isDir = (e: any) => { if (e.isDirectory()) return true; if (e.isSymbolicLink()) { try { return fsSync.statSync(path.join(dirPath, e.name)).isDirectory(); } catch { return false; } } return false; };
        const dirs = entries.filter(e => isDir(e) && !e.name.startsWith('.')).map(e => `<li>📁 <a href="/md/${relPath}${e.name}/">${e.name}/</a>${symlinkIcon(e)}</li>`);
        const mds = entries.filter(e => isFileOrLink(e) && e.name.endsWith('.md')).map(e => `<li${isHighlighted(e.name) ? ' style="background:rgba(255,152,0,0.15);border-radius:4px;padding:2px 4px"' : ''}>📄 <a href="/md/${relPath}${e.name}">${e.name}</a>${inSprintsMd ? scenarioLink(e) : symlinkIcon(e)}${editIcon(e.name)}</li>`);
        // R22.4: ALL image types clickable like SVG (was .svg-only) — PNG/JPG/GIF/etc now open in /md viewer
        // [impl:uuid:8eff3378-347e-4d3a-aaec-f3c6dc324b9d] R22.4 FileBrowser.isImage (clickable image links)
        const isImage = (n: string) => /\.(svg|png|jpe?g|gif|webp|bmp|ico|avif)$/i.test(n);
        const images = entries.filter(e => isFileOrLink(e) && isImage(e.name)).map(e => `<li${isHighlighted(e.name) ? ' style="background:rgba(255,152,0,0.15);border-radius:4px;padding:2px 4px"' : ''}>🖼 <a href="/md/${relPath}${e.name}">${e.name}</a>${symlinkIcon(e)}</li>`);
        const jsons = entries.filter(e => isFileOrLink(e) && e.name.endsWith('.json')).map(e => `<li${isHighlighted(e.name) ? ' style="background:rgba(255,152,0,0.15);border-radius:4px;padding:2px 4px"' : ''}>📋 <a href="${jsonHref(e)}">${e.name}</a>${symlinkIcon(e)}${editIcon(e.name)}</li>`);
        const others = entries.filter(e => isFileOrLink(e) && !e.name.endsWith('.md') && !isImage(e.name) && !e.name.endsWith('.json') && !e.name.startsWith('.')).map(e => `<li${isHighlighted(e.name) ? ' style="background:rgba(255,152,0,0.15);border-radius:4px;padding:2px 4px"' : ''}>${e.name}${symlinkIcon(e)}${editIcon(e.name)}</li>`);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`${pageHead(relPath || '/')}<style>${MD_CSS}</style>${pageNav('/md/', 'Browse')}<div style="max-width:700px;margin:0 auto;padding:0 20px">${breadcrumb(relPath)}<ul>${dirs.join('')}${mds.join('')}${images.join('')}${jsons.join('')}${others.join('')}</ul></div></body></html>`);
      } catch { res.writeHead(404); res.end('Directory not found'); }
      return;
    }
    // T173: /md/ .scenario.json direct request → 302 redirect to /scenario?ior=<uuid>
    if (filepath.startsWith('/md/') && filepath.endsWith('.scenario.json')) {
      const basename = path.basename(filepath, '.scenario.json');
      if (/^[0-9a-f]{8}-/.test(basename)) {
        res.writeHead(302, { Location: `/scenario?ior=${encodeURIComponent(basename)}` });
        res.end();
        return;
      }
    }
    if (filepath.startsWith('/md/') && filepath.endsWith('.json') && filepath.includes('scenario/sprints.json/')) {
      const relPath = filepath.slice(4);
      const fullPath = path.join(PROJECT_ROOT, relPath);
      try {
        const resolved = fsSync.realpathSync(fullPath);
        const uuid = path.basename(resolved, '.scenario.json');
        if (/^[0-9a-f]{8}-/.test(uuid)) {
          res.writeHead(302, { Location: `/scenario?ior=${encodeURIComponent(uuid)}` });
          res.end();
          return;
        }
      } catch { /* not a symlink or broken — fall through */ }
    }

    // R18.34 SVG viewer — explicit in-iframe gesture handling (touch + wheel + mouse + dbltap)
    if (filepath === '/svg-viewer' || filepath === '/svg-viewer/') {
      const src = urlParams.get('src') || '';
      if (!src.startsWith('/md/raw/') || src.includes('..')) { res.writeHead(400); res.end('Invalid src'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
      res.end(`<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<style>html,body{margin:0;padding:0;width:100%;height:100%;background:white;overflow:hidden;touch-action:none}
#stage{width:100%;height:100%;overflow:hidden;touch-action:none;position:relative}
#stage>svg{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;display:block;max-width:none;max-height:none}</style>
</head><body><div id="stage"></div><script>
(async()=>{
const src=new URLSearchParams(location.search).get('src');
if(!src)return;
const stage=document.getElementById('stage');
const res=await fetch(src);const text=(await res.text()).replace(/^\\s*<\\?xml[^?]*\\?>\\s*/,'').replace(/^\\s*<!DOCTYPE[^>]*>\\s*/,'');
stage.innerHTML=text;
const svg=stage.querySelector('svg');if(!svg)return;
const vb=svg.getAttribute('viewBox');
const iw=parseFloat(svg.getAttribute('width')||(vb?vb.split(/\\s+/)[2]:'0'))||300;
const ih=parseFloat(svg.getAttribute('height')||(vb?vb.split(/\\s+/)[3]:'0'))||150;
svg.setAttribute('width',String(iw));svg.setAttribute('height',String(ih));
svg.style.width=iw+'px';svg.style.height=ih+'px';
let sw=stage.clientWidth,sh=stage.clientHeight;
// R18.34 D4 persist: restore view across script re-execution (iOS iframe remount on orientation)
const KEY='svg-view:'+src;
let scale=Math.min(sw/iw,sh/ih);let tx=(sw-iw*scale)/2;let ty=(sh-ih*scale)/2;
try{const s=sessionStorage.getItem(KEY);if(s){const j=JSON.parse(s);if(typeof j.scale==='number'&&typeof j.tx==='number'&&typeof j.ty==='number'){scale=j.scale;tx=j.tx;ty=j.ty}}}catch(e){}
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify({scale,tx,ty}))}catch(e){}};
const slog=(m)=>{try{fetch('/api/svg-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({msg:m})})}catch(e){}};
const apply=()=>{const sIn=scale,txIn=tx,tyIn=ty;svg.style.transform='matrix('+sIn+',0,0,'+sIn+','+txIn+','+tyIn+')';save();slog('apply scale='+sIn.toFixed(3)+' tx='+txIn.toFixed(1)+' ty='+tyIn.toFixed(1)+' style.transform='+svg.style.transform)};
apply();
let mode='idle',startTx=0,startTy=0,startX=0,startY=0,startScale=1,startDist=0,startMidX=0,startMidY=0;
const dist=(a,b)=>Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
const mid=(a,b)=>({x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2});
stage.addEventListener('touchstart',e=>{e.preventDefault();
slog('touchstart touches='+e.touches.length+' scale='+scale.toFixed(3));
if(e.touches.length===1){mode='pan';startTx=tx;startTy=ty;startX=e.touches[0].clientX;startY=e.touches[0].clientY}
else if(e.touches.length>=2){mode='pinch';startScale=scale;startTx=tx;startTy=ty;startDist=dist(e.touches[0],e.touches[1]);const m=mid(e.touches[0],e.touches[1]);startMidX=m.x;startMidY=m.y}
},{passive:false});
stage.addEventListener('touchmove',e=>{e.preventDefault();
if(mode==='pan'&&e.touches.length===1){tx=startTx+(e.touches[0].clientX-startX);ty=startTy+(e.touches[0].clientY-startY);apply()}
else if(mode==='pinch'&&e.touches.length>=2){const d=dist(e.touches[0],e.touches[1]);const f=d/startDist;const ns=Math.max(0.1,Math.min(20,startScale*f));
tx=startMidX-(startMidX-startTx)*(ns/startScale);ty=startMidY-(startMidY-startTy)*(ns/startScale);scale=ns;slog('touchmove-pinch touches='+e.touches.length+' f='+f.toFixed(3)+' scale='+ns.toFixed(3));apply();requestAnimationFrame(apply)}
},{passive:false});
stage.addEventListener('touchend',e=>{slog('touchend touches='+e.touches.length+' scale='+scale.toFixed(3));mode='idle';apply();},{passive:false});
stage.addEventListener('touchcancel',e=>{slog('touchcancel touches='+e.touches.length+' scale='+scale.toFixed(3));mode='idle';apply();},{passive:false});
stage.addEventListener('wheel',e=>{
if(e.ctrlKey){e.preventDefault();const rect=stage.getBoundingClientRect();const cx=e.clientX-rect.left;const cy=e.clientY-rect.top;
const f=Math.exp(-e.deltaY*0.01);const ns=Math.max(0.1,Math.min(20,scale*f));
tx=cx-(cx-tx)*(ns/scale);ty=cy-(cy-ty)*(ns/scale);scale=ns;apply()}
else{e.preventDefault();tx-=e.deltaX;ty-=e.deltaY;apply()}
},{passive:false});
let dragging=false;
stage.addEventListener('mousedown',e=>{if(e.button!==0)return;dragging=true;startTx=tx;startTy=ty;startX=e.clientX;startY=e.clientY;e.preventDefault()});
window.addEventListener('mousemove',e=>{if(!dragging)return;tx=startTx+(e.clientX-startX);ty=startTy+(e.clientY-startY);apply()});
window.addEventListener('mouseup',()=>{dragging=false});
const reset=()=>{sw=stage.clientWidth;sh=stage.clientHeight;scale=Math.min(sw/iw,sh/ih);tx=(sw-iw*scale)/2;ty=(sh-ih*scale)/2;try{sessionStorage.removeItem(KEY)}catch(e){}apply()};
// R18.34.B proper tap detector — distinguishes real dbltap from pinch-release.
// Requires single-finger touchstart, <10px slop, <250ms duration, full lift (touches.length===0).
// tapStart CLEARED on any multi-touch touchstart so pinch can NEVER qualify.
let tapStart=null,lastTapTime=0;
stage.addEventListener('touchstart',e=>{
  if(e.touches.length===1){tapStart={x:e.touches[0].clientX,y:e.touches[0].clientY,t:Date.now()}}
  else{tapStart=null}
},{passive:false});
stage.addEventListener('touchend',e=>{
  if(e.touches.length!==0||!tapStart||e.changedTouches.length!==1){tapStart=null;return}
  const dx=e.changedTouches[0].clientX-tapStart.x,dy=e.changedTouches[0].clientY-tapStart.y,dur=Date.now()-tapStart.t;
  if(Math.hypot(dx,dy)>=10||dur>=250){tapStart=null;return}
  const now=Date.now();
  if(now-lastTapTime<300){slog('dbltap-reset');reset();lastTapTime=0}else{lastTapTime=now}
  tapStart=null;
});
stage.addEventListener('dblclick',e=>{e.preventDefault();reset()});
// R18.34 D4 fix: PRESERVE zoom on viewport changes — only shift tx/ty, NEVER recompute scale.
// Covers: iOS URL-bar settle (resize), orientation change (orientationchange), iOS visualViewport (URL-bar/keyboard).
let lastSw=sw,lastSh=sh;
const onViewport=()=>{const newSw=stage.clientWidth,newSh=stage.clientHeight;if(newSw===lastSw&&newSh===lastSh)return;tx+=(newSw-lastSw)/2;ty+=(newSh-lastSh)/2;lastSw=newSw;lastSh=newSh;sw=newSw;sh=newSh;apply()};
window.addEventListener('resize',onViewport);
window.addEventListener('orientationchange',()=>{setTimeout(onViewport,300)});
if(window.visualViewport)window.visualViewport.addEventListener('resize',onViewport);
})();
</script></body></html>`);
      return;
    }

    if (filepath.startsWith('/md/raw/') && filepath.endsWith('.svg')) {
      const relPath = filepath.slice(8);
      if (relPath.includes('..')) { res.writeHead(403); res.end('Forbidden'); return; }
      const svgFile = path.join(PROJECT_ROOT, relPath);
      try {
        const svg = fsSync.readFileSync(svgFile, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' });
        res.end(svg);
      } catch { res.writeHead(404); res.end('SVG not found'); }
      return;
    }
    if (filepath.startsWith('/md/') && filepath.endsWith('.svg')) {
      const relPath = filepath.slice(4);
      if (relPath.includes('..')) { res.writeHead(403); res.end('Forbidden'); return; }
      const svgFile = path.join(PROJECT_ROOT, relPath);
      if (!fsSync.existsSync(svgFile)) { res.writeHead(404); res.end('SVG not found'); return; }
      const dirPath = path.dirname(relPath);
      const title = path.basename(relPath, '.svg');
      // R18.34: override pageHead viewport to lock outer page (no native pinch on /md/*.svg)
      const lockedHead = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><title>${title} — RawBin</title><link rel="stylesheet" href="/app.css"><script type="module" src="${getBannerScript()}"></script><style>html,body{margin:0;padding:0;overflow:hidden;height:100vh}</style></head><body><rb-update-banner></rb-update-banner>`;
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
      res.end(`${lockedHead}${pageNav('/md/' + dirPath + '/', 'Back')}<iframe src="/svg-viewer?src=${encodeURIComponent('/md/raw/' + relPath)}" style="width:100vw;height:calc(100vh - 60px - env(safe-area-inset-top));border:none;display:block;background:white"></iframe></body></html>`);
      return;
    }
    // R22.4 fix: serve raster images raw so the clickable /md image links RESOLVE (were 404 — only .svg had a handler)
    if (filepath.startsWith('/md/') && /\.(png|jpe?g|gif|webp|bmp|ico|avif)$/i.test(filepath)) {
      const relPath = filepath.slice(4);
      if (relPath.includes('..')) { res.writeHead(403); res.end('Forbidden'); return; }
      const imgFile = path.join(PROJECT_ROOT, relPath);
      try {
        const buf = fsSync.readFileSync(imgFile);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(relPath).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        res.end(buf);
      } catch { res.writeHead(404); res.end('Image not found'); }
      return;
    }
    if (filepath.startsWith('/md/') && filepath.endsWith('.puml')) {
      const relPath = filepath.slice(4);
      if (relPath.includes('..')) { res.writeHead(403); res.end('Forbidden'); return; }
      const pumlFile = path.join(PROJECT_ROOT, relPath);
      try {
        const puml = fsSync.readFileSync(pumlFile, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' });
        res.end(puml);
      } catch { res.writeHead(404); res.end('PUML not found'); }
      return;
    }
    if (filepath.startsWith('/md/') && filepath.endsWith('.md')) {
      const relPath = filepath.slice(4);
      if (relPath.includes('..')) { res.writeHead(403); res.end('Forbidden'); return; }
      const mdFile = path.join(PROJECT_ROOT, relPath);
      try {
        const md = fsSync.readFileSync(mdFile, 'utf-8');
        const dirPrefix = path.dirname(relPath);
        let relinked = md.replace(/\]\(([^)]+\.md)\)/g, (_, p) => `](/md/${dirPrefix}/${p})`);
        relinked = relinked.replace(/\]\(([^)]+\.svg)\)/g, (_, p) => `](/md/${dirPrefix}/${p})`);
        relinked = relinked.replace(/\]\(([^)]+)\.puml\)/g, (_, p) => `](/md/${dirPrefix}/${p}.svg)`);
        const html = marked(relinked) as string;
        // T127.1: cross-nav — extract task/requirement UUID for "Open in trace" link
        const uuidMatch = md.match(/\[task:uuid:([0-9a-f-]{36})\]/i) || md.match(/\[requirement:uuid:([0-9a-f-]{36})\]/i);
        const traceLink = uuidMatch ? ` · <a href="/trace#task.show?uuid=${uuidMatch[1]}" style="color:#ff9800;text-decoration:none;font-size:0.9rem">🔗 Trace</a>` : '';
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`${pageHead(path.basename(filepath, '.md'))}<style>${MD_CSS}</style>${pageNav('/md/', 'Browse', relPath)}${traceLink ? `<div style="padding:0 16px;margin-bottom:8px">${traceLink}</div>` : ''}<div style="max-width:700px;margin:0 auto;padding:0 20px">${html}</div></body></html>`);
      } catch { res.writeHead(404); res.end('File not found'); }
      return;
    }

    filepath = filepath.split('?')[0];

    if (filepath === '/' || filepath === '/index.html') {
      filepath = '/index.html';
    } else if (filepath.startsWith('/edit')) {
      const manifestPath = path.join(PUBLIC_DIR, 'dist', 'build-manifest.json');
      let editJsFile = 'dist/edit.js';
      try {
        const manifest = JSON.parse(fsSync.readFileSync(manifestPath, 'utf-8'));
        if (manifest['edit.js']) editJsFile = 'dist/' + manifest['edit.js'];
      } catch {}
      const htmlPath = path.join(PUBLIC_DIR, 'edit.html');
      const html = fsSync.readFileSync(htmlPath, 'utf-8').replace('dist/edit.js', editJsFile);
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache, must-revalidate' });
      res.end(html);
      return;
    } else if (filepath === '/app' || filepath === '/app/') {
      const manifestPath = path.join(PUBLIC_DIR, 'dist', 'build-manifest.json');
      let appJsFile = 'dist/app.js';
      try {
        const manifest = JSON.parse(fsSync.readFileSync(manifestPath, 'utf-8'));
        if (manifest['app.js']) appJsFile = 'dist/' + manifest['app.js'];
      } catch {}
      const htmlPath = path.join(PUBLIC_DIR, 'app.html');
      const html = fsSync.readFileSync(htmlPath, 'utf-8').replace('dist/app.js', appJsFile);
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache, must-revalidate' });
      res.end(html);
      return;
    } else if (filepath === '/bug-report' || filepath === '/bug-report/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`${pageHead('Bug Report')}
<style>.container{background:white;border-radius:20px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:500px;width:100%;margin:0 auto}
h1{text-align:center;margin-bottom:16px;font-size:1.5rem}
.back{display:inline-block;margin-bottom:12px;color:#667eea;text-decoration:none;font-size:0.9rem}
textarea{width:100%;min-height:120px;border:2px solid rgba(102,126,234,0.3);border-radius:10px;padding:12px;font-size:0.95rem;font-family:inherit;resize:vertical}
textarea:focus{outline:none;border-color:#667eea}
.submit{width:100%;padding:12px;background:#e74c3c;color:white;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;margin-top:12px}
.submit:disabled{opacity:0.5;cursor:default}
.submit:active:not(:disabled){transform:scale(0.97)}
.status{text-align:center;margin-top:12px;font-size:0.9rem}
.ver{text-align:center;font-size:0.7rem;opacity:0.4;margin-top:16px}
</style></head><body>
<div class="container">
<a class="back" href="/">Back</a>
<h1>Bug Report</h1>
<p id="reporter-id" style="font-size:0.75rem;text-align:center;color:#667eea;margin-bottom:8px"></p>
<p style="font-size:0.85rem;opacity:0.6;margin-bottom:12px;text-align:center">Describe the bug you found.</p>
<textarea id="bug-text" placeholder="What happened? What did you expect?" maxlength="500"></textarea>
<p id="char-counter" style="text-align:right;font-size:0.75rem;color:#999;margin:4px 0 8px">0/500</p>
<button class="submit" id="bug-submit">Submit Bug Report</button>
<p class="status" id="bug-status"></p>
<p class="ver" id="ver"></p>
</div>
<script>
var ws,connected=false;
function connect(){
  ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host);
  ws.onopen=function(){connected=true};
  ws.addEventListener('message',function(e){
    var m=JSON.parse(e.data);
    if(m.type==='welcome'){
      var token=localStorage.getItem('rawbin-player-id')||'';
      var devId=localStorage.getItem('rawbin-device-id')||'';
      if(token)ws.send(JSON.stringify({type:'IDENTIFY',playerToken:token,deviceId:devId,name:localStorage.getItem('rawbin-name')||'',screenWidth:screen.width,screenHeight:screen.height,platform:navigator.platform}));
    }
    if(m.type==='TOKEN_REDIRECT'&&m.newToken)localStorage.setItem('rawbin-player-id',m.newToken);
  });
  ws.onmessage=function(e){
    var m=JSON.parse(e.data);
    if(m.type==='PROFILE'&&m.profile){var r=document.getElementById('reporter-id');if(r)r.textContent='Reporting as: '+(m.profile.name||'Unknown')+' ('+m.profile.token.slice(0,8)+'...)'}
    if(m.type==='BUG_REPORT_OK'){document.getElementById('bug-status').textContent='Report sent! Thank you.';document.getElementById('bug-text').value='';document.getElementById('char-counter').textContent='0/500';document.getElementById('char-counter').style.color='#999';document.getElementById('bug-submit').disabled=false}
    if(m.type==='ERROR'){document.getElementById('bug-status').textContent='Error: '+m.message;document.getElementById('bug-submit').disabled=false}
  };
  ws.onclose=function(){connected=false;setTimeout(connect,2000)};
}
connect();
document.getElementById('bug-text').addEventListener('input',function(){
  var len=this.value.length;var el=document.getElementById('char-counter');
  el.textContent=len+'/500';el.style.color=len>=450?'#e74c3c':len>=400?'#ff9800':'#999';
});
document.getElementById('bug-submit').addEventListener('click',function(){
  var text=document.getElementById('bug-text').value.trim();
  if(!text){document.getElementById('bug-status').textContent='Please describe the bug.';return}
  if(!connected){document.getElementById('bug-status').textContent='Connecting...';return}
  document.getElementById('bug-submit').disabled=true;
  document.getElementById('bug-status').textContent='Sending...';
  ws.send(JSON.stringify({type:'BUG_REPORT',text:text}));
});
fetch('/api/config').then(function(r){return r.json()}).then(function(c){document.getElementById('ver').textContent='v'+c.version+' · '+c.branch}).catch(function(){});
/* R40.25 INV-PDG-6: owner-only device-gate badge next to the version — is what is served RIGHT NOW device-verified? (403 for non-owners → no badge) */
fetch('/api/gate-status').then(function(r){return r.ok?r.json():null}).then(function(g){if(!g)return;var el=document.getElementById('ver');if(!el)return;var c=g.verdict==='GREEN'?'#2ea043':(g.verdict==='RED'?'#f85149':'#d29922');var t=g.verdict==='GREEN'?'✓ device-verified':(g.verdict==='RED'?'✗ device RED':'⚠ NOT device-verified');el.insertAdjacentHTML('afterend',' <span class="gate-status-badge" title="'+String(g.evidence||'').replace(/"/g,'')+'" style="margin-left:8px;padding:1px 6px;border-radius:6px;font-size:0.6rem;background:'+c+';color:#0d1117">'+t+' v'+g.servedVersion+'</span>')}).catch(function(){});
</script></body></html>`);
      return;
    } else if (filepath === '/profile' || filepath === '/profile/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`${pageHead('Profile')}
<style>.container{background:white;border-radius:20px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:500px;width:100%;margin:0 auto}
h1{text-align:center;margin-bottom:16px;font-size:1.5rem}
h3{font-size:1rem;margin:16px 0 8px;border-bottom:1px solid #eee;padding-bottom:4px}
.back{display:inline-block;margin-bottom:12px;color:#667eea;text-decoration:none;font-size:0.9rem}
.code{text-align:center;font-size:2rem;font-weight:700;letter-spacing:8px;color:#667eea;padding:12px;background:rgba(102,126,234,0.08);border-radius:10px;margin:12px 0}
.field{display:flex;justify-content:space-between;padding:6px 0;font-size:0.85rem;border-bottom:1px solid rgba(0,0,0,0.05)}
.field .label{opacity:0.6}
.device{background:rgba(102,126,234,0.06);border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:0.8rem}
.device .dtype{font-weight:600}
.device .dmeta{opacity:0.5;font-size:0.75rem;margin-top:2px}
.empty{text-align:center;opacity:0.6;padding:16px}
.ver{text-align:center;font-size:0.7rem;opacity:0.4;margin-top:16px}
</style></head><body>
<div class="container">
<a class="back" href="/app">Back to Lobby</a>
<h1>My Profile</h1>
<div style="text-align:center;margin-bottom:12px"><a href="/app?editProfile=1" style="display:inline-block;padding:10px 24px;background:#667eea;color:white;border-radius:10px;text-decoration:none;font-weight:600;font-size:0.95rem">Edit Profile</a></div>
<div id="profile"><p class="empty">Connecting...</p></div>
<div id="feature-grants"></div>
<p class="ver" id="ver"></p>
</div>
<script type="module" src="${getBundleScript('profile-view-entry.js', 'profile-view-entry.js')}"></script>
<script>
const token=localStorage.getItem('rawbin-player-id');
if(!token){document.getElementById('profile').innerHTML='<p class="empty">No profile found. Join a room first.</p>'}
else{
  const ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host);
  ws.onmessage=e=>{
    const m=JSON.parse(e.data);
    if(m.type==='welcome'){ws.send(JSON.stringify({type:'IDENTIFY',playerToken:token,deviceId:localStorage.getItem('rawbin-device-id')||'',screenWidth:screen.width,screenHeight:screen.height,platform:navigator.platform}))}
    if(m.type==='TOKEN_REDIRECT'&&m.newToken){localStorage.setItem('rawbin-player-id',m.newToken)}
    if(m.type==='PROFILE'&&m.profile){
      const p=m.profile;var cids=m.connectedDeviceIds||[];
      const el=document.getElementById('profile');
      // R31.8c round-3: render own profile through the SHARED <rb-profile-view> (same component the FM drawer uses) —
      // the migration that PROVES it's the real viewer. Feed it the full m.profile (token/secretCode/devices/bugReports)
      // + connectedDeviceIds (online dots). Retires the bespoke inline HTML string (layout now lives in RbProfileView).
      el.innerHTML='';
      var pv=document.createElement('rb-profile-view');
      pv.data=m.profileViewData||{name:p.name,avatar:(p.avatar&&p.avatar.indexOf('/api/avatar/')===0?p.avatar:''),token:p.token,secretCode:p.secretCode,devices:p.devices||[],bugReports:p.bugReports||[],connectedDeviceIds:cids}; // R31.8c round-4 FIX-B: prefer the SHARED server-built profileViewData (===drawer), inline fallback
      el.appendChild(pv);
      ${renderFeatureGrants()}
    }
  };
}
fetch('/api/config').then(r=>r.json()).then(c=>{document.getElementById('ver').textContent='v'+c.version+' · '+c.branch}).catch(()=>{});
/* R40.25 INV-PDG-6: owner-only device-gate badge (403 for non-owners → no badge) */
fetch('/api/gate-status').then(r=>r.ok?r.json():null).then(g=>{if(!g)return;const el=document.getElementById('ver');if(!el)return;const c=g.verdict==='GREEN'?'#2ea043':(g.verdict==='RED'?'#f85149':'#d29922');const t=g.verdict==='GREEN'?'✓ device-verified':(g.verdict==='RED'?'✗ device RED':'⚠ NOT device-verified');el.insertAdjacentHTML('afterend',' <span class="gate-status-badge" title="'+String(g.evidence||'').replace(/"/g,'')+'" style="margin-left:8px;padding:1px 6px;border-radius:6px;font-size:0.6rem;background:'+c+';color:#0d1117">'+t+' v'+g.servedVersion+'</span>')}).catch(()=>{});
</script></body></html>`);
      return;
    }

    const fullPath = path.join(PUBLIC_DIR, filepath);
    const ext = path.extname(fullPath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' }); res.end('403 Forbidden'); return;
    }
    const data = await fs.readFile(fullPath);
    const etag = '"' + crypto.createHash('md5').update(data).digest('hex') + '"';
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304); res.end(); return;
    }
    const headers: Record<string, string> = { 'Content-Type': mimeType, 'ETag': etag };
    const basename = path.basename(filepath);
    const isHtml = ext === '.html';
    const isNeverCache = basename === 'sw.js' || basename === 'manifest.json' || basename === 'app.css';
    const isHashed = /\-[a-zA-Z0-9]{8,}\.(js|css)$/.test(filepath);
    if (isHtml || isNeverCache) {
      headers['Cache-Control'] = 'no-cache, must-revalidate';
    } else if (isHashed || ext === '.png' || ext === '.ico') {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }
    res.writeHead(200, headers);
    res.end(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') { res.writeHead(404, { 'Content-Type': 'text/html' }); res.end(`${pageHead('404')}${pageNav('/md/', 'Browse')}<div style="max-width:700px;margin:40px auto;padding:0 20px;color:#e0e0e0;text-align:center"><h1>404 — Not Found</h1><p style="margin-top:12px"><a href="/md/" style="color:#ff9800">← Back to Browse</a> · <a href="/trace" style="color:#667eea">Traceability</a></p></div></body></html>`); }
    else { res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end('500 Internal Server Error'); }
  }
}

// --- SSL ---

async function generateCertificate(): Promise<boolean> {
  if (hasLeCert) { addLog(`SSL: Let's Encrypt cert (${LE_DOMAIN})`); return true; }
  if (fsSync.existsSync(CERT_FILE) && fsSync.existsSync(KEY_FILE)) { addLog('SSL: self-signed cert'); return true; }
  try {
    await fs.mkdir(SELF_SIGNED_DIR, { recursive: true });
    await execAsync(`openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 -keyout "${KEY_FILE}" -out "${CERT_FILE}" -subj "/CN=localhost" 2>/dev/null`);
    addLog('SSL: generated new self-signed cert');
    return true;
  } catch { return false; }
}

// --- Servers ---

async function startServers(httpOnly: boolean = false): Promise<void> {
  const httpServer = http.createServer((req, res) => {
    if (!httpOnly) {
      const host = req.headers.host ? req.headers.host.replace(/:\d+$/, '') : 'localhost';
      res.writeHead(301, { 'Location': `https://${host}:${HTTPS_PORT}${req.url}` }); res.end();
    } else { handleRequest(req, res); }
  });
  httpServer.listen(PORT);
  if (!httpOnly) {
    try {
      const [key, cert] = await Promise.all([fs.readFile(KEY_FILE, 'utf-8'), fs.readFile(CERT_FILE, 'utf-8')]);
      const httpsServer = https.createServer({ key, cert }, (req, res) => { handleRequest(req, res); });
      httpsServer.listen(HTTPS_PORT);
      setupWebSocketServer(httpsServer);
      void PtyBridge.reapOrphans(addLog); // R31.4 boot-sweep: kill stale sm_* grouped sessions orphaned by a prior restart/crash (none attached at boot → safe)
      FeatureManager.bootstrapSeed(); // R31.8 boot: idempotently seed the hardcoded owner into ServerManager+FeatureManager allowedUsers (seeded membership, INV-G2==1) — no grant path exists that doesn't originate at the owner
    } catch { await startServers(true); }
  }
}

// --- Avatar ---

function generateInitialsSvg(name: string): Buffer {
  const initial = (name || '?')[0].toUpperCase();
  const hue = Math.abs([...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" rx="128" fill="hsl(${hue},60%,45%)"/><text x="128" y="128" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="120" font-weight="700" fill="white">${initial}</text></svg>`;
  return Buffer.from(svg);
}

async function fetchAvatarWithRetry(retries: number = 3): Promise<Buffer | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('https://thispersondoesnotexist.com/');
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 1000) return Buffer.from(buffer);
    } catch {}
    if (i < retries - 1) await new Promise(r => setTimeout(r, 5000));
  }
  return null;
}

async function ensureAvatar(profile: UserProfile): Promise<void> {
  if (!profile.sshKeysGenerated) return;

  // Trust the on-disk avatar.enc FILE, not the profile.avatar STRING. The string can
  // desync (cleared/not persisted) while the encrypted upload still lives on disk —
  // re-fetching a default here would OVERWRITE the user's real photo (T91 root cause).
  // Only fetch a default when no usable avatar.enc exists.
  if (fileExists(profile.token, 'avatar')) {
    try {
      const { mimeType } = decryptFile(profile.token, 'avatar');
      if (mimeType !== 'image/svg+xml') {
        // Real upload on disk — restore the URL if it desynced, and NEVER overwrite it.
        if (profile.avatar !== `/api/avatar/${profile.token}`) {
          profile.avatar = `/api/avatar/${profile.token}`;
          saveProfiles();
          addLog(`Avatar restored from disk: ${profile.token.slice(0, 8)}`);
        }
        return;
      }
      addLog(`Avatar is SVG fallback, retrying photo fetch: ${profile.token.slice(0, 8)}`);
    } catch {
      // T109: decrypt FAILED on an EXISTING avatar.enc (e.g. orphaned by a past rekey).
      // Do NOT fall through to overwrite it with a default — that is PERMANENT LOSS of the
      // user's real avatar (Tron's bug). PRESERVE the file. The client shows a transient
      // fallback while GET /api/avatar fails to decrypt, but the bytes survive for recovery.
      if (profile.avatar !== `/api/avatar/${profile.token}`) {
        profile.avatar = `/api/avatar/${profile.token}`;
        saveProfiles();
      }
      addLog(`Avatar present but undecryptable — preserving, not overwriting: ${profile.token.slice(0, 8)}`);
      return;
    }
  }

  const photoData = await fetchAvatarWithRetry(3);
  let buf: Buffer;
  let mime: string;

  if (photoData) {
    buf = photoData;
    mime = 'image/jpeg';
  } else {
    buf = generateInitialsSvg(profile.name);
    mime = 'image/svg+xml';
    addLog(`Avatar fetch failed, using initials SVG: ${profile.token.slice(0, 8)}`);
  }

  try {
    encryptFile(profile.token, buf, mime, 'avatar.' + (mime === 'image/jpeg' ? 'jpg' : 'svg'), 'avatar');
    profile.avatar = `/api/avatar/${profile.token}`;
    saveProfiles();
    addLog(`Avatar assigned: ${profile.token.slice(0, 8)} (${mime})`);
  } catch (e: any) { addLog(`Avatar encrypt failed: ${e?.message}`); }
}

// --- WebSocket ---

function setupWebSocketServer(server: https.Server): void {
  // R31.2: app ws + terminal ws share ONE upgrade dispatcher (noServer) so the terminal handshake is owner-gated
  // BEFORE the socket opens (INV-G3: a rejected upgrade is destroyed, `connection` never fires, no PTY spawns).
  const wss = new WebSocketServer({ noServer: true });
  const termWss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (req, socket, head) => {
    const path = (req.url || '/').split('?')[0];
    if (path === '/api/server-manager/terminal') {
      // ★ D2 RCE-CONTAINMENT (PO-authorized 2026-08-12, architect-backstopped): the terminal PTY is reachable by
      // the PUBLIC owner-token literal (ServerManagerGuard.ts:12) = arbitrary shell exec on the prod host. Sever
      // the terminal ws-upgrade UNCONDITIONALLY for ALL tokens (owner INCLUDED) BEFORE any gate — fail-more-closed
      // (grants NO ONE, so it cannot let the wrong person in), surgical, reversible (delete this block to restore
      // the feature gate below). Interim until owner-token ROTATION (Tron's held kill-step). INV-G3 destroy-before-
      // open preserved: no PTY ever spawns. The `severed-for-security` header lets the page report HONESTLY (not
      // a broken spinner) so Tron can tell containment from a bug.
      const ip = req.socket.remoteAddress || 'unknown';
      addLog(`[server-manager] D2-CONTAINMENT terminal ws SEVERED for security (ALL tokens, owner incl) path=${path} ip=${ip}`);
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nX-RawBin-Terminal: severed-for-security\r\n\r\n'); socket.destroy();
      return;
      // --- D2-DISABLED original feature gate (restore by deleting the D2 block above) ---
      // if (!ServerManagerGuard.requireFeatureAccess(req, 'Server Manager', resolveSessionToken, featureAllowedUsers).ok) {
      //   const ip = req.socket.remoteAddress || 'unknown';
      //   addLog(`[server-manager] DENY kind=ws path=${path} token=${(ServerManagerGuard.playerTokenFrom(req) || 'none').slice(0, 8)} ip=${ip}`);
      //   socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); socket.destroy(); return;
      // }
      // termWss.handleUpgrade(req, socket, head, (ws) => termWss.emit('connection', ws, req));
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req)); // app ws (post-connect IDENTIFY auth) — unchanged
  });
  termWss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => { // R31.2 owner-gated OPEN → R31.4 PTY bridge
    const pane = new URLSearchParams((req.url || '').split('?')[1] || '').get('pane') || '';
    addLog(`[server-manager] terminal ws OPEN (owner) pane=${pane}`);
    void PtyBridge.attachPane(ws, pane, addLog);
  });
  wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
    const ip = req.socket.remoteAddress || 'unknown';
    const clientId = `${ip}-${Date.now()}`;
    const connectedAt = Date.now();
    const userAgent = req.headers['user-agent'] || '';

    const challenge = crypto.randomBytes(32).toString('hex');
    const client: WebSocketClient = { ws, id: clientId, ip, userAgent, connectedAt, avatarUrl: '', deviceId: '', playerToken: '', authenticated: false, authMethod: 'none', challenge };
    wsClients.add(client);
    addLog(`WS connected: ${ip} (${wsClients.size} online)`);

    ws.send(JSON.stringify({ type: 'welcome', clientId, onlineCount: wsClients.size, challenge }));
    ws.send(JSON.stringify({ type: MSG.SERVER_CONFIG, shareDomain: BASE_DOMAIN || getLocalIP(), httpsPort: HTTPS_PORT }));
    ws.send(JSON.stringify({ type: MSG.ROOM_LIST, rooms: enrichRoomList(roomManager.listRooms(getConnectedOwners())) }));

    ws.on('message', (data) => {
      try { handleMessage(clientId, ws, JSON.parse(data.toString())); } catch (e: any) { addLog(`WS handler error: ${e?.message || e}`); }
    });

    ws.on('close', () => {
      wsClients.delete(client);
      for (const [token, cid] of tokenToClient) { if (cid === clientId) tokenToClient.delete(token); }
      addLog(`WS disconnected: ${ip} (${wsClients.size} online)`);

      const room = roomManager.findMemberRoom(clientId);
      if (room) {
        room.retainOrPrune(clientId);
        if (room.mode !== 'persistent' && room.members.size === 0 && !room.creatorToken) roomManager.removeRoom(room.id);
        addLog(`${clientId.slice(0,8)} ${room.mode === 'persistent' ? 'disconnected from' : 'left'} room ${room.name}`);
      }

      broadcastRoomList();
    });

    ws.on('error', () => { wsClients.delete(client); });
  });
}

// --- WS Message Handler ---

function handleMessage(clientId: string, ws: WebSocket, msg: any): void {
  const send = (data: object) => ws.send(JSON.stringify(data));

  switch (msg.type) {
    case MSG.CREATE_ROOM: {
      const creatorToken = msg.playerToken || [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
      const creatorProfile = creatorToken ? userProfiles.get(creatorToken) : undefined;
      if (!creatorProfile?.profileCommitted) { send({ type: MSG.ERROR, message: 'Profile required' }); break; }
      if (!creatorProfile?.sshKeysGenerated) { send({ type: MSG.ERROR, message: 'SSH keys required' }); break; }

      const memberName = msg.playerName || creatorProfile.name || 'User';
      const clientName = msg.roomName || msg.name || '';
      const roomName = (!clientName || clientName === 'My Room') ? `${creatorProfile.name || memberName}'s Room` : clientName;
      const profileAvatar = creatorProfile?.avatar || '/icon-192.png';
      const member: RoomMember = {
        id: clientId, ws, name: memberName, avatarUrl: profileAvatar,
        playerToken: msg.playerToken || '', disconnected: false,
      };
      const room = roomManager.createRoom(roomName, member, { isPrivate: !!msg.roomKey, roomKey: msg.roomKey || '', creatorToken: creatorToken || '' });
      if (msg.playerToken) tokenToClient.set(msg.playerToken, clientId);

      createRoomHome(creatorToken!, room.id);
      const { publicKey: roomPubKey } = generateRoomKeypair(creatorToken!, room.id);
      writeRoomJson(creatorToken!, room.id, {
        id: room.id, name: room.name, ownerToken: creatorToken!,
        isPrivate: room.isPrivate, roomKey: room.roomKey,
        state: 'active', createdAt: Date.now(), sshKeysGenerated: true,
        sshPublicKey: roomPubKey, chatHistory: [],
      });

      room.sendTo(clientId, { type: MSG.ROOM_JOINED, room: room.info(), members: [...room.members.values()].map(m => ({ id: m.id, name: m.name, avatarUrl: m.avatarUrl, playerToken: m.playerToken, avatarCrop: userProfiles.get(m.playerToken)?.avatarCrop || null })) });
      addLog(`Room created: ${room.name} (${room.id.slice(0,8)}) by ${(creatorToken || '').slice(0,8)} with SSH keypair`);
      break;
    }

    case MSG.JOIN_ROOM: {
      const joinerToken = msg.playerToken || [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
      const joinerProfile = joinerToken ? userProfiles.get(joinerToken) : undefined;
      if (!joinerProfile?.profileCommitted) { send({ type: MSG.ERROR, message: 'Profile required' }); break; }

      const room = roomManager.getRoom(msg.roomId);
      if (!room) { send({ type: MSG.ERROR, message: 'Room not found' }); break; }
      if (room.isPrivate && room.roomKey !== msg.roomKey) { send({ type: MSG.ERROR, message: 'Wrong room key' }); break; }
      const joinName = msg.playerName || 'User';
      if (msg.playerToken) {
        const oldId = tokenToClient.get(msg.playerToken);
        if (oldId && oldId !== clientId && room.members.has(oldId)) {
          send({ type: MSG.ERROR, message: 'You are already in this room' }); break;
        }
        tokenToClient.set(msg.playerToken, clientId);
      }
      const joinProfile = joinerToken ? userProfiles.get(joinerToken) : undefined;
      const joinAvatar = joinProfile?.avatar || '/icon-192.png';
      const member: RoomMember = {
        id: clientId, ws, name: joinName, avatarUrl: joinAvatar,
        playerToken: msg.playerToken || '', disconnected: false,
      };
      const joined = room.addMember(member);
      // [impl:uuid:c96d458c-af29-44c9-a309-15f689c0c0eb] R19.23 no room-full
      if (!joined) { send({ type: MSG.ERROR, message: 'Cannot join room' }); break; }
      if (msg.playerToken && room.getCreatorId() === msg.playerToken) {
        room.setCreator(clientId);
        room.broadcast({ type: MSG.HOST_CHANGED, hostId: clientId });
      }
      addLog(`${joinName} joined room ${room.name}`);
      // [impl:uuid:25b1a3ee-d97f-4525-b482-e203794fb47f] file-restore on JOIN_ROOM
      try {
        const scenarioDir = path.join(__dirname, '../../../scenario/index');
        const idx = new ScenarioIndex(scenarioDir);
        const seen = new Set<string>();
        for (const fuuid of room.fileUnits) {
          if (seen.has(fuuid)) continue;
          seen.add(fuuid);
          const unit = idx.get(fuuid);
          if (unit) {
            const fm = unit.model as Record<string, unknown>;
            send({ type: MSG.FILE_ADDED, roomId: room.id, fileUuid: fuuid, name: fm.name || fuuid, size: fm.size || 0, mimeType: fm.mimeType || '' });
          }
        }
        addLog(`[files] restored ${seen.size} files for room ${room.id.slice(0,8)} from room.fileUnits`);
      } catch (e: any) { addLog(`[JOIN_ROOM files] FAILED: ${e?.message} ${e?.stack || ''}`); }
      broadcastRoomList();
      break;
    }

    case MSG.LEAVE_ROOM: {
      const room = roomManager.findMemberRoom(clientId);
      if (room) {
        room.retainOrPrune(clientId);
        if (room.mode !== 'persistent' && room.members.size === 0 && !room.creatorToken) {
          setTimeout(() => {
            if (room.members.size === 0 && !room.creatorToken) {
              roomManager.removeRoom(room.id);
              broadcastRoomList();
            }
          }, 10 * 60 * 1000);
        }
        send({ type: MSG.ROOM_LEFT });
        broadcastRoomList();
        addLog(`${clientId.slice(0,8)} left room ${room.name}`);
      }
      break;
    }

    case MSG.DELETE_ROOM: {
      const delRoom = roomManager.getRoom(msg.roomId);
      if (!delRoom) { send({ type: MSG.ERROR, message: 'Room not found' }); break; }
      const deleterToken = [...wsClients].find(c => c.id === clientId)?.playerToken || [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
      const isOwner = delRoom.creatorToken ? (delRoom.creatorToken === deleterToken) : (delRoom.getCreatorId() === deleterToken);
      if (!isOwner) { send({ type: MSG.ERROR, message: 'Only the room owner can delete it' }); break; }
      delRoom.broadcast({ type: MSG.ROOM_DELETED, roomId: msg.roomId, reason: 'Room deleted by owner' });
      roomManager.removeRoom(msg.roomId);
      if (delRoom.creatorToken) {
        const roomDir = getRoomDir(delRoom.creatorToken, msg.roomId);
        try { fsSync.rmSync(roomDir, { recursive: true, force: true }); } catch {}
        addLog(`Room dir deleted: ${roomDir}`);
      }
      broadcastRoomList();
      addLog(`Room deleted by owner: ${delRoom.name} (${msg.roomId.slice(0,8)})`);
      break;
    }


    case MSG.UPDATE_ROOM_CONFIG: {
      const cfgRoom = roomManager.getRoom(msg.roomId);
      if (!cfgRoom) { send({ type: MSG.ERROR, message: "Room not found" }); break; }
      const cfgToken = [...wsClients].find(c => c.id === clientId)?.playerToken || [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
      const cfgIsOwner = cfgRoom.creatorToken ? (cfgRoom.creatorToken === cfgToken) : (cfgRoom.getCreatorId() === cfgToken);
      if (!cfgIsOwner) { send({ type: MSG.ERROR, message: "Only the room owner can edit config" }); break; }
      if (typeof msg.name === "string" && msg.name.trim() && msg.name.trim() !== cfgRoom.name) { cfgRoom.name = msg.name.trim().slice(0, 80); }
      if (msg.visibility === "public" || msg.visibility === "by-invite" || msg.visibility === "private") { cfgRoom.setVisibility(msg.visibility); }
      if (msg.mode === "live" || msg.mode === "persistent") { cfgRoom.setMode(msg.mode); }
      (cfgRoom as any).persist();
      cfgRoom.broadcast({ type: MSG.ROOM_CONFIG_UPDATED, room: cfgRoom.info() });
      broadcastRoomList();
      addLog("Room config updated: " + cfgRoom.name + " (" + msg.roomId.slice(0,8) + ") visibility=" + cfgRoom.visibility + " mode=" + cfgRoom.mode);
      break;
    }

    case MSG.ROOM_APPLY: {
      const applyRoom = roomManager.getRoom(msg.roomId);
      if (!applyRoom) { send({ type: MSG.ERROR, message: 'Room not found' }); break; }
      if (applyRoom.visibility !== 'by-invite') { send({ type: MSG.ERROR, message: 'Room is not by-invite' }); break; }
      const applicantName = msg.playerName || 'Someone';
      const applicantToken = msg.playerToken || '';
      applyRoom.broadcast({ type: MSG.ROOM_APPLY_RECEIVED, roomId: applyRoom.id, applicantName, applicantToken, applicantClientId: clientId });
      addLog(`Apply request: ${applicantName} → ${applyRoom.name} (${msg.roomId.slice(0,8)})`);
      break;
    }

    case MSG.ROOM_APPLY_ACCEPT: {
      const acceptRoom = roomManager.getRoom(msg.roomId);
      if (!acceptRoom) { send({ type: MSG.ERROR, message: 'Room not found' }); break; }
      const acceptorToken = [...wsClients].find(c => c.id === clientId)?.playerToken || '';
      const isAcceptorOwner = acceptRoom.creatorToken === acceptorToken;
      if (!isAcceptorOwner) { send({ type: MSG.ERROR, message: 'Only the owner can accept' }); break; }
      const targetClientId = msg.applicantClientId;
      const targetWs = [...wsClients].find(c => c.id === targetClientId);
      if (targetWs) {
        targetWs.ws.send(JSON.stringify({ type: MSG.ROOM_APPLY_ACCEPTED, roomId: msg.roomId, roomName: acceptRoom.name }));
      }
      addLog(`Apply accepted: ${msg.applicantName || '?'} → ${acceptRoom.name}`);
      break;
    }

    case MSG.REMOVE_ROOM: {
      const room = roomManager.getRoom(msg.roomId);
      if (!room) break;
      if (room.members.size > 0 && room.hostId !== clientId) {
        send({ type: MSG.ERROR, message: 'Room still has members' }); break;
      }
      const isHost = room.hostId === clientId;
      const isEmpty = room.members.size === 0;
      if (isHost || isEmpty) {
        roomManager.removeRoom(room.id);
        broadcastRoomList();
        addLog(`Room removed: ${room.name} by ${clientId.slice(0,8)}`);
      }
      break;
    }

    case MSG.LIST_ROOMS: {
      const myToken = [...wsClients].find(c => c.id === clientId)?.playerToken || '';
      send({ type: MSG.ROOM_LIST, rooms: roomListFor(myToken) });
      break;
    }




    case MSG.CHAT_MESSAGE: {
      const room = roomManager.findMemberRoom(clientId);
      if (room && msg.text && typeof msg.text === 'string') {
        const text = msg.text.slice(0, 200);
        const member = room.members.get(clientId);
        const name = member?.name || 'Anonymous';
        const scenarioDir = path.join(__dirname, '../../../scenario/index');
        const chatIdx = new ScenarioIndex(scenarioDir);
        room.addChat(clientId, name, text, chatIdx, publishUnitChanged); // R37.11 slice-1: seam publisher for the new Message unit (complementary to CHAT_MESSAGE broadcast)
      }
      break;
    }

    case MSG.IDENTIFY: {
      let token = msg.playerToken;
      if (!token) break;
      const primaryToken = redirectTombstoneToPrimary(token); // v0.7.1 (R25.7): tombstone → primary (never re-mint)
      if (primaryToken !== token) {
        send({ type: MSG.TOKEN_REDIRECT, newToken: primaryToken });
        token = primaryToken;
      }
      // R40.22 step-3: refuse the 116 auth-invalidated dormant dev/test raw-only tokens BEFORE authenticating.
      // Checked on the RESOLVED token, before authenticated=true. FAIL-OPEN for every unlisted token (a Set
      // miss ⇒ proceed; we never reject a valid one). Zero storage touch; reversible (the list is data).
      if (isRevoked(token, revokedTokens)) {
        addLog(`Revoked token rejected at IDENTIFY: ${token.slice(0, 8)}`);
        break;
      }
      tokenToClient.set(token, clientId);
      const thisClient = [...wsClients].find(c => c.id === clientId);
      if (thisClient) {
        thisClient.deviceId = msg.deviceId || '';
        thisClient.playerToken = token;
        if (!thisClient.authenticated) { thisClient.authenticated = true; thisClient.authMethod = 'token'; }
      }
      const ua = thisClient?.userAgent || '';
      const ip = thisClient?.ip || '';
      const screenSize = msg.screenWidth && msg.screenHeight ? `${msg.screenWidth}x${msg.screenHeight}` : '';
      const now = new Date().toISOString();

      let profile = userProfiles.get(token);
      if (!profile) {
        // R21.4: a phone/email already in the index → device-link to the EXISTING user,
        // do NOT mint a new profile. Challenge for that user's secret code first.
        const knownUuid = resolveKeyToProfile(msg.phone, msg.email);
        if (knownUuid && knownUuid !== token) {
          const kp = userProfiles.get(knownUuid);
          send({ type: MSG.KNOWN_KEY_CHALLENGE, profileUuid: knownUuid, maskedName: maskName(kp?.name || '') });
          addLog(`Known-key challenge: ${token.slice(0,8)} → existing ${knownUuid.slice(0,8)}`);
          break; // no mint, no attach — await DEVICE_ENROLL_REQUEST{profileUuid, secretCode}
        }
        profile = { token, name: '', phone: '', url: '', avatar: '', avatarCrop: null, secretCode: generateSecretCode(), profileCommitted: false, sshKeysGenerated: false, sshKeyGeneratedAt: '', consolidatedFrom: [], bugReports: [] };
        userProfiles.set(token, profile);
      }
      if (msg.name) profile.name = msg.name;
      if (msg.avatar && msg.avatar.startsWith('/api/avatar/')) profile.avatar = msg.avatar;
      saveProfiles();

      // Backfill avatar on every IDENTIFY if missing
      if (profile.sshKeysGenerated && (!profile.avatar || !profile.avatar.startsWith('/api/avatar/'))) {
        ensureAvatar(profile).then(() => {
          if (profile!.avatar) {
            send({ type: MSG.PROFILE_UPDATED, profile: { token: profile!.token, name: profile!.name, avatar: profile!.avatar, avatarCrop: profile!.avatarCrop, profileCommitted: profile!.profileCommitted, sshKeysGenerated: profile!.sshKeysGenerated } });
          }
        }).catch(() => {});
      }

      // Device tracking in separate store
      const devId = msg.deviceId || '';
      const existing = deviceRecords.find(d => d.ownerToken === token && ((devId && d.deviceId === devId) || (d.userAgent === ua && d.ip === ip)));
      if (existing) {
        existing.lastSeen = now;
        existing.connectionCount++;
        if (screenSize) existing.screenSize = screenSize;
        if (msg.platform) existing.platform = msg.platform;
        if (devId && !existing.deviceId) existing.deviceId = devId;
      } else {
        deviceRecords.push({ deviceId: devId, ownerToken: token, userAgent: ua, ip, screenSize, platform: msg.platform || '', firstSeen: now, lastSeen: now, connectionCount: 1, enrolled: false, devicePublicKey: '', enrolledAt: '' });
      }
      saveDevices();

      // Only send THIS user's devices
      const myDevices = deviceRecords.filter(d => d.ownerToken === token);
      const connectedDeviceIds = [...wsClients].filter(c => c.playerToken === token && c.deviceId).map(c => c.deviceId);
      send({ type: MSG.PROFILE, profile: { ...profile, devices: myDevices }, profileViewData: profileViewDataForToken(token, { connectedDeviceIds, profile }), connectedDeviceIds, serverManager: ServerManagerGuard.isOwner(profile.token), features: featuresForToken(profile.token) }); // R31.1 owner flag + R31.8 slice-d: m.features = memberships. R31.8c round-4-fix RED-1: m.profileViewData via the SHARED profileViewDataForToken ENRICH (merges deviceRecords) — SAME path the FM granted-user handler now uses → /profile render === drawer render by construction

      // UC-RM.4 (T93): owner connects → ensure ALL their on-disk rooms are registered (any
      // missed at startup) and carry creatorToken, then advertise. Per-user scan so a user's
      // full room set always loads. Backfill existing rooms in place (no rename/persist drift).
      if (profile.sshKeysGenerated) {
        let registered = 0;
        for (const { userToken, roomId, data } of scanUserRooms(token)) {
          const existing = roomManager.getRoom(roomId);
          if (existing) { if (!existing.creatorToken) existing.creatorToken = data.ownerToken; continue; }
          const placeholder: RoomMember = { id: 'dormant', ws: null as any, name: '', avatarUrl: '', playerToken: userToken, disconnected: true };
          const room = roomManager.createRoom(data.name, placeholder, { id: roomId, isPrivate: data.isPrivate, visibility: (data.visibility as any) || undefined, mode: (data.mode as any) || undefined, roomKey: data.roomKey || '', creatorToken: data.ownerToken });
          room.creatorToken = data.ownerToken;
          room.members.delete('dormant');
          if (data.chatHistory?.length) room.loadChatHistory(data.chatHistory);
          registered++;
        }
        const ownerRooms = roomManager.listRoomsForOwner(token);
        broadcastRoomList();
        addLog(`Owner ${token.slice(0,8)} connected — ${ownerRooms.length} room(s) (${registered} newly registered)`);
      }
      break;
    }

    case MSG.CONSOLIDATE: {
      const myToken = [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
      if (!myToken) { send({ type: MSG.CONSOLIDATE_FAILED, reason: 'Not identified' }); break; }
      const myProfile = userProfiles.get(myToken);
      if (!myProfile) { send({ type: MSG.CONSOLIDATE_FAILED, reason: 'No profile' }); break; }
      const targetToken = msg.targetToken;
      if (!targetToken || targetToken === myToken) { send({ type: MSG.CONSOLIDATE_FAILED, reason: targetToken === myToken ? 'Cannot link with yourself' : 'No target' }); break; }

      const myRoom = roomManager.findMemberRoom(clientId);
      if (!myRoom) { send({ type: MSG.CONSOLIDATE_FAILED, reason: 'Not in a room' }); break; }
      const targetClientId = tokenToClient.get(targetToken) || [...wsClients].find(c => c.playerToken === targetToken)?.id;
      const targetInRoom = targetClientId ? myRoom.members.has(targetClientId) : [...myRoom.members.values()].some(m => m.playerToken === targetToken);
      if (!targetInRoom) { send({ type: MSG.CONSOLIDATE_FAILED, reason: 'User not in your room' }); break; }

      const secretCode = msg.secretCode;
      if (!secretCode) { send({ type: MSG.CONSOLIDATE_FAILED, reason: 'Secret code required' }); break; }
      const friend = userProfiles.get(targetToken);
      if (!friend) { send({ type: MSG.CONSOLIDATE_FAILED, reason: 'User has no profile' }); break; }
      if (friend.secretCode !== secretCode) { send({ type: MSG.CONSOLIDATE_FAILED, reason: 'Wrong secret code' }); break; }
      if (myProfile.consolidatedFrom?.includes(friend.token)) { send({ type: MSG.CONSOLIDATE_FAILED, reason: 'Already linked' }); break; }

      addLog(`Link account: ${myToken.slice(0,8)} absorbs ${targetToken.slice(0,8)}`);

      // Merge devices by updating ownerToken
      const mergedDeviceCount = deviceRecords.filter(d => d.ownerToken === targetToken).length;
      for (const d of deviceRecords) {
        if (d.ownerToken === targetToken) d.ownerToken = myToken;
      }
      if (!myProfile.consolidatedFrom) myProfile.consolidatedFrom = [];
      myProfile.consolidatedFrom.push(friend.token);

      friend.redirectTo = myToken; // v0.7.0 (c): a tombstone — immutable; resolveToken + saveProfiles preserve it, IDENTIFY redirects it (never re-mints)
      friend.secretCode = '';
      friend.bugReports = [];
      saveProfiles();
      saveDevices();

      // v0.7.0 (b): actively evict the absorbed profile from ALL loaded rooms (live), collapsing onto the
      // primary — not just on next load. So a consolidation never leaves a duplicate member behind.
      let evictedRooms = 0;
      for (const rm of roomManager.allRooms()) if (rm.collapseAbsorbedMember(targetToken, myToken)) evictedRooms++;
      addLog(`[consolidate] evicted ${targetToken.slice(0,8)} → ${myToken.slice(0,8)} from ${evictedRooms} room(s)`);

      send({ type: MSG.CONSOLIDATE_OK, mergedDevices: mergedDeviceCount });
      break;
    }

    case MSG.UPDATE_SECRET_CODE: {
      const myToken = [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
      if (!myToken) { send({ type: MSG.SECRET_CODE_FAILED, reason: 'Not identified' }); break; }
      const myProfile = userProfiles.get(myToken);
      if (!myProfile) { send({ type: MSG.SECRET_CODE_FAILED, reason: 'No profile' }); break; }
      const newCode = String(msg.code || '');
      if (!/^\d{4}$/.test(newCode)) { send({ type: MSG.SECRET_CODE_FAILED, reason: 'Must be a 4-digit number' }); break; }
      myProfile.secretCode = newCode;
      saveProfiles();
      send({ type: MSG.SECRET_CODE_OK, code: newCode });
      break;
    }

    case MSG.BUG_REPORT: {
      const text = sanitizeBugReport(msg.text || '');
      if (!text) { send({ type: MSG.ERROR, message: 'Empty bug report' }); break; }
      const bugClient = [...wsClients].find(c => c.id === clientId);
      const reporterToken = bugClient?.playerToken || [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0] || 'unknown';
      const reporterProfile = reporterToken !== 'unknown' ? userProfiles.get(reporterToken) : undefined;
      const memberRoom = roomManager.findMemberRoom(clientId);
      const memberName = memberRoom?.members.get(clientId)?.name || reporterProfile?.name || 'Anonymous';
      const prompt = `[@browser-user ${memberName} ${reporterToken.slice(0, 8)}] BUG REPORT: ${text}`;
      if (reporterToken !== 'unknown') {
        const rp = userProfiles.get(reporterToken);
        if (rp) { if (!rp.bugReports) rp.bugReports = []; rp.bugReports.push({ date: new Date().toISOString(), text, status: 'PLANNED' }); saveProfiles(); }
      }
      try {
        execFile('otmux', ['send', bugReportTarget, prompt, 'Enter'], (err) => { if (err) appendBugReport(memberName, text, reporterToken); });
        send({ type: MSG.BUG_REPORT_OK });
        addLog(`Bug report from ${memberName} (${reporterToken.slice(0, 8)}): ${text.slice(0, 50)}...`);
      } catch { appendBugReport(memberName, text, reporterToken); send({ type: MSG.BUG_REPORT_OK }); }
      break;
    }

    case MSG.PAIR_BUG_REPORT: {
      if (msg.pane && typeof msg.pane === 'string') {
        bugReportTarget = msg.pane.replace(/[^a-zA-Z0-9:._-]/g, '');
        try { fsSync.writeFileSync(PAIRING_PATH, JSON.stringify({ bugReportTarget, pairedAt: new Date().toISOString() })); } catch {}
        send({ type: MSG.PAIR_OK, target: bugReportTarget });
        addLog(`Bug report paired to ${bugReportTarget}`);
      }
      break;
    }

    case MSG.UPDATE_PROFILE: {
      const myToken = [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
      if (!myToken) { send({ type: MSG.ERROR, message: 'Not identified' }); break; }
      const profile = userProfiles.get(myToken);
      if (!profile) { send({ type: MSG.ERROR, message: 'No profile' }); break; }
      if (typeof msg.name === 'string') profile.name = msg.name;
      if (typeof msg.phone === 'string') profile.phone = (normalizePhone(msg.phone) || msg.phone.slice(0, 30)); // R21.3: standardize to +CountryDigits
      if (typeof msg.url === 'string') profile.url = msg.url.slice(0, 200);
      if (typeof msg.avatar === 'string' && msg.avatar.startsWith('/api/avatar/')) profile.avatar = msg.avatar;
      if (msg.avatarCrop && typeof msg.avatarCrop === 'object') profile.avatarCrop = { scale: Number(msg.avatarCrop.scale) || 1, x: Number(msg.avatarCrop.x) || 0, y: Number(msg.avatarCrop.y) || 0 };
      if (typeof msg.secretCode === 'string' && /^\d{4}$/.test(msg.secretCode)) profile.secretCode = msg.secretCode;
      if (profile.name) profile.profileCommitted = true;
      // R21.3: index the phone as an alt-UUID symlink → profile scenario unit (self-healing; never blocks save)
      if (profile.profileCommitted && profile.phone) indexProfilePhone(profile.token, profile.name, profile.phone);
      // R21.5: index email(s) as Email units + alt-UUID symlinks (msg.email single or msg.emails[])
      if (profile.profileCommitted) {
        const emails: string[] = Array.isArray(msg.emails) ? msg.emails.filter((e: any) => typeof e === 'string') : (typeof msg.email === 'string' && msg.email ? [msg.email] : []);
        if (emails.length) indexProfileEmail(profile.token, profile.name, emails);
        // R21.7: addresses — mint sync, verify async (never blocks)
        const addresses: string[] = Array.isArray(msg.addresses) ? msg.addresses.filter((a: any) => typeof a === 'string') : (typeof msg.address === 'string' && msg.address ? [msg.address] : []);
        if (addresses.length) indexProfileAddress(profile.token, profile.name, addresses);
        // R21.8: companies — mint-or-reuse SHARED unit + link (msg.companies[] of string|{name,domain})
        const companies = Array.isArray(msg.companies) ? msg.companies : (msg.company ? [msg.company] : []);
        if (companies.length) indexProfileCompany(profile.token, profile.name, companies);
      }
      if (profile.profileCommitted && !profile.sshKeysGenerated) {
        createUserHome(profile.token);
        generateUserKeypair(profile.token);
        writeUserProfile(profile.token, { token: profile.token, name: profile.name, phone: profile.phone, url: profile.url });
        profile.sshKeysGenerated = true;
        profile.sshKeyGeneratedAt = new Date().toISOString();
        if (!profile.avatar || !profile.avatar.startsWith('/api/avatar/')) {
          ensureAvatar(profile).then(() => {
            if (profile.avatar) {
              send({ type: MSG.PROFILE_UPDATED, profile: { token: profile.token, name: profile.name, avatar: profile.avatar, avatarCrop: profile.avatarCrop, profileCommitted: profile.profileCommitted, sshKeysGenerated: profile.sshKeysGenerated } });
            }
          }).catch(() => {});
        }
      }
      saveProfiles();
      send({ type: MSG.PROFILE_UPDATED, profile: { token: profile.token, name: profile.name, phone: profile.phone, url: profile.url, avatar: profile.avatar, avatarCrop: profile.avatarCrop, secretCode: profile.secretCode, profileCommitted: profile.profileCommitted, sshKeysGenerated: profile.sshKeysGenerated } });

      // Broadcast avatar/crop changes to room members
      const memberRoom = roomManager.findMemberRoom(clientId);
      if (memberRoom) {
        memberRoom.broadcast({ type: MSG.MEMBER_JOINED, member: { id: clientId, name: profile.name, avatarUrl: profile.avatar || '/icon-192.png', playerToken: profile.token, avatarCrop: profile.avatarCrop }, memberCount: memberRoom.members.size }, clientId);
      }
      break;
    }

    case MSG.GET_USER_INFO: {
      const targetToken = msg.playerToken;
      if (!targetToken) { send({ type: MSG.ERROR, message: 'No token provided' }); break; }
      const target = userProfiles.get(targetToken);
      if (!target) { send({ type: MSG.ERROR, message: 'User not found' }); break; }
      send({ type: MSG.USER_INFO, user: { name: target.name, phone: target.phone, url: target.url, avatar: target.avatar, playerToken: target.token } });
      break;
    }

    case MSG.DEVICE_ENROLL_REQUEST: {
      // R21.4: if msg.profileUuid is set, this is a known-key device-link — enroll the
      // new device under the EXISTING profile (not the connecting fresh token).
      const connectingToken = [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
      const targetUuid = (typeof msg.profileUuid === 'string' && msg.profileUuid) ? msg.profileUuid : connectingToken;
      const enrollToken = targetUuid;
      if (!enrollToken) { send({ type: MSG.DEVICE_ENROLL_FAILED, reason: 'Not identified' }); break; }
      const enrollProfile = userProfiles.get(enrollToken);
      if (!enrollProfile) { send({ type: MSG.DEVICE_ENROLL_FAILED, reason: 'No profile' }); break; }
      if (!enrollProfile.sshKeysGenerated) { send({ type: MSG.DEVICE_ENROLL_FAILED, reason: 'Keys not generated' }); break; }
      if (msg.secretCode !== enrollProfile.secretCode) { send({ type: MSG.DEVICE_ENROLL_FAILED, reason: 'Wrong secret code' }); break; }
      // R21.4: device-link success — redirect the connecting fresh token to the existing
      // profile so this device becomes that same user (no new profile, no merge).
      const isDeviceLink = !!(typeof msg.profileUuid === 'string' && msg.profileUuid && msg.profileUuid !== connectingToken);
      const enrollClient = [...wsClients].find(c => c.id === clientId);
      const enrollDeviceId = enrollClient?.deviceId || clientId;
      const result = enrollDevice(enrollToken, enrollDeviceId);
      let deviceRec = deviceRecords.find(d => d.ownerToken === enrollToken && d.deviceId === enrollDeviceId);
      if (!deviceRec && isDeviceLink) {
        // R21.4: the new device was never tracked under the existing profile (IDENTIFY
        // short-circuited at the challenge) — create its record now under the existing user.
        deviceRec = { deviceId: enrollDeviceId, ownerToken: enrollToken, userAgent: enrollClient?.userAgent || '', ip: enrollClient?.ip || '', screenSize: '', platform: '', firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString(), connectionCount: 1, enrolled: false, devicePublicKey: '', enrolledAt: '' };
        deviceRecords.push(deviceRec);
      }
      if (deviceRec) {
        deviceRec.enrolled = true;
        deviceRec.devicePublicKey = result.devicePublicKey;
        deviceRec.enrolledAt = new Date().toISOString();
      }
      saveDevices();
      send({ type: MSG.DEVICE_ENROLL_OK, devicePublicKey: result.devicePublicKey, devicePrivateKey: result.devicePrivateKey, signature: result.signature });
      addLog(`Device enrolled: ${enrollToken.slice(0,8)} / ${enrollDeviceId.slice(0,8)}${isDeviceLink ? ' (R21.4 device-link)' : ''}`);
      if (isDeviceLink) {
        // Adopt the existing identity on this device: redirect token + bind this client.
        tokenToClient.set(enrollToken, clientId);
        if (enrollClient) enrollClient.playerToken = enrollToken;
        send({ type: MSG.TOKEN_REDIRECT, newToken: enrollToken });
        const linkedDevices = deviceRecords.filter(d => d.ownerToken === enrollToken);
        send({ type: MSG.PROFILE, profile: { ...enrollProfile, devices: linkedDevices }, connectedDeviceIds: [...wsClients].filter(c => c.playerToken === enrollToken && c.deviceId).map(c => c.deviceId) });
      }
      break;
    }

    case MSG.DEVICE_AUTH: {
      const authClient = [...wsClients].find(c => c.id === clientId);
      if (!authClient?.challenge) { send({ type: MSG.DEVICE_AUTH_FAILED, reason: 'No challenge' }); break; }
      const authToken = authClient.playerToken;
      if (!authToken) { send({ type: MSG.DEVICE_AUTH_FAILED, reason: 'Not identified' }); break; }
      const { devicePublicKey, signedChallenge } = msg;
      if (!devicePublicKey || !signedChallenge) { send({ type: MSG.DEVICE_AUTH_FAILED, reason: 'Missing credentials' }); break; }
      const valid = verifyChallenge(authToken, devicePublicKey, authClient.challenge, signedChallenge);
      if (valid) {
        authClient.authenticated = true;
        authClient.authMethod = 'device-key';
        authClient.challenge = '';
        send({ type: MSG.DEVICE_AUTH_OK });
        addLog(`Device-key auth: ${authToken.slice(0,8)}`);
      } else {
        send({ type: MSG.DEVICE_AUTH_FAILED, reason: 'Invalid signature' });
      }
      break;
    }
  }
}

function getConnectedOwners(): Set<string> {
  const owners = new Set<string>();
  wsClients.forEach(c => { if (c.playerToken) owners.add(c.playerToken); });
  return owners;
}

function enrichRoomList(rooms: any[]): any[] {
  // T95: single seam — sort newest-first here so EVERY list path (welcome, broadcast,
  // owner-aware merge) is consistent. Legacy rooms without createdAt sink to the bottom.
  return rooms
    .map(r => ({
      ...r,
      ownerName: r.ownerToken ? (userProfiles.get(r.ownerToken)?.name || 'Unknown') : '',
    }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// T93: owner-aware list. Everyone sees public rooms; the owner additionally sees ALL of
// their OWN rooms (incl. private + empty) so a user's full room set shows in their lobby.
function roomListFor(playerToken: string): any[] {
  const publicRooms = roomManager.listRooms(getConnectedOwners());
  if (!playerToken) return enrichRoomList(publicRooms);
  const byId = new Map<string, any>();
  for (const r of publicRooms) byId.set(r.id, r);
  for (const r of roomManager.listRoomsForOwner(playerToken)) byId.set(r.id, r);
  return enrichRoomList([...byId.values()]);
}

function broadcastRoomList(): void {
  // Per-recipient: each client gets public rooms plus their own (owner-aware).
  wsClients.forEach(c => {
    if (c.ws.readyState !== 1) return;
    c.ws.send(JSON.stringify({ type: MSG.ROOM_LIST, rooms: roomListFor(c.playerToken) }));
  });
}

// --- TUI ---

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m', red: '\x1b[31m', magenta: '\x1b[35m',
  brightGreen: '\x1b[92m', brightYellow: '\x1b[93m', brightBlue: '\x1b[94m',
  brightCyan: '\x1b[96m', brightMagenta: '\x1b[95m', brightRed: '\x1b[91m', white: '\x1b[37m',
};

function clearScreen(): void { console.clear(); process.stdout.write('\x1b[H\x1b[2J'); }

function visibleLength(str: string): number { return str.replace(/\x1b\[[0-9;]*m/g, '').length; }
function padToWidth(str: string, width: number): string { return str + ' '.repeat(Math.max(0, width - visibleLength(str))); }

function displayLogTail(viewLines: number): void {
  const logLines = Math.max(5, Math.min((process.stdout.rows || 24) - viewLines - 3, 20));
  const recentLogs = serverLogs.slice(-logLines);
  console.log(`\n${colors.cyan}${colors.bright}--- Server Log ---${colors.reset}`);
  if (recentLogs.length === 0) { console.log(`${colors.dim}No activity yet...${colors.reset}`); }
  else { recentLogs.forEach(log => console.log(`${colors.dim}${log}${colors.reset}`)); }
}

function showHelp(): void {
  clearScreen();
  const uptime = Math.floor((Date.now() - serverStartTime.getTime()) / 1000);
  const w = 64;
  console.log(`${colors.brightMagenta}+${'='.repeat(w)}+${colors.reset}`);
  console.log(`${colors.brightMagenta}|${colors.reset}${padToWidth(`             ${colors.bright}RawBin Server${colors.reset}`, w)}${colors.brightMagenta}|${colors.reset}`);
  console.log(`${colors.brightMagenta}+${'='.repeat(w)}+${colors.reset}`);
  console.log(`${colors.brightMagenta}|${colors.reset}${padToWidth(`  ${colors.green}HTTPS:${colors.reset} https://localhost:${HTTPS_PORT}`, w)}${colors.brightMagenta}|${colors.reset}`);
  console.log(`${colors.brightMagenta}|${colors.reset}${padToWidth(`  ${colors.green}Uptime:${colors.reset} ${uptime}s  Requests: ${totalRequests}  Sessions: ${clientSessions.size}`, w)}${colors.brightMagenta}|${colors.reset}`);
  console.log(`${colors.brightMagenta}+${'='.repeat(w)}+${colors.reset}`);
  console.log(`  [h] help  [s] status  [c] clients  [l] live log  [p] browser  [r] rebuild  [d] stop`);
  displayLogTail(8);
}

function showStatus(): void {
  clearScreen();
  const uptime = Math.floor((Date.now() - serverStartTime.getTime()) / 1000);
  const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = uptime % 60;
  console.log(`${colors.brightCyan}Server Status${colors.reset}`);
  console.log(`  Started:  ${serverStartTime.toLocaleString()}`);
  console.log(`  Uptime:   ${h}h ${m}m ${s}s`);
  console.log(`  Requests: ${totalRequests}  Sessions: ${clientSessions.size}  WS: ${wsClients.size}`);
  console.log(`  HTTPS: ${HTTPS_PORT}  HTTP: ${PORT}`);
  console.log(`\n${colors.dim}[q] back  [d] stop${colors.reset}`);
  displayLogTail(8);
}

function showClients(): void {
  clearScreen();
  console.log(`${colors.brightGreen}Connected Clients${colors.reset}\n`);
  let lines = 4;
  if (clientSessions.size === 0) { console.log(`  ${colors.dim}No clients${colors.reset}`); lines++; }
  else {
    Array.from(clientSessions.values()).forEach((session, i) => {
      console.log(`  ${colors.brightYellow}Client ${i+1}:${colors.reset} ${session.ip}  ${session.requestCount} req  last ${session.lastRequest.toLocaleTimeString()}`);
      lines++;
    });
  }
  console.log(`\n${colors.dim}[q] back  [d] stop${colors.reset}`);
  displayLogTail(lines);
}

// [impl:uuid:02ef2352-b8b3-4f93-8e69-f3ac8b41e0b2] R29.1 ServerTUI.setupTUI (full boxed dashboard, isTTY-gated)
function setupTUI(): void {
  if (process.stdin.isTTY) { readline.emitKeypressEvents(process.stdin); process.stdin.setRawMode(true); }
  let currentView: 'help' | 'status' | 'clients' | 'live' = 'help';
  let liveLogInterval: NodeJS.Timeout | null = null;
  setInterval(() => { if (currentView === 'help') showHelp(); else if (currentView === 'status') showStatus(); else if (currentView === 'clients') showClients(); }, 2000);

  process.stdin.on('keypress', async (_str, key) => {
    if (!key) return;
    if (key.ctrl && key.name === 'c') { if (liveLogInterval) clearInterval(liveLogInterval); console.log('\nShutting down...'); process.exit(0); }
    switch (key.name) {
      case 'd': if (liveLogInterval) clearInterval(liveLogInterval); console.log('\nShutting down...'); process.exit(0); break;
      case 'h': case '?': case 'q': if (liveLogInterval) { clearInterval(liveLogInterval); liveLogInterval = null; } currentView = 'help'; showHelp(); break;
      case 's': if (liveLogInterval) { clearInterval(liveLogInterval); liveLogInterval = null; } currentView = 'status'; showStatus(); break;
      case 'c': if (liveLogInterval) { clearInterval(liveLogInterval); liveLogInterval = null; } currentView = 'clients'; showClients(); break;
      case 'l':
        if (liveLogInterval) { clearInterval(liveLogInterval); liveLogInterval = null; currentView = 'help'; showHelp(); }
        else { currentView = 'live'; liveLogInterval = setInterval(() => { clearScreen(); console.log(`${colors.brightMagenta}Live Log${colors.reset} [q to exit]\n`); serverLogs.slice(-((process.stdout.rows||24)-4)).forEach(log => console.log(log)); }, 500); }
        break;
      case 'p': try { const url = `https://localhost:${HTTPS_PORT}/app`; if (process.platform === 'darwin') await execAsync(`open "${url}"`); addLog(`Browser opened: ${url}`); } catch {} break;
      case 'r': try { clearScreen(); console.log('Rebuilding...'); const { stdout } = await execAsync('npm run build', { cwd: path.join(__dirname, '../../..') }); console.log('Build OK'); addLog('Client rebuilt'); } catch (e: any) { console.log('Build failed:', e.stderr || e.message); } break;
    }
  });

  showHelp();
  addLog('Server started');
  addLog(`Admin key: ${ADMIN_KEY}`);
  addLog(`HTTPS: https://localhost:${HTTPS_PORT}`);
}

// --- Main ---

async function main(): Promise<void> {
  const hasSSL = await generateCertificate();
  await startServers(!hasSSL);
  await new Promise(resolve => setTimeout(resolve, 100));
  cleanupOldLogs();
  setInterval(() => {
    const cleaned = roomManager.cleanupStale();
    if (cleaned > 0) { addLog(`Periodic cleanup: ${cleaned} stale room(s)`); broadcastRoomList(); }
  }, 2 * 60 * 1000);
  setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
  // R29.1 AC-2: render the FULL boxed dashboard whenever a terminal is present (isTTY, NOT !IS_PRODUCTION:
  // prod-in-a-pane gets the same dashboard as WODA.test; headless prod skips it). [marker on the setupTUI decl above]
  if (process.stdout.isTTY) {
    setupTUI();
  } else {
    addLog('Server started (headless — no TTY; request-log → file only)');
    addLog(`HTTPS: https://localhost:${HTTPS_PORT}`);
  }
}

process.on('uncaughtException', (error) => { console.error('Uncaught:', error); process.exit(1); });
process.on('unhandledRejection', (reason, promise) => { console.error('Unhandled rejection:', promise, reason); process.exit(1); });
process.on('SIGINT', () => { if (process.stdin.isTTY) process.stdin.setRawMode(false); console.log('\nShutting down...'); process.exit(0); });
process.on('SIGTERM', () => { if (process.stdin.isTTY) process.stdin.setRawMode(false); console.log('\nShutting down...'); process.exit(0); });

main().catch((error) => { console.error('Fatal:', error); process.exit(1); });
