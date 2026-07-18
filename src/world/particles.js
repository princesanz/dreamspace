import * as THREE from 'three';
import { COLORS, rand, randRange, randSign, makeGlow, track } from './util.js';

// ---------------------------------------------------------------- dust ----
// A tube of twinkling points hugging the whole flight path. Twinkle, size
// and fog attenuation are all done in one custom shader so 2500 points cost
// a single draw call.
export function createDust(scene, curve, { count = 2500 } = {}) {
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const cCyan = new THREE.Color(COLORS.cyan);
  const cViolet = new THREE.Color(COLORS.violet);
  const cPortal = new THREE.Color(COLORS.portal);
  const _v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const t = rand();
    curve.getPointAt(t, _v);
    // Random offset around the path, hollow near the camera line.
    const radius = 1.8 + Math.pow(rand(), 1.6) * 13;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    positions[i * 3] = _v.x + radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = _v.y + radius * Math.cos(phi) * 0.7;
    positions[i * 3 + 2] = _v.z + radius * Math.sin(phi) * Math.sin(theta);

    scales[i] = randRange(0.4, 1.4);
    phases[i] = rand() * Math.PI * 2;

    const pick = rand();
    const c = pick < 0.6 ? cCyan : pick < 0.85 ? cViolet : cPortal;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: 1 },
      uSize: { value: 36 * Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uSpeed;
      uniform float uSize;
      attribute float aScale;
      attribute float aPhase;
      attribute vec3 aColor;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * uSpeed;
        p.y += sin(t * 0.22 + aPhase) * 0.4;
        p.x += cos(t * 0.17 + aPhase * 1.7) * 0.35;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float depth = max(-mv.z, 0.1);
        gl_PointSize = uSize * aScale * (0.75 + 0.25 * sin(t * 0.9 + aPhase)) / depth;
        float twinkle = 0.55 + 0.45 * sin(t * 0.8 + aPhase * 2.1);
        float fogF = exp(-pow(depth * 0.04, 2.0)); // matches scene FogExp2
        vAlpha = twinkle * fogF;
        vColor = aColor;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.08, d) * vAlpha;
        gl_FragColor = vec4(vColor * a, a);
      }
    `,
  });
  track(geo, mat);

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false; // spans the whole path; culling would pop
  scene.add(points);

  return {
    points,
    update(elapsed) {
      mat.uniforms.uTime.value = elapsed;
    },
    setDensity(f) {
      geo.setDrawRange(0, Math.floor(count * f));
    },
    setSpeed(s) {
      mat.uniforms.uSpeed.value = s;
    },
  };
}

// -------------------------------------------------------------- comets ----
// Every 4–8s a bright head with a fading vertex-color trail streaks across
// the deep background, spawned relative to the camera so it's always seen.
const TRAIL = 22;

export function createComets(scene, { enabled = true } = {}) {
  const pool = [];

  for (let i = 0; i < 3; i++) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(TRAIL * 3);
    const colors = new Float32Array(TRAIL * 3);
    const head = new THREE.Color(COLORS.portal);
    const mid = new THREE.Color(COLORS.cyan);
    for (let j = 0; j < TRAIL; j++) {
      const f = j / (TRAIL - 1);
      const c = head.clone().lerp(mid, Math.min(f * 2, 1)).multiplyScalar(Math.pow(1 - f, 1.6));
      colors[j * 3] = c.r;
      colors[j * 3 + 1] = c.g;
      colors[j * 3 + 2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    track(geo, mat);
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    line.visible = false;

    const headGlow = makeGlow(COLORS.portal, 1.2, 0);
    headGlow.visible = false;

    scene.add(line, headGlow);
    pool.push({
      line,
      headGlow,
      active: false,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      history: [],
      life: 0,
      maxLife: 0,
    });
  }

  let nextSpawn = randRange(2, 5);

  function spawn(camPos) {
    const c = pool.find((p) => !p.active);
    if (!c) return;
    const sideX = randSign();
    c.pos.set(
      camPos.x + sideX * randRange(26, 50),
      camPos.y + randRange(6, 26),
      camPos.z - randRange(38, 70),
    );
    c.vel
      .set(-sideX * randRange(0.7, 1), -randRange(0.15, 0.45), randRange(-0.15, 0.15))
      .normalize()
      .multiplyScalar(randRange(26, 46));
    c.history.length = 0;
    c.life = 0;
    c.maxLife = randRange(2.2, 3.2);
    c.active = true;
    c.line.visible = true;
    c.headGlow.visible = true;
  }

  return {
    update(dt, elapsed, camPos) {
      if (enabled) {
        nextSpawn -= dt;
        if (nextSpawn <= 0) {
          spawn(camPos);
          nextSpawn = randRange(4, 8);
        }
      }

      for (const c of pool) {
        if (!c.active) continue;
        c.life += dt;
        c.pos.addScaledVector(c.vel, dt);
        c.history.unshift(c.pos.clone());
        if (c.history.length > TRAIL) c.history.length = TRAIL;

        const attr = c.line.geometry.getAttribute('position');
        for (let j = 0; j < TRAIL; j++) {
          const p = c.history[Math.min(j, c.history.length - 1)] || c.pos;
          attr.setXYZ(j, p.x, p.y, p.z);
        }
        attr.needsUpdate = true;

        const f = c.life / c.maxLife;
        const fade = Math.sin(Math.min(f, 1) * Math.PI); // ramp in, ramp out
        c.line.material.opacity = fade * 0.9;
        c.headGlow.material.opacity = fade * 0.9;
        c.headGlow.position.copy(c.pos);

        if (c.life >= c.maxLife) {
          c.active = false;
          c.line.visible = false;
          c.headGlow.visible = false;
        }
      }
    },
  };
}

// -------------------------------------------------------- cursor trail ----
// Screen-space particle wake following the pointer. Pure 2D canvas overlay:
// costs nothing on the GPU scene and is trivially disabled on touch/reduced.
export function createCursorTrail(canvas, { enabled = true } = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio, 2);
  const particles = [];
  let on = enabled;

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  }
  resize();

  const palette = ['127,216,255', '185,168,255', '232,246,255'];

  function onMove(e) {
    if (!on) return;
    for (let i = 0; i < 2; i++) {
      if (particles.length > 90) particles.shift();
      particles.push({
        x: e.clientX + randRange(-2, 2),
        y: e.clientY + randRange(-2, 2),
        vx: randRange(-14, 14),
        vy: randRange(-10, 18),
        life: 1,
        size: randRange(0.8, 2.6),
        rgb: palette[(Math.random() * palette.length) | 0],
      });
    }
  }
  window.addEventListener('pointermove', onMove, { passive: true });

  return {
    resize,
    setEnabled(v) {
      on = v;
      if (!v) particles.length = 0;
    },
    update(dt) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!on || particles.length === 0) return;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt * 1.7;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const a = p.life * p.life * 0.55;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.rgb},${a.toFixed(3)})`;
        ctx.arc(p.x * dpr, p.y * dpr, p.size * p.life * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}
