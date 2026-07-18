import * as THREE from 'three';
import { COLORS, rand, randRange, makeGlow, glowTexture, track } from '../util.js';

// Station 4 — the contact gate. Two counter-rotating rings, a soft core
// glow, and a stream of particles flowing through the ring toward the
// approaching camera.
export function createContact(scene, curve) {
  const group = new THREE.Group();
  const end = curve.getPointAt(1);
  const tangent = curve.getTangentAt(1);
  group.position.copy(end).addScaledVector(tangent, 6); // just past the path's end

  const ring1 = new THREE.Mesh(
    track(new THREE.TorusGeometry(2.7, 0.045, 16, 160)),
    track(new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.85 })),
  );
  const ring2 = new THREE.Mesh(
    track(new THREE.TorusGeometry(2.12, 0.028, 16, 140)),
    track(new THREE.MeshBasicMaterial({ color: COLORS.violetDeep, transparent: true, opacity: 0.8 })),
  );

  const core = makeGlow(COLORS.portal, 8.5, 0.5);
  const halo = makeGlow(COLORS.cyan, 15, 0.2);

  // Particle stream: spawned behind the portal, converging through the ring
  // and tightening into a beam toward the camera.
  const count = 500;
  const us = new Float32Array(count);
  const thetas = new Float32Array(count);
  const speeds = new Float32Array(count);
  const radMul = new Float32Array(count);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cCyan = new THREE.Color(COLORS.cyan);
  const cPortal = new THREE.Color(COLORS.portal);

  for (let i = 0; i < count; i++) {
    us[i] = rand();
    thetas[i] = rand() * Math.PI * 2;
    speeds[i] = randRange(0.05, 0.13);
    radMul[i] = randRange(0.8, 1.2);
    const c = rand() < 0.6 ? cCyan : cPortal;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const streamGeo = new THREE.BufferGeometry();
  const streamPos = new THREE.BufferAttribute(positions, 3);
  streamPos.setUsage(THREE.DynamicDrawUsage);
  streamGeo.setAttribute('position', streamPos);
  streamGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const streamMat = track(new THREE.PointsMaterial({
    size: 0.055,
    map: glowTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  track(streamGeo);
  const stream = new THREE.Points(streamGeo, streamMat);
  stream.frustumCulled = false;

  group.add(ring1, ring2, core, halo, stream);
  scene.add(group);

  function writeParticle(i) {
    const u = us[i];
    // Local +z points back along the path, toward the arriving camera.
    const z = THREE.MathUtils.lerp(-9, 11, u);
    const ang = thetas[i] + u * 2.2;
    const radius = (0.35 + 2.9 * Math.pow(1 - u, 1.7)) * radMul[i];
    positions[i * 3] = Math.cos(ang) * radius;
    positions[i * 3 + 1] = Math.sin(ang) * radius;
    positions[i * 3 + 2] = z;
  }

  return {
    group,
    update(elapsed, dt) {
      ring1.rotation.z += dt * 0.3;
      ring2.rotation.z -= dt * 0.42;
      group.rotation.x = Math.sin(elapsed * 0.26) * 0.05;
      core.material.opacity = 0.42 + 0.14 * Math.sin(elapsed * 1.1);
      halo.material.opacity = 0.16 + 0.07 * Math.sin(elapsed * 0.7 + 2);
      for (let i = 0; i < count; i++) {
        us[i] += speeds[i] * dt;
        if (us[i] > 1) us[i] -= 1;
        writeParticle(i);
      }
      streamPos.needsUpdate = true;
    },
  };
}
