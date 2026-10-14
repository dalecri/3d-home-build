// Bathroom: NOT in the photos supplied so far. Neutral placeholder fixtures only.
import * as THREE from 'three';
import { box, color, mat } from '../lib.js';

export function build(root) {
  const g = new THREE.Group(); g.name = 'bath'; root.add(g);
  box(g, 1.5, 0.55, 0.75, mat('white'), 11.7, 0, 5.45, { collide: true }); // tub
  box(g, 0.8, 0.85, 0.5, color("#cfc6b4", 0.6), 9.0, 0, 5.55, { collide: true }); // vanity
  box(g, 0.4, 0.4, 0.6, mat('white'), 12.1, 0, 3.6, { collide: true }); // toilet
  box(g, 0.4, 0.4, 0.18, mat('white'), 12.25, 0.4, 3.6);
  return g;
}
