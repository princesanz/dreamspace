import * as THREE from 'three';
import { COLORS } from './util.js';

// Renderer + scene + camera + fog. The RAF loop itself lives in main.js
// so there is exactly one loop driving Lenis, world, and composer.
export function createScene(canvas, { isMobile }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.void);
  scene.fog = new THREE.FogExp2(COLORS.void, 0.04);

  const camera = new THREE.PerspectiveCamera(
    62,
    window.innerWidth / window.innerHeight,
    0.1,
    260,
  );
  camera.position.set(0, 0, 8);

  // Unlit/additive materials carry most of the look; these two lights only
  // shape the faceted standard-material cores (icosahedron, monoliths).
  const hemi = new THREE.HemisphereLight(0x8fb8d8, 0x0a0612, 0.85);
  const ambient = new THREE.AmbientLight(0x223, 0.6);
  scene.add(hemi, ambient);

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function teardown() {
    renderer.dispose();
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
  }

  return { renderer, scene, camera, resize, teardown };
}
