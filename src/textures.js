// Procedural canvas textures. Everything is generated at runtime so the site
// stays a single self-contained file. `tile` on each material = metres per repeat.
import * as THREE from 'three';

const cache = new Map();

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTex(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function shade(hex, f) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return '#' + c.getHexString();
}

function noise(ctx, w, h, amt, r, n = 4000) {
  for (let i = 0; i < n; i++) {
    const a = (r() - 0.5) * amt;
    ctx.fillStyle = a > 0 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${-a})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

function grainLines(ctx, x, y, w, h, base, r, vertical = false, count = 18) {
  for (let i = 0; i < count; i++) {
    ctx.strokeStyle = shade(base, 0.8 + r() * 0.35);
    ctx.globalAlpha = 0.25 + r() * 0.3;
    ctx.lineWidth = 0.6 + r() * 1.4;
    ctx.beginPath();
    if (vertical) {
      const gx = x + r() * w;
      ctx.moveTo(gx, y);
      ctx.bezierCurveTo(gx + (r() - 0.5) * 6, y + h * 0.3, gx + (r() - 0.5) * 6, y + h * 0.7, gx + (r() - 0.5) * 4, y + h);
    } else {
      const gy = y + r() * h;
      ctx.moveTo(x, gy);
      ctx.bezierCurveTo(x + w * 0.3, gy + (r() - 0.5) * 5, x + w * 0.7, gy + (r() - 0.5) * 5, x + w, gy + (r() - 0.5) * 3);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function knot(ctx, x, y, s, base) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, s);
  g.addColorStop(0, shade(base, 0.35));
  g.addColorStop(0.5, shade(base, 0.6));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.7, s, 0, 0, Math.PI * 2); ctx.fill();
}

const makers = {
  // Cherry-stained strip hardwood, boards run along u. 1 repeat = 1.2 m.
  hardwood({ base = '#8a3f22' } = {}) {
    const [c, ctx] = canvas(1024); const r = rng(11);
    const rows = 14, bh = 1024 / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 400;
      while (x < 1024) {
        const len = 250 + r() * 500;
        const col = shade(base, 0.82 + r() * 0.36);
        ctx.fillStyle = col; ctx.fillRect(x, i * bh, len, bh);
        grainLines(ctx, x, i * bh, len, bh, col, r, false, 7);
        ctx.fillStyle = 'rgba(30,10,5,0.55)'; ctx.fillRect(x, i * bh, 2, bh);
        x += len;
      }
      ctx.fillStyle = 'rgba(30,10,5,0.6)'; ctx.fillRect(0, i * bh, 1024, 2);
      // glossy highlight strip
      ctx.fillStyle = 'rgba(255,220,200,0.05)'; ctx.fillRect(0, i * bh + bh * 0.3, 1024, bh * 0.2);
    }
    return toTex(c);
  },
  // Vertical tongue & groove boards (wainscot). 1 repeat = 0.9 m wide.
  vboard({ base = '#6b6e4e', boards = 8, knots = false, seed = 3 } = {}) {
    const [c, ctx] = canvas(512); const r = rng(seed);
    const bw = 512 / boards;
    for (let i = 0; i < boards; i++) {
      const col = shade(base, 0.9 + r() * 0.2);
      ctx.fillStyle = col; ctx.fillRect(i * bw, 0, bw, 512);
      grainLines(ctx, i * bw, 0, bw, 512, col, r, true, knots ? 9 : 4);
      if (knots && r() < 0.6) knot(ctx, i * bw + r() * bw, r() * 512, 4 + r() * 6, base);
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(i * bw, 0, 3, 512);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(i * bw + 3, 0, 2, 512);
    }
    noise(ctx, 512, 512, 0.08, r, 2000);
    return toTex(c);
  },
  // Painted drywall with very light roller texture.
  paint({ base = '#d9dcc6' } = {}) {
    const [c, ctx] = canvas(256); const r = rng(5);
    ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
    noise(ctx, 256, 256, 0.05, r, 3000);
    return toTex(c);
  },
  // White ceiling panels (4x8 sheets with battens), 1 repeat = 1.22 m.
  ceiling() {
    const [c, ctx] = canvas(256); const r = rng(9);
    ctx.fillStyle = '#f2f2ee'; ctx.fillRect(0, 0, 256, 256);
    noise(ctx, 256, 256, 0.04, r, 1500);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, 256, 2); ctx.fillRect(0, 0, 2, 256);
    return toTex(c);
  },
  // Sandstone veneer blocks for the corner fireplace.
  stone() {
    const [c, ctx] = canvas(512); const r = rng(21);
    ctx.fillStyle = '#a8865a'; ctx.fillRect(0, 0, 512, 512);
    const rows = 8, rh = 512 / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 60;
      while (x < 512) {
        const w = 50 + r() * 70;
        const col = ['#d7b88a', '#e2c79b', '#c9a675', '#dcc093', '#cfae80'][Math.floor(r() * 5)];
        ctx.fillStyle = col; ctx.fillRect(x + 3, i * rh + 3, w - 6, rh - 6);
        for (let k = 0; k < 40; k++) {
          ctx.fillStyle = `rgba(${r() < 0.5 ? '120,80,40' : '255,240,210'},${0.15 + r() * 0.2})`;
          ctx.fillRect(x + 3 + r() * (w - 8), i * rh + 3 + r() * (rh - 8), 2 + r() * 6, 1 + r() * 3);
        }
        x += w;
      }
    }
    return toTex(c);
  },
  // Exterior cedar shakes, 1 repeat = 1 m.
  shingles({ base = '#b9773f' } = {}) {
    const [c, ctx] = canvas(512); const r = rng(31);
    const rows = 7, rh = 512 / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 40;
      while (x < 512) {
        const w = 22 + r() * 40;
        const col = shade(base, 0.78 + r() * 0.4);
        ctx.fillStyle = col; ctx.fillRect(x, i * rh, w, rh);
        grainLines(ctx, x, i * rh, w, rh, col, r, true, 4);
        ctx.fillStyle = 'rgba(40,20,5,0.6)'; ctx.fillRect(x, i * rh, 2, rh);
        x += w;
      }
      ctx.fillStyle = 'rgba(30,15,5,0.55)'; ctx.fillRect(0, (i + 1) * rh - 4, 512, 4);
    }
    return toTex(c);
  },
  // Asphalt roof shingles, grey.
  roof() {
    const [c, ctx] = canvas(256); const r = rng(41);
    ctx.fillStyle = '#5b5f66'; ctx.fillRect(0, 0, 256, 256);
    const rows = 8, rh = 256 / rows;
    for (let i = 0; i < rows; i++) {
      for (let x = (i % 2) * 16; x < 256; x += 32) {
        ctx.fillStyle = shade('#62666d', 0.85 + r() * 0.3); ctx.fillRect(x + 1, i * rh, 30, rh - 3);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, (i + 1) * rh - 3, 256, 3);
    }
    noise(ctx, 256, 256, 0.18, r, 5000);
    return toTex(c);
  },
  // Horizontal lap siding (guest chalet).
  siding({ base = '#b8d3cf' } = {}) {
    const [c, ctx] = canvas(256); const r = rng(51);
    const rows = 8, rh = 256 / rows;
    for (let i = 0; i < rows; i++) {
      ctx.fillStyle = shade(base, 0.96 + r() * 0.06); ctx.fillRect(0, i * rh, 256, rh);
      const g = ctx.createLinearGradient(0, i * rh, 0, (i + 1) * rh);
      g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(0.25, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,255,255,0.08)');
      ctx.fillStyle = g; ctx.fillRect(0, i * rh, 256, rh);
    }
    return toTex(c);
  },
  // Pressure-treated deck boards, run along u. 1 repeat = 1.4 m.
  deck() {
    const [c, ctx] = canvas(512); const r = rng(61);
    const rows = 10, bh = 512 / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 300;
      while (x < 512) {
        const len = 300 + r() * 400, col = shade('#9a6b47', 0.8 + r() * 0.35);
        ctx.fillStyle = col; ctx.fillRect(x, i * bh, len, bh - 5);
        grainLines(ctx, x, i * bh, len, bh - 5, col, r, false, 6);
        ctx.fillStyle = 'rgba(20,10,0,0.7)'; ctx.fillRect(x, i * bh, 2, bh);
        x += len;
      }
      ctx.fillStyle = '#2a1c12'; ctx.fillRect(0, (i + 1) * bh - 5, 512, 5);
    }
    return toTex(c);
  },
  // Concrete patio pavers, 1 repeat = 1.2 m (2x2 slabs).
  pavers() {
    const [c, ctx] = canvas(256); const r = rng(71);
    ctx.fillStyle = '#5e6a3a'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      ctx.fillStyle = shade('#a7a59c', 0.88 + r() * 0.2);
      ctx.fillRect(i * 128 + 3, j * 128 + 3, 122, 122);
    }
    noise(ctx, 256, 256, 0.15, r, 4000);
    return toTex(c);
  },
  // Terracotta tile counter top, 1 repeat = 0.4 m.
  tile({ base = '#9b5a43' } = {}) {
    const [c, ctx] = canvas(256); const r = rng(81);
    ctx.fillStyle = '#d8c8b6'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      ctx.fillStyle = shade(base, 0.85 + r() * 0.25);
      ctx.fillRect(i * 128 + 3, j * 128 + 3, 122, 122);
      for (let k = 0; k < 30; k++) {
        ctx.fillStyle = `rgba(${r() < 0.5 ? '60,20,10' : '230,170,140'},0.2)`;
        ctx.beginPath(); ctx.arc(i * 128 + 10 + r() * 108, j * 128 + 10 + r() * 108, 2 + r() * 8, 0, 7); ctx.fill();
      }
    }
    return toTex(c);
  },
  // Butcher-block maple.
  butcher() {
    const [c, ctx] = canvas(256); const r = rng(91);
    for (let i = 0; i < 12; i++) {
      const col = shade('#c99a5e', 0.85 + r() * 0.3);
      ctx.fillStyle = col; ctx.fillRect(0, i * 256 / 12, 256, 256 / 12);
      grainLines(ctx, 0, i * 256 / 12, 256, 256 / 12, col, r, false, 3);
    }
    return toTex(c);
  },
  // Oriental-style rug: teal field with dotted pattern, cream/brown border, medallion.
  rug({ field = '#1f6a6a', border = '#d9cfae', accent = '#7a4b2a' } = {}) {
    const [c, ctx] = canvas(1024, 768); const r = rng(101);
    ctx.fillStyle = border; ctx.fillRect(0, 0, 1024, 768);
    // outer border key pattern
    ctx.fillStyle = field;
    for (let x = 0; x < 1024; x += 24) { ctx.fillRect(x, 14, 12, 8); ctx.fillRect(x + 6, 746, 12, 8); }
    for (let y = 0; y < 768; y += 24) { ctx.fillRect(14, y, 8, 12); ctx.fillRect(1002, y + 6, 8, 12); }
    ctx.fillStyle = accent; ctx.fillRect(40, 40, 944, 6); ctx.fillRect(40, 722, 944, 6); ctx.fillRect(40, 40, 6, 688); ctx.fillRect(978, 40, 6, 688);
    // floral band
    for (let x = 60; x < 970; x += 30) for (const y of [62, 700]) { ctx.fillStyle = r() < 0.5 ? '#2c7d7a' : accent; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); }
    for (let y = 80; y < 690; y += 30) for (const x of [62, 962]) { ctx.fillStyle = r() < 0.5 ? '#2c7d7a' : accent; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); }
    // field
    ctx.fillStyle = field; ctx.fillRect(90, 90, 844, 588);
    ctx.fillStyle = 'rgba(230,220,190,0.75)';
    for (let x = 100; x < 930; x += 16) for (let y = 100; y < 670; y += 16) ctx.fillRect(x + ((y / 16) % 2) * 8, y, 3, 3);
    // corner spandrels + medallion
    ctx.fillStyle = border;
    for (const [cx, cy] of [[90, 90], [934, 90], [90, 678], [934, 678]]) { ctx.beginPath(); ctx.arc(cx, cy, 110, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(512, 384, 150, 100, 0, 0, 7); ctx.fill();
    ctx.fillStyle = field; ctx.beginPath(); ctx.ellipse(512, 384, 110, 70, 0, 0, 7); ctx.fill();
    ctx.fillStyle = accent; ctx.beginPath(); ctx.ellipse(512, 384, 70, 42, 0, 0, 7); ctx.fill();
    ctx.fillStyle = border; ctx.beginPath(); ctx.ellipse(512, 384, 40, 22, 0, 0, 7); ctx.fill();
    noise(ctx, 1024, 768, 0.12, r, 9000);
    const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  },
  // Shag rug (sage).
  shag({ base = '#a7b59a' } = {}) {
    const [c, ctx] = canvas(256); const r = rng(111);
    ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
    noise(ctx, 256, 256, 0.45, r, 12000);
    return toTex(c);
  },
  // Generic upholstery: base colour + subtle damask-like pattern.
  fabric({ base = '#2f5f86', pattern = 0.12, seed = 121 } = {}) {
    const [c, ctx] = canvas(256); const r = rng(seed);
    ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = `rgba(255,255,255,${pattern})`; ctx.lineWidth = 2;
    for (let x = 0; x < 256; x += 64) for (let y = 0; y < 256; y += 64) {
      ctx.beginPath(); ctx.moveTo(x + 32, y + 6); ctx.bezierCurveTo(x + 60, y + 20, x + 60, y + 44, x + 32, y + 58);
      ctx.bezierCurveTo(x + 4, y + 44, x + 4, y + 20, x + 32, y + 6); ctx.stroke();
    }
    noise(ctx, 256, 256, 0.1, r, 3000);
    return toTex(c);
  },
  // Quilted comforter with vertical pintuck stripes.
  comforter({ base = '#b9c9bd' } = {}) {
    const [c, ctx] = canvas(256); const r = rng(131);
    ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
    for (let x = 10; x < 256; x += 28 + r() * 14) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, 0, 3, 256);
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x + 3, 0, 4, 256);
    }
    noise(ctx, 256, 256, 0.05, r, 2000);
    return toTex(c);
  },
  // Ground: grass / forest floor mix.
  grass({ base = '#5f8a3a' } = {}) {
    const [c, ctx] = canvas(512); const r = rng(141);
    ctx.fillStyle = base; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 26000; i++) {
      const v = r();
      ctx.fillStyle = v < 0.4 ? '#4c7a2c' : v < 0.7 ? '#7aa04a' : v < 0.85 ? '#8a9a52' : '#6b5a3a';
      ctx.fillRect(r() * 512, r() * 512, 1 + r() * 2, 2 + r() * 4);
    }
    return toTex(c);
  },
  dirt() {
    const [c, ctx] = canvas(256); const r = rng(151);
    ctx.fillStyle = '#9a8566'; ctx.fillRect(0, 0, 256, 256);
    noise(ctx, 256, 256, 0.3, r, 9000);
    return toTex(c);
  },
};

// Returns a cached texture for a named maker + options.
export function tex(name, opts = {}) {
  const key = name + JSON.stringify(opts);
  if (!cache.has(key)) cache.set(key, makers[name](opts));
  return cache.get(key);
}

// Small canvas-painted pictures for wall art.
export function picture(kind, seed = 1) {
  const key = 'pic' + kind + seed;
  if (cache.has(key)) return cache.get(key);
  const [c, ctx] = canvas(256, 256); const r = rng(seed);
  if (kind === 'pastel') {
    ctx.fillStyle = '#f4efe6'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = ['#e7a3c3', '#a6c4e8', '#f2d27c', '#c6a7e0', '#e8b3a0'][i % 5];
      ctx.lineWidth = 4 + r() * 6; ctx.globalAlpha = 0.7;
      ctx.beginPath(); const x = 40 + r() * 176; ctx.moveTo(x, 30); ctx.bezierCurveTo(x + (r() - 0.5) * 80, 100, x + (r() - 0.5) * 80, 170, x + (r() - 0.5) * 40, 226); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (kind === 'sepia') {
    ctx.fillStyle = '#d9d2c4'; ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#2b241d'; ctx.fillRect(50, 30, 156, 196);
    ctx.fillStyle = '#8a7b66'; ctx.beginPath(); ctx.ellipse(128, 100, 30, 38, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(85, 220); ctx.quadraticCurveTo(128, 120, 171, 220); ctx.fill();
  } else if (kind === 'tropical') {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#3a2e5a'); g.addColorStop(0.45, '#d78a5a'); g.addColorStop(0.55, '#e8c86a'); g.addColorStop(0.7, '#2f7f86'); g.addColorStop(1, '#1d3d40');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#1a1a10'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(70, 220); ctx.quadraticCurveTo(80, 120, 60, 60); ctx.stroke();
    ctx.fillStyle = '#1f4a2a';
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(60 + Math.cos(i) * 30, 60 + Math.sin(i) * 12, 36, 7, i * 0.9, 0, 7); ctx.fill(); }
  } else {
    ctx.fillStyle = '#ccc'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = `hsl(${r() * 360},40%,${40 + r() * 30}%)`; ctx.fillRect(r() * 200, r() * 200, 60, 60); }
  }
  const t = toTex(c); cache.set(key, t); return t;
}
