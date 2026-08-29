// MEASURE (PO): is the live transport actually CONNECTED on Tron's /trace entry @390, and do broadcast frames arrive?
// Hook WebSocket before load; report: ws opened? reached OPEN? any 'unit-changed' frames? RawBinClient present? READ-ONLY.
import { webkit } from '@playwright/test';
const BASE='https://prod.wo-da.de:4444';
const IOS={viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true,isMobile:false,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',ignoreHTTPSErrors:true};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const WD=setTimeout(()=>{console.log('RED: WATCHDOG');process.exit(1);},90000);
const b=await webkit.launch({headless:true});
try{
  const ctx=await b.newContext({...IOS,serviceWorkers:'block'}); const p=await ctx.newPage();
  await p.addInitScript(()=>{
    window.__ws={created:0,open:0,frames:[],closed:0,error:0};
    const OW=window.WebSocket;
    window.WebSocket=function(...a){ const s=new OW(...a); window.__ws.created++; window.__ws.url=String(a[0]);
      s.addEventListener('open',()=>{window.__ws.open++;});
      s.addEventListener('close',()=>{window.__ws.closed++;});
      s.addEventListener('error',()=>{window.__ws.error++;});
      s.addEventListener('message',ev=>{ try{const m=JSON.parse(ev.data); window.__ws.frames.push(m.type||'?'); }catch{ window.__ws.frames.push('non-json'); } });
      return s; };
    window.WebSocket.prototype=OW.prototype; Object.assign(window.WebSocket, OW);
  });
  await p.goto(`${BASE}/trace`,{waitUntil:'networkidle',timeout:30000}).catch(()=>{});
  await sleep(4000); // give the ws time to connect
  const r=await p.evaluate(()=>({...window.__ws, readyStates:(()=>{try{return typeof RawBinClient!=='undefined'?'RawBinClient-global':'no-global';}catch{return 'n/a';}})(), frameCount:window.__ws.frames.length}));
  console.log('served=', JSON.stringify((await (await fetch(`${BASE}/api/config`).catch(()=>null))?.json?.().catch(()=>({})))?.version));
  console.log(`ws created=${r.created} open=${r.open} closed=${r.closed} error=${r.error} url=${r.url||'(none)'}`);
  console.log(`frames received (${r.frameCount}): ${(r.frames||[]).slice(0,8).join(',')||'(none)'}`);
  const connected = r.created>0 && r.open>0 && r.closed===0;
  console.log('\n★ LIVE TRANSPORT on /trace @390: '+(connected?'CONNECTED (ws open)':'NOT CONNECTED (created='+r.created+' open='+r.open+' closed='+r.closed+') = broadcasts cannot reach the page live'));
} finally { await b.close().catch(()=>{}); clearTimeout(WD); process.exit(0); }
