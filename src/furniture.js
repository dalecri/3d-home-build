// Reusable furniture pieces. All take (parent, x, z, ry) with y = floor.
// Local frame: piece faces +z (the "front" is toward +z before rotation).
import * as THREE from 'three';
import { box, cyl, color, mat } from './lib.js';
import { tex } from './textures.js';

export function group(parent, x, z, ry = 0, y = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g;
}
export function fabricMat(base, pattern = 0.12, seed = 121, tile = 0.5) {
  const m = new THREE.MeshStandardMaterial({ map: tex('fabric', { base, pattern, seed }), roughness: 0.95 });
  m.userData.tile = tile; return m;
}

// Mid-century sofa: low arms, tapered legs, quilted back.
export function sofa(parent, x, z, ry, { len = 2.0, fabric = '#2f6f73', legs = '#5a3a22' } = {}) {
  const g = group(parent, x, z, ry);
  const f = fabricMat(fabric, 0.1, 7), l = color(legs, 0.5);
  box(g, len, 0.2, 0.85, f, 0, 0.17, 0);
  box(g, len - 0.2, 0.14, 0.62, f, 0, 0.37, 0.08);
  box(g, len, 0.5, 0.2, f, 0, 0.33, -0.33);
  for (const s of [-1, 1]) box(g, 0.12, 0.26, 0.85, f, s * (len / 2 - 0.06), 0.37, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.02, 0.012, 0.17, l, sx * (len / 2 - 0.1), 0, sz * 0.33);
  return g;
}

// Club armchair (blue damask).
export function armchair(parent, x, z, ry, { fabric = '#2c5f8c' } = {}) {
  const g = group(parent, x, z, ry);
  const f = fabricMat(fabric, 0.14, 9);
  box(g, 0.95, 0.24, 0.85, f, 0, 0.12, 0);
  box(g, 0.7, 0.12, 0.62, f, 0, 0.36, 0.08);
  box(g, 0.95, 0.5, 0.22, f, 0, 0.36, -0.32);
  for (const s of [-1, 1]) box(g, 0.14, 0.32, 0.85, f, s * 0.41, 0.36, 0);
  for (const s of [-1, 1]) box(g, 0.05, 0.03, 0.5, color('#5a3a22', 0.4), s * 0.41, 0.68, 0.12);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.02, 0.015, 0.12, color('#3a2414', 0.5), sx * 0.38, 0, sz * 0.33);
  return g;
}

export function coffeeTable(parent, x, z, ry, { w = 1.5, d = 0.55, h = 0.42, wood = '#7a4a2a' } = {}) {
  const g = group(parent, x, z, ry);
  const m = color(wood, 0.45);
  box(g, w, 0.04, d, m, 0, h - 0.04, 0);
  box(g, w - 0.08, 0.07, d - 0.08, m, 0, h - 0.11, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.05, h - 0.04, 0.05, m, sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06));
  return g;
}

// Rug: flat textured plane slightly above floor.
export function rug(parent, x, z, ry, w, d, texture) {
  const m = new THREE.MeshStandardMaterial({ map: texture, roughness: 1 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
  mesh.rotation.x = -Math.PI / 2; mesh.rotation.z = ry; mesh.position.set(x, 0.006, z); mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}

// Wood chandelier with N amber glass tulip shades.
export function chandelier(parent, x, z, ceil, { arms = 5, drop = 0.55, wood = '#9a5a2a', glass = '#e8b673' } = {}) {
  const g = group(parent, x, z, 0, ceil);
  const w = color(wood, 0.4), gl = color(glass, 0.3, { emissive: new THREE.Color(glass), emissiveIntensity: 0.6, transparent: true, opacity: 0.92 });
  cyl(g, 0.01, 0.01, drop, color('#6b4a2a', 0.5), 0, -drop, 0, 6);
  cyl(g, 0.05, 0.03, 0.18, w, 0, -drop - 0.12, 0);
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.04), w);
    arm.position.set(Math.cos(a) * 0.17, -drop - 0.05, Math.sin(a) * 0.17); arm.rotation.y = -a; g.add(arm);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.13, 12, 1, true), gl);
    shade.material.side = THREE.DoubleSide;
    shade.position.set(Math.cos(a) * 0.32, -drop + 0.02, Math.sin(a) * 0.32); g.add(shade);
  }
  const light = new THREE.PointLight('#ffcf8a', 2.2, 5.5, 1.6); light.position.set(0, -drop - 0.05, 0); g.add(light);
  return g;
}

// Table lamp: ceramic base + drum shade, with a warm point light.
export function tableLamp(parent, x, y, z, { base = '#e2d6c0', shade = '#f2c6b4', h = 0.55, light = 1.2 } = {}) {
  const g = group(parent, x, z, 0, y);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), color(base, 0.5)); b.scale.set(1, 1.35, 1); b.position.y = 0.15; b.castShadow = true; g.add(b);
  cyl(g, 0.015, 0.015, 0.12, mat('brass'), 0, 0.28, 0);
  const sm = color(shade, 0.9, { emissive: new THREE.Color(shade), emissiveIntensity: 0.55, side: THREE.DoubleSide });
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.24, 20, 1, true), sm); s.position.y = h - 0.12; g.add(s);
  if (light) { const l = new THREE.PointLight('#ffd7a8', light, 3.2, 1.8); l.position.y = h - 0.15; g.add(l); }
  return g;
}

// Retro chrome dinette chair: coral seat, cream back with handle cut-out.
export function dinetteChair(parent, x, z, ry) {
  const g = group(parent, x, z, ry);
  const coral = color('#e07a5f', 0.45), cream = color('#e6ddc5', 0.5), chrome = mat('chrome');
  box(g, 0.44, 0.07, 0.44, coral, 0, 0.44, 0);
  const back = box(g, 0.46, 0.36, 0.06, cream, 0, 0.62, -0.24); back.rotation.x = -0.1;
  box(g, 0.4, 0.2, 0.065, coral, 0, 0.66, -0.235).rotation.x = -0.1;
  for (const s of [-1, 1]) {
    cyl(g, 0.012, 0.012, 0.44, chrome, s * 0.2, 0, 0.18, 8);
    cyl(g, 0.012, 0.012, 0.95, chrome, s * 0.2, 0, -0.22, 8);
  }
  return g;
}

// Round glass-top dinette table on chrome base.
export function glassTable(parent, x, z, { r = 0.5 } = {}) {
  const g = group(parent, x, z);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.015, 40), new THREE.MeshPhysicalMaterial({ color: '#1a1a1a', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.75 }));
  top.position.y = 0.74; g.add(top);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const leg = cyl(g, 0.014, 0.014, 0.73, mat('chrome'), Math.cos(a) * 0.28, 0, Math.sin(a) * 0.28, 8);
    leg.rotation.z = Math.cos(a) * 0.12; leg.rotation.x = -Math.sin(a) * 0.12;
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.012, 6, 32), mat('chrome')); ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  return g;
}

// Stained-glass "Tiffany" drum pendant (amber/cream panels with scalloped skirt).
export function tiffanyPendant(parent, x, z, ceil, { r = 0.32, drop = 0.42 } = {}) {
  const g = group(parent, x, z, 0, ceil);
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const ctx = c.getContext('2d');
  for (let i = 0; i < 24; i++) { ctx.fillStyle = i % 2 ? '#e9c58a' : '#f3dcae'; ctx.fillRect(i * 512 / 24, 0, 512 / 24, 128); }
  ctx.fillStyle = '#5a3a1e'; for (let i = 0; i <= 24; i++) ctx.fillRect(i * 512 / 24 - 1, 0, 2, 128);
  ctx.fillRect(0, 40, 512, 3); ctx.fillRect(0, 84, 512, 3);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  const gm = new THREE.MeshStandardMaterial({ map: t, emissive: '#ffcf8a', emissiveMap: t, emissiveIntensity: 0.8, roughness: 0.4, side: THREE.DoubleSide });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r, 0.16, 24, 1, true), gm); top.position.y = -drop + 0.08; g.add(top);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.12, 24, 1, true), gm); band.position.y = -drop - 0.06; g.add(band);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    const sc = new THREE.Mesh(new THREE.CircleGeometry(0.06, 10, 0, Math.PI), gm);
    sc.position.set(Math.cos(a) * r, -drop - 0.12, Math.sin(a) * r); sc.rotation.y = -a + Math.PI / 2; sc.rotation.z = Math.PI; g.add(sc);
  }
  cyl(g, 0.012, 0.012, drop - 0.16, mat('brass'), 0, -drop + 0.16, 0, 6);
  const l = new THREE.PointLight('#ffd08f', 2.0, 5, 1.6); l.position.y = -drop - 0.05; g.add(l);
  return g;
}

// Sheer white curtain panel (gently folded) hanging from a rod.
export function sheer(parent, x0, x1, z, y1, { side = 'n', color: col = '#ffffff', opacity = 0.75, h = null } = {}) {
  const w = Math.abs(x1 - x0), hh = h ?? y1 - 0.02, seg = Math.max(8, Math.round(w * 14));
  const geo = new THREE.PlaneGeometry(w, hh, seg, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 22) * 0.025);
  geo.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: col, transparent: opacity < 1, opacity, roughness: 1, side: THREE.DoubleSide, depthWrite: opacity >= 1 });
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set((x0 + x1) / 2, y1 - hh / 2, z);
  mesh.rotation.y = { n: 0, s: 0, e: Math.PI / 2, w: Math.PI / 2 }[side];
  mesh.castShadow = opacity >= 1;
  parent.add(mesh); return mesh;
}

// Potted plant: terracotta pot with a cluster of leaves.
export function plant(parent, x, y, z, { s = 1, pot = '#b5653a', leaf = '#3f7a35' } = {}) {
  const g = group(parent, x, z, 0, y);
  cyl(g, 0.12 * s, 0.09 * s, 0.2 * s, color(pot, 0.8), 0, 0, 0);
  const lm = color(leaf, 0.7);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, h = (0.25 + (i % 3) * 0.12) * s;
    const leafM = new THREE.Mesh(new THREE.SphereGeometry(0.08 * s, 8, 6), lm);
    leafM.scale.set(0.5, 1.6, 0.25); leafM.position.set(Math.cos(a) * 0.08 * s, 0.2 * s + h * 0.6, Math.sin(a) * 0.08 * s);
    leafM.rotation.z = Math.cos(a) * 0.5; leafM.rotation.x = Math.sin(a) * 0.5; leafM.castShadow = true; g.add(leafM);
  }
  return g;
}

// Ornate oval / round mirror with frame.
export function mirror(parent, x, y, z, facing, { w = 0.4, h = 0.6, frame = '#b8913f', round = true } = {}) {
  const g = group(parent, x, z, { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[facing], y);
  const fm = color(frame, 0.4, { metalness: 0.5 });
  const mm = new THREE.MeshStandardMaterial({ color: '#c9d3d6', roughness: 0.05, metalness: 1 });
  if (round) {
    const fr = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), fm); fr.scale.set(w, h, 1); fr.position.z = 0.01; g.add(fr);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), mm); gl.scale.set(w, h, 1); gl.position.z = 0.02; g.add(gl);
  } else {
    box(g, w, h, 0.03, fm, 0, -h / 2, 0.015, { shadow: false });
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, h - 0.08), mm); gl.position.z = 0.032; g.add(gl);
  }
  return g;
}

// Small two-door cabinet / sideboard.
export function cabinet(parent, x, z, ry, { w = 0.7, h = 0.8, d = 0.4, wood = '#a8692f' } = {}) {
  const g = group(parent, x, z, ry);
  const m = color(wood, 0.5);
  box(g, w, h, d, m, 0, 0.06, 0);
  box(g, w + 0.06, 0.03, d + 0.04, m, 0, h + 0.06, 0);
  box(g, w - 0.04, 0.06, d - 0.02, color('#5a3418', 0.6), 0, 0, 0);
  for (const s of [-1, 1]) box(g, w / 2 - 0.05, h - 0.12, 0.015, color(new THREE.Color(wood).multiplyScalar(0.85), 0.5), s * w / 4, 0.12, d / 2);
  return g;
}

// Dresser / nightstand with rattan-front drawers.
export function nightstand(parent, x, z, ry, { w = 0.55, h = 0.68, d = 0.42, drawers = 2, wood = '#a85f2a', front = '#c99a5a' } = {}) {
  const g = group(parent, x, z, ry);
  const m = color(wood, 0.45), fr = color(front, 0.8);
  box(g, w, h, d, m, 0, 0.04, 0);
  const dh = (h - 0.1) / drawers;
  for (let i = 0; i < drawers; i++) {
    box(g, w - 0.08, dh - 0.04, 0.01, fr, 0, 0.08 + i * dh, d / 2 + 0.003);
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), mat('brass')); k.position.set(0, 0.08 + i * dh + dh / 2, d / 2 + 0.02); g.add(k);
  }
  return g;
}
