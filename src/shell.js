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
  // closet along the dinette's north side (x 5.3..6.8, z 0..1.1); its south face is the dinette
  // "mirror wall" (photo 25); door faces the kitchen. A short wing wall + post (x 5.3, z 1.1..1.55)
  // closes the west end of the mirror wall.
  wallZ(g, T, 1.1, 6.8, t, CEIL, { w: sage, e: white }, [OPEN.closetDoor]);
  wallX(g, 5.25, 6.85, 1.1, t, CEIL, { n: white, s: sage }, []);
  wallZ(g, T, 1.55, 5.3, t, CEIL, { w: sage, e: sage }, []);

  // ---- wainscoting ----
  // living + dinette + den (olive painted boards)
  wainscot(g, 'z', 3.05, D - T, T, 'e', OPEN.west);
  wainscot(g, 'x', T, 4.6, D - T, 'n', southOps.filter((o) => o.a < 4.6));
  wainscot(g, 'x', 4.6, 8.15, D - T, 'n', southOps.filter((o) => o.a > 4.6 && o.a < 8.2));
  wainscot(g, 'x', 3.45, 5.25, T, 's', []);
  wainscot(g, 'z', T, 3.0, 3.45, 'e', [OPEN.bedroomDoor]);
  wainscot(g, 'x', 6.8, 8.2, 3.05, 's', [OPEN.kitchenToDen]);
  wainscot(g, 'z', 3.05, D - T, 8.15, 'w', [OPEN.bathDoor]);
  wainscot(g, 'z', T, 1.55, 5.25, 'w', []);
  wainscot(g, 'z', 1.15, 1.55, 5.35, 'e', []);
  wainscot(g, 'x', 5.35, 6.8, 1.15, 's', []);
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
      // big lake picture window (photo 28): low fixed centre pane flanked by narrow casements
      // whose sills sit at wainscot height (olive board panels below them)
      const sw = 0.13, wd = o.b - o.a;
      windowUnit(g, 'x', o.a, o.b, o.y0, o.y1, D - T / 2, T, { bars: [sw, 1 - sw] });
      for (const [u0, u1] of [[o.a, o.a + sw * wd], [o.b - sw * wd, o.b]]) {
        box(g, u1 - u0, 0.92 - o.y0, T * 0.7, 'oliveBoard', (u0 + u1) / 2, o.y0, D - T / 2, { shadow: false });
        box(g, u1 - u0, 0.05, T * 0.75, 'trimWhite', (u0 + u1) / 2, 0.92, D - T / 2, { shadow: false });
        box(g, u1 - u0, 0.04, T * 0.5, 'trimWhite', (u0 + u1) / 2, 1.55, D - T / 2, { shadow: false });
      }
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
  doorSlab(g, 3.31, bd.a, Math.PI / 2 + 0.12, 0.8, 2.03, 'doorGreen'); // swung open into the bedroom, resting near the east wall
  const kd = OPEN.kitchenToDen;
  casing(g, 'x', kd.a, kd.b, 0, kd.y1, 3.05, 's', 'olive');
  casing(g, 'x', kd.a, kd.b, 0, kd.y1, 2.95, 'n', 'olive');
  const bdd = OPEN.bathDoor;
  casing(g, 'z', bdd.a, bdd.b, 0, bdd.y1, 8.15, 'w', 'olive');
  doorSlab(g, 8.25, bdd.a, -0.4, 0.75, 2.03, 'doorGreen'); // swings into the bath, clear of the den
  // closet door (sage six-panel, faces the kitchen, closed)
  const cd = OPEN.closetDoor;
  doorSlab(g, 6.87, cd.b, Math.PI / 2, cd.b - cd.a, 2.03, 'doorSage');
  casing(g, 'z', cd.a, cd.b, 0, 2.03, 6.85, 'e', 'olive');

  // ---- beam + posts between living and dinette/den ----
  const beamM = 'olive';
  box(g, 0.16, 0.22, D - 2 * T, beamM, 4.6, CEIL - 0.22, D / 2);
  box(g, 0.16, CEIL - 0.22, 0.16, beamM, 4.6, 0, T + 0.08, { collide: true });
  // engaged post under the beam's south end, against the lake wall (photo 28)
  box(g, 0.16, CEIL - 0.22, 0.12, beamM, 4.6, 0, D - T - 0.06, { collide: true });
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
  // photo 1: squat black chimney stack mid-roof, black metal flue pipe left-centre,
  // satellite dish on a pole at right-centre of the roof line, TV antenna mast.
  box(g, 0.5, 0.75, 0.5, color('#2d2d2d', 0.6), 7.9, y0 + 0.95, 3.2);
  box(g, 0.6, 0.06, 0.6, color('#222', 0.5), 7.9, y0 + 1.7, 3.2);
  cylFlue(g, 9.4, 1.5);
  const alu = color('#cfd2d4', 0.4, { metalness: 0.5 }), dark = color('#3a3c3e', 0.5, { metalness: 0.5 });
  const dish = new THREE.Group(); dish.position.set(4.7, y0 + 1.25, 1.9); g.add(dish);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), dark); pole.position.y = 0.2; dish.add(pole);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 8, 0, Math.PI * 2, 0, 0.62), alu);
  bowl.material.side = THREE.DoubleSide; bowl.rotation.x = Math.PI / 2 + 0.55; bowl.position.set(0, 0.72, 0.05); bowl.scale.set(1, 1, 1.25); bowl.castShadow = true; dish.add(bowl);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.55), dark); arm.position.set(0, 0.62, 0.32); arm.rotation.x = -0.5; dish.add(arm);
  const lnb = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.12), dark); lnb.position.set(0, 0.5, 0.56); dish.add(lnb);
  const mast = new THREE.Group(); mast.position.set(2.2, y0 + 1.0, 3.2); g.add(mast);
  const mp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 6), dark); mp.position.y = 1.3; mast.add(mp);
  for (const [yy, l] of [[2.5, 1.3], [2.25, 1.0], [2.0, 0.8], [1.78, 0.6]]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, l), alu); e.position.y = yy; mast.add(e); }
  const boom = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.025, 0.025), alu); boom.position.set(0.2, 2.15, 0); mast.add(boom);
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
  // white gutters on the front + back eaves, teal downspout on the right (west) front corner (photo 1)
  const gut = color('#f1f1ee', 0.5);
  box(g, 5.4 + 0.5, 0.11, 0.12, gut, (5.4 - 0.45) / 2, WALL_TOP - 0.25, -0.52, { shadow: false });
  box(g, W + 0.9, 0.11, 0.12, gut, W / 2, WALL_TOP - 0.25, D + 0.52, { shadow: false });
  box(g, 0.08, WALL_TOP + 0.35, 0.08, tb, -0.02, -0.6, -0.12, { shadow: false });
  box(g, 0.08, 0.08, 0.42, tb, -0.02, WALL_TOP - 0.3, -0.33, { shadow: false });
  box(g, 0.08, 0.08, 0.3, tb, -0.02, -0.6, -0.27, { shadow: false });
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

// Screened 3-season porch: NE corner of the footprint + a strip across the front (photo 1:
// six tall screened bays above a shingled knee wall, white Victorian screen door right of centre).
function buildPorch(g) {
  const tb = 'trimBlue';
  const x0 = 5.4, x1 = W, z0 = -1.9;
  // floor (deck boards) for the front strip
  box(g, x1 - x0, 0.06, -z0, 'deck', (x0 + x1) / 2, -0.06, z0 / 2, { walk: true, shadow: false });
  box(g, x1 - x0, 0.5, -z0, color('#b07a48', 0.9), (x0 + x1) / 2, -0.56, z0 / 2, { shadow: false }); // shingled skirt
  walkables.push(g.children[g.children.length - 1]);
  box(g, x1 - x0 + 0.04, 0.62, 0.04, 'shingles', (x0 + x1) / 2, -0.62, z0 - 0.02, { shadow: false });
  // knee wall (shingles) + posts + screens
  const screen = new THREE.MeshStandardMaterial({ color: '#1f252a', transparent: true, opacity: 0.55, roughness: 1, depthWrite: false, side: THREE.DoubleSide });
  screen.userData.tile = 1;
  const doorX = 7.9, dA = doorX - 0.47, dB = doorX + 0.47;
  // north face
  const posts = [x0, 6.45, dA, dB, 9.4, 10.45, 11.5, x1];
  for (const px of posts) box(g, 0.11, 2.3, 0.11, tb, px, 0, z0, { shadow: true });
  for (let i = 0; i < posts.length - 1; i++) {
    const a = posts[i], b = posts[i + 1];
    if (a === dA) continue; // door bay
    box(g, b - a, 0.55, 0.08, 'shingles', (a + b) / 2, 0, z0, { collide: true });
    box(g, b - a, 0.06, 0.12, tb, (a + b) / 2, 0.55, z0, { shadow: false }); // sill cap
    const s = box(g, b - a - 0.1, 1.65, 0.01, screen, (a + b) / 2, 0.6, z0, { shadow: false }); s.renderOrder = 3;
  }
  addCollider(x0, dA, z0 - 0.05, z0 + 0.05, 0, 0.5);
  addCollider(dB, x1, z0 - 0.05, z0 + 0.05, 0, 0.5);
  // white Victorian screen door: stiles + rails, oval cut-out panel above, spindle panel below
  const dw = 0.84, dm = mat('doorWhite');
  for (const s of [-1, 1]) box(g, 0.08, 2.0, 0.045, dm, doorX + s * (dw / 2 - 0.04), 0, z0, {});
  for (const [yy, hh] of [[0, 0.16], [0.88, 0.14], [1.92, 0.1]]) box(g, dw, hh, 0.045, dm, doorX, yy, z0, {});
  const pw = dw - 0.16, ph = 0.9;
  const panel = new THREE.Shape([new THREE.Vector2(-pw / 2, 0), new THREE.Vector2(pw / 2, 0), new THREE.Vector2(pw / 2, ph), new THREE.Vector2(-pw / 2, ph)]);
  const hole = new THREE.Path(); hole.absellipse(0, ph / 2, pw * 0.36, ph * 0.4, 0, Math.PI * 2, true);
  panel.holes.push(hole);
  const pg = new THREE.ExtrudeGeometry(panel, { depth: 0.025, bevelEnabled: false, curveSegments: 28 });
  const pm = new THREE.Mesh(pg, dm); pm.position.set(doorX, 1.02, z0 - 0.012); pm.castShadow = true; g.add(pm);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 6, 40), dm);
  ring.scale.set(pw * 0.36, ph * 0.4, 1); ring.position.set(doorX, 1.02 + ph / 2, z0 - 0.02); g.add(ring);
  for (let i = 0; i < 7; i++) box(g, 0.025, 0.72, 0.025, dm, doorX - 0.27 + i * 0.09, 0.16, z0, { shadow: false });
  const ds = box(g, dw - 0.16, 1.76, 0.005, screen, doorX, 0.16, z0 + 0.03, { shadow: false }); ds.renderOrder = 3;
  box(g, 0.03, 0.12, 0.05, mat('black'), doorX - dw / 2 + 0.12, 0.95, z0 - 0.04, { shadow: false });
  // west face
  box(g, 0.08, 0.55, -z0, 'shingles', x0, 0, z0 / 2, { collide: true });
  const sw = box(g, 0.01, 1.65, -z0 - 0.1, screen, x0, 0.6, z0 / 2, { shadow: false }); sw.renderOrder = 3;
  // east face (whole porch depth incl. the NE corner)
  box(g, 0.08, 0.55, 3.0 - z0, 'shingles', x1 - 0.04, 0, (z0 + 3.0) / 2, { collide: true });
  const se = box(g, 0.01, 1.65, 3.0 - z0, screen, x1 - 0.04, 0.6, (z0 + 3.0) / 2, { shadow: false }); se.renderOrder = 3;
  for (const pz of [z0, -0.3, 1.35, 3.0]) box(g, 0.11, 2.3, 0.11, tb, x1 - 0.05, 0, pz, {});
  // porch shed roof (shallow, front edge level with the main eave)
  const pr = new THREE.Mesh(boxGeo2(x1 - x0 + 0.6, 0.08, -z0 + 0.5), mat('roof'));
  pr.position.set((x0 + x1) / 2, 2.38, z0 / 2 - 0.15); pr.rotation.x = -0.12; pr.castShadow = true; g.add(pr);
  box(g, x1 - x0 + 0.6, 0.2, 0.05, color('#ececea', 0.5), (x0 + x1) / 2, 2.12, z0 - 0.4, { shadow: false });
  box(g, x1 - x0 + 0.6, 0.1, 0.12, color('#f1f1ee', 0.5), (x0 + x1) / 2, 2.18, z0 - 0.48, { shadow: false }); // gutter
  box(g, x1 - x0, 0.14, 0.12, tb, (x0 + x1) / 2, 2.28, z0, { shadow: false });
  // porch ceiling
  box(g, x1 - x0, 0.02, -z0, color('#d9c7a3', 0.8), (x0 + x1) / 2, 2.32, z0 / 2, { shadow: false });
  // step at the screen door
  box(g, 1.0, 0.25, 0.4, 'deckWood', doorX, -0.45, z0 - 0.25, { walk: true });
  // porch furniture seen through the screens: wicker chair, side table, hanging petunia baskets, sun hat
  const wick = color('#b08550', 0.85);
  box(g, 0.62, 0.42, 0.6, wick, 6.2, 0, -1.15, {});
  box(g, 0.62, 0.6, 0.1, wick, 6.2, 0.42, -0.85, {});
  for (const s of [-1, 1]) box(g, 0.08, 0.22, 0.6, wick, 6.2 + s * 0.3, 0.42, -1.15, {});
  box(g, 0.45, 0.55, 0.45, color('#2a8f86', 0.6), 10.9, 0, -1.25, {});
  const potM = color('#3a3530', 0.8), bloom = [color('#e0457a', 0.8), color('#d0233f', 0.8), color('#f06aa0', 0.8)], leaf = color('#4f8a35', 0.9);
  for (const [bx, i] of [[6.0, 0], [8.9, 1], [10.0, 2], [12.0, 0]]) {
    box(g, 0.01, 0.4, 0.01, mat('black'), bx, 1.88, -1.55, { shadow: false });
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), potM); pot.position.set(bx, 1.86, -1.55); g.add(pot);
    for (let k = 0; k < 7; k++) {
      const a = k * 0.9 + i, r = k ? 0.14 : 0;
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(k ? 0.08 : 0.11, 0), k % 3 === 2 ? leaf : bloom[(i + k) % 3]);
      b.position.set(bx + Math.cos(a) * r, 1.86 - (k ? 0.05 + (k % 2) * 0.06 : -0.04), -1.55 + Math.sin(a) * r); g.add(b);
    }
  }
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 20), color('#e8d9a8', 0.9)); hat.position.set(6.62, 1.25, -0.06); hat.rotation.x = Math.PI / 2; g.add(hat);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), hat.material); crown.position.set(6.62, 1.25, -0.07); crown.rotation.x = -Math.PI / 2; g.add(crown);
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
  // three bright green plastic Adirondack chairs against the wall facing the rail + glass side table
  adirondack(g, 1.0, D + 0.75, 0.12, '#33b84a');
  adirondack(g, 2.75, D + 0.75, 0.0, '#33b84a');
  adirondack(g, 4.5, D + 0.75, -0.1, '#33b84a');
  const gl = color('#a9c7cf', 0.1, { transparent: true, opacity: 0.45 });
  box(g, 0.45, 0.015, 0.45, gl, 1.88, y + 0.45, D + 0.45, { shadow: false });
  box(g, 0.45, 0.015, 0.45, gl, 1.88, y + 0.15, D + 0.45, { shadow: false });
  for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) box(g, 0.02, 0.45, 0.02, mat('chrome'), 1.88 + lx, y, D + 0.45 + lz, { shadow: false });
  // security light under the soffit
  box(g, 0.16, 0.12, 0.1, color('#2a2a2a', 0.5), 5.2, WALL_TOP - 0.42, D + 0.06, { shadow: false });
}

export function adirondack(parent, x, z, ry, hex) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  const m = color(hex, 0.45);
  for (let i = 0; i < 5; i++) { const sl = box(g, 0.6, 0.03, 0.1, m, 0, 0.36 - i * 0.025, 0.28 - i * 0.12, {}); sl.rotation.x = 0.12; }
  for (const sx of [-0.33, 0.33]) {
    box(g, 0.05, 0.6, 0.06, m, sx, 0, 0.3, {}); // front legs up to the arm
    const rl = box(g, 0.05, 0.08, 0.85, m, sx, 0.22, 0.0, {}); rl.rotation.x = 0.28; // rear runner
    box(g, 0.16, 0.03, 0.66, m, sx * 1.06, 0.6, 0.06, {}); // wide flat arm
  }
  for (let i = -3; i <= 3; i++) {
    const hh = 0.95 - Math.abs(i) * Math.abs(i) * 0.025;
    const s = box(g, 0.075, hh, 0.025, m, i * 0.083, 0.3, -0.22, {}); s.rotation.x = -0.35; s.position.z -= 0.06;
  }
  box(g, 0.62, 0.05, 0.03, m, 0, 0.62, -0.42, {}).rotation.x = -0.35;
  return g;
}
