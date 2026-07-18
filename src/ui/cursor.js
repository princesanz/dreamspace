// Custom cursor: a snappy dot + a lagged ring that expands and fills over
// interactive elements, plus magnetic pull on [data-magnetic] buttons.
// Disabled entirely on touch and reduced-motion (native cursor rules there).
export function createCursor({ dot, ring, enabled }) {
  if (!enabled) {
    dot.remove();
    ring.remove();
    return { update() {}, setHover() {} };
  }

  document.documentElement.classList.add('has-cursor');

  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let rx = x;
  let ry = y;
  let hover3d = false;

  window.addEventListener(
    'pointermove',
    (e) => {
      x = e.clientX;
      y = e.clientY;
    },
    { passive: true },
  );
  window.addEventListener('pointerdown', () => ring.classList.add('is-down'));
  window.addEventListener('pointerup', () => ring.classList.remove('is-down'));

  // Interactive-element detection via delegation. Disabled controls are
  // excluded so the cursor never signals interactivity on the coming-soon CV.
  const HOT = 'a, button:not([disabled]), [data-hover]';
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest(HOT)) ring.classList.add('is-hover');
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest(HOT)) ring.classList.remove('is-hover');
  });

  return {
    setHover(on) {
      // 3D hovers (monoliths) — same visual as DOM hovers.
      hover3d = on;
      ring.classList.toggle('is-hover-3d', on);
      document.documentElement.classList.toggle('is-hover-3d', on);
    },

    update(dt) {
      const k = 1 - Math.exp(-14 * dt);
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      // `translate` (not `transform`) so the CSS `scale` on hover states
      // composes in place instead of scaling the translation itself.
      dot.style.translate = `${x}px ${y}px`;
      ring.style.translate = `${rx}px ${ry}px`;

      // Magnetic attraction: elements pull toward the cursor within 80px.
      for (const el of document.querySelectorAll('[data-magnetic]')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue; // hidden overlay
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 80) {
          const f = (1 - dist / 80) * 0.34;
          el.style.translate = `${(dx * f).toFixed(1)}px ${(dy * f).toFixed(1)}px`;
        } else if (el.style.translate) {
          el.style.translate = '';
        }
      }
      void hover3d;
    },
  };
}
