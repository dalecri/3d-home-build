// Bedroom (photo 30): knotty-pine wainscot, white walls, rustic barn-board hutch headboard,
// sage pintuck comforter, rattan-front nightstands, ceramic lamps with pink shades,
// tropical painting over the bed, grey curtains on the north window, baseboard heater.
import * as THREE from 'three';
import { box, color, framedArt } from '../lib.js';
import { tex, picture } from '../textures.js';
import { tableLamp, nightstand, sheer, group } from '../furniture.js';

export function build(root) {
  const g = new THREE.Group(); g.name = 'bedroom'; root.add(g);
  // bed: headboard against west wall, centred on z = 1.45
  const bz = 1.45;
  const barn = new THREE.MeshStandardMaterial({ map: tex('vboard', { base: '#8a6a48', boards: 7, knots: true, seed: 17 }), roughness: 0.8 }); barn.userData.tile = 0.8;
  const hb = group(g, 0.17, bz, Math.PI / 2);
  box(hb, 1.75, 1.4, 0.32, barn, 0, 0, 0.16);
  box(hb, 1.85, 0.08, 0.38, color('#9a7650', 0.7), 0, 1.4, 0.19);
  box(hb, 1.6, 0.03, 0.26, color('#7a5a38', 0.7), 0, 1.05, 0.2);
  for (const s of [-1, 1]) box(hb, 0.32, 0.4, 0.02, color('#7d5e3e', 0.7), s * 0.62, 0.62, 0.33);
  // panther figurine on the shelf
  box(hb, 0.3, 0.1, 0.08, color('#1c1f22', 0.3, { metalness: 0.5 }), 0, 1.08, 0.2);
  const cm = new THREE.MeshStandardMaterial({ map: tex('comforter'), roughness: 0.95 }); cm.userData.tile = 0.7;
  box(g, 2.0, 0.32, 1.55, color('#d8d8d4', 0.9), 1.35, 0.12, bz);
  box(g, 2.06, 0.18, 1.65, cm, 1.36, 0.44, bz);
  box(g, 0.05, 0.4, 1.65, cm, 2.39, 0.22, bz);
  // pillows: black square + white round
  box(g, 0.45, 0.15, 0.55, color('#1d1d1d', 0.8), 0.6, 0.62, bz - 0.15).rotation.z = 0.5;
  const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 24), color('#f5f5f5', 0.95)); rp.rotation.z = Math.PI / 2 - 0.4; rp.position.set(0.7, 0.78, bz + 0.15); g.add(rp);
  // nightstands + lamps
  nightstand(g, 0.4, bz - 1.2, Math.PI / 2, { w: 0.5, h: 0.62, d: 0.4 });
  nightstand(g, 0.4, bz + 1.15, Math.PI / 2, { w: 0.5, h: 0.62, d: 0.4, wood: '#b0682e' });
  tableLamp(g, 0.4, 0.66, bz - 1.2, { base: '#e8dcc0', shade: '#f2b9a6', h: 0.55 });
  tableLamp(g, 0.4, 0.66, bz + 1.15, { base: '#e8dcc0', shade: '#f2b9a6', h: 0.55 });
  // art
  framedArt(g, picture('tropical', 5), 1.2, 0.55, 0.17, 2.25, bz, 'e', '#5a3a22', 0.05);
  framedArt(g, picture('pastel', 6), 0.48, 0.55, 0.9, 2.2, 2.93, 'n', '#1b1b1b');
  framedArt(g, picture('pastel', 7), 0.48, 0.55, 0.9, 1.58, 2.93, 'n', '#1b1b1b');
  framedArt(g, picture('sepia', 8), 0.32, 0.45, 2.15, 1.95, 2.93, 'n', '#2b1d12');
  framedArt(g, picture('sepia', 9), 0.42, 0.55, 3.33, 2.0, 0.9, 'w', '#2b1d12');
  // grey curtains on the north window
  sheer(g, 0.85, 1.15, 0.24, 2.2, { color: '#9aa6b0', opacity: 1 });
  sheer(g, 2.15, 2.45, 0.24, 2.2, { color: '#9aa6b0', opacity: 1 });
  box(g, 1.8, 0.02, 0.02, color('#777', 0.4, { metalness: 0.6 }), 1.65, 2.2, 0.22, { shadow: false });
  // baseboard heater under window
  box(g, 1.1, 0.18, 0.07, color('#e8e2d0', 0.5), 1.65, 0.06, 0.2);
  return g;
}
