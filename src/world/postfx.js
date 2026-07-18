import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Final grade: animated film grain + edge chromatic aberration + gentle
// vignette, applied after tone mapping (OutputPass) so it lives in display
// space like real print grain would.
const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.05 },
    uCA: { value: 0.0015 },
    uVignette: { value: 0.34 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uCA;
    uniform float uVignette;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      float dist = length(centered);

      // Chromatic aberration only near the frame edges.
      float ca = uCA * smoothstep(0.18, 0.75, dist);
      vec2 dir = centered / max(dist, 1e-5);
      float r = texture2D(tDiffuse, vUv + dir * ca).r;
      vec2 gb = texture2D(tDiffuse, vUv - dir * ca).gb;
      vec3 col = vec3(r, gb);

      // Animated grain.
      float g = (hash(vUv * vec2(1613.0, 907.0) + fract(uTime * 7.0)) - 0.5) * uGrain;
      col += g;

      // Gentle vignette (a CSS radial overlay adds the rest).
      col *= 1.0 - uVignette * smoothstep(0.38, 0.95, dist);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function createPostFX(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.9, // strength
    0.6, // radius
    0.2, // threshold
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const final = new ShaderPass(FinalShader);
  composer.addPass(final);

  let quality = 'high';

  function setSize(w, h) {
    composer.setSize(w, h);
    // Low quality: bloom render targets at half resolution.
    if (quality === 'low') bloom.setSize(w / 2, h / 2);
  }

  function setQuality(q) {
    if (q === quality) return;
    quality = q;
    final.uniforms.uGrain.value = q === 'low' ? 0 : 0.05;
    setSize(window.innerWidth, window.innerHeight);
  }

  function render(dt, elapsed) {
    final.uniforms.uTime.value = elapsed;
    composer.render(dt);
  }

  return {
    composer,
    bloom,
    render,
    setSize,
    setQuality,
    get quality() {
      return quality;
    },
  };
}
