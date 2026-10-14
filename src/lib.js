// Shared building helpers. Units are metres. House interior frame:
// x = west->east (0..12.5), z = north->south (0..6, lake is +z), y = up, floor y = 0.
import * as THREE from 'three';
import { tex } from './textures.js';

export const colliders = []; // axis-aligned {x0,x1,z0,z1,y0,y1}
export const walkables = []; // meshes the player can stand on

// ---------- materials ----------
const matCache = new Map();
// mat('name') returns a shared material. Each has userData.tile (metres per texture repeat).
export function mat(name) {
  if (matCache.has(name)) return matCache.get(name);
  const m = MATS[name]();
  matCache.set(name, m);
  return m;
}
function std(o, tile = 1) {
  const m = new THREE.MeshStandardMaterial(o);
  m.userData.tile = tile;
  return m;
}
export const MATS = {
  hardwood: () => std({ map: tex('hardwood'), roughness: 0.38, metalness: 0.0 }, 1.6),
  wallSage: () => std({ map: tex('paint', { base: '#d6dbc3' }), roughness: 0.9 }, 2),
  wallWhite: () => std({ map: tex('paint', { base: '#e9eae6' }), roughness: 0.9 }, 2),
  wallBedroom: () => std({ map: tex('paint', { base: '#d5d7d8' }), roughness: 0.9 }, 2),
  ceiling: () => std({ map: tex('ceiling'), roughness: 0.95 }, 1.22),
  olive: () => std({ color: '#5d6146', roughness: 0.7 }),
  oliveBoard: () => std({ map: tex('vboard', { base: '#62664a', boards: 6 }), roughness: 0.65 }, 0.9),
  pineBoard: () => std({ map: tex('vboard', { base: '#ab9171', boards: 6, knots: true, seed: 7 }), roughness: 0.6 }, 0.85),
  pineTrim: () => std({ color: '#c49a68', roughness: 0.6 }),
  trimWhite: () => std({ color: '#f1f1ec', roughness: 0.6 }),
  doorGreen: () => std({ color: '#6f7a5c', roughness: 0.55 }),
  doorSage: () => std({ color: '#a9c2a4', roughness: 0.55 }),
  doorWhite: () => std({ color: '#f3f3f0', roughness: 0.5 }),
  glass: () => {
    const m = new THREE.MeshPhysicalMaterial({ color: '#cfe3ea', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.18, depthWrite: false });
    m.userData.tile = 1; return m;
  },
  stone: () => std({ map: tex('stone'), roughness: 0.9 }, 1.1),
  hearthTile: () => std({ map: tex('tile', { base: '#a8502f' }), roughness: 0.7 }, 0.5),
  black: () => std({ color: '#151515', roughness: 0.5, metalness: 0.4 }),
  brass: () => std({ color: '#b58a3c', roughness: 0.35, metalness: 0.8 }),
  chrome: () => std({ color: '#d8d8d8', roughness: 0.2, metalness: 1.0 }),
  steel: () => std({ color: '#c4c6c8', roughness: 0.3, metalness: 0.9 }),
  shingles: () => std({ map: tex('shingles'), roughness: 0.95 }, 1.0),
  roof: () => std({ map: tex('roof'), roughness: 0.95 }, 1.0),
  trimBlue: () => std({ color: '#2d6a85', roughness: 0.6 }),
  deck: () => std({ map: tex('deck'), roughness: 0.85 }, 1.4),
  deckWood: () => std({ color: '#a36a40', roughness: 0.8 }),
  grass: () => std({ map: tex('grass'), roughness: 1 }, 3),
  dirt: () => std({ map: tex('dirt'), roughness: 1 }, 2),
  pavers: () => std({ map: tex('pavers'), roughness: 0.95 }, 1.2),
  white: () => std({ color: '#f4f4f2', roughness: 0.4 }),
  appliance: () => std({ color: '#f2f2f0', roughness: 0.3, metalness: 0.05 }),
};

// ---------- geometry ----------
// Box whose UVs are scaled to world size so textures keep a constant scale.
// face order of BoxGeometry: +x, -x, +y, -y, +z, -z (4 verts each).
export function boxGeo(w, h, d, mats) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const m = Array.isArray(mats) ? mats[f] : mats;
    const tile = (m && m.userData && m.userData.tile) || 1;
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
    }
  }
  return g;
}

// Add a box. (x, z) = centre, y = BOTTOM of box.
// opts: ry (rotation), collide (bool), walk (bool), shadow (bool)
export function box(parent, w, h, d, material, x, y, z, opts = {}) {
  const m = typeof material === 'string' ? mat(material) : material;
  const mesh = new THREE.Mesh(boxGeo(w, h, d, m), m);
  mesh.position.set(x, y + h / 2, z);
  if (opts.ry) mesh.rotation.y = opts.ry;
  mesh.castShadow = opts.shadow !== false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (opts.collide) addCollider(x - w / 2, x + w / 2, z - d / 2, z + d / 2, y, y + h, parent);
  if (opts.walk) walkables.push(mesh);
  return mesh;
}

// Collider in parent-local coords; parents are assumed to be translated only.
export function addCollider(x0, x1, z0, z1, y0 = 0, y1 = 3, parent = null) {
  const o = parent ? parent.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
  colliders.push({ x0: x0 + o.x, x1: x1 + o.x, z0: z0 + o.z, z1: z1 + o.z, y0: y0 + o.y, y1: y1 + o.y });
}

// Split a wall span [a0,a1] x [0,h] into solid rects around openings.
// openings: [{a, b, y0, y1}] in wall coords (a..b along the wall).
export function wallRects(a0, a1, h, openings = []) {
  const ops = [...openings].sort((p, q) => p.a - q.a);
  const rects = [];
  let cur = a0;
  for (const o of ops) {
    if (o.a > cur) rects.push({ a: cur, b: o.a, y0: 0, y1: h });
    if (o.y0 > 0) rects.push({ a: o.a, b: o.b, y0: 0, y1: o.y0 });
    if (o.y1 < h) rects.push({ a: o.a, b: o.b, y0: o.y1, y1: h });
    cur = Math.max(cur, o.b);
  }
  if (cur < a1) rects.push({ a: cur, b: a1, y0: 0, y1: h });
  return rects;
}

// Wall running along X at depth z (thickness t centred on z).
// faces: {n: material facing -z (north side), s: material facing +z}
export function wallX(parent, x0, x1, z, t, h, faces, openings = [], opts = {}) {
  const top = mat('ceiling');
  for (const r of wallRects(x0, x1, h, openings)) {
    const w = r.b - r.a, hh = r.y1 - r.y0;
    const m = [top, top, top, top, faces.s, faces.n];
    box(parent, w, hh, t, m, (r.a + r.b) / 2, r.y0, z, { shadow: opts.shadow });
    if (r.y0 < 1.0 && opts.collide !== false) addCollider(r.a, r.b, z - t / 2, z + t / 2, r.y0, r.y1, parent);
  }
}
// Wall running along Z at x. faces: {w: facing -x, e: facing +x}
export function wallZ(parent, z0, z1, x, t, h, faces, openings = [], opts = {}) {
  const top = mat('ceiling');
  for (const r of wallRects(z0, z1, h, openings)) {
    const d = r.b - r.a, hh = r.y1 - r.y0;
    const m = [faces.e, faces.w, top, top, top, top];
    box(parent, t, hh, d, m, x, r.y0, (r.a + r.b) / 2, { shadow: opts.shadow });
    if (r.y0 < 1.0 && opts.collide !== false) addCollider(x - t / 2, x + t / 2, r.a, r.b, r.y0, r.y1, parent);
  }
}

// Wainscot boards + cap rail on a wall face. side: 'n','s','e','w' = which way the face points.
// For X-walls give z of the face; for Z-walls give x of the face.
export function wainscot(parent, axis, a0, a1, face, side, openings = [], o = {}) {
  const h = o.h ?? 0.92, board = o.board ?? 'oliveBoard', cap = o.cap ?? 'olive', base = o.base ?? cap;
  const sgn = side === 's' || side === 'e' ? 1 : -1;
  const rects = wallRects(a0, a1, h, openings.map((p) => ({ ...p, y0: Math.min(p.y0, h + 0.01) }))).filter((r) => r.y0 === 0);
  for (const r of rects) {
    const len = r.b - r.a, c = (r.a + r.b) / 2, hh = Math.min(h, r.y1); // hh < h only under a low window sill
    if (axis === 'x') {
      box(parent, len, hh, 0.02, board, c, 0, face + sgn * 0.01, { shadow: false });
      box(parent, len, 0.045, 0.045, cap, c, hh, face + sgn * 0.022, { shadow: false });
      box(parent, len, 0.1, 0.03, base, c, 0, face + sgn * 0.03, { shadow: false });
    } else {
      box(parent, 0.02, hh, len, board, face + sgn * 0.01, 0, c, { shadow: false });
      box(parent, 0.045, 0.045, len, cap, face + sgn * 0.022, hh, c, { shadow: false });
      box(parent, 0.03, 0.1, len, base, face + sgn * 0.03, 0, c, { shadow: false });
    }
  }
}

// Casing around an opening on a wall face (trim boards).
export function casing(parent, axis, a, b, y0, y1, face, side, material = 'olive', w = 0.08) {
  const sgn = side === 's' || side === 'e' ? 1 : -1, off = face + sgn * 0.015;
  if (axis === 'x') {
    box(parent, w, y1 - y0, 0.03, material, a - w / 2, y0, off, { shadow: false });
    box(parent, w, y1 - y0, 0.03, material, b + w / 2, y0, off, { shadow: false });
    box(parent, b - a + 2 * w, w, 0.03, material, (a + b) / 2, y1, off, { shadow: false });
  } else {
    box(parent, 0.03, y1 - y0, w, material, off, y0, a - w / 2, { shadow: false });
    box(parent, 0.03, y1 - y0, w, material, off, y0, b + w / 2, { shadow: false });
    box(parent, 0.03, w, b - a + 2 * w, material, off, y1, (a + b) / 2, { shadow: false });
  }
}

// A six-panel interior door slab. Placed with its hinge edge at (x,z), opened by angle.
export function doorSlab(parent, x, z, ry, w = 0.8, h = 2.03, material = 'doorGreen') {
  const g = new THREE.Group();
  g.position.set(x, 0, z); g.rotation.y = ry;
  box(g, w, h, 0.04, material, w / 2, 0, 0, {});
  const pm = typeof material === 'string' ? mat(material) : material;
  const darker = pm.clone(); darker.color = pm.color.clone().multiplyScalar(0.85);
  for (const [px, py, pw, ph] of [[0.22, 1.35, 0.26, 0.55], [0.58, 1.35, 0.26, 0.55], [0.22, 0.25, 0.26, 0.8], [0.58, 0.25, 0.26, 0.8], [0.22, 1.98 - 0.12 - 0.12, 0.26, 0.1], [0.58, 1.98 - 0.12 - 0.12, 0.26, 0.1]]) {
    for (const s of [1, -1]) box(g, pw * w / 0.8, ph, 0.01, darker, px * w / 0.8, py, s * 0.022, { shadow: false });
  }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), mat('brass'));
  knob.position.set(w - 0.07, 0.95, 0.045); g.add(knob);
  const k2 = knob.clone(); k2.position.z = -0.045; g.add(k2);
  parent.add(g);
  return g;
}

// Window: glass + mullions + sill inside an opening on a wall.
// axis 'x' wall at z; 'z' wall at x. frame material default white vinyl.
export function windowUnit(parent, axis, a, b, y0, y1, at, t, o = {}) {
  const frame = o.frame ?? 'trimWhite', bars = o.bars ?? [];
  const w = b - a, h = y1 - y0, c = (a + b) / 2, f = 0.05;
  const g = new THREE.Group(); parent.add(g);
  const P = (u, y, wd, hh, dp, m) => axis === 'x' ? box(g, wd, hh, dp, m, u, y, at, { shadow: false }) : box(g, dp, hh, wd, m, at, y, u, { shadow: false });
  const gl = P(c, y0, w, h, 0.01, 'glass'); gl.renderOrder = 2; gl.castShadow = false;
  P(a + f / 2, y0, f, h, t * 0.6, frame); P(b - f / 2, y0, f, h, t * 0.6, frame);
  P(c, y0, w, f, t * 0.6, frame); P(c, y1 - f, w, f, t * 0.6, frame);
  for (const u of bars) P(a + u * w, y0, f * 0.8, h, t * 0.5, frame);
  for (const v of o.hbars ?? []) P(c, y0 + v * h, w, f * 0.8, t * 0.5, frame);
  return g;
}

export function cyl(parent, rt, rb, h, material, x, y, z, seg = 16) {
  const m = typeof material === 'string' ? mat(material) : material;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function color(hex, rough = 0.6, extra = {}) {
  const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, ...extra });
  m.userData.tile = 1;
  return m;
}

// Picture frame with canvas art on a wall. normal: 'n','s','e','w' = direction the art faces.
export function framedArt(parent, texture, w, h, x, y, z, facing, frameColor = '#3a2a1c', mat2 = 0.06) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  g.rotation.y = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[facing];
  const fm = color(frameColor, 0.5);
  box(g, w, h, 0.03, fm, 0, -h / 2, 0.015, { shadow: false });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w - mat2 * 2, h - mat2 * 2), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 }));
  art.position.z = 0.032; g.add(art);
  parent.add(g);
  return g;
}
