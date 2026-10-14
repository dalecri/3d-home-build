// Bundles src/main.js + three into one IIFE and inlines it (plus reference thumbnails)
// into a single self-contained HTML file. Usage: node tools/build.mjs [out.html] [--no-refs]
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.argv[2] && !process.argv[2].startsWith('--') ? path.resolve(process.argv[2]) : path.join(root, 'dist/index.html');
const noRefs = process.argv.includes('--no-refs');

const res = await build({ entryPoints: [path.join(root, 'src/main.js')], bundle: true, format: 'iife', minify: !process.argv.includes('--dev'), write: false, target: 'es2020', logLevel: 'error' });
const js = res.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const refs = {};
if (!noRefs) {
  for (const f of fs.readdirSync(path.join(root, 'ref'))) {
    if (!f.endsWith('.thumb.jpg')) continue;
    refs[f.replace('.thumb.jpg', '')] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(root, 'ref', f)).toString('base64');
  }
}
let html = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
html = html.replace('/*REFS*/{}', () => JSON.stringify(refs)).replace('/*BUNDLE*/', () => js);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`wrote ${path.relative(process.cwd(), out)} (${(html.length / 1024).toFixed(0)} KB)`);
