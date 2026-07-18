import * as THREE from 'three';

// Palette — pinned by docs/SPEC.md §2. CSS twins live in style.css.
export const COLORS = {
  void: 0x030308,
  cyan: 0x7fd8ff,
  violet: 0xb9a8ff,
  violetDeep: 0x8f6bff,
  amber: 0xffb45e,
  portal: 0xe8f6ff,
  text: 0x8f88b8,
};

export const TINTS = {
  cyan: COLORS.cyan,
  amber: COLORS.amber,
  violet: COLORS.violet,
};

// Deterministic PRNG so the world is identical on every visit.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = mulberry32(20260706);
export const randRange = (a, b) => a + rand() * (b - a);
export const randSign = () => (rand() < 0.5 ? -1 : 1);

let _glowTex = null;

// Shared radial-gradient sprite texture — the one glow map every halo reuses.
export function glowTexture() {
  if (_glowTex) return _glowTex;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.14)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  _glowTex = new THREE.CanvasTexture(canvas);
  _glowTex.colorSpace = THREE.SRGBColorSpace;
  return _glowTex;
}

export function makeGlow(color, scale = 4, opacity = 0.8) {
  const mat = new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(scale);
  return sprite;
}

// Framerate-independent lerp factor. lambda 3.7 ≈ the spec's 0.06/frame at 60fps.
export function damp(current, target, lambda, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function dampV3(current, target, lambda, dt) {
  const f = 1 - Math.exp(-lambda * dt);
  current.lerp(target, f);
  return current;
}

// Shared small geometries (reused across islands; disposed once on teardown).
export const sharedGeo = {
  tetra: new THREE.TetrahedronGeometry(0.16),
  tetraSmall: new THREE.TetrahedronGeometry(0.07),
};

const disposables = new Set();
export function track(...objs) {
  objs.forEach((o) => disposables.add(o));
  return objs[0];
}

export function disposeAll() {
  disposables.forEach((o) => {
    if (o.dispose) o.dispose();
  });
  disposables.clear();
  Object.values(sharedGeo).forEach((g) => g.dispose());
  if (_glowTex) { _glowTex.dispose(); _glowTex = null; }
}
