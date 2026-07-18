import * as THREE from 'three';
import { SKILLS, SKILL_CLUSTERS } from '../../content.js';
import { COLORS, rand, randRange, makeGlow, track } from '../util.js';

// Station 3 — skills constellation, clustered by domain. Each cluster owns a
// colour and a region of space; nodes of the same domain sit near each other,
// connections are dense within a cluster and sparse between clusters. Nodes
// drift, and nodes near the cursor's raycast point push away and brighten.
export function createSkills(scene, anchor) {
  const group = new THREE.Group();
  group.position.copy(anchor);

  const count = SKILLS.length;
  const sphereGeo = track(new THREE.SphereGeometry(0.07, 12, 12));
  const brightColor = new THREE.Color(COLORS.portal);

  // A loose region per cluster: spread around a tilted ring with alternating
  // height so the five domains read as distinct clumps, not one cloud.
  const C = SKILL_CLUSTERS.length;
  const centroids = SKILL_CLUSTERS.map((_, i) => {
    const ang = (i / C) * Math.PI * 2 + 0.35;
    const r = 3.0;
    // Distinct height per cluster (stride-2 through 5 slots) so ring-adjacent
    // clusters never share a height band — i%2 gave clusters 0 and 4 the same
    // sign and their labels collided on screen.
    const y = (((i * 2) % C) - 2) * 0.85;
    const p = new THREE.Vector3(Math.cos(ang) * r, y, Math.sin(ang) * r * 0.55);
    // Per-cluster corrections for how this station's camera actually frames
    // the ring: backend (2) lands hardest camera-left and deep, frontend (1)
    // and AI (3) interleave near centre — pull them apart and toward the
    // camera so each cluster owns clear screen space at the station stop.
    if (i === 1) p.add(new THREE.Vector3(1.6, 0.3, 0.8));
    if (i === 2) p.add(new THREE.Vector3(3.3, -0.8, 0.9));
    if (i === 3) p.add(new THREE.Vector3(0.55, -0.35, 0.5));
    if (i === 4) p.add(new THREE.Vector3(1.5, 0.8, 0));
    return p;
  });

  const nodes = [];
  const byCluster = SKILL_CLUSTERS.map(() => []);
  for (let i = 0; i < count; i++) {
    const skill = SKILLS[i];
    const clusterColor = new THREE.Color(skill.color);
    // Gaussian jitter around the cluster centroid, plus a deterministic
    // per-node depth/height stagger so labels of neighbouring nodes never
    // land on the same screen line. Clusters that sit deeper in the frame
    // project smaller, so they get a wider world-space spread to keep their
    // labels apart on screen.
    const spread = [1.15, 1.7, 1.3, 1.35, 1.5][skill.cluster];
    const g = () => ((rand() + rand() + rand()) / 1.5 - 1) * 1.3 * spread;
    const base = centroids[skill.cluster].clone().add(new THREE.Vector3(
      g(),
      g() * 0.85 + ((i % 3) - 1) * 0.34,
      g() + ((i % 4) - 1.5) * 0.3,
    ));
    // The random draw bunches labels for the three centre/deep clusters at
    // this station's camera angle no matter the spread — lay their nodes on
    // staggered rings instead (drift + depth stagger keep it organic). The
    // g() draws above still run so the other clusters' seeded layout stays
    // identical.
    const RING = { 1: { r: 1.05, ph: 0.2 }, 2: { r: 1.1, ph: 0.4 }, 3: { r: 1.2, ph: 0.785 } };
    if (RING[skill.cluster]) {
      const { r: rr, ph } = RING[skill.cluster];
      const n = SKILL_CLUSTERS[skill.cluster].nodes.length;
      const k = byCluster[skill.cluster].length;
      const a2 = (k / n) * Math.PI * 2 + ph;
      base.copy(centroids[skill.cluster]).add(new THREE.Vector3(
        Math.cos(a2) * rr,
        (k % 2 ? 0.8 : -0.55) + Math.sin(a2) * 0.3,
        Math.sin(a2) * 0.8,
      ));
    }
    // Hand nudges for the few nodes whose labels still collided at the
    // station stop (1440px viewport) — layout is seeded-deterministic,
    // so these hold across reloads.
    const NUDGE = {
      'Order Flow': [0, 0.55, 0],
      'Walk-Forward': [0.4, -0.75, 0],
      'PC Building': [0.9, -0.6, 0],
      'eMMC/UFS Repair': [0.3, 0.5, 0],
      'Three.js': [0, 0.55, 0],
      'Binance WebSocket': [0.35, -0.5, 0],
      Tailwind: [0, 0.45, 0],
      pandas: [0.25, -0.35, 0],
    };
    if (NUDGE[skill.name]) base.add(new THREE.Vector3(...NUDGE[skill.name]));

    const mat = track(new THREE.MeshBasicMaterial({ color: clusterColor.clone() }));
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.position.copy(base);
    const glow = makeGlow(skill.color, 0.6, 0.4);
    glow.position.copy(base);
    group.add(mesh, glow);

    byCluster[skill.cluster].push(i);
    nodes.push({
      mesh,
      glow,
      mat,
      baseTint: clusterColor.clone(),
      base,
      driftPhase: rand() * Math.PI * 2,
      driftAmp: randRange(0.1, 0.26),
      push: new THREE.Vector3(),
      pushTarget: new THREE.Vector3(),
      energy: 0,
    });
  }

  // Edges. Dense within a cluster (each node → 2 nearest same-cluster peers),
  // then one sparse bridge between each pair of consecutive clusters.
  const pairs = new Map(); // key → cluster index for colouring (-1 = bridge)
  const addPair = (a, b, cluster) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    if (!pairs.has(key)) pairs.set(key, cluster);
  };

  byCluster.forEach((idxs, ci) => {
    idxs.forEach((i) => {
      const near = idxs
        .filter((j) => j !== i)
        .sort((a, b) => nodes[i].base.distanceTo(nodes[a].base) - nodes[i].base.distanceTo(nodes[b].base));
      for (let k = 0; k < Math.min(2, near.length); k++) addPair(i, near[k], ci);
    });
  });

  for (let c = 0; c < byCluster.length; c++) {
    const a = byCluster[c];
    const b = byCluster[(c + 1) % byCluster.length];
    if (!a.length || !b.length) continue;
    let best = [a[0], b[0]];
    let bestD = Infinity;
    a.forEach((i) => b.forEach((j) => {
      const d = nodes[i].base.distanceTo(nodes[j].base);
      if (d < bestD) { bestD = d; best = [i, j]; }
    }));
    addPair(best[0], best[1], -1);
  }

  const edges = [...pairs.keys()].map((key) => key.split('_').map(Number));
  const edgeClusters = [...pairs.values()];

  const edgePositions = new Float32Array(edges.length * 2 * 3);
  const edgePhases = new Float32Array(edges.length * 2);
  const edgeColors = new Float32Array(edges.length * 2 * 3);
  const bridgeColor = new THREE.Color(COLORS.text);
  edges.forEach((_, e) => {
    edgePhases[e * 2] = edgePhases[e * 2 + 1] = e * 0.55;
    const ci = edgeClusters[e];
    // Intra-cluster edges carry the cluster colour; bridges stay muted.
    const col = ci === -1 ? bridgeColor : new THREE.Color(SKILL_CLUSTERS[ci].color);
    for (let v = 0; v < 2; v++) {
      edgeColors[(e * 2 + v) * 3] = col.r;
      edgeColors[(e * 2 + v) * 3 + 1] = col.g;
      edgeColors[(e * 2 + v) * 3 + 2] = col.b;
    }
  });

  const edgeGeo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(edgePositions, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  edgeGeo.setAttribute('position', posAttr);
  edgeGeo.setAttribute('aPhase', new THREE.BufferAttribute(edgePhases, 1));
  edgeGeo.setAttribute('aColor', new THREE.BufferAttribute(edgeColors, 3));

  const edgeMat = track(new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aPhase;
      attribute vec3 aColor;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vAlpha = 0.1 + 0.24 * (0.5 + 0.5 * sin(uTime * 1.4 + aPhase));
        vColor = aColor;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor * vAlpha, vAlpha);
      }
    `,
  }));
  track(edgeGeo);
  const lines = new THREE.LineSegments(edgeGeo, edgeMat);
  lines.frustumCulled = false;
  group.add(lines);
  scene.add(group);

  let pointer = null; // world-space cursor point, set by raycast layer
  const _local = new THREE.Vector3();
  const _d = new THREE.Vector3();

  return {
    group,
    labels: SKILLS.map((s) => s.name),

    setPointer(worldPoint) {
      pointer = worldPoint;
    },

    getNodeWorld(i, out) {
      return nodes[i].mesh.getWorldPosition(out);
    },

    update(elapsed, dt) {
      edgeMat.uniforms.uTime.value = elapsed;
      if (pointer) group.worldToLocal(_local.copy(pointer));

      const k = 1 - Math.exp(-5 * dt);
      nodes.forEach((n) => {
        const drift = _d.set(
          Math.sin(elapsed * 0.32 + n.driftPhase) * n.driftAmp,
          Math.cos(elapsed * 0.26 + n.driftPhase * 1.6) * n.driftAmp,
          Math.sin(elapsed * 0.21 + n.driftPhase * 0.7) * n.driftAmp * 0.8,
        ).add(n.base);

        // Cursor repulsion within a 2.3-unit bubble.
        n.pushTarget.set(0, 0, 0);
        let energyTarget = 0;
        if (pointer) {
          const dist = drift.distanceTo(_local);
          if (dist < 2.3) {
            const f = Math.pow(1 - dist / 2.3, 2);
            n.pushTarget.copy(drift).sub(_local).normalize().multiplyScalar(f * 1.15);
            energyTarget = f;
          }
        }
        n.push.lerp(n.pushTarget, k);
        n.energy = THREE.MathUtils.lerp(n.energy, energyTarget, k);

        n.mesh.position.copy(drift).add(n.push);
        n.glow.position.copy(n.mesh.position);
        n.mat.color.copy(n.baseTint).lerp(brightColor, n.energy * 0.9);
        n.glow.material.opacity = 0.35 + n.energy * 0.5;
        n.glow.scale.setScalar(0.6 + n.energy * 0.35);
      });

      edges.forEach(([a, b], e) => {
        const pa = nodes[a].mesh.position;
        const pb = nodes[b].mesh.position;
        posAttr.setXYZ(e * 2, pa.x, pa.y, pa.z);
        posAttr.setXYZ(e * 2 + 1, pb.x, pb.y, pb.z);
      });
      posAttr.needsUpdate = true;
    },
  };
}
