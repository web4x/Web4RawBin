import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';
const distDir = 'src/public/dist';

// Clean old hashed builds
if (fs.existsSync(distDir)) {
  for (const f of fs.readdirSync(distDir)) {
    if (f.startsWith('app-') || f.startsWith('edit-') || f.startsWith('trace-page-') || f.startsWith('scenario-view-') || f.startsWith('rb-update-banner-') || f.startsWith('server-manager-') || f.startsWith('feature-manager-') || f === 'app.js' || f === 'edit.js' || f.endsWith('.map')) {
      fs.unlinkSync(path.join(distDir, f));
    }
  }
}

// [impl:uuid:b5eb6953-24e0-4213-8fe9-dd1b48b8099c] Build.generateVersion (Method dee42cc1, off Class b6946e59, UC
// config.singleSourceVersion 83e3891a) — R31.7 SINGLE-SOURCE VERSION: read the ONE typed ior:class:Config singleton
// → version (semver-validated, fail-loud), and surgically write-back package.json's version field so it becomes a
// GENERATED DERIVATIVE not the source. The returned value stamps sw.js CACHE_NAME + build-manifest + __BUILD_VERSION__
// below → every consumer derive-equal by construction (INV-V1); no hand-copy can desync (the phantom-7.99 root).
// Bump the version by editing the Config unit's `version` field ONLY, then build.
function generateVersion() {
  const CONFIG_UNIT = 'scenario/index/c/o/n/f/i/config-singleton-0000-000000000001.scenario.json';
  const v = JSON.parse(fs.readFileSync(CONFIG_UNIT, 'utf-8')).model.version;
  if (!/^\d+\.\d+\.\d+$/.test(String(v))) throw new Error(`R31.7: Config unit version "${v}" is not semver — refusing to build (${CONFIG_UNIT})`);
  const pkgRaw = fs.readFileSync('package.json', 'utf-8'); // surgical regex write-back of ONLY the version field (preserve all other keys + formatting, same discipline as the sw.js stamp)
  if (JSON.parse(pkgRaw).version !== v) fs.writeFileSync('package.json', pkgRaw.replace(/("version":\s*")[^"]*(")/, `$1${v}$2`));
  return v;
}
const version = generateVersion();

const result = await esbuild.build({
  entryPoints: ['src/public/ts/app.ts', 'src/public/ts/edit.ts', 'src/public/ts/trace-page.ts', 'src/public/ts/scenario-view.ts', 'src/public/ts/components/rb-update-banner.ts', 'src/public/ts/server-manager/server-manager.ts', 'src/public/ts/feature-manager/feature-manager.ts'],
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
const fmFile = outputs.find(f => path.basename(f).startsWith('feature-manager-')); // R31.8b Feature Manager bundle
// R31.4 step-4: the server-manager bundle imports xterm.css → esbuild emits a sibling server-manager-<hash>.css
const smCssFile = Object.keys(result.metafile.outputs).find(f => f.endsWith('.css') && path.basename(f).startsWith('server-manager-'));
const jsBasename = path.basename(jsFile);
const editBasename = editFile ? path.basename(editFile) : null;
const traceBasename = traceFile ? path.basename(traceFile) : null;
const scenarioBasename = scenarioFile ? path.basename(scenarioFile) : null;
const bannerBasename = bannerFile ? path.basename(bannerFile) : null;
const smBasename = smFile ? path.basename(smFile) : null;
const smCssBasename = smCssFile ? path.basename(smCssFile) : null;
const fmBasename = fmFile ? path.basename(fmFile) : null;

// Write build manifest for server to read
const manifest = { version, 'app.js': jsBasename, built: new Date().toISOString() }; // R31.7: version field (build-stamped from the Config unit) — /api/config reads THIS, not a live package.json read
if (editBasename) manifest['edit.js'] = editBasename;
if (traceBasename) manifest['trace-page.js'] = traceBasename;
if (scenarioBasename) manifest['scenario-view.js'] = scenarioBasename;
if (bannerBasename) manifest['rb-update-banner.js'] = bannerBasename;
if (smBasename) manifest['server-manager.js'] = smBasename;
if (smCssBasename) manifest['server-manager.css'] = smCssBasename;
if (fmBasename) manifest['feature-manager.js'] = fmBasename;
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
