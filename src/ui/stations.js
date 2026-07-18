import { SITE, HERO, STATIONS, CONTACT, SKILLS, UI } from '../content.js';
import { PROJECTS } from '../../data/projects.js';

// Fixed text overlays, one per station, faded by proximity to the station's
// progress center. Semantic HTML (h1/h2/p/a) rendered once from content.js.
export function createOverlays(container, { isTouch }) {
  // Screen-reader / keyboard fallback: the fading overlays are visibility-
  // gated by scroll proximity, so a static block carries the full content
  // linearly. .sr-focusable controls reveal as chips when focused.
  const srBlock = document.createElement('div');
  srBlock.className = 'sr-block';
  srBlock.innerHTML = `
    <p class="sr-only">${HERO.sub}</p>
    ${STATIONS[1].body.map((p) => `<p class="sr-only">${p}</p>`).join('')}
    <nav aria-label="Karya — akses keyboard">
      ${PROJECTS.map(
        (p, i) =>
          `<button type="button" class="sr-focusable project-key" data-ui data-i="${i}">0${i + 1} · ${p.name}</button>`,
      ).join('')}
    </nav>
    <ul aria-label="Keahlian">${SKILLS.map((s) => `<li class="sr-only">${s.name}</li>`).join('')}</ul>
    <a class="sr-focusable" href="mailto:${CONTACT.email}">${CONTACT.email}</a>
  `;
  container.appendChild(srBlock);

  // Hero name: one word per line, never breaking mid-word. Per-character
  // spans keep the rise/reveal animation; the stagger index runs continuously
  // across all three lines so the reveal flows top-to-bottom.
  let chIndex = 0;
  const heroLines = SITE.nameLines
    .map((word) => {
      const chars = word
        .split('')
        .map((c) => `<span class="ch" style="--i:${chIndex++}">${c}</span>`)
        .join('');
      return `<span class="hero-line">${chars}</span>`;
    })
    .join('');

  const sections = STATIONS.map((s) => {
    const el = document.createElement('section');
    el.className = `station station--${s.key} align-${s.align}`;
    el.dataset.key = s.key;

    if (s.key === 'origin') {
      el.innerHTML = `
        <p class="kicker">${s.kicker}</p>
        <h1 class="hero-name" aria-label="${SITE.name}">${heroLines}</h1>
        <p class="hero-role">${SITE.role}</p>
        <p class="lede">${HERO.sub}</p>
        <div class="hint" aria-hidden="true">
          ${HERO.hint ? `<span>${HERO.hint}</span>` : ''}
          <span class="drip"></span>
        </div>`;
    } else if (s.key === 'contact') {
      el.id = 'kontak';
      el.tabIndex = -1;
      // CV button: a real download link once SITE.cvUrl is set, otherwise a
      // genuinely disabled button (removed from tab order, announced as
      // unavailable) with a subtle "segera" tag — not a dead link.
      const cvBtn = SITE.cvUrl
        ? `<a class="btn btn--cv" data-magnetic href="${SITE.cvUrl}" download>${UI.cvLabel}</a>`
        : `<button class="btn btn--cv is-soon" type="button" disabled aria-disabled="true" aria-label="${UI.cvSoonAria}">${UI.cvLabel}<span class="cv-soon" aria-hidden="true">${UI.cvSoon}</span></button>`;
      el.innerHTML = `
        <p class="kicker">${s.kicker}</p>
        <h2>${s.heading}</h2>
        <p class="lede">${s.body[0]}</p>
        <div class="contact-actions">
          <a class="btn btn--primary" data-magnetic href="mailto:${CONTACT.email}">${CONTACT.email}</a>
          <div class="socials">
            ${CONTACT.socials
              .map((so) => `<a class="btn" data-magnetic href="${so.url}" target="_blank" rel="noopener">${so.label}</a>`)
              .join('')}
            ${cvBtn}
          </div>
        </div>`;
    } else {
      const body = isTouch && s.bodyTouch ? s.bodyTouch : s.body;
      el.innerHTML = `
        <p class="kicker">${s.kicker}</p>
        <h2>${s.heading}</h2>
        ${body.map((p) => `<p class="lede">${p}</p>`).join('')}`;
    }

    container.appendChild(el);
    return { el, s };
  });

  return {
    // Continuous mode: opacity/translate from distance to the station center.
    update(progress) {
      for (const { el, s } of sections) {
        const d = (progress - s.progress) / s.width;
        const a = Math.max(0, 1 - Math.abs(d));
        const eased = a * a * (3 - 2 * a);
        el.style.opacity = eased.toFixed(3);
        el.style.transform = `translate3d(0, ${(-d * 30).toFixed(2)}px, 0)`;
        el.classList.toggle('is-active', eased > 0.45);
        el.style.visibility = eased > 0.01 ? 'visible' : 'hidden';
      }
    },

    // Reduced-motion mode: one active station, CSS crossfade does the rest.
    setReducedActive(idx) {
      sections.forEach(({ el }, i) => {
        el.style.opacity = '';
        el.style.transform = '';
        el.style.visibility = 'visible';
        el.classList.toggle('is-active', i === idx);
      });
    },

    reveal() {
      container.classList.add('is-ready');
    },
  };
}
