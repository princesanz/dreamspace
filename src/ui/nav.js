import { SITE, STATIONS, UI } from '../content.js';

// Fixed chrome (name mark, station menu, audio toggle) + the right-side
// progress rail with clickable station dots.
export function createNav({ chrome, rail, onJump, onAudioToggle }) {
  chrome.innerHTML = `
    <a class="mark" href="#" data-ui>${SITE.mark}</a>
    <div class="chrome-right">
      <nav class="menu" aria-label="${UI.navAria}">
        ${STATIONS.map(
          (s, i) => `<button class="menu-btn" type="button" data-ui data-magnetic data-i="${i}">${s.menu}</button>`,
        ).join('')}
      </nav>
      <button class="audio-btn" type="button" data-ui aria-pressed="false" aria-label="${UI.audioAria}" title="${UI.audioOff}">
        <span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>
      </button>
    </div>`;

  rail.setAttribute('aria-label', UI.railAria);
  rail.innerHTML = `
    <div class="rail-track" aria-hidden="true"><div class="rail-fill"></div></div>
    ${STATIONS.map(
      (s, i) =>
        `<button class="rail-dot" type="button" data-ui data-i="${i}" aria-label="${UI.railJump} ${s.menu}"><span></span></button>`,
    ).join('')}`;

  const menuBtns = [...chrome.querySelectorAll('.menu-btn')];
  const dots = [...rail.querySelectorAll('.rail-dot')];
  const fill = rail.querySelector('.rail-fill');
  const audioBtn = chrome.querySelector('.audio-btn');

  chrome.querySelector('.mark').addEventListener('click', (e) => {
    e.preventDefault();
    onJump(0);
  });
  menuBtns.forEach((b) => b.addEventListener('click', () => onJump(+b.dataset.i)));
  dots.forEach((d) => d.addEventListener('click', () => onJump(+d.dataset.i)));
  audioBtn.addEventListener('click', onAudioToggle);

  return {
    setActive(idx) {
      menuBtns.forEach((b, i) => {
        b.classList.toggle('is-active', i === idx);
        if (i === idx) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === idx);
        if (i === idx) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
    },
    setProgress(p) {
      fill.style.transform = `scaleY(${p.toFixed(4)})`;
    },
    setAudio(on) {
      audioBtn.setAttribute('aria-pressed', String(on));
      audioBtn.title = on ? UI.audioOn : UI.audioOff;
      audioBtn.classList.toggle('is-on', on);
    },
  };
}
