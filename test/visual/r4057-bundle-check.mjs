// R40.57 decisive: does the scratch's REBUILT served client bundle actually carry the FIXED bareUuid? Distinguishes
// 'consumer still RED because another bug' (fixed bareUuid served) from 'stale bundle artifact' (old bareUuid served).
// buildDist:true forces a worktree `node build.mjs`. Fetch /trace, find the app/edit bundle, grep its bareUuid form.
import { setupFoundation } from './r4031-foundation.mjs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
try {
  console.log(`scratch: ${f.base} servedVersion=${f.servedVersion} sha=${f.worktreeSha}`);
  const html = await (await fetch(`${f.base}/trace`)).text();
  const bundles = [...html.matchAll(/\/dist\/([a-zA-Z0-9-]+\.js)/g)].map(m => m[1]);
  const uniq = [...new Set(bundles)];
  console.log('bundles referenced by /trace:', uniq.join(', ') || '(none found in html)');
  for (const b of uniq) {
    const js = await (await fetch(`${f.base}/dist/${b}`)).text().catch(() => '');
    if (!/bareUuid|_currentSlotUuid|drawer-actionbar/.test(js)) continue; // only the bundle that has the drawer code
    const hasGeneralStrip = /\[a-z0-9-\]\*:/.test(js) || /replace\([^)]*a-z[^)]*:/.test(js);
    const hasOldIorOnly = /ior:\(instance\|class\)/.test(js) || /\^ior:\(/.test(js);
    // direct: extract a snippet around the strip
    const snip = (js.match(/replace\([^;]{0,80}:[^;]{0,40}\)/g) || []).filter(s => /a-z|ior/.test(s)).slice(0, 4);
    console.log(`\nbundle ${b}: hasGeneralStrip=${hasGeneralStrip} hasOldIorOnly=${hasOldIorOnly}`);
    snip.forEach(s => console.log('   strip-snippet:', s.slice(0, 100)));
  }
} finally {
  const td = await f.teardown();
  console.log(`teardown: prodUp=${td.prodUp} leftover=${td.leftover}`);
}
