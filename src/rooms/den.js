// Fireplace room (photos 20/28 background): corner sandstone-veneer fireplace with
// stepped mantel shelves, black insert, raised terracotta hearth; slider to the deck.
// Photo 20 (from the kitchen, looking south through the cased opening) shows the fireplace
// in the den's SOUTH-EAST corner facing north-west, with the deck slider just to its right
// (west) on the south wall; photo 28 (from the living room) shows the same pair beyond the beam.
import * as THREE from 'three';
import { box, cyl, color, mat, addCollider } from '../lib.js';
import { tex } from '../textures.js';
import { rug, plant, group } from '../furniture.js';
import { CEIL, OPEN } from '../plan.js';

// Corner (interior faces of the east partition and south exterior wall).
const CX = 8.15, CZ = 5.85;
// Asymmetric corner breast: a deep return on the slider (west) side, almost none on the east
// wall, and a wide 45-degree face carrying the insert (shifted toward the slider side).
const RUNW = 1.3, RETW = 0.42; // along the south wall / west-facing return depth
const RETE = 0.05, RUNE = RUNW - RETE + RETW; // east side (keeps the main face at 45 degrees)

// Polygon helpers (world x/z). Offsets each edge outward (to the room, i.e. toward -x/-z side
// of the corner) by its own distance and re-intersects neighbours (mitred corners).
function offsetChain(pts, offs) {
  // pts: open chain along the room-facing faces, from the south wall to the east wall.
  const lines = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
    // outward normal = left of travel direction (room side)
    const nx = dz / L, nz = -dx / L;
    lines.push({ ax: ax + nx * offs[i], az: az + nz * offs[i], dx, dz });
  }
  const isect = (p, q) => {
    const den = p.dx * q.dz - p.dz * q.dx;
    const t = ((q.ax - p.ax) * q.dz - (q.az - p.az) * q.dx) / den;
    return [p.ax + p.dx * t, p.az + p.dz * t];
  };
  const out = [];
  // first point: slide along the wall (z = CZ) to the first offset line
  const f = lines[0]; out.push([f.ax + f.dx * ((CZ - f.az) / (f.dz || 1e-9)), CZ]);
  if (Math.abs(f.dz) < 1e-9) out[0] = [f.ax, CZ];
  for (let i = 0; i < lines.length - 1; i++) out.push(isect(lines[i], lines[i + 1]));
  const l = lines[lines.length - 1];
  out.push(Math.abs(l.dx) < 1e-9 ? [CX, l.az] : [CX, l.az + l.dz * ((CX - l.ax) / l.dx)]);
  return out;
}

// Extrude a world-xz polygon (closed by the wall corner) from y0 to y1.
// mats: [caps, sides]; UVs are in metres, divided by each material's tile.
function prism(parent, poly, y0, y1, mats, { shadow = true } = {}) {
  const shape = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false });
  const uv = geo.attributes.uv;
  for (const gr of geo.groups) {
    const m = mats[gr.materialIndex] || mats[0];
    const tile = (m.userData && m.userData.tile) || 1;
    for (let i = gr.start; i < gr.start + gr.count; i++) {
      const vi = geo.index ? geo.index.getX(i) : i;
      uv.setXY(vi, uv.getX(vi) / tile, uv.getY(vi) / tile);
    }
  }
  // guard against double-scaling shared vertices: ExtrudeGeometry is non-indexed, so fine.
  const mesh = new THREE.Mesh(geo, mats);
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = y0;
  mesh.castShadow = shadow; mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function build(root) {
  const g = new THREE.Group(); g.name = 'den'; root.add(g);

  // ---------- corner fireplace ----------
  const stone = new THREE.MeshStandardMaterial({ map: tex('stone'), roughness: 0.92, color: '#ecd2bf' });
  stone.userData.tile = 1.7; // big ~21 cm courses like the photo
  const tile = mat('hearthTile');
  const wood = color('#8a3626', 0.55); // terracotta-red painted mantel shelves
  // footprint chain of the room-facing faces: south wall -> return -> 45deg face -> return -> east wall
  const face = [[CX - RUNW, CZ], [CX - RUNW, CZ - RETW], [CX - RETE, CZ - RUNE], [CX, CZ - RUNE]];
  const body = [...face, [CX, CZ]];
  prism(g, body, 0, CEIL, [stone, stone]);
  addCollider(CX - RUNW - 0.12, CX, CZ - RUNE - 0.1, CZ, 0, 2);

  // raised hearth: buff stone plinth with terracotta tile top, deepest in front of the insert
  const hearthPoly = [...offsetChain(face, [0.12, 0.42, 0.06]), [CX, CZ]];
  prism(g, hearthPoly, 0, 0.2, [stone, stone]);
  prism(g, hearthPoly.map(([x, z]) => [x, z]), 0.2, 0.225, [tile, tile], { shadow: false });

  // stepped mantel shelves wrapping the chimney (lowest = deepest, with brackets)
  for (const [y, p, th] of [[1.5, 0.2, 0.055], [1.8, 0.12, 0.045], [2.04, 0.09, 0.04]]) {
    const poly = [...offsetChain(face, [p, p, p]).map(([x, z], i, a) =>
      // let the ends run a little onto the walls like the photo
      i === 0 ? [x - 0.08, z] : i === a.length - 1 ? [x, z - 0.08] : [x, z]), [CX, CZ]];
    prism(g, poly, y, y + th, [wood, wood]);
  }

  // insert + brackets etc. on the 45-degree face: local frame, +z out of the face,
  // +x along it toward the slider (south-west) end.
  const mx = (face[1][0] + face[2][0]) / 2, mz = (face[1][1] + face[2][1]) / 2;
  const faceW = Math.hypot(face[2][0] - face[1][0], face[2][1] - face[1][1]);
  const fp = group(g, mx, mz, -3 * Math.PI / 4);
  const black = mat('black'), brass = mat('brass');
  const XO = 0.2; // insert sits right of centre in both photos
  const iw = 0.92, ib = 0.24, ih = 0.95;
  box(fp, iw, ih, 0.08, black, XO, ib, 0.0); // surround (half recessed)
  // brass louvres top and bottom
  for (const yb of [ib + 0.05, ib + ih - 0.15]) {
    box(fp, iw - 0.12, 0.1, 0.02, color('#3a2a14', 0.6), XO, yb, 0.045, { shadow: false });
    for (let k = 0; k < 4; k++) box(fp, iw - 0.14, 0.012, 0.03, brass, XO, yb + 0.012 + k * 0.024, 0.05, { shadow: false });
  }
  // door: black frame + dark glass with a faint ember glow
  const dy0 = ib + 0.19, dh = ih - 0.38;
  box(fp, iw - 0.14, dh, 0.03, black, XO, dy0, 0.055);
  box(fp, iw - 0.28, dh - 0.12, 0.01, color('#1b1310', 0.25, { emissive: '#5a1e08', emissiveIntensity: 0.35, metalness: 0.3 }), XO, dy0 + 0.06, 0.072, { shadow: false });
  box(fp, 0.03, 0.18, 0.03, brass, XO + iw / 2 - 0.13, dy0 + dh / 2 - 0.09, 0.085, { shadow: false }); // handle
  // mantel brackets under the lowest shelf, either side of the insert
  for (const s of [-1, 1]) box(fp, 0.05, 0.2, 0.17, wood, XO + s * (iw / 2 + 0.06), 1.3, 0.085);
  // round plaster medallion near the top
  const med = cyl(fp, 0.09, 0.09, 0.025, color('#e6d8bd', 0.8), 0, 0, 0, 20);
  med.rotation.x = Math.PI / 2; med.position.set(-0.15, 2.24, 0.012);

  // grille vent high on the west-facing return
  box(g, 0.02, 0.14, 0.24, color('#d9d4c6', 0.6), CX - RUNW - 0.01, 2.12, CZ - RETW / 2, { shadow: false });

  // small plants / ornaments on the shelves (local frame; mantel top 1.555, shelf 2 top 1.845)
  plant(fp, faceW / 2 - 0.12, 1.555, 0.1, { s: 0.55, pot: '#b8643a' }); // terracotta pot, slider end
  plant(fp, -faceW / 2 + 0.25, 1.555, 0.1, { s: 0.45, pot: '#3d5a32' }); // left end
  plant(fp, -faceW / 2 + 0.35, 1.845, 0.06, { s: 0.38, pot: '#2f2f2f' });
  box(fp, 0.16, 0.05, 0.07, brass, 0.05, 1.555, 0.1); // little brass dish
  const pig = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), color('#e7b9a8', 0.6));
  pig.scale.set(1.3, 1, 1); pig.position.set(-faceW / 2 + 0.15, 1.895, 0.06); fp.add(pig); // piggy figurine
  plant(g, CX - RUNW - 0.1, 1.845, CZ - RETW / 2, { s: 0.35, pot: '#c26d3c' }); // on the return

  // fireplace tool stand right of the hearth
  const tx = CX - RUNW - 0.22, tz = CZ - RETW - 0.15;
  cyl(g, 0.11, 0.12, 0.02, black, tx, 0, tz);
  cyl(g, 0.012, 0.012, 0.72, black, tx, 0, tz);
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2;
    cyl(g, 0.008, 0.008, 0.6, color('#2a2a2a', 0.5, { metalness: 0.5 }), tx + Math.cos(a) * 0.05, 0.08, tz + Math.sin(a) * 0.05, 6);
  }
  // macrame hanging planter in the strip of wall between the fireplace and the slider
  const hx = CX - RUNW - 0.08, hz = CZ - 0.12;
  cyl(g, 0.006, 0.006, 0.95, color('#e9dcc0', 0.9), hx, 1.2, hz, 5);
  plant(g, hx, 1.05, hz, { s: 0.45, pot: '#c06b3d' });

  // ---------- floor: sage shag rug in front of the slider, plant by the slider ----------
  const sl = OPEN.south.find((o) => o.id === 'denSlider');
  rug(g, (sl.a + sl.b) / 2 + 0.15, 4.85, 0, 1.75, 1.15, tex('shag'));
  plant(g, sl.a + 0.25, 0, CZ - 0.3, { s: 1.6 });
  return g;
}
