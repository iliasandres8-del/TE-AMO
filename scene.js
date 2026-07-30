/* ==========================================================================
   SCENE.JS
   Todo lo relacionado al universo 3D construido con Three.js:
   estrellas, nebulosa, galaxia espiral, foto principal, planetas,
   cometas/estrellas fugaces, parallax de mouse y giroscopio.
   ========================================================================== */

const UniverseScene = (() => {

  let scene, camera, renderer, clock;
  let starfield, galaxyPoints, nebulaMesh;
  let centralPhotoGroup, centralOrbitRing;
  let planetGroup = [];
  let comets = [];
  let raycaster, mouseNDC;
  let hoveredPlanet = null;
  let mouseTarget = { x: 0, y: 0 };
  let gyroTarget = { x: 0, y: 0 };
  let config = null;
  let onPlanetClick = null;
  let cameraBasePos = new THREE.Vector3(0, 6, 42);
  let zoomedIn = false;

  function init(canvas, cfg, clickCallback) {
    config = cfg;
    onPlanetClick = clickCallback;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05040d, 0.0035);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.copy(cameraBasePos);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();
    mouseNDC = new THREE.Vector2(-999, -999);

    buildLights();
    buildStarfield();
    buildNebula();
    buildGalaxy();
    buildCentralPhoto();
    buildPlanets();

    window.addEventListener('resize', onResize);
    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });

    animate();
  }

  /* ---------------------------- LUCES ---------------------------- */
  function buildLights() {
    scene.add(new THREE.AmbientLight(0x4433aa, 0.6));
    const p1 = new THREE.PointLight(0x8a5cff, 2.2, 300);
    p1.position.set(0, 10, 0);
    scene.add(p1);
    const p2 = new THREE.PointLight(0xff5cb3, 1.4, 300);
    p2.position.set(50, -20, -50);
    scene.add(p2);
    const p3 = new THREE.PointLight(0x3fd1ff, 1.2, 300);
    p3.position.set(-60, 30, 40);
    scene.add(p3);
  }

  /* ------------------------- CAMPO DE ESTRELLAS ------------------------- */
  function buildStarfield() {
    const COUNT = 6000;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#c9b6ff'),
      new THREE.Color('#9be8ff'),
      new THREE.Color('#ffb6e6'),
    ];
    for (let i = 0; i < COUNT; i++) {
      const r = 200 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i*3+2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random()*palette.length)];
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 1.4, vertexColors: true, transparent: true, opacity: 0.9,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    starfield = new THREE.Points(geo, mat);
    scene.add(starfield);
  }

  /* ----------------------------- NEBULOSA ----------------------------- */
  function buildNebula() {
    nebulaMesh = new THREE.Group();
    const colors = ['#8a5cff', '#ff5cb3', '#3fd1ff'];
    for (let i = 0; i < 5; i++) {
      const size = 60 + Math.random()*80;
      const geo = new THREE.SphereGeometry(size, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true, opacity: 0.045,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random()-0.5) * 400,
        (Math.random()-0.5) * 200,
        (Math.random()-0.5) * 400 - 100
      );
      nebulaMesh.add(mesh);
    }
    scene.add(nebulaMesh);
  }

  /* ------------------------- GALAXIA ESPIRAL ------------------------- */
  function buildGalaxy() {
    const COUNT = 9000;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const inner = new THREE.Color('#ffd9ec');
    const outer = new THREE.Color('#5a2ee0');
    const arms = 4;
    const radius = 26;

    for (let i = 0; i < COUNT; i++) {
      const t = Math.random();
      const r = t * radius;
      const armAngle = (i % arms) * (Math.PI*2/arms);
      const spin = r * 0.55;
      const randomAngleOffset = (Math.random()-0.5) * 0.5;
      const angle = armAngle + spin + randomAngleOffset;

      const spread = (1 - t) * 1.2 + 0.15;
      const x = Math.cos(angle) * r + (Math.random()-0.5) * spread;
      const z = Math.sin(angle) * r + (Math.random()-0.5) * spread;
      const y = (Math.random()-0.5) * spread * 0.6;

      positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z;

      const mixed = inner.clone().lerp(outer, t);
      colors[i*3] = mixed.r; colors[i*3+1] = mixed.g; colors[i*3+2] = mixed.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.55, vertexColors: true, transparent: true, opacity: 0.85,
      depthWrite: false, blending: THREE.AdditiveBlending
    });
    galaxyPoints = new THREE.Points(geo, mat);
    galaxyPoints.rotation.x = 0.35;
    scene.add(galaxyPoints);
  }

  /* -------------------------- FOTO PRINCIPAL -------------------------- */
  function buildCentralPhoto() {
    centralPhotoGroup = new THREE.Group();

    const loader = new THREE.TextureLoader();
    const src = (config.pareja.fotoPrincipal && config.pareja.fotoPrincipal.trim())
      ? config.pareja.fotoPrincipal
      : TextureFactory.photoPlaceholder('Nuestra foto', 512, 512);
    const tex = loader.load(src);
    tex.colorSpace = THREE.SRGBColorSpace;

    const geo = new THREE.CircleGeometry(6, 64);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const photoMesh = new THREE.Mesh(geo, mat);
    centralPhotoGroup.add(photoMesh);

    // Anillo de brillo (glow) detrás de la foto
    const glowGeo = new THREE.RingGeometry(6.1, 8.4, 64);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff8ad1, transparent: true, opacity: 0.35, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    centralOrbitRing = new THREE.Mesh(glowGeo, glowMat);
    centralPhotoGroup.add(centralOrbitRing);

    // Órbita fina
    const orbitGeo = new THREE.RingGeometry(10, 10.08, 96);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide
    });
    const orbitLine = new THREE.Mesh(orbitGeo, orbitMat);
    orbitLine.rotation.x = Math.PI/2.1;
    centralPhotoGroup.add(orbitLine);

    // Partículas alrededor de la foto
    const pCount = 300;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount*3);
    for (let i=0;i<pCount;i++){
      const a = Math.random()*Math.PI*2;
      const r = 7 + Math.random()*4;
      pPos[i*3] = Math.cos(a)*r;
      pPos[i*3+1] = (Math.random()-0.5)*3;
      pPos[i*3+2] = Math.sin(a)*r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos,3));
    const pMat = new THREE.PointsMaterial({ color:0xffd9f2, size:0.25, transparent:true, opacity:0.8, blending:THREE.AdditiveBlending, depthWrite:false });
    const photoParticles = new THREE.Points(pGeo, pMat);
    centralPhotoGroup.add(photoParticles);
    centralPhotoGroup.userData.particles = photoParticles;

    centralPhotoGroup.position.set(0, 4, 0);
    scene.add(centralPhotoGroup);
  }

  /* ------------------------------ PLANETAS ------------------------------ */
  function buildPlanets() {
    const list = config.planetas || [];
    const count = list.length;
    list.forEach((data, i) => {
      const radius = 18 + (i % 5) * 6;
      const speed = 0.04 + Math.random()*0.03;
      const angle0 = (i / count) * Math.PI * 2;
      const yOffset = Math.sin(i * 1.7) * 6;
      const size = 1.6 + Math.random()*0.9;

      const tex = data.foto && data.foto.trim()
        ? new THREE.TextureLoader().load(data.foto)
        : TextureFactory.planetPlaceholder(data.color || '#8a5cff');

      const geo = new THREE.SphereGeometry(size, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        map: tex, roughness: 0.55, metalness: 0.15,
        emissive: new THREE.Color(data.color || '#8a5cff'),
        emissiveIntensity: 0.12
      });
      const mesh = new THREE.Mesh(geo, mat);

      // Halo/glow del planeta
      const haloGeo = new THREE.SphereGeometry(size*1.35, 24, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: data.color || '#8a5cff', transparent:true, opacity:0.18,
        blending: THREE.AdditiveBlending, depthWrite:false
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      mesh.add(halo);

      mesh.userData = {
        data, radius, speed, angle: angle0, yOffset, baseScale: size,
        halo, targetScale: 1, currentScale: 1
      };

      scene.add(mesh);
      planetGroup.push(mesh);
    });
  }

  /* -------------------------- COMETAS / FUGACES -------------------------- */
  function spawnComet() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 2.4, transparent:true, opacity:1,
      blending: THREE.AdditiveBlending, depthWrite:false
    });
    const point = new THREE.Points(geo, mat);

    const startX = (Math.random()-0.5) * 300;
    const startY = 80 + Math.random()*60;
    const startZ = (Math.random()-0.5) * 200 - 100;
    point.position.set(startX, startY, startZ);

    const dir = new THREE.Vector3(-1 - Math.random(), -1 - Math.random()*0.5, Math.random()*0.4);
    dir.normalize();

    comets.push({ mesh: point, dir, life: 0, maxLife: 2 + Math.random()*1.5, speed: 60 + Math.random()*40 });
    scene.add(point);
  }

  function updateComets(dt) {
    for (let i = comets.length-1; i>=0; i--) {
      const c = comets[i];
      c.life += dt;
      c.mesh.position.addScaledVector(c.dir, c.speed * dt);
      c.mesh.material.opacity = Math.max(0, 1 - c.life / c.maxLife);
      if (c.life >= c.maxLife) {
        scene.remove(c.mesh);
        comets.splice(i, 1);
      }
    }
  }

  /* ------------------------------ EVENTOS ------------------------------ */
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onPointerMove(e) {
    mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    mouseTarget.x = (e.clientX / window.innerWidth - 0.5);
    mouseTarget.y = (e.clientY / window.innerHeight - 0.5);
  }
  function onTouchMove(e) {
    if (!e.touches || !e.touches[0]) return;
    const t = e.touches[0];
    mouseNDC.x = (t.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(t.clientY / window.innerHeight) * 2 + 1;
  }

  function onPointerDown() {
    raycaster.setFromCamera(mouseNDC, camera);
    const hits = raycaster.intersectObjects(planetGroup, false);
    if (hits.length > 0) {
      const planet = hits[0].object;
      AudioFX.open();
      if (onPlanetClick) onPlanetClick(planet.userData.data);
    }
  }

  function enableGyroscope() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(state => {
        if (state === 'granted') window.addEventListener('deviceorientation', onDeviceOrientation);
      }).catch(()=>{});
    } else {
      window.addEventListener('deviceorientation', onDeviceOrientation);
    }
  }
  function onDeviceOrientation(e) {
    if (e.gamma === null) return;
    gyroTarget.x = THREE.MathUtils.clamp(e.gamma / 45, -1, 1);
    gyroTarget.y = THREE.MathUtils.clamp(e.beta / 45, -1, 1) - 0.4;
  }

  /* ------------------------------- LOOP ------------------------------- */
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (galaxyPoints) galaxyPoints.rotation.y += dt * 0.02;
    if (starfield) starfield.rotation.y += dt * 0.001;
    if (nebulaMesh) nebulaMesh.rotation.y += dt * 0.003;

    if (centralPhotoGroup) {
      centralPhotoGroup.rotation.y += dt * 0.15;
      centralPhotoGroup.position.y = 4 + Math.sin(t*0.6)*0.4;
      if (centralOrbitRing) centralOrbitRing.rotation.z += dt*0.1;
      const particles = centralPhotoGroup.userData.particles;
      if (particles) particles.rotation.y -= dt * 0.25;
    }

    // Planetas: órbita + hover raycasting
    raycaster.setFromCamera(mouseNDC, camera);
    const hits = raycaster.intersectObjects(planetGroup, false);
    const currentHover = hits.length > 0 ? hits[0].object : null;

    if (currentHover !== hoveredPlanet) {
      if (hoveredPlanet) hoveredPlanet.userData.targetScale = 1;
      if (currentHover) {
        currentHover.userData.targetScale = 1.5;
        AudioFX.hover();
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
      hoveredPlanet = currentHover;
    }

    planetGroup.forEach(p => {
      const u = p.userData;
      u.angle += dt * u.speed;
      p.position.x = Math.cos(u.angle) * u.radius;
      p.position.z = Math.sin(u.angle) * u.radius;
      p.position.y = u.yOffset + Math.sin(t*0.5 + u.angle) * 1.5;
      p.rotation.y += dt * 0.3;

      u.currentScale += (u.targetScale - u.currentScale) * Math.min(1, dt*8);
      p.scale.setScalar(u.currentScale);
    });

    // Cometas aleatorios
    if (Math.random() < 0.01) spawnComet();
    updateComets(dt);

    // Parallax de cámara (mouse + giroscopio) si no está en modo zoom secreto
    if (!zoomedIn) {
      const px = mouseTarget.x + gyroTarget.x * 0.6;
      const py = mouseTarget.y + gyroTarget.y * 0.6;
      camera.position.x += (cameraBasePos.x + px*10 - camera.position.x) * 0.02;
      camera.position.y += (cameraBasePos.y - py*6 - camera.position.y) * 0.02;
      camera.lookAt(0, 2, 0);

      // Movimiento lento orbital de la cámara alrededor del centro
      const slowAngle = t * 0.02;
      camera.position.x += Math.sin(slowAngle) * 0.02;
    }

    renderer.render(scene, camera);
  }

  /* --------------------------- ZOOM SECRETO --------------------------- */
  function secretZoom(onComplete) {
    zoomedIn = true;
    gsap.to(camera.position, {
      x: 0, y: 3, z: 14, duration: 2.4, ease: 'power3.inOut',
      onComplete: () => { if (onComplete) onComplete(); }
    });
  }
  function secretZoomOut() {
    gsap.to(camera.position, {
      x: cameraBasePos.x, y: cameraBasePos.y, z: cameraBasePos.z,
      duration: 2, ease: 'power3.inOut',
      onComplete: () => { zoomedIn = false; }
    });
  }

  function starRain() {
    for (let i=0;i<40;i++){
      setTimeout(()=>spawnComet(), i*40);
    }
  }

  return { init, enableGyroscope, secretZoom, secretZoomOut, starRain };
})();
