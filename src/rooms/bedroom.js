// Bedroom (photo 30): knotty-pine wainscot, white walls, rustic barn-board hutch headboard,
// sage pintuck comforter, rattan-front nightstands, ceramic lamps with pink shades,
// tropical painting over the bed, grey curtains on the north window, baseboard heater.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { box, color, framedArt } from '../lib.js';
import { tex, picture } from '../textures.js';
import { tableLamp, nightstand, sheer, group } from '../furniture.js';

// Hutch headboard: barn-board back, scalloped valance, shelves, two little doors.
function hutch(parent, x, z) {
  const hb = group(parent, x, z, Math.PI / 2); // local +x = north, local +z = east (into room)
  const barn = new THREE.MeshStandardMaterial({ map: tex('vboard', { base: '#7d6a58', boards: 9, knots: true, seed: 17 }), roughness: 0.85 }); barn.userData.tile = 0.9;
  const pine = color('#8a6d52', 0.8), pineDk = color('#735a42', 0.8);
  const W = 1.52, H = 1.66, D = 0.3;
  box(hb, W, H, 0.04, barn, 0, 0, 0.02); // back
  for (const s of [-1, 1]) box(hb, 0.06, H, D, pine, s * (W / 2 - 0.03), 0, D / 2); // end posts
  // base cabinet (behind the mattress) + bed-level ledge with a centre drawer
  box(hb, W, 0.55, D, barn, 0, 0, D / 2);
  box(hb, W, 0.05, D + 0.03, pine, 0, 0.6, (D + 0.03) / 2);
  box(hb, 0.5, 0.1, 0.02, pineDk, 0, 0.5, D + 0.01);
  const knob = (px, py, pz) => { const k = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), color('#f2efe8', 0.4)); k.position.set(px, py, pz); hb.add(k); };
  knob(0, 0.55, D + 0.03);
  // vertical dividers (scalloped side boards) between bays
  for (const s of [-1, 1]) box(hb, 0.05, 0.93, D, pine, s * 0.4, 0.67, D / 2);
  // side bays: little doors below a shelf
  for (const s of [-1, 1]) {
    box(hb, 0.26, 0.46, 0.02, barn, s * 0.56, 0.7, D - 0.01);
    knob(s * 0.56, 0.93, D + 0.02);
    box(hb, 0.3, 0.03, D, pine, s * 0.56, 1.2, D / 2);
  }
  // centre shelf with the black panther figurine
  box(hb, 0.76, 0.03, D, pine, 0, 1.2, D / 2);
  const pm = color('#16181a', 0.25, { metalness: 0.5 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), pm); body.scale.set(2.6, 0.75, 0.7); body.position.set(0, 1.3, 0.16); hb.add(body);
  for (const [lx, lz] of [[-0.1, 0.13], [-0.1, 0.19], [0.1, 0.13], [0.1, 0.19]]) box(hb, 0.018, 0.04, 0.018, pm, lx, 1.23, lz);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), pm); head.position.set(-0.17, 1.33, 0.16); hb.add(head);
  // scalloped valance across the top (three arches)
  const sh = new THREE.Shape();
  sh.moveTo(-W / 2, 0.24); sh.lineTo(W / 2, 0.24); sh.lineTo(W / 2, 0);
  for (const cx of [0.56, 0, -0.56]) {
    const hw = cx === 0 ? 0.34 : 0.12;
    sh.lineTo(cx + hw + 0.03, 0);
    sh.quadraticCurveTo(cx, 0.24, cx - hw - 0.03, 0);
  }
  sh.lineTo(-W / 2, 0); sh.lineTo(-W / 2, 0.24);
  const val = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }), pine);
  val.position.set(0, 1.4, D - 0.03); val.castShadow = true; hb.add(val);
  // crown (grey-brown, scalloped top board)
  const crown = color('#8f7558', 0.8);
  box(hb, W + 0.08, 0.05, D + 0.06, crown, 0, H, (D + 0.06) / 2 - 0.02);
  box(hb, W + 0.02, 0.05, D, crown, 0, H + 0.05, D / 2);
  for (const cx of [-0.56, 0, 0.56]) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(cx === 0 ? 0.3 : 0.18, cx === 0 ? 0.3 : 0.18, 0.03, 20, 1, false, -Math.PI / 2, Math.PI), crown); sc.rotation.x = Math.PI / 2; sc.scale.set(1, 1, 0.3); sc.position.set(cx, H + 0.1, D - 0.03); hb.add(sc); }
  // feather dream-catcher hanging on the left (south) end post
  const fm = color('#c98a5c', 0.9);
  for (let i = 0; i < 5; i++) box(hb, 0.03, 0.22, 0.01, fm, -W / 2 - 0.03 + i * 0.012, 0.95 - (i % 2) * 0.05, D + 0.02).rotation.z = 0.15 - i * 0.07;
  return hb;
}

// Woven rattan cane for the nightstand drawer fronts.
function caneMat() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#b08a55'; x.fillRect(0, 0, 64, 64);
  x.strokeStyle = 'rgba(70,45,20,0.55)'; x.lineWidth = 1.5;
  for (let i = -64; i < 128; i += 8) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 64, 64); x.stroke();
    x.beginPath(); x.moveTo(i + 64, 0); x.lineTo(i, 64); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }); m.userData.tile = 0.08;
  return m;
}

// Quilt texture: sage with subtle, slightly wobbly raised channels (head-to-foot) and tuft buttons.
function quiltTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#a7b5a3'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  for (const cx of [64, 192]) { // two channels per 0.44 m tile -> ~22 cm apart; v runs along the bed
    x.strokeStyle = 'rgba(198,207,194,0.55)'; x.lineWidth = 6; x.beginPath();
    for (let y = 0; y <= 256; y += 8) { const w = cx + Math.sin(y * 0.05 + cx) * 2.5; y ? x.lineTo(w, y) : x.moveTo(w, y); }
    x.stroke();
    x.strokeStyle = 'rgba(120,135,118,0.25)'; x.lineWidth = 2; x.beginPath();
    for (let y = 0; y <= 256; y += 8) { const w = cx + 4 + Math.sin(y * 0.05 + cx) * 2.5; y ? x.lineTo(w, y) : x.moveTo(w, y); }
    x.stroke();
  }
  x.fillStyle = 'rgba(196,205,192,0.6)';
  for (const [bx, by] of [[0, 64], [128, 192], [256, 64]]) { x.beginPath(); x.arc(bx, by, 4, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// Draped comforter as one continuous cloth surface: domed top with soft rounded edges (r ~9 cm),
// dropping over both sides and the foot nearly to the floor, flaring slightly with a few folds.
// Local frame: x = 0 at the headboard -> L at the foot, z across (centre 0), y up.
function drapedQuilt(L, W, top, { r = 0.09, drop = 0.44, dome = 0.025, flare = 0.12 } = {}) {
  const tileM = 0.44;
  const NS = 70, NT = 70, S1 = L + r * Math.PI / 2 + drop, T1 = W / 2 + r * Math.PI / 2 + drop;
  const pos = [], uv = [], idx = [];
  const arc = r * Math.PI / 2;
  const prof = (e) => { // excess e beyond an edge -> [outward offset, downward offset]
    if (e <= 0) return [0, 0];
    if (e < arc) { const th = e / r; return [r * Math.sin(th), r * (1 - Math.cos(th))]; }
    const k = e - arc; return [r + k * flare * (k / drop), r + k];
  };
  for (let i = 0; i <= NS; i++) {
    const s = (i / NS) * S1;
    for (let j = 0; j <= NT; j++) {
      const t = -T1 + (j / NT) * 2 * T1;
      const ex = s - L, ez = Math.abs(t) - W / 2, sz = Math.sign(t) || 1;
      let x = Math.min(s, L), z = Math.max(-W / 2, Math.min(W / 2, t)), y = top;
      // dome on the flat top
      const nz = z / (W / 2), nx = x / L; y += dome * (1 - nz * nz) * Math.min(1, nx * 4) ;
      if (ex > 0 && ez > 0) { // corner: radial cone with a loose fold
        const e = Math.hypot(ex, ez), [o, d] = prof(e);
        x += o * ex / e; z += sz * o * ez / e; y = top - d;
        const k = Math.max(0, e - arc) / drop; x += 0.05 * k * Math.sin(Math.atan2(ez, ex) * 6);
      } else if (ex > 0) {
        const [o, d] = prof(ex), k = Math.max(0, ex - arc) / drop; x += o + 0.025 * k * Math.sin(t * 9); y = top - d;
      } else if (ez > 0) {
        const [o, d] = prof(ez), k = Math.max(0, ez - arc) / drop; z += sz * (o + 0.025 * k * Math.sin(s * 8)); y = top - d;
      }
      pos.push(x, y, z); uv.push(t / tileM, s / tileM);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NT; j++) {
    const a = i * (NT + 1) + j, b = a + NT + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}

// Soft double bed with draped sage quilt, pale sage pillows, black square + round white cushions.
function bed(parent, x0, bz) {
  const g = group(parent, x0, bz); // local +x = toward the foot (east), +z = south
  const L = 1.88, W = 1.42, top = 0.56;
  box(g, L - 0.1, 0.16, W - 0.12, color('#6f7c6c', 0.95), L / 2, 0.0, 0); // darker bed skirt showing beneath
  box(g, L - 0.06, 0.4, W - 0.1, color('#9aa596', 0.9), (L - 0.06) / 2, 0.1, 0); // box spring + mattress (hidden)
  const qm = new THREE.MeshStandardMaterial({ map: quiltTex(), roughness: 0.97, side: THREE.DoubleSide });
  const q = new THREE.Mesh(drapedQuilt(L, W, top), qm); q.castShadow = true; q.receiveShadow = true; g.add(q);
  // two pale sage pillows lying flat against the headboard
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.13, 0.68, 4, 0.06), color('#b7c2b3', 0.95));
    p.rotation.z = 0.45; p.position.set(0.2, top + 0.1, s * 0.36); p.castShadow = true; g.add(p);
  }
  // black square throw pillow, laid nearly flat at an angle, left of centre
  const blk = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.11, 0.46, 4, 0.045), color('#161616', 0.85));
  blk.rotation.set(0, 0.5, 0.95); blk.position.set(0.38, top + 0.2, 0.14); blk.castShadow = true; g.add(blk);
  // round white tufted disc cushion with pompom edge, overlapping it
  const wc = new THREE.Group(); wc.position.set(0.52, top + 0.17, -0.08); wc.rotation.set(0, 0, 1.0); g.add(wc);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 28), color('#f2f2ef', 0.95)); disc.castShadow = true; wc.add(disc);
  const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 10), color('#f2f2ef', 0.95)); puff.scale.set(1, 0.2, 1); puff.position.y = 0.025; wc.add(puff);
  const btn = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), color('#dcdcd6', 0.9)); btn.position.y = 0.065; wc.add(btn);
  const pomM = color('#fbfbf9', 1);
  for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; const pp = new THREE.Mesh(new THREE.SphereGeometry(0.017, 6, 5), pomM); pp.position.set(Math.cos(a) * 0.205, 0, Math.sin(a) * 0.205); wc.add(pp); }
  return g;
}

export function build(root) {
  const g = new THREE.Group(); g.name = 'bedroom'; root.add(g);
  // bed: hutch headboard against the west wall, centred on z = bz
  const bz = 1.68, hx = 0.17, x0 = hx + 0.31; // x0 = front of hutch
  hutch(g, hx, bz);
  bed(g, x0, bz);
  // nightstands (rattan fronts) + ceramic lamps with pink shades
  const zl = bz + 0.99, zr = bz - 0.98; // left (south) and right (north) in the photo
  const cane = caneMat();
  for (const [z, o] of [[zl, { w: 0.48, h: 0.68, d: 0.42, drawers: 3 }], [zr, { w: 0.46, h: 0.55, d: 0.4, drawers: 2 }]]) {
    const x = 0.17 + o.d / 2 + 0.02;
    nightstand(g, x, z, Math.PI / 2, { ...o, wood: '#9a5a28', front: '#8a5a30' });
    const dh = (o.h - 0.1) / o.drawers;
    for (let i = 0; i < o.drawers; i++) box(g, 0.004, dh - 0.09, o.w - 0.16, cane, x + o.d / 2 + 0.012, 0.105 + i * dh, z, { shadow: false });
  }
  tableLamp(g, 0.36, 0.72, zl, { base: '#c4a878', shade: '#d99482', h: 0.6, light: 0.45 });
  tableLamp(g, 0.36, 0.59, zr, { base: '#c4a878', shade: '#d99482', h: 0.55, light: 0.45 });
  // art: tropical sunset over the hutch, two pastel abstracts to its left, sepia prints
  framedArt(g, picture('tropical', 5), 1.06, 0.5, 0.17, 2.04, bz, 'e', '#6b4a2c', 0.07);
  framedArt(g, picture('pastel', 6), 0.36, 0.42, 0.17, 2.08, 2.7, 'e', '#1b1b1b', 0.06);
  framedArt(g, picture('pastel', 7), 0.36, 0.42, 0.17, 1.6, 2.7, 'e', '#1b1b1b', 0.06);
  framedArt(g, picture('sepia', 8), 0.32, 0.44, 0.17, 1.85, 0.52, 'e', '#2b1d12', 0.05);
  framedArt(g, picture('sepia', 9), 0.38, 0.52, 0.72, 1.85, 0.17, 's', '#2b1d12', 0.05);
  // grey curtains on the north window (x 1.3..2.25)
  sheer(g, 1.2, 1.48, 0.24, 2.14, { color: '#7d838b', opacity: 1, h: 1.76 });
  sheer(g, 2.08, 2.34, 0.24, 2.14, { color: '#7d838b', opacity: 1, h: 1.82 });
  box(g, 1.3, 0.02, 0.02, color('#777', 0.4, { metalness: 0.6 }), 1.77, 2.14, 0.22, { shadow: false });
  // baseboard heater on the north wall, east of the window
  box(g, 0.9, 0.18, 0.07, color('#e8e2d0', 0.5), 2.5, 0.06, 0.19);
  box(g, 0.86, 0.03, 0.01, color('#b9b2a0', 0.6), 2.5, 0.17, 0.228, { shadow: false }); // heater grille
  // outlet under the right curtain
  box(g, 0.07, 0.11, 0.01, color('#f2f0ea', 0.5), 2.28, 0.32, 0.165, { shadow: false });
  return g;
}
