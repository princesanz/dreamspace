# DREAMSPACE — Cinematic 3D Portfolio Website (Full Build)

Build a complete, production-ready personal portfolio website called **Dreamspace**: an immersive, scroll-driven 3D experience where the visitor doesn't scroll a page — they fly through a foggy, infinite void filled with glowing structures. Nothing in this world stands still: every object rotates, drifts, pulses, or reacts to the visitor.

A reference prototype (`03-dreamspace.html`) is included in this folder. Keep its mood and color language, but elevate everything: curved camera path, post-processing, richer worlds, and full interactivity.

---

## 0. Before you start — use your skills

I have custom skills/plugins installed in this Claude Code environment (including UI/UX-focused ones). Before writing any code:

1. List and review every skill currently available to you (check whatever skills/plugins directory or registry your setup uses).
2. Explicitly identify which ones are relevant to this task — anything related to frontend design, UI/UX review, design systems, animation, accessibility, performance auditing, or Three.js/WebGL work.
3. Actively apply them throughout the build, not just at the end: use design-review or UX-copy skills when writing the station copy and UI microcopy, use any accessibility-audit skill on the final interaction/keyboard/reduced-motion layer, use any performance/data-viz skill for the adaptive-quality logic, etc.
4. Tell me at the start which skills you're invoking and why, and reference them again at the relevant milestones as you build.
5. If a skill's guidance conflicts with something specified below (e.g. a design-system skill pushing toward flat/minimal UI), flag the conflict to me instead of silently overriding either one — this project intentionally wants a bold, maximal, cinematic aesthetic, not a conventional clean UI.

---

## 1. Tech stack

- **Vite** (vanilla JS, ES modules) — no framework. Build output must be a static `dist/` deployable to Vercel.
- **Three.js** (latest) with `EffectComposer` post-processing.
- **GSAP + ScrollTrigger** for scroll-driven animation and camera focus transitions.
- **Lenis** for smooth scrolling (synced with ScrollTrigger).
- Hand-written CSS only (no frameworks). Google Fonts: **Syne** (700/800) for display, **Space Grotesk** (400/500) for body/UI.

Suggested structure:

```
index.html
src/
  main.js
  style.css
  world/
    scene.js        // renderer, camera, fog, resize, RAF loop
    path.js         // CatmullRomCurve3 camera path + scroll binding
    islands/        // one module per station
    particles.js    // dust, comets, cursor trail
    postfx.js       // composer passes
    raycast.js      // hover + click-to-focus
  ui/
    preloader.js
    stations.js     // HTML overlay fade logic
    cursor.js
    nav.js
data/projects.js    // placeholder project data
```

---

## 2. Visual identity

- Background/fog: `#030308`, `THREE.FogExp2` density ~0.04 so distant objects dissolve into void.
- Accent palette: cyan `#7fd8ff`, violet `#b9a8ff` / `#8f6bff`, amber `#ffb45e`, portal white `#e8f6ff`, muted lavender text `#8f88b8`.
- Aesthetic: wireframe geometry + dark solid cores + additive glow sprites. Sci-fi film trailer, not a website.
- Subtle CSS radial vignette overlay on top of the canvas.

## 3. Post-processing (postfx.js)

- `UnrealBloomPass` — strength ~0.9, radius ~0.6, threshold ~0.2 (glows must bloom beautifully).
- Custom final shader pass combining: light film grain (animated), very subtle chromatic aberration at screen edges, and gentle vignette.
- Expose a `quality` setting (high/low) that halves bloom resolution and skips grain on low.

## 4. Core mechanic — the flight

- Camera follows a **CatmullRomCurve3** path (NOT a straight line): start around `(0, 0, 8)`, weave gently left/right and up/down through ~6 control points, ending at the portal around `(0, 0, -140)`. Add slight camera roll (banking) into curves.
- Scroll progress (Lenis, `body` height ~700vh) maps to position along the curve with heavy easing/lerp (~0.06) so motion feels weighty and cinematic.
- Camera look-ahead: lookAt a point slightly further along the curve.
- Layered motion on top: mouse parallax offset (lerped), idle floating sway (sin/cos), FOV breathing (62 ± 1.5).

## 5. The world — stations along the path

Everything below must be in constant motion (varied rotation speeds, drift, pulse). Use glow sprites (canvas radial-gradient texture, additive blending) generously.

**Station 0 — Origin (hero, progress ~0.02)**
- Big typography overlay: `GILANG AFRISDA` (easily editable constant), kicker line, scroll hint with animated drip line.
- Nearby in 3D: cyan icosahedron (dark core + wireframe shell) with 7–9 orbiting tetrahedron satellites on tilted orbital rings; two thin rotating `TorusGeometry` rings around it.

**Station 1 — About (~0.22)**
- Violet torus knot with a custom **fresnel rim-glow shader material** (animated), slowly rotating.
- 10–15 small floating glass-like shards (octahedrons) drifting around it with independent rotation.

**Station 2 — Projects (~0.45) — the interactive core**
- 5 crystalline **project monoliths** (elongated, faceted shapes; amber/cyan mix) arranged left and right of the path.
- Each monolith: slow rotation, inner pulsing glow, small orbiting fragments.
- **Hover** (raycaster): monolith brightens, scales to 1.08, a floating 3D-anchored HTML label appears with project name; custom cursor expands.
- **Click**: GSAP camera dolly-in to a framed position in front of that monolith (scroll disabled during focus), then an HTML side panel slides in with project title, description, tech tags, and link — plus a close button that flies the camera back to the path and re-enables scroll.
- Load project data from `data/projects.js` (5 placeholder entries with name/description/tags/url — lorem-style Indonesian copy is fine).

**Station 3 — Skills constellation (~0.68)**
- 20–25 small glowing node spheres arranged as a loose 3D constellation, connected by thin lines (`LineSegments`) whose opacity pulses in waves.
- Nodes drift slowly; nodes within a radius of the cursor's raycast push away slightly (repulsion) and glow brighter.
- Each node has a floating label (skill name — placeholder list).

**Station 4 — Contact gate (~0.97)**
- Double rotating ring portal (opposite directions) + big soft glow; a stream of particles flowing *through* the ring toward the camera.
- Centered overlay: "Mendarat di sini" heading, email + social links as magnetic buttons.

## 6. Ambient life (always visible)

- **Dust**: ~2500 points spread along the entire path; slow drift; per-particle twinkle via a small custom `PointsMaterial` shader (size/opacity variation).
- **Comets**: every 4–8 seconds a bright particle with a fading trail streaks across the deep background.
- **Cursor trail**: subtle screen-space particle trail following the pointer (desktop only).

## 7. UI layer

- **Preloader**: black screen, percentage counter (real asset/compile progress or simulated), name mark reveal, then 1s fade into the scene. Block scroll until done.
- **Fixed chrome**: top-left name mark; top-right minimal menu (Origin / About / Karya / Skills / Kontak) — clicking smooth-scrolls (Lenis scrollTo) to the station's progress position.
- **Progress rail** (right side): 5 dots + connecting rails; active dot enlarges and glows; dots are clickable (jump to station).
- **Station text overlays**: fixed, fade/translate based on proximity to their progress center (like the prototype), alternating left/right alignment.
- **Custom cursor**: small ring following pointer with lag; expands + fills on interactive elements; magnetic attraction on buttons/links (elements subtly pull toward cursor within ~80px).
- **Audio toggle** (top-right icon, muted by default): looping ambient drone via WebAudio (generate with oscillators/noise — no external audio file needed). Respect autoplay policies (start only on user gesture).

## 8. Performance & accessibility (non-negotiable)

- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` (1.5 on mobile).
- Adaptive quality: measure FPS; if < 45 for ~3s → switch postfx to low quality and reduce dust count by half.
- Pause the RAF loop when `document.hidden`.
- Single RAF loop; reuse geometries/materials; dispose on teardown.
- `prefers-reduced-motion: reduce` → disable camera sway/FOV breathing/cursor trail/comets; stations become simple fade sections; camera eases between station positions without continuous flight.
- Mobile/touch: native touch scrolling must work through Lenis; disable cursor trail and magnetic cursor; reduce particles; monolith interaction via tap.
- Keyboard: ArrowDown/ArrowUp (and PageDown/PageUp) step between stations; Escape closes the project focus panel. Focus states visible for menu/links.
- Basic SEO/meta + OG tags; semantic HTML for overlay content so text is crawlable.

## 9. Content placeholders (Indonesian, easily editable)

Keep all copy in one constants file. Use the prototype's tone:
- Hero kicker: "Sebuah perjalanan · bukan halaman"
- Station kickers: "01 · Asal", "02 · Karya", "03 · Eksperimen/Skills", "04 · Gerbang"
- Contact heading: "Mendarat di sini"
- 5 project placeholders + ~10 skill name placeholders.

## 10. Acceptance criteria

- Smooth 60fps on a mid-range desktop GPU with bloom on.
- Every 3D object visibly animates; the scene never looks frozen, even when idle.
- Full flow works: preloader → flight → hover/click a project monolith → focus panel → close → continue → portal.
- Menu, progress dots, and keyboard navigation all jump correctly.
- Reduced-motion and mobile fallbacks verified.
- `npm run build` produces a working static `dist/`.

Start by listing the skills you're going to use (per section 0), then scaffold the Vite project, then build incrementally: scene + path + scroll first, then stations one by one, then postfx, then UI/interactions, then performance passes. Show me progress at each milestone, and note whenever a skill directly shaped a decision (e.g. "applied [skill] here for the focus-panel motion easing").
