import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ROOMS, VIEWS, W, D } from './plan.js';
import { buildShell } from './shell.js';
import { buildSite, groundY } from './site.js';
import { Walker } from './controls.js';
import * as living from './rooms/living.js';
import * as dinette from './rooms/dinette.js';
import * as kitchen from './rooms/kitchen.js';
import * as den from './rooms/den.js';
import * as bedroom from './rooms/bedroom.js';
import * as bath from './rooms/bath.js';

const params = new URLSearchParams(location.search);
const SHOT = params.has('shot');

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: SHOT });
renderer.setPixelRatio(SHOT ? 1 : Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.05, 600);

// ---- sky + fog ----
{
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {},
    vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} ',
    fragmentShader: 'varying vec3 vp; void main(){ float h = max(vp.y, 0.0); vec3 c = mix(vec3(0.86,0.92,0.97), vec3(0.36,0.6,0.9), pow(h, 0.6)); gl_FragColor = vec4(c,1.0);} ',
  }));
  scene.add(sky);
  scene.fog = new THREE.Fog('#c9dbe6', 60, 260);
}

// ---- lights ----
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;
const hemi = new THREE.HemisphereLight('#e8f0ff', '#7a5a3a', 1.35);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3df', 2.6);
sun.position.set(-14, 26, 22); // high summer sun from the south-west (lake side)
sun.target.position.set(6, 0, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -22, right: 30, top: 26, bottom: -26, near: 1, far: 90 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

// interior fill: soft ceiling bounce per room (no shadows)
for (const [k, r] of Object.entries(ROOMS)) {
  if (k === 'porch') continue;
  const l = new THREE.PointLight('#fff6ea', k === 'bath' ? 1.2 : 2.6, 7, 1.2);
  l.position.set((r.x0 + r.x1) / 2, 2.15, (r.z0 + r.z1) / 2);
  scene.add(l);
}
// daylight spilling in through the big south window + sliders
for (const [x, z] of [[2.4, 5.2], [7.1, 5.3], [0.8, 4.6]]) {
  const l = new THREE.SpotLight('#eef6ff', 9, 9, 1.1, 0.9, 1.3);
  l.position.set(x, 2.0, z + (z > 5 ? 1.2 : 0)); l.target.position.set(x - (z > 5 ? 0 : -2), 0, z - 2); scene.add(l, l.target);
}

// ---- build ----
const world = new THREE.Group(); scene.add(world);
buildShell(world);
for (const m of [living, dinette, kitchen, den, bedroom, bath]) m.build(world);
buildSite(world, renderer);

// ---- controls ----
const walker = new Walker(camera, renderer.domElement);
const ui = {
  overlay: document.getElementById('overlay'), room: document.getElementById('room'),
  views: document.getElementById('views'), cmp: document.getElementById('compare'), cmpImg: document.getElementById('compareImg'), map: document.getElementById('map'),
};

function goView(name) {
  const v = VIEWS[name]; if (!v) return;
  const pos = [...v.pos], look = [...v.look];
  if (v.ground) { pos[1] += groundY(pos[0], pos[2]); look[1] += groundY(look[0], look[2]); }
  camera.fov = v.fov; camera.updateProjectionMatrix();
  walker.setPose(pos, look);
  const refs = window.__REFS || {};
  if (ui.cmp) {
    if (refs[name]) { ui.cmpImg.src = refs[name]; ui.cmp.dataset.has = '1'; } else { ui.cmp.dataset.has = ''; }
  }
}
window.goView = goView;

const startView = params.get('view') || 'living-east';
goView(startView);

if (SHOT) {
  document.body.classList.add('shot');
} else {
  // view buttons
  for (const [k, v] of Object.entries(VIEWS)) {
    const b = document.createElement('button'); b.textContent = v.label; b.onclick = (e) => { e.stopPropagation(); goView(k); };
    ui.views.appendChild(b);
  }
  const enter = () => {
    ui.overlay.classList.add('hidden');
    if (!matchMedia('(pointer: coarse)').matches) renderer.domElement.requestPointerLock?.();
  };
  document.getElementById('enter').onclick = enter;
  renderer.domElement.addEventListener('click', () => { if (!matchMedia('(pointer: coarse)').matches) renderer.domElement.requestPointerLock?.(); });
  document.addEventListener('pointerlockchange', () => { document.body.classList.toggle('locked', !!document.pointerLockElement); });
  addEventListener('keydown', (e) => {
    if (e.code === 'KeyC') document.body.classList.toggle('show-compare');
    if (e.code === 'KeyM') document.body.classList.toggle('hide-map');
  });
  document.getElementById('cmpBtn').onclick = (e) => { e.stopPropagation(); document.body.classList.toggle('show-compare'); };
}

// ---- minimap ----
const mctx = ui.map?.getContext('2d');
function drawMap() {
  if (!mctx) return;
  const s = 15, ox = 10, oy = 40, c = mctx;
  c.clearRect(0, 0, ui.map.width, ui.map.height);
  c.fillStyle = 'rgba(20,24,20,0.7)'; c.fillRect(0, 0, ui.map.width, ui.map.height);
  c.strokeStyle = '#9fb59a'; c.lineWidth = 1;
  for (const [k, r] of Object.entries(ROOMS)) {
    c.fillStyle = k === 'porch' ? 'rgba(120,150,170,0.25)' : 'rgba(200,190,160,0.25)';
    c.fillRect(ox + r.x0 * s, oy + r.z0 * s, (r.x1 - r.x0) * s, (r.z1 - r.z0) * s);
    c.strokeRect(ox + r.x0 * s, oy + r.z0 * s, (r.x1 - r.x0) * s, (r.z1 - r.z0) * s);
  }
  c.fillStyle = 'rgba(163,106,64,0.4)'; c.fillRect(ox - 2.6 * s, oy + D * s, (10.2 + 2.6) * s, 2.6 * s);
  c.fillStyle = '#cfe0c6'; c.font = '10px system-ui'; c.fillText('N ↑ road', ox, 12); c.fillText('lake ↓', ox, ui.map.height - 6);
  const px = ox + walker.feet.x * s, pz = oy + walker.feet.z * s;
  if (px > -10 && px < ui.map.width + 10 && pz > -10 && pz < ui.map.height + 10) {
    c.fillStyle = '#ffcf5a'; c.beginPath(); c.arc(px, pz, 4, 0, 7); c.fill();
    c.strokeStyle = '#ffcf5a'; c.beginPath(); c.moveTo(px, pz); c.lineTo(px - Math.sin(walker.yaw) * 12, pz - Math.cos(walker.yaw) * 12); c.stroke();
  }
}
function roomAt(x, z) {
  for (const r of Object.values(ROOMS)) {
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r.name;
    if (r.extra && x >= r.extra.x0 && x <= r.extra.x1 && z >= r.extra.z0 && z <= r.extra.z1) return r.name;
  }
  if (x > -3 && x < 10.3 && z > 5.9 && z < 8.7) return 'Lake-side deck';
  if (x < 0 && x > -3 && z > 2 && z < 6) return 'Lake-side deck';
  if (z > 26) return 'Shoreline';
  return 'Lot · 4,023 m²';
}

// ---- loop ----
const clock = new THREE.Clock();
let frames = 0, lastRoom = '';
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!SHOT) walker.update(dt);
  renderer.render(scene, camera);
  if (!SHOT) {
    const rn = roomAt(walker.feet.x, walker.feet.z);
    if (rn !== lastRoom && ui.room) { ui.room.textContent = rn; lastRoom = rn; }
    if (frames % 3 === 0) drawMap();
  }
  frames++;
  if (SHOT && frames >= 2) { window.__ready = true; return; }
  requestAnimationFrame(tick);
}
tick();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
