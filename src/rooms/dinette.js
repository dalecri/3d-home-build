// Dinette (photo 25): retro chrome set with coral/cream chairs, smoked-glass table,
// stained-glass drum pendant, wood-framed wall mirror + carved whatnot shelf over olive
// wainscot on the closet's south face ("mirror wall"), olive posts at both ends of it.
import * as THREE from 'three';
import { box, color, mat, cyl } from '../lib.js';
import { glassTable, group } from '../furniture.js';

export function build(root) {
  const g = new THREE.Group(); g.name = 'dinette'; root.add(g);
  const olive = mat('olive');
  const wood = color('#5e3418', 0.45);
  const redWood = color('#9a4a26', 0.45);
  const wallZ = 1.155; // south face of the closet (mirror wall)

  // ---- posts at both ends of the mirror wall ----
  box(g, 0.16, 2.4, 0.16, olive, 6.8, 0, 1.1, { collide: true }); // P2: closet SE corner (kitchen side)
  box(g, 0.16, 2.4 - 0.22, 0.16, olive, 4.6, 0, 1.5, { collide: true }); // P1: end of the wing wall, under the beam

  // ---- table + chairs ----
  const cx = 5.3, cz = 2.2;
  glassTable(g, cx, cz, { r: 0.5 });
  // chairs set slightly off-axis, as in the photo
  retroChair(g, cx - 0.6, cz + 0.05, Math.PI / 2 + 0.15);
  retroChair(g, cx + 0.6, cz - 0.05, -Math.PI / 2 + 0.15);
  retroChair(g, cx + 0.05, cz - 0.6, 0.15);
  retroChair(g, cx - 0.05, cz + 0.6, Math.PI + 0.15);
  stainedDrum(g, 5.6, 2.0, 2.4);

  // ---- wood-framed mirror with a vertical divider (on the mirror wall, faces south) ----
  const mw = 1.0, mh = 0.7, mx = 5.75, my = 1.17;
  const mm = new THREE.MeshStandardMaterial({ color: '#b9c4c4', roughness: 0.08, metalness: 0.9 });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), mm);
  glass.position.set(mx, my + mh / 2, wallZ + 0.02); g.add(glass);
  box(g, mw + 0.08, 0.05, 0.04, wood, mx, my + mh, wallZ + 0.02, { shadow: false });
  box(g, mw + 0.08, 0.05, 0.04, wood, mx, my - 0.05, wallZ + 0.02, { shadow: false });
  box(g, 0.05, mh + 0.1, 0.04, wood, mx - mw / 2 - 0.015, my - 0.05, wallZ + 0.02, { shadow: false });
  box(g, 0.05, mh + 0.1, 0.04, wood, mx + mw / 2 + 0.015, my - 0.05, wallZ + 0.02, { shadow: false });
  box(g, 0.035, mh, 0.03, wood, mx + 0.12, my, wallZ + 0.03, { shadow: false });
  // white bottle-shaped pendants reflected/hung in the mirror's right bay
  for (const [dx, y] of [[0.22, 1.42], [0.34, 1.3]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.3, 12), color('#f2efe6', 0.4));
    b.position.set(mx + dx, y, wallZ + 0.06); g.add(b);
  }

  // ---- carved red-wood whatnot shelf, left of the mirror ----
  const sh = group(g, 5.0, wallZ, 0, 1.12);
  box(sh, 0.07, 0.62, 0.02, redWood, 0, 0, 0.01, { shadow: false });
  for (let i = 0; i < 3; i++) {
    const w = 0.24 - i * 0.04;
    box(sh, w, 0.025, 0.11, redWood, 0, 0.06 + i * 0.2, 0.055, { shadow: false });
    // scrolled side brackets
    for (const s of [-1, 1]) box(sh, 0.03, 0.12, 0.02, redWood, s * (w / 2 - 0.02), 0.06 + i * 0.2 - 0.1, 0.03, { shadow: false });
  }
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.1, 10), color('#d8b25a', 0.5));
  vase.position.set(5.0, 1.12 + 0.6 + 0.05, wallZ + 0.06); g.add(vase);

  // ---- decorative plaques ----
  const disc = (x, y, z, r, c, ry = 0, rim = '#b88a3a') => {
    const d = new THREE.Group(); d.position.set(x, y, z); d.rotation.y = ry; g.add(d);
    const rimM = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.015, 28), color(rim, 0.35, { metalness: 0.4 }));
    rimM.rotation.x = Math.PI / 2; d.add(rimM);
    const face = new THREE.Mesh(new THREE.CircleGeometry(r * 0.78, 28), color(c, 0.5)); face.position.z = 0.009; d.add(face);
  };
  // dark floral plaque on the wing wall (faces east)
  disc(4.67, 1.85, 1.3, 0.11, '#2e3b2a', Math.PI / 2, '#3a2a1a');
  // round gilt plate on the kitchen-side post (faces south)
  disc(6.8, 1.68, 1.19, 0.11, '#d9cfa0');
  // small plaque above the shelf
  disc(4.8, 1.75, wallZ + 0.01, 0.08, '#4a5f86', 0, '#3a2a1a');

  // light switches
  box(g, 0.01, 0.12, 0.08, color('#f4f1e8', 0.6), 4.66, 1.12, 1.3, { shadow: false });
  box(g, 0.08, 0.12, 0.01, color('#f4f1e8', 0.6), 5.25, 1.12, wallZ + 0.01, { shadow: false });
  return g;
}

// 1950s chrome dinette chair: coral vinyl seat with cream piping, shaped back (coral front,
// cream rear) with a handle slot, tubular chrome legs running up the back sides.
function retroChair(parent, x, z, ry) {
  const g = group(parent, x, z, ry);
  const coral = color('#e8866a', 0.45), cream = color('#e0d2ae', 0.6), chrome = mat('chrome');
  box(g, 0.44, 0.06, 0.42, coral, 0, 0.44, 0.02);
  box(g, 0.46, 0.03, 0.44, cream, 0, 0.42, 0.02, { shadow: false });
  // back outline: wider at the top, rounded corners, slot near the top
  const sh = new THREE.Shape();
  const wb = 0.19, wt = 0.25, h = 0.36, r = 0.06;
  sh.moveTo(-wb, 0); sh.lineTo(wb, 0); sh.lineTo(wt, h - r); sh.quadraticCurveTo(wt, h, wt - r, h);
  sh.lineTo(-wt + r, h); sh.quadraticCurveTo(-wt, h, -wt, h - r); sh.lineTo(-wb, 0);
  const hole = new THREE.Path(); hole.moveTo(-0.07, h - 0.05); hole.lineTo(0.07, h - 0.05); hole.lineTo(0.07, h - 0.09); hole.lineTo(-0.07, h - 0.09); hole.lineTo(-0.07, h - 0.05);
  sh.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false, curveSegments: 6 });
  const back = new THREE.Mesh(geo, [cream, cream]); back.position.set(0, 0.6, -0.26); back.rotation.x = -0.12; back.castShadow = true; g.add(back);
  const face = new THREE.Mesh(new THREE.ShapeGeometry(sh, 6), coral); face.position.set(0, 0.6, -0.205); face.rotation.x = -0.12; g.add(face);
  for (const s of [-1, 1]) {
    cyl(g, 0.011, 0.011, 0.44, chrome, s * 0.2, 0, 0.19, 8);
    const rl = cyl(g, 0.011, 0.011, 0.86, chrome, s * 0.19, 0, -0.2, 8); rl.rotation.x = -0.08;
  }
  cyl(g, 0.008, 0.008, 0.38, chrome, 0, 0.12, 0, 6).rotation.z = Math.PI / 2;
  return g;
}

// Stained-glass drum pendant: tapered crown, straight band, scalloped skirt, amber/cream
// panels with dark leading. Glows warm.
function stainedDrum(parent, x, z, ceil) {
  const g = group(parent, x, z, 0, ceil);
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const ctx = c.getContext('2d');
  for (let i = 0; i < 20; i++) { ctx.fillStyle = i % 2 ? '#f0c27e' : '#f6dcaa'; ctx.fillRect(i * 512 / 20, 0, 512 / 20, 128); }
  ctx.fillStyle = '#6a3e1c'; for (let i = 0; i <= 20; i++) ctx.fillRect(i * 512 / 20 - 2, 0, 4, 128);
  ctx.fillRect(0, 0, 512, 5); ctx.fillRect(0, 123, 512, 5);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const gm = new THREE.MeshStandardMaterial({ map: t, emissive: '#ffc070', emissiveMap: t, emissiveIntensity: 0.9, roughness: 0.5, side: THREE.DoubleSide });
  const R = 0.36;
  cyl(g, 0.01, 0.01, 0.3, mat('black'), 0, -0.3, 0, 6);
  const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.04, 16), color('#4a2e1a', 0.5)); canopy.position.y = -0.02; g.add(canopy);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.08, 20, 1, true), gm); crown.position.y = -0.34; g.add(crown);
  const crown2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, R, 0.12, 20, 1, true), gm); crown2.position.y = -0.44; g.add(crown2);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.14, 20, 1, true), gm); band.position.y = -0.57; g.add(band);
  for (let i = 0; i < 20; i++) {
    const a = (i + 0.5) / 20 * Math.PI * 2;
    const sc = new THREE.Mesh(new THREE.CircleGeometry(0.056, 10, 0, Math.PI), gm);
    sc.position.set(Math.cos(a) * R, -0.64, Math.sin(a) * R); sc.rotation.y = -a + Math.PI / 2; sc.rotation.z = Math.PI; g.add(sc);
  }
  const l = new THREE.PointLight('#ffcf8a', 2.2, 5, 1.6); l.position.y = -0.55; g.add(l);
  return g;
}
