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
import { MSG } from '../shared/MessageTypes.js';
import { createUserHome, generateUserKeypair, writeUserProfile, enrollDevice, verifyChallenge } from './UserKeys.js';
import { createRoomHome, generateRoomKeypair, writeRoomJson, scanAllRooms, scanUserRooms, getRoomDir } from './RoomKeys.js';
import { encryptFile, decryptFile, fileExists, rekeyUser } from './UserCrypto.js';
import { scanRepo, validate as validateTrace } from './TraceConsistency.js';
import { TraceGraph, makeObject, FORWARD_KEYS, type ObjectType, type FlatObject } from '../shared/TraceModel.js';
import { ScenarioIndex, IORResolver, defaultTemplateRegistry, createFileUnit, createMessageUnit, PhoneIndex, normalizePhone, EmailIndex, AddressIndex, CompanyIndex, createWebItemUnit, extractUrl } from '../scenario/index.js';
import { Transfer } from './federation-transfer.js'; // T26.6: federation import wiring
import { ProxyFetch } from './proxy-fetch.js'; // R27.7 UC27.7b: SSRF-guarded CORS/X-Frame fallback proxy
import { parseFederatedIor, isLocalOrigin } from '../scenario/federated-ior.js';
import { readDir, readFile, writeFile } from './FileApi.js';

const execAsync = promisify(exec);
const ADMIN_KEY = process.env.ADMIN_KEY || crypto.randomUUID();
const PKG_VERSION = JSON.parse(fsSync.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../package.json'), 'utf-8')).version;

// T94: read the version PER REQUEST, not frozen at module load. `tsx watch` only restarts on
// server.ts changes, so a version-only bump (+client rebuild) leaves the process serving a stale
// frozen version → the PWA update banner never fires. Reading package.json (tiny file) per
// request keeps /api/config + /api/health in sync with the deployed bundle without a restart.
function getVersion(): string {
  try {
    return JSON.parse(fsSync.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../package.json'), 'utf-8')).version;
  } catch { return PKG_VERSION; }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const userProfiles = new Map<string, UserProfile>();
const deviceRecords: DeviceRecord[] = [];

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
      idx.put(token, unit);
    }
    new PhoneIndex(idx).mintAndLink(token, phone, crypto.randomUUID()); // R21.6: Phone unit + Profile.phones[] + symlink
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
      idx.put(token, unit);
    }
    const ei = new EmailIndex(idx);
    for (const e of emails) { if (e) ei.mintAndLink(token, e, crypto.randomUUID()); }
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
      idx.put(token, unit);
    }
    const ai = new AddressIndex(idx);
    for (const line of addresses) {
      if (!line) continue;
      const u = crypto.randomUUID();
      const addrUuid = ai.mintAddress(token, line, u); // synchronous, no network (AC-c1)
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
      idx.put(token, unit);
    }
    const ci = new CompanyIndex(idx);
    for (const c of companies) {
      const cname = typeof c === 'string' ? c : c?.name;
      const dom = typeof c === 'string' ? undefined : c?.domain;
      if (!cname) continue;
      const cuuid = ci.mintOrReuseShared(cname, crypto.randomUUID(), dom); // reuses existing → no dup
      if (cuuid) ci.linkToProfile(token, cuuid);
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
  if (rc.action !== 'noop') idx.put(rc.localUuid, t.rewriteForwardRefs(rc.unit, originHost, remap)); // T26.5 remap + T26.1 provenance
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
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title} — RawBin</title><link rel="stylesheet" href="/app.css"><script type="module" src="${getBannerScript()}"></script></head><body><rb-update-banner></rb-update-banner><button onclick="history.back()" style="position:fixed;bottom:calc(20px + env(safe-area-inset-bottom));right:20px;width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,0.6);color:white;border:none;font-size:1.5rem;cursor:pointer;z-index:100">✕</button>`;
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

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  trackClient(req);
  try {
    const rawUrl = req.url || '/';
    let filepath = rawUrl.split('?')[0];
    const urlParams = new URLSearchParams(rawUrl.includes('?') ? rawUrl.split('?')[1] : '');

    // API: bug status update
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
        const uploaderToken = fu0 ? String((fu0.model as any).uploaderToken || '') : '';
        const memberOf = (r: any) => !!r && (r.creatorToken === authToken || [...r.members.values()].some((m: any) => m.playerToken === authToken));
        let authorized = !!uploaderToken && uploaderToken === authToken;
        if (!authorized && fileRoomUuid) authorized = memberOf(roomManager.getRoom(fileRoomUuid));
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
              unit = createWebItemUnit(idx, { uuid: crypto.randomUUID(), url, name: fileName, uploaderToken: playerToken, roomUuid: roomId, relatedFile: relatedFile || undefined });
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
          if (!unit) unit = createFileUnit(idx, { name: fileName, content: fileData, mimeType, uploaderToken: playerToken, roomUuid: roomId });
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
        const scenarioDir = path.join(__dirname, '../../../scenario/index');
        const idx = new ScenarioIndex(scenarioDir);
        const sprints = idx.list().map(uuid => {
          const u = idx.get(uuid);
          if (!u || u.ior !== 'ior:class:Sprint') return null;
          const tasks = (u.model.tasks as string[]) || [];
          return { uuid, type: 'Sprint', name: String(u.model?.name || ''), number: u.model?.number || 0, hasChildren: tasks.length > 0 };
        }).filter(Boolean);
        sprints.sort((a: any, b: any) => (a.number || 0) - (b.number || 0));
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
        const scenarioDir = path.join(__dirname, '../../../scenario/index');
        const idx = new ScenarioIndex(scenarioDir);
        const unit = idx.get(uuid);
        if (!unit) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{}'); return; }
        const type = (unit.ior || '').split(':')[2] || '';
        const queryMode = urlParams.get('mode') || 'scenario';
        // [impl:uuid:28f244c7-1a9c-49c5-ab6c-249d906cb9a4] R19.71 Room forward keys
        // [impl:uuid:29730376-7832-477d-8960-98c937f8c2bb] BUG12 Bug+ChangeRequest forward keys
        // R20.15: unified CHAIN_TYPE_CONFIG replaces inline maps
        const fwdKeys = forwardKeysForMode(type, queryMode as 'scenario' | 'trace');
        // R20.22: CurrentSprint → 3 task children from slots
        if (type === 'CurrentSprint') {
          const model = unit.model as Record<string, unknown>;
          const slots = (model.slots as any) || {};
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
            return { uuid: s.slot.taskUuid, type: 'Task', name: `${s.label}: ${taskName}`, hasChildren: true, status };
          });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
          res.end(JSON.stringify({ uuid, type, name: String(model.name || 'Current Sprint'), hasChildren: children.length > 0, children }));
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
        childRefs = childRefs.filter(ref => ref !== uuid);
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
            const forwardArrays = ['tasks','useCases','classes','methods','implementations','tests','children'].map(k => childModel[k]).filter(Array.isArray);
            const childCount = forwardArrays.reduce((sum, arr) => sum + arr.length, 0);
            const childStatus = ct === 'Gate' ? String(childModel.verdict || childModel.status || '') : String(childModel.status || '');
            // R22.3 per-child sourceFile+sourceLine (mirrors top-level logic below) — plumbing in an anon route callback, no chain Method
            const cRawSrc = String(childModel.sourceFile || '').replace('ior:file:', '');
            const cSrc = (cRawSrc && !cRawSrc.includes('.scenario.json')) ? cRawSrc : undefined;
            const cLine = cSrc ? ((childModel.sourceLine as number) || undefined) : undefined;
            const entry: Record<string, unknown> = { uuid: ref, type: ct, name: String(child.model?.name || ''), hasChildren: childCount > 0, childCount, ...(childModel.assigned ? { assignee: String(childModel.assigned) } : {}), ...(childStatus ? { status: childStatus } : {}), ...(cSrc ? { sourceFile: cSrc, sourceLine: cLine } : {}) };
            if (queryMode === 'trace' && type === 'UseCase' && ct === 'Class' && ucMethodIor) {
              const meth = idx.get(ucMethodIor);
              if (meth) entry.chainMethod = { uuid: ucMethodIor, type: 'Method', name: String(meth.model?.name || '') };
            }
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
          const FWD_SCAN: Record<string, string[]> = { Requirement: ['tasks','useCases'], Task: ['useCases','children','subtasks','coveredRequirements'], UseCase: ['classes'], Class: ['methods'], Method: ['implementations'], Implementation: ['tests'], Sprint: ['tasks','requirements'] };
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
        res.end(JSON.stringify({ uuid, type, name: String(unit.model?.name || ''), children, parent, sourceFile, sourceLine, ...extra }));
      } catch { res.writeHead(500); res.end('{}'); }
      return;
    }

    // T127.2: IOR universal resolver endpoint
    if (filepath.startsWith('/api/ior/')) {
      const ior = decodeURIComponent(filepath.slice('/api/ior/'.length));
      try {
        const scenarioDir = path.join(__dirname, '../../../scenario/index');
        const idx = new ScenarioIndex(scenarioDir);
        const resolver = new IORResolver(idx, defaultTemplateRegistry(), path.join(__dirname, '../../..'));
        const result = resolver.resolve(ior);
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
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify({ status: 'ok', uptime, version: getVersion(), connections: wsClients.size, rooms: roomManager.size }));
      return;
    }

    if (req.method === 'POST' && filepath === '/api/puml-render') {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; if (body.length > 500000) { res.writeHead(413); res.end('Too large'); } });
      req.on('end', () => {
        try {
          const svg = execFileSync('plantuml', ['-tsvg', '-pipe'], { input: body, maxBuffer: 2 * 1024 * 1024, timeout: 15000 }).toString();
          res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' });
          res.end(svg);
        } catch (e: any) {
          const stderr = e?.stderr?.toString() || e?.message || 'PlantUML render failed';
          if (e?.code === 'ENOENT') { res.writeHead(501, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'plantuml not installed on server' })); }
          else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: stderr })); }
        }
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
        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk; if (body.length > 1100000) { res.writeHead(413); res.end('Too large'); } });
        req.on('end', () => {
          try {
            const { content, expectedMtime } = JSON.parse(body);
            if (typeof content !== 'string') { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Missing content' })); return; }
            const result = writeFile(relPath, content, expectedMtime);
            const status = 'ok' in result ? 200 : result.status;
            res.writeHead(status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Bad request' })); }
        });
        return;
      }

      const isDir = relPath.endsWith('/') || relPath === '';
      const result = isDir ? readDir(relPath) : readFile(relPath);
      if ('error' in result) {
        res.writeHead(result.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: result.error }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(result));
      }
      return;
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
        const encPath = path.join(DATA_DIR, 'users', token, 'files', 'avatar.enc');
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
<p class="ver" id="ver"></p>
</div>
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
      var avatarSrc=p.avatar&&p.avatar.startsWith('/api/avatar/')?p.avatar:'/icon-192.png';
      el.innerHTML='<div style="text-align:center;margin-bottom:12px"><img src="'+avatarSrc+'" style="width:80px;height:80px;border-radius:50%;object-fit:cover" alt=""></div>'
        +'<div class="field"><span class="label">Name</span><span>'+(p.name||'Unknown')+'</span></div>'
        +'<div class="field"><span class="label">Token</span><span style="font-size:0.6rem;opacity:0.5;word-break:break-all">'+p.token+'</span></div>'
        +'<h3>Your Secret Code</h3>'
        +'<div class="code">'+(p.secretCode||'----')+'</div>'
        +'<p style="text-align:center;font-size:0.75rem;opacity:0.5;margin-bottom:8px">Share this code so others can link their account to yours</p>'
        +'<h3>Devices ('+(p.devices?.length||0)+')</h3>'
        +(p.devices&&p.devices.length?p.devices.map(function(d){
          var t=d.userAgent||'';var short=t.includes('Mobile')?'Mobile':t.includes('Mac')?'Mac':t.includes('Windows')?'Windows':t.includes('Linux')?'Linux':'Browser';
          var online=cids.indexOf(d.deviceId)>=0;var dot=online?'<span style="color:#4CAF50">●</span>':'<span style="color:#f44336">●</span>';
          return '<div class="device">'+dot+' <span class="dtype">'+short+'</span> <span style="opacity:0.4">'+((d.deviceId||'').slice(0,8)||'legacy')+'</span><div class="dmeta">IP: '+(d.ip||'unknown').replace('::ffff:','')+'</div><div class="dmeta">'+(d.screenSize||'')+(d.platform?' · '+d.platform:'')+(d.connectionCount?' · '+d.connectionCount+'x connected':'')+'</div><div class="dmeta">Last: '+new Date(d.lastSeen).toLocaleString()+'</div></div>'
        }).join(''):'<p class="empty">No devices recorded</p>')
        +'<h3>My Bug Reports ('+(p.bugReports?.length||0)+')</h3>'
        +(p.bugReports&&p.bugReports.length?p.bugReports.map(function(b){
          var statusColor=b.status==='FIXED'?'#4CAF50':b.status==='IN PROGRESS'?'#ff9800':'#999';
          return '<div class="device"><span style="color:'+statusColor+';font-weight:600">'+b.status+'</span> <span style="opacity:0.5;font-size:0.7rem">'+new Date(b.date).toLocaleDateString()+'</span><div class="dmeta">'+b.text+'</div></div>'
        }).join(''):'<p class="empty">No bug reports filed</p>');
    }
  };
}
fetch('/api/config').then(r=>r.json()).then(c=>{document.getElementById('ver').textContent='v'+c.version+' · '+c.branch}).catch(()=>{});
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
  const wss = new WebSocketServer({ server });
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
        room.addChat(clientId, name, text, chatIdx);
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
      send({ type: MSG.PROFILE, profile: { ...profile, devices: myDevices }, connectedDeviceIds });

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
