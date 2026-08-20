import fs from 'fs'; import path from 'path';
const IDX = '/var/dev/Workspaces/web4x/Web4RawBin/scenario/index';
const byUuid = new Map();
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.scenario.json')){try{const j=JSON.parse(fs.readFileSync(p,'utf8'));if(j.model&&j.model.uuid)byUuid.set(j.model.uuid,{ior:j.ior,m:j.model});}catch{}}}})(IDX);
const ref=s=>String(s||'').replace('ior:instance:','');
const get=u=>byUuid.get(ref(u));
const ORDER=['Planned','In Progress','QA Review','Done'];
function derive(cl){if(typeof cl!=='string')return 'Planned';let b='Planned';for(const l of cl.split('\n')){const m=l.match(/^- \[x\] (Planned|In Progress|QA Review|Done)/);if(m&&ORDER.indexOf(m[1])>ORDER.indexOf(b))b=m[1];}return b;}
const rank=s=>ORDER.indexOf(s);
function tnum(name){const m=String(name||'').match(/Task ([0-9]+(?:\.[0-9]+)*)/);return m?m[1].split('.').map(Number):null;}
function cmpNum(a,b){if(!a&&!b)return 0;if(!a)return 1;if(!b)return -1;for(let i=0;i<Math.max(a.length,b.length);i++){const x=a[i]??-1,y=b[i]??-1;if(x!==y)return x-y;}return 0;}
function keyCmp(A,B){const ba=A.bo??Infinity,bb=B.bo??Infinity;if(ba!==bb)return ba-bb;return cmpNum(A.num,B.num);}
function auditSprint(uuid,label){
  const s=get(uuid); if(!s){console.log(`${label}: sprint unit MISSING`);return;}
  const tasks=(s.m.tasks||[]).map(get).filter(x=>x&&x.ior==='ior:class:Task').map(x=>({uuid:x.m.uuid.slice(0,8),name:(x.m.name||'').slice(0,54),num:tnum(x.m.name),numStr:tnum(x.m.name)?tnum(x.m.name).join('.'):'NONE',bo:(typeof x.m.buildOrder==='number'?x.m.buildOrder:null),status:derive(x.m.statusChecklist)}));
  console.log(`\n===== ${label} — ${tasks.length} tasks =====`);
  const noBO=tasks.filter(t=>t.bo===null), noNum=tasks.filter(t=>!t.num);
  console.log(`(a) COVERAGE: buildOrder present on ${tasks.length-noBO.length}/${tasks.length} · taskNumber-parseable on ${tasks.length-noNum.length}/${tasks.length}`);
  console.log(`    missing buildOrder: ${noBO.length===tasks.length?'ALL':noBO.map(t=>t.numStr).join(', ')}`);
  if(noNum.length)console.log(`    UNPARSEABLE taskNumber: ${noNum.map(t=>t.uuid+' "'+t.name+'"').join(' | ')}`);
  // integrity: dup taskNumbers, dup buildOrders
  const numCount={},boCount={};
  for(const t of tasks){if(t.num)numCount[t.numStr]=(numCount[t.numStr]||0)+1;if(t.bo!==null)boCount[t.bo]=(boCount[t.bo]||0)+1;}
  const dupNum=Object.entries(numCount).filter(([,c])=>c>1),dupBO=Object.entries(boCount).filter(([,c])=>c>1);
  console.log(`(b) INTEGRITY: duplicate taskNumbers: ${dupNum.length?dupNum.map(([k,c])=>k+'x'+c).join(', '):'none'} · duplicate buildOrders: ${dupBO.length?dupBO.map(([k,c])=>k+'x'+c).join(', '):'none'}`);
  // buildOrder vs taskNumber contradiction (both present)
  const withBoth=tasks.filter(t=>t.bo!==null&&t.num).sort((a,b)=>a.bo-b.bo);
  let contra=[];for(let i=1;i<withBoth.length;i++){if(cmpNum(withBoth[i-1].num,withBoth[i].num)>0)contra.push(`bo ${withBoth[i-1].bo}(${withBoth[i-1].numStr}) before bo ${withBoth[i].bo}(${withBoth[i].numStr}) but taskNum later`);}
  console.log(`    buildOrder-vs-taskNumber contradictions: ${contra.length?contra.join(' | '):'none'}`);
  // ordered list + status
  const ord=[...tasks].sort(keyCmp);
  console.log(`(ordered by buildOrder-asc,taskNumber-asc — status):`);
  for(const t of ord)console.log(`    ${t.bo===null?'--':String(t.bo).padStart(2)} | ${t.numStr.padEnd(7)} | ${t.status.padEnd(11)} | ${t.uuid} ${t.name}`);
  // PREDICTION
  const workable=ord.filter(t=>rank(t.status)<rank('QA Review'));
  const cur=workable[0],nxt=workable[1];
  console.log(`(PREDICTION) workable(<QA-Review)=${workable.length}. NEW CURRENT = ${cur?cur.numStr+' '+cur.uuid+' ('+cur.status+') "'+cur.name+'"':'NONE (sprint complete -> sprint-number order)'}`);
  console.log(`             NEXT = ${nxt?nxt.numStr+' '+nxt.uuid+' ('+nxt.status+') "'+nxt.name+'"':'NONE'}`);
}
auditSprint('b86b53cc-13cb-409a-81d6-2025b5f2979e','Sprint 37');
auditSprint('8e8b32d6-22bf-46f7-bf5c-7da31ef41e19','Sprint 40');
