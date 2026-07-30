/* ==========================================================================
   MAIN.JS
   Orquesta el flujo completo: carga config.json → Pantalla 1 (bienvenida)
   → Pantalla 2 (carga) → Universo 3D. Conecta escena + UI.
   ========================================================================== */

(function () {

  const LOADING_MESSAGES = [
    '✨ Creando galaxias…',
    '✨ Encendiendo estrellas…',
    '✨ Recordando nuestro primer día…',
    '✨ Organizando nuestros momentos…',
    '✨ Preparando una sorpresa…'
  ];

  let CONFIG = null;

  document.addEventListener('DOMContentLoaded', async () => {
    CONFIG = await loadConfig();
    setupWelcomeScreen();
  });

  /* --------------------------- CARGA DE CONFIG.JSON --------------------------- */
  async function loadConfig() {
    try {
      const res = await fetch('config.json');
      if (!res.ok) throw new Error('No se pudo leer config.json');
      return await res.json();
    } catch (err) {
      console.warn('No se pudo cargar config.json (¿abriste el archivo directamente sin servidor local?). Usando datos de ejemplo.', err);
      return fallbackConfig();
    }
  }

  function fallbackConfig() {
    // Datos mínimos de respaldo por si config.json no pudo cargarse
    // (por ejemplo al abrir index.html con doble clic sin servidor local).
    return {
      pareja: { nombreEllas: 'Mi Amor', tituloBienvenida: 'Feliz Día de la Novia', fechaInicio: new Date().toISOString(), fotoPrincipal: '' },
      musica: { src: '', titulo: 'Nuestra canción', autoplay: false, volumenInicial: 0.5 },
      planetas: [],
      palabras: ['Te Amo', 'Mi Universo', 'Siempre Juntos'],
      timeline: [],
      galeria: [],
      carta: { titulo: 'Para ti', texto: 'Este es un mensaje de ejemplo. Edita config.json y sirve el proyecto desde un servidor local para ver tu contenido real.' }
    };
  }

  /* ------------------------------ PANTALLA 1 ------------------------------ */
  function setupWelcomeScreen() {
    const titleEl = document.getElementById('welcomeTitle');
    const baseTitle = (CONFIG.pareja && CONFIG.pareja.tituloBienvenida) || 'Feliz Día de la Novia';
    titleEl.innerHTML = `${escapeHtml(baseTitle)} <span class="heart-inline">❤</span>`;

    // Animación de entrada suave
    gsap.from('#glowHeart', { scale: 0, opacity: 0, duration: 1, ease: 'back.out(2)' });
    gsap.from('#welcomeTitle', { y: 20, opacity: 0, duration: 1, delay: 0.3, ease: 'power2.out' });
    gsap.from('#enterBtn', { y: 20, opacity: 0, duration: 1, delay: 0.6, ease: 'power2.out' });

    document.getElementById('enterBtn').addEventListener('click', () => {
      // Pide permiso de giroscopio en el mismo gesto de click (requisito de iOS)
      try { UniverseScene.enableGyroscope && UniverseScene.enableGyroscope(); } catch(e){}
      goToLoadingScreen();
    }, { once: true });
  }

  /* ------------------------------ PANTALLA 2 ------------------------------ */
  function goToLoadingScreen() {
    AudioFX.loadingStart();
    const welcome = document.getElementById('screen-welcome');
    const loading = document.getElementById('screen-loading');

    gsap.to(welcome, {
      opacity: 0, duration: 0.6, ease: 'power2.in',
      onComplete: () => {
        welcome.classList.add('hidden');
        loading.classList.remove('hidden');
        gsap.fromTo(loading, { opacity: 0 }, { opacity: 1, duration: 0.5 });
        runLoadingSequence();
      }
    });
  }

  function runLoadingSequence() {
    const fill = document.getElementById('progressFill');
    const pct = document.getElementById('progressPct');
    const msg = document.getElementById('loadingMsg');

    let progress = 0;
    let msgIndex = 0;
    msg.textContent = LOADING_MESSAGES[0];

    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      gsap.fromTo(msg, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35 });
      msg.textContent = LOADING_MESSAGES[msgIndex];
    }, 900);

    const progressInterval = setInterval(() => {
      progress += Math.random() * 9 + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        clearInterval(msgInterval);
        fill.style.width = '100%';
        pct.textContent = '100%';
        AudioFX.loadingEnd();
        setTimeout(cinematicTransitionToUniverse, 500);
        return;
      }
      fill.style.width = progress + '%';
      pct.textContent = Math.floor(progress) + '%';
    }, 260);
  }

  /* --------------------------- TRANSICIÓN CINEMÁTICA --------------------------- */
  function cinematicTransitionToUniverse() {
    const loading = document.getElementById('screen-loading');
    gsap.to(loading, {
      opacity: 0, scale: 1.15, duration: 1, ease: 'power3.in',
      onComplete: () => {
        loading.classList.add('hidden');
        loading.style.transform = '';
        startUniverse();
      }
    });
  }

  /* ------------------------------ UNIVERSO ------------------------------ */
  function startUniverse() {
    const universe = document.getElementById('screen-universe');
    universe.classList.remove('hidden');
    gsap.fromTo(universe, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' });

    const canvas = document.getElementById('universeCanvas');
    UniverseScene.init(canvas, CONFIG, (planetData) => UI.openModal(planetData));
    UI.init(CONFIG);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

})();
