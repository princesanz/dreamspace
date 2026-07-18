import { SITE } from '../content.js';

// Ambient sound. Two sources, one interface:
//   • SITE.ambientUrl set and it loads → a looping <audio> element (real MP3).
//   • empty OR the file fails to load  → a synthesized WebAudio drone.
// Muted by default; built lazily on the first user toggle so autoplay policy
// is respected (the toggle click IS the gesture). Volume eases in/out.
//
// To ship the MP3 later: drop public/ambient.mp3 and set SITE.ambientUrl =
// '/ambient.mp3'. No other change needed.
export function createAmbientAudio() {
  const TARGET = 0.5; // file playback volume when on
  let mode = null; // 'file' | 'synth'
  let on = false;

  // --- file source ---
  let el = null;
  let fadeRAF = 0;

  // --- synth source ---
  let ctx = null;
  let master = null;

  function buildSynth() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 260;
    filter.Q.value = 0.7;
    filter.connect(master);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 95;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const voices = [
      [55.0, 0.5, 'sine'],
      [55.6, 0.42, 'sine'],
      [110.4, 0.2, 'triangle'],
      [82.8, 0.13, 'sine'],
    ];
    for (const [freq, gain, type] of voices) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = gain;
      osc.connect(g);
      g.connect(filter);
      osc.start();
    }

    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 620;
    bp.Q.value = 0.6;
    const ng = ctx.createGain();
    ng.gain.value = 0.05;
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(master);
    noise.start();
  }

  function rampSynth(target) {
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(target, now + 1.8);
  }

  // rAF volume ramp for the <audio> element (eases in/out, pauses at zero).
  function fadeEl(target, dur = 1.8) {
    cancelAnimationFrame(fadeRAF);
    const start = el.volume;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min((t - t0) / (dur * 1000), 1);
      el.volume = start + (target - start) * k;
      if (k < 1) fadeRAF = requestAnimationFrame(step);
      else if (target === 0) el.pause();
    };
    fadeRAF = requestAnimationFrame(step);
  }

  function fallbackToSynth() {
    if (mode === 'synth') return;
    if (el) {
      try { el.pause(); } catch { /* ignore */ }
      el = null;
    }
    if (!ctx) buildSynth();
    mode = 'synth';
  }

  // Create the source synchronously inside the gesture so play()/resume()
  // count as user-initiated.
  function ensure() {
    if (mode) return;
    if (SITE.ambientUrl) {
      el = new Audio(SITE.ambientUrl);
      el.loop = true;
      el.preload = 'auto';
      el.volume = 0;
      // If the file 404s or can't decode, fall back and keep audio working.
      el.addEventListener('error', () => {
        const wasOn = on;
        fallbackToSynth();
        if (wasOn) rampSynth(0.14);
      });
      mode = 'file';
    } else {
      buildSynth();
      mode = 'synth';
    }
  }

  return {
    toggle() {
      ensure();
      on = !on;
      if (mode === 'file') {
        if (on) {
          el.play()
            .then(() => fadeEl(TARGET))
            .catch(() => {
              // Blocked or missing → synth fallback, started if we're on.
              fallbackToSynth();
              rampSynth(0.14);
            });
        } else {
          fadeEl(0);
        }
      } else {
        rampSynth(on ? 0.14 : 0);
      }
      return on;
    },
  };
}
