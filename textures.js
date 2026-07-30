/* ==========================================================================
   TEXTURES.JS
   Genera texturas "placeholder" bonitas con <canvas> cuando el usuario
   todavía no ha puesto una foto real en config.json.
   Así la página funciona perfecta desde el primer momento.
   ========================================================================== */

const TextureFactory = (() => {

  // Crea una textura circular tipo "planeta" con gradiente + un corazón sutil
  function planetPlaceholder(colorHex, size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(size*0.35, size*0.35, size*0.05, size*0.5, size*0.5, size*0.55);
    grad.addColorStop(0, shade(colorHex, 40));
    grad.addColorStop(0.5, colorHex);
    grad.addColorStop(1, shade(colorHex, -45));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Manchas suaves tipo "nubes de planeta"
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const rx = Math.random()*size, ry = Math.random()*size, rr = size*(0.08+Math.random()*0.12);
      ctx.fillStyle = '#ffffff';
      ctx.ellipse(rx, ry, rr, rr*0.5, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Corazón sutil en el centro
    ctx.save();
    ctx.translate(size/2, size/2);
    ctx.scale(size/120, size/120);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    drawHeartPath(ctx);
    ctx.fill();
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
  }

  // Textura rectangular tipo "foto" placeholder (para foto principal, modales, galería, timeline)
  function photoPlaceholder(label = '', w = 512, h = 384) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#3a1f6b');
    grad.addColorStop(0.5, '#7a2ee0');
    grad.addColorStop(1, '#ff5cb3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Estrellitas
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 40; i++) {
      const x = Math.random()*w, y = Math.random()*h, r = Math.random()*1.6;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }

    // Corazón central
    ctx.save();
    ctx.translate(w/2, h/2 - 10);
    ctx.scale(Math.min(w,h)/150, Math.min(w,h)/150);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.shadowColor = '#ff5cb3';
    ctx.shadowBlur = 18;
    drawHeartPath(ctx);
    ctx.fill();
    ctx.restore();

    if (label) {
      ctx.font = `600 ${Math.round(h*0.06)}px Georgia, serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'center';
      ctx.fillText(label, w/2, h*0.82);
    }

    return canvas.toDataURL('image/png');
  }

  function drawHeartPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.bezierCurveTo(-30, -6, -18, -34, 0, -14);
    ctx.bezierCurveTo(18, -34, 30, -6, 0, 18);
    ctx.closePath();
  }

  function shade(hex, percent) {
    const num = parseInt(hex.replace('#',''), 16);
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00FF) + percent;
    let b = (num & 0x0000FF) + percent;
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `rgb(${r},${g},${b})`;
  }

  return { planetPlaceholder, photoPlaceholder };
})();
