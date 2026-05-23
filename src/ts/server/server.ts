#!/usr/bin/env node

import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, execFile } from 'node:child_process';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import readline from 'node:readline';
import { WebSocketServer, WebSocket } from 'ws';
import fetch from 'node-fetch';
import { marked } from 'marked';
import { RoomManager, type RoomMember } from './Room.js';
import { MSG } from '../shared/MessageTypes.js';

const execAsync = promisify(exec);
const ADMIN_KEY = process.env.ADMIN_KEY || crypto.randomUUID();

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

const PORT = 3000;
const HTTPS_PORT = 4444;
const BASE_DOMAIN = envVars['BASE_DOMAIN'] || '';
const PUBLIC_DIR = path.join(__dirname, '../../public');
const CERT_DIR = path.join(__dirname, '.certs');
const CERT_FILE = path.join(CERT_DIR, 'cert.pem');
const KEY_FILE = path.join(CERT_DIR, 'key.pem');

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
}

const clientSessions = new Map<string, ClientSession>();
const wsClients = new Set<WebSocketClient>();
const avatarCache = new Map<string, string>();
const tokenToClient = new Map<string, string>();
let totalRequests = 0;

// --- User Profiles ---

interface UserProfile {
  token: string;
  name: string;
  phone: string;
  url: string;
  avatar: string;
  secretCode: string;
  profileCommitted: boolean;
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
}

const DATA_DIR = path.join(__dirname, '../../../data');
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
          avatar: p.avatar || '', secretCode: p.secretCode || generateSecretCode(),
          profileCommitted: p.profileCommitted || false,
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

function saveDevices(): void {
  try {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
    fsSync.writeFileSync(DEVICES_PATH, JSON.stringify(deviceRecords, null, 2));
  } catch {}
}

loadProfiles();

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
roomManager.loadFromDisk();
let serverStartTime = new Date();
const serverLogs: string[] = [];
const MAX_LOGS = 1000;

function addLog(message: string): void {
  const timestamp = new Date().toLocaleTimeString();
  serverLogs.push(`[${timestamp}] ${message}`);
  if (serverLogs.length > MAX_LOGS) serverLogs.shift();
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
    let filepath = req.url || '/';

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

    if (filepath === '/api/bugs') {
      const allBugs: any[] = [];
      userProfiles.forEach((p, token) => {
        (p.bugReports || []).forEach((b, i) => {
          allBugs.push({ token: token.slice(0, 8), name: p.name, index: i, ...b });
        });
      });
      allBugs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify(allBugs));
      return;
    }

    if (filepath === '/api/config') {
      const domain = BASE_DOMAIN || getLocalIP();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify({ baseDomain: domain, httpsPort: HTTPS_PORT, version: '0.1.0', branch: 'rawbin' }));
      return;
    }

    // Docs
    const PROJECT_ROOT = path.join(__dirname, '../../../../');
    const DOCS_DIR = path.join(__dirname, '../../../docs');
    const MD_CSS = 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#333;line-height:1.6}a{color:#667eea}h1,h2,h3{margin-top:1.5em}code{background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:0.9em}pre{background:#f5f5f5;padding:12px;border-radius:8px;overflow-x:auto}pre code{background:none;padding:0}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}';

    if (filepath === '/docs' || filepath === '/docs/') {
      try {
        const files = fsSync.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
        const list = files.map(f => `<li><a href="/docs/${f}">${f.replace('.md', '')}</a></li>`).join('');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RawBin Docs</title><style>${MD_CSS}</style></head><body><h1>RawBin Docs</h1><p><a href="/">Home</a></p><ul>${list}</ul></body></html>`);
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
        res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${path.basename(filepath, '.md')} — RawBin</title><style>${MD_CSS}</style></head><body><p><a href="${backLink}">Back</a> · <a href="/docs">Docs</a> · <a href="/">Home</a></p>${html}</body></html>`);
      } catch { res.writeHead(404); res.end('Doc not found'); }
      return;
    }
    if (filepath.startsWith('/md/') && filepath.endsWith('.md')) {
      const relPath = filepath.slice(4);
      if (relPath.includes('..')) { res.writeHead(403); res.end('Forbidden'); return; }
      const mdFile = path.join(PROJECT_ROOT, relPath);
      try {
        const md = fsSync.readFileSync(mdFile, 'utf-8');
        const dirPrefix = path.dirname(relPath);
        const relinked = md.replace(/\]\(([^)]+\.md)\)/g, (_, p) => `](/md/${dirPrefix}/${p})`);
        const html = marked(relinked) as string;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${path.basename(filepath, '.md')} — RawBin</title><style>${MD_CSS}</style></head><body><p><a href="/">Home</a></p>${html}</body></html>`);
      } catch { res.writeHead(404); res.end('File not found'); }
      return;
    }

    filepath = filepath.split('?')[0];

    if (filepath === '/' || filepath === '/index.html') {
      filepath = '/index.html';
    } else if (filepath === '/app' || filepath === '/app/') {
      filepath = '/app.html';
    } else if (filepath === '/bug-report' || filepath === '/bug-report/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bug Report — RawBin</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:20px;color:#333}
.container{background:white;border-radius:20px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:500px;width:100%}
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
      res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Profile — RawBin</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:20px;color:#333}
.container{background:white;border-radius:20px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:500px;width:100%}
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
      el.innerHTML='<div class="field"><span class="label">Name</span><span>'+(p.name||'Unknown')+'</span></div>'
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
    res.writeHead(200, { 'Content-Type': mimeType, 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404 Not Found'); }
    else { res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end('500 Internal Server Error'); }
  }
}

// --- SSL ---

async function generateCertificate(): Promise<boolean> {
  if (fsSync.existsSync(CERT_FILE) && fsSync.existsSync(KEY_FILE)) return true;
  try {
    await fs.mkdir(CERT_DIR, { recursive: true });
    await execAsync(`openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 -keyout "${KEY_FILE}" -out "${CERT_FILE}" -subj "/CN=localhost" 2>/dev/null`);
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

async function fetchUniqueAvatar(): Promise<string> {
  try {
    const response = await fetch('https://thispersondoesnotexist.com/');
    const buffer = await response.arrayBuffer();
    return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
  } catch { return '/icon-192.png'; }
}

// --- WebSocket ---

function setupWebSocketServer(server: https.Server): void {
  const wss = new WebSocketServer({ server });
  wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
    const ip = req.socket.remoteAddress || 'unknown';
    const clientId = `${ip}-${Date.now()}`;
    const connectedAt = Date.now();
    const userAgent = req.headers['user-agent'] || '';
    const avatarUrl = await fetchUniqueAvatar();
    avatarCache.set(clientId, avatarUrl);

    const client: WebSocketClient = { ws, id: clientId, ip, userAgent, connectedAt, avatarUrl, deviceId: '', playerToken: '' };
    wsClients.add(client);
    addLog(`WS connected: ${ip} (${wsClients.size} online)`);

    ws.send(JSON.stringify({ type: 'welcome', clientId, onlineCount: wsClients.size }));
    ws.send(JSON.stringify({ type: MSG.SERVER_CONFIG, shareDomain: BASE_DOMAIN || getLocalIP(), httpsPort: HTTPS_PORT }));
    ws.send(JSON.stringify({ type: MSG.ROOM_LIST, rooms: roomManager.listRooms() }));

    ws.on('message', (data) => {
      try { handleMessage(clientId, ws, avatarUrl, JSON.parse(data.toString())); } catch {}
    });

    ws.on('close', () => {
      wsClients.delete(client);
      avatarCache.delete(clientId);
      for (const [token, cid] of tokenToClient) { if (cid === clientId) tokenToClient.delete(token); }
      addLog(`WS disconnected: ${ip} (${wsClients.size} online)`);

      const room = roomManager.findMemberRoom(clientId);
      if (room) {
        room.removeMember(clientId);
        if (room.members.size === 0) roomManager.removeRoom(room.id);
        addLog(`${clientId.slice(0,8)} left room ${room.name}`);
      }
      const specRoom = roomManager.findSpectatorRoom(clientId);
      if (specRoom) specRoom.removeSpectator(clientId);
    });

    ws.on('error', () => { wsClients.delete(client); avatarCache.delete(clientId); });
  });
}

// --- WS Message Handler ---

function handleMessage(clientId: string, ws: WebSocket, avatarUrl: string, msg: any): void {
  const send = (data: object) => ws.send(JSON.stringify(data));

  switch (msg.type) {
    case MSG.CREATE_ROOM: {
      const creatorToken = msg.playerToken || [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
      const creatorProfile = creatorToken ? userProfiles.get(creatorToken) : undefined;
      if (!creatorProfile?.profileCommitted) { send({ type: MSG.ERROR, message: 'Profile required' }); break; }

      const cleaned = roomManager.cleanupStale();
      if (cleaned > 0) addLog(`Auto-cleaned ${cleaned} stale room(s)`);

      const memberName = msg.playerName || 'User';
      const roomName = msg.roomName || msg.name || `${memberName}'s Room`;
      const useAvatar = msg.clientAvatar || avatarUrl;
      const member: RoomMember = {
        id: clientId, ws, name: memberName, avatarUrl: useAvatar,
        playerToken: msg.playerToken || '', disconnected: false,
      };
      const room = roomManager.createRoom(roomName, member, { maxMembers: msg.maxPlayers || 10, isPrivate: !!msg.roomKey });
      if (msg.playerToken) tokenToClient.set(msg.playerToken, clientId);
      addLog(`Room created: ${room.name} (${room.id}) by ${clientId.slice(0,8)}`);
      break;
    }

    case MSG.JOIN_ROOM: {
      const joinerToken = msg.playerToken || [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
      const joinerProfile = joinerToken ? userProfiles.get(joinerToken) : undefined;
      if (!joinerProfile?.profileCommitted) { send({ type: MSG.ERROR, message: 'Profile required' }); break; }

      const room = roomManager.getRoom(msg.roomId);
      if (!room) { send({ type: MSG.ERROR, message: 'Room not found' }); break; }
      const joinName = msg.playerName || 'User';
      if (msg.playerToken) {
        const oldId = tokenToClient.get(msg.playerToken);
        if (oldId && oldId !== clientId && room.members.has(oldId)) {
          send({ type: MSG.ERROR, message: 'You are already in this room' }); break;
        }
        tokenToClient.set(msg.playerToken, clientId);
      }
      const useAvatar = msg.clientAvatar || avatarUrl;
      const member: RoomMember = {
        id: clientId, ws, name: joinName, avatarUrl: useAvatar,
        playerToken: msg.playerToken || '', disconnected: false,
      };
      const joined = room.addMember(member);
      if (!joined) { send({ type: MSG.ERROR, message: 'Room is full' }); break; }
      if (msg.playerToken && room.getCreatorId() === msg.playerToken) {
        room.setCreator(clientId);
        room.broadcast({ type: MSG.HOST_CHANGED, hostId: clientId });
      }
      addLog(`${joinName} joined room ${room.name}`);
      break;
    }

    case MSG.LEAVE_ROOM: {
      const room = roomManager.findMemberRoom(clientId);
      if (room) {
        room.removeMember(clientId);
        if (room.members.size === 0) {
          setTimeout(() => {
            if (room.members.size === 0 && room.spectators.size === 0) {
              roomManager.removeRoom(room.id);
              broadcastRoomList();
            }
          }, 10 * 60 * 1000);
        }
        send({ type: MSG.ROOM_LEFT });
        send({ type: MSG.ROOM_LIST, rooms: roomManager.listRooms() });
        addLog(`${clientId.slice(0,8)} left room ${room.name}`);
      }
      break;
    }

    case MSG.DELETE_ROOM: {
      const delRoom = roomManager.getRoom(msg.roomId);
      if (!delRoom) { send({ type: MSG.ERROR, message: 'Room not found' }); break; }
      const deleterToken = [...wsClients].find(c => c.id === clientId)?.playerToken || [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
      if (delRoom.getCreatorId() !== deleterToken) { send({ type: MSG.ERROR, message: 'Only the room creator can delete it' }); break; }
      delRoom.broadcast({ type: MSG.ROOM_DELETED, roomId: msg.roomId, reason: 'Room deleted by creator' });
      roomManager.removeRoom(msg.roomId);
      broadcastRoomList();
      addLog(`Room deleted by creator: ${delRoom.name}`);
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
      send({ type: MSG.ROOM_LIST, rooms: roomManager.listRooms() });
      break;
    }

    case MSG.SPECTATE: {
      const room = roomManager.getRoom(msg.roomId);
      if (room) {
        const member: RoomMember = {
          id: clientId, ws, name: msg.playerName || 'Spectator',
          avatarUrl, playerToken: '', disconnected: false,
        };
        room.addSpectator(member);
        addLog(`${msg.playerName || clientId.slice(0,8)} spectating room ${room.name}`);
      } else { send({ type: MSG.ERROR, message: 'Room not found' }); }
      break;
    }

    case MSG.LEAVE_SPECTATE: {
      const room = roomManager.findSpectatorRoom(clientId);
      if (room) { room.removeSpectator(clientId); send({ type: MSG.SPECTATE_LEFT }); }
      break;
    }

    case MSG.JOIN_ROOM_FROM_SPECTATE: {
      const room = roomManager.findSpectatorRoom(clientId);
      if (room) {
        const ok = room.promoteSpectator(clientId);
        if (!ok) send({ type: MSG.ERROR, message: 'Cannot join — room full' });
      }
      break;
    }

    case MSG.CHAT_MESSAGE: {
      const room = roomManager.findMemberRoom(clientId) || roomManager.findSpectatorRoom(clientId);
      if (room && msg.text && typeof msg.text === 'string') {
        const text = msg.text.slice(0, 200);
        const member = room.members.get(clientId);
        const spec = room.spectators.get(clientId);
        const name = member?.name || spec?.name || 'Anonymous';
        room.addChat(clientId, name, text);
      }
      break;
    }

    case MSG.IDENTIFY: {
      let token = msg.playerToken;
      if (!token) break;
      let redirectProfile = userProfiles.get(token);
      if (redirectProfile?.redirectTo) {
        const newToken = redirectProfile.redirectTo;
        send({ type: MSG.TOKEN_REDIRECT, newToken });
        token = newToken;
      }
      tokenToClient.set(token, clientId);
      const thisClient = [...wsClients].find(c => c.id === clientId);
      if (thisClient) { thisClient.deviceId = msg.deviceId || ''; thisClient.playerToken = token; }
      const ua = thisClient?.userAgent || '';
      const ip = thisClient?.ip || '';
      const screenSize = msg.screenWidth && msg.screenHeight ? `${msg.screenWidth}x${msg.screenHeight}` : '';
      const now = new Date().toISOString();

      let profile = userProfiles.get(token);
      if (!profile) {
        profile = { token, name: '', phone: '', url: '', avatar: '', secretCode: generateSecretCode(), profileCommitted: false, consolidatedFrom: [], bugReports: [] };
        userProfiles.set(token, profile);
      }
      if (msg.name) profile.name = msg.name;
      if (msg.avatar) profile.avatar = msg.avatar;
      saveProfiles();

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
        deviceRecords.push({ deviceId: devId, ownerToken: token, userAgent: ua, ip, screenSize, platform: msg.platform || '', firstSeen: now, lastSeen: now, connectionCount: 1 });
      }
      saveDevices();

      // Only send THIS user's devices
      const myDevices = deviceRecords.filter(d => d.ownerToken === token);
      const connectedDeviceIds = [...wsClients].filter(c => c.playerToken === token && c.deviceId).map(c => c.deviceId);
      send({ type: MSG.PROFILE, profile: { ...profile, devices: myDevices }, connectedDeviceIds });
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

      friend.redirectTo = myToken;
      friend.secretCode = '';
      friend.bugReports = [];
      saveProfiles();
      saveDevices();

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
      if (typeof msg.name === 'string') profile.name = msg.name.slice(0, 20);
      if (typeof msg.phone === 'string') profile.phone = msg.phone.slice(0, 30);
      if (typeof msg.url === 'string') profile.url = msg.url.slice(0, 200);
      if (typeof msg.avatar === 'string') profile.avatar = msg.avatar.slice(0, 50000);
      if (typeof msg.secretCode === 'string' && /^\d{4}$/.test(msg.secretCode)) profile.secretCode = msg.secretCode;
      if (profile.name) profile.profileCommitted = true;
      saveProfiles();
      send({ type: MSG.PROFILE_UPDATED, profile: { token: profile.token, name: profile.name, phone: profile.phone, url: profile.url, avatar: profile.avatar, secretCode: profile.secretCode, profileCommitted: profile.profileCommitted } });
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
  }
}

function broadcastRoomList(): void {
  const list = JSON.stringify({ type: MSG.ROOM_LIST, rooms: roomManager.listRooms() });
  wsClients.forEach(c => { if (c.ws.readyState === 1) c.ws.send(list); });
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
  setInterval(() => {
    const cleaned = roomManager.cleanupStale();
    if (cleaned > 0) { addLog(`Periodic cleanup: ${cleaned} stale room(s)`); broadcastRoomList(); }
  }, 2 * 60 * 1000);
  setupTUI();
}

process.on('uncaughtException', (error) => { console.error('Uncaught:', error); process.exit(1); });
process.on('unhandledRejection', (reason, promise) => { console.error('Unhandled rejection:', promise, reason); process.exit(1); });
process.on('SIGINT', () => { if (process.stdin.isTTY) process.stdin.setRawMode(false); console.log('\nShutting down...'); process.exit(0); });
process.on('SIGTERM', () => { if (process.stdin.isTTY) process.stdin.setRawMode(false); console.log('\nShutting down...'); process.exit(0); });

main().catch((error) => { console.error('Fatal:', error); process.exit(1); });
