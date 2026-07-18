import * as THREE from 'three';
import { COLORS, rand, randRange, randSign, makeGlow, sharedGeo, track } from '../util.js';

// Station 0 — Origin. Cyan icosahedron (dark core + wireframe shell),
// 8 tetra satellites on tilted orbital rings, two thin counter-rotating tori.
export function createOrigin(scene, anchor) {
  const group = new THREE.Group();
  group.position.copy(anchor);

  const coreGeo = track(new THREE.IcosahedronGeometry(1.15, 1));
  const core = new THREE.Mesh(
    coreGeo,
    track(new THREE.MeshStandardMaterial({
      color: 0x0a0a16,
      flatShading: true,
      metalness: 0.3,
      roughness: 0.65,
    })),
  );
  const shell = new THREE.Mesh(
    coreGeo,
    track(new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    })),
  );
  shell.scale.setScalar(1.28);

  const glow = makeGlow(COLORS.cyan, 6, 0.45);

  // Satellites on individually tilted orbital planes.
  const satMat = track(new THREE.MeshBasicMaterial({ color: COLORS.cyan }));
  const sats = [];
  for (let i = 0; i < 8; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.set(randRange(-0.7, 0.7), randRange(0, Math.PI), randRange(-0.5, 0.5));
    const mesh = new THREE.Mesh(sharedGeo.tetra, satMat);
    pivot.add(mesh);
    group.add(pivot);
    sats.push({
      mesh,
      radius: randRange(2.0, 3.1),
      speed: randRange(0.18, 0.55) * randSign(),
      phase: rand() * Math.PI * 2,
      spin: randRange(0.6, 1.6),
    });
  }

  const ring1 = new THREE.Mesh(
    track(new THREE.TorusGeometry(2.35, 0.02, 8, 128)),
    track(new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.5 })),
  );
  ring1.rotation.x = 1.1;
  const ring2 = new THREE.Mesh(
    track(new THREE.TorusGeometry(2.95, 0.014, 8, 128)),
    track(new THREE.MeshBasicMaterial({ color: COLORS.violet, transparent: true, opacity: 0.4 })),
  );
  ring2.rotation.x = -1.25;
  ring2.rotation.y = 0.3;

  group.add(core, shell, glow, ring1, ring2);
  scene.add(group);

  return {
    group,
    update(elapsed, dt) {
      core.rotation.y += dt * 0.12;
      core.rotation.x += dt * 0.07;
      shell.rotation.y -= dt * 0.05;
      shell.rotation.z += dt * 0.03;
      ring1.rotation.z += dt * 0.2;
      ring2.rotation.z -= dt * 0.14;
      glow.material.opacity = 0.4 + 0.12 * Math.sin(elapsed * 1.3);
      for (const s of sats) {
        const a = s.phase + elapsed * s.speed;
        s.mesh.position.set(Math.cos(a) * s.radius, 0, Math.sin(a) * s.radius);
        s.mesh.rotation.x += s.spin * dt;
        s.mesh.rotation.y += s.spin * 0.7 * dt;
      }
    },
  };
}
