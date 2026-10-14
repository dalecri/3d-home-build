// Screenshot one or more photo vantage points.
// Usage: node tools/shot.mjs <view>[,<view>...] [outDir]   (outDir default .shots)
// Writes <outDir>/<view>.png at 1500x1000 (same size as ref/<view>.jpg) and,
// if a reference exists, <outDir>/<view>.compare.png (ours left, photo right).
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const views = (process.argv[2] || 'living-east').split(',');
const outDir = path.resolve(process.argv[3] || path.join(root, '.shots'));
fs.mkdirSync(outDir, { recursive: true });
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'shot-')), 'index.html');
execFileSync('node', [path.join(root, 'tools/build.mjs'), tmp, '--no-refs'], { stdio: 'inherit' });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
for (const v of views) {
  await page.goto('file://' + tmp + '?shot=1&view=' + encodeURIComponent(v));
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  const file = path.join(outDir, v + '.png');
  const url = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
  fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  const ref = path.join(root, 'ref', v + '.jpg');
  if (fs.existsSync(ref)) {
    try {
      execFileSync('python3', ['-c', `
import sys
from PIL import Image
a=Image.open(sys.argv[1]).convert('RGB').resize((750,500)); b=Image.open(sys.argv[2]).convert('RGB').resize((750,500))
c=Image.new('RGB',(1500,500)); c.paste(a,(0,0)); c.paste(b,(750,0)); c.save(sys.argv[3])`, file, ref, path.join(outDir, v + '.compare.png')]);
    } catch (e) { /* PIL optional */ }
  }
  console.log('shot', path.relative(process.cwd(), file));
}
if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
await browser.close();
