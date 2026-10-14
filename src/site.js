// Lot context: Lot 5 224 498, Labelle QC waterfront lot (4,023.5 m², 66 m frontage on the road to the
// north, ~91 m of shoreline to the south). House frame origin = NW corner of the house footprint.
// Trees, shrubs, vines and ground cover are drawn with a handful of InstancedMeshes (phone friendly).
import * as THREE from 'three';
import { box, cyl, color, mat, walkables, addCollider, boxGeo } from './lib.js';
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
export function roadZ(x) { return ROAD_Z + Math.sin(x / 37) * 1.6; }
// gravel driveway centre line (road -> front of the house)
export function driveX(z) { return 6.6 + Math.sin(z / 6) * 1.1; }

// Key spots on the lot (world coords).
const CHALET = { x: -0.5, z: -14.5 };
const PATIO = { x: 17, z: -4.5, ry: -1.72 };
const SHED = { x: -14, z: 19.5, ry: 1.08 };
const PAD = { x: 7.2, z: -6.2, r: 3.6 }; // gravel turnaround in front of the porch

// Ground height. Flat-ish clearing around the house at y ~ -0.6 (house floor sits ~0.6 m up on
// the road side); a steep bank drops away behind the lake-side deck, then the lot slopes to the water.
export function groundY(x, z) {
  let h = -0.6;
  h += Math.max(0, -z - 4) * 0.03; // gentle rise to the road
  h -= smooth(5.5, 12.5, z) * 3.6; // the bank under the deck
  h -= Math.max(0, z - 12.5) * 0.11; // slope to the water
  h += smooth(-31, -75, z) * 7; // hill on the far side of the road
  const near = smooth(-1, 6, Math.abs(x - 6) + Math.max(0, z - 10));
  h += (vnoise(x * 0.15, z * 0.15) - 0.5) * 0.6 * near;
  const sz = shoreZ(x);
  const far = smooth(25, 55, Math.hypot(x - 6, z - 3)) * smooth(sz - 3, sz - 18, z);
  h += (vnoise(x * 0.035 + 7, z * 0.035 - 3) - 0.5) * 5 * far;
  if (z < sz - 1) h = Math.max(h, LAKE_Y + 0.12 + (sz - 1 - z) * 0.04);
  else h = Math.min(h, LAKE_Y + 0.2 - (z - sz + 1) * 0.4);
  return h;
}

// 0 = forest, 1 = open mown clearing
function clearing(x, z) {
  const hz = z < 0.5 ? (z - 0.5) / 1.0 : (z - 0.5) / 0.62;
  const house = 1 - smooth(10, 16, Math.hypot((x - 6.5) / 1.45, hz));
  const front = 1 - smooth(6, 10, Math.hypot((x - 7) / 1.25, z + 10));
  const drive = z < -3 && z > ROAD_Z - 2 ? 1 - smooth(3.5, 6, Math.abs(x - driveX(z))) : 0;
  const chalet = 1 - smooth(4.2, 7, Math.hypot(x - CHALET.x, (z - CHALET.z - 1.5) / 1.3));
  const patio = 1 - smooth(6.5, 10, Math.hypot(x - PATIO.x, z - PATIO.z));
  const shed = 1 - smooth(6.5, 10.5, Math.hypot(x - SHED.x + 1.5, z - SHED.z + 0.8));
  const road = 1 - smooth(5, 7.5, Math.abs(z - roadZ(x)));
  return Math.min(1, Math.max(house, front, drive, chalet, patio, shed, road));
}

// ---------- small canvas textures used only on the lot ----------
const texCache = {};
function ctex(key, w, h, draw, rep = true) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return (texCache[key] = t);
}
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const gravelTex = () => ctex('gravel', 256, 256, (c, w, h) => {
  const r = rnd(5); c.fillStyle = '#7d7468'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    const v = r(); c.fillStyle = v < 0.3 ? '#665e54' : v < 0.55 ? '#9a9184' : v < 0.75 ? '#7a6d5c' : v < 0.9 ? '#aca595' : '#4f4a43';
    c.beginPath(); c.ellipse(r() * w, r() * h, 0.8 + r() * 2.2, 0.8 + r() * 1.6, r() * 3, 0, 7); c.fill();
  }
});
const asphaltTex = () => ctex('asphalt', 256, 256, (c, w, h) => {
  const r = rnd(9); c.fillStyle = '#565654'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 12000; i++) { const v = r(); c.fillStyle = v < 0.5 ? '#4a4a49' : v < 0.85 ? '#61615f' : '#77756f'; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  c.globalAlpha = 0.25; c.fillStyle = '#3a3a39';
  for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(r() * w, r() * h, 10 + r() * 30, 6 + r() * 14, r() * 3, 0, 7); c.fill(); }
  c.globalAlpha = 1;
});
// diagonal lattice (alpha-tested): 1 repeat = 0.3 m
const latticeTex = (col) => ctex('lattice' + col, 128, 128, (c, w, h) => {
  c.clearRect(0, 0, w, h); c.strokeStyle = col; c.lineWidth = 20; c.lineCap = 'square';
  for (const s of [-1, 1]) for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * w - (s < 0 ? 0 : 0), s > 0 ? 0 : h); c.lineTo(k * w + w, s > 0 ? h : 0); c.stroke(); }
  c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2;
  for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * w + 14, 0); c.lineTo(k * w + w + 14, h); c.stroke(); }
});
// rusted steel fire pit sides with a criss-cross cut-out pattern
const fireTex = () => ctex('firepit', 128, 128, (c, w, h) => {
  const r = rnd(3); c.fillStyle = '#8a4426'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 1500; i++) { c.fillStyle = r() < 0.5 ? '#6a3018' : '#a65a30'; c.fillRect(r() * w, r() * h, 2, 2); }
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const cx = (i + 0.5) * w / 4, cy = (j + 0.5) * h / 4;
    c.beginPath(); c.moveTo(cx, cy - 12); c.lineTo(cx + 12, cy); c.lineTo(cx, cy + 12); c.lineTo(cx - 12, cy); c.closePath(); c.fill();
  }
  c.globalCompositeOperation = 'source-over';
});
const wireTex = () => ctex('wire', 64, 64, (c, w, h) => {
  c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(70,72,70,0.95)'; c.lineWidth = 3;
  c.strokeRect(1.5, 1.5, w - 3, h - 3);
});
const blockTex = () => ctex('blocks', 128, 64, (c, w, h) => {
  const r = rnd(11); c.fillStyle = '#8f8d86'; c.fillRect(0, 0, w, h);
  for (let j = 0; j < 2; j++) for (let i = -1; i < 2; i++) {
    c.fillStyle = `rgb(${160 + r() * 25 | 0},${158 + r() * 25 | 0},${150 + r() * 22 | 0})`;
    c.fillRect(i * 64 + (j % 2) * 32 + 2, j * 32 + 2, 60, 28);
  }
});

function cmat(o, tile = 1) { const m = new THREE.MeshStandardMaterial(o); m.userData.tile = tile; return m; }

// ---------- instanced scatter (trees, shrubs, vines, ground cover) ----------
const GEO = {
  trunk: new THREE.CylinderGeometry(0.65, 1, 1, 7).translate(0, 0.5, 0),
  cone: new THREE.ConeGeometry(1, 1, 9).translate(0, 0.5, 0),
  ico1: new THREE.IcosahedronGeometry(1, 1),
  ico0: new THREE.IcosahedronGeometry(1, 0),
  dodec: new THREE.DodecahedronGeometry(1, 0),
  cube: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
  blade: new THREE.ConeGeometry(0.5, 1, 3).translate(0, 0.5, 0),
};
class Scatter {
  constructor() { this.b = new Map(); this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); }
  add(geo, mk, x, y, z, sx, sy, sz, col, o = {}) {
    const key = geo + '|' + mk + '|' + (o.far ? 'f' : o.noShadow ? 'n' : 's');
    let b = this.b.get(key); if (!b) this.b.set(key, (b = { geo, mk, far: !!o.far, noShadow: !!o.noShadow, mats: [], cols: [] }));
    this._e.set(o.rx || 0, o.ry || 0, o.rz || 0);
    this._q.setFromEuler(this._e);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), this._q, new THREE.Vector3(sx, sy, sz));
    b.mats.push(m); b.cols.push(col instanceof THREE.Color ? col : new THREE.Color(col));
  }
  build(parent) {
    const mats = {
      bark: cmat({ roughness: 0.95 }),
      leaf: cmat({ roughness: 0.85, flatShading: true }),
      soft: cmat({ roughness: 0.9 }),
      stone: cmat({ roughness: 0.95, flatShading: true }),
    };
    let n = 0;
    for (const b of this.b.values()) {
      const im = new THREE.InstancedMesh(GEO[b.geo], mats[b.mk], b.mats.length);
      b.mats.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, b.cols[i]); });
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
      im.castShadow = !b.far && !b.noShadow; im.receiveShadow = !b.far;
      parent.add(im); n += b.mats.length;
    }
    return n;
  }
}
const jit = (hex, amt, seed) => { const c = new THREE.Color(hex); const k = 1 + (hash(seed, 7.3) - 0.5) * amt; c.multiplyScalar(k); c.offsetHSL((hash(seed, 3.1) - 0.5) * 0.03, 0, 0); return c; };

// ---------- trees ----------
function spruce(S, x, z, h, o = {}) {
  const y = groundY(x, z), s = x * 3.1 + z, far = o.far;
  S.add('trunk', 'bark', x, y, z, 0.1 + h * 0.012, h * 0.45, 0.1 + h * 0.012, jit('#4a3a2c', 0.3, s), o);
  const n = far ? 4 : 7;
  for (let i = 0; i < n; i++) {
    const t = i / n, ch = h * (far ? 0.42 : 0.3) * (1 - t * 0.45), r = h * 0.16 * (1 - t * 0.82) + 0.35;
    S.add('cone', 'leaf', x, y + h * (0.12 + t * (far ? 0.6 : 0.7)), z, r, ch, r, jit(i % 2 ? '#2d5530' : '#264a2b', 0.35, s + i), { ...o, ry: hash(s, i) * 3 });
  }
}
function pine(S, x, z, h, o = {}) {
  const y = groundY(x, z), s = x * 1.7 + z * 2.3;
  S.add('trunk', 'bark', x, y, z, 0.14 + h * 0.012, h * 0.82, 0.14 + h * 0.012, jit('#5e4535', 0.3, s), o);
  const n = o.far ? 3 : 6;
  for (let i = 0; i < n; i++) {
    const a = hash(s, i) * 6.3, d = 0.6 + hash(i, s) * 1.6, sc = 1.4 + hash(s + i, 2) * 1.4;
    S.add('ico0', 'leaf', x + Math.cos(a) * d, y + h * (0.55 + i / n * 0.42), z + Math.sin(a) * d, sc * 1.1, sc * 0.5, sc, jit('#35603a', 0.3, s + i), { ...o, ry: a });
  }
}
function birch(S, x, z, h, o = {}) {
  const y = groundY(x, z), s = x * 2.9 + z * 1.3;
  const lean = (hash(s, 1) - 0.5) * 0.08;
  S.add('trunk', 'bark', x, y, z, 0.11 + h * 0.004, h * 0.86, 0.11 + h * 0.004, jit('#eeece4', 0.08, s), { ...o, rz: lean });
  if (!o.far) for (let i = 0; i < 7; i++) {
    const yy = 0.6 + hash(s, i + 9) * h * 0.6;
    S.add('cube', 'bark', x - Math.sin(lean) * yy, y + yy, z, 0.26, 0.05 + hash(i, s) * 0.06, 0.2, '#2a2826', { ...o, ry: hash(s, i) * 3, noShadow: true });
  }
  const n = o.far ? 3 : 7;
  for (let i = 0; i < n; i++) {
    const a = i * 2.1 + s, d = 0.5 + hash(s, i + 3) * 1.1, sc = 0.9 + hash(s + i, 4) * 0.8;
    const yy = h * (0.58 + hash(i, s + 5) * 0.36);
    S.add(o.far ? 'ico0' : 'ico1', 'leaf', x - Math.sin(lean) * yy + Math.cos(a) * d, y + yy, z + Math.sin(a) * d, sc, sc * 1.25, sc, jit(i % 2 ? '#86b456' : '#74a648', 0.25, s + i), o);
  }
}
function maple(S, x, z, h, o = {}) {
  const y = groundY(x, z), s = x * 1.3 + z * 3.7;
  S.add('trunk', 'bark', x, y, z, 0.16 + h * 0.008, h * 0.62, 0.16 + h * 0.008, jit('#5b4a3c', 0.3, s), o);
  const n = o.far ? 3 : 7;
  for (let i = 0; i < n; i++) {
    const a = i * 2.4 + s, d = i === 0 ? 0 : 0.9 + hash(s, i) * 1.2, sc = 1.4 + hash(s + i, 6) * 1.0;
    S.add(o.far ? 'ico0' : 'ico1', 'leaf', x + Math.cos(a) * d, y + h * (0.6 + hash(i, s) * 0.3), z + Math.sin(a) * d, sc, sc * 0.85, sc, jit(['#5f9a3a', '#4f8a32', '#6ea444'][i % 3], 0.25, s + i), o);
  }
}
function crab(S, x, z, h = 5.5, o = {}) {
  const y = groundY(x, z), s = x + z * 5;
  S.add('trunk', 'bark', x, y, z, 0.2, h * 0.4, 0.2, '#4a3a30', o);
  for (const [bx, bz] of [[0.6, 0.2], [-0.5, 0.5], [0.1, -0.6]]) S.add('trunk', 'bark', x + bx * 0.3, y + h * 0.33, z + bz * 0.3, 0.08, h * 0.35, 0.08, '#4a3a30', { ...o, rx: bz * 0.9, rz: -bx * 0.9 });
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39 + s, d = Math.sqrt(hash(s, i)) * h * 0.42, sc = 0.55 + hash(i, s) * 0.55;
    const yy = h * 0.42 + hash(s + i, 1) * h * 0.5 - d * 0.25;
    const pink = hash(i, 9 + s) < 0.82;
    S.add('ico1', 'leaf', x + Math.cos(a) * d, y + yy, z + Math.sin(a) * d, sc * 1.2, sc, sc * 1.2, pink ? jit(['#d4569a', '#e27db4', '#c2367e'][i % 3], 0.15, s + i) : jit('#6a9a40', 0.2, i), o);
  }
}
function shrub(S, x, z, r, hex, o = {}) {
  const y = groundY(x, z), s = x * 7 + z;
  const n = o.n ?? 4;
  for (let i = 0; i < n; i++) {
    const a = i * 2.5 + s, d = r * 0.5 * hash(s, i), sc = r * (0.55 + hash(i, s) * 0.4);
    S.add(o.geo || 'ico1', 'leaf', x + Math.cos(a) * d, y + sc * 0.55, z + Math.sin(a) * d, sc, sc * (o.flat ?? 0.8), sc, jit(hex, 0.3, s + i), o);
  }
}
// strap-leaf clump (daylilies)
function lily(S, x, z, r = 0.45, flowers = false) {
  const y = groundY(x, z), s = x * 5 + z * 3;
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4 + s, tilt = 0.35 + hash(s, i) * 0.6;
    S.add('blade', 'soft', x + Math.cos(a) * r * 0.2, y, z + Math.sin(a) * r * 0.2, 0.09, r * (1.2 + hash(i, s) * 0.6), 0.03, jit('#4f8a34', 0.3, s + i), { rx: Math.sin(a) * tilt, rz: -Math.cos(a) * tilt, noShadow: true });
  }
  if (flowers) for (let i = 0; i < 5; i++) {
    const a = i * 1.3 + s;
    S.add('ico0', 'soft', x + Math.cos(a) * r * 0.5, y + r * 1.25, z + Math.sin(a) * r * 0.5, 0.07, 0.05, 0.07, '#e8762a', { noShadow: true });
  }
}

export function buildSite(root) {
  const g = new THREE.Group(); g.name = 'site'; root.add(g);
  const S = new Scatter();

  buildTerrain(g);
  buildWater(g);
  buildRoads(g);
  buildFrontYard(g, S);
  buildChalet(g, S);
  buildShed(g, S);
  buildPatio(g, S);
  buildForest(S);
  S.build(g);

  // Atmosphere: the near-ground fog reads as milky haze from the air; push it back with altitude.
  let scene = root; while (scene.parent) scene = scene.parent;
  if (scene.isScene && scene.fog) {
    const f = scene.fog, n0 = f.near, f0 = f.far, prev = scene.onBeforeRender;
    scene.onBeforeRender = function (r, s, cam, ...rest) {
      const h = Math.max(0, cam.position.y - 6);
      f.near = n0 + h * 3; f.far = f0 + h * 7;
      if (prev) prev.call(this, r, s, cam, ...rest);
    };
  }
  return g;
}

// ---------- terrain ----------
function buildTerrain(g) {
  const NX = 200, NZ = 170;
  const fx = (u) => 6 + 190 * (0.3 * u + 0.7 * u * u * u);
  const fz = (v) => 5 + 150 * (0.3 * v + 0.7 * v * v * v);
  const pos = [], uv = [], col = [], idx = [];
  const cLawn = new THREE.Color('#bcc58c'), cLawn2 = new THREE.Color('#a9b878'), cForest = new THREE.Color('#857a58'), cMoss = new THREE.Color('#7d8a55');
  const cDirt = new THREE.Color('#c9b593'), cSand = new THREE.Color('#b5a888'), cWet = new THREE.Color('#6d6a58');
  const c = new THREE.Color();
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
    const x = fx(-1 + 2 * i / NX), z = fz(-1 + 2 * j / NZ), y = groundY(x, z);
    pos.push(x, y, z); uv.push(x / 3, z / 3);
    const cl = clearing(x, z);
    c.copy(cForest).lerp(cMoss, vnoise(x * 0.2, z * 0.2));
    const lawn = cLawn.clone().lerp(cLawn2, vnoise(x * 0.5 + 3, z * 0.5));
    c.lerp(lawn, cl);
    // worn / bare patches in the clearing (photo 1: grass + dirt)
    const worn = smooth(0.62, 0.85, vnoise(x * 0.45 + 11, z * 0.45 - 4)) * cl;
    c.lerp(cDirt, worn * 0.55);
    const dd = Math.abs(x - driveX(z));
    if (z < -3 && z > ROAD_Z) c.lerp(cDirt, (1 - smooth(1.6, 3.4, dd)) * 0.7);
    c.lerp(cDirt, (1 - smooth(PAD.r - 0.5, PAD.r + 1.6, Math.hypot(x - PAD.x, z - PAD.z))) * 0.6);
    const sz = shoreZ(x);
    if (z > sz - 3) c.lerp(cSand, smooth(sz - 3, sz - 1, z) * 0.75);
    if (z > sz - 0.6) c.lerp(cWet, 0.6);
    col.push(c.r, c.g, c.b);
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i, b = a + 1, d = a + NX + 1, e = d + 1;
    idx.push(a, d, b, b, d, e);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const tm = mat('grass').clone(); tm.vertexColors = true; tm.color = new THREE.Color('#ffffff');
  const terrain = new THREE.Mesh(geo, tm); terrain.receiveShadow = true; terrain.name = 'terrain';
  g.add(terrain); walkables.push(terrain);
}

// ---------- lake + far shore ----------
function buildWater(g) {
  const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 260), new THREE.MeshStandardMaterial({ color: '#325f76', roughness: 0.35, metalness: 0.0, envMapIntensity: 0.2, transparent: true, opacity: 0.9 }));
  water.rotation.x = -Math.PI / 2; water.position.set(6, LAKE_Y, 140); water.receiveShadow = true; g.add(water);
  // forested far shore (~75 m across the bay)
  const NX = 180, NZ = 40, pos = [], col = [], idx = [];
  const c = new THREE.Color(), dark = new THREE.Color('#2e4a2c'), lite = new THREE.Color('#4b6d38'), rock = new THREE.Color('#7d7a68');
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
    const x = -420 + 840 * i / NX, z = 96 + 160 * Math.pow(j / NZ, 1.4);
    const edge = 100 + Math.sin(x / 23) * 6 + Math.sin(x / 9) * 2;
    const hill = 14 + vnoise(x * 0.012, 3) * 34 + vnoise(x * 0.04, z * 0.04) * 8;
    const y = LAKE_Y - 1.5 + smooth(edge - 2, edge + 45, z) * hill + (z > edge ? 1.5 : 0);
    pos.push(x, y, z);
    c.copy(dark).lerp(lite, vnoise(x * 0.08, z * 0.08)); if (z < edge + 3) c.lerp(rock, 0.5);
    col.push(c.r, c.g, c.b);
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, d = a + NX + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  // dock at the shore below the house
  const dz = shoreZ(2) - 0.5;
  box(g, 1.4, 0.08, 7, 'deck', 2, LAKE_Y + 0.35, dz + 3, { walk: true });
  for (const [px, pz] of [[1.35, 1], [2.65, 1], [1.35, 6], [2.65, 6]]) box(g, 0.12, 1.2, 0.12, 'deckWood', px, LAKE_Y - 0.8, dz + pz, {});
}

// Strip mesh draped on the terrain along a polyline.
function ribbon(pts, width, material, yOff = 0.05, vScale = 1) {
  const pos = [], uv = [], idx = [], k = 4; let len = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
    let tx = q[0] - o[0], tz = q[1] - o[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    if (i > 0) len += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    for (let s = 0; s <= k; s++) {
      const off = (s / k - 0.5) * width, x = p[0] - tz * off, z = p[1] + tx * off;
      pos.push(x, groundY(x, z) + yOff, z); uv.push(off / vScale, len / vScale);
    }
  }
  for (let i = 0; i < pts.length - 1; i++) for (let s = 0; s < k; s++) {
    const a = i * (k + 1) + s, b = a + 1, d = a + k + 1, e = d + 1; idx.push(a, b, d, b, e, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material); m.receiveShadow = true; return m;
}
function drapedDisc(x0, z0, r, material, yOff = 0.05, uvs = 2) {
  const geo = new THREE.RingGeometry(0.01, r, 28, 6); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i)), wob = 1 + Math.sin(a * 3 + 1) * 0.08 + Math.sin(a * 5) * 0.05;
    const x = x0 + p.getX(i) * wob, z = z0 + p.getZ(i) * wob;
    p.setXYZ(i, x, groundY(x, z) + yOff, z); uv.setXY(i, x / uvs, z / uvs);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material); m.receiveShadow = true; return m;
}

function buildRoads(g) {
  // chemin (asphalt) along the north edge of the lot
  const asph = cmat({ map: asphaltTex(), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 });
  const rp = []; for (let x = -190; x <= 200; x += 2) rp.push([x, roadZ(x)]);
  g.add(ribbon(rp, 6.6, asph, 0.06, 4));
  const shoulder = cmat({ map: gravelTex(), color: '#c8c0b0', roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 });
  g.add(ribbon(rp, 8.6, shoulder, 0.04, 2.5));
  // gravel driveway from the road to a turnaround in front of the porch
  const grav = cmat({ map: gravelTex(), roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 });
  const dp = []; for (let z = roadZ(driveX(ROAD_Z)) + 2; z <= PAD.z; z += 0.6) dp.push([driveX(z), z]);
  g.add(ribbon(dp, 3.4, grav, 0.05, 2.5));
  g.add(drapedDisc(PAD.x, PAD.z, PAD.r, grav, 0.05, 2.5));
  // civic-number post + mailbox at the driveway entrance
  const mx = driveX(ROAD_Z + 4) + 2.6, mz = roadZ(mx) + 4.2, my = groundY(mx, mz);
  box(g, 0.1, 1.1, 0.1, color('#6b5038', 0.9), mx, my, mz);
  box(g, 0.22, 0.24, 0.48, color('#2b2b2b', 0.5, { metalness: 0.4 }), mx, my + 1.1, mz);
}

// ---------- front of the house (photo 1) ----------
function buildFrontYard(g, S) {
  // signature white birches just right of the screen door, before the gable wing
  birch(S, 5.75, -3.6, 15.5); birch(S, 6.35, -4.35, 13.5);
  addCollider(5.5, 6.6, -4.6, -3.4, -1, 2);
  // spirea along the porch knee wall + under the gable wing
  for (let x = 5.6; x < 12.6; x += 0.62) {
    if (x > 7.3 && x < 8.6) continue; // screen door + path
    shrub(S, x, -2.45 + Math.sin(x * 2.1) * 0.12, 0.75 + hash(x, 1) * 0.2, x < 9.5 ? '#6fa043' : '#5f9640', { n: 4 });
  }
  for (let x = 0.4; x < 4.6; x += 0.7) shrub(S, x, -0.65, 0.7, '#64993f', { n: 4 });
  // daylilies on the right (west) corner
  for (let i = 0; i < 7; i++) lily(S, -0.9 + (i % 4) * 0.55, -1.0 - Math.floor(i / 4) * 0.6, 0.45, true);
  // flagstone path from the screen door step to the gravel
  const fs = cmat({ color: '#8f8a80', roughness: 0.95 });
  [[7.95, -2.75], [7.7, -3.55], [7.95, -4.35], [7.6, -5.1]].forEach(([x, z], i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.34 + i % 2 * 0.05, 0.36, 0.06, 7), fs);
    m.position.set(x, groundY(x, z) + 0.04, z); m.rotation.y = i; m.scale.set(1.2, 1, 0.9); m.receiveShadow = true; g.add(m); walkables.push(m);
  });
  // a few clumps of lawn weeds / young shrubs at the clearing edges
  for (const [x, z, r] of [[-3, -3.5, 1.2], [14.6, -2.4, 1.1], [13.8, -0.5, 0.9], [-4, 1.5, 1.0]]) shrub(S, x, z, r, '#5a8f3a', { n: 5 });
}

// ---------- guest chalet (photo 10) ----------
// Pale aqua lap siding, steep gable (facing the house), dark brown edge trim, white door with a
// multi-pane glass upper, wide screened window, low deck with a black wrought-iron bistro set.
function buildChalet(root, S) {
  const { x: cx, z: cz } = CHALET, y = groundY(cx, cz + 1.8) + 0.3;
  const g = group(root, cx, cz, 0, y);
  const sid = cmat({ map: tex('siding', { base: '#8ccfc2' }), roughness: 0.75 }, 1.0);
  const brown = color('#4a2c1e', 0.7), white = mat('doorWhite');
  const w = 3.0, d = 3.6, h = 2.25, pitch = 0.82, ridge = h + (w / 2) * Math.tan(pitch);
  box(g, w, h, d, sid, 0, 0, 0);
  box(g, w + 0.04, 1.2, d + 0.04, color('#5e5548', 0.95), 0, -1.2, 0, { shadow: false }); // skirt to grade
  addCollider(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, y - 1, y + 2);
  // gable ends
  const tri = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, ridge - h)]);
  for (const s of [-1, 1]) {
    const gm = new THREE.Mesh(new THREE.ShapeGeometry(tri), sid); gm.position.set(0, h, s * (d / 2 + 0.001)); if (s < 0) gm.rotation.y = Math.PI; gm.castShadow = true; g.add(gm);
  }
  // roof planes + dark brown bargeboards
  const ov = 0.28, L = (w / 2 + ov) / Math.cos(pitch);
  const rm = mat('roof');
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(boxGeo(L, 0.07, d + 0.5, rm), rm);
    r.position.set(s * (L / 2) * Math.cos(pitch), ridge + 0.05 - (L / 2) * Math.sin(pitch), 0); r.rotation.z = -s * pitch; r.castShadow = true; r.receiveShadow = true; g.add(r);
    for (const e of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(L, 0.2, 0.05), brown);
      b.position.set(s * (L / 2) * Math.cos(pitch), ridge - 0.06 - (L / 2) * Math.sin(pitch), e * (d / 2 + 0.25)); b.rotation.z = -s * pitch; g.add(b);
    }
    box(g, 0.05, 0.16, d + 0.5, brown, s * (w / 2 + ov - 0.02), h - 0.2, 0); // fascia
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(g, 0.1, h, 0.1, brown, sx * (w / 2 + 0.01), 0, sz * (d / 2 + 0.01), { shadow: false });
  box(g, 0.45, 0.3, 0.03, color('#3a2a20', 0.8), 0, h + 0.5, d / 2 + 0.02); // gable vent
  const fz = d / 2 + 0.02;
  // white door with a 3x3 glass upper (right side)
  box(g, 0.82, 1.98, 0.05, white, 0.78, 0.02, fz);
  box(g, 0.58, 0.82, 0.02, color('#2f3a40', 0.15, { metalness: 0.3 }), 0.78, 1.0, fz + 0.02, { shadow: false });
  for (const u of [-0.1, 0.1]) box(g, 0.03, 0.82, 0.03, white, 0.78 + u * 0.95, 1.0, fz + 0.035, { shadow: false });
  for (const v of [1.27, 1.55]) box(g, 0.58, 0.03, 0.03, white, 0.78, v, fz + 0.035, { shadow: false });
  box(g, 0.06, 0.06, 0.05, mat('brass'), 1.08, 0.95, fz + 0.04, { shadow: false });
  for (const s of [-1, 1]) box(g, 0.08, 2.05, 0.04, brown, 0.78 + s * 0.45, 0, fz + 0.01, { shadow: false });
  box(g, 1.0, 0.08, 0.04, brown, 0.78, 2.03, fz + 0.01, { shadow: false });
  // wide screened window (left), dark brown frame
  const wx = -0.62, wy0 = 0.95, wy1 = 1.9, ww = 1.25;
  box(g, ww, wy1 - wy0, 0.02, color('#2a2f30', 0.9), wx, wy0, fz, { shadow: false });
  for (const s of [-1, 1]) box(g, 0.08, wy1 - wy0 + 0.16, 0.05, brown, wx + s * (ww / 2 + 0.02), wy0 - 0.08, fz + 0.02, { shadow: false });
  box(g, ww + 0.2, 0.08, 0.05, brown, wx, wy1, fz + 0.02, { shadow: false });
  box(g, ww + 0.28, 0.06, 0.1, brown, wx, wy0 - 0.08, fz + 0.04, { shadow: false });
  box(g, 0.05, wy1 - wy0, 0.04, brown, wx, wy0, fz + 0.02, { shadow: false });
  // metal stovepipe
  cyl(g, 0.06, 0.06, 1.4, color('#555', 0.4, { metalness: 0.7 }), w / 2 - 0.55, ridge - 0.9, -0.8, 10);
  // low wooden deck across the front + steps
  const dk = mat('deck');
  box(g, w + 0.5, 0.07, 1.5, dk, 0, -0.1, d / 2 + 0.75, { walk: true });
  box(g, w + 0.5, 0.25, 0.05, 'deckWood', 0, -0.35, d / 2 + 1.5, { shadow: false });
  box(g, 1.0, 0.06, 0.32, dk, 0.78, -0.3, d / 2 + 1.68, { walk: true });
  // black wrought-iron bistro set (round table + 2 chairs)
  const iron = color('#161616', 0.45, { metalness: 0.6 });
  const tx = -0.6, tz = d / 2 + 0.78, ty = -0.03;
  cyl(g, 0.32, 0.32, 0.025, iron, tx, ty + 0.72, tz, 20);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.015, 6, 24), iron); rim.rotation.x = Math.PI / 2; rim.position.set(tx, ty + 0.73, tz); g.add(rim);
  cyl(g, 0.025, 0.03, 0.72, iron, tx, ty, tz, 8);
  for (let i = 0; i < 3; i++) { const f = box(g, 0.5, 0.025, 0.03, iron, tx, ty, tz, {}); f.rotation.y = i * 2.09; }
  for (const [ox, oz, ry] of [[-0.62, -0.05, 1.2], [0.5, 0.15, -1.6]]) {
    const ch = group(g, tx + ox, tz + oz, ry, ty);
    cyl(ch, 0.2, 0.2, 0.025, iron, 0, 0.45, 0, 16);
    for (const [lx, lz] of [[0.14, 0.14], [-0.14, 0.14], [0.14, -0.14], [-0.14, -0.14]]) { const l = box(ch, 0.022, 0.46, 0.022, iron, lx, 0, lz, {}); l.rotation.x = lz * 0.4; l.rotation.z = -lx * 0.4; }
    for (const s of [-1, 1]) box(ch, 0.022, 0.5, 0.022, iron, s * 0.16, 0.45, -0.17, {});
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.014, 6, 20, Math.PI), iron); hoop.position.set(0, 0.92, -0.17); hoop.castShadow = true; ch.add(hoop);
    const hoop2 = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.01, 6, 16, Math.PI), iron); hoop2.position.set(0, 0.86, -0.17); ch.add(hoop2);
  }
  // wooden lattice trellis panel in the clearing to the left of the cabin
  const tw = cmat({ map: latticeTex('#9a7650'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }, 0.3);
  const tr = group(root, cx - 3.1, cz + 1.4, 0.25, groundY(cx - 3.1, cz + 1.4));
  box(tr, 1.2, 1.7, 0.02, tw, 0, 0.15, 0);
  for (const s of [-1, 1]) box(tr, 0.07, 2.0, 0.07, color('#7a5a3c', 0.9), s * 0.62, 0, 0);
  box(tr, 1.35, 0.06, 0.08, color('#7a5a3c', 0.9), 0, 1.9, 0);
  // little shed with a blue door + a kayak behind, to the right
  const bx = cx + 4.6, bz = cz - 4.6, by = groundY(bx, bz);
  const b = group(root, bx, bz, -0.2, by);
  box(b, 2.0, 2.0, 2.2, color('#d9d6cc', 0.85), 0, 0, 0);
  box(b, 0.8, 1.75, 0.04, color('#2f64a8', 0.6), 0.2, 0.05, 1.12);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(boxGeo(1.35, 0.06, 2.6, rm), rm); r.position.set(s * 0.55, 2.3, 0); r.rotation.z = -s * 0.55; r.castShadow = true; b.add(r); }
  const tri2 = new THREE.Shape([new THREE.Vector2(-1, 0), new THREE.Vector2(1, 0), new THREE.Vector2(0, 0.62)]);
  const gm2 = new THREE.Mesh(new THREE.ShapeGeometry(tri2), color('#d9d6cc', 0.85)); gm2.position.set(0, 2.0, 1.101); b.add(gm2);
  const kayak = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), color('#f2a516', 0.4));
  kayak.scale.set(0.32, 0.17, 1.7); kayak.position.set(-1.45, 0.25, 0.4); kayak.rotation.x = 0.1; kayak.castShadow = true; b.add(kayak);
  addCollider(bx - 1.1, bx + 1.1, bz - 1.2, bz + 1.2, by, by + 2);
  // setting: birches, spruces, young maples hugging the cabin; lily-of-the-valley ground cover
  birch(S, cx - 3.2, cz - 2.2, 16); birch(S, cx - 2.2, cz - 4.0, 13); birch(S, cx + 3.0, cz - 1.0, 14);
  spruce(S, cx - 5.2, cz - 5.5, 19); spruce(S, cx + 1.5, cz - 6.5, 21); spruce(S, cx + 7.5, cz - 7, 18);
  maple(S, cx + 3.4, cz + 1.2, 7); maple(S, cx - 4.6, cz + 0.2, 6.5); maple(S, cx - 1.2, cz - 6.0, 12);
  pine(S, cx - 8, cz - 2, 22);
  for (let i = 0; i < 260; i++) {
    const a = hash(i, 41) * 6.283, r = 1.6 + Math.sqrt(hash(i, 42)) * 7;
    const x = cx + Math.cos(a) * r * 1.2, z = cz + 0.5 + Math.sin(a) * r;
    if (z > cz + 2.6 && Math.abs(x - cx) < 2.4) continue; // keep the deck approach mown
    if (Math.abs(x - driveX(z)) < 2.4) continue;
    const sc = 0.22 + hash(i, 43) * 0.18;
    S.add('ico0', 'leaf', x, groundY(x, z) + sc * 0.3, z, sc * 1.3, sc * 0.7, sc * 1.3, jit('#3f7d2e', 0.35, i), { noShadow: true, ry: i });
  }
}

// ---------- shed by the water (photo 11) ----------
// White door with blue trim, blue roof edge, smothered in dry brown vines, white lattice skirt,
// pallet step; flowering crabapple + round daylily bed + stump on the right, wire-mesh raised
// garden and the corner of another white outbuilding behind.
function buildShed(root, S) {
  const { x: cx, z: cz, ry } = SHED, y = groundY(cx, cz - 1) + 0.15;
  const g = group(root, cx, cz, ry, y);
  const w = 2.4, d = 3.0, h = 2.0, pitch = 0.55;
  const wallM = cmat({ map: tex('vboard', { base: '#e4e4dd', boards: 8 }), roughness: 0.85 }, 1.2);
  box(g, w, h, d, wallM, 0, 0.35, 0);
  box(g, w, 0.4, d, color('#5e5548', 0.95), 0, -0.4, 0, { shadow: false });
  addCollider(cx - 1.9, cx + 1.9, cz - 1.9, cz + 1.9, y - 1, y + 2.5);
  const top = h + 0.35, rise = (w / 2) * Math.tan(pitch);
  const tri = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, rise)]);
  for (const s of [-1, 1]) { const gm = new THREE.Mesh(new THREE.ShapeGeometry(tri), wallM); gm.position.set(0, top, s * (d / 2 + 0.001)); if (s > 0) gm.rotation.y = Math.PI; g.add(gm); }
  const ov = 0.25, L = (w / 2 + ov) / Math.cos(pitch), rm = mat('roof'), blue = mat('trimBlue');
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(boxGeo(L, 0.06, d + 0.4, rm), rm);
    r.position.set(s * (L / 2) * Math.cos(pitch), top + rise + 0.04 - (L / 2) * Math.sin(pitch), 0); r.rotation.z = -s * pitch; r.castShadow = true; g.add(r);
    const b = new THREE.Mesh(new THREE.BoxGeometry(L, 0.16, 0.05), blue);
    b.position.set(s * (L / 2) * Math.cos(pitch), top + rise - 0.06 - (L / 2) * Math.sin(pitch), -d / 2 - 0.2); b.rotation.z = -s * pitch; g.add(b);
    box(g, 0.05, 0.14, d + 0.4, blue, s * (w / 2 + ov - 0.03), top - 0.15, 0);
  }
  // white door + blue trim (front = local -z, faces the photo vantage point)
  const fz = -d / 2 - 0.02;
  box(g, 0.86, 1.85, 0.04, mat('doorWhite'), 0, 0.37, fz);
  for (const [px, py, pw, ph] of [[0, 0.55, 0.62, 0.65], [0, 1.4, 0.62, 0.6]]) box(g, pw, ph, 0.01, color('#e2e2dc', 0.6), px, py, fz - 0.025, { shadow: false });
  for (const s of [-1, 1]) box(g, 0.1, 1.98, 0.05, blue, s * 0.48, 0.35, fz - 0.01);
  box(g, 1.06, 0.1, 0.05, blue, 0, 2.28, fz - 0.01);
  box(g, 0.05, 0.05, 0.05, mat('black'), 0.32, 1.25, fz - 0.04);
  // white lattice skirt (visible at the lower left through the vines)
  const lat = cmat({ map: latticeTex('#f2f2ee'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }, 0.3);
  box(g, 0.02, 0.42, d, lat, w / 2 + 0.03, -0.05, 0, { shadow: false });
  box(g, w, 0.42, 0.02, lat, 0, -0.05, fz - 0.02, { shadow: false });
  // wooden pallet step at the door
  for (let i = 0; i < 5; i++) box(g, 0.16, 0.03, 0.75, color('#9b8160', 0.9), -0.4 + i * 0.2, 0.1, fz - 0.45, { walk: true });
  for (const s of [-1, 0, 1]) box(g, 1.0, 0.1, 0.08, color('#7d6448', 0.9), 0, 0, fz - 0.45 + s * 0.3);
  // dry vine mass: instanced clumps in world space over walls + roof, leaving the door clear
  const cos = Math.cos(ry), sin = Math.sin(ry);
  const W = (lx, ly, lz) => [cx + lx * cos + lz * sin, y + ly, cz - lx * sin + lz * cos];
  const vineCols = ['#7b5a3e', '#8e6a48', '#6b4a32', '#a07c58', '#5a3e2a', '#94704c'];
  let k = 0;
  const put = (lx, ly, lz, sc) => { const [x, yy, z] = W(lx, ly, lz); S.add('dodec', 'leaf', x, yy, z, sc, sc * 0.8, sc, jit(vineCols[k % 6], 0.3, k), { ry: k * 1.7, rx: k, noShadow: k % 3 !== 0 }); k++; };
  for (let i = 0; i < 520; i++) {
    const r1 = hash(i, 71), r2 = hash(i, 72), r3 = hash(i, 73), side = i % 4;
    const sc = 0.14 + r3 * 0.2;
    let lx, ly, lz;
    if (side === 0 || side === 3) { // front face, heavier towards the left (local +x) and top
      lx = -w / 2 - 0.1 + r1 * (w + 0.2); ly = Math.pow(r2, 0.6) * (top + 0.25); lz = fz - 0.06 - r3 * 0.14;
      if (Math.abs(lx) < 0.62 && ly < 2.35) continue; // door
      if (lx > 0.65 && ly < 0.45) continue; // let the lattice show at lower left
      if (ly > top) lx *= 1 - (ly - top) * 1.2;
    } else if (side === 1) { lx = (r1 < 0.5 ? -1 : 1) * (w / 2 + 0.07 + r3 * 0.1); lz = -d / 2 + r2 * d; ly = r2 * 0.4 + hash(i, 74) * (top + 0.1); if (lx > 0 && ly < 0.45) continue; }
    else { // roof: lower 60% of both slopes + along the front edge
      const s = r1 < 0.5 ? -1 : 1, t = 0.35 + hash(i, 75) * 0.75; lx = s * t * (w / 2 + ov) * 0.95; ly = top + rise * (1 - t) + 0.12; lz = -d / 2 - 0.15 + r2 * (d * 0.8);
    }
    put(lx, ly, lz, sc);
  }
  // world-space neighbours (right of the shed in the photo = local -x side)
  const R = (a, b) => W(-a, 0, b);
  const [kx, , kz] = R(4.2, 1.5); crab(S, kx, kz, 6.2);
  const [lx2, , lz2] = R(3.2, -1.2);
  for (let i = 0; i < 4; i++) lily(S, lx2 + Math.cos(i * 1.6) * 0.45, lz2 + Math.sin(i * 1.6) * 0.45, 0.42, false);
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, x = lx2 + Math.cos(a) * 1.05, z = lz2 + Math.sin(a) * 1.05; S.add('dodec', 'stone', x, groundY(x, z) + 0.05, z, 0.18, 0.13, 0.15, jit('#9a978e', 0.3, i), { ry: i }); }
  const [sx2, , sz2] = R(1.8, -3.0); cyl(root, 0.32, 0.38, 0.4, color('#6e5a46', 0.95), sx2, groundY(sx2, sz2) - 0.05, sz2, 10);
  cyl(root, 0.3, 0.3, 0.02, color('#b59a74', 0.9), sx2, groundY(sx2, sz2) + 0.35, sz2, 10);
  // wire-mesh raised garden enclosure behind
  const [gx, , gz] = R(-0.5, 5.0);
  const ge = group(root, gx, gz, ry + 0.15, groundY(gx, gz));
  box(ge, 3.0, 0.4, 2.0, color('#7a5a3a', 0.9), 0, 0, 0);
  box(ge, 2.9, 0.02, 1.9, mat('dirt'), 0, 0.4, 0, { shadow: false });
  for (const [px, pz] of [[-1.5, -1], [1.5, -1], [-1.5, 1], [1.5, 1], [0, -1], [0, 1]]) box(ge, 0.07, 1.7, 0.07, color('#6a4a30', 0.9), px, 0, pz);
  const wm = cmat({ map: wireTex(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4 }, 0.1);
  for (const s of [-1, 1]) { box(ge, 3.0, 1.3, 0.01, wm, 0, 0.4, s * 1.0, { shadow: false }); box(ge, 0.01, 1.3, 2.0, wm, s * 1.5, 0.4, 0, { shadow: false }); }
  for (let i = 0; i < 10; i++) shrub(S, gx + (hash(i, 81) - 0.5) * 2.2, gz + (hash(i, 82) - 0.5) * 1.2, 0.35, '#5b9a3c', { n: 2 });
  // corner of another white outbuilding
  const [ox, , oz] = R(-2.6, 6.2);
  const ob = group(root, ox, oz, ry, groundY(ox, oz));
  box(ob, 2.6, 2.2, 2.4, wallM, 0, 0, 0);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(boxGeo(1.6, 0.06, 2.8, rm), rm); r.position.set(s * 0.65, 2.55, 0); r.rotation.z = -s * 0.5; r.castShadow = true; ob.add(r); }
  // forest edge right behind
  spruce(S, ...W(1.5, 0, 6.5).filter((_, i) => i !== 1), 18); birch(S, ...W(3.2, 0, 4.0).filter((_, i) => i !== 1), 15);
  birch(S, ...W(-5.5, 0, 7.5).filter((_, i) => i !== 1), 17);
}

// ---------- patio (photo 12) ----------
// Laid out in a local frame looking from the house side towards the forest (local -z = away).
function buildPatio(root, S) {
  const { x: cx, z: cz, ry } = PATIO, y = groundY(cx, cz) + 0.02;
  const g = group(root, cx, cz, ry, y);
  const cos = Math.cos(ry), sin = Math.sin(ry);
  const W = (lx, lz) => [cx + lx * cos + lz * sin, cz - lx * sin + lz * cos];
  // ~60 cm square grey concrete pavers in a rough round patch, grass in the joints
  for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
    const lx = i * 0.63, lz = j * 0.63, rr = 3.1 + (vnoise(i * 0.7 + 3, j * 0.7) - 0.5) * 1.2;
    if (Math.hypot(lx * 0.92, lz) > rr) continue;
    const [x, z] = W(lx, lz);
    S.add('cube', 'stone', x, groundY(x, z) - 0.03, z, 0.6, 0.08 + hash(i, j) * 0.02, 0.6, jit('#9d9b94', 0.18, i * 13 + j), { ry: ry + (hash(j, i) - 0.5) * 0.04, noShadow: true });
  }
  // rusted lattice fire pit with pyramidal screen lid
  const ft = fireTex(), rust = cmat({ map: ft, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.3 }, 0.8);
  const fp = group(g, 0, 0, 0.3, 0.06);
  for (const [px, pz, r] of [[0, 0.4, 0], [0, -0.4, 0], [0.4, 0, Math.PI / 2], [-0.4, 0, Math.PI / 2]]) box(fp, 0.8, 0.42, 0.01, rust, px, 0.04, pz, { ry: r });
  for (const [px, pz] of [[0.4, 0.4], [-0.4, 0.4], [0.4, -0.4], [-0.4, -0.4]]) box(fp, 0.05, 0.48, 0.05, color('#6e3518', 0.6, { metalness: 0.3 }), px, 0, pz);
  box(fp, 0.86, 0.04, 0.86, color('#6e3518', 0.6, { metalness: 0.3 }), 0, 0.46, 0);
  box(fp, 0.7, 0.18, 0.7, color('#2a2420', 1), 0, 0.05, 0, { shadow: false });
  const lid = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.45, 4, 1, true), cmat({ color: '#3a2a22', transparent: true, opacity: 0.6, side: THREE.DoubleSide, roughness: 0.8 }));
  lid.rotation.y = Math.PI / 4; lid.position.y = 0.72; fp.add(lid);
  for (let i = 0; i < 4; i++) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.03), color('#7a3d1c', 0.6, { metalness: 0.3 })); const a = i * Math.PI / 2; e.position.set(Math.cos(a) * 0.3, 0.71, Math.sin(a) * 0.3); e.rotation.set(Math.sin(a) * 0.93, 0, -Math.cos(a) * 0.93); fp.add(e); }
  cyl(fp, 0.04, 0.04, 0.08, color('#7a3d1c', 0.6), 0, 0.94, 0, 8);
  // old outdoor fireplace / barbecue (stone + concrete) with a tall stovepipe
  const stone = mat('stone');
  box(g, 1.25, 0.95, 0.9, stone, -0.5, 0, -2.6, { collide: false });
  box(g, 0.7, 0.42, 0.05, color('#1c1a18', 1), -0.5, 0.3, -2.13, { shadow: false });
  box(g, 1.4, 0.1, 1.0, color('#8d8b84', 0.9), -0.5, 0.95, -2.6);
  box(g, 0.55, 0.35, 0.5, color('#7c7a73', 0.9), -0.5, 1.05, -2.7);
  cyl(g, 0.1, 0.1, 2.1, color('#1d1d1d', 0.5, { metalness: 0.5 }), -0.5, 1.4, -2.7, 12);
  cyl(g, 0.17, 0.17, 0.06, color('#1d1d1d', 0.5, { metalness: 0.5 }), -0.5, 3.5, -2.7, 12);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.14, 12), color('#1d1d1d', 0.5, { metalness: 0.5 })); cone.position.set(-0.5, 3.64, -2.7); g.add(cone);
  // short concrete block wall
  box(g, 1.6, 0.42, 0.2, cmat({ map: blockTex(), roughness: 0.95 }, 0.4), 0.95, 0, -2.75);
  // low weathered wooden bench with a plank back (right-behind)
  const bw = color('#7d6650', 0.9), bench = group(g, 2.35, -1.75, -0.45, 0);
  box(bench, 1.8, 0.05, 0.42, bw, 0, 0.4, 0);
  for (const s of [-1, 1]) { box(bench, 0.07, 0.4, 0.38, bw, s * 0.8, 0, 0); box(bench, 0.07, 0.85, 0.06, bw, s * 0.8, 0, -0.22); }
  for (const yy of [0.58, 0.76]) box(bench, 1.8, 0.12, 0.04, bw, 0, yy, -0.24);
  // two stacked turquoise Adirondack chairs next to it
  adirondack(g, 3.55, -0.75, -0.9, '#1fb4ac');
  adirondack(g, 3.6, -0.8, -0.85, '#1fb4ac').position.y = 0.09;
  // left foreground: stone-edged flower bed with a big daylily clump, white planter, wooden box
  const [fx, fz] = W(-2.5, 2.4);
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, x = fx + Math.cos(a) * 1.05, z = fz + Math.sin(a) * 0.9; S.add('dodec', 'stone', x, groundY(x, z) + 0.04, z, 0.2, 0.14, 0.17, jit('#a5a198', 0.3, i + 50), { ry: i }); }
  const bed = drapedDisc(fx, fz, 0.95, mat('dirt'), 0.03, 1); root.add(bed);
  for (let i = 0; i < 6; i++) lily(S, fx + Math.cos(i) * 0.4 * (i > 0), fz + Math.sin(i) * 0.35 * (i > 0), 0.55);
  cyl(g, 0.24, 0.18, 0.32, color('#ecebe6', 0.45), -1.2, 0, 3.3, 18);
  box(g, 0.5, 0.32, 0.5, color('#8a6a48', 0.85), -3.4, 0, 1.0);
  // setting: wall of tall spruces/pines behind with shrubs below; crabapple at the far left
  crab(S, ...W(-5.6, -3.4), 5.5);
  for (let i = 0; i < 7; i++) { const [x, z] = W(-5 + i * 1.9, -8.5 - hash(i, 5) * 2.5); (i % 3 === 1 ? pine : spruce)(S, x, z, 17 + hash(i, 6) * 7); }
  for (let i = 0; i < 9; i++) { const [x, z] = W(-5.5 + i * 1.4, -6.8 + hash(i, 8) * 0.8); shrub(S, x, z, 1.1 + hash(i, 9) * 0.6, i % 2 ? '#5a8f38' : '#6d9e45', { n: 4 }); }
}

// ---------- forest ----------
function buildForest(S) {
  const views = [[7.5, -14, 7, -2], [10.1, -5.5, 17, -4.5], [-0.2, -7, -0.5, -14.5], [-21.5, 15.5, -14, 19.5]];
  const segDist = (x, z, [ax, az, bx, bz]) => {
    const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
    return Math.hypot(x - ax - vx * t, z - az - vz * t);
  };
  const blocked = (x, z) => {
    if (z > shoreZ(x) - 1.8) return true;
    if (Math.abs(z - roadZ(x)) < 5.2) return true;
    if (z < -3 && z > ROAD_Z - 3 && Math.abs(x - driveX(z)) < 3.4) return true;
    if (x > -5 && x < 14.5 && z > -6 && z < 10.4) return true; // house, deck, porch, front beds
    if (Math.hypot(x - CHALET.x, z - CHALET.z) < 4.2) return true;
    if (Math.hypot(x - PATIO.x, z - PATIO.z) < 6) return true;
    if (Math.hypot(x - SHED.x, z - SHED.z) < 5.5) return true;
    for (const v of views) if (segDist(x, z, v) < 2.6) return true;
    return false;
  };
  let n = 0;
  const step = 4.3;
  for (let gx = -175; gx <= 185; gx += step) for (let gz = -120; gz <= 34; gz += step) {
    const x = gx + (hash(gx, gz) - 0.5) * step * 0.9, z = gz + (hash(gz, gx) - 0.5) * step * 0.9;
    if (blocked(x, z)) continue;
    const cl = clearing(x, z), d = Math.hypot(x - 6, z - 3), far = d > 55;
    if (cl > 0.3 && hash(x * 3, z * 7) > (cl > 0.8 ? 0.04 : 0.25)) continue;
    // the lot itself is more lightly treed than the surrounding bush, so it reads from the air
    const inLot = x > -27 && x < 39 && z > ROAD_Z + 3 && z < 24;
    if (inLot && hash(x * 5.1, z * 2.7) < 0.3) continue;
    const r = hash(x, z * 1.3), h = hash(z, x * 0.7);
    const o = { far };
    if (r < 0.36) spruce(S, x, z, 14 + h * 10, o);
    else if (r < 0.5) pine(S, x, z, 18 + h * 10, o);
    else if (r < 0.72) birch(S, x, z, 13 + h * 8, o);
    else maple(S, x, z, 11 + h * 8, o);
    n++;
    if (!far && d < 45) addCollider(x - 0.25, x + 0.25, z - 0.25, z + 0.25, groundY(x, z) - 1, groundY(x, z) + 3);
    // understory at the forest edge so the clearing reads as a wall of green
    if (d < 70 && cl > 0.02 && cl < 0.45 && !blocked(x + 1.5, z + 1.2) && clearing(x + 1.5, z + 1.2) < 0.5) shrub(S, x + 1.5, z + 1.2, 1.2 + h, hash(x, 3) < 0.5 ? '#557f35' : '#689a42', { n: 3, far, geo: far ? 'ico0' : 'ico1' });
  }
  // trees on the bank right below the lake-side deck so the balcony sits in the canopy (photo 15),
  // trunks open enough underneath to glimpse the lake
  for (const [x, z, k, h] of [[-3.5, 11.2, 'spruce', 17], [-0.5, 12.6, 'birch', 15], [2.2, 11.4, 'pine', 19], [4.8, 13.4, 'birch', 16],
    [7.2, 11.2, 'maple', 13], [9.6, 12.6, 'pine', 20], [12.4, 11.0, 'spruce', 16], [-6.5, 9.5, 'spruce', 18], [14.6, 13.5, 'birch', 15],
    [0.6, 15.5, 'spruce', 18], [6.2, 16.2, 'maple', 12], [-4, 16.5, 'pine', 21], [11.5, 16.8, 'spruce', 17], [3.5, 18.8, 'birch', 14],
    [15.5, 9.2, 'maple', 11], [-7.5, 5.5, 'birch', 16], [16.5, 4.5, 'spruce', 18], [17.8, 1.0, 'birch', 15]]) {
    ({ spruce, pine, birch, maple })[k](S, x, z, h);
  }
  // a few eye-level leafy branches just past the rail
  for (const [x, z, r] of [[1.5, 10.2, 1.4], [5.5, 10.5, 1.6], [9.5, 10.0, 1.3], [-2.6, 10.4, 1.5]]) {
    const y = -0.4 + hash(x, z) * 1.2;
    for (let i = 0; i < 3; i++) S.add('ico1', 'leaf', x + i * 0.7 - 0.7, y + hash(i, x) * 0.6, z + hash(x, i) * 0.6, r * 0.8, r * 0.6, r * 0.8, jit(i % 2 ? '#6aa040' : '#7fb24a', 0.3, x + i));
  }
  return n;
}
