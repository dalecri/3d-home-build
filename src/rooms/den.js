// Fireplace room (photos 20/28 background): corner sandstone-veneer fireplace with
// stepped mantel shelves, black insert, raised terracotta hearth; slider to the deck.
import * as THREE from 'three';
import { box, color, mat, addCollider } from '../lib.js';
import { tex } from '../textures.js';
import { rug, plant, dinetteChair, group } from '../furniture.js';

export function build(root) {
  const g = new THREE.Group(); g.name = 'den'; root.add(g);
  // fireplace in the north-east corner, angled 45 degrees to face south-west
  const fp = group(g, 7.65, 3.6, -Math.PI / 4);
  const stone = mat('stone');
  box(fp, 1.5, 0.22, 0.85, mat('hearthTile'), 0, 0, 0.15);
  box(fp, 1.3, 2.4, 0.6, stone, 0, 0, -0.1);
  box(fp, 0.72, 0.62, 0.05, mat('black'), 0, 0.3, 0.21);
  box(fp, 0.62, 0.42, 0.01, color('#2a1a10', 0.9, { emissive: '#ff6a20', emissiveIntensity: 0.0 }), 0, 0.36, 0.236);
  box(fp, 0.72, 0.08, 0.06, mat('brass'), 0, 0.85, 0.22);
  for (const [y, d, w] of [[1.22, 0.18, 1.45], [1.62, 0.12, 1.32], [1.95, 0.1, 1.3]]) box(fp, w, 0.05, 0.6 + d, color('#a24e2c', 0.55), 0, y, -0.1 + d / 2);
  addCollider(6.95, 8.2, 3.05, 4.3, 0, 2);
  // shag rug + plant by the slider
  rug(g, 6.5, 4.5, 0.2, 1.8, 1.2, tex('shag'));
  plant(g, 6.0, 0, 5.55, { s: 1.6 });
  return g;
}
