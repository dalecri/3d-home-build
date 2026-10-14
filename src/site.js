// Lot context: Labelle QC waterfront lot (4,023.5 m², 66 m frontage on the road to the north,
// ~91 m of shoreline to the south). House frame origin = NW corner of the house footprint.
import * as THREE from 'three';
import { box, cyl, color, mat, walkables, addCollider } from './lib.js';
import { group } from './furniture.js';
import { tex } from './textures.js';
import { adirondack } from './shell.js';

export const LAKE_Y = -6.2;
export const ROAD_Z = -27;

function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function shoreZ(x) { return 29 + Math.sin(x / 11) * 3 + Math.sin(x / 4.3) * 0.8; }

// Ground height. Flat-ish clearing around the house at y ~ -0.6 (house floor sits ~0.6 m up on
// the road side), falling away south of the house toward the lake; gentle rise to the road.
export function groundY(x, z) {
  let h = -0.6;
  h += Math.max(0, -z - 4) * 0.03; // rise to road
  h -= smooth(4.5, 14, z) * 2.8; // the bank behind the deck
  h -= Math.max(0, z - 12) * 0.17; // slope to the water
  h += (vnoise(x * 0.15, z * 0.15) - 0.5) * 0.6 * smooth(-1, 6, Math.abs(x - 6) + Math.max(0, z - 10));
  const sz = shoreZ(x);
  if (z > sz - 1) h = Math.min(h, LAKE_Y + 0.2 - (z - sz + 1) * 0.4);
  return h;
}

export function buildSite(root, renderer) {
  const g = new THREE.Group(); g.name = 'site'; root.add(g);

  // ---- terrain ----
  const size = 220, seg = 180;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  const colors = [];
  const cGrass = new THREE.Color('#7aa64a'), cForest = new THREE.Color('#4a6a2c'), cDirt = new THREE.Color('#a99070'), cSand = new THREE.Color('#b8a27a');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + 6, z = p.getZ(i) + 5;
    p.setX(i, x); p.setZ(i, z);
    const y = groundY(x, z); p.setY(i, y);
    uv.setXY(i, x / 3, z / 3);
    const clear = clearing(x, z);
    const c = cForest.clone().lerp(cGrass, clear);
    if (inDriveway(x, z)) c.lerp(cDirt, 0.8);
    if (z > shoreZ(x) - 2.5) c.lerp(cSand, 0.6);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const tm = mat('grass').clone(); tm.vertexColors = true; tm.color = new THREE.Color('#ffffff');
  const terrain = new THREE.Mesh(geo, tm); terrain.receiveShadow = true; terrain.name = 'terrain';
  g.add(terrain); walkables.push(terrain);

  // ---- lake ----
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), new THREE.MeshStandardMaterial({ color: '#3c6f86', roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.92 }));
  water.rotation.x = -Math.PI / 2; water.position.set(6, LAKE_Y, 120); g.add(water);
  // far shore hills
  for (let i = 0; i < 9; i++) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(40 + (i % 3) * 12, 20, 10), color('#3f6234', 1));
    hill.scale.y = 0.35; hill.position.set(-120 + i * 32, LAKE_Y - 4, 175 + (i % 2) * 15); g.add(hill);
  }
  // dock at the shore below the house
  const dz = shoreZ(2) - 0.5;
  box(g, 1.4, 0.08, 7, 'deck', 2, LAKE_Y + 0.35, dz + 3, { walk: true });

  // ---- road (chemin des Colibris) + gravel driveway ----
  const road = new THREE.Mesh(new THREE.PlaneGeometry(300, 6.5), color('#4a4a48', 0.95));
  road.rotation.x = -Math.PI / 2; road.position.set(6, groundY(6, ROAD_Z) + 0.03, ROAD_Z); road.receiveShadow = true; g.add(road);

  buildChalet(g);
  buildShed(g);
  buildPatio(g);
  buildTrees(g);
  buildShrubs(g);
  return g;
}

function clearing(x, z) {
  // 0 = forest floor, 1 = mown clearing
  const house = 1 - smooth(9, 16, Math.hypot((x - 6.5) / 1.5, (z - 1) / 1.1));
  const front = 1 - smooth(10, 16, Math.hypot((x - 6) / 1.2, (z + 14) / 1.1));
  const shed = 1 - smooth(6, 11, Math.hypot(x + 14, z - 18));
  return Math.min(1, Math.max(house, front, shed));
}
function inDriveway(x, z) { return z < -4 && z > ROAD_Z && Math.abs(x - 6.5 - Math.sin(z / 6) * 1.2) < 2.2; }

// Guest chalet "petit chalet d'invité 3 saisons" (photo 10): pale aqua lap siding,
// brown gable roof, white door with window, front window, small deck with a bistro set.
function buildChalet(root) {
  const cx = 2.5, cz = -16, y = groundY(cx, cz) + 0.15;
  const g = group(root, cx, cz, 0, y);
  const m = new THREE.MeshStandardMaterial({ map: tex('siding', { base: '#c9e0dc' }), roughness: 0.8 }); m.userData.tile = 1;
  const w = 3.2, d = 3.6, h = 2.3;
  box(g, w, h, d, m, 0, 0, 0, { collide: true });
  addCollider(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, y, y + 2);
  // gable roof (ridge along z)
  const rm = color('#5a3424', 0.8);
  for (const s of [-1, 1]) { const r = box(g, w / 2 + 0.45, 0.06, d + 0.5, rm, s * (w / 4 + 0.1), h + 0.42, 0); r.rotation.z = -s * 0.5; }
  const tri = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, 0.85)].map((v) => v));
  for (const s of [-1, 1]) { const gm = new THREE.Mesh(new THREE.ShapeGeometry(tri), m); gm.position.set(0, h, s * d / 2 + s * 0.001); if (s < 0) gm.rotation.y = Math.PI; g.add(gm); }
  // front (south, facing the house) door + window
  box(g, 0.8, 2.0, 0.05, mat('doorWhite'), 0.75, 0.0, d / 2 + 0.02);
  box(g, 0.5, 0.75, 0.01, color('#e7e2c8', 0.4), 0.75, 1.05, d / 2 + 0.05);
  box(g, 1.3, 0.95, 0.03, color('#5a3424', 0.6), -0.65, 0.95, d / 2 + 0.02);
  box(g, 1.15, 0.8, 0.01, mat('glass'), -0.65, 1.02, d / 2 + 0.04);
  // deck + bistro set
  box(g, w + 0.4, 0.08, 1.2, 'deck', 0, -0.08, d / 2 + 0.6, { walk: true });
  const blk = color('#1e1e1e', 0.5, { metalness: 0.6 });
  cyl(g, 0.3, 0.3, 0.02, blk, -0.6, 0.72, d / 2 + 0.6);
  cyl(g, 0.02, 0.02, 0.72, blk, -0.6, 0, d / 2 + 0.6, 6);
  for (const s of [-1, 1]) { box(g, 0.4, 0.03, 0.4, blk, -0.6 + s * 0.55, 0.45, d / 2 + 0.6); box(g, 0.4, 0.5, 0.03, blk, -0.6 + s * 0.55, 0.47, d / 2 + 0.4); }
  // metal stovepipe
  cyl(g, 0.06, 0.06, 1.6, color('#555', 0.4, { metalness: 0.7 }), w / 2 - 0.4, h + 0.2, -0.6, 10);
  // trellis panel beside the chalet
  const tr = group(root, cx - 6.5, cz + 1.5, 0, groundY(cx - 6.5, cz + 1.5));
  for (let i = 0; i < 7; i++) { box(tr, 0.03, 1.8, 0.03, color('#4a3020', 0.8), -0.45 + i * 0.15, 0, 0); box(tr, 0.95, 0.03, 0.03, color('#4a3020', 0.8), 0, 0.2 + i * 0.25, 0); }
}
// Shed by the water (photo 11): white door with blue trim, lattice skirt, covered in dry vines;
// raised garden enclosure and a flowering crabapple next to it.
function buildShed(root) {
  const cx = -14, cz = 18.5, y = groundY(cx, cz);
  const g = group(root, cx, cz, 0.5, y);
  const w = 2.6, d = 3.2, h = 2.1;
  box(g, w, h, d, color('#e9ecea', 0.8), 0, 0, 0, { collide: false });
  addCollider(cx - 1.8, cx + 1.8, cz - 1.8, cz + 1.8, y, y + 2);
  box(g, 0.85, 1.9, 0.04, mat('doorWhite'), 0, 0, -d / 2 - 0.02);
  for (const s of [-1, 1]) box(g, 0.08, 2.0, 0.05, mat('trimBlue'), s * 0.47, 0, -d / 2 - 0.03);
  const rm = color('#7d97a8', 0.8);
  for (const s of [-1, 1]) { const r = box(g, w / 2 + 0.3, 0.05, d + 0.3, rm, s * (w / 4 + 0.05), h + 0.25, 0); r.rotation.z = -s * 0.45; }
  // vine mass
  const vine = color('#7a5a45', 1);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.5 + (i % 4) * 0.12, 8, 6), vine);
    const px = Math.cos(a) * w * 0.55, pz = Math.sin(a) * d * 0.55;
    if (pz < -d / 2 + 0.1 && Math.abs(px) < 0.6) continue;
    s.position.set(px, 0.6 + (i % 5) * 0.35, pz); s.scale.set(0.8, 1.2, 0.5); g.add(s);
  }
  box(g, 1.0, 0.08, 0.6, 'deckWood', 0, 0, -d / 2 - 0.35);
  // garden enclosure
  const ge = group(root, cx + 6, cz - 2, 0.2, groundY(cx + 6, cz - 2));
  box(ge, 3.2, 0.3, 2.4, color('#7a5a3a', 0.9), 0, 0, 0);
  for (const [px, pz] of [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2], [0, -1.2], [0, 1.2]]) box(ge, 0.06, 1.6, 0.06, color('#6a4a30', 0.9), px, 0, pz);
  const mesh = new THREE.MeshStandardMaterial({ color: '#888', transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false });
  for (const s of [-1, 1]) { box(ge, 3.2, 1.3, 0.01, mesh, 0, 0.3, s * 1.2, { shadow: false }); box(ge, 0.01, 1.3, 2.4, mesh, s * 1.6, 0.3, 0, { shadow: false }); }
  // crabapple in bloom
  tree(root, cx + 8, cz + 3, 'crab', 6);
}

// Patio (photo 12): square concrete pavers, rusted lattice fire pit, old outdoor fireplace with
// a stovepipe, wood bench, stacked teal Adirondack chairs. North-east of the house.
function buildPatio(root) {
  const cx = 17, cz = -4.5, y = groundY(cx, cz) + 0.02;
  const g = group(root, cx, cz, -0.15, y);
  const pv = new THREE.Mesh(new THREE.CircleGeometry(3.2, 10), mat('pavers'));
  pv.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * 5.3; });
  pv.rotation.x = -Math.PI / 2; pv.scale.set(1.2, 1, 1); pv.receiveShadow = true; pv.position.y = 0.01; g.add(pv); walkables.push(pv);
  // fire pit
  const fp = color('#8a4a2a', 0.7, { metalness: 0.4 });
  box(g, 0.9, 0.45, 0.9, fp, 0, 0, 0);
  const lid = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.35, 4), fp); lid.rotation.y = Math.PI / 4; lid.position.y = 0.62; g.add(lid);
  // outdoor fireplace + stovepipe
  box(g, 1.3, 0.9, 0.8, color('#6a6f6a', 0.9), -1.2, 0, 2.6, { collide: false });
  box(g, 1.4, 0.12, 0.9, color('#555a55', 0.8), -1.2, 0.9, 2.6);
  cyl(g, 0.09, 0.09, 1.9, color('#3a3a3a', 0.5, { metalness: 0.5 }), -1.2, 1.0, 2.6, 10);
  // low concrete wall + bench
  box(g, 1.6, 0.35, 0.25, color('#a6a49a', 0.9), 0.1, 0, 2.9);
  const bench = color('#7a5034', 0.8);
  box(g, 2.0, 0.06, 0.7, bench, 1.9, 0.75, 2.6);
  box(g, 2.0, 0.7, 0.06, bench, 1.9, 0.05, 2.9);
  for (const s of [-1, 1]) box(g, 0.06, 0.75, 0.6, bench, 1.9 + s * 0.95, 0, 2.6);
  adirondack(g, 3.1, 1.8, Math.PI + 0.3, '#18a7a0');
  adirondack(g, 3.1, 1.75, Math.PI + 0.3, '#18a7a0').position.y = 0.08;
  // planters
  cyl(g, 0.25, 0.2, 0.3, color('#e8e6e0', 0.6), -2.6, 0, -0.2);
  box(g, 0.5, 0.35, 0.5, color('#8a6a48', 0.8), -3.2, 0, 0.5);
}

// ---------- trees ----------
const treeMats = {};
function tm(key, hex, r = 0.9) { return treeMats[key] ??= color(hex, r); }
export function tree(root, x, z, kind, h) {
  const y = groundY(x, z);
  const g = group(root, x, z, hash(x, z) * 6, y);
  if (kind === 'spruce') {
    cyl(g, 0.08 * h / 12, 0.22 * h / 12, h * 0.5, tm('bark', '#4a3a2c'), 0, 0, 0, 6);
    const layers = 6;
    for (let i = 0; i < layers; i++) {
      const t = i / layers, r = (1 - t) * h * 0.2 + 0.4;
      const c = new THREE.Mesh(new THREE.ConeGeometry(r, h * 0.28, 7), tm('spr' + (i % 2), i % 2 ? '#2f5a2e' : '#284f2a'));
      c.position.y = h * 0.28 + t * h * 0.62; c.castShadow = true; g.add(c);
    }
  } else if (kind === 'pine') {
    cyl(g, 0.12, 0.2, h * 0.85, tm('pbark', '#6b4a32'), 0, 0, 0, 6);
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 + (i % 2) * 0.5, 0), tm('pine', '#3b6a35'));
      s.position.set(Math.cos(i * 2.1) * 1.0, h * (0.62 + i * 0.1), Math.sin(i * 2.1) * 1.0); s.scale.y = 0.6; s.castShadow = true; g.add(s);
    }
  } else if (kind === 'birch') {
    const trunk = cyl(g, 0.1, 0.15, h * 0.85, tm('birch', '#e8e6df', 0.7), 0, 0, 0, 8);
    for (let i = 0; i < 6; i++) { const m = box(g, 0.2, 0.04, 0.21, tm('bmark', '#2a2a2a'), 0, 0.5 + i * h * 0.12, 0, { shadow: false }); m.rotation.y = i; }
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0 + (i % 3) * 0.4, 1), tm('bleaf' + (i % 2), i % 2 ? '#7fb24a' : '#6aa040'));
      s.position.set(Math.cos(i * 1.7) * 1.1, h * (0.6 + (i % 3) * 0.12), Math.sin(i * 1.7) * 1.1); s.castShadow = true; g.add(s);
    }
  } else if (kind === 'crab') {
    cyl(g, 0.14, 0.2, h * 0.45, tm('cbark', '#4a3a30'), 0, 0, 0, 6);
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1 + (i % 3) * 0.3, 1), tm('crab' + (i % 3), ['#c0447a', '#6a9a40', '#d0608f'][i % 3]));
      s.position.set(Math.cos(i * 1.3) * 1.6, h * 0.55 + (i % 3) * 0.5, Math.sin(i * 1.3) * 1.6); s.castShadow = true; g.add(s);
    }
  } else {
    cyl(g, 0.12, 0.2, h * 0.6, tm('dbark', '#5a4a3a'), 0, 0, 0, 6);
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3 + (i % 3) * 0.5, 1), tm('dleaf' + (i % 3), ['#5f9a3a', '#4f8a32', '#78ad48'][i % 3]));
      s.position.set(Math.cos(i * 2.2) * 1.3, h * 0.55 + (i % 3) * 0.8, Math.sin(i * 2.2) * 1.3); s.castShadow = true; g.add(s);
    }
  }
  return g;
}

function buildTrees(g) {
  let n = 0;
  const keep = (x, z) => {
    if (z > shoreZ(x) - 1.5) return false;
    if (inDriveway(x, z) || Math.abs(z - ROAD_Z) < 5) return false;
    if (x > -4.5 && x < 15 && z > -4 && z < 11) return false; // house + deck
    if (Math.hypot(x - 2.5, z + 16) < 4) return false; // chalet
    if (Math.hypot(x - 17, z + 4.5) < 5) return false; // patio
    if (Math.hypot(x + 14, z - 18.5) < 4) return false; // shed
    return clearing(x, z) < 0.35 || hash(x * 3, z * 7) > 0.93;
  };
  for (let i = 0; i < 2200 && n < 420; i++) {
    const x = -70 + hash(i, 1) * 150, z = -50 + hash(i, 2) * 85;
    if (!keep(x, z)) continue;
    const r = hash(i, 3);
    const kind = r < 0.38 ? 'spruce' : r < 0.6 ? 'birch' : r < 0.72 ? 'pine' : 'decid';
    tree(g, x, z, kind, 10 + hash(i, 4) * 12);
    n++;
  }
  // signature birches beside the front door (photo 1)
  tree(g, 11.6, -4.2, 'birch', 14);
  tree(g, 12.4, -3.4, 'birch', 12);
  // trees right below the deck so the balcony view is "in the canopy" (photo 15)
  for (const [x, z, k, h] of [[-1, 11.5, 'spruce', 16], [3, 12.5, 'pine', 17], [6.5, 11.8, 'birch', 15], [9.5, 12.8, 'decid', 14], [-4, 13.5, 'birch', 16], [12, 11, 'spruce', 15]]) tree(g, x, z, k, h);
}

function buildShrubs(g) {
  const m1 = color('#5f9a3a', 0.9), m2 = color('#4a8a35', 0.9);
  const put = (x, z, s, m) => { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), m); b.position.set(x, groundY(x, z) + s * 0.5, z); b.scale.y = 0.7; b.castShadow = true; g.add(b); };
  // foundation shrubs along the front (photo 1)
  for (let x = 5.6; x < 8.6; x += 0.7) put(x, -2.6 + Math.sin(x) * 0.2, 0.75, m1);
  for (let x = 2.0; x < 5.0; x += 0.8) put(x, -1.0, 0.6, m2);
  put(10.2, -2.6, 0.8, m1); put(11.8, -2.3, 0.7, m2);
  // daylilies
  for (let i = 0; i < 10; i++) put(12.5 + (i % 5) * 0.4, -2.0 - Math.floor(i / 5) * 0.5, 0.35, m2);
}
