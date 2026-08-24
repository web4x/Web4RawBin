// Explain Tron's symptom: bar offers Set-as-Current while endpoint=40.1. Bar reads _currentSlotUuid←/api/trace/children
// (traced). So does the bar RE-DERIVE live? Open drawer on 40.1 BEFORE it's current → make-current(40.1) broadcast →
// settle → read _currentSlotUuid + barOffers. Flips to current ⇒ live re-derive works (my earlier RED = timing). Stays
// stale ⇒ live-re-derive GAP (refreshCurrentSlot not firing on the broadcast) = a real defect, SEPARATE from the accessor.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const T40='7a956c21-5f37-4062-b921-9bdd5a461546', PARK='4bc1b3d5';
const IOS={viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true,isMobile:false,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',ignoreHTTPSErrors:true};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const f=await setupFoundation({commit:'HEAD',buildDist:true}); const oh=f.ownerHeaders();
const mc=u=>fetch(`${f.base}/api/task/${u}/make-current`,{method:'POST',headers:oh});
const kids=await fetch(`${f.base}/api/trace/children/current-sprint-singleton-0000-000000000001?mode=trace`,{headers:oh}).then(r=>r.json()).then(d=>d.children||[]).catch(()=>[]);
const park=(kids.find(k=>String(k.uuid).startsWith(PARK))||{}).uuid||kids.find(k=>k.uuid!==T40)?.uuid;
const b=await webkit.launch({headless:true});
try{
  const ctx=await b.newContext({...IOS,serviceWorkers:'block'});
  await ctx.addInitScript(t=>{try{localStorage.setItem('rawbin-player-id',t)}catch{}},oh['x-player-token']);
  const sm=(oh['Cookie']||'').match(/sm_session=([^;]+)/); if(sm)await ctx.addCookies([{name:'sm_session',value:sm[1],domain:'localhost',path:'/'}]);
  const p=await ctx.newPage();
  await mc(park); await sleep(500); // PARK current elsewhere so 40.1 is NOT current when the drawer opens
  await p.goto(`${f.base}/trace`,{waitUntil:'networkidle',timeout:30000}).catch(()=>{});
  await p.waitForFunction(()=>!!customElements.get('rb-detail-drawer'),{timeout:20000}).catch(()=>{});
  const read=()=>p.evaluate(()=>{const d=document.querySelector('rb-detail-drawer');const bar=d?.querySelector('.drawer-actionbar');return{csuFull:String(d?._currentSlotUuid||''),refFull:String(d?._shownRef||''),shownType:String(d?._shownType||''),offers:/Set as Current/i.test(bar?.innerText||'')};});
  await p.evaluate(x=>document.dispatchEvent(new CustomEvent('selection-changed',{detail:{selected:['task:'+x]}})),T40); // open drawer on 40.1 (NOT current yet)
  await sleep(1400); const before=await read();
  console.log('OPEN 40.1 (park='+park?.slice(0,8)+' current): csu="'+before.csuFull+'" ref="'+before.refFull+'" type='+before.shownType+' offers='+before.offers);
  await mc(T40); // DESIGNATE 40.1 → broadcast (drawer already open); WATCH the bar over several seconds
  const watch=[]; for(const t of [500,2000,5000]){ await sleep(t===500?500:t-watch[watch.length-1]?.t||t); const r=await read(); watch.push({t, csu:r.csuFull.slice(0,8), offers:r.offers}); console.log(`  t+${t}ms: _currentSlotUuid=${r.csuFull.slice(0,8)} bar-offers=${r.offers}`); }
  const after=await read();
  console.log('\nAFTER make-current(40.1) [drawer open, settled] — VERBATIM comparison sides:');
  console.log('  _currentSlotUuid = "'+after.csuFull+'" (len '+after.csuFull.length+')');
  console.log('  _shownRef        = "'+after.refFull+'" (len '+after.refFull.length+')  type='+after.shownType);
  console.log('  bar-offers-SetCurrent = '+after.offers+'  (offers=true means the comparison bareUuid(ref)===_currentSlotUuid FAILED → taskRole other)');
  const reDerived = after.csuFull.includes('7a956c21') && after.offers===false;
  console.log(`\n⇒ BAR RE-DERIVES LIVE? ${reDerived}  ${reDerived?'(live re-derive WORKS → my earlier agreement RED bar-offer was a TIMING artifact)':'(_currentSlotUuid did NOT become 40.1 / bar still offers → LIVE-RE-DERIVE GAP: refreshCurrentSlot not firing on the broadcast = a SEPARATE defect from the accessor)'}`);
} finally { const td=await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
