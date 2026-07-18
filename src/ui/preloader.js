import { UI } from '../content.js';

// Black screen → counting percentage → name-mark reveal → 1s fade into the
// scene. Progress targets are fed in from real boot milestones (world built,
// fonts ready, shaders compiled); the counter eases toward them.
export function createPreloader(el, nameMark) {
  el.querySelector('.pre-label').textContent = UI.preloaderLabel;
  el.querySelector('.pre-mark').textContent = nameMark;
  const numEl = el.querySelector('.pre-num');
  const barEl = el.querySelector('.pre-bar-fill');

  let target = 0;
  let shown = 0;
  let raf = 0;
  let finished = false;
  let resolveDone;
  const donePromise = new Promise((r) => (resolveDone = r));

  function tick() {
    shown += (target - shown) * 0.09;
    if (target >= 100 && shown > 99.2) shown = 100;
    const v = Math.floor(shown);
    numEl.textContent = String(v).padStart(3, '0');
    barEl.style.transform = `scaleX(${shown / 100})`;

    if (shown >= 100 && !finished) {
      finished = true;
      el.classList.add('is-done'); // name mark reveal
      setTimeout(() => {
        el.classList.add('is-hidden'); // 1s CSS fade
        setTimeout(() => {
          el.remove();
          cancelAnimationFrame(raf);
          resolveDone();
        }, 1050);
      }, 750);
      return;
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  return {
    set(v) {
      target = Math.max(target, Math.min(v, 100));
    },
    done() {
      target = 100;
      return donePromise;
    },
  };
}
