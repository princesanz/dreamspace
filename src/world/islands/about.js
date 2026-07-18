import * as THREE from 'three';
import { COLORS, rand, randRange, randSign, makeGlow, track } from '../util.js';

// Station 1 — About. Violet torus knot with an animated fresnel rim-glow
// shader, surrounded by drifting glass-like octahedron shards.
const FresnelMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBase: { value: new THREE.Color(0x120d24) },
      uRim: { value: new THREE.Color(COLORS.violet) },
      uRimDeep: { value: new THREE.Color(COLORS.violetDeep) },
      uFogColor: { value: new THREE.Color(COLORS.void) },
      uFogDensity: { value: 0.04 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying float vFogDepth;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mv.xyz);
        vFogDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uBase;
      uniform vec3 uRim;
      uniform vec3 uRimDeep;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying float vFogDepth;
      void main() {
        float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.6);
        float pulse = 0.72 + 0.28 * sin(uTime * 1.6);
        vec3 rim = mix(uRimDeep, uRim, 0.5 + 0.5 * sin(uTime * 0.7));
        vec3 col = uBase + rim * fres * pulse * 1.7;
        float fogF = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
        col = mix(col, uFogColor, fogF);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

export function createAbout(scene, anchor) {
  const group = new THREE.Group();
  group.position.copy(anchor);

  const knotMat = track(FresnelMaterial());
  const knot = new THREE.Mesh(
    track(new THREE.TorusKnotGeometry(1.05, 0.32, 200, 24)),
    knotMat,
  );

  const glow = makeGlow(COLORS.violetDeep, 7, 0.35);

  // Glass-like shards: translucent core + wireframe overlay per octahedron.
  const shards = [];
  const shardGeos = [
    track(new THREE.OctahedronGeometry(0.1)),
    track(new THREE.OctahedronGeometry(0.16)),
    track(new THREE.OctahedronGeometry(0.22)),
  ];
  const shardMat = track(new THREE.MeshBasicMaterial({
    color: COLORS.violet,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  }));
  const shardWireMat = track(new THREE.MeshBasicMaterial({
    color: COLORS.violet,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  }));

  for (let i = 0; i < 13; i++) {
    const geo = shardGeos[(rand() * shardGeos.length) | 0];
    const holder = new THREE.Group();
    holder.add(new THREE.Mesh(geo, shardMat), new THREE.Mesh(geo, shardWireMat));
    const radius = randRange(1.9, 3.5);
    const theta = rand() * Math.PI * 2;
    const y = randRange(-1.6, 1.8);
    holder.position.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
    group.add(holder);
    shards.push({
      holder,
      base: holder.position.clone(),
      bobPhase: rand() * Math.PI * 2,
      bobAmp: randRange(0.15, 0.4),
      rotX: randRange(0.3, 1.1) * randSign(),
      rotY: randRange(0.3, 1.1) * randSign(),
    });
  }

  group.add(knot, glow);
  scene.add(group);

  return {
    group,
    update(elapsed, dt) {
      knotMat.uniforms.uTime.value = elapsed;
      knot.rotation.y += dt * 0.14;
      knot.rotation.z += dt * 0.05;
      glow.material.opacity = 0.3 + 0.1 * Math.sin(elapsed * 0.9 + 1.7);
      for (const s of shards) {
        s.holder.position.y = s.base.y + Math.sin(elapsed * 0.5 + s.bobPhase) * s.bobAmp;
        s.holder.position.x = s.base.x + Math.cos(elapsed * 0.35 + s.bobPhase * 1.3) * 0.12;
        s.holder.rotation.x += s.rotX * dt;
        s.holder.rotation.y += s.rotY * dt;
      }
    },
  };
}
