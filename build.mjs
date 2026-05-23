import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';
const distDir = 'src/public/dist';

// Clean old hashed builds
if (fs.existsSync(distDir)) {
  for (const f of fs.readdirSync(distDir)) {
    if (f.startsWith('app-') || f === 'app.js' || f.endsWith('.map')) {
      fs.unlinkSync(path.join(distDir, f));
    }
  }
}

const result = await esbuild.build({
  entryPoints: ['src/public/ts/app.ts'],
  bundle: true,
  format: 'esm',
  target: 'es2020',
  outdir: distDir,
  entryNames: '[name]-[hash]',
  minify: true,
  sourcemap: !isProduction,
  metafile: true,
});

// Find the output filename
const outputs = Object.keys(result.metafile.outputs);
const jsFile = outputs.find(f => f.endsWith('.js') && !f.endsWith('.map'));
const jsBasename = path.basename(jsFile);

// Write build manifest for server to read
fs.writeFileSync(path.join(distDir, 'build-manifest.json'), JSON.stringify({
  'app.js': jsBasename,
  built: new Date().toISOString(),
}, null, 2));

const size = (fs.statSync(jsFile).size / 1024).toFixed(1);
console.log(`  ${jsFile}  ${size}kb`);
if (!isProduction) console.log(`  ${jsFile}.map`);
console.log(`  ${distDir}/build-manifest.json → ${jsBasename}`);
