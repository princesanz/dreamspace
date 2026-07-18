import { UI } from '../content.js';

// Project focus panel: slides in from the right while the camera holds its
// framed position. Dialog semantics, focus trap, Escape to close.
export function createPanel(el, { onRequestClose }) {
  el.innerHTML = `
    <div class="panel-inner">
      <p class="panel-kicker"><span class="panel-num"></span>${UI.panelKicker}</p>
      <h3 class="panel-title"></h3>
      <p class="panel-tagline"></p>
      <p class="panel-desc"></p>
      <ul class="panel-tags" role="list"></ul>
      <a class="panel-visit btn btn--primary" data-magnetic target="_blank" rel="noopener"></a>
      <p class="panel-private" hidden>${UI.panelPrivate}</p>
      <button class="panel-close btn" type="button" data-magnetic aria-label="${UI.panelCloseAria}">
        ${UI.panelClose}
        <span class="panel-esc" aria-hidden="true">${UI.focusHint}</span>
      </button>
    </div>`;

  const num = el.querySelector('.panel-num');
  const title = el.querySelector('.panel-title');
  const tagline = el.querySelector('.panel-tagline');
  const desc = el.querySelector('.panel-desc');
  const tags = el.querySelector('.panel-tags');
  const visit = el.querySelector('.panel-visit');
  const privateLabel = el.querySelector('.panel-private');
  const closeBtn = el.querySelector('.panel-close');

  let open = false;
  let lastFocus = null;

  closeBtn.addEventListener('click', () => onRequestClose());

  // Keep Tab inside the panel while it's open. Recomputed each press so a
  // hidden visit link (private project) is never a tab stop.
  document.addEventListener('keydown', (e) => {
    if (!open || e.key !== 'Tab') return;
    const focusables = [visit, closeBtn].filter((f) => !f.hidden);
    const idx = focusables.indexOf(document.activeElement);
    if (idx === -1 || (e.shiftKey && idx === 0) || (!e.shiftKey && idx === focusables.length - 1)) {
      e.preventDefault();
      focusables[e.shiftKey ? focusables.length - 1 : 0].focus();
    }
  });

  return {
    get isOpen() {
      return open;
    },

    open(project, index) {
      lastFocus = document.activeElement;
      num.textContent = `0${index + 1} · `;
      title.textContent = project.name;
      tagline.textContent = project.tagline || '';
      tagline.hidden = !project.tagline;
      desc.textContent = project.description;
      tags.innerHTML = project.tags.map((t) => `<li>${t}</li>`).join('');
      // Empty url → no dead link. Show a non-clickable "Proyek privat" label.
      if (project.url) {
        visit.textContent = UI.panelVisit;
        visit.href = project.url;
        visit.hidden = false;
        privateLabel.hidden = true;
      } else {
        visit.hidden = true;
        visit.removeAttribute('href');
        privateLabel.hidden = false;
      }
      el.hidden = false;
      // Force a reflow so the closed transform is committed to the box tree
      // before we add .is-open; otherwise the browser coalesces the un-hide
      // and the class change into one frame and the slide-in never plays.
      void el.offsetWidth;
      el.classList.add('is-open');
      open = true;
      setTimeout(() => closeBtn.focus({ preventScroll: true }), 150);
    },

    close() {
      if (!open) return;
      open = false;
      el.classList.remove('is-open');
      setTimeout(() => {
        el.hidden = true;
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      }, 620);
    },
  };
}
