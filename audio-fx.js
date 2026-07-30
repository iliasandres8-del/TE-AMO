/* ==========================================================================
   AUDIO-FX.JS
   Efectos de sonido cortos generados con la Web Audio API.
   No requieren archivos externos: se sintetizan en tiempo real.
   ========================================================================== */

const AudioFX = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Genera un tono corto tipo "blip" con envolvente suave
  function blip({ freq = 440, duration = 0.15, type = 'sine', volume = 0.15, glideTo = null } = {}) {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, c.currentTime + duration);
      gain.gain.setValueAtTime(0.0001, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, c.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
      osc.connect(gain).connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + duration + 0.05);
    } catch (e) { /* silencioso si el navegador bloquea audio */ }
  }

  return {
    hover: () => blip({ freq: 700, duration: 0.08, type: 'sine', volume: 0.06, glideTo: 900 }),
    open: () => blip({ freq: 420, duration: 0.35, type: 'triangle', volume: 0.12, glideTo: 720 }),
    close: () => blip({ freq: 600, duration: 0.2, type: 'triangle', volume: 0.1, glideTo: 300 }),
    loadingStart: () => blip({ freq: 220, duration: 0.4, type: 'sine', volume: 0.1, glideTo: 440 }),
    loadingEnd: () => blip({ freq: 500, duration: 0.6, type: 'sine', volume: 0.14, glideTo: 1000 }),
    letter: () => blip({ freq: 660, duration: 0.5, type: 'sine', volume: 0.12, glideTo: 880 }),
    secret: () => blip({ freq: 300, duration: 0.7, type: 'sawtooth', volume: 0.1, glideTo: 1200 }),
  };
})();
