/* ==========================================================================
   UI.JS
   Toda la lógica de interfaz que no es Three.js: modales de recuerdos,
   timeline, galería, carta con efecto máquina de escribir, pétalos,
   contador en tiempo real, reproductor de música, HUD y palabras flotantes.
   ========================================================================== */

const UI = (() => {

  let config = null;
  let counterInterval = null;

  function init(cfg) {
    config = cfg;
    setupModal();
    setupMusic();
    setupHud();
    setupFloatingWords();
    setupSecretHeart();
    setupLetter();
    startCounter();
  }

  /* --------------------------- MODAL DE RECUERDO --------------------------- */
  function setupModal() {
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('memoryModal').addEventListener('click', (e) => {
      if (e.target.id === 'memoryModal') closeModal();
    });
  }
  function openModal(data) {
    const photoEl = document.getElementById('modalPhoto');
    const src = (data.foto && data.foto.trim()) ? data.foto : TextureFactory.photoPlaceholder(data.nombre, 480, 360);
    photoEl.style.backgroundImage = `url(${src})`;
    document.getElementById('modalTitle').textContent = data.nombre;
    document.getElementById('modalDate').textContent = data.fecha;
    document.getElementById('modalDesc').textContent = data.descripcion;

    const modal = document.getElementById('memoryModal');
    modal.classList.remove('hidden');
    gsap.fromTo(modal.querySelector('.modal-card'),
      { scale: 0.85, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.6)' }
    );
  }
  function closeModal() {
    AudioFX.close();
    const modal = document.getElementById('memoryModal');
    gsap.to(modal.querySelector('.modal-card'), {
      scale: 0.9, opacity: 0, y: 20, duration: 0.3, ease: 'power2.in',
      onComplete: () => modal.classList.add('hidden')
    });
  }

  /* ------------------------------- MÚSICA ------------------------------- */
  function setupMusic() {
    const audio = document.getElementById('bgMusic');
    const btnMusic = document.getElementById('btnMusic');
    const panel = document.getElementById('musicPanel');
    const btnPlayPause = document.getElementById('btnPlayPause');
    const btnMute = document.getElementById('btnMute');
    const volumeSlider = document.getElementById('volumeSlider');

    if (config.musica && config.musica.src) audio.src = config.musica.src;
    audio.volume = (config.musica && config.musica.volumenInicial) ?? 0.5;
    volumeSlider.value = audio.volume;
    document.getElementById('musicTitle').textContent = (config.musica && config.musica.titulo) || 'Nuestra canción';

    btnMusic.addEventListener('click', () => panel.classList.toggle('hidden'));

    btnPlayPause.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch(()=>{});
        btnPlayPause.textContent = '⏸';
      } else {
        audio.pause();
        btnPlayPause.textContent = '▶';
      }
    });

    btnMute.addEventListener('click', () => {
      audio.muted = !audio.muted;
      btnMute.textContent = audio.muted ? '🔇' : '🔊';
    });

    volumeSlider.addEventListener('input', (e) => {
      audio.volume = parseFloat(e.target.value);
      if (audio.volume === 0) { audio.muted = true; btnMute.textContent = '🔇'; }
      else { audio.muted = false; btnMute.textContent = '🔊'; }
    });

    // Autoplay si está configurado (requiere interacción previa del usuario, ya cubierta por el botón "Entrar")
    if (config.musica && config.musica.autoplay) {
      audio.play().then(() => { btnPlayPause.textContent = '⏸'; }).catch(()=>{});
    }
  }

  /* --------------------------------- HUD --------------------------------- */
  function setupHud() {
    document.getElementById('btnFullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(()=>{});
      } else {
        document.exitFullscreen?.();
      }
    });

    document.getElementById('btnRestart').addEventListener('click', () => {
      if (confirm('¿Quieres reiniciar la experiencia desde el inicio?')) {
        location.reload();
      }
    });

    document.getElementById('btnShare').addEventListener('click', async () => {
      const shareData = {
        title: 'Nuestro Universo ❤️',
        text: 'Te preparé algo especial, entra a ver...',
        url: window.location.href
      };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch(e) {}
      } else {
        try {
          await navigator.clipboard.writeText(window.location.href);
          alert('¡Enlace copiado! Compártelo con tu persona especial 💜');
        } catch(e) {
          alert('No se pudo copiar el enlace automáticamente.');
        }
      }
    });
  }

  /* ---------------------------- PALABRAS FLOTANTES ---------------------------- */
  function setupFloatingWords() {
    const container = document.getElementById('floatingWords');
    const words = config.palabras || [];
    const colorClasses = ['word-pink', 'word-purple', 'word-cyan'];
    words.forEach((word, i) => {
      const el = document.createElement('div');
      el.className = 'floating-word ' + colorClasses[i % colorClasses.length];
      el.textContent = word;
      const startX = Math.random()*90 + 2;
      const startY = Math.random()*85 + 5;
      el.style.left = startX + '%';
      el.style.top = startY + '%';
      el.style.opacity = (0.35 + Math.random()*0.4).toFixed(2);
      container.appendChild(el);

      const duration = 14 + Math.random()*10;
      gsap.to(el, {
        x: (Math.random()-0.5) * 120,
        y: (Math.random()-0.5) * 120,
        duration, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i*0.3
      });
      gsap.to(el, {
        opacity: '+=0.15', duration: 3+Math.random()*2, repeat:-1, yoyo:true, ease:'sine.inOut'
      });
    });
  }

  /* ------------------------------ CORAZÓN SECRETO ------------------------------ */
  function setupSecretHeart() {
    const heart = document.getElementById('secretHeart');
    const x = 8 + Math.random()*84;
    const y = 15 + Math.random()*70;
    heart.style.left = x + '%';
    heart.style.top = y + '%';

    heart.addEventListener('click', () => {
      AudioFX.secret();
      triggerSecretSurprise();
    });
  }

  function triggerSecretSurprise() {
    UniverseScene.secretZoom(() => {
      UniverseScene.starRain();
      setTimeout(() => {
        showLetter();
      }, 900);
    });
  }

  /* -------------------------------- CARTA -------------------------------- */
  let typing = false;
  function setupLetter() {
    document.getElementById('letterCloseBtn').addEventListener('click', () => {
      AudioFX.close();
      const overlay = document.getElementById('letterOverlay');
      gsap.to(overlay.querySelector('.letter-card'), {
        opacity: 0, y: 20, duration: 0.4, onComplete: () => {
          overlay.classList.add('hidden');
          clearPetals();
          UniverseScene.secretZoomOut();
        }
      });
    });
  }

  function showLetter() {
    AudioFX.letter();
    const overlay = document.getElementById('letterOverlay');
    const titleEl = document.getElementById('letterTitle');
    const textEl = document.getElementById('letterText');
    const closeBtn = document.getElementById('letterCloseBtn');
    const cursor = document.getElementById('letterCursor');

    titleEl.textContent = (config.carta && config.carta.titulo) || 'Para ti';
    textEl.textContent = '';
    closeBtn.classList.add('hidden');
    overlay.classList.remove('hidden');
    gsap.fromTo(overlay.querySelector('.letter-card'), { opacity:0, scale:0.9 }, { opacity:1, scale:1, duration:0.6, ease:'power2.out' });

    const fullText = (config.carta && config.carta.texto) || '';
    let i = 0;
    typing = true;
    const speed = 22;

    function typeChar() {
      if (!typing) return;
      if (i < fullText.length) {
        textEl.textContent += fullText[i];
        i++;
        setTimeout(typeChar, speed);
      } else {
        cursor.classList.add('hidden');
        closeBtn.classList.remove('hidden');
        spawnPetals();
      }
    }
    setTimeout(typeChar, 400);
  }

  function spawnPetals() {
    const container = document.getElementById('petalsContainer');
    const count = 40;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.style.left = Math.random()*100 + '%';
        petal.style.background = Math.random() > 0.5 ? '#ff5cb3' : '#c65cff';
        container.appendChild(petal);
        gsap.to(petal, {
          y: window.innerHeight + 40,
          x: `+=${(Math.random()-0.5)*200}`,
          rotation: Math.random()*360,
          duration: 4 + Math.random()*3,
          ease: 'power1.in',
          onComplete: () => petal.remove()
        });
      }, i * 90);
    }
  }
  function clearPetals() {
    document.getElementById('petalsContainer').innerHTML = '';
  }

  /* ------------------------------- CONTADOR ------------------------------- */
  function startCounter() {
    const startDate = new Date((config.pareja && config.pareja.fechaInicio) || Date.now());
    function tick() {
      const now = new Date();
      let diff = Math.max(0, now - startDate);
      const days = Math.floor(diff / 86400000);
      diff -= days*86400000;
      const hours = Math.floor(diff / 3600000);
      diff -= hours*3600000;
      const mins = Math.floor(diff / 60000);
      diff -= mins*60000;
      const secs = Math.floor(diff / 1000);

      document.getElementById('cDays').textContent = days;
      document.getElementById('cHours').textContent = String(hours).padStart(2,'0');
      document.getElementById('cMin').textContent = String(mins).padStart(2,'0');
      document.getElementById('cSec').textContent = String(secs).padStart(2,'0');
    }
    tick();
    counterInterval = setInterval(tick, 1000);
  }

  /* ------------------------------- UTILIDADES ------------------------------- */
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  return { init, openModal };
})();

