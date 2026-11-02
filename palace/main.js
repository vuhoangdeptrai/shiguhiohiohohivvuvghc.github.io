/**
 * BUCKINGHAM PALACE 3D - MAIN APPLICATION CONTROLLER
 * Handles Three.js rendering, camera controls, lighting transitions,
 * hotspot projection, procedural Web Audio ambiance, and tourist UI.
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    lighting: 'day', // 'day', 'sunset', 'night'
    flag: 'royal', // 'royal', 'union'
    isAudioPlaying: false,
    autoRotate: false,
    activeHotspot: null,
    activeTab: 'explorer',
    isDrawerOpen: false,
  };

  let scene, camera, renderer, controls;
  let palaceBuilder, palaceSceneData;
  let dirLight, ambientLight, hemiLight, uplights = [];
  let starsMesh = null;
  let rafId = null;
  const clock = new THREE.Clock();

  // --- AUDIO SYNTHESIZER (Native Web Audio API) ---
  const SoundEngine = (function () {
    let ctx = null;
    let masterGain = null;
    let ambientNode = null;
    let isInitialized = false;

    function init() {
      if (isInitialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
        masterGain.connect(ctx.destination);
        isInitialized = true;
      } catch (e) {
        console.warn('Web Audio not supported', e);
      }
    }

    // Royal Brass Fanfare Synth
    function playFanfare() {
      init();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      // Ceremonial Fanfare notes (C4, G4, C5, E5, G5, C6)
      const notes = [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
      const durations = [0.22, 0.22, 0.24, 0.24, 0.35, 0.7];
      let now = ctx.currentTime + 0.05;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        // Brass-like formant filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.08);
        filter.frequency.exponentialRampToValueAtTime(1200, now + durations[idx]);

        // Volume envelope
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + durations[idx]);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + durations[idx] + 0.05);

        now += durations[idx] * 0.95;
      });
    }

    // London Park Birdsong & Gentle Air Ambiance
    function startLondonAmbiance() {
      init();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      if (ambientNode) return;

      // Soft pink noise buffer for breeze
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.03;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      const breezeGain = ctx.createGain();
      breezeGain.gain.setValueAtTime(0.12, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(breezeGain);
      breezeGain.connect(masterGain);
      whiteNoise.start();

      ambientNode = {
        noise: whiteNoise,
        gain: breezeGain,
      };

      // Random bird chirps every few seconds
      scheduleRandomBirdChirp();
    }

    function stopLondonAmbiance() {
      if (ambientNode) {
        try {
          ambientNode.noise.stop();
        } catch (e) {}
        ambientNode = null;
      }
    }

    function scheduleRandomBirdChirp() {
      if (!ambientNode || !ctx) return;
      const delay = 4000 + Math.random() * 6000;
      setTimeout(() => {
        if (!ambientNode) return;
        playBirdChirp();
        scheduleRandomBirdChirp();
      }, delay);
    }

    function playBirdChirp() {
      if (!ctx || ctx.state !== 'running') return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 2200 + Math.random() * 800;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.06);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, t + 0.12);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.15);
    }

    return {
      playFanfare,
      startLondonAmbiance,
      stopLondonAmbiance,
    };
  })();

  // --- INITIALIZE 3D SCENE ---
  function init3D() {
    const container = document.getElementById('webgl-container');
    if (!container) return;

    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa7c5eb);
    scene.fog = new THREE.FogExp2(0xa7c5eb, 0.0028);

    // 2. Camera
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 800);
    camera.position.set(0, 18, 125);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 240;
    controls.maxPolarAngle = Math.PI / 2 - 0.03; // Prevent dipping under ground
    controls.target.set(0, 11, 25);
    controls.update();

    // 5. Lights
    setupLighting();

    // 6. Stars for Night Mode
    setupStarfield();

    // 7. Build Buckingham Palace
    palaceBuilder = PalaceModel.createPalaceBuilder();
    palaceSceneData = palaceBuilder.buildEntireScene();
    scene.add(palaceSceneData.root);

    // 8. Generate HTML Hotspot Markers
    createHotspotMarkers(palaceSceneData.hotspots);

    // 9. Resize Handling
    window.addEventListener('resize', onWindowResize);

    // 10. Start Loop
    clock.start();
    animate();
  }

  // --- LIGHTING SETUP ---
  function setupLighting() {
    // Ambient / Fill Light
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Hemisphere Light (sky / ground bounce)
    hemiLight = new THREE.HemisphereLight(0xbfe3ff, 0x544738, 0.55);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // Main Sun Directional Light
    dirLight = new THREE.DirectionalLight(0xfff7e8, 1.85);
    dirLight.position.set(65, 80, 75);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 280;
    dirLight.shadow.bias = -0.0004;

    const d = 110;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Facade Architectural Uplights (for Night Gala mode)
    const uplightPositions = [-40, -20, 0, 20, 40];
    uplightPositions.forEach((ux) => {
      const spot = new THREE.SpotLight(0xffdfa0, 0, 45, Math.PI / 4, 0.45, 1);
      spot.position.set(ux, 0.5, 20);
      spot.target.position.set(ux, 14, 8);
      scene.add(spot);
      scene.add(spot.target);
      uplights.push(spot);
    });
  }

  // --- NIGHT STARFIELD ---
  function setupStarfield() {
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 600;
      positions[i + 1] = 60 + Math.random() * 250;
      positions[i + 2] = (Math.random() - 0.5) * 600;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.4,
      transparent: true,
      opacity: 0,
    });
    starsMesh = new THREE.Points(starGeo, starMat);
    scene.add(starsMesh);
  }

  // --- LIGHTING / TIME OF DAY MODES ---
  function setLightingMode(mode) {
    state.lighting = mode;
    palaceBuilder.setLightingMode(mode);

    // Update UI active button
    document.querySelectorAll('[data-lighting]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lighting === mode);
    });

    if (mode === 'day') {
      scene.background.set(0xa7c5eb);
      scene.fog.color.set(0xa7c5eb);
      scene.fog.density = 0.0028;

      dirLight.color.set(0xfff7e8);
      dirLight.intensity = 1.85;
      dirLight.position.set(65, 80, 75);

      ambientLight.color.set(0xffffff);
      ambientLight.intensity = 0.5;

      hemiLight.color.set(0xbfe3ff);
      hemiLight.groundColor.set(0x544738);
      hemiLight.intensity = 0.55;

      renderer.toneMappingExposure = 1.05;

      uplights.forEach((sp) => (sp.intensity = 0));
      if (starsMesh) starsMesh.material.opacity = 0;
    } else if (mode === 'sunset') {
      scene.background.set(0xd97c55);
      scene.fog.color.set(0xd97c55);
      scene.fog.density = 0.0032;

      dirLight.color.set(0xff8344);
      dirLight.intensity = 2.4;
      dirLight.position.set(110, 24, 60);

      ambientLight.color.set(0xffb799);
      ambientLight.intensity = 0.4;

      hemiLight.color.set(0xffa175);
      hemiLight.groundColor.set(0x4a2e22);
      hemiLight.intensity = 0.45;

      renderer.toneMappingExposure = 1.15;

      uplights.forEach((sp) => (sp.intensity = 0.4));
      if (starsMesh) starsMesh.material.opacity = 0.15;
    } else if (mode === 'night') {
      scene.background.set(0x090f1d);
      scene.fog.color.set(0x090f1d);
      scene.fog.density = 0.0035;

      // Soft cool moonlight
      dirLight.color.set(0x7899cc);
      dirLight.intensity = 0.35;
      dirLight.position.set(-50, 70, -40);

      ambientLight.color.set(0x192742);
      ambientLight.intensity = 0.25;

      hemiLight.color.set(0x1b2d4b);
      hemiLight.groundColor.set(0x0d1421);
      hemiLight.intensity = 0.3;

      renderer.toneMappingExposure = 0.95;

      // Dramatic facade golden uplighting
      uplights.forEach((sp) => (sp.intensity = 3.2));
      if (starsMesh) starsMesh.material.opacity = 0.9;
    }
  }

  // --- SOVEREIGN FLAG TOGGLE ---
  function setFlagStatus(type) {
    state.flag = type;
    palaceBuilder.setFlag(type);

    const isInResidence = type === 'royal';
    const statusBadges = document.querySelectorAll('.sovereign-status-badge');
    const flagNames = document.querySelectorAll('.active-flag-name');
    const flagToggleBtns = document.querySelectorAll('[data-flag-type]');

    statusBadges.forEach((badge) => {
      badge.textContent = isInResidence
        ? 'His Majesty: In Residence'
        : 'His Majesty: Away from Palace';
      badge.className = `sovereign-status-badge ${isInResidence ? 'in-residence' : 'away'}`;
    });

    flagNames.forEach((el) => {
      el.textContent = isInResidence
        ? 'The Royal Standard'
        : 'The Union Flag (Union Jack)';
    });

    flagToggleBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.flagType === type);
    });
  }

  // --- HOTSPOT MARKERS (Screen Space Overlay) ---
  function createHotspotMarkers(hotspots) {
    const container = document.getElementById('hotspots-layer');
    if (!container) return;
    container.innerHTML = '';

    hotspots.forEach((spot) => {
      const pin = document.createElement('button');
      pin.className = 'hotspot-pin';
      pin.setAttribute('data-hotspot-id', spot.id);
      pin.setAttribute('aria-label', `Explore ${spot.title}`);

      pin.innerHTML = `
        <span class="hotspot-pulse"></span>
        <span class="hotspot-core"><i class="fa-solid fa-crown"></i></span>
        <div class="hotspot-label">
          <span class="badge">${spot.badge}</span>
          <span class="title">${spot.title}</span>
        </div>
      `;

      pin.addEventListener('click', () => {
        focusOnHotspot(spot);
      });

      container.appendChild(pin);
      spot.element = pin;
    });
  }

  function updateHotspotsScreenPositions() {
    if (!palaceSceneData || !palaceSceneData.hotspots || !camera) return;
    const container = document.getElementById('webgl-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const widthHalf = width / 2;
    const heightHalf = height / 2;

    const tempV = new THREE.Vector3();

    palaceSceneData.hotspots.forEach((spot) => {
      if (!spot.element) return;

      tempV.copy(spot.position);
      tempV.project(camera);

      // Check if marker is in front of camera
      const isBehind = tempV.z > 1;
      const isOffScreen =
        tempV.x < -1.1 || tempV.x > 1.1 || tempV.y < -1.1 || tempV.y > 1.1;

      if (isBehind || isOffScreen) {
        spot.element.style.display = 'none';
      } else {
        spot.element.style.display = 'flex';
        const x = tempV.x * widthHalf + widthHalf;
        const y = -(tempV.y * heightHalf) + heightHalf;
        spot.element.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0)`;
      }
    });
  }

  // --- CAMERA TWEEN & VIEW PRESETS ---
  function animateCameraTo(targetPos, lookAtPos, duration = 1600) {
    if (typeof TWEEN === 'undefined') {
      camera.position.copy(targetPos);
      controls.target.copy(lookAtPos);
      controls.update();
      return;
    }

    // Disable controls during tween
    controls.enabled = false;

    // Tween Camera Position
    new TWEEN.Tween(camera.position)
      .to(
        {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
        },
        duration
      )
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();

    // Tween Orbit Target (LookAt)
    new TWEEN.Tween(controls.target)
      .to(
        {
          x: lookAtPos.x,
          y: lookAtPos.y,
          z: lookAtPos.z,
        },
        duration
      )
      .easing(TWEEN.Easing.Cubic.InOut)
      .onComplete(() => {
        controls.enabled = true;
      })
      .start();
  }

  function focusOnHotspot(spot) {
    state.activeHotspot = spot;
    animateCameraTo(spot.cameraTarget, spot.cameraLookAt, 1700);
    openTouristDrawer(spot);
    SoundEngine.playFanfare();
  }

  function setCameraPreset(presetKey) {
    const presets = {
      facade: {
        pos: new THREE.Vector3(0, 16, 120),
        target: new THREE.Vector3(0, 11, 15),
      },
      balcony: {
        pos: new THREE.Vector3(0, 10.5, 26),
        target: new THREE.Vector3(0, 10.0, 5),
      },
      guard: {
        pos: new THREE.Vector3(-14, 5.5, 36),
        target: new THREE.Vector3(0, 2.5, 20),
      },
      memorial: {
        pos: new THREE.Vector3(0, 16, 114),
        target: new THREE.Vector3(0, 12, 82),
      },
      birds_eye: {
        pos: new THREE.Vector3(85, 75, 115),
        target: new THREE.Vector3(0, 5, -15),
      },
      pedestrian: {
        pos: new THREE.Vector3(-24, 2.5, 62),
        target: new THREE.Vector3(0, 5.5, 20),
      },
    };

    const preset = presets[presetKey];
    if (preset) {
      animateCameraTo(preset.pos, preset.target, 1600);
      document.querySelectorAll('[data-camera-preset]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.cameraPreset === presetKey);
      });
    }
  }

  // --- TOURIST DRAWER MODAL ---
  function openTouristDrawer(spot) {
    state.isDrawerOpen = true;
    const drawer = document.getElementById('tourist-info-drawer');
    if (!drawer) return;

    document.getElementById('drawer-category').textContent = spot.category;
    document.getElementById('drawer-badge').textContent = spot.badge;
    document.getElementById('drawer-title').textContent = spot.title;
    document.getElementById('drawer-content').innerHTML = spot.fullContent;
    document.getElementById('drawer-tip-text').textContent = spot.tip;

    drawer.classList.add('open');
  }

  function closeTouristDrawer() {
    state.isDrawerOpen = false;
    const drawer = document.getElementById('tourist-info-drawer');
    if (drawer) drawer.classList.remove('open');
  }

  // --- RESIZE ---
  function onWindowResize() {
    const container = document.getElementById('webgl-container');
    if (!container || !camera || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // --- RENDER ANIMATION LOOP ---
  function animate(time = 0) {
    rafId = requestAnimationFrame(animate);

    if (typeof TWEEN !== 'undefined') {
      TWEEN.update();
    }

    if (controls) {
      controls.autoRotate = state.autoRotate;
      controls.autoRotateSpeed = 0.45;
      controls.update();
    }

    if (palaceSceneData && palaceSceneData.builder) {
      palaceSceneData.builder.update(time);
    }

    updateHotspotsScreenPositions();

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // --- UI EVENT BINDINGS ---
  function setupUIBindings() {
    // 1. Lighting buttons
    document.querySelectorAll('[data-lighting]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        setLightingMode(e.currentTarget.dataset.lighting);
      });
    });

    // 2. Sovereign Flag switchers
    document.querySelectorAll('[data-flag-type]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        setFlagStatus(e.currentTarget.dataset.flagType);
      });
    });

    // 3. Camera presets
    document.querySelectorAll('[data-camera-preset]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        setCameraPreset(e.currentTarget.dataset.cameraPreset);
      });
    });

    // 4. Auto Rotate
    const autoRotateBtn = document.getElementById('btn-auto-rotate');
    if (autoRotateBtn) {
      autoRotateBtn.addEventListener('click', () => {
        state.autoRotate = !state.autoRotate;
        autoRotateBtn.classList.toggle('active', state.autoRotate);
      });
    }

    // 5. Sound Ambiance Toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        state.isAudioPlaying = !state.isAudioPlaying;
        soundBtn.classList.toggle('active', state.isAudioPlaying);
        if (state.isAudioPlaying) {
          SoundEngine.playFanfare();
          setTimeout(() => {
            if (state.isAudioPlaying) SoundEngine.startLondonAmbiance();
          }, 1800);
          soundBtn.querySelector('.sound-label').textContent = 'Audio: On';
        } else {
          SoundEngine.stopLondonAmbiance();
          soundBtn.querySelector('.sound-label').textContent = 'Audio: Off';
        }
      });
    }

    // 6. Fanfare Button
    const fanfareBtn = document.getElementById('btn-play-fanfare');
    if (fanfareBtn) {
      fanfareBtn.addEventListener('click', () => {
        SoundEngine.playFanfare();
      });
    }

    // 7. Close Drawer
    const closeDrawerBtn = document.getElementById('btn-close-drawer');
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', closeTouristDrawer);
    }

    // 8. Navigation Tabs (Explorer vs Tourist Guides)
    document.querySelectorAll('[data-nav-tab]').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.navTab;
        document.querySelectorAll('[data-nav-tab]').forEach((t) => {
          t.classList.toggle('active', t.dataset.navTab === targetTab);
        });
        document.querySelectorAll('.app-section').forEach((sec) => {
          sec.classList.toggle('active', sec.id === `section-${targetTab}`);
        });

        // If switching back to explorer, force resize
        if (targetTab === 'explorer') {
          setTimeout(onWindowResize, 100);
        }
      });
    });

    // 9. Fullscreen Toggle
    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        const container = document.getElementById('webgl-container');
        if (!document.fullscreenElement) {
          container.requestFullscreen?.().catch(console.warn);
        } else {
          document.exitFullscreen?.().catch(console.warn);
        }
      });
    }

    // 10. Interactive Royal Quiz Engine
    setupQuizEngine();

    // 11. Search in Tourist Guides
    setupTouristSearch();
  }

  // --- QUIZ ENGINE ---
  function setupQuizEngine() {
    const quizForm = document.getElementById('royal-quiz-form');
    const submitBtn = document.getElementById('btn-submit-quiz');
    const resultBox = document.getElementById('quiz-result');
    if (!quizForm || !submitBtn) return;

    submitBtn.addEventListener('click', () => {
      const answers = {
        q1: 'b', // 775 rooms
        q2: 'c', // White Drawing Room secret door
        q3: 'a', // 1851 Queen Victoria
        q4: 'b', // Royal Standard = King in residence
        q5: 'c', // 11:00 AM
      };

      let score = 0;
      let total = 5;

      for (let key in answers) {
        const selected = quizForm.querySelector(`input[name="${key}"]:checked`);
        const qBlock = quizForm.querySelector(`[data-question="${key}"]`);
        if (selected && selected.value === answers[key]) {
          score++;
          if (qBlock) qBlock.classList.add('correct');
        } else {
          if (qBlock) qBlock.classList.add('incorrect');
        }
      }

      let message = '';
      if (score === 5) {
        message = `👑 Perfect 5/5! You are awarded the title of "Honorary Royal Guide to Buckingham Palace"!`;
      } else if (score >= 3) {
        message = `💂 Excellent! ${score}/5! You know your Royal British history well.`;
      } else {
        message = `📜 ${score}/5. A great start! Review the tourist guide sections above and try again!`;
      }

      if (resultBox) {
        resultBox.innerHTML = `
          <div class="quiz-score-badge">${score} / ${total} Correct</div>
          <p class="quiz-message">${message}</p>
        `;
        resultBox.style.display = 'block';
      }
    });
  }

  // --- SEARCH FILTER ---
  function setupTouristSearch() {
    const searchInput = document.getElementById('tourist-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const searchableCards = document.querySelectorAll('[data-search-item]');

      searchableCards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        if (query === '' || text.includes(query)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // --- BOOTSTRAP ---
  document.addEventListener('DOMContentLoaded', () => {
    init3D();
    setupUIBindings();
    setLightingMode('day');
    setFlagStatus('royal');
  });
})();
