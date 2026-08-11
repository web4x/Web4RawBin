// INV-PDG (family: gate-reads-cache-not-deploy) — every behavioural/device gate must read the DEPLOY, never a SW cache.
// A gate served from a stale SW cache certifies NOTHING (green on unshipped code / red on fine code). Architect spec:
//  (1) newContext({ serviceWorkers: 'block' })  — the CALLER passes this context option (can't be done from here).
//  (2) neutralizeSW(page): UNREGISTER any already-registered SW + clear ALL caches, THEN cache-bypass reload.
//      'block' alone does NOT remove a SW registered in a prior run/profile — its first navigation still serves cache.
//  (3) the reload after clearing = the cache-bypass.
//  (4) assertServedIsDeploy(page, committedVersion) [INV-PDG-4, trigger-side]: cache-busted fetch of /api/config →
//      served .version MUST equal the committed build; a cached/stale read → ok:false ⇒ caller treats as NOT-RUN=RED,
//      never a false green. So if the (1)-(3) protection ever regresses, THIS catches it.
export async function neutralizeSW(page) {
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if (typeof caches !== 'undefined') { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); }
  });
  await page.reload({ waitUntil: 'networkidle' }); // fresh nav after SW gone + caches cleared
}

// Trigger-side verification: read the ACTUAL served version, cache-busted. Returns {served, committed, ok}.
// ok===false ⇒ the gate is reading cache/stale, NOT the deploy → the caller MUST report NOT-RUN=RED (not green).
export async function assertServedIsDeploy(page, committedVersion) {
  const served = await page.evaluate(async () => {
    const r = await fetch('/api/config?_pdg=' + Date.now(), { cache: 'no-store' });
    return (await r.json()).version;
  });
  return { served, committed: committedVersion, ok: served === committedVersion };
}
