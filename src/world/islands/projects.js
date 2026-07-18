import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PROJECTS } from '../../../data/projects.js';
import { COLORS, TINTS, mulberry32, rand, randRange, makeGlow, sharedGeo, track } from '../util.js';

const UP = new THREE.Vector3(0, 1, 0);

// Faceted crystal: hexagonal column + two points, vertices jittered with a
// position-welded hash so faces stay sealed, then flat-shaded.
function crystalGeometry(seed) {
  const body = new THREE.CylinderGeometry(0.34, 0.6, 3.2, 6, 3, true);
  const top = new THREE.ConeGeometry(0.34, 0.95, 6);
  top.translate(0, 2.075, 0);
  const bottom = new THREE.ConeGeometry(0.6, 0.8, 6);
  bottom.rotateX(Math.PI);
  bottom.translate(0, -2.0, 0);

  let geo = mergeGeometries([body, top, bottom]);
  const rng = mulberry32(seed);
  const pos = geo.getAttribute('position');
  const cache = new Map();
  const r2 = (v) => (Math.round(v * 100) / 100 + 0).toFixed(2);
  for (let i = 0; i < pos.count; i++) {
    const key = `${r2(pos.getX(i))}_${r2(pos.getY(i))}_${r2(pos.getZ(i))}`;
    let off = cache.get(key);
    if (!off) {
      off = [(rng() - 0.5) * 0.14, (rng() - 0.5) * 0.1, (rng() - 0.5) * 0.14];
      cache.set(key, off);
    }
    pos.setXYZ(i, pos.getX(i) + off[0], pos.getY(i) + off[1], pos.getZ(i) + off[2]);
  }
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  return geo;
}

// Station 2 — five project monoliths flanking the path, amber/cyan/violet.
// Hover + focus states are driven from outside via setHover(); the island
// only owns its constant motion.
export function createProjects(scene, curve) {
  const ts = [0.385, 0.415, 0.45, 0.485, 0.515];
  const monoliths = [];
  const meshes = []; // raycast targets

  PROJECTS.forEach((project, i) => {
    const t = ts[i];
    const side = i % 2 === 0 ? -1 : 1;
    const tint = TINTS[project.tint] ?? COLORS.amber;

    const pathPoint = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const sideDir = new THREE.Vector3().crossVectors(tangent, UP).normalize();

    const group = new THREE.Group();
    group.position
      .copy(pathPoint)
      .addScaledVector(sideDir, side * randRange(3.1, 3.7));
    group.position.y += randRange(-0.5, 0.7);

    const geo = track(crystalGeometry(1000 + i * 77));
    const mat = track(new THREE.MeshStandardMaterial({
      color: 0x0c0c18,
      emissive: tint,
      emissiveIntensity: 0.25,
      flatShading: true,
      metalness: 0.3,
      roughness: 0.45,
    }));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { type: 'monolith', index: i, project };

    const edgeMat = track(new THREE.LineBasicMaterial({
      color: tint,
      transparent: true,
      opacity: 0.3,
    }));
    const edges = new THREE.LineSegments(track(new THREE.EdgesGeometry(geo, 15)), edgeMat);

    const glow = makeGlow(tint, 3.4, 0.4);

    // Small orbiting fragments.
    const fragMat = track(new THREE.MeshBasicMaterial({ color: tint }));
    const frags = [];
    for (let f = 0; f < 3; f++) {
      const fm = new THREE.Mesh(sharedGeo.tetraSmall, fragMat);
      group.add(fm);
      frags.push({
        mesh: fm,
        radius: randRange(1.05, 1.6),
        speed: randRange(0.4, 0.9) * (f % 2 ? 1 : -1),
        phase: rand() * Math.PI * 2,
        y: randRange(-1.2, 1.4),
      });
    }

    group.add(mesh, edges, glow);
    group.lookAt(pathPoint);
    group.rotation.z += randRange(-0.09, 0.09);
    // The flagship reads as the most prominent monolith: larger, brighter core.
    if (project.flagship) group.scale.setScalar(1.34);
    scene.add(group);

    meshes.push(mesh);
    monoliths.push({
      t,
      group,
      mesh,
      mat,
      edgeMat,
      glow,
      frags,
      flagship: !!project.flagship,
      spin: randRange(0.08, 0.15) * (side > 0 ? 1 : -1),
      pulsePhase: i * 1.3,
      hover: 0,
      hoverTarget: 0,
    });
  });

  return {
    meshes,

    setHover(index) {
      monoliths.forEach((m, i) => {
        m.hoverTarget = i === index ? 1 : 0;
      });
    },

    // Camera framing for the click-to-focus dolly. Shifts the rig sideways
    // so the monolith sits left of center while the panel covers the right.
    getFocus(index) {
      const m = monoliths[index];
      const M = m.group.position;
      const P = curve.getPointAt(m.t);
      const dir = P.clone().sub(M);
      dir.y *= 0.35;
      dir.normalize();
      const camPos = M.clone().addScaledVector(dir, 4.6);
      camPos.y += 0.55;
      const look = M.clone();
      look.y += 0.35;
      const right = new THREE.Vector3().crossVectors(look.clone().sub(camPos).normalize(), UP).normalize();
      camPos.addScaledVector(right, 0.8);
      look.addScaledVector(right, 0.8);
      return { camPos, look };
    },

    labelAnchor(index, out) {
      return monoliths[index].group.localToWorld(out.set(0, 2.9, 0));
    },

    update(elapsed, dt) {
      for (const m of monoliths) {
        m.hover = THREE.MathUtils.lerp(m.hover, m.hoverTarget, 1 - Math.exp(-8 * dt));
        m.mesh.rotation.y += m.spin * dt;
        const s = 1 + m.hover * 0.08;
        m.mesh.scale.setScalar(s);
        m.mat.emissiveIntensity =
          0.25 + (m.flagship ? 0.2 : 0) + m.hover * 0.6 + 0.06 * Math.sin(elapsed * 1.8 + m.pulsePhase);
        m.edgeMat.opacity = 0.3 + m.hover * 0.35;
        m.glow.material.opacity =
          (0.34 + 0.12 * Math.sin(elapsed * 1.4 + m.pulsePhase)) * (1 + m.hover * 0.7);
        for (const f of m.frags) {
          const a = f.phase + elapsed * f.speed;
          f.mesh.position.set(Math.cos(a) * f.radius, f.y + Math.sin(a * 1.7) * 0.15, Math.sin(a) * f.radius);
          f.mesh.rotation.y += dt * 1.2;
        }
      }
    },
  };
}
