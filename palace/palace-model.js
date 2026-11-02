/**
 * BUCKINGHAM PALACE 3D MODEL GENERATOR
 * Procedural architectural model of Buckingham Palace, Queen Victoria Memorial,
 * The Forecourt, Gates, Sentries, and Royal Gardens.
 * Uses Three.js with PBR materials, procedural canvas textures, and animation hooks.
 */

window.PalaceModel = (function () {
  'use strict';

  // --- PROCEDURAL TEXTURE GENERATORS ---
  const Textures = {
    // Portland limestone texture with subtle grain and stone blocks
    createStoneTexture: function (isRusticated = false) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Base warm Portland stone color
      ctx.fillStyle = '#e8e2d5';
      ctx.fillRect(0, 0, 512, 512);

      // Subtle noise / stone grain
      const imgData = ctx.getImageData(0, 0, 512, 512);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 18;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise - 2));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise - 6));
      }
      ctx.putImageData(imgData, 0, 0);

      // Stone block joints
      ctx.strokeStyle = 'rgba(160, 150, 138, 0.45)';
      ctx.lineWidth = isRusticated ? 3 : 1.5;
      const rowHeight = isRusticated ? 32 : 48;
      const blockWidth = isRusticated ? 64 : 96;

      for (let y = 0; y < 512; y += rowHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();

        const offset = ((y / rowHeight) % 2) * (blockWidth / 2);
        for (let x = offset; x < 512; x += blockWidth) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + rowHeight);
          ctx.stroke();
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    },

    // Window texture with multi-pane glazing and warm interior illumination
    createWindowTexture: function (isArched = false, lit = false) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Frame background
      ctx.fillStyle = '#3a352f';
      ctx.fillRect(0, 0, 128, 256);

      // Glass panes (soft reflection or warm glow if lit)
      const glassColor = lit
        ? 'rgba(255, 230, 160, 0.95)'
        : 'rgba(75, 95, 115, 0.75)';
      ctx.fillStyle = glassColor;

      const margin = 8;
      const innerW = 128 - margin * 2;
      const innerH = 256 - margin * 2;

      ctx.fillRect(margin, margin, innerW, innerH);

      // Window grid / mullions
      ctx.strokeStyle = '#f0ece1';
      ctx.lineWidth = 4;

      // Vertical mullion
      ctx.beginPath();
      ctx.moveTo(64, margin);
      ctx.lineTo(64, 256 - margin);
      ctx.stroke();

      // Horizontal transoms (6 panes)
      const steps = 6;
      for (let i = 1; i < steps; i++) {
        const y = margin + (innerH / steps) * i;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(128 - margin, y);
        ctx.stroke();
      }

      // Shading / reflection highlight
      if (!lit) {
        const grad = ctx.createLinearGradient(0, 0, 128, 256);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
        ctx.fillStyle = grad;
        ctx.fillRect(margin, margin, innerW, innerH);
      }

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    },

    // Red gravel forecourt texture
    createForecourtTexture: function () {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Iconic Royal red gravel hue
      ctx.fillStyle = '#9e4738';
      ctx.fillRect(0, 0, 512, 512);

      const imgData = ctx.getImageData(0, 0, 512, 512);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 35;
        data[i] = Math.min(255, Math.max(0, data[i] + noise + 10));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.7));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.6));
      }
      ctx.putImageData(imgData, 0, 0);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(12, 12);
      return texture;
    },

    // Royal Standard Flag Texture
    createRoyalStandardTexture: function () {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // 4 Quarters:
      // Q1 (Top Left): England - Red with 3 Gold Lions passant
      // Q2 (Top Right): Scotland - Gold with Red Lion rampant within tressure
      // Q3 (Bottom Left): Ireland - Blue with Gold Harp
      // Q4 (Bottom Right): England - Red with 3 Gold Lions passant

      // Q1
      ctx.fillStyle = '#b71226';
      ctx.fillRect(0, 0, 256, 128);
      // Q2
      ctx.fillStyle = '#e6ad00';
      ctx.fillRect(256, 0, 256, 128);
      // Q3
      ctx.fillStyle = '#0f3f8c';
      ctx.fillRect(0, 128, 256, 128);
      // Q4
      ctx.fillStyle = '#b71226';
      ctx.fillRect(256, 128, 256, 128);

      // Draw stylized icons in quarters
      // Q1 & Q4 Lions (3 gold bars/shapes)
      [
        { ox: 40, oy: 25 },
        { ox: 296, oy: 153 },
      ].forEach((q) => {
        ctx.fillStyle = '#f7d046';
        for (let row = 0; row < 3; row++) {
          const ly = q.oy + row * 28;
          ctx.beginPath();
          ctx.ellipse(q.ox + 70, ly + 10, 50, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(q.ox + 125, ly + 6, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Q2 Scottish Lion Rampant (red silhouette)
      ctx.fillStyle = '#b71226';
      ctx.beginPath();
      ctx.arc(384, 50, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(376, 55, 18, 45);
      ctx.beginPath();
      ctx.moveTo(376, 60);
      ctx.lineTo(350, 45);
      ctx.lineTo(355, 55);
      ctx.lineTo(376, 70);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(394, 65);
      ctx.lineTo(418, 50);
      ctx.lineTo(412, 60);
      ctx.lineTo(394, 75);
      ctx.fill();

      // Q3 Irish Harp (gold strings)
      ctx.fillStyle = '#f7d046';
      ctx.beginPath();
      ctx.moveTo(100, 145);
      ctx.bezierCurveTo(145, 145, 155, 185, 125, 235);
      ctx.lineTo(80, 235);
      ctx.bezierCurveTo(75, 195, 85, 165, 100, 145);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      for (let s = 0; s < 6; s++) {
        ctx.beginPath();
        ctx.moveTo(95 + s * 6, 160 + s * 8);
        ctx.lineTo(88 + s * 4, 230);
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    },

    // Union Jack Flag Texture
    createUnionJackTexture: function () {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Navy background
      ctx.fillStyle = '#012169';
      ctx.fillRect(0, 0, 512, 256);

      // White St Andrew / St Patrick saltire base
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 52;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(512, 256);
      ctx.moveTo(512, 0);
      ctx.lineTo(0, 256);
      ctx.stroke();

      // Red St Patrick saltire
      ctx.strokeStyle = '#c8102e';
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(512, 256);
      ctx.moveTo(512, 0);
      ctx.lineTo(0, 256);
      ctx.stroke();

      // White St George cross backing
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(216, 0, 80, 256);
      ctx.fillRect(0, 88, 512, 80);

      // Red St George cross
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(232, 0, 48, 256);
      ctx.fillRect(0, 104, 512, 48);

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    },

    // Royal Coat of Arms relief texture for the central pediment
    createPedimentCoatOfArmsTexture: function () {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#dcd4c5';
      ctx.fillRect(0, 0, 512, 256);

      // Pediment triangular shading
      ctx.fillStyle = '#c8beaf';
      ctx.beginPath();
      ctx.arc(256, 140, 60, 0, Math.PI * 2);
      ctx.fill();

      // Shield outline (gold relief)
      ctx.strokeStyle = '#8a6b28';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Gilded Lion (left) and Unicorn (right)
      ctx.fillStyle = '#8a6b28';
      // Lion
      ctx.beginPath();
      ctx.arc(165, 120, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(160, 135, 20, 40);
      // Unicorn
      ctx.beginPath();
      ctx.arc(347, 120, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(332, 135, 20, 40);

      // Crown on top of shield
      ctx.beginPath();
      ctx.moveTo(226, 75);
      ctx.lineTo(286, 75);
      ctx.lineTo(296, 50);
      ctx.lineTo(270, 62);
      ctx.lineTo(256, 42);
      ctx.lineTo(242, 62);
      ctx.lineTo(216, 50);
      ctx.closePath();
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    },
  };

  // --- MATERIAL REPOSITORY ---
  function initMaterials() {
    const stoneTex = Textures.createStoneTexture(false);
    stoneTex.repeat.set(4, 4);

    const rusticatedStoneTex = Textures.createStoneTexture(true);
    rusticatedStoneTex.repeat.set(6, 2);

    const forecourtTex = Textures.createForecourtTexture();
    const windowDayTex = Textures.createWindowTexture(false, false);
    const windowNightTex = Textures.createWindowTexture(false, true);

    return {
      stone: new THREE.MeshStandardMaterial({
        color: 0xede6d8,
        roughness: 0.72,
        metalness: 0.08,
        map: stoneTex,
      }),
      stoneRusticated: new THREE.MeshStandardMaterial({
        color: 0xe2d9cb,
        roughness: 0.82,
        metalness: 0.05,
        map: rusticatedStoneTex,
      }),
      stoneDark: new THREE.MeshStandardMaterial({
        color: 0xb5ab9d,
        roughness: 0.78,
        metalness: 0.1,
      }),
      stoneMarble: new THREE.MeshStandardMaterial({
        color: 0xf6f3ed,
        roughness: 0.35,
        metalness: 0.15,
      }),
      roofSlate: new THREE.MeshStandardMaterial({
        color: 0x3d434d,
        roughness: 0.55,
        metalness: 0.25,
      }),
      roofCopper: new THREE.MeshStandardMaterial({
        color: 0x4a786a,
        roughness: 0.45,
        metalness: 0.35,
      }),
      goldOrnament: new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.85,
        roughness: 0.22,
        emissive: 0x3d2c00,
        emissiveIntensity: 0.2,
      }),
      wroughtIron: new THREE.MeshStandardMaterial({
        color: 0x141619,
        metalness: 0.7,
        roughness: 0.4,
      }),
      windowDay: new THREE.MeshStandardMaterial({
        color: 0xd8e4ed,
        roughness: 0.15,
        metalness: 0.45,
        map: windowDayTex,
      }),
      windowNight: new THREE.MeshStandardMaterial({
        color: 0xffe6a3,
        roughness: 0.2,
        metalness: 0.1,
        emissive: 0xffc857,
        emissiveIntensity: 0.9,
        map: windowNightTex,
      }),
      royalVelvetCrimson: new THREE.MeshStandardMaterial({
        color: 0x820c1d,
        roughness: 0.7,
        metalness: 0.12,
      }),
      tarmacForecourt: new THREE.MeshStandardMaterial({
        color: 0xaa4d3d,
        roughness: 0.88,
        metalness: 0.04,
        map: forecourtTex,
      }),
      lawnGrass: new THREE.MeshStandardMaterial({
        color: 0x3a6930,
        roughness: 0.92,
        metalness: 0.02,
      }),
      pavementStone: new THREE.MeshStandardMaterial({
        color: 0xa8a299,
        roughness: 0.8,
        metalness: 0.05,
      }),
      waterLake: new THREE.MeshStandardMaterial({
        color: 0x224c5e,
        roughness: 0.15,
        metalness: 0.65,
        transparent: true,
        opacity: 0.88,
      }),
      tunicRed: new THREE.MeshStandardMaterial({
        color: 0xd61827,
        roughness: 0.65,
        metalness: 0.1,
      }),
      bearskinFur: new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.95,
        metalness: 0.05,
      }),
    };
  }

  // --- MODEL BUILDER CLASS ---
  class BuckinghamPalaceBuilder {
    constructor() {
      this.materials = initMaterials();
      this.animatedObjects = [];
      this.interactiveHotspots = [];
      this.windowMeshes = [];
      this.flagMesh = null;
      this.flagMaterial = null;
      this.currentFlagType = 'royal'; // 'royal' or 'union'
      this.nightMode = false;
      this.royalStandardTex = Textures.createRoyalStandardTexture();
      this.unionJackTex = Textures.createUnionJackTexture();
    }

    buildEntireScene() {
      const rootGroup = new THREE.Group();
      rootGroup.name = 'BuckinghamPalaceScene';

      // 1. Terrain & Grounds
      const terrain = this.buildGrounds();
      rootGroup.add(terrain);

      // 2. The Main Palace Building
      const palace = this.buildPalaceStructure();
      rootGroup.add(palace);

      // 3. Forecourt, Gates, Sentry Boxes & Guards
      const forecourt = this.buildForecourtAndGates();
      rootGroup.add(forecourt);

      // 4. Queen Victoria Memorial
      const victoriaMemorial = this.buildVictoriaMemorial();
      rootGroup.add(victoriaMemorial);

      // 5. Gardens, Trees & Street Furniture
      const gardensAndSurrounds = this.buildGardensAndTheMall();
      rootGroup.add(gardensAndSurrounds);

      // 6. Define Hotspots
      this.setupHotspots();

      return {
        root: rootGroup,
        animatedObjects: this.animatedObjects,
        hotspots: this.interactiveHotspots,
        builder: this,
      };
    }

    // --- 1. GROUNDS & ROADS ---
    buildGrounds() {
      const groundsGroup = new THREE.Group();
      groundsGroup.name = 'Grounds';

      // Massive base ground
      const groundGeo = new THREE.PlaneGeometry(380, 320);
      const groundMesh = new THREE.Mesh(groundGeo, this.materials.lawnGrass);
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.position.set(0, -0.05, 0);
      groundMesh.receiveShadow = true;
      groundsGroup.add(groundMesh);

      // Royal Private Garden Lake (West of Palace)
      const lakeGeo = new THREE.CircleGeometry(38, 48);
      const lakeMesh = new THREE.Mesh(lakeGeo, this.materials.waterLake);
      lakeMesh.rotation.x = -Math.PI / 2;
      lakeMesh.position.set(0, 0.02, -75);
      groundsGroup.add(lakeMesh);

      // Red Tarmac Forecourt semicircular apron
      const forecourtGeo = new THREE.CylinderGeometry(
        46,
        46,
        0.1,
        64,
        1,
        false,
        0,
        Math.PI
      );
      const forecourtMesh = new THREE.Mesh(
        forecourtGeo,
        this.materials.tarmacForecourt
      );
      forecourtMesh.position.set(0, 0, 16);
      forecourtMesh.receiveShadow = true;
      groundsGroup.add(forecourtMesh);

      // Forecourt rectangular connector to palace facade
      const forecourtRectGeo = new THREE.BoxGeometry(92, 0.1, 16);
      const forecourtRect = new THREE.Mesh(
        forecourtRectGeo,
        this.materials.tarmacForecourt
      );
      forecourtRect.position.set(0, 0, 8);
      forecourtRect.receiveShadow = true;
      groundsGroup.add(forecourtRect);

      // The Mall (Ceremonial Red Way leading East)
      const mallGeo = new THREE.BoxGeometry(26, 0.12, 100);
      const mallMesh = new THREE.Mesh(mallGeo, this.materials.tarmacForecourt);
      mallMesh.position.set(0, 0.01, 115);
      mallMesh.receiveShadow = true;
      groundsGroup.add(mallMesh);

      // Paved stone perimeter walk around forecourt
      const curbGeo = new THREE.RingGeometry(46, 50, 64, 1, 0, Math.PI);
      const curbMesh = new THREE.Mesh(curbGeo, this.materials.pavementStone);
      curbMesh.rotation.x = -Math.PI / 2;
      curbMesh.position.set(0, 0.06, 16);
      curbMesh.receiveShadow = true;
      groundsGroup.add(curbMesh);

      return groundsGroup;
    }

    // --- 2. THE MAIN PALACE (EAST FRONT & QUADRANGLE) ---
    buildPalaceStructure() {
      const palaceGroup = new THREE.Group();
      palaceGroup.name = 'PalaceArchitecture';

      // Palace Dimensions
      // Width: 104 units, Height: 22 units, Central Depth: 16 units, Quadrangle Depth: 64 units
      const palaceZ = 0;

      // 2A. Ground Floor (Rusticated Portland Stone Base)
      const groundFloorGeo = new THREE.BoxGeometry(104, 6.5, 16);
      const groundFloor = new THREE.Mesh(
        groundFloorGeo,
        this.materials.stoneRusticated
      );
      groundFloor.position.set(0, 3.25, palaceZ);
      groundFloor.castShadow = true;
      groundFloor.receiveShadow = true;
      palaceGroup.add(groundFloor);

      // Rusticated arches along Ground Floor
      for (let x = -48; x <= 48; x += 4.8) {
        if (Math.abs(x) < 4) continue; // Leave central arch clear
        const archWindow = this.createArchedWindowMesh();
        archWindow.position.set(x, 3.2, palaceZ + 8.08);
        palaceGroup.add(archWindow);
      }

      // Grand Center Carriage Archway (leading into Quadrangle)
      const centerArchGeo = new THREE.BoxGeometry(6.4, 5.2, 16.5);
      const centerArchMesh = new THREE.Mesh(
        centerArchGeo,
        this.materials.wroughtIron
      );
      centerArchMesh.position.set(0, 2.6, palaceZ);
      palaceGroup.add(centerArchMesh);

      // 2B. First Floor (Piano Nobile) & Second Floor (Attic) - Main Body
      const upperFloorsGeo = new THREE.BoxGeometry(104, 12, 15.6);
      const upperFloors = new THREE.Mesh(
        upperFloorsGeo,
        this.materials.stone
      );
      upperFloors.position.set(0, 12.5, palaceZ);
      upperFloors.castShadow = true;
      upperFloors.receiveShadow = true;
      palaceGroup.add(upperFloors);

      // Cornice dividing Ground Floor and First Floor
      const beltCorniceGeo = new THREE.BoxGeometry(106, 0.6, 16.6);
      const beltCornice = new THREE.Mesh(
        beltCorniceGeo,
        this.materials.stone
      );
      beltCornice.position.set(0, 6.6, palaceZ);
      beltCornice.castShadow = true;
      palaceGroup.add(beltCornice);

      // Windows on Piano Nobile (1st Floor) and Attic (2nd Floor)
      for (let x = -48; x <= 48; x += 4.8) {
        // Skip behind central portico columns for custom treatment
        if (Math.abs(x) < 7) continue;

        // 1st Floor Tall Sash Window with pediment
        const win1st = this.createPedimentedWindowMesh((Math.round(x) % 2) === 0);
        win1st.position.set(x, 10.5, palaceZ + 7.85);
        palaceGroup.add(win1st);

        // 2nd Floor Square Sash Window
        const win2nd = this.createSquareWindowMesh();
        win2nd.position.set(x, 15.8, palaceZ + 7.85);
        palaceGroup.add(win2nd);

        // Classical pilaster between windows
        const pilasterGeo = new THREE.BoxGeometry(0.8, 11.5, 0.4);
        const pilaster = new THREE.Mesh(pilasterGeo, this.materials.stone);
        pilaster.position.set(x + 2.4, 12.5, palaceZ + 7.9);
        pilaster.castShadow = true;
        palaceGroup.add(pilaster);
      }

      // 2C. North & South End Pavilions (Projecting slightly forward)
      [-50, 50].forEach((posX) => {
        const pavilionFrontGeo = new THREE.BoxGeometry(11, 19, 2);
        const pavilion = new THREE.Mesh(pavilionFrontGeo, this.materials.stone);
        pavilion.position.set(posX, 9.5, palaceZ + 8.8);
        pavilion.castShadow = true;
        palaceGroup.add(pavilion);

        // Pavilion Pediment crowning attic
        const pavPedimentGeo = new THREE.ConeGeometry(7.5, 3.2, 4);
        const pavPediment = new THREE.Mesh(
          pavPedimentGeo,
          this.materials.stone
        );
        pavPediment.rotation.y = Math.PI / 4;
        pavPediment.position.set(posX, 20.2, palaceZ + 8.8);
        pavPediment.castShadow = true;
        palaceGroup.add(pavPediment);
      });

      // 2D. THE CENTRAL PORTICO & THE ROYAL BALCONY
      const centralSection = this.buildCentralPortico(palaceZ);
      palaceGroup.add(centralSection);

      // 2E. Main Roofline Balustrade & Statues
      const roofBalustrade = this.buildRoofBalustrade(palaceZ);
      palaceGroup.add(roofBalustrade);

      // 2F. Quadrangle Wings (North Wing, South Wing & West Garden Front)
      const quadrangle = this.buildQuadrangleWings(palaceZ);
      palaceGroup.add(quadrangle);

      return palaceGroup;
    }

    // --- 2D. CENTRAL PORTICO & THE ROYAL BALCONY ---
    buildCentralPortico(palaceZ) {
      const porticoGroup = new THREE.Group();
      porticoGroup.name = 'RoyalPorticoAndBalcony';

      // Portico Base projection
      const porticoBaseGeo = new THREE.BoxGeometry(19, 6.6, 2.8);
      const porticoBase = new THREE.Mesh(
        porticoBaseGeo,
        this.materials.stoneRusticated
      );
      porticoBase.position.set(0, 3.3, palaceZ + 9.2);
      porticoBase.castShadow = true;
      porticoGroup.add(porticoBase);

      // Grand Entrance Double Gates in center
      const entranceDoorGeo = new THREE.BoxGeometry(4.8, 5.2, 0.4);
      const entranceDoor = new THREE.Mesh(
        entranceDoorGeo,
        this.materials.wroughtIron
      );
      entranceDoor.position.set(0, 2.7, palaceZ + 10.65);
      porticoGroup.add(entranceDoor);

      // Gilded Royal Cypher over Entrance
      const cypherGeo = new THREE.TorusGeometry(0.8, 0.14, 12, 24);
      const cypher = new THREE.Mesh(cypherGeo, this.materials.goldOrnament);
      cypher.position.set(0, 5.3, palaceZ + 10.7);
      porticoGroup.add(cypher);

      // THE WORLD-FAMOUS ROYAL BALCONY (Center of 1st floor)
      const balconyFloorGeo = new THREE.BoxGeometry(7.2, 0.5, 2.4);
      const balconyFloor = new THREE.Mesh(
        balconyFloorGeo,
        this.materials.stoneMarble
      );
      balconyFloor.position.set(0, 6.75, palaceZ + 10.2);
      balconyFloor.castShadow = true;
      porticoGroup.add(balconyFloor);

      // Crimson Velvet Hanging Drapery with Gold Trim on the Balcony
      const crimsonBannerGeo = new THREE.BoxGeometry(6.8, 1.4, 0.1);
      const crimsonBanner = new THREE.Mesh(
        crimsonBannerGeo,
        this.materials.royalVelvetCrimson
      );
      crimsonBanner.position.set(0, 6.0, palaceZ + 11.45);
      porticoGroup.add(crimsonBanner);

      const goldFringeGeo = new THREE.BoxGeometry(6.9, 0.15, 0.14);
      const goldFringe = new THREE.Mesh(
        goldFringeGeo,
        this.materials.goldOrnament
      );
      goldFringe.position.set(0, 5.25, palaceZ + 11.45);
      porticoGroup.add(goldFringe);

      // Balcony Railing (Stone / Wrought Iron Balusters)
      const balustradeRailGeo = new THREE.BoxGeometry(7.2, 0.25, 2.4);
      const balustradeRail = new THREE.Mesh(
        balustradeRailGeo,
        this.materials.stoneMarble
      );
      balustradeRail.position.set(0, 7.8, palaceZ + 10.2);
      porticoGroup.add(balustradeRail);

      for (let bx = -3.2; bx <= 3.2; bx += 0.8) {
        const balusterGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.9, 8);
        const baluster = new THREE.Mesh(
          balusterGeo,
          this.materials.stoneMarble
        );
        baluster.position.set(bx, 7.3, palaceZ + 11.35);
        porticoGroup.add(baluster);
      }

      // French Doors leading onto Balcony
      const balconyDoorGeo = new THREE.PlaneGeometry(3.6, 4.4);
      const balconyDoor = new THREE.Mesh(
        balconyDoorGeo,
        this.materials.windowDay
      );
      balconyDoor.position.set(0, 9.2, palaceZ + 7.86);
      this.windowMeshes.push(balconyDoor);
      porticoGroup.add(balconyDoor);

      // Giant Order Corinthian Columns (6 Columns across front of central portico)
      const columnPositions = [-8, -4.8, -1.6, 1.6, 4.8, 8];
      columnPositions.forEach((cx) => {
        // Base plinth
        const plinthGeo = new THREE.BoxGeometry(1.2, 0.6, 1.2);
        const plinth = new THREE.Mesh(plinthGeo, this.materials.stone);
        plinth.position.set(cx, 6.9, palaceZ + 10.2);
        porticoGroup.add(plinth);

        // Fluted column shaft
        const colGeo = new THREE.CylinderGeometry(0.44, 0.52, 11, 16);
        const column = new THREE.Mesh(colGeo, this.materials.stone);
        column.position.set(cx, 12.7, palaceZ + 10.2);
        column.castShadow = true;
        porticoGroup.add(column);

        // Capital (Corinthian acanthus block)
        const capGeo = new THREE.BoxGeometry(1.2, 0.7, 1.2);
        const cap = new THREE.Mesh(capGeo, this.materials.stoneMarble);
        cap.position.set(cx, 18.3, palaceZ + 10.2);
        porticoGroup.add(cap);
      });

      // Classical Entablature above columns
      const entablatureGeo = new THREE.BoxGeometry(19.6, 1.4, 3.2);
      const entablature = new THREE.Mesh(
        entablatureGeo,
        this.materials.stone
      );
      entablature.position.set(0, 19.3, palaceZ + 10.0);
      entablature.castShadow = true;
      porticoGroup.add(entablature);

      // GRAND TRIANGULAR PEDIMENT
      const pedimentShape = new THREE.Shape();
      pedimentShape.moveTo(-9.8, 0);
      pedimentShape.lineTo(9.8, 0);
      pedimentShape.lineTo(0, 4.8);
      pedimentShape.closePath();

      const extrudeSettings = {
        depth: 2.2,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.2,
        bevelThickness: 0.2,
      };

      const pedimentGeo = new THREE.ExtrudeGeometry(
        pedimentShape,
        extrudeSettings
      );
      const pediment = new THREE.Mesh(pedimentGeo, this.materials.stone);
      pediment.position.set(0, 20.0, palaceZ + 8.8);
      pediment.castShadow = true;
      porticoGroup.add(pediment);

      // Royal Coat of Arms relief on pediment face
      const armsPlaneGeo = new THREE.PlaneGeometry(8, 3.6);
      const armsMat = new THREE.MeshStandardMaterial({
        map: Textures.createPedimentCoatOfArmsTexture(),
        roughness: 0.6,
        metalness: 0.25,
      });
      const armsPlane = new THREE.Mesh(armsPlaneGeo, armsMat);
      armsPlane.position.set(0, 21.4, palaceZ + 11.05);
      porticoGroup.add(armsPlane);

      // ROOFTOP ATTIC & ROYAL FLAGPOLE
      const atticCenterGeo = new THREE.BoxGeometry(12, 3.4, 7);
      const atticCenter = new THREE.Mesh(
        atticCenterGeo,
        this.materials.stone
      );
      atticCenter.position.set(0, 21.2, palaceZ + 4.5);
      porticoGroup.add(atticCenter);

      // Flagpole
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 14, 12);
      const pole = new THREE.Mesh(poleGeo, this.materials.wroughtIron);
      pole.position.set(0, 29, palaceZ + 4.5);
      porticoGroup.add(pole);

      // Gold ball finial on flagpole
      const poleTopGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const poleTop = new THREE.Mesh(poleTopGeo, this.materials.goldOrnament);
      poleTop.position.set(0, 36.1, palaceZ + 4.5);
      porticoGroup.add(poleTop);

      // Waving Flag (Dynamic displacement)
      const flagGeo = new THREE.PlaneGeometry(5.4, 3.2, 16, 10);
      this.flagMaterial = new THREE.MeshStandardMaterial({
        map: this.royalStandardTex,
        roughness: 0.5,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
      const flagMesh = new THREE.Mesh(flagGeo, this.flagMaterial);
      flagMesh.position.set(2.8, 34.2, palaceZ + 4.5);
      porticoGroup.add(flagMesh);

      this.flagMesh = flagMesh;
      this.animatedObjects.push({
        type: 'flag',
        mesh: flagMesh,
        geo: flagGeo,
      });

      return porticoGroup;
    }

    // --- 2E. ROOFLINE BALUSTRADE & STATUES ---
    buildRoofBalustrade(palaceZ) {
      const balustradeGroup = new THREE.Group();
      balustradeGroup.name = 'RoofBalustradesAndUrns';

      // Continuous roofline balustrade parapet
      const parapetGeo = new THREE.BoxGeometry(105, 1.2, 0.8);
      const parapet = new THREE.Mesh(parapetGeo, this.materials.stone);
      parapet.position.set(0, 19.1, palaceZ + 7.8);
      parapet.castShadow = true;
      balustradeGroup.add(parapet);

      // Classical Stone Urns & Statuary lining the roofline
      for (let x = -50; x <= 50; x += 4.8) {
        if (Math.abs(x) < 10) continue; // Portico has its own crest

        // Carved stone urn
        const urnBaseGeo = new THREE.CylinderGeometry(0.3, 0.25, 0.4, 8);
        const urnBase = new THREE.Mesh(
          urnBaseGeo,
          this.materials.stoneMarble
        );
        urnBase.position.set(x, 19.9, palaceZ + 7.8);
        balustradeGroup.add(urnBase);

        const urnBodyGeo = new THREE.SphereGeometry(0.35, 8, 8);
        const urnBody = new THREE.Mesh(
          urnBodyGeo,
          this.materials.stoneMarble
        );
        urnBody.position.set(x, 20.35, palaceZ + 7.8);
        balustradeGroup.add(urnBody);

        const urnFinialGeo = new THREE.ConeGeometry(0.18, 0.4, 8);
        const urnFinial = new THREE.Mesh(
          urnFinialGeo,
          this.materials.stoneMarble
        );
        urnFinial.position.set(x, 20.75, palaceZ + 7.8);
        balustradeGroup.add(urnFinial);
      }

      // Mansard Roof Behind Facade
      const mansardGeo = new THREE.BoxGeometry(102, 3.5, 14);
      const mansard = new THREE.Mesh(mansardGeo, this.materials.roofSlate);
      mansard.position.set(0, 20.2, palaceZ);
      balustradeGroup.add(mansard);

      // Chimney stacks
      [-42, -24, 24, 42].forEach((cx) => {
        const chimneyGeo = new THREE.BoxGeometry(1.8, 3.8, 1.8);
        const chimney = new THREE.Mesh(chimneyGeo, this.materials.stone);
        chimney.position.set(cx, 22.5, palaceZ);
        chimney.castShadow = true;
        balustradeGroup.add(chimney);

        // Pots
        for (let p = -0.4; p <= 0.4; p += 0.8) {
          const potGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.8, 8);
          const pot = new THREE.Mesh(potGeo, this.materials.stoneDark);
          pot.position.set(cx + p, 24.6, palaceZ);
          balustradeGroup.add(pot);
        }
      });

      return balustradeGroup;
    }

    // --- 2F. QUADRANGLE WINGS & WEST GARDEN FRONT ---
    buildQuadrangleWings(palaceZ) {
      const wingsGroup = new THREE.Group();
      wingsGroup.name = 'QuadrangleAndGardenFront';

      // North Wing (stretching westwards from East Front)
      const northWingGeo = new THREE.BoxGeometry(14, 18, 54);
      const northWing = new THREE.Mesh(northWingGeo, this.materials.stone);
      northWing.position.set(-45, 9, palaceZ - 32);
      northWing.castShadow = true;
      wingsGroup.add(northWing);

      // South Wing (State Apartments & Ballroom Wing)
      const southWingGeo = new THREE.BoxGeometry(14, 18, 54);
      const southWing = new THREE.Mesh(southWingGeo, this.materials.stone);
      southWing.position.set(45, 9, palaceZ - 32);
      southWing.castShadow = true;
      wingsGroup.add(southWing);

      // West Front (John Nash's Garden Facade facing the Royal Gardens)
      const westFrontGeo = new THREE.BoxGeometry(104, 18, 14);
      const westFront = new THREE.Mesh(westFrontGeo, this.materials.stone);
      westFront.position.set(0, 9, palaceZ - 56);
      westFront.castShadow = true;
      wingsGroup.add(westFront);

      // Nash's Central Bow Room Rotunda / Dome on West Garden Facade
      const bowRoomGeo = new THREE.CylinderGeometry(7, 7, 18, 32);
      const bowRoom = new THREE.Mesh(bowRoomGeo, this.materials.stone);
      bowRoom.position.set(0, 9, palaceZ - 63);
      bowRoom.castShadow = true;
      wingsGroup.add(bowRoom);

      // Bow Room Copper Dome
      const domeGeo = new THREE.SphereGeometry(
        7.2,
        32,
        16,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      );
      const dome = new THREE.Mesh(domeGeo, this.materials.roofCopper);
      dome.position.set(0, 18, palaceZ - 63);
      dome.castShadow = true;
      wingsGroup.add(dome);

      // Quadrangle Inner Courtyard Ground
      const quadCourtyardGeo = new THREE.PlaneGeometry(76, 50);
      const quadCourtyard = new THREE.Mesh(
        quadCourtyardGeo,
        this.materials.pavementStone
      );
      quadCourtyard.rotation.x = -Math.PI / 2;
      quadCourtyard.position.set(0, 0.05, palaceZ - 30);
      quadCourtyard.receiveShadow = true;
      wingsGroup.add(quadCourtyard);

      // Windows along the Inner Quadrangle
      for (let z = -12; z >= -48; z -= 8) {
        [-37.8, 37.8].forEach((wx) => {
          const quadWin = this.createPedimentedWindowMesh(false);
          quadWin.rotation.y = wx > 0 ? -Math.PI / 2 : Math.PI / 2;
          quadWin.position.set(wx, 11, palaceZ + z);
          wingsGroup.add(quadWin);
        });
      }

      return wingsGroup;
    }

    // --- 3. FORECOURT, WROUGHT IRON GATES & SENTRIES ---
    buildForecourtAndGates() {
      const fcGroup = new THREE.Group();
      fcGroup.name = 'ForecourtAndGates';

      const radius = 46;
      const centerZ = 16;

      // Semicircular Wrought Iron Fence with Gilded Spears
      const segments = 40;
      for (let i = 0; i <= segments; i++) {
        const angle = (Math.PI / segments) * i;
        const x = Math.cos(angle) * radius;
        const z = centerZ + Math.sin(angle) * radius;

        // Skip gate openings:
        // Center Gate (angle near PI/2)
        // North Gate (angle near 0.35 rad)
        // South Gate (angle near PI - 0.35 rad)
        const isCenterGate = Math.abs(x) < 7.5;
        const isNorthGate = Math.abs(x - 30) < 4.5;
        const isSouthGate = Math.abs(x + 30) < 4.5;

        if (isCenterGate || isNorthGate || isSouthGate) {
          continue;
        }

        // Railing Spear Post
        const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.2, 6);
        const post = new THREE.Mesh(postGeo, this.materials.wroughtIron);
        post.position.set(x, 2.1, z);
        fcGroup.add(post);

        // Gold spear tip
        const spearGeo = new THREE.ConeGeometry(0.14, 0.5, 6);
        const spear = new THREE.Mesh(spearGeo, this.materials.goldOrnament);
        spear.position.set(x, 4.4, z);
        fcGroup.add(spear);
      }

      // Horizontal rails for fence
      const railCurve = new THREE.EllipseCurve(
        0,
        centerZ,
        radius,
        radius,
        0,
        Math.PI,
        false,
        0
      );
      const points = railCurve.getPoints(50);
      const railGeo = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, 2.0, p.y))
      );
      const railLine = new THREE.Line(
        railGeo,
        new THREE.LineBasicMaterial({ color: 0x141619, linewidth: 2 })
      );
      fcGroup.add(railLine);

      // STONE GATEPIERS & GILDED MAIN GATES
      // Grand Center Gates (Flanked by two grand stone piers topped with gold lions)
      [-7.5, 7.5].forEach((gx) => {
        const pier = this.createGatePierMesh();
        pier.position.set(gx, 0, centerZ + radius);
        fcGroup.add(pier);
      });

      // Centre Wrought Iron & Gilded Gates (Double Royal Gate)
      const gatePanelGeo = new THREE.BoxGeometry(7.0, 4.8, 0.25);
      const centerGate = new THREE.Mesh(
        gatePanelGeo,
        this.materials.wroughtIron
      );
      centerGate.position.set(0, 2.4, centerZ + radius);
      fcGroup.add(centerGate);

      // Gilded Royal Coat of Arms on the center gates
      const gateCrestGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.15, 24);
      const gateCrest = new THREE.Mesh(
        gateCrestGeo,
        this.materials.goldOrnament
      );
      gateCrest.rotation.x = Math.PI / 2;
      gateCrest.position.set(0, 2.8, centerZ + radius + 0.15);
      fcGroup.add(gateCrest);

      // North & South Secondary Gates
      [-30, 30].forEach((gx) => {
        const sidePierL = this.createGatePierMesh();
        sidePierL.position.set(gx - 4.5, 0, centerZ + Math.sqrt(radius * radius - gx * gx));
        fcGroup.add(sidePierL);

        const sidePierR = this.createGatePierMesh();
        sidePierR.position.set(gx + 4.5, 0, centerZ + Math.sqrt(radius * radius - gx * gx));
        fcGroup.add(sidePierR);

        const sideGateGeo = new THREE.BoxGeometry(4.2, 4.2, 0.2);
        const sideGate = new THREE.Mesh(
          sideGateGeo,
          this.materials.wroughtIron
        );
        sideGate.position.set(gx, 2.1, centerZ + Math.sqrt(radius * radius - gx * gx));
        fcGroup.add(sideGate);
      });

      // FOUR ICONIC SENTRY BOXES & FOOT GUARDS (King's Guard)
      const sentryPositions = [
        { x: -16, z: 12, rot: 0 },
        { x: -8, z: 12, rot: 0 },
        { x: 8, z: 12, rot: 0 },
        { x: 16, z: 12, rot: 0 },
      ];

      sentryPositions.forEach((pos, idx) => {
        // Black Wooden Sentry Box with Peaked Gable
        const sentryBox = this.createSentryBoxMesh();
        sentryBox.position.set(pos.x, 0, pos.z);
        sentryBox.rotation.y = pos.rot;
        fcGroup.add(sentryBox);

        // King's Guard Sentry standing in front of box
        const guard = this.createKingsGuardMesh(idx);
        guard.position.set(pos.x, 0, pos.z + 1.8);
        guard.rotation.y = Math.PI; // Facing outward toward tourists!
        fcGroup.add(guard);
      });

      return fcGroup;
    }

    // --- 4. QUEEN VICTORIA MEMORIAL ---
    buildVictoriaMemorial() {
      const memorialGroup = new THREE.Group();
      memorialGroup.name = 'QueenVictoriaMemorial';

      // Situated in front of palace gates facing The Mall
      const memX = 0;
      const memY = 0;
      const memZ = 82;

      // 4A. Concentric Multi-Tier Marble Plinths
      const tier1Geo = new THREE.CylinderGeometry(18, 19, 1.2, 48);
      const tier1 = new THREE.Mesh(tier1Geo, this.materials.stoneMarble);
      tier1.position.set(memX, memY + 0.6, memZ);
      tier1.receiveShadow = true;
      memorialGroup.add(tier1);

      const tier2Geo = new THREE.CylinderGeometry(14, 15, 1.4, 48);
      const tier2 = new THREE.Mesh(tier2Geo, this.materials.stoneMarble);
      tier2.position.set(memX, memY + 1.9, memZ);
      tier2.receiveShadow = true;
      memorialGroup.add(tier2);

      // Ornamental Fountain Basins around perimeter
      [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((ang) => {
        const basinX = memX + Math.cos(ang) * 14.5;
        const basinZ = memZ + Math.sin(ang) * 14.5;

        const basinGeo = new THREE.CylinderGeometry(2.4, 2.0, 1.2, 16);
        const basin = new THREE.Mesh(basinGeo, this.materials.stoneMarble);
        basin.position.set(basinX, memY + 1.4, basinZ);
        memorialGroup.add(basin);

        const waterGeo = new THREE.CircleGeometry(2.2, 16);
        const water = new THREE.Mesh(waterGeo, this.materials.waterLake);
        water.rotation.x = -Math.PI / 2;
        water.position.set(basinX, memY + 2.02, basinZ);
        memorialGroup.add(water);
      });

      // 4B. Central Marble Pylon
      const pylonGeo = new THREE.BoxGeometry(6.4, 12, 6.4);
      const pylon = new THREE.Mesh(pylonGeo, this.materials.stoneMarble);
      pylon.position.set(memX, memY + 8.6, memZ);
      pylon.castShadow = true;
      memorialGroup.add(pylon);

      // Seated Marble Statue of Queen Victoria (Facing down The Mall to the East)
      const victoriaStatueGeo = new THREE.BoxGeometry(2.8, 4.2, 2.2);
      const victoriaStatue = new THREE.Mesh(
        victoriaStatueGeo,
        this.materials.stoneMarble
      );
      victoriaStatue.position.set(memX, memY + 5.2, memZ + 3.8);
      memorialGroup.add(victoriaStatue);

      // Marble Allegorical Groups (Truth, Justice, Charity)
      [-3.4, 3.4].forEach((sx) => {
        const groupGeo = new THREE.BoxGeometry(1.8, 3.2, 1.8);
        const allegoricalGroup = new THREE.Mesh(
          groupGeo,
          this.materials.stoneMarble
        );
        allegoricalGroup.position.set(memX + sx, memY + 4.8, memZ);
        memorialGroup.add(allegoricalGroup);
      });

      // 4C. GILDED BRONZE WINGED VICTORY (The Angel atop the monument)
      // Golden Orb base
      const orbGeo = new THREE.SphereGeometry(1.2, 24, 24);
      const orb = new THREE.Mesh(orbGeo, this.materials.goldOrnament);
      orb.position.set(memX, memY + 15.4, memZ);
      orb.castShadow = true;
      memorialGroup.add(orb);

      // Winged Victory Figure
      const angelBodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 3.6, 12);
      const angelBody = new THREE.Mesh(
        angelBodyGeo,
        this.materials.goldOrnament
      );
      angelBody.position.set(memX, memY + 17.6, memZ);
      angelBody.castShadow = true;
      memorialGroup.add(angelBody);

      // Outstretched Golden Wings
      [-1, 1].forEach((dir) => {
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(dir * 2.8, 2.2);
        wingShape.lineTo(dir * 3.6, 4.2);
        wingShape.lineTo(dir * 1.8, 3.2);
        wingShape.lineTo(0, 1.2);
        wingShape.closePath();

        const wingGeo = new THREE.ShapeGeometry(wingShape);
        const wing = new THREE.Mesh(wingGeo, this.materials.goldOrnament);
        wing.position.set(memX, memY + 17.6, memZ);
        wing.rotation.y = dir * 0.25;
        memorialGroup.add(wing);
      });

      // Golden palm branch in hand
      const branchGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
      const branch = new THREE.Mesh(branchGeo, this.materials.goldOrnament);
      branch.position.set(memX + 0.8, memY + 19.2, memZ + 0.6);
      branch.rotation.z = -0.4;
      memorialGroup.add(branch);

      return memorialGroup;
    }

    // --- 5. GARDENS, TREES & THE MALL ENVIRONMENT ---
    buildGardensAndTheMall() {
      const envGroup = new THREE.Group();
      envGroup.name = 'SurroundingEnvironment';

      // London Plane Trees along The Mall
      for (let z = 95; z <= 155; z += 15) {
        [-16, 16].forEach((tx) => {
          const tree = this.createLondonPlaneTree();
          tree.position.set(tx, 0, z);
          envGroup.add(tree);

          // Vintage British Street Lamp with Union Jack banner
          const lamp = this.createVictorianStreetLamp(tx > 0);
          lamp.position.set(tx > 0 ? tx - 2.8 : tx + 2.8, 0, z);
          envGroup.add(lamp);
        });
      }

      // Royal Palace Private Gardens (West of Palace) - Specimen Trees
      const gardenTreeCoords = [
        { x: -35, z: -40, s: 1.2 },
        { x: -55, z: -55, s: 1.4 },
        { x: -28, z: -75, s: 1.1 },
        { x: 35, z: -40, s: 1.2 },
        { x: 55, z: -60, s: 1.3 },
        { x: 25, z: -78, s: 1.5 },
        { x: -10, z: -95, s: 1.6 },
        { x: 12, z: -98, s: 1.4 },
      ];

      gardenTreeCoords.forEach((tc) => {
        const gardenTree = this.createLondonPlaneTree(tc.s);
        gardenTree.position.set(tc.x, 0, tc.z);
        envGroup.add(gardenTree);
      });

      // Formal Rose Beds & Hedges in West Gardens
      [-20, 20].forEach((hx) => {
        const hedgeGeo = new THREE.BoxGeometry(18, 1.2, 4);
        const hedge = new THREE.Mesh(hedgeGeo, this.materials.lawnGrass);
        hedge.position.set(hx, 0.6, -45);
        hedge.castShadow = true;
        envGroup.add(hedge);
      });

      // Red London Double-Decker Bus & Black Cab circulating Victoria Memorial
      const bus = this.createLondonBusMesh();
      bus.position.set(22, 0, 82);
      bus.rotation.y = Math.PI;
      envGroup.add(bus);

      const cab = this.createBlackCabMesh();
      cab.position.set(-20, 0, 76);
      cab.rotation.y = 0;
      envGroup.add(cab);

      this.animatedObjects.push({
        type: 'vehicle_bus',
        mesh: bus,
        radius: 22,
        speed: 0.18,
        angle: 0,
      });

      this.animatedObjects.push({
        type: 'vehicle_cab',
        mesh: cab,
        radius: 20,
        speed: 0.28,
        angle: Math.PI,
      });

      return envGroup;
    }

    // --- PROCEDURAL ARCHITECTURAL MESH HELPERS ---
    createPedimentedWindowMesh(isTriangular = true) {
      const winGroup = new THREE.Group();

      // Window Glass & Sash
      const glassGeo = new THREE.PlaneGeometry(2.4, 4.2);
      const glass = new THREE.Mesh(glassGeo, this.materials.windowDay);
      this.windowMeshes.push(glass);
      winGroup.add(glass);

      // Stone Window Surround Frame
      const frameGeo = new THREE.BoxGeometry(2.6, 4.4, 0.2);
      const frame = new THREE.Mesh(frameGeo, this.materials.stoneDark);
      frame.position.z = -0.11;
      winGroup.add(frame);

      // Classical Pediment crowning window
      if (isTriangular) {
        // Triangular pediment
        const pedShape = new THREE.Shape();
        pedShape.moveTo(-1.5, 0);
        pedShape.lineTo(1.5, 0);
        pedShape.lineTo(0, 0.9);
        pedShape.closePath();
        const pedGeo = new THREE.ShapeGeometry(pedShape);
        const ped = new THREE.Mesh(pedGeo, this.materials.stone);
        ped.position.set(0, 2.2, 0.1);
        winGroup.add(ped);
      } else {
        // Segmental / Arched pediment
        const archShape = new THREE.Shape();
        archShape.moveTo(-1.5, 0);
        archShape.quadraticCurveTo(0, 1.1, 1.5, 0);
        archShape.closePath();
        const archGeo = new THREE.ShapeGeometry(archShape);
        const arch = new THREE.Mesh(archGeo, this.materials.stone);
        arch.position.set(0, 2.2, 0.1);
        winGroup.add(arch);
      }

      // Stone sill underneath
      const sillGeo = new THREE.BoxGeometry(2.8, 0.25, 0.35);
      const sill = new THREE.Mesh(sillGeo, this.materials.stone);
      sill.position.set(0, -2.2, 0.1);
      winGroup.add(sill);

      return winGroup;
    }

    createSquareWindowMesh() {
      const winGroup = new THREE.Group();

      const glassGeo = new THREE.PlaneGeometry(2.2, 2.2);
      const glass = new THREE.Mesh(glassGeo, this.materials.windowDay);
      this.windowMeshes.push(glass);
      winGroup.add(glass);

      const frameGeo = new THREE.BoxGeometry(2.5, 2.5, 0.18);
      const frame = new THREE.Mesh(frameGeo, this.materials.stoneDark);
      frame.position.z = -0.1;
      winGroup.add(frame);

      const sillGeo = new THREE.BoxGeometry(2.6, 0.2, 0.3);
      const sill = new THREE.Mesh(sillGeo, this.materials.stone);
      sill.position.set(0, -1.2, 0.1);
      winGroup.add(sill);

      return winGroup;
    }

    createArchedWindowMesh() {
      const winGroup = new THREE.Group();

      const glassGeo = new THREE.PlaneGeometry(2.2, 3.2);
      const glass = new THREE.Mesh(glassGeo, this.materials.windowDay);
      this.windowMeshes.push(glass);
      winGroup.add(glass);

      const archArchGeo = new THREE.CylinderGeometry(
        1.1,
        1.1,
        0.2,
        16,
        1,
        false,
        0,
        Math.PI
      );
      const archHead = new THREE.Mesh(
        archArchGeo,
        this.materials.stoneRusticated
      );
      archHead.rotation.z = Math.PI / 2;
      archHead.position.set(0, 1.6, 0.05);
      winGroup.add(archHead);

      // Keystone
      const keyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
      const key = new THREE.Mesh(keyGeo, this.materials.stone);
      key.position.set(0, 2.4, 0.15);
      winGroup.add(key);

      return winGroup;
    }

    createGatePierMesh() {
      const pierGroup = new THREE.Group();

      // Stone base
      const baseGeo = new THREE.BoxGeometry(1.6, 1.2, 1.6);
      const base = new THREE.Mesh(baseGeo, this.materials.stone);
      base.position.y = 0.6;
      pierGroup.add(base);

      // Main shaft
      const shaftGeo = new THREE.BoxGeometry(1.3, 4.4, 1.3);
      const shaft = new THREE.Mesh(shaftGeo, this.materials.stoneRusticated);
      shaft.position.y = 3.4;
      shaft.castShadow = true;
      pierGroup.add(shaft);

      // Capital
      const capGeo = new THREE.BoxGeometry(1.6, 0.6, 1.6);
      const cap = new THREE.Mesh(capGeo, this.materials.stone);
      cap.position.y = 5.9;
      pierGroup.add(cap);

      // Carved Stone Urn / Gold Lion finial
      const finialGeo = new THREE.SphereGeometry(0.45, 12, 12);
      const finial = new THREE.Mesh(finialGeo, this.materials.goldOrnament);
      finial.position.y = 6.6;
      pierGroup.add(finial);

      return pierGroup;
    }

    createSentryBoxMesh() {
      const boxGroup = new THREE.Group();

      // Black painted wooden box
      const wallsGeo = new THREE.BoxGeometry(1.6, 3.8, 1.4);
      const walls = new THREE.Mesh(wallsGeo, this.materials.wroughtIron);
      walls.position.y = 1.9;
      boxGroup.add(walls);

      // Arched interior doorway cutout (white interior trim)
      const doorCutoutGeo = new THREE.BoxGeometry(1.0, 3.0, 0.3);
      const doorCutout = new THREE.Mesh(
        doorCutoutGeo,
        this.materials.stoneMarble
      );
      doorCutout.position.set(0, 1.5, 0.6);
      boxGroup.add(doorCutout);

      // Peaked roof with white fascia
      const roofShape = new THREE.ConeGeometry(1.3, 0.9, 4);
      const roof = new THREE.Mesh(roofShape, this.materials.wroughtIron);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 4.1;
      boxGroup.add(roof);

      return boxGroup;
    }

    createKingsGuardMesh(index = 0) {
      const guardGroup = new THREE.Group();
      guardGroup.name = `KingsGuard_${index}`;

      // Boots
      const bootGeo = new THREE.BoxGeometry(0.24, 0.35, 0.45);
      [-0.2, 0.2].forEach((bx) => {
        const boot = new THREE.Mesh(bootGeo, this.materials.wroughtIron);
        boot.position.set(bx, 0.18, 0);
        guardGroup.add(boot);
      });

      // Dark Blue / Black Trousers with Red Piping
      const legsGeo = new THREE.BoxGeometry(0.68, 1.1, 0.34);
      const legs = new THREE.Mesh(legsGeo, this.materials.wroughtIron);
      legs.position.y = 0.9;
      guardGroup.add(legs);

      // Red Tunic (Ceremonial Scarlet Coat)
      const tunicGeo = new THREE.BoxGeometry(0.72, 1.25, 0.38);
      const tunic = new THREE.Mesh(tunicGeo, this.materials.tunicRed);
      tunic.position.y = 1.95;
      tunic.castShadow = true;
      guardGroup.add(tunic);

      // White Ceremonial Crossbelt & Waistbelt
      const beltGeo = new THREE.BoxGeometry(0.74, 0.12, 0.4);
      const belt = new THREE.Mesh(beltGeo, this.materials.stoneMarble);
      belt.position.y = 1.6;
      guardGroup.add(belt);

      // Gold buttons down front
      for (let b = 0; b < 4; b++) {
        const buttonGeo = new THREE.SphereGeometry(0.03, 6, 6);
        const button = new THREE.Mesh(buttonGeo, this.materials.goldOrnament);
        button.position.set(0, 1.75 + b * 0.18, 0.2);
        guardGroup.add(button);
      }

      // Head & White Chin-Strap
      const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const head = new THREE.Mesh(
        headGeo,
        new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.6 })
      );
      head.position.y = 2.75;
      guardGroup.add(head);

      // ICONIC BLACK BEARSKIN CAP (Tall fur hat)
      const bearskinGeo = new THREE.CylinderGeometry(0.26, 0.24, 1.05, 12);
      const bearskin = new THREE.Mesh(bearskinGeo, this.materials.bearskinFur);
      bearskin.position.y = 3.3;
      bearskin.castShadow = true;
      guardGroup.add(bearskin);

      // Regimental Plume (e.g. White for Grenadier, Red for Coldstream)
      const plumeColor = index % 2 === 0 ? 0xffffff : 0xcc0000;
      const plumeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6);
      const plume = new THREE.Mesh(
        plumeGeo,
        new THREE.MeshBasicMaterial({ color: plumeColor })
      );
      plume.position.set(-0.24, 3.2, 0.08);
      guardGroup.add(plume);

      // Ceremonial Rifle held at shoulder
      const rifleGeo = new THREE.BoxGeometry(0.08, 1.8, 0.12);
      const rifle = new THREE.Mesh(rifleGeo, this.materials.wroughtIron);
      rifle.position.set(0.42, 1.9, 0.15);
      guardGroup.add(rifle);

      // Gentle animated breathing / posture sway
      this.animatedObjects.push({
        type: 'guard_idle',
        mesh: guardGroup,
        baseY: 0,
        seed: index * 1.5,
      });

      return guardGroup;
    }

    createLondonPlaneTree(scale = 1.0) {
      const treeGroup = new THREE.Group();
      treeGroup.scale.set(scale, scale, scale);

      // Tree Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.4, 0.7, 7, 10);
      const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x4a3a2d,
        roughness: 0.9,
      });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3.5;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Lush Layered Foliage Canopy
      const foliageMat = new THREE.MeshStandardMaterial({
        color: 0x3d662f,
        roughness: 0.85,
        flatShading: true,
      });

      const canopyLayers = [
        { r: 4.2, y: 7.5, sy: 0.75 },
        { r: 3.4, y: 9.8, sy: 0.85 },
        { r: 2.2, y: 11.5, sy: 0.9 },
      ];

      canopyLayers.forEach((layer) => {
        const fGeo = new THREE.DodecahedronGeometry(layer.r, 1);
        const fMesh = new THREE.Mesh(fGeo, foliageMat);
        fMesh.scale.y = layer.sy;
        fMesh.position.y = layer.y;
        fMesh.castShadow = true;
        treeGroup.add(fMesh);
      });

      return treeGroup;
    }

    createVictorianStreetLamp(hasBanner = true) {
      const lampGroup = new THREE.Group();

      // Post
      const postGeo = new THREE.CylinderGeometry(0.1, 0.18, 5.2, 8);
      const post = new THREE.Mesh(postGeo, this.materials.wroughtIron);
      post.position.y = 2.6;
      lampGroup.add(post);

      // Lantern Glass & Crown
      const lanternGeo = new THREE.CylinderGeometry(0.35, 0.22, 0.8, 6);
      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xfff0c2,
        roughness: 0.2,
        metalness: 0.1,
        emissive: 0xffc857,
        emissiveIntensity: 0.8,
      });
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.y = 5.5;
      lampGroup.add(lantern);

      // Gold Crown finial
      const crownGeo = new THREE.ConeGeometry(0.25, 0.4, 6);
      const crown = new THREE.Mesh(crownGeo, this.materials.goldOrnament);
      crown.position.y = 6.05;
      lampGroup.add(crown);

      // Union Jack street banner hanging from post
      if (hasBanner) {
        const bannerGeo = new THREE.PlaneGeometry(1.2, 2.4);
        const bannerMat = new THREE.MeshStandardMaterial({
          map: this.unionJackTex,
          side: THREE.DoubleSide,
        });
        const banner = new THREE.Mesh(bannerGeo, bannerMat);
        banner.position.set(0.8, 3.8, 0);
        lampGroup.add(banner);
      }

      return lampGroup;
    }

    createLondonBusMesh() {
      const busGroup = new THREE.Group();

      // Red Double-Decker Body
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xcc1111,
        roughness: 0.35,
        metalness: 0.3,
      });
      const bodyGeo = new THREE.BoxGeometry(2.4, 3.6, 7.2);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 2.1;
      body.castShadow = true;
      busGroup.add(body);

      // Windows band lower & upper
      const winMat = new THREE.MeshStandardMaterial({
        color: 0x112233,
        roughness: 0.1,
        metalness: 0.8,
      });
      const winGeo = new THREE.BoxGeometry(2.45, 0.8, 6.2);
      const winLower = new THREE.Mesh(winGeo, winMat);
      winLower.position.y = 1.8;
      busGroup.add(winLower);

      const winUpper = new THREE.Mesh(winGeo, winMat);
      winUpper.position.y = 3.1;
      busGroup.add(winUpper);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 16);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

      [-1.2, 1.2].forEach((wx) => {
        [-2.2, 2.2].forEach((wz) => {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.position.set(wx, 0.45, wz);
          busGroup.add(wheel);
        });
      });

      return busGroup;
    }

    createBlackCabMesh() {
      const cabGroup = new THREE.Group();

      // Classic London Black Taxi Cab
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x141416,
        roughness: 0.25,
        metalness: 0.5,
      });
      const bodyGeo = new THREE.BoxGeometry(1.8, 1.6, 3.8);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.0;
      body.castShadow = true;
      cabGroup.add(body);

      // Cabin / windows
      const cabWinMat = new THREE.MeshStandardMaterial({
        color: 0x243444,
        roughness: 0.1,
        metalness: 0.7,
      });
      const cabWinGeo = new THREE.BoxGeometry(1.7, 0.7, 2.2);
      const cabWin = new THREE.Mesh(cabWinGeo, cabWinMat);
      cabWin.position.set(0, 1.5, -0.2);
      cabGroup.add(cabWin);

      // TAXI yellow roof sign
      const signMat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff8800,
        emissiveIntensity: 0.8,
      });
      const signGeo = new THREE.BoxGeometry(0.8, 0.2, 0.25);
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, 2.0, 0.4);
      cabGroup.add(sign);

      return cabGroup;
    }

    // --- 6. INTERACTIVE TOURIST HOTSPOTS ---
    setupHotspots() {
      this.interactiveHotspots = [
        {
          id: 'balcony',
          title: 'The Royal Balcony',
          category: 'Iconic Landmark',
          badge: 'Most Famous',
          position: new THREE.Vector3(0, 9.8, 11.5),
          cameraTarget: new THREE.Vector3(0, 10.5, 26),
          cameraLookAt: new THREE.Vector3(0, 10.0, 5),
          shortDesc:
            'Where the Royal Family appears during momentous national celebrations, weddings, and Jubilees.',
          fullContent: `
            <h4>A Window on British Royal History</h4>
            <p>The iconic Central Balcony was introduced by Prince Albert in 1851 during the reign of Queen Victoria, allowing the Sovereign to be seen and connect directly with the British public.</p>
            <ul>
              <li><strong>First Public Appearance:</strong> 1851 by Queen Victoria during the Great Exhibition.</li>
              <li><strong>Famous Moments:</strong> VE Day in 1945 with Sir Winston Churchill; Royal Weddings of Prince William & Catherine (2011) and King Charles III's Coronation (2023).</li>
              <li><strong>The Red Drape:</strong> Ceremonial crimson velvet cloth with gold bullion fringe embroidered with the Sovereign's Royal Cypher.</li>
              <li><strong>RAF Flypasts:</strong> The Royal Family gathers here each June for Trooping the Colour to watch the Red Arrows and military flypast.</li>
            </ul>
          `,
          tip: 'Arrive at the Victoria Memorial or The Mall 2 hours before major royal flypasts or celebrations to secure a direct line of sight!',
        },
        {
          id: 'flag',
          title: 'The Royal Flagpole & Standard',
          category: 'Royal Protocol',
          badge: 'Live Status',
          position: new THREE.Vector3(0, 31, 4.5),
          cameraTarget: new THREE.Vector3(0, 32, 28),
          cameraLookAt: new THREE.Vector3(0, 30, 4.5),
          shortDesc:
            'Discover whether His Majesty King Charles III is currently residing inside the Palace.',
          fullContent: `
            <h4>The Sovereign's Flag Code Explained</h4>
            <p>Buckingham Palace never flies a flag at half-mast, even upon the death of a monarch, because the throne is never vacant: <em>"The King is dead, long live The King."</em></p>
            <ul>
              <li><strong>The Royal Standard:</strong> Flown only when The King is physically present inside Buckingham Palace. Features the English Lions, Scottish Lion Rampant, and Irish Harp.</li>
              <li><strong>The Union Jack:</strong> Flown whenever The King is NOT in residence (e.g., staying at Windsor Castle, Sandringham, or Balmoral).</li>
              <li><strong>Flag Etiquette:</strong> The Royal Standard takes precedence over all other national and foreign flags on British soil.</li>
            </ul>
          `,
          tip: 'Look up at the flagpole the moment you arrive. If the 4-quadrant Royal Standard is flying, The King is home right now!',
        },
        {
          id: 'guard',
          title: 'Changing of the Guard',
          category: 'Ceremony',
          badge: 'Top Attraction',
          position: new THREE.Vector3(0, 2.5, 24),
          cameraTarget: new THREE.Vector3(-14, 6, 36),
          cameraLookAt: new THREE.Vector3(0, 2, 20),
          shortDesc:
            'The world-famous handover ceremony between the Old Guard and New Guard.',
          fullContent: `
            <h4>Guard Mounting (Changing of the Guard)</h4>
            <p>Carried out by the Foot Guards of the Household Division in their world-famous scarlet tunics and tall black bearskin hats made from Canadian black bear fur.</p>
            <ul>
              <li><strong>Schedule:</strong> 11:00 AM on Mondays, Wednesdays, Fridays, and Sundays (weather permitting; always check RCT schedules).</li>
              <li><strong>Timeline:</strong> 10:30 AM Old Guard forms at St James's Palace; 10:45 AM New Guard departs Wellington Barracks; 11:00 AM Ceremony commences inside the forecourt; 11:45 AM Dismissal.</li>
              <li><strong>The Five Regiments:</strong> Grenadier (single buttons, white plume left), Coldstream (pairs of buttons, red plume right), Scots (groups of 3, no plume), Irish (groups of 4, blue plume right), Welsh (groups of 5, white-green plume left).</li>
            </ul>
          `,
          tip: 'Best viewing vantage: Stand on the raised marble steps of the Queen Victoria Memorial facing the Palace gates by 10:15 AM.',
        },
        {
          id: 'victoria_memorial',
          title: 'Queen Victoria Memorial',
          category: 'Monument',
          badge: 'Gilded Landmark',
          position: new THREE.Vector3(0, 16, 82),
          cameraTarget: new THREE.Vector3(0, 15, 114),
          cameraLookAt: new THREE.Vector3(0, 12, 82),
          shortDesc:
            'Sir Thomas Brock’s monumental tribute featuring 2,300 tonnes of gleaming Carrara marble.',
          fullContent: `
            <h4>A Monument to Britain’s Golden Age</h4>
            <p>Unveiled in 1911 by King George V, this grandiose memorial stands at the head of The Mall. It was funded by donations from across the British Empire.</p>
            <ul>
              <li><strong>Winged Victory:</strong> Gilded bronze angel standing on a golden orb at the summit, flanked by statues of Courage and Constancy.</li>
              <li><strong>Seated Victoria:</strong> A 13-foot seated marble effigy of Queen Victoria facing down The Mall towards Admiralty Arch and Trafalgar Square.</li>
              <li><strong>Surrounding Sculptures:</strong> Personifications of Truth, Justice, and Motherhood/Charity, plus bronze naval figures and fountains.</li>
            </ul>
          `,
          tip: 'Take your iconic postcard photo from the east side of the memorial, framing both the gilded Winged Victory and the Palace facade in one shot.',
        },
        {
          id: 'state_rooms',
          title: 'The State Rooms & Grand Ballroom',
          category: 'Palace Interior',
          badge: 'Summer Opening',
          position: new THREE.Vector3(45, 12, -25),
          cameraTarget: new THREE.Vector3(70, 24, -10),
          cameraLookAt: new THREE.Vector3(35, 10, -25),
          shortDesc:
            '19 breathtaking staterooms housing masterworks by Rembrandt, Vermeer, and Rubens.',
          fullContent: `
            <h4>The Heart of the Working Monarchy</h4>
            <p>During August and September, The King opens the 19 State Rooms to public visitors while the Royal Family departs for Balmoral Castle in Scotland.</p>
            <ul>
              <li><strong>The Throne Room:</strong> Home to the single-step dais holding the Chairs of Estate used at coronation ceremonies.</li>
              <li><strong>The White Drawing Room:</strong> Famous for its hidden secret door concealed within a mirrored cabinet, through which the Monarch enters.</li>
              <li><strong>The Ballroom:</strong> Added by Queen Victoria in 1855, it is the largest room in the palace, seating 170 guests for glittering State Banquets.</li>
              <li><strong>Picture Gallery:</strong> 47-meter long gallery displaying masterpieces by Rembrandt, Titian, Vermeer, Canaletto, and Van Dyck.</li>
            </ul>
          `,
          tip: 'State Room summer tickets sell out months in advance. Always book via the official Royal Collection Trust website before traveling!',
        },
        {
          id: 'gardens',
          title: 'The 39-Acre Royal Gardens',
          category: 'Royal Oasis',
          badge: 'Private Grounds',
          position: new THREE.Vector3(0, 2, -75),
          cameraTarget: new THREE.Vector3(-35, 20, -105),
          cameraLookAt: new THREE.Vector3(0, 2, -60),
          shortDesc:
            'London’s largest private walled garden, host to the annual Royal Garden Parties.',
          fullContent: `
            <h4>London’s Most Exclusive Sanctuary</h4>
            <p>Spanning 39 acres behind the Palace, this lush private landscape features over 300 types of British wildflowers, 150 varieties of mature trees, and a 3-acre ornamental lake created in 1828.</p>
            <ul>
              <li><strong>Royal Garden Parties:</strong> Every summer, The King invites over 30,000 members of the public from charities and community service to tea on the lawn.</li>
              <li><strong>Royal Beehives:</strong> 4 historic hives on the garden island produce Buckingham Palace Honey for official state banquets.</li>
              <li><strong>Helicopter Landing Pad:</strong> The private lawn accommodates royal helicopter departures for state duties.</li>
            </ul>
          `,
          tip: 'When visiting the State Rooms, your tour exits onto the Palace Garden Terrace where you can enjoy tea and scones with a view of the private lawn!',
        },
      ];
    }

    // --- INTERACTIVE CONTROLS API ---
    setFlag(type) {
      if (!this.flagMaterial) return;
      this.currentFlagType = type;
      if (type === 'royal') {
        this.flagMaterial.map = this.royalStandardTex;
      } else {
        this.flagMaterial.map = this.unionJackTex;
      }
      this.flagMaterial.needsUpdate = true;
    }

    setLightingMode(mode) {
      // mode: 'day', 'sunset', 'night'
      this.nightMode = mode === 'night';
      const isNight = this.nightMode;

      this.windowMeshes.forEach((mesh) => {
        mesh.material = isNight
          ? this.materials.windowNight
          : this.materials.windowDay;
      });
    }

    // --- ANIMATION UPDATE LOOP ---
    update(time) {
      const t = time * 0.001;

      // 1. Waving Flag Simulation (Vertex sine wave displacement)
      if (this.flagMesh && this.flagMesh.geometry) {
        const pos = this.flagMesh.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i);
          // Wave amplitude increases with distance from flagpole (u > 0)
          const wave =
            Math.sin(u * 2.2 - t * 4.5) * 0.22 * Math.max(0, (u + 2.7) / 5.4);
          pos.setZ(i, wave);
        }
        pos.needsUpdate = true;
      }

      // 2. King's Guards Subtle Ceremonial Idle / Posture
      this.animatedObjects.forEach((obj) => {
        if (obj.type === 'guard_idle') {
          obj.mesh.position.y =
            obj.baseY + Math.sin(t * 1.8 + obj.seed) * 0.015;
          obj.mesh.rotation.z = Math.sin(t * 0.8 + obj.seed) * 0.005;
        }

        // 3. Vehicles driving around Victoria Memorial roundabout
        if (obj.type === 'vehicle_bus' || obj.type === 'vehicle_cab') {
          obj.angle += obj.speed * 0.016;
          const memZ = 82;
          obj.mesh.position.x = Math.cos(obj.angle) * obj.radius;
          obj.mesh.position.z = memZ + Math.sin(obj.angle) * obj.radius;
          obj.mesh.rotation.y = -obj.angle + Math.PI / 2;
        }
      });
    }
  }

  return {
    createPalaceBuilder: function () {
      return new BuckinghamPalaceBuilder();
    },
  };
})();
