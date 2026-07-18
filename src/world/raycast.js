import * as THREE from 'three';

// Pointer → world. Owns the raycaster and decides, per frame, whether the
// pointer is talking to the monoliths (hover/click) or the constellation
// (repulsion field). Focus mode and touch change the rules.
export function createInteraction({
  camera,
  projects,
  skills,
  skillsCenter,
  projectsProgress,
  skillsProgress,
  isTouch,
  onHoverChange,
  onActivate,
}) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(-2, -2); // offscreen until first move
  const plane = new THREE.Plane();
  const _dir = new THREE.Vector3();
  const _pt = new THREE.Vector3();

  let hoverIdx = -1;
  let enabled = true;
  let down = null;

  function toNDC(e, out) {
    out.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    return out;
  }

  window.addEventListener('pointermove', (e) => toNDC(e, ndc), { passive: true });

  window.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('pointerup', (e) => {
    if (!enabled || !down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 8) return; // it was a drag/scroll, not a tap
    if (e.target.closest('a, button, [data-ui]')) return; // UI owns this click

    if (isTouch) {
      // No hover on touch: raycast directly at the tap point.
      raycaster.setFromCamera(toNDC(e, new THREE.Vector2()), camera);
      const hits = raycaster.intersectObjects(projects.meshes, false);
      if (hits.length) onActivate(hits[0].object.userData.index);
    } else if (hoverIdx >= 0) {
      onActivate(hoverIdx);
    }
  });

  function clearHover() {
    if (hoverIdx !== -1) {
      hoverIdx = -1;
      projects.setHover(-1);
      onHoverChange(-1);
    }
  }

  return {
    get hoverIndex() {
      return hoverIdx;
    },

    setEnabled(v) {
      enabled = v;
      if (!v) clearHover();
    },

    update(progress, focusActive) {
      if (focusActive || !enabled) {
        clearHover();
        skills.setPointer(null);
        return;
      }

      raycaster.setFromCamera(ndc, camera);

      // Monolith hover — only worth testing near the projects station.
      if (!isTouch && Math.abs(progress - projectsProgress) < 0.15) {
        const hits = raycaster.intersectObjects(projects.meshes, false);
        const idx = hits.length ? hits[0].object.userData.index : -1;
        if (idx !== hoverIdx) {
          hoverIdx = idx;
          projects.setHover(idx);
          onHoverChange(idx);
        }
      } else {
        clearHover();
      }

      // Constellation repulsion — cursor projected onto a camera-facing
      // plane through the constellation's center.
      if (!isTouch && Math.abs(progress - skillsProgress) < 0.15) {
        camera.getWorldDirection(_dir);
        plane.setFromNormalAndCoplanarPoint(_dir, skillsCenter);
        const hit = raycaster.ray.intersectPlane(plane, _pt);
        skills.setPointer(hit ? _pt : null);
      } else {
        skills.setPointer(null);
      }
    },
  };
}
