// House shell: floors, ceilings, exterior + interior walls, openings, beam, roof, porch, deck.
import * as THREE from 'three';
import { W, D, T, t, CEIL, WALL_TOP, OPEN } from './plan.js';
import { mat, box, wallX, wallZ, wainscot, casing, windowUnit, doorSlab, addCollider, walkables, color } from './lib.js';

export function buildShell(root) {
  const g = new THREE.Group(); g.name = 'shell'; root.add(g);
  const sage = mat('wallSage'), white = mat('wallWhite'), bedW = mat('wallBedroom'), sh = mat('shingles');

  // ---- floor (hardwood throughout photographed rooms) ----
  const floor = box(g, W - 2 * T, 0.05, D - 2 * T, 'hardwood', W / 2, -0.05, D / 2, { walk: true, shadow: false });
  floor.name = 'floor';
  // porch corner gets deck boards instead (it's outside the conditioned space)
  box(g, 2.85, 0.051, 2.9, 'deck', 11.05, -0.049, 1.5, { shadow: false });
  // foundation skirt down to grade
  box(g, W, 2.6, D, color('#6d6a63', 0.95), W / 2, -2.65, D / 2, { shadow: false });

  // ---- ceilings ----
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat('ceiling'));
  ceil.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v * D / 1.22 : v * W / 1.22; });
  ceil.rotation.x = Math.PI / 2; ceil.position.set(W / 2, CEIL, D / 2); ceil.receiveShadow = true;
  g.add(ceil);
  // attic slab above ceiling so sunlight doesn't leak through
  box(g, W, 0.1, D, color('#444', 1), W / 2, CEIL + 0.01, D / 2, { shadow: true });

  // ---- exterior walls (shingles out, paint in) ----
  const southOps = OPEN.south.map((o) => ({ ...o }));
  const northOps = OPEN.north.map((o) => ({ ...o }));
  // north wall: bedroom..kitchen (porch corner x 9.6..12.5 is screened, no wall)
  wallX(g, 0, 9.65, T / 2, T, WALL_TOP, { n: sh, s: sage }, northOps);
  // south wall
  wallX(g, 0, W, D - T / 2, T, WALL_TOP, { n: sage, s: sh }, southOps);
  // west wall
  wallZ(g, 0, D, T / 2, T, WALL_TOP, { w: sh, e: sage }, OPEN.west);
  // east wall (bath part)
  wallZ(g, 3.0, D, W - T / 2, T, WALL_TOP, { w: white, e: sh }, []);
  // porch side of kitchen + bath north wall: shingles outside
  wallZ(g, 0, 3.0, 9.6, t, WALL_TOP, { w: white, e: sh }, OPEN.kitchenEast);
  wallX(g, 9.6, W, 3.0, t, WALL_TOP, { n: sh, s: white }, []);

  // ---- interior walls ----
  // bedroom east wall (door to living)
  wallZ(g, T, 3.0, 3.4, t, CEIL, { w: bedW, e: sage }, [OPEN.bedroomDoor]);
  // bedroom south wall
  wallX(g, T, 3.45, 3.0, t, CEIL, { n: bedW, s: sage }, []);
  // kitchen / den + kitchen / bath wall
  wallX(g, 6.8, 9.6, 3.0, t, CEIL, { n: white, s: sage }, [OPEN.kitchenToDen]);
  // den / bath wall
  wallZ(g, 3.05, D - T, 8.2, t, CEIL, { w: sage, e: white }, [OPEN.bathDoor]);
  // closet tucked into the dinette's north-east corner (x 6.2..6.8, z 0..1.05); door faces the kitchen
  wallZ(g, T, 1.1, 6.8, t, CEIL, { w: sage, e: white }, [OPEN.closetDoor]);
  wallX(g, 6.15, 6.85, 1.1, t, CEIL, { n: white, s: sage }, []);
  wallZ(g, T, 1.1, 6.15, t, CEIL, { w: sage, e: white }, []);

  // ---- wainscoting ----
  // living + dinette + den (olive painted boards)
  wainscot(g, 'z', 3.05, D - T, T, 'e', OPEN.west);
  wainscot(g, 'x', T, 4.6, D - T, 'n', southOps.filter((o) => o.a < 4.6));
  wainscot(g, 'x', 4.6, 8.15, D - T, 'n', southOps.filter((o) => o.a > 4.6 && o.a < 8.2));
  wainscot(g, 'x', 3.45, 6.1, T, 's', []);
  wainscot(g, 'z', T, 3.0, 3.45, 'e', [OPEN.bedroomDoor]);
  wainscot(g, 'x', 3.45, 4.6, 3.05, 's', []);
  wainscot(g, 'x', 6.8, 8.2, 3.05, 's', [OPEN.kitchenToDen]);
  wainscot(g, 'z', 3.05, D - T, 8.15, 'w', [OPEN.bathDoor]);
  wainscot(g, 'z', T, 1.1, 6.1, 'w', []);
  wainscot(g, 'x', 6.1, 6.8, 1.15, 's', []);
  // kitchen side (dark olive half-wall on the kitchen/den partition)
  wainscot(g, 'x', 6.85, 9.55, 2.95, 'n', [OPEN.kitchenToDen]);
  // bedroom: knotty pine wainscot
  const pine = { board: 'pineBoard', cap: 'pineTrim', h: 0.95 };
  wainscot(g, 'z', T, 2.95, T, 'e', [], pine);
  wainscot(g, 'x', T, 3.35, T, 's', OPEN.north.filter((o) => o.a < 3.4), pine);
  wainscot(g, 'x', T, 3.35, 2.95, 'n', [], pine);
  wainscot(g, 'z', T, 2.95, 3.35, 'w', [OPEN.bedroomDoor], pine);

  // ---- openings: windows, sliders, doors ----
  for (const o of OPEN.north) {
    windowUnit(g, 'x', o.a, o.b, o.y0, o.y1, T / 2, T, { bars: [0.5] });
    casing(g, 'x', o.a, o.b, o.y0, o.y1, T, 's', o.id === 'bedWin' ? 'pineTrim' : 'olive');
    box(g, o.b - o.a + 0.16, 0.035, 0.08, o.id === 'bedWin' ? 'pineTrim' : 'olive', (o.a + o.b) / 2, o.y0 - 0.035, T + 0.03, { shadow: false });
  }
  for (const o of OPEN.south) {
    if (o.type === 'slider') {
      windowUnit(g, 'x', o.a, o.b, o.y0, o.y1, D - T / 2, T, { bars: [0.5], frame: 'trimWhite' });
    } else if (o.id === 'livWin') {
      windowUnit(g, 'x', o.a, o.b, o.y0, o.y1, D - T / 2, T, { bars: [0.3, 0.7], hbars: [0.5] });
    } else {
      windowUnit(g, 'x', o.a, o.b, o.y0, o.y1, D - T / 2, T, {});
    }
    casing(g, 'x', o.a, o.b, o.y0, o.y1, D - T, 'n', 'olive');
  }
  // west: french door (white, 15-lite) + slider
  const fr = OPEN.west[0];
  windowUnit(g, 'z', fr.a, fr.b, 0, fr.y1, T / 2, T, { frame: 'doorWhite', bars: [0.36, 0.64], hbars: [0.2, 0.4, 0.6, 0.8] });
  box(g, 0.05, 0.85, fr.b - fr.a, 'doorWhite', T / 2, 0, (fr.a + fr.b) / 2, { shadow: false }); // solid kick panel
  casing(g, 'z', fr.a, fr.b, 0, fr.y1, T, 'e', 'olive');
  const sl = OPEN.west[1];
  windowUnit(g, 'z', sl.a, sl.b, 0, sl.y1, T / 2, T, { bars: [0.5] });
  casing(g, 'z', sl.a, sl.b, 0, sl.y1, T, 'e', 'olive');
  for (const o of OPEN.kitchenEast) {
    if (o.type === 'window') windowUnit(g, 'z', o.a, o.b, o.y0, o.y1, 9.6, t, { bars: [0.5] });
    else { windowUnit(g, 'z', o.a, o.b, 0, o.y1, 9.6, t, { frame: 'doorWhite', hbars: [0.45] }); box(g, 0.05, 0.9, o.b - o.a, 'doorWhite', 9.6, 0, (o.a + o.b) / 2, { shadow: false }); }
    casing(g, 'z', o.a, o.b, o.y0, o.y1, 9.55, 'w', 'olive');
  }
  // interior door casings + door slabs
  const bd = OPEN.bedroomDoor;
  casing(g, 'z', bd.a, bd.b, 0, bd.y1, 3.45, 'e', 'olive');
  casing(g, 'z', bd.a, bd.b, 0, bd.y1, 3.35, 'w', 'pineTrim');
  doorSlab(g, 3.35, bd.a, -Math.PI / 2 - 1.3, 0.8, 2.03, 'doorGreen');
  const kd = OPEN.kitchenToDen;
  casing(g, 'x', kd.a, kd.b, 0, kd.y1, 3.05, 's', 'olive');
  casing(g, 'x', kd.a, kd.b, 0, kd.y1, 2.95, 'n', 'olive');
  const bdd = OPEN.bathDoor;
  casing(g, 'z', bdd.a, bdd.b, 0, bdd.y1, 8.15, 'w', 'olive');
  doorSlab(g, 8.25, bdd.a, Math.PI / 2 + 1.2, 0.75, 2.03, 'doorGreen');
  // closet door (sage six-panel, faces the kitchen, closed)
  const cd = OPEN.closetDoor;
  doorSlab(g, 6.87, cd.b, Math.PI / 2, cd.b - cd.a, 2.03, 'doorSage');
  casing(g, 'z', cd.a, cd.b, 0, 2.03, 6.85, 'e', 'olive');

  // ---- beam + posts between living and dinette/den ----
  const beamM = 'olive';
  box(g, 0.16, 0.22, D - 2 * T, beamM, 4.6, CEIL - 0.22, D / 2);
  box(g, 0.16, CEIL - 0.22, 0.16, beamM, 4.6, 0, T + 0.08, { collide: true });
  // beam between dinette and den spanning to the kitchen partition
  box(g, 2.2, 0.16, 0.14, beamM, 5.7, CEIL - 0.16, 3.0);
  // post at the dinette / kitchen / den corner
  box(g, 0.16, CEIL, 0.16, beamM, 6.8, 0, 3.0, { collide: true });

  // ---- baseboards in kitchen + bath (white) ----
  box(g, 2.7, 0.1, 0.02, 'trimWhite', 8.2, 0, T + 0.01, { shadow: false });

  buildRoof(g);
  buildExteriorTrim(g);
  buildPorch(g);
  buildDeck(g);
  return g;
}

// Hip roof over the main block + cross gable over the west (bedroom) wing.
function buildRoof(g) {
  const roofM = mat('roof');
  const eave = 0.45, y0 = WALL_TOP, rise = 1.7;
  const x0 = -eave, x1 = W + eave, z0 = -eave, z1 = D + eave;
  const zc = D / 2, hipIn = (z1 - z0) / 2;
  const v = [
    [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
    [x0 + hipIn, y0 + rise, zc], [x1 - hipIn, y0 + rise, zc],
  ];
  const faces = [[0, 4, 5, 1], [1, 5, 2], [2, 5, 4, 3], [3, 4, 0]];
  const pos = [], uv = [];
  const tri = (a, b, c) => { for (const p of [a, b, c]) { pos.push(...v[p]); uv.push(v[p][0], v[p][2] + v[p][1]); } };
  for (const f of faces) { if (f.length === 4) { tri(f[0], f[1], f[2]); tri(f[0], f[2], f[3]); } else tri(f[0], f[1], f[2]); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  const roof = new THREE.Mesh(geo, roofM); roof.castShadow = true; roof.receiveShadow = true;
  roof.material.side = THREE.DoubleSide;
  g.add(roof);
  // fascia (white aluminium) around eaves
  const fas = color('#ececea', 0.5);
  box(g, x1 - x0, 0.18, 0.04, fas, W / 2, y0 - 0.18, z0);
  box(g, x1 - x0, 0.18, 0.04, fas, W / 2, y0 - 0.18, z1);
  box(g, 0.04, 0.18, z1 - z0, fas, x0, y0 - 0.18, D / 2);
  box(g, 0.04, 0.18, z1 - z0, fas, x1, y0 - 0.18, D / 2);
  // soffit
  box(g, x1 - x0, 0.02, z1 - z0, color('#e5e5e0', 0.8), W / 2, y0 - 0.02, D / 2, { shadow: false });

  // cross gable facing north over the bedroom wing
  const gx0 = -0.25, gx1 = 4.4, gz0 = -0.5, gz1 = 2.2, gr = 1.3, gy = WALL_TOP;
  const gm = (gx0 + gx1) / 2;
  const gpos = [
    gx0, gy, gz0, gm, gy + gr, gz0, gm, gy + gr, gz1, gx0, gy, gz0, gm, gy + gr, gz1, gx0, gy + 0.0, gz1 + 0.6,
    gm, gy + gr, gz0, gx1, gy, gz0, gx1, gy, gz1 + 0.6, gm, gy + gr, gz0, gx1, gy, gz1 + 0.6, gm, gy + gr, gz1,
  ];
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.Float32BufferAttribute(gpos, 3));
  const guv = []; for (let i = 0; i < gpos.length; i += 3) guv.push(gpos[i], gpos[i + 2] + gpos[i + 1]);
  gg.setAttribute('uv', new THREE.Float32BufferAttribute(guv, 2));
  gg.computeVertexNormals();
  const gmesh = new THREE.Mesh(gg, roofM); gmesh.castShadow = true; g.add(gmesh);
  // gable end wall (shingles) + vent
  const tri2 = new THREE.BufferGeometry();
  const tp = [gx0 + 0.25, gy, gz0 + 0.5, gm, gy + gr - 0.1, gz0 + 0.5, gx1 - 0.25, gy, gz0 + 0.5];
  tri2.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
  tri2.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2.2, 1.2, 4.4, 0], 2));
  tri2.computeVertexNormals();
  const gw = new THREE.Mesh(tri2, mat('shingles')); gw.material.side = THREE.DoubleSide; g.add(gw);
  box(g, 0.4, 0.3, 0.04, color('#e0ddd2', 0.7), gm, gy + 0.45, 0.0);
  // gable fascia boards
  const len = Math.hypot(gm - gx0, gr);
  const ang = Math.atan2(gr, gm - gx0);
  for (const s of [1, -1]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(len, 0.16, 0.05), fas);
    b.position.set(gm - s * (gm - gx0) / 2, gy + gr / 2 - 0.05, gz0);
    b.rotation.z = s * ang; g.add(b);
  }

  // chimney (wood stove flue, black) + second stack (brick-ish)
  box(g, 0.45, 1.0, 0.45, color('#2d2d2d', 0.6), 7.9, y0 + 0.9, 3.4);
  cylFlue(g, 3.1, 1.6);
}
function cylFlue(g, x, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 12), color('#1d1d1d', 0.4, { metalness: 0.6 }));
  m.position.set(x, WALL_TOP + 1.5, z); g.add(m);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12), m.material);
  cap.position.set(x, WALL_TOP + 2.85, z); g.add(cap);
}

// Blue-teal corner boards + window trim on the cedar shingle exterior.
function buildExteriorTrim(g) {
  const tb = 'trimBlue';
  for (const [x, z] of [[0, 0], [W, D], [0, D], [W, 3.0]]) box(g, 0.12, WALL_TOP + 0.4, 0.12, tb, Math.min(Math.max(x, 0.06), W - 0.06), -0.4, Math.min(Math.max(z, 0.06), D - 0.06), { shadow: false });
  // frieze band under the eave
  box(g, W, 0.08, 0.03, tb, W / 2, WALL_TOP - 0.3, -0.01, { shadow: false });
  box(g, W, 0.08, 0.03, tb, W / 2, WALL_TOP - 0.3, D + 0.01, { shadow: false });
  // window trim outside
  const ext = (axis, o, at, s) => {
    const off = at + s * 0.02;
    if (axis === 'x') {
      box(g, o.b - o.a + 0.2, 0.08, 0.03, tb, (o.a + o.b) / 2, o.y1, off, { shadow: false });
      if (o.y0 > 0) box(g, o.b - o.a + 0.2, 0.06, 0.06, tb, (o.a + o.b) / 2, o.y0 - 0.06, off, { shadow: false });
      box(g, 0.08, o.y1 - o.y0, 0.03, tb, o.a - 0.05, o.y0, off, { shadow: false });
      box(g, 0.08, o.y1 - o.y0, 0.03, tb, o.b + 0.05, o.y0, off, { shadow: false });
    } else {
      box(g, 0.03, 0.08, o.b - o.a + 0.2, tb, off, o.y1, (o.a + o.b) / 2, { shadow: false });
      box(g, 0.03, o.y1 - o.y0, 0.08, tb, off, o.y0, o.a - 0.05, { shadow: false });
      box(g, 0.03, o.y1 - o.y0, 0.08, tb, off, o.y0, o.b + 0.05, { shadow: false });
    }
  };
  for (const o of OPEN.north) ext('x', o, 0, -1);
  for (const o of OPEN.south) ext('x', o, D, 1);
  for (const o of OPEN.west) ext('z', o, 0, -1);
}

// Screened 3-season porch: NE corner of the footprint + a strip across the front.
function buildPorch(g) {
  const tb = 'trimBlue';
  const x0 = 5.4, x1 = W, z0 = -1.9;
  // floor (deck boards) for the front strip
  box(g, x1 - x0, 0.06, -z0, 'deck', (x0 + x1) / 2, -0.06, z0 / 2, { walk: true, shadow: false });
  box(g, x1 - x0, 0.5, -z0, color('#b07a48', 0.9), (x0 + x1) / 2, -0.56, z0 / 2, { shadow: false }); // shingled skirt
  walkables.push(g.children[g.children.length - 1]);
  // knee wall (shingles) + posts + screens
  const screen = new THREE.MeshStandardMaterial({ color: '#2a3036', transparent: true, opacity: 0.35, roughness: 1, depthWrite: false, side: THREE.DoubleSide });
  screen.userData.tile = 1;
  const doorX = 9.0;
  // north face
  const posts = [x0, 6.9, 8.4, doorX - 0.45, doorX + 0.45, 10.9, x1];
  for (const px of posts) box(g, 0.1, 2.3, 0.1, tb, px, 0, z0, { shadow: true });
  for (let i = 0; i < posts.length - 1; i++) {
    const a = posts[i], b = posts[i + 1];
    if (Math.abs((a + b) / 2 - doorX) < 0.1) continue; // door bay
    box(g, b - a, 0.55, 0.08, 'shingles', (a + b) / 2, 0, z0, { collide: true });
    const s = box(g, b - a - 0.1, 1.65, 0.01, screen, (a + b) / 2, 0.6, z0, { shadow: false }); s.renderOrder = 3;
  }
  addCollider(x0, x1, z0 - 0.05, z0 + 0.05, 0, 0.5);
  // white Victorian screen door (open-able look: closed but walk-through)
  box(g, 0.85, 0.06, 0.04, 'doorWhite', doorX, 2.0, z0, {});
  box(g, 0.06, 2.0, 0.04, 'doorWhite', doorX - 0.42, 0, z0, {});
  box(g, 0.06, 2.0, 0.04, 'doorWhite', doorX + 0.42, 0, z0, {});
  box(g, 0.8, 0.12, 0.04, 'doorWhite', doorX, 0.9, z0, {});
  const oval = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 32), mat('doorWhite'));
  oval.scale.set(1, 1.5, 1); oval.position.set(doorX, 1.45, z0); g.add(oval);
  // west face
  box(g, 0.08, 0.55, -z0, 'shingles', x0, 0, z0 / 2, { collide: true });
  const sw = box(g, 0.01, 1.65, -z0 - 0.1, screen, x0, 0.6, z0 / 2, { shadow: false }); sw.renderOrder = 3;
  // east face (whole porch depth incl. the NE corner)
  box(g, 0.08, 0.55, 3.0 - z0, 'shingles', x1 - 0.04, 0, (z0 + 3.0) / 2, { collide: true });
  const se = box(g, 0.01, 1.65, 3.0 - z0, screen, x1 - 0.04, 0.6, (z0 + 3.0) / 2, { shadow: false }); se.renderOrder = 3;
  for (const pz of [z0, 0, 1.5, 3.0]) box(g, 0.1, 2.3, 0.1, tb, x1 - 0.05, 0, pz, {});
  // porch shed roof
  const pr = new THREE.Mesh(boxGeo2(x1 - x0 + 0.6, 0.08, -z0 + 0.5), mat('roof'));
  pr.position.set((x0 + x1) / 2, 2.38, z0 / 2 - 0.15); pr.rotation.x = -0.12; pr.castShadow = true; g.add(pr);
  box(g, x1 - x0 + 0.6, 0.2, 0.05, color('#ececea', 0.5), (x0 + x1) / 2, 2.12, z0 - 0.4, { shadow: false });
  box(g, x1 - x0, 0.12, 0.12, tb, (x0 + x1) / 2, 2.3, z0, { shadow: false });
  // porch ceiling
  box(g, x1 - x0, 0.02, -z0, color('#d9c7a3', 0.8), (x0 + x1) / 2, 2.32, z0 / 2, { shadow: false });
  // step + path stones from the screen door
  box(g, 1.0, 0.25, 0.4, 'deckWood', doorX, -0.45, z0 - 0.25, { walk: true });
  // porch furniture: wicker chair + hanging basket hints
  const wick = color('#a07848', 0.85);
  box(g, 0.6, 0.42, 0.6, wick, 6.2, 0, -1.2, {});
  box(g, 0.6, 0.55, 0.1, wick, 6.2, 0.42, -1.45, {});
  box(g, 0.45, 0.55, 0.45, color('#2a8f86', 0.6), 7.6, 0, -1.25, {});
}
function boxGeo2(w, h, d) {
  const gg = new THREE.BoxGeometry(w, h, d);
  const uv = gg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d);
  return gg;
}

// Raised lake-side deck wrapping the south + west sides, wood rails with square balusters.
function buildDeck(g) {
  const y = -0.03;
  const parts = [
    { x0: -2.6, x1: 10.2, z0: D, z1: D + 2.6 }, // south run
    { x0: -2.6, x1: 0, z0: 2.2, z1: D }, // west run
  ];
  for (const p of parts) {
    box(g, p.x1 - p.x0, 0.05, p.z1 - p.z0, 'deck', (p.x0 + p.x1) / 2, y - 0.05, (p.z0 + p.z1) / 2, { walk: true });
    // joists / posts
    for (let x = p.x0 + 0.1; x <= p.x1; x += 2.2) for (const z of [p.z0 + 0.1, p.z1 - 0.1]) box(g, 0.14, 3.0, 0.14, 'deckWood', x, y - 3.05, z, {});
    box(g, p.x1 - p.x0, 0.2, 0.05, 'deckWood', (p.x0 + p.x1) / 2, y - 0.25, p.z1, {});
  }
  // rails
  const rail = (ax, a0, a1, at) => {
    const len = a1 - a0, c = (a0 + a1) / 2;
    const P = (w, h, d, yy, u) => ax === 'x' ? box(g, w, h, d, 'deckWood', u, yy, at, {}) : box(g, d, h, w, 'deckWood', at, yy, u, {});
    P(len, 0.06, 0.14, 0.95, c); P(len, 0.08, 0.05, 0.1, c); P(len, 0.08, 0.05, 0.85, c);
    for (let u = a0; u <= a1 + 0.01; u += 1.8) P(0.1, 1.0, 0.1, 0, Math.min(u, a1));
    for (let u = a0 + 0.11; u < a1; u += 0.12) P(0.035, 0.75, 0.035, 0.12, u);
    if (ax === 'x') addCollider(a0, a1, at - 0.08, at + 0.08, 0, 1);
    else addCollider(at - 0.08, at + 0.08, a0, a1, 0, 1);
  };
  rail('x', -2.6, 10.2, D + 2.6);
  rail('z', D, D + 2.6, 10.2);
  rail('z', 2.2 + 1.0, D + 2.6, -2.6); // gap at the north end for the stairs
  rail('x', -2.6, 0, 2.2);
  // stairs down the west side to grade (walkable ramp hidden under treads)
  const steps = 5;
  for (let i = 0; i < steps; i++) box(g, 1.2, 0.04, 0.28, 'deck', -3.25, y - 0.18 * (i + 1) - 0.04, 2.75 + 0, {});
  const ramp = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshBasicMaterial({ visible: false }));
  ramp.rotation.order = 'YXZ'; ramp.rotation.y = Math.PI / 2; ramp.rotation.x = -Math.PI / 2 + 0.45;
  ramp.position.set(-3.5, -0.45, 2.7); g.add(ramp); walkables.push(ramp);
  for (let i = 0; i < steps; i++) box(g, 0.28, 0.04, 1.0, 'deck', -2.75 - i * 0.28, y - 0.18 * (i + 1) - 0.04, 2.7, { walk: true });
  // green Adirondack chairs on the balcony (photo 15)
  adirondack(g, 1.2, D + 0.9, -Math.PI / 2 + 0.25, '#2f9a55');
  adirondack(g, 2.6, D + 0.9, -Math.PI / 2 + 0.2, '#2f9a55');
  adirondack(g, 4.2, D + 0.9, -Math.PI / 2 + 0.2, '#2f9a55');
  box(g, 0.45, 0.45, 0.45, color('#9fb7c4', 0.3, { transparent: true, opacity: 0.5 }), 1.9, y, D + 0.55, {});
}

export function adirondack(parent, x, z, ry, hex) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  const m = color(hex, 0.45);
  box(g, 0.62, 0.05, 0.6, m, 0, 0.32, 0.05, {}).rotation.x = 0.12;
  for (const sx of [-0.33, 0.33]) {
    box(g, 0.05, 0.36, 0.05, m, sx, 0, 0.3, {});
    box(g, 0.05, 0.32, 0.05, m, sx, 0, -0.25, {});
    box(g, 0.14, 0.03, 0.62, m, sx, 0.6, 0.08, {});
  }
  for (let i = -2; i <= 2; i++) { const s = box(g, 0.1, 0.75, 0.03, m, i * 0.12, 0.38, -0.3, {}); s.rotation.x = -0.35; s.position.z -= 0.08; }
  return g;
}
