// Kitchen (photo 20 + right side of 25): galley along the east wall (window onto the screened
// porch) with terracotta tile top, grey-green cabinets with brass cup pulls, white dishwasher,
// grey island with butcher-block top, white fridge beside the sage closet door.
import * as THREE from 'three';
import { box, color, mat, cyl } from '../lib.js';
import { tex } from '../textures.js';
import { plant } from '../furniture.js';

export function build(root) {
  const g = new THREE.Group(); g.name = 'kitchen'; root.add(g);
  const cab = color('#b9bfb4', 0.55);
  const tile = new THREE.MeshStandardMaterial({ map: tex('tile'), roughness: 0.5 }); tile.userData.tile = 0.4;
  const butcher = new THREE.MeshStandardMaterial({ map: tex('butcher'), roughness: 0.5 }); butcher.userData.tile = 0.6;
  const splash = new THREE.MeshStandardMaterial({ map: tex('vboard', { base: '#a24f35', boards: 10 }), roughness: 0.6 }); splash.userData.tile = 0.6;
  // east counter run against x = 9.55 (z 0.2 .. 2.2); front faces west (-x)
  const fx = 8.95; // cabinet front plane
  box(g, 0.6, 0.86, 2.0, cab, 9.25, 0.0, 1.2, { collide: true });
  box(g, 0.64, 0.04, 2.05, tile, 9.23, 0.86, 1.2);
  box(g, 0.02, 0.4, 2.05, splash, 9.54, 0.9, 1.2, { shadow: false });
  for (let i = 0; i < 3; i++) {
    const z = 0.42 + i * 0.36;
    box(g, 0.01, 0.2, 0.32, color('#c3c9be', 0.5), fx - 0.005, 0.6, z, { shadow: false });
    box(g, 0.01, 0.42, 0.32, color('#c3c9be', 0.5), fx - 0.005, 0.1, z, { shadow: false });
    const pull = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('brass'));
    pull.rotation.z = Math.PI / 2; pull.position.set(fx - 0.02, 0.7, z); g.add(pull);
  }
  // white dishwasher at the south end
  box(g, 0.02, 0.82, 0.6, mat('appliance'), fx - 0.005, 0.04, 1.85, { shadow: false });
  box(g, 0.02, 0.06, 0.5, color('#ddd', 0.3), fx - 0.015, 0.72, 1.85, { shadow: false });
  // sink + pull-down faucet under the window
  box(g, 0.45, 0.02, 0.7, mat('steel'), 9.22, 0.89, 0.8, { shadow: false });
  cyl(g, 0.015, 0.015, 0.32, mat('chrome'), 9.45, 0.9, 0.65, 8);
  const sp = box(g, 0.25, 0.025, 0.03, mat('chrome'), 9.35, 1.2, 0.65, { shadow: false }); sp.rotation.z = -0.4;
  // window valance
  box(g, 0.04, 0.3, 1.75, color('#f4f2e4', 0.9), 9.5, 1.95, 1.17, { shadow: false });
  // island: grey base, butcher-block top, long axis north-south
  box(g, 0.6, 0.86, 1.0, color('#c8ccc6', 0.55), 7.95, 0, 1.8, { collide: true });
  box(g, 0.7, 0.05, 1.1, butcher, 7.95, 0.86, 1.8);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.17, 24), color('#b06a35', 0.5)); bowl.position.set(7.95, 1.0, 2.0); g.add(bowl);
  // fridge against the west partition, beside the closet door (faces east)
  box(g, 0.72, 1.72, 0.75, mat('appliance'), 7.24, 0, 1.6, { collide: true });
  box(g, 0.03, 0.5, 0.02, color('#ccc', 0.3), 7.61, 0.95, 1.3, { shadow: false });
  box(g, 0.4, 0.55, 0.75, color('#a9c2a4', 0.55), 7.1, 1.82, 1.6);
  // short counter + sage uppers along the north wall
  box(g, 1.05, 0.86, 0.6, color('#a9c2a4', 0.55), 8.35, 0, 0.45, { collide: true });
  box(g, 1.07, 0.04, 0.62, butcher, 8.35, 0.86, 0.45);
  box(g, 1.05, 0.7, 0.33, color('#a9c2a4', 0.55), 8.35, 1.5, 0.32);
  box(g, 0.25, 0.3, 0.2, color('#333', 0.4), 8.1, 0.9, 0.35);
  plant(g, 9.35, 0.9, 2.05, { s: 0.8 });
  return g;
}
