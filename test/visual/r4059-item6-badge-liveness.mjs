// Item (6) REGULAR-BADGE LIVENESS falsifier — planner specimen Task 40.28 = 9f11a990 (honestly QA-Review, NOT the
// current/pin-slot, tree-visible under Sprint 40, chain-complete-to-Test). Interim emitting path (0.2/PO): approve it
// through the seam on scratch@HEAD → real status transition 🧪→🏁 → observe the ROW badge @390 real-WebKit.
// ★ WATCH 0.5/1.5/3.5/6s (banked transient-lag lesson). live-no-reload ⇒ I-GUARANTEE + #3 alone explains the dead
// board. stale/LAGGED ⇒ SECOND GAP (a lag = drawer-re-render-latency family = ONE systemic defect). SCRATCH only (approve
// records approvedBy/At = Tron-gate data — never prod).
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const TASK='9f11a990-79bd-46e4-95e2-abe066f4b95b'; const T8=TASK.slice(0,8);
const IOS={viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true,isMobile:false,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',ignoreHTTPSErrors:true};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const f=await setupFoundation({commit:'HEAD',buildDist:true}); const oh=f.ownerHeaders();
console.log(`scratch@HEAD served=${f.servedVersion} sha=${f.worktreeSha} · specimen Task40.28=${T8} (regular QA-Review row, NOT pin-slot)`);
const b=await webkit.launch({headless:true});
try{
  const ctx=await b.newContext({...IOS,serviceWorkers:'block'});
  await ctx.addInitScript(t=>{try{localStorage.setItem('rawbin-player-id',t)}catch{}},oh['x-player-token']);
  const sm=(oh['Cookie']||'').match(/sm_session=([^;]+)/); if(sm)await ctx.addCookies([{name:'sm_session',value:sm[1],domain:'localhost',path:'/'}]);
  const p=await ctx.newPage();
  await p.goto(`${f.base}/trace`,{waitUntil:'networkidle',timeout:30000}).catch(()=>{});
  await p.waitForFunction(()=>!!customElements.get('rb-object-item'),{timeout:20000}).catch(()=>{});
  await sleep(1000);
  // navigate to the row: expand nodes toward Sprint 40 until the specimen row renders (click expanders on Sprints/Sprint-40 nodes)
  const findRow=(uuid)=>p.evaluate(u=>{const r=[...document.querySelectorAll('rb-object-item')].find(x=>(x.getAttribute('ref')||'').includes(u)||(x.innerText||'').includes(u));return r?{ref:r.getAttribute('ref'),txt:(r.innerText||'').slice(0,60)}:null;},uuid);
  for(let round=0; round<8; round++){
    const row=await findRow(T8);
    if(row){ console.log(`row found (round ${round}): ref=${row.ref}`); break; }
    // click expanders on nodes mentioning Sprint (breadth toward Sprint 40)
    const expanded=await p.evaluate(()=>{
      let n=0; for(const it of document.querySelectorAll('rb-object-item')){
        const t=it.innerText||''; if(/Sprints?\b|Sprint 40|Sprint40/i.test(t)){
          const tog=it.querySelector('.expander,.toggle,[class*="expand"],[class*="chevron"],.oi-toggle')||it;
          try{ tog.click(); n++; }catch{}
        }
      } return n;
    });
    await sleep(1200);
    if(round===7) console.log(`(expanded ${expanded} sprint-ish nodes, still searching)`);
  }
  const readBadgeFor=(u)=>p.evaluate((args)=>{const[uu,glyphs]=args;const r=[...document.querySelectorAll('rb-object-item')].find(x=>(x.getAttribute('ref')||'').includes(uu)||(x.innerText||'').includes(uu));const txt=r?.innerText||'';const present=Object.keys(glyphs).filter(g=>txt.includes(g)).map(g=>g+'='+glyphs[g]);return{found:!!r,glyphs:present.join(','),qa:txt.includes('🧪'),done:txt.includes('🏁'),rawHead:txt.split('\n').slice(0,3).join(' | '),noReload:window.__nr==='alive'};},[u,GLYPHS]).catch(()=>({found:false}));
  const GLYPHS={ '⏳':'Planned','📝':'designed','🔧':'implementing','✅':'impl-shipped','🧪':'QA-Review','🏁':'Done' };
  const readBadge=()=>p.evaluate((args)=>{
    const [u,glyphs]=args;
    const r=[...document.querySelectorAll('rb-object-item')].find(x=>(x.getAttribute('ref')||'').includes(u)||(x.innerText||'').includes(u));
    const txt=r?.innerText||'';
    const present=Object.keys(glyphs).filter(g=>txt.includes(g)).map(g=>g+'='+glyphs[g]);
    return {found:!!r, glyphs:present.join(','), qa:txt.includes('🧪'), done:txt.includes('🏁'), rawHead:txt.split('\n').slice(0,3).join(' | '), noReload:window.__nr==='alive'};
  },[u,GLYPHS]).catch(()=>({found:false}));
  // INSPECT the found row: how is the status badge represented (innerText was blank → likely icon-font/pseudo/attr)
  const inspect=await p.evaluate((u)=>{const r=[...document.querySelectorAll('rb-object-item')].find(x=>(x.getAttribute('ref')||'').includes(u));if(!r)return{none:true};
    const attrs={};for(const a of r.attributes)attrs[a.name]=a.value.slice(0,40);
    const statusEls=[...r.querySelectorAll('[class*=status],[class*=badge],[class*=glyph],[data-status],.codicon,svg,use')].map(e=>({tag:e.tagName.toLowerCase(),cls:e.className?.baseVal||e.className||'',ds:e.getAttribute&&e.getAttribute('data-status'),txt:(e.textContent||'').slice(0,10)}));
    return{attrs, statusEls:statusEls.slice(0,8), outer:r.outerHTML.slice(0,400)};},T8);
  console.log('ROW INSPECT attrs:',JSON.stringify(inspect.attrs));
  console.log('ROW INSPECT statusEls:',JSON.stringify(inspect.statusEls));
  console.log('ROW INSPECT outerHTML head:',inspect.outer);
  await p.evaluate(()=>{window.__nr='alive';});
  const before=await readBadgeFor(T8);
  console.log(`BEFORE approve: found=${before.found} status="${before.status}" color=${before.colorClass} (expect status="QA Review")`);
  if(!before.found){ console.log('SETUP: specimen row still not rendered after expand attempts — dumping visible rows for adaptation:'); console.log(await p.evaluate(()=>[...document.querySelectorAll('rb-object-item')].slice(0,25).map(x=>((x.innerText||'').split('\n')[0]||'').slice(0,42)))); }
  else {
    const ap=await fetch(`${f.base}/api/task/${TASK}/approve`,{method:'POST',headers:oh}); console.log(`approve POST → ${ap.status} (🧪→🏁 through the seam; scratch-only, records approvedBy/At)`);
    let prev=0; for(const t of [500,1500,3500,6000]){ await sleep(t-prev); prev=t; const r=await readBadgeFor(T8); console.log(`  t+${t}ms: status="${r.status}" color=${r.colorClass} noReload=${r.noReload}`); }
    const fin=await readBadgeFor(T8);
    const live = (fin.status==='Done') && fin.noReload;
    console.log(`\n⇒ REGULAR-ROW BADGE UPDATED LIVE (🏁, no reload)? ${live}`);
    console.log(live ? 'I-GUARANTEE regular-row badge liveness (live, no reload) => #3 alone explains the dead board' : 'NOT-GUARANTEED — badge did not reach the Done glyph live (stale/lagged) => SECOND GAP; a LAG = same family as the bar re-render latency = ONE systemic defect (see timeline above)');
  }
} finally { const td=await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
