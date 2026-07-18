import * as THREE from 'three';
import { STATIONS } from '../content.js';

// The flight line: a CatmullRom weave from (0,0,8) to the portal at z=-140.
// Not a straight corridor — the camera banks through these curves.
const CONTROL_POINTS = [
  [0, 0, 8],
  [2.6, 0.7, -6],
  [-3.2, -0.6, -24],
  [3.4, 1.4, -46],
  [-3.0, -1.2, -68],
  [2.4, 1.0, -92],
  [-1.8, 0.5, -116],
  [0, 0.2, -132],
  [0, 0, -140],
];

export const curve = new THREE.CatmullRomCurve3(
  CONTROL_POINTS.map((p) => new THREE.Vector3(...p)),
  false,
  'centripetal',
);

const UP = new THREE.Vector3(0, 1, 0);
const _tan = new THREE.Vector3();
const _tanAhead = new THREE.Vector3();
const _ahead = new THREE.Vector3();
const _side = new THREE.Vector3();

// World position for a station's 3D object: a point slightly further along
// the curve than the camera's stop, pushed sideways off the flight line.
export function stationAnchor(progress, lateral = 0, vertical = 0, ahead = 0.045) {
  const t = Math.min(progress + ahead, 0.999);
  const p = curve.getPointAt(t).clone();
  curve.getTangentAt(t, _tan);
  _side.crossVectors(_tan, UP).normalize();
  p.addScaledVector(_side, lateral);
  p.y += vertical;
  return p;
}

// Camera state along the flight: position, look target (ahead of the nose),
// and bank roll derived from how hard the path is turning.
export function cameraState(t, out) {
  t = THREE.MathUtils.clamp(t, 0, 1);
  curve.getPointAt(t, out.pos);

  const la = Math.min(t + 0.02, 1);
  if (la - t > 0.004) {
    curve.getPointAt(la, _ahead);
    _ahead.sub(out.pos).normalize();
  } else {
    curve.getTangentAt(t, _ahead);
  }
  out.look.copy(out.pos).addScaledVector(_ahead, 4);

  curve.getTangentAt(t, _tan);
  curve.getTangentAt(Math.min(t + 0.03, 1), _tanAhead);
  out.bank = THREE.MathUtils.clamp((_tanAhead.x - _tan.x) * -2.2, -0.16, 0.16);
  return out;
}

// Stations enriched with their camera stop position (used by reduced-motion
// mode and the focus-return flight).
export const stations = STATIONS.map((s) => ({
  ...s,
  camPos: curve.getPointAt(s.progress).clone(),
}));

export function nearestStationIndex(progress) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < stations.length; i++) {
    const d = Math.abs(progress - stations[i].progress);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}
