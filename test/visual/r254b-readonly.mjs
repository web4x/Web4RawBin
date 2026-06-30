import { chromium } from '@playwright/test';
const BASE='https://prod.wo-da.de:4444';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--ignore-certificate-errors']});
const ctx=await b.newContext({ignoreHTTPSErrors:true,viewport:{width:480,height:900}});
await ctx.addInitScript(()=>{localStorage.setItem('rawbin-player-id','ce981242-74fe-4d44-b5b6-43c641e224df');localStorage.setItem('rawbin-name','SystemTester');['privateKey','publicKey','signature'].forEach(k=>localStorage.setItem('rawbin-device-'+k,'e2e'));});
const p=await ctx.newPage();
await p.goto(`${BASE}/app`,{waitUntil:'networkidle'});await p.waitForTimeout(2500);
await p.waitForSelector('#member-name',{timeout:20000}).catch(()=>{});
const card=p.locator('.room-card:has-text("dnd test")').first();await card.waitFor({timeout:10000});
const jb=card.locator('.btn-join').first();if(await jb.isVisible({timeout:1500}).catch(()=>0))await jb.click();else await card.click();
await p.waitForSelector('#rrc-drop',{timeout:20000});await p.waitForTimeout(2000);
const results=[];
for(let i=1;i<=3;i++){
  await p.evaluate(()=>{const t=document.getElementById('room-tree');t?.querySelectorAll('.tt-node,.object-item').forEach(n=>{if(/Files \(/.test(n.textContent||''))n.click&&n.click();});});
  await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>{const t=document.getElementById('room-tree');if(!t)return{n:0,raw:[]};
    const rows=[...t.querySelectorAll('.tt-node,.object-item')].map(n=>(n.getAttribute('data-name')||(n.textContent||'').replace(/\s+/g,' ').trim()).slice(0,40)).filter(Boolean);
    const raw=[...new Set(rows.filter(x=>/\b[0-9a-f]{8}\b/i.test(x)&&!/Grüße|Members|Files|dnd|online|offline|System|Marcel|❤|🤍|•|Cerulean|Volker|\.ics|\.eml/i.test(x)))];
    return{n:rows.length,raw};});
  const pass=r.raw.length===0;results.push(pass);
  console.log(`read ${i}: rows=${r.n} rawUuidNames=${r.raw.length}${r.raw.length?' '+JSON.stringify(r.raw.slice(0,5)):''} => ${pass?'GREEN':'RED'}`);
}
const green=results.every(Boolean);console.log('OVERALL (3) no-raw-uuid:',green?'GREEN DET-3x':'RED');
await b.close();process.exit(green?0:1);
