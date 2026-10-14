// Dinette (photo 25): retro chrome set with coral/cream chairs, glass table,
// stained-glass drum pendant, wall mirror + whatnot shelf over olive wainscot.
import * as THREE from 'three';
import { box, color } from '../lib.js';
import { glassTable, dinetteChair, tiffanyPendant, mirror, group } from '../furniture.js';

export function build(root) {
  const g = new THREE.Group(); g.name = 'dinette'; root.add(g);
  const cx = 5.75, cz = 1.55;
  glassTable(g, cx, cz, { r: 0.5 });
  dinetteChair(g, cx - 0.55, cz, Math.PI / 2);
  dinetteChair(g, cx + 0.55, cz, -Math.PI / 2);
  dinetteChair(g, cx, cz - 0.55, 0);
  dinetteChair(g, cx, cz + 0.55, Math.PI);
  tiffanyPendant(g, cx, cz, 2.4);
  // rectangular wood-framed wall mirror on the north wall
  mirror(g, 5.8, 1.85, 0.16, 's', { w: 1.1, h: 0.75, frame: '#6b4022', round: false });
  // carved whatnot shelf
  const sh = group(g, 4.95, 0.17, 0, 1.0);
  for (let i = 0; i < 3; i++) box(sh, 0.24 - i * 0.04, 0.02, 0.1, color('#8a4a22', 0.5), 0, i * 0.22, 0.05);
  box(sh, 0.05, 0.62, 0.02, color('#8a4a22', 0.5), 0, 0, 0.01);
  // decorative plates
  for (const [x, y, c] of [[4.95, 1.55, '#3a5a2a'], [6.6, 1.7, '#d9c58a']]) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), color(c, 0.5)); p.position.set(x, y, 0.16); g.add(p);
  }
  return g;
}
