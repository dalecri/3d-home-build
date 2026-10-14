// Kitchen (photo 20 + right side of 25): galley along the east wall (window onto the screened
// porch) with terracotta tile top, grey cabinets with bronze cup pulls, white dishwasher,
// small grey kitchen cart with butcher-block top, white fridge beside the sage uppers.
import * as THREE from 'three';
import { box, color, mat, cyl } from '../lib.js';
import { tex } from '../textures.js';
import { plant } from '../furniture.js';

export function build(root) {
  const g = new THREE.Group(); g.name = 'kitchen'; root.add(g);
  const cab = color('#a2a79f', 0.65);
  const cabDoor = color('#adb2aa', 0.6);
  const seam = color('#6e736b', 0.8);
  const tile = new THREE.MeshStandardMaterial({ map: tex('tile', { base: '#a4583f' }), roughness: 0.45 }); tile.userData.tile = 0.3;
  const tileEdge = color('#8f4a35', 0.5);
  const butcher = new THREE.MeshStandardMaterial({ map: tex('butcher'), roughness: 0.5 }); butcher.userData.tile = 0.6;
  const splash = new THREE.MeshStandardMaterial({ map: tex('vboard', { base: '#a8553c', boards: 12 }), roughness: 0.6 }); splash.userData.tile = 0.5;
  const bronze = color('#8a6a45', 0.35, { metalness: 0.7 });
  const sage = color('#a9c2a4', 0.55);

  // ---- east counter run against x = 9.55 (z 0.15 .. 2.9); fronts face west (-x) ----
  const z0 = 0.15, z1 = 2.9, depth = 0.6, back = 9.55, fx = back - depth; // fx = cabinet front plane
  box(g, depth - 0.06, 0.1, z1 - z0, color('#3d3a36', 0.9), back - (depth + 0.06) / 2 - 0.0, 0, (z0 + z1) / 2, { shadow: false }); // toe kick
  box(g, depth - 0.02, 0.76, z1 - z0, cab, back - depth / 2 + 0.01, 0.1, (z0 + z1) / 2, { collide: true });
  box(g, depth + 0.05, 0.035, z1 - z0 + 0.02, tile, back - (depth + 0.05) / 2, 0.865, (z0 + z1) / 2);
  box(g, 0.035, 0.05, z1 - z0 + 0.02, tileEdge, back - depth - 0.05, 0.85, (z0 + z1) / 2, { shadow: false }); // bullnose
  box(g, 0.02, 0.32, z1 - z0, splash, back - 0.01, 0.9, (z0 + z1) / 2, { shadow: false });
  const front = (w, h, y, z, m = cabDoor) => box(g, 0.02, h, w, m, fx - 0.01, y, z, { shadow: false });
  // north end: plain double-door base (z 0.15..0.85)
  for (const z of [0.33, 0.67]) { front(0.32, 0.74, 0.12, z); box(g, 0.02, 0.018, 0.1, mat('chrome'), fx - 0.03, 0.72, z + (z < 0.5 ? 0.1 : -0.1), { shadow: false }); }
  // drawer stack (z 0.87..1.43): three drawers with bronze cup pulls
  const cup = (y, z) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 12, 1, true, 0, Math.PI), bronze);
    p.rotation.z = Math.PI / 2; p.rotation.y = Math.PI / 2; p.position.set(fx - 0.035, y, z); g.add(p);
    box(g, 0.02, 0.012, 0.09, bronze, fx - 0.03, y + 0.02, z, { shadow: false });
  };
  for (const [y, h] of [[0.12, 0.26], [0.4, 0.22], [0.64, 0.2]]) { front(0.54, h, y, 1.15); cup(y + h * 0.6, 1.15); }
  // sink base: pair of doors (z 1.45..2.07) with bar pulls near the top
  for (const z of [1.61, 1.91]) {
    front(0.29, 0.72, 0.12, z);
    box(g, 0.02, 0.018, 0.1, mat('chrome'), fx - 0.03, 0.72, z + (z < 1.75 ? 0.08 : -0.08), { shadow: false });
  }
  // white dishwasher (z 2.09..2.69), slightly proud of the cabinets
  box(g, 0.04, 0.8, 0.6, mat('appliance'), fx - 0.02, 0.06, 2.39, { shadow: false });
  box(g, 0.05, 0.14, 0.58, color('#e4e4e2', 0.35), fx - 0.03, 0.7, 2.39, { shadow: false });
  box(g, 0.02, 0.025, 0.4, color('#cfcfcf', 0.3, { metalness: 0.5 }), fx - 0.065, 0.66, 2.39, { shadow: false });
  box(g, 0.02, 0.06, 0.6, color('#d7d7d5', 0.4), fx - 0.03, 0.04, 2.39, { shadow: false }); // kick plate
  // narrow end cabinet
  front(0.18, 0.74, 0.12, 2.8);
  for (const z of [0.85, 1.44, 2.08, 2.7]) box(g, 0.025, 0.76, 0.012, seam, fx - 0.01, 0.1, z, { shadow: false });

  // ---- double sink + pull-down faucet under the window ----
  const sinkZ = 1.75;
  box(g, 0.42, 0.012, 0.78, mat('steel'), 9.22, 0.895, sinkZ, { shadow: false });
  for (const dz of [-0.2, 0.2]) box(g, 0.34, 0.01, 0.34, color('#8d9093', 0.3, { metalness: 0.8 }), 9.22, 0.9, sinkZ + dz, { shadow: false });
  cyl(g, 0.018, 0.022, 0.3, mat('chrome'), 9.47, 0.9, sinkZ - 0.1, 10);
  const sp = box(g, 0.3, 0.03, 0.035, mat('chrome'), 9.36, 1.18, sinkZ - 0.08, { shadow: false }); sp.rotation.z = -0.55;
  cyl(g, 0.012, 0.012, 0.12, mat('chrome'), 9.48, 0.9, sinkZ + 0.22, 8);

  // ---- window valance: gathered cream sheer across the top of the sink window ----
  const sheer = color('#f3f1dc', 0.95, { side: THREE.DoubleSide });
  box(g, 0.02, 0.02, 1.45, mat('chrome'), 9.5, 2.07, 1.65, { shadow: false }); // rod
  for (let z = 0.95; z < 2.36; z += 0.06) {
    const h = 0.4 + 0.07 * Math.sin(z * 11);
    const pleat = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, h, 6, 1, true), sheer);
    pleat.position.set(9.47, 2.09 - h / 2, z); g.add(pleat);
  }
  // café curtain tier, short, at the near end only (photo 20 shows it at the left edge)
  for (let z = 0.95; z < 1.4; z += 0.06) {
    const pleat = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.5, 6, 1, true), sheer);
    pleat.position.set(9.48, 1.4, z); g.add(pleat);
  }
  // counter clutter: little string-light garland on the backsplash + dish soap
  cyl(g, 0.03, 0.03, 0.18, color('#e9d27a', 0.3, { transparent: true, opacity: 0.8 }), 9.45, 0.9, 1.75, 10);

  // ---- kitchen cart / island: grey base, butcher-block top, long axis north-south ----
  const ix = 8.1, iz = 2.35;
  box(g, 0.5, 0.82, 0.62, color('#c3c7c1', 0.6), ix, 0.04, iz, { collide: true });
  box(g, 0.48, 0.04, 0.6, color('#5b5f59', 0.9), ix, 0, iz, { shadow: false });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.03, 0.82, 0.03, color('#d3d6d0', 0.5), ix + sx * 0.245, 0.04, iz + sz * 0.3, { shadow: false });
  box(g, 0.58, 0.05, 0.7, butcher, ix, 0.86, iz);
  // turned-wood bowl with bananas
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.15, 28), color('#b8703a', 0.55));
  bowl.position.set(ix, 0.985, iz - 0.12); g.add(bowl);
  for (let i = 0; i < 3; i++) box(g, 0.13, 0.03, 0.03, color('#e2b23a', 0.6), ix - 0.03 + i * 0.03, 1.06, iz - 0.12, { shadow: false }).rotation.y = 0.6 - i * 0.3;

  // ---- fridge against the west side (faces east), sage uppers above ----
  const frX = 7.24, frZ = 1.41;
  box(g, 0.72, 1.72, 0.75, mat('appliance'), frX, 0.02, frZ, { collide: true });
  box(g, 0.012, 0.012, 0.74, color('#cfcfcd', 0.5), frX + 0.36, 1.18, frZ, { shadow: false }); // freezer seam
  box(g, 0.03, 0.4, 0.025, color('#d8d8d6', 0.3), frX + 0.38, 1.3, frZ - 0.3, { shadow: false });
  box(g, 0.03, 0.55, 0.025, color('#d8d8d6', 0.3), frX + 0.38, 0.55, frZ - 0.3, { shadow: false });
  box(g, 0.4, 0.5, 0.78, sage, 7.08, 1.86, frZ);
  box(g, 0.02, 0.44, 0.012, color('#86a081', 0.6), 7.29, 1.89, frZ, { shadow: false });

  // short counter + sage uppers along the north wall
  box(g, 1.05, 0.86, 0.6, sage, 8.35, 0, 0.45, { collide: true });
  box(g, 1.07, 0.04, 0.62, butcher, 8.35, 0.86, 0.45);
  box(g, 1.05, 0.7, 0.33, sage, 8.35, 1.5, 0.32);
  box(g, 0.25, 0.3, 0.2, color('#333', 0.4), 8.1, 0.9, 0.35);
  

  // ---- white ceiling crown in the kitchen ----
  const crown = mat('trimWhite');
  box(g, 0.05, 0.05, z1 - z0 + 0.1, crown, 9.52, 2.35, (z0 + z1) / 2, { shadow: false });
  box(g, 2.7, 0.05, 0.05, crown, 8.2, 2.35, 2.92, { shadow: false });
  box(g, 0.05, 0.05, 1.8, crown, 6.88, 2.35, 2.05, { shadow: false });
  return g;
}
