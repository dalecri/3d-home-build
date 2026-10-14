// Living room (photos 26 + 28): west end, lake side. Teal sofa under the west slider,
// blue damask armchair by the beam post, teal oriental rug, wood + amber-glass chandelier,
// white grommet sheers, olive wainscot.
import * as THREE from 'three';
import { box, cyl, color, framedArt } from '../lib.js';
import { tex, picture } from '../textures.js';
import { sofa, armchair, coffeeTable, rug, chandelier, sheer, plant, mirror, cabinet, tableLamp, group } from '../furniture.js';

// Southwestern / Pendleton-style throw: bands of navy, rust, cream, teal, mustard.
function throwTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const ctx = c.getContext('2d');
  const bands = ['#1f3557', '#e3d5b4', '#c4572c', '#2c8a8a', '#e3d5b4', '#d9a43a', '#1f3557', '#7fb2c8', '#c4572c', '#e3d5b4'];
  bands.forEach((b, i) => { ctx.fillStyle = b; ctx.fillRect(0, i * 25.6, 256, 25.6); });
  // stepped diamonds
  for (let x = 0; x < 256; x += 64) for (const y of [64, 166]) {
    ctx.fillStyle = '#f0e6cc'; ctx.beginPath(); ctx.moveTo(x + 32, y - 22); ctx.lineTo(x + 54, y); ctx.lineTo(x + 32, y + 22); ctx.lineTo(x + 10, y); ctx.fill();
    ctx.fillStyle = '#1f3557'; ctx.beginPath(); ctx.moveTo(x + 32, y - 11); ctx.lineTo(x + 43, y); ctx.lineTo(x + 32, y + 11); ctx.lineTo(x + 21, y); ctx.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Oriental rug (photos 26/28): deep teal field with cream pin-dots, small cream medallion,
// cream key-pattern border band between teal bands.
function rugTex() {
  const W = 1024, H = 768;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
  const teal = '#1b5e60', cream = '#cbbf9c', navy = '#24344a', rust = '#8a5a3a';
  ctx.fillStyle = teal; ctx.fillRect(0, 0, W, H);
  // cream border band with navy key/meander pattern
  ctx.fillStyle = cream; ctx.fillRect(28, 28, W - 56, H - 56);
  ctx.fillStyle = teal; ctx.fillRect(92, 92, W - 184, H - 184);
  ctx.fillStyle = navy;
  for (let x = 40; x < W - 40; x += 28) { ctx.fillRect(x, 44, 16, 6); ctx.fillRect(x + 10, 50, 6, 20); ctx.fillRect(x, H - 50, 16, 6); ctx.fillRect(x + 10, H - 70, 6, 20); }
  for (let y = 40; y < H - 40; y += 28) { ctx.fillRect(44, y, 6, 16); ctx.fillRect(50, y + 10, 20, 6); ctx.fillRect(W - 50, y, 6, 16); ctx.fillRect(W - 70, y + 10, 20, 6); }
  ctx.fillStyle = rust; ctx.fillRect(84, 84, W - 168, 4); ctx.fillRect(84, H - 88, W - 168, 4); ctx.fillRect(84, 84, 4, H - 168); ctx.fillRect(W - 88, 84, 4, H - 168);
  // pin-dot field
  ctx.fillStyle = 'rgba(214,204,170,0.8)';
  for (let x = 104; x < W - 100; x += 18) for (let y = 104; y < H - 100; y += 18) ctx.fillRect(x + ((y / 18) % 2) * 9, y, 3, 3);
  // corner spandrels (cream quarter-ovals with navy flecks)
  for (const [cx, cy] of [[92, 92], [W - 92, 92], [92, H - 92], [W - 92, H - 92]]) {
    ctx.fillStyle = cream; ctx.beginPath(); ctx.ellipse(cx, cy, 70, 48, 0, 0, 7); ctx.fill();
    ctx.fillStyle = navy; for (let i = 0; i < 40; i++) { const a = i * 0.7, r = 12 + (i * 37) % 50; ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.66, 5, 5); }
  }
  ctx.fillStyle = teal; ctx.fillRect(0, 0, W, 28); ctx.fillRect(0, H - 28, W, 28); ctx.fillRect(0, 0, 28, H); ctx.fillRect(W - 28, 0, 28, H);
  // centre medallion
  ctx.fillStyle = cream; ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 105, 70, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = navy; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 92, 58, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = navy; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * 55, H / 2 + Math.sin(a) * 34, 6, 0, 7); ctx.fill(); }
  ctx.fillStyle = rust; ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 22, 14, 0, 0, 7); ctx.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// Grommet sheer hung on the west wall (panel runs along z).
function sheerWest(g, z0, z1, top) {
  const m = sheer(g, 0, z1 - z0, 0, top, { side: 'e', opacity: 0.82 });
  m.position.x = 0.27; m.position.z = (z0 + z1) / 2;
  return m;
}

export function build(root) {
  const g = new THREE.Group(); g.name = 'living'; root.add(g);
  const rod = color('#2a2622', 0.4, { metalness: 0.6 });

  // ---- rug: teal field, cream/brown key border ----
  rug(g, 2.45, 4.45, 0, 3.3, 2.5, rugTex());

  // ---- teal quilted sofa under the slider, with a southwestern throw + pillows ----
  sofa(g, 0.6, 4.6, Math.PI / 2, { len: 2.0, fabric: '#2d6a67' });
  const thr = new THREE.MeshStandardMaterial({ map: throwTex(), roughness: 0.95 });
  box(g, 0.62, 0.035, 1.25, thr, 0.68, 0.51, 4.75, { shadow: false });
  box(g, 0.035, 0.32, 1.25, thr, 0.99, 0.2, 4.75, { shadow: false }); // draped over the seat front
  const pillow = (z, hex, rz) => { const p = box(g, 0.14, 0.34, 0.42, color(hex, 0.9), 0.42, 0.52, z); p.rotation.x = rz; };
  pillow(5.35, '#c9a24a', -0.25);
  pillow(3.85, '#a9bfc4', 0.25);

  // ---- walnut coffee table parallel to the sofa ----
  coffeeTable(g, 1.65, 4.65, Math.PI / 2, { w: 1.35, d: 0.5, h: 0.4, wood: '#7d4f2c' });

  // ---- blue damask club chair by the beam post, angled toward the sofa ----
  armchair(g, 4.05, 5.15, -3 * Math.PI / 4 + 0.35, { fabric: '#2b5682' });

  // ---- chandelier: wood arms + amber tulip shades ----
  const ch = chandelier(g, 2.1, 4.5, 2.4, { arms: 5, drop: 0.5, wood: '#8a4f24', glass: '#d08a3c' });
  ch.traverse((o) => { if (o.material && o.material.emissive && o.material.transparent) { o.material.emissiveIntensity = 0.35; o.scale.set(1.25, 1.3, 1.25); } });

  // ---- sheers: big lake window (both ends) + west slider (both sides) ----
  const wz = 5.78;
  sheer(g, 0.4, 1.0, wz, 2.3, { opacity: 0.82 });
  sheer(g, 3.75, 4.32, wz, 2.3, { opacity: 0.82 });
  box(g, 4.0, 0.025, 0.025, rod, 2.38, 2.29, wz, { shadow: false });
  sheerWest(g, 5.42, 5.82, 2.3);
  sheerWest(g, 3.94, 4.28, 2.3);
  box(g, 0.025, 0.025, 2.0, rod, 0.27, 2.29, 4.86, { shadow: false });

  // ---- SW corner: dark side table + S-curve lamp with tan drum shade ----
  box(g, 0.42, 0.62, 0.4, color('#3a2a1e', 0.6), 0.4, 0, 5.6);
  box(g, 0.38, 0.02, 0.36, color('#2a1d14', 0.6), 0.4, 0.2, 5.6);
  const lampG = group(g, 0.4, 5.62, 0, 0.62);
  cyl(lampG, 0.07, 0.08, 0.03, color('#1c1c1c', 0.4, { metalness: 0.6 }), 0, 0, 0);
  const stem = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 20, Math.PI * 1.4), color('#1c1c1c', 0.4, { metalness: 0.6 }));
  stem.position.set(0, 0.2, 0); stem.rotation.y = Math.PI / 2; lampG.add(stem);
  cyl(lampG, 0.012, 0.012, 0.42, color('#1c1c1c', 0.4, { metalness: 0.6 }), 0, 0.03, 0, 6);
  const shadeM = color('#e2b98a', 0.9, { emissive: new THREE.Color('#e2a86a'), emissiveIntensity: 0.5, side: THREE.DoubleSide });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.2, 20, 1, true), shadeM); shade.position.y = 0.52; lampG.add(shade);
  const ll = new THREE.PointLight('#ffd3a0', 0.9, 3.0, 1.8); ll.position.y = 0.5; lampG.add(ll);
  framedArt(g, picture('sepia', 5), 0.3, 0.38, 0.17, 1.95, 5.72, 'e', '#1e1a16');

  // ---- by the bedroom door: maple cabinet + hurricane lamp, plant, gothic arch mirror ----
  cabinet(g, 1.5, 3.3, 0, { w: 0.62, h: 0.75, d: 0.4, wood: '#b0702e' });
  tableLamp(g, 1.5, 0.84, 3.3, { base: '#f0e6c8', shade: '#f6e8c4', h: 0.45, light: 0.6 });
  plant(g, 0.85, 0, 3.4, { s: 1.5, pot: '#c07a52', leaf: '#5c8a45' });
  const arch = group(g, 1.5, 3.12, 0, 1.15);
  const archWood = color('#8a4a22', 0.5);
  box(arch, 0.06, 0.95, 0.04, archWood, -0.23, 0, 0); box(arch, 0.06, 0.95, 0.04, archWood, 0.23, 0, 0);
  box(arch, 0.04, 0.95, 0.04, archWood, 0, 0, 0.01);
  box(arch, 0.52, 0.06, 0.04, archWood, 0, 0, 0);
  const archTop = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.03, 6, 20, Math.PI), archWood); archTop.position.set(0, 0.95, 0.02); arch.add(archTop);
  box(arch, 0.42, 0.9, 0.01, new THREE.MeshStandardMaterial({ color: '#b9c4c6', metalness: 1, roughness: 0.08 }), 0, 0.04, 0.025);
  mirror(g, 2.15, 1.55, 3.12, 's', { w: 0.3, h: 0.36, frame: '#a8702e' });

  // ---- small TV on a wrought-iron stand by the post, angled toward the sofa ----
  const tv = group(g, 4.3, 2.35, -1.0);
  const iron = color('#1e1e1e', 0.5, { metalness: 0.5 });
  for (const sx of [-0.13, 0.13]) for (const sz of [-0.12, 0.12]) box(tv, 0.02, 0.78, 0.02, iron, sx, 0, sz);
  for (const y of [0.05, 0.4, 0.76]) box(tv, 0.3, 0.02, 0.28, iron, 0, y, 0);
  box(tv, 0.12, 0.06, 0.12, iron, 0, 0.78, 0);
  box(tv, 0.72, 0.44, 0.05, color('#0c0c0c', 0.3), 0, 0.86, 0);

  // ---- photo-28 corner between the window and the beam post: cowboy hat + dark plate ----
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 24), color('#b06a45', 0.8));
  hat.rotation.x = Math.PI / 2; hat.position.set(4.4, 1.78, 5.83); g.add(hat);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 8), color('#a35f3d', 0.8)); crown.scale.set(1, 1.1, 0.6); crown.position.set(4.4, 1.8, 5.81); g.add(crown);
  const plate = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), color('#3a3632', 0.6)); plate.rotation.y = Math.PI; plate.position.set(4.4, 1.42, 5.83); g.add(plate);
  return g;
}
