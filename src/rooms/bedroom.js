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
    box(hb, 0.26, 0.46, 0.02, barn, s * 0.56, 0.7, D - 0.01);
    knob(s * 0.56, 0.93, D + 0.02);
    box(hb, 0.3, 0.03, D, pine, s * 0.56, 1.2, D / 2);
  }
  // centre shelf with the black panther figurine
  box(hb, 0.76, 0.03, D, pine, 0, 1.2, D / 2);
  const pm = color('#16181a', 0.25, { metalness: 0.5 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), pm); body.scale.set(2.6, 0.75, 0.7); body.position.set(0, 1.3, 0.16); hb.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), pm); head.position.set(-0.17, 1.32, 0.16); hb.add(head);
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

// Soft double bed: rounded puffy comforter with raised lengthwise pintuck stripes,
// overhang draping almost to the floor and flaring at the foot, pillows + accent cushions.
function bed(parent, x0, bz) {
  const g = group(parent, x0, bz); // local +x = toward the foot (east), +z = south
  const L = 1.9, BW = 1.37, CW = 1.66, top = 0.52, R = 0.07;
  const sage = color('#93a391', 0.95), stripe = color('#c2cdbf', 0.9);
  box(g, L - 0.06, 0.28, BW - 0.06, color('#8e998b', 0.9), L / 2, 0.08, 0); // box spring
  box(g, L, 0.14, BW, color('#a3ad9f', 0.9), L / 2, 0.34, 0); // mattress
  // comforter top slab + rounded rolls along both sides and the foot
  box(g, L - R, 0.06, CW - 2 * R, sage, (L - R) / 2, top - 0.06, 0);
  const roll = (len, x, z, ry) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(R, R, len, 14), sage); c.rotation.set(0, ry, Math.PI / 2); c.position.set(x, top - R, z); c.castShadow = true; g.add(c); return c; };
  for (const s of [-1, 1]) roll(L - R, (L - R) / 2, s * (CW / 2 - R), 0);
  roll(CW - 2 * R, L - R, 0, Math.PI / 2);
  for (const s of [-1, 1]) { const sp = new THREE.Mesh(new THREE.SphereGeometry(R, 14, 10), sage); sp.position.set(L - R, top - R, s * (CW / 2 - R)); g.add(sp); }
  // draped overhang: hangs to ~8 cm off the floor and kicks out at the bottom
  const dropH = top - R - 0.08;
  for (const s of [-1, 1]) {
    const d = box(g, L - R, dropH, 0.03, sage, (L - R) / 2, 0.08, s * (CW / 2 - 0.015));
    d.rotation.x = -s * 0.06; d.position.z += s * 0.012;
  }
  const fd = box(g, 0.03, dropH, CW - 2 * R, sage, L - 0.015, 0.08, 0); fd.rotation.z = -0.07; fd.position.x += 0.014;
  for (const s of [-1, 1]) { // flared foot corner
    const c = new THREE.Mesh(new THREE.CylinderGeometry(R, R + 0.05, dropH, 14, 1, true, 0, Math.PI / 2), sage);
    c.material.side = THREE.DoubleSide; c.rotation.y = s > 0 ? 0 : Math.PI / 2; c.position.set(L - R, 0.08 + dropH / 2, s * (CW / 2 - R)); g.add(c);
  }
  // raised lengthwise pintuck stripes: across the top and down the foot drape
  for (let z = -CW / 2 + 0.16; z < CW / 2 - 0.1; z += 0.13) {
    box(g, L - 0.12, 0.008, 0.012, stripe, (L - 0.12) / 2 + 0.06, top, z, { shadow: false });
    if (Math.abs(z) < CW / 2 - R) box(g, 0.008, dropH, 0.012, stripe, L + 0.012 + 0.02, 0.1, z, { shadow: false }).rotation.z = -0.07;
  }
  // two flat white-grey sleeping pillows against the headboard
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12), color('#dfe1dc', 0.95));
    p.scale.set(0.38, 0.22, 0.66); p.rotation.z = -0.35; p.position.set(0.2, top + 0.09, s * 0.36); p.castShadow = true; g.add(p);
  }
  // black square throw cushion (left of centre) overlapping a round white tufted cushion with pompoms
  const blk = new THREE.Group(); blk.position.set(0.4, top + 0.05, 0.1); blk.rotation.set(0.25, 0, 0.95); g.add(blk);
  const bcM = color('#141414', 0.85);
  box(blk, 0.1, 0.44, 0.46, bcM, 0, 0, 0);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.46, 10), bcM); e.rotation.x = Math.PI / 2; e.position.set(0, 0.22 + s * 0.22, 0); blk.add(e); }
  const wc = new THREE.Group(); wc.position.set(0.52, top + 0.17, -0.1); wc.rotation.set(0, 0, 0.85); g.add(wc);
  const disc = new THREE.Mesh(new THREE.SphereGeometry(0.18, 22, 12), color('#f4f4f2', 0.95)); disc.scale.set(0.35, 1, 1); disc.castShadow = true; wc.add(disc);
  const btn = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), color('#e2e2de', 0.9)); btn.position.x = 0.065; wc.add(btn);
  const pomM = color('#fbfbf9', 1);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; const pp = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), pomM); pp.position.set(0, Math.sin(a) * 0.19, Math.cos(a) * 0.19); wc.add(pp); }
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
  tableLamp(g, 0.36, 0.72, zl, { base: '#e6d5b3', shade: '#d99482', h: 0.6, light: 0.45 });
  tableLamp(g, 0.36, 0.59, zr, { base: '#e6d5b3', shade: '#d99482', h: 0.55, light: 0.45 });
  // art: tropical sunset over the hutch, two pastel abstracts to its left, sepia prints
  framedArt(g, picture('tropical', 5), 1.06, 0.5, 0.17, 2.04, bz, 'e', '#6b4a2c', 0.07);
  framedArt(g, picture('pastel', 6), 0.36, 0.42, 0.17, 2.08, 2.7, 'e', '#1b1b1b', 0.06);
  framedArt(g, picture('pastel', 7), 0.36, 0.42, 0.17, 1.6, 2.7, 'e', '#1b1b1b', 0.06);
  framedArt(g, picture('sepia', 8), 0.32, 0.44, 0.17, 1.85, 0.52, 'e', '#2b1d12', 0.05);
  framedArt(g, picture('sepia', 9), 0.38, 0.52, 0.72, 1.85, 0.17, 's', '#2b1d12', 0.05);
  // grey curtains on the north window (x 1.3..2.25)
  sheer(g, 1.2, 1.48, 0.24, 2.14, { color: '#6d7887', opacity: 1, h: 1.38 });
  sheer(g, 2.08, 2.34, 0.24, 2.14, { color: '#6d7887', opacity: 1, h: 1.48 });
  box(g, 1.3, 0.02, 0.02, color('#777', 0.4, { metalness: 0.6 }), 1.77, 2.14, 0.22, { shadow: false });
  // baseboard heater on the north wall, east of the window
  box(g, 0.9, 0.18, 0.07, color('#e8e2d0', 0.5), 2.5, 0.06, 0.19);
  box(g, 0.86, 0.03, 0.01, color('#b9b2a0', 0.6), 2.5, 0.17, 0.228, { shadow: false }); // heater grille
  // outlet under the right curtain
  box(g, 0.07, 0.11, 0.01, color('#f2f0ea', 0.5), 2.28, 0.32, 0.165, { shadow: false });
  return g;
}
