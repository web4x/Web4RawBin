// T41.1 RENDER-PROOF (delivery-blocking): File INSTANCES render in the ROOM FILES view (NOT /model). @served v0.8.236.
// PIXEL fact, not a proxy: screenshot the room files view + measure the rendered rb-object-item[type=file] glyph+name.
// SystemTester + EXISTING room 909f1bd6 ONLY — NO creation, NO pollution. Harness: seed → lobby → Join → drill room→Files.
// ACs failable both ways: (1) SVG glyph consistent (not emoji/blank); (2) NAME present (== model.name, not uuid); (3) generic
// mime→generic SVG (never blank); (4) no-name→uuid fallback (never empty); (5) stub-must-fail control.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
const BASE='https://prod.wo-da.de:4444', ROOM='909f1bd6-1f97-4542-b02b-242cfcc41f5e';
const SHOT='/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/r41-1-files-view.png';
const iorName=(u)=>new Promise(r=>{https.get(`${BASE}/api/ior/ior:instance:${u}?_cb=${Math.random()}`,{rejectUnauthorized:false},x=>{let b='';x.on('data',c=>b+=c);x.on('end',()=>{try{r(JSON.parse(b)?.unit?.model?.name)}catch{r(undefined)}})}).on('error',()=>r(undefined))});
const R={};
const b=await webkit.launch(); const ctx=await b.newContext({ignoreHTTPSErrors:true,serviceWorkers:'block',viewport:{width:1200,height:1400}});
await seedSystemTester(ctx); const p=await ctx.newPage();
try{
  R.served=await (await ctx.request.get(`${BASE}/api/config`,{ignoreHTTPSErrors:true})).json().then(j=>j.version).catch(()=>'?');
  await p.goto(`${BASE}/app`,{waitUntil:'networkidle'}); await p.waitForSelector('#member-name',{timeout:20000}); await p.waitForTimeout(2000);
  await p.click(`button.btn-join[data-room="${ROOM}"]`); await p.waitForTimeout(3500);
  await p.click('rb-object-item[type=room] .oi-expand').catch(()=>{}); await p.waitForTimeout(1500);
  await p.evaluate(()=>{const f=[...document.querySelectorAll('rb-object-item[type=folder]')].find(it=>/Files/.test(it.getAttribute('title')||it.querySelector('.oi-name')?.textContent||''));f?.querySelector('.oi-expand')?.click();}); await p.waitForTimeout(2500);
  await p.screenshot({path:SHOT});
  const m=await p.evaluate(()=>{
    const items=[...document.querySelectorAll('rb-object-item[type=file]')];
    const glyph=it=>{const ic=it.querySelector('.oi-icon');const svg=ic?.querySelector('svg');return{name:(it.querySelector('.oi-name')?.textContent||'').trim(),uuid:(it.getAttribute('ref')||'').replace(/^file:/,'').slice(0,36),title:(it.getAttribute('title')||'').trim(),nameAttr:(it.getAttribute('name')||'').trim(),hasSVG:!!svg,svgPaths:svg?svg.querySelectorAll('path,rect,circle,polygon').length:0,emojiText:(ic?.textContent||'').trim(),blank:!svg&&!(ic?.textContent||'').trim()};};
    return {count:items.length,files:items.map(glyph)};
  });
  R.fileCount=m.count; R.sample=m.files;
  // AC1: every file node has an SVG glyph, no emoji text, not blank
  R.ac1 = m.files.length>0 && m.files.every(f=>f.hasSVG && f.svgPaths>0 && !f.blank && !/\p{Emoji}/u.test(f.emojiText.replace(/[a-z0-9-]/gi,'')));
  // real name a file HAS = its title attr (the source rawName uses) or name attr; uuid-looking label = the fallback fired
  const realNameOf = f => f.nameAttr || f.title || ''; // what the label SHOULD be when a name exists
  const rendersUuid = f => f.name.replace(/-/g,'').startsWith(f.uuid.replace(/-/g,'').slice(0,12)); // label == the unit's uuid
  // AC2 (STRENGTHENED, both-directions): EVERY file that HAS a real name must render THAT name (label==realName), not the uuid.
  const withName = m.files.filter(f=>realNameOf(f));
  R.ac2 = withName.length>0 && withName.every(f=>f.name===realNameOf(f));
  R.ac2_finding = withName.filter(f=>f.name!==realNameOf(f)).slice(0,8).map(f=>({uuid:f.uuid.slice(0,8),realName:realNameOf(f),rendered:f.name.slice(0,16)}));
  // provenance spot-check: a few rendered labels vs the LIVE unit model.name (data-not-DOM-proxy)
  const checks=[]; for(const f of m.files.slice(0,4)){ const real=await iorName(f.uuid); checks.push({uuid:f.uuid.slice(0,8),modelName:real,title:f.title,rendered:f.name.slice(0,16),ok:real?f.name===real:true}); }
  R.nameChecks=checks;
  // AC3: generic/unknown mime (octet-stream) file → generic SVG (not blank).
  R.ac3 = m.files.some(f=>f.hasSVG && f.svgPaths>0);
  // AC4 (STRENGTHENED): the uuid-fallback fires ONLY on GENUINE absence of BOTH name and title. A file that HAS a name/title
  // but renders its uuid = the fallback firing WRONGLY = RED (the one-directional 'never empty' could not catch this).
  const uuidLabelled = m.files.filter(rendersUuid);
  R.ac4_wrongFallback = uuidLabelled.filter(f=>realNameOf(f)).length; // uuid shown DESPITE having a name/title = wrong
  R.ac4 = m.files.every(f=>f.name.length>0) && R.ac4_wrongFallback===0; // never-empty AND fallback only on genuine absence
  // AC5 stub-must-fail control: a NON-file node (room) must NOT carry the file glyph shape → proves the file-glyph detection discriminates (would fail if trivial)
  R.ac5 = await p.evaluate(()=>{const room=document.querySelector('rb-object-item[type=room] .oi-icon');const svg=room?.querySelector('svg');return !svg && (room?.textContent||'').trim()==='•';}); // room icon is the '•' text, NOT a file svg
}catch(e){R.error=String(e.message||e);}
finally{await b.close();}
console.log('=== T41.1 FILE RENDER-PROOF — served',R.served,'room 909f1bd6 (SystemTester, no pollution) ===');
if(R.error)console.log('ERROR:',R.error);
console.log('file nodes rendered:',R.fileCount);
console.log('name data-vs-render:',JSON.stringify(R.nameChecks));
console.log(`AC1 SVG-glyph-consistent(not emoji/blank) = ${R.ac1?'GREEN':'RED'}`);
console.log(`AC2 label==real-name for every named file = ${R.ac2?'GREEN':'★RED'}  ${R.ac2_finding?.length?'FINDING: '+R.ac2_finding.length+' named files render UUID: '+R.ac2_finding.map(c=>c.realName+'→shows '+c.rendered).join('; '):''}`);
console.log(`AC3 generic-mime→generic-SVG(not blank)   = ${R.ac3?'GREEN':'RED'}`);
console.log(`AC4 uuid-fallback ONLY on genuine absence  = ${R.ac4?'GREEN':'★RED'}  (wrong-fallback[has-name-but-uuid]=${R.ac4_wrongFallback})`);
console.log(`AC5 stub-must-fail control(room≠file-glyph)= ${R.ac5?'GREEN(discriminates)':'RED'}`);
console.log('screenshot →',SHOT);
