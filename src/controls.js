// First-person walking: WASD/arrows + mouse look (pointer lock), touch joystick + drag-look.
// Collides against axis-aligned colliders, follows the height of walkable meshes.
import * as THREE from 'three';
import { colliders, walkables } from './lib.js';

const EYE = 1.6, R = 0.22, STEP = 0.5;

export class Walker {
  constructor(camera, dom) {
    this.camera = camera; this.dom = dom;
    this.yaw = 0; this.pitch = 0;
    this.feet = new THREE.Vector3(2, 0, 4.5);
    this.keys = {}; this.move = { x: 0, y: 0 }; this.enabled = false;
    this.ray = new THREE.Raycaster(); this.down = new THREE.Vector3(0, -1, 0);
    this.fly = false; this.eye = EYE;
    addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== dom) return;
      this.look(e.movementX * 0.0022, e.movementY * 0.0022);
    });
    this.initTouch();
  }
  look(dx, dy) {
    this.yaw -= dx; this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - dy));
  }
  initTouch() {
    const stick = document.getElementById('stick'), knob = document.getElementById('knob');
    let moveId = null, lookId = null, sx = 0, sy = 0, lx = 0, ly = 0;
    const el = this.dom;
    el.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) {
        if (t.clientX < innerWidth * 0.45 && moveId === null) {
          moveId = t.identifier; sx = t.clientX; sy = t.clientY;
          if (stick) { stick.style.display = 'block'; stick.style.left = sx - 50 + 'px'; stick.style.top = sy - 50 + 'px'; }
        } else if (lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
      }
      this.enabled = true; e.preventDefault();
    }, { passive: false });
    el.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === moveId) {
          let dx = (t.clientX - sx) / 45, dy = (t.clientY - sy) / 45;
          const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
          this.move.x = dx; this.move.y = -dy;
          if (knob) knob.style.transform = `translate(${dx * 30}px, ${dy * 30}px)`;
        } else if (t.identifier === lookId) {
          this.look((t.clientX - lx) * 0.005, (t.clientY - ly) * 0.005); lx = t.clientX; ly = t.clientY;
        }
      }
      e.preventDefault();
    }, { passive: false });
    const end = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === moveId) { moveId = null; this.move.x = this.move.y = 0; if (stick) stick.style.display = 'none'; if (knob) knob.style.transform = ''; }
        if (t.identifier === lookId) lookId = null;
      }
    };
    el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
  }
  setPose(pos, look) {
    this.feet.set(pos[0], pos[1], pos[2]);
    const gy = this.groundAt(pos[0], pos[2], pos[1] + 0.2);
    this.feet.y = gy ?? pos[1] - EYE;
    this.eye = pos[1] - this.feet.y;
    const d = new THREE.Vector3(look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]).normalize();
    this.yaw = Math.atan2(-d.x, -d.z); this.pitch = Math.asin(d.y);
    this.apply();
  }
  groundAt(x, z, fromY) {
    this.ray.set(new THREE.Vector3(x, fromY, z), this.down); this.ray.far = 60;
    const hit = this.ray.intersectObjects(walkables, false)[0];
    return hit ? hit.point.y : null;
  }
  snapGround(force) {
    const y = this.groundAt(this.feet.x, this.feet.z, this.feet.y + STEP + (force ? 0.3 : 0));
    if (y !== null) this.feet.y = y;
  }
  blocked(x, z) {
    const y0 = this.feet.y + 0.35, y1 = this.feet.y + 1.7;
    for (const c of colliders) {
      if (c.y1 < y0 || c.y0 > y1) continue;
      if (x + R > c.x0 && x - R < c.x1 && z + R > c.z0 && z - R < c.z1) return true;
    }
    return false;
  }
  update(dt) {
    const k = this.keys;
    let f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) + this.move.y;
    let s = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) + this.move.x;
    if (k.KeyQ) this.yaw += dt * 1.8;
    if (k.KeyE) this.yaw -= dt * 1.8;
    const speed = (k.ShiftLeft || k.ShiftRight ? 3.2 : 1.6) * dt;
    if (f || s) {
      this.eye += (EYE - this.eye) * Math.min(1, dt * 3);
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      const dx = (-sin * f + cos * s) * speed, dz = (-cos * f - sin * s) * speed;
      const nx = this.feet.x + dx, nz = this.feet.z + dz;
      const tryMove = (x, z) => {
        if (this.blocked(x, z)) return false;
        const gy = this.groundAt(x, z, this.feet.y + STEP);
        if (gy === null || gy < this.feet.y - 1.2) return false; // ledge
        this.feet.x = x; this.feet.z = z; this.feet.y += (gy - this.feet.y) * 0.6; return true;
      };
      if (!tryMove(nx, nz)) { tryMove(nx, this.feet.z) || tryMove(this.feet.x, nz); }
    }
    if (f || s) this.snapGround(false);
    this.apply();
  }
  apply() {
    this.camera.position.set(this.feet.x, this.feet.y + this.eye, this.feet.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
