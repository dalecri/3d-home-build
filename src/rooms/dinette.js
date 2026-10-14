// Dinette (photo 25): retro chrome set with coral/cream chairs, smoked-glass table,
// stained-glass drum pendant, wood-framed wall mirror + carved whatnot shelf over olive
// wainscot on the closet's south face ("mirror wall"), olive posts at both ends of it.
import * as THREE from 'three';
import { box, color, mat } from '../lib.js';
import { glassTable, dinetteChair, tiffanyPendant, group } from '../furniture.js';

export function build(root) {
  const g = new THREE.Group(); g.name = 'dinette'; root.add(g);
  const olive = mat('olive');
  const wood = color('#7a4424', 0.45);
  const redWood = color('#9a4a26', 0.45);
  const wallZ = 1.155; // south face of the closet (mirror wall)

  // ---- posts at both ends of the mirror wall ----
  box(g, 0.16, 2.4, 0.16, olive, 6.8, 0, 1.1, { collide: true }); // P2: closet SE corner (kitchen side)
  box(g, 0.16, 2.4, 0.16, olive, 5.3, 0, 1.6, { collide: true }); // P1: end of the short wing wall
  // header beam from P1 over to the living/dinette beam
  box(g, 0.7, 0.16, 0.14, olive, 4.95, 2.4 - 0.16, 1.6);

  // ---- table + chairs ----
  const cx = 5.45, cz = 2.15;
  glassTable(g, cx, cz, { r: 0.5 });
  dinetteChair(g, cx - 0.58, cz, Math.PI / 2);
  dinetteChair(g, cx + 0.58, cz, -Math.PI / 2);
  dinetteChair(g, cx, cz - 0.58, 0);
  dinetteChair(g, cx, cz + 0.58, Math.PI);
  tiffanyPendant(g, cx + 0.1, cz - 0.1, 2.4, { r: 0.32, drop: 0.45 });

  // ---- wood-framed mirror with a vertical divider (on the mirror wall, faces south) ----
  const mw = 0.95, mh = 0.68, mx = 6.12, my = 1.17;
  const mm = new THREE.MeshStandardMaterial({ color: '#b9c4c4', roughness: 0.08, metalness: 0.9 });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), mm);
  glass.position.set(mx, my + mh / 2, wallZ + 0.02); g.add(glass);
  box(g, mw + 0.08, 0.05, 0.04, wood, mx, my + mh, wallZ + 0.02, { shadow: false });
  box(g, mw + 0.08, 0.05, 0.04, wood, mx, my - 0.05, wallZ + 0.02, { shadow: false });
  box(g, 0.05, mh + 0.1, 0.04, wood, mx - mw / 2 - 0.015, my - 0.05, wallZ + 0.02, { shadow: false });
  box(g, 0.05, mh + 0.1, 0.04, wood, mx + mw / 2 + 0.015, my - 0.05, wallZ + 0.02, { shadow: false });
  box(g, 0.035, mh, 0.03, wood, mx + 0.12, my, wallZ + 0.03, { shadow: false });
  // white bottle-shaped pendants reflected/hung in the mirror's right bay
  for (const [dx, y] of [[0.22, 1.42], [0.34, 1.3]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.3, 12), color('#f2efe6', 0.4));
    b.position.set(mx + dx, y, wallZ + 0.06); g.add(b);
  }

  // ---- carved red-wood whatnot shelf, left of the mirror ----
  const sh = group(g, 5.5, wallZ, 0, 1.12);
  box(sh, 0.07, 0.62, 0.02, redWood, 0, 0, 0.01, { shadow: false });
  for (let i = 0; i < 3; i++) {
    const w = 0.24 - i * 0.04;
    box(sh, w, 0.025, 0.11, redWood, 0, 0.06 + i * 0.2, 0.055, { shadow: false });
    // scrolled side brackets
    for (const s of [-1, 1]) box(sh, 0.03, 0.12, 0.02, redWood, s * (w / 2 - 0.02), 0.06 + i * 0.2 - 0.1, 0.03, { shadow: false });
  }
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.1, 10), color('#d8b25a', 0.5));
  vase.position.set(5.5, 1.12 + 0.6 + 0.05, wallZ + 0.06); g.add(vase);

  // ---- decorative plaques ----
  const disc = (x, y, z, r, c, ry = 0, rim = '#b88a3a') => {
    const d = new THREE.Group(); d.position.set(x, y, z); d.rotation.y = ry; g.add(d);
    const rimM = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.015, 28), color(rim, 0.35, { metalness: 0.4 }));
    rimM.rotation.x = Math.PI / 2; d.add(rimM);
    const face = new THREE.Mesh(new THREE.CircleGeometry(r * 0.78, 28), color(c, 0.5)); face.position.z = 0.009; d.add(face);
  };
  // dark floral plaque on the wing wall (faces east)
  disc(5.37, 1.88, 1.33, 0.11, '#2e3b2a', Math.PI / 2, '#3a2a1a');
  // round gilt plate on the kitchen-side post (faces south)
  disc(6.8, 1.68, 1.19, 0.11, '#d9cfa0');
  // small plaque above the shelf
  disc(5.75, 1.95, wallZ + 0.01, 0.07, '#4a5f86', 0, '#3a2a1a');

  // light switches
  box(g, 0.01, 0.12, 0.08, color('#f4f1e8', 0.6), 5.36, 1.12, 1.4, { shadow: false });
  box(g, 0.08, 0.12, 0.01, color('#f4f1e8', 0.6), 5.95, 1.12, wallZ + 0.01, { shadow: false });
  return g;
}
