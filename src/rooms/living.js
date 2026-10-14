// Living room (photos 26 + 28): west end, lake side. Teal sofa under the west slider,
// blue damask armchair, teal oriental rug, wood + amber-glass chandelier, olive wainscot.
import * as THREE from 'three';
import { box, color, framedArt } from '../lib.js';
import { tex, picture } from '../textures.js';
import { sofa, armchair, coffeeTable, rug, chandelier, sheer, plant, mirror, cabinet, tableLamp, group } from '../furniture.js';

export function build(root) {
  const g = new THREE.Group(); g.name = 'living'; root.add(g);
  rug(g, 2.15, 4.55, 0, 3.4, 2.4, tex('rug'));
  sofa(g, 0.62, 4.95, Math.PI / 2, { len: 2.0, fabric: '#2f7471' });
  // southwestern throw on the sofa
  box(g, 0.75, 0.04, 1.3, color('#2f5c8a', 0.9), 0.6, 0.5, 5.0, { shadow: false });
  armchair(g, 3.85, 5.15, -Math.PI / 2 - 0.35, { fabric: '#2d5d8f' });
  armchair(g, 3.9, 3.85, -Math.PI / 2 + 0.25, { fabric: '#2d5d8f' });
  coffeeTable(g, 1.75, 4.85, Math.PI / 2, { w: 1.45, d: 0.55 });
  chandelier(g, 2.2, 4.55, 2.4);
  // sheers on the big lake window + west slider
  sheer(g, 0.45, 1.2, 5.78, 2.25, {}); sheer(g, 3.6, 4.3, 5.78, 2.25, {});
  box(g, 4.0, 0.025, 0.025, color('#222', 0.4, { metalness: 0.6 }), 2.4, 2.24, 5.75, { shadow: false });
  sheer(g, 4.2, 4.75, 0.24, 2.25, { side: 'e' }); sheer(g, 5.55, 5.95, 0.24, 2.25, { side: 'e' });
  // side table + arc lamp by the window corner
  box(g, 0.45, 0.6, 0.4, color('#3b2a1e', 0.6), 0.45, 0, 5.6);
  tableLamp(g, 0.45, 0.6, 5.6, { base: '#2a2a2a', shade: '#f0d9b5', h: 0.6 });
  // corner cabinet + hurricane lamp (north-west corner by the bedroom door)
  cabinet(g, 0.55, 3.35, Math.PI / 2, { w: 0.6, h: 0.75, d: 0.4, wood: '#b0702e' });
  tableLamp(g, 0.55, 0.84, 3.35, { base: '#f0e6c8', shade: '#f6e8c4', h: 0.45, light: 0.8 });
  plant(g, 1.0, 0, 3.4, { s: 1.4, leaf: '#4d8a3c' });
  // gothic arch mirror + round mirror + small frames on west wall
  const arch = group(g, 0.17, 3.15, Math.PI / 2, 1.0);
  box(arch, 0.5, 1.0, 0.04, color('#8a4a22', 0.5), 0, 0, 0);
  box(arch, 0.4, 0.9, 0.01, new THREE.MeshStandardMaterial({ color: '#b9c4c6', metalness: 1, roughness: 0.08 }), 0, 0.04, 0.025);
  mirror(g, 0.17, 1.55, 3.1, 'e', { w: 0.3, h: 0.3, frame: '#a87a3a' });
  framedArt(g, picture('sepia', 2), 0.25, 0.32, 0.17, 1.9, 4.2, 'e', '#2b1d12');
  framedArt(g, picture('sepia', 3), 0.25, 0.3, 0.17, 1.4, 4.2, 'e', '#2b1d12');
  framedArt(g, picture('sepia', 4), 0.36, 0.3, 0.17, 1.95, 5.95, 'e', '#2b1d12');
  // TV on a wrought-iron stand by the post (faces west)
  const tv = group(g, 4.35, 1.3, -Math.PI / 2);
  box(tv, 0.45, 0.75, 0.35, color('#2a2a2a', 0.5, { metalness: 0.5 }), 0, 0, 0);
  box(tv, 0.95, 0.56, 0.05, color('#0c0c0c', 0.3), 0, 0.78, 0);
  // wall hats + plate in the photo-28 corner (south wall, east of window)
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 24), color('#b06a45', 0.8));
  hat.rotation.x = Math.PI / 2; hat.position.set(4.42, 1.75, 5.83); g.add(hat);
  return g;
}
