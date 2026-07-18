import './style.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { SITE, STATIONS, SKILLS } from './content.js';
import { PROJECTS } from '../data/projects.js';
import { createScene } from './world/scene.js';
import { curve, stations, stationAnchor, cameraState, nearestStationIndex } from './world/path.js';
import { createOrigin } from './world/islands/origin.js';
import { createAbout } from './world/islands/about.js';
import { createProjects } from './world/islands/projects.js';
import { createSkills } from './world/islands/skills.js';
import { createContact } from './world/islands/contact.js';
import { createDust, createComets, createCursorTrail } from './world/particles.js';
import { createPostFX } from './world/postfx.js';
import { createInteraction } from './world/raycast.js';
import { createPreloader } from './ui/preloader.js';
import { createOverlays } from './ui/stations.js';
import { createLabels } from './ui/labels.js';
import { createNav } from './ui/nav.js';
import { createCursor } from './ui/cursor.js';
import { createAmbientAudio } from './ui/audio.js';
import { createPanel } from './ui/panel.js';

gsap.registerPlugin(ScrollTrigger);

// ------------------------------------------------------------- context ----
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(pointer: coarse)').matches;
const isMobile = isTouch || window.innerWidth < 820;

document.documentElement.classList.toggle('is-touch', isTouch);
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const UP = new THREE.Vector3(0, 1, 0);

// ------------------------------------------------------------ preloader ---
const preloader = createPreloader(document.getElementById('preloader'), SITE.name);
preloader.set(8);

// ----------------------------------------------------------- 3D world -----
const sceneApi = createScene(document.getElementById('world'), { isMobile });
const { renderer, scene, camera } = sceneApi;

const anchors = {
  origin: stationAnchor(stations[0].progress, 3.0, 0.3),
  about: stationAnchor(stations[1].progress, -3.1, 0.2),
  skills: stationAnchor(stations[3].progress, -2.9, 0.5),
};

const origin = createOrigin(scene, anchors.origin);
const about = createAbout(scene, anchors.about);
const projects = createProjects(scene, curve);
const skills = createSkills(scene, anchors.skills);
const contact = createContact(scene, curve);
const dust = createDust(scene, curve, { count: isMobile ? 1200 : 2500 });
const comets = createComets(scene, { enabled: !reduced });
if (reduced) dust.setSpeed(0.18);
preloader.set(55);

const postfx = createPostFX(renderer, scene, camera);
preloader.set(65);

// -------------------------------------------------------------- UI --------
const overlays = createOverlays(document.getElementById('overlays'), { isTouch });
const labels = createLabels(document.getElementById('labels'), camera, {
  skillTexts: SKILLS.map((s) => s.name),
});
const audio = createAmbientAudio();
const trail = createCursorTrail(document.getElementById('trail'), {
  enabled: !isTouch && !reduced,
});
const cursor = createCursor({
  dot: document.querySelector('.cursor-dot'),
  ring: document.querySelector('.cursor-ring'),
  enabled: !isTouch && !reduced,
});

// ------------------------------------------------------ scroll → flight ---
const lenis = new Lenis({ lerp: 0.12, smoothWheel: !reduced, syncTouch: false });
lenis.stop();
lenis.on('scroll', ScrollTrigger.update);

// Drive Lenis from GSAP's ticker (the canonical integration). This also
// keeps the ticker permanently awake — without an always-on tick GSAP sleeps
// when idle and the focus dolly / panel delayedCall never advance.
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

let targetProgress = 0;
ScrollTrigger.create({
  start: 0,
  end: () => ScrollTrigger.maxScroll(window),
  onUpdate: (self) => {
    targetProgress = self.progress;
  },
});

function jumpTo(i) {
  const target = stations[i].progress * lenis.limit;
  if (reduced) lenis.scrollTo(target, { immediate: true });
  else lenis.scrollTo(target, { duration: 2.2, easing: (t) => 1 - Math.pow(2, -10 * t) });
}

const nav = createNav({
  chrome: document.getElementById('chrome'),
  rail: document.getElementById('rail'),
  onJump: jumpTo,
  onAudioToggle: () => nav.setAudio(audio.toggle()),
});

// ------------------------------------------------------------- focus ------
const focus = { active: false, blend: 0, index: -1, pos: new THREE.Vector3(), look: new THREE.Vector3() };
let panelCall = null;

const panel = createPanel(document.getElementById('panel'), {
  onRequestClose: () => closeFocus(),
});

function openFocus(index) {
  if (focus.active) return;
  focus.active = true;
  focus.index = index;
  lenis.stop();
  labels.setMonolith(null);
  cursor.setHover(false);

  focus.pos.copy(camera.position);
  focus.look.copy(currentLook);
  const framing = projects.getFocus(index);
  const dur = reduced ? 0.5 : 1.4;
  const ease = reduced ? 'power2.out' : 'power3.inOut';
  gsap.to(focus.pos, { x: framing.camPos.x, y: framing.camPos.y, z: framing.camPos.z, duration: dur, ease });
  gsap.to(focus.look, { x: framing.look.x, y: framing.look.y, z: framing.look.z, duration: dur, ease });
  gsap.to(focus, { blend: 1, duration: dur, ease });
  panelCall = gsap.delayedCall(reduced ? 0.1 : 0.6, () => panel.open(PROJECTS[index], index));
}

function closeFocus() {
  if (!focus.active) return;
  panelCall?.kill();
  panel.close();
  gsap.killTweensOf(focus.pos);
  gsap.killTweensOf(focus.look);
  gsap.killTweensOf(focus);
  gsap.to(focus, {
    blend: 0,
    duration: reduced ? 0.4 : 1.1,
    ease: 'power3.inOut',
    onComplete: () => {
      focus.active = false;
      focus.index = -1;
      lenis.start();
    },
  });
}

// --------------------------------------------------------- interaction ----
// Keyboard path to the monoliths (a11y): focus-revealed project buttons.
document.querySelectorAll('.project-key').forEach((btn) => {
  btn.addEventListener('click', () => openFocus(+btn.dataset.i));
});

const interaction = createInteraction({
  camera,
  projects,
  skills,
  skillsCenter: skills.group.position,
  projectsProgress: stations[2].progress,
  skillsProgress: stations[3].progress,
  isTouch,
  onHoverChange: (idx) => {
    labels.setMonolith(idx >= 0 ? PROJECTS[idx].name : null, idx);
    cursor.setHover(idx >= 0);
  },
  onActivate: (idx) => openFocus(idx),
});

// ------------------------------------------------- reduced-motion mode ----
// No continuous flight: the camera eases between station positions and the
// overlays become plain crossfading sections.
const reducedCam = {
  pos: stations[0].camPos.clone(),
  look: anchors.origin.clone(),
};
const projMid = curve
  .getPointAt(stations[2].progress)
  .clone()
  .addScaledVector(curve.getTangentAt(stations[2].progress), 5);
const lookTargets = [anchors.origin, anchors.about, projMid, anchors.skills, contact.group.position];
let reducedIdx = -1;

function reducedGoTo(idx) {
  if (idx === reducedIdx) return;
  reducedIdx = idx;
  const p = stations[idx].camPos;
  const l = lookTargets[idx];
  gsap.killTweensOf(reducedCam.pos);
  gsap.killTweensOf(reducedCam.look);
  gsap.to(reducedCam.pos, { x: p.x, y: p.y, z: p.z, duration: 1.6, ease: 'power2.inOut' });
  gsap.to(reducedCam.look, { x: l.x, y: l.y, z: l.z, duration: 1.6, ease: 'power2.inOut' });
  overlays.setReducedActive(idx);
  nav.setActive(idx);
}

// ------------------------------------------------------------ keyboard ----
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && focus.active) {
    closeFocus();
    return;
  }
  if (focus.active || document.body.classList.contains('is-loading')) return;
  const idx = nearestStationIndex(targetProgress);
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    jumpTo(Math.min(idx + 1, stations.length - 1));
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    jumpTo(Math.max(idx - 1, 0));
  }
});

// ------------------------------------------------------------- resize -----
window.addEventListener('resize', () => {
  sceneApi.resize();
  postfx.setSize(window.innerWidth, window.innerHeight);
  trail.resize();
  ScrollTrigger.refresh();
});

// ------------------------------------------------------------ the loop ----
const camState = { pos: stations[0].camPos.clone(), look: anchors.origin.clone(), bank: 0 };
const currentLook = anchors.origin.clone();
const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener(
  'pointermove',
  (e) => {
    parallax.tx = e.clientX / window.innerWidth - 0.5;
    parallax.ty = e.clientY / window.innerHeight - 0.5;
  },
  { passive: true },
);

const _mix = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
const _dir = new THREE.Vector3();
const _right = new THREE.Vector3();
const _camUp = new THREE.Vector3();
const _labelV = new THREE.Vector3();

let eased = 0;
let elapsed = 0;
let last = performance.now();
let rafId = 0;
let running = false;
let readyAt = Infinity;

// Adaptive quality: sustained sub-45fps for 3s → low postfx + half dust.
let fpsEma = 60;
let lowTimer = 0;
let degraded = false;

function frame(now) {
  rafId = requestAnimationFrame(frame);
  const rawDt = (now - last) / 1000;
  last = now;
  const dt = Math.min(rawDt, 0.05);
  elapsed += dt;

  // (Lenis is advanced by gsap.ticker; see the scroll→flight setup.)

  // --- camera along the flight path ---
  if (!reduced) {
    eased = THREE.MathUtils.lerp(eased, targetProgress, 1 - Math.exp(-3.7 * dt));
    cameraState(eased, camState);
  } else {
    eased = targetProgress;
    reducedGoTo(nearestStationIndex(targetProgress));
    camState.pos.copy(reducedCam.pos);
    camState.look.copy(reducedCam.look);
    camState.bank = 0;
  }

  let px = camState.pos;
  let lx = camState.look;
  if (focus.blend > 0.0001) {
    _mix.pos.lerpVectors(camState.pos, focus.pos, focus.blend);
    _mix.look.lerpVectors(camState.look, focus.look, focus.blend);
    px = _mix.pos;
    lx = _mix.look;
  }

  camera.position.copy(px);

  if (!reduced) {
    // Layered life: mouse parallax + idle sway, in camera space.
    const pk = 1 - Math.exp(-3.1 * dt);
    parallax.x += (parallax.tx - parallax.x) * pk;
    parallax.y += (parallax.ty - parallax.y) * pk;
    _dir.subVectors(lx, px).normalize();
    _right.crossVectors(_dir, UP).normalize();
    _camUp.crossVectors(_right, _dir);
    const life = 1 - focus.blend * 0.85;
    const swayX = Math.sin(elapsed * 0.33) * 0.12;
    const swayY = Math.cos(elapsed * 0.27) * 0.1;
    camera.position.addScaledVector(_right, (parallax.x * 0.5 + swayX) * life);
    camera.position.addScaledVector(_camUp, (-parallax.y * 0.35 + swayY) * life);

    const bank = camState.bank * (1 - focus.blend);
    camera.up.set(Math.sin(bank), Math.cos(bank), 0);

    camera.fov = 62 + Math.sin(elapsed * 0.4) * 1.5; // FOV breathing
    camera.updateProjectionMatrix();
  }

  camera.lookAt(lx);
  currentLook.copy(lx);

  // --- world life ---
  origin.update(elapsed, dt);
  about.update(elapsed, dt);
  projects.update(elapsed, dt);
  skills.update(elapsed, dt);
  contact.update(elapsed, dt);
  dust.update(elapsed);
  comets.update(dt, elapsed, camera.position);

  // --- interaction + 3D-anchored labels ---
  interaction.update(eased, focus.active);
  const hi = interaction.hoverIndex;
  if (hi >= 0 && !focus.active) {
    labels.updateMonolithPos(projects.labelAnchor(hi, _labelV));
  }
  const skillsProx = reduced
    ? (reducedIdx === 3 ? 0.9 : 0)
    : Math.max(0, 1 - Math.abs(eased - stations[3].progress) / 0.09);
  labels.updateSkills((i, out) => skills.getNodeWorld(i, out), skillsProx);

  // --- UI ---
  if (!reduced) {
    overlays.update(eased);
    nav.setActive(nearestStationIndex(eased));
  }
  nav.setProgress(eased);
  cursor.update(dt);
  trail.update(dt);

  // --- adaptive quality watchdog ---
  if (!degraded && elapsed > readyAt + 4 && rawDt > 0) {
    fpsEma = THREE.MathUtils.lerp(fpsEma, Math.min(1 / rawDt, 120), 0.05);
    if (fpsEma < 45) {
      lowTimer += dt;
      if (lowTimer > 3) {
        degraded = true;
        postfx.setQuality('low');
        dust.setDensity(0.5);
        console.info('[dreamspace] FPS < 45 for 3s — quality → low (bloom ½ res, grain off, dust ½)');
      }
    } else {
      lowTimer = 0;
    }
  }

  postfx.render(dt, elapsed);
}

function startLoop() {
  if (running) return;
  running = true;
  last = performance.now();
  rafId = requestAnimationFrame(frame);
}

function stopLoop() {
  running = false;
  cancelAnimationFrame(rafId);
}

// Pause everything while the tab is hidden.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop();
  else startLoop();
});

// -------------------------------------------------------------- boot ------
document.fonts.ready.then(() => preloader.set(82));
const compiled = renderer.compileAsync
  ? renderer.compileAsync(scene, camera)
  : Promise.resolve();
compiled.then(() => preloader.set(94));

Promise.all([document.fonts.ready, compiled]).then(() => {
  startLoop(); // render behind the preloader so the fade reveals a live world
  preloader.done().then(() => {
    document.body.classList.remove('is-loading');
    lenis.start();
    overlays.reveal();
    if (reduced) reducedGoTo(0);
    readyAt = elapsed;
  });
});

// HMR teardown keeps dev sessions leak-free.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopLoop();
    lenis.destroy();
    sceneApi.teardown();
  });
}
