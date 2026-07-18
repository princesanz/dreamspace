import * as THREE from 'three';

// HTML labels anchored to 3D positions: the hover chip above a monolith and
// the 24 skill-node names. Projection to screen space happens here.
export function createLabels(container, camera, { skillTexts }) {
  const _v = new THREE.Vector3();

  const mono = document.createElement('div');
  mono.className = 'mono-label';
  mono.setAttribute('aria-hidden', 'true');
  container.appendChild(mono);

  const skillEls = skillTexts.map((text) => {
    const d = document.createElement('div');
    d.className = 'node-label';
    d.textContent = text;
    d.setAttribute('aria-hidden', 'true');
    container.appendChild(d);
    return d;
  });

  function place(el, world, extraY = 0) {
    _v.copy(world).project(camera);
    if (_v.z > 1) {
      el.style.opacity = '0';
      return false;
    }
    const x = (_v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-_v.y * 0.5 + 0.5) * window.innerHeight + extraY;
    el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    return true;
  }

  return {
    setMonolith(name, index) {
      if (name == null) {
        mono.classList.remove('is-on');
      } else {
        mono.innerHTML = `<span class="mono-label-num">0${index + 1}</span>${name}`;
        mono.classList.add('is-on');
      }
    },

    updateMonolithPos(world) {
      if (!mono.classList.contains('is-on')) return;
      // Clear the inline opacity place() sets when the anchor goes behind
      // the camera, so the .is-on class can take effect again.
      mono.style.opacity = place(mono, world, -6) ? '' : '0';
    },

    // prox 0..1 — how close the flight is to the skills station.
    updateSkills(getWorld, prox) {
      if (prox <= 0.02) {
        for (const el of skillEls) el.style.opacity = '0';
        return;
      }
      skillEls.forEach((el, i) => {
        const ok = place(el, getWorld(i, _v), -8);
        if (ok) el.style.opacity = (prox * 0.9).toFixed(2);
      });
    },
  };
}
