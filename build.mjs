import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';
const distDir = 'src/public/dist';

// Clean old hashed builds
if (fs.existsSync(distDir)) {
  for (const f of fs.readdirSync(distDir)) {
    if (f.startsWith('app-') || f.startsWith('edit-') || f.startsWith('trace-page-') || f.startsWith('scenario-view-') || f.startsWith('rb-update-banner-') || f.startsWith('server-manager-') || f === 'app.js' || f === 'edit.js' || f.endsWith('.map')) {
      fs.unlinkSync(path.join(distDir, f));
    }
  }
}

// R31.7 SINGLE-SOURCE VERSION: the version's ONE source of truth is the typed ior:class:Config singleton.
// build.mjs GENERATES every consumer from it — package.json (surgical write-back), sw.js CACHE_NAME, build-manifest,
// and the __BUILD_VERSION__ bundle const — so no hand-maintained copy can desync (the phantom-7.99 root). Bump the
// version by editing the Config unit's `version` field ONLY, then build.
const CONFIG_UNIT = 'scenario/index/c/o/n/f/i/config-singleton-0000-000000000001.scenario.json';
const version = JSON.parse(fs.readFileSync(CONFIG_UNIT, 'utf-8')).model.version;
if (!/^\d+\.\d+\.\d+$/.test(String(version))) throw new Error(`R31.7: Config unit version "${version}" is not semver — refusing to build (${CONFIG_UNIT})`);
// package.json is now a GENERATED DERIVATIVE: surgical regex write-back of ONLY the version field (preserve all other
// keys + exact formatting, same discipline as the sw.js stamp) — a hand-edit is overwritten on the next build.
let pkgRaw = fs.readFileSync('package.json', 'utf-8');
const pkg = JSON.parse(pkgRaw);
if (pkg.version !== version) { fs.writeFileSync('package.json', pkgRaw.replace(/("version":\s*")[^"]*(")/, `$1${version}$2`)); }

const result = await esbuild.build({
  entryPoints: ['src/public/ts/app.ts', 'src/public/ts/edit.ts', 'src/public/ts/trace-page.ts', 'src/public/ts/scenario-view.ts', 'src/public/ts/components/rb-update-banner.ts', 'src/public/ts/server-manager/server-manager.ts'],
  bundle: true,
  format: 'esm',
  target: 'es2020',
  outdir: distDir,
  entryNames: '[name]-[hash]',
  minify: true,
  sourcemap: !isProduction,
  metafile: true,
  define: { '__BUILD_VERSION__': JSON.stringify(version) }, // R31.7: from the Config unit, not pkg
});

// Find output filenames
const outputs = Object.keys(result.metafile.outputs).filter(f => f.endsWith('.js') && !f.endsWith('.map'));
const jsFile = outputs.find(f => path.basename(f).startsWith('app-'));
const editFile = outputs.find(f => path.basename(f).startsWith('edit-'));
const traceFile = outputs.find(f => path.basename(f).startsWith('trace-page-'));
const scenarioFile = outputs.find(f => path.basename(f).startsWith('scenario-view-'));
const bannerFile = outputs.find(f => path.basename(f).startsWith('rb-update-banner-'));
const smFile = outputs.find(f => path.basename(f).startsWith('server-manager-'));
// R31.4 step-4: the server-manager bundle imports xterm.css → esbuild emits a sibling server-manager-<hash>.css
const smCssFile = Object.keys(result.metafile.outputs).find(f => f.endsWith('.css') && path.basename(f).startsWith('server-manager-'));
const jsBasename = path.basename(jsFile);
const editBasename = editFile ? path.basename(editFile) : null;
const traceBasename = traceFile ? path.basename(traceFile) : null;
const scenarioBasename = scenarioFile ? path.basename(scenarioFile) : null;
const bannerBasename = bannerFile ? path.basename(bannerFile) : null;
const smBasename = smFile ? path.basename(smFile) : null;
const smCssBasename = smCssFile ? path.basename(smCssFile) : null;

// Write build manifest for server to read
const manifest = { version, 'app.js': jsBasename, built: new Date().toISOString() }; // R31.7: version field (build-stamped from the Config unit) — /api/config reads THIS, not a live package.json read
if (editBasename) manifest['edit.js'] = editBasename;
if (traceBasename) manifest['trace-page.js'] = traceBasename;
if (scenarioBasename) manifest['scenario-view.js'] = scenarioBasename;
if (bannerBasename) manifest['rb-update-banner.js'] = bannerBasename;
if (smBasename) manifest['server-manager.js'] = smBasename;
if (smCssBasename) manifest['server-manager.css'] = smCssBasename;
fs.writeFileSync(path.join(distDir, 'build-manifest.json'), JSON.stringify(manifest, null, 2));

// Stamp CACHE_NAME + STATIC_SHELL in sw.js with current version + hashed bundles
const swPath = 'src/public/sw.js';
let swContent = fs.readFileSync(swPath, 'utf-8');
// R21.x guard: sw.js is stamped by regex-replace, which cannot regenerate an emptied
// file. An empty/truncated sw.js → silent dead PWA (regressed v0.6.55). Fail loudly.
if (!swContent.includes('CACHE_NAME') || !swContent.includes('STATIC_SHELL')) {
  throw new Error(`sw.js is empty or malformed (${swContent.length} bytes) — cannot stamp. Restore from a known-good commit.`);
}
swContent = swContent.replace(/const CACHE_NAME = 'rawbin-v[^']*';/, `const CACHE_NAME = 'rawbin-v${version}';`);
const shellEntries = [
  '/app', '/app.css', '/manifest.json', '/icon-180.png', '/icon-192.png', '/icon-512.png',
  '/trace', `/dist/${traceBasename}`,
  '/scenario', `/dist/${scenarioBasename}`,
  `/dist/${jsBasename}`,
];
const shellStr = `const STATIC_SHELL = [\n${shellEntries.map(e => `  '${e}',`).join('\n')}\n];`;
swContent = swContent.replace(/const STATIC_SHELL = \[[\s\S]*?\];/, shellStr);
fs.writeFileSync(swPath, swContent);

const size = (fs.statSync(jsFile).size / 1024).toFixed(1);
console.log(`  ${jsFile}  ${size}kb`);
if (!isProduction) console.log(`  ${jsFile}.map`);
console.log(`  ${distDir}/build-manifest.json → ${jsBasename}`);
console.log(`  sw.js CACHE_NAME → rawbin-v${version}`);
