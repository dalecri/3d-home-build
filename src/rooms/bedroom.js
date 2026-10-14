// Bedroom (photo 30): knotty-pine wainscot, white walls, rustic barn-board hutch headboard,
// sage pintuck comforter, rattan-front nightstands, ceramic lamps with pink shades,
// tropical painting over the bed, grey curtains on the north window, baseboard heater.
import * as THREE from 'three';
import { box, color, framedArt } from '../lib.js';
import { tex, picture } from '../textures.js';
import { tableLamp, nightstand, sheer, group } from '../furniture.js';

// Hutch headboard: barn-board back, scalloped valance, shelves, two little doors.
function hutch(parent, x, z) {
  const hb = group(parent, x, z, Math.PI / 2); // local +x = north, local +z = east (into room)
  const barn = new THREE.MeshStandardMaterial({ map: tex('vboard', { base: '#6f5b46', boards: 9, knots: true, seed: 17 }), roughness: 0.85 }); barn.userData.tile = 0.9;
  const pine = color('#8a5d34', 0.75), pineDk = color('#6e4c2c', 0.75);
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
    box(hb, 0.26, 0.4, 0.02, barn, s * 0.56, 0.7, D - 0.01);
    knob(s * 0.56, 0.9, D + 0.02);
    box(hb, 0.3, 0.03, D, pine, s * 0.56, 1.12, D / 2);
  }
  // centre shelf with the black panther figurine
  box(hb, 0.76, 0.03, D, pine, 0, 1.08, D / 2);
  const pm = color('#16181a', 0.25, { metalness: 0.5 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), pm); body.scale.set(2.6, 0.75, 0.7); body.position.set(0, 1.18, 0.16); hb.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), pm); head.position.set(-0.17, 1.2, 0.16); hb.add(head);
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
  // crown
  box(hb, W + 0.08, 0.05, D + 0.06, pine, 0, H, (D + 0.06) / 2 - 0.02);
  box(hb, W + 0.02, 0.05, D, pineDk, 0, H + 0.05, D / 2);
  // feather dream-catcher hanging on the left (south) end post
  const fm = color('#c98a5c', 0.9);
  for (let i = 0; i < 5; i++) box(hb, 0.03, 0.22, 0.01, fm, -W / 2 - 0.03 + i * 0.012, 0.95 - (i % 2) * 0.05, D + 0.02).rotation.z = 0.15 - i * 0.07;
  return hb;
}

export function build(root) {
  const g = new THREE.Group(); g.name = 'bedroom'; root.add(g);
  // bed: hutch headboard against the west wall, centred on z = bz
  const bz = 1.6, hx = 0.17, x0 = hx + 0.31; // x0 = front of hutch
  hutch(g, hx, bz);
  // double bed, comforter pintucks run along the bed length
  const L = 1.95, BW = 1.37, CW = 1.62;
  const cm = new THREE.MeshStandardMaterial({ map: tex('comforter', { base: '#7f8f7e' }), roughness: 0.95 }); cm.userData.tile = 0.7;
  const sk = color('#93a091', 0.95);
  box(g, L, 0.3, BW, color('#9da79a', 0.9), x0 + L / 2, 0.08, bz); // box spring
  box(g, L, 0.17, BW, color('#a9b3a6', 0.9), x0 + L / 2, 0.38, bz); // mattress
  box(g, CW, 0.07, L + 0.06, cm, x0 + L / 2 + 0.03, 0.55, bz, { ry: Math.PI / 2 }); // comforter top
  for (const s of [-1, 1]) box(g, L + 0.06, 0.45, 0.04, cm, x0 + L / 2 + 0.03, 0.15, bz + s * (CW / 2 - 0.02)); // side drapes
  box(g, 0.04, 0.45, CW, cm, x0 + L + 0.07, 0.15, bz); // foot drape
  box(g, L - 0.1, 0.12, BW - 0.04, sk, x0 + L / 2, 0.02, bz); // bed skirt
  // pillows: two sage shams, black square + white round accent
  for (const s of [-1, 1]) {
    const p = box(g, 0.16, 0.3, 0.66, color('#9eac9b', 0.95), x0 + 0.14, 0.58, bz + s * 0.34); p.rotation.z = -0.6;
  }
  const blk = box(g, 0.12, 0.44, 0.54, color('#151515', 0.85), x0 + 0.3, 0.53, bz - 0.02); blk.rotation.z = -0.9; blk.rotation.x = 0.2;
  const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.11, 24), color('#f7f7f5', 0.95));
  rp.rotation.z = Math.PI / 2 - 0.35; rp.position.set(x0 + 0.42, 0.77, bz - 0.12); g.add(rp);
  // nightstands (rattan fronts) + ceramic lamps with pink shades
  const zl = bz + 1.0, zr = bz - 0.98; // left (south) and right (north) in the photo
  nightstand(g, 0.38, zl, Math.PI / 2, { w: 0.48, h: 0.68, d: 0.42, drawers: 3, wood: '#9a5a28', front: '#a07a48' });
  nightstand(g, 0.37, zr, Math.PI / 2, { w: 0.46, h: 0.55, d: 0.4, drawers: 2, wood: '#9a5a28', front: '#a07a48' });
  tableLamp(g, 0.36, 0.72, zl, { base: '#e6d5b3', shade: '#d99482', h: 0.6, light: 0.45 });
  tableLamp(g, 0.36, 0.59, zr, { base: '#e6d5b3', shade: '#d99482', h: 0.55, light: 0.45 });
  // art: tropical sunset over the hutch, two pastel abstracts to its left, sepia prints
  framedArt(g, picture('tropical', 5), 1.06, 0.5, 0.17, 2.04, bz, 'e', '#6b4a2c', 0.07);
  framedArt(g, picture('pastel', 6), 0.42, 0.42, 0.17, 2.16, bz + 1.2, 'e', '#1b1b1b', 0.06);
  framedArt(g, picture('pastel', 7), 0.42, 0.42, 0.17, 1.66, bz + 1.2, 'e', '#1b1b1b', 0.06);
  framedArt(g, picture('sepia', 8), 0.32, 0.44, 0.17, 1.85, bz - 1.12, 'e', '#2b1d12', 0.05);
  framedArt(g, picture('sepia', 9), 0.38, 0.52, 0.72, 1.85, 0.17, 's', '#2b1d12', 0.05);
  // grey curtains on the north window (x 1.3..2.25)
  sheer(g, 1.2, 1.48, 0.24, 2.14, { color: '#6d7887', opacity: 1, h: 1.38 });
  sheer(g, 2.08, 2.34, 0.24, 2.14, { color: '#6d7887', opacity: 1, h: 1.48 });
  box(g, 1.3, 0.02, 0.02, color('#777', 0.4, { metalness: 0.6 }), 1.77, 2.14, 0.22, { shadow: false });
  // baseboard heater on the north wall, east of the window
  box(g, 0.9, 0.18, 0.07, color('#e8e2d0', 0.5), 2.75, 0.06, 0.19);
  // outlet under the right curtain
  box(g, 0.07, 0.11, 0.01, color('#f2f0ea', 0.5), 2.28, 0.32, 0.165, { shadow: false });
  return g;
}
