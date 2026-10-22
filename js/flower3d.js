/**
 * flower3d.js - Ramo Botánico 3D de Flores Moradas (Botanical Bouquet) en Three.js
 * 
 * Arquitectura:
 * - Composición de 7 Flores Moradas: 1 Reina Central, 4 en corona radial, 2 capullos de acento.
 * - Pool de Geometría Compartida (BotanicalGeometryPool): 5 VBOs de pétalos compartidos por 280 pétalos.
 * - 7 Presets Cromáticos Botánicos y Acordes Musicales Pentatónicos en Web Audio API.
 * - Follaje de Relleno: Eucalipto plateado y corona basal de hojas de rosa esculpidas.
 * - Atado convergente con lazo de seda tridimensional (fajín, nudo, orejas y colas drapeadas).
 * - Raycasting de alta velocidad con esferas proxy invisibles y física de rebote elástico.
 * - Atmósfera Cinematográfica PMREM y luz interna de dispersión subsuperficial (SSS).
 */

const GOLDEN_ANGLE = Math.PI * (3.0 - Math.sqrt(5.0)); // ~2.399963 rad (137.507764°)

// ============================================================================
// 1. GEOMETRÍAS PARAMÉTRICAS BOTÁNICAS
// ============================================================================

class BotanicalPetalGeometry extends THREE.BufferGeometry {
  constructor(options = {}) {
    super();

    const {
      width = 0.58,
      length = 1.35,
      uSegs = 24,
      vSegs = 32,
      tier = 1,
      cup = 0.32,
      curl = 0.25,
      reflex = 0.50,
      ruffle = 0.04
    } = options;

    const numVertices = (uSegs + 1) * (vSegs + 1);
    const positions = new Float32Array(numVertices * 3);
    const uvs = new Float32Array(numVertices * 2);
    const colors = new Float32Array(numVertices * 3);
    const indices = [];

    let vIdx = 0, uvIdx = 0, cIdx = 0;

    const colClaw = new THREE.Color(0xf5e8ff); // Uña: lavanda translúcido
    const colDeep = new THREE.Color(0x9863b7); // Interior terciopelo oscuro
    const colMid = new THREE.Color(0xd8afe9);  // Cuerpo amatista vibrante
    const colTip = new THREE.Color(0xd8b4fe);  // Ápice luminoso

    for (let j = 0; j <= vSegs; j++) {
      const v = j / vSegs;

      const baseWidthFactor = tier <= 2 ? 0.18 : 0.08;
      const widthEnvelope = baseWidthFactor + (1.0 - baseWidthFactor) * Math.pow(Math.sin(v * Math.PI), 0.50) * (1.0 - 0.04 * v);
      const effectiveHalfWidth = (width * 0.5) * Math.max(0.05, widthEnvelope);

      // A smooth spoon-like curve, without folds that cross adjacent petals.
      const zLong = curl * v * v * 0.45 - reflex * Math.pow(v, 5) * 0.10;

      for (let i = 0; i <= uSegs; i++) {
        const uNorm = (i / uSegs) * 2.0 - 1.0;

        const x = uNorm * effectiveHalfWidth;
        const apicalNotch = (1.0 - Math.abs(uNorm)) * 0.022 * Math.sin(Math.PI * Math.pow(v, 3.0));
        const y = v * length - apicalNotch;

        const zTrans = (1.0 - uNorm * uNorm) * Math.sin(Math.pow(v, 0.65) * Math.PI) * cup;

        const edgeDist = Math.abs(uNorm);
        const edgeFactor = Math.max(0.0, Math.min(1.0, (edgeDist - 0.45) / 0.55));
        const zRuffle = edgeFactor * Math.sin(v * 16.0 + edgeDist * 4.0) * (ruffle * v);

        const zVein = Math.exp(-(uNorm * uNorm) / 0.04) * 0.012 * Math.sin(Math.PI * v);

        const z = zTrans + zLong + zRuffle + zVein;

        positions[vIdx++] = x;
        positions[vIdx++] = y;
        positions[vIdx++] = z;

        uvs[uvIdx++] = (uNorm + 1.0) * 0.5;
        uvs[uvIdx++] = v;

        const tempColor = new THREE.Color();
        if (v < 0.12) {
          tempColor.lerpColors(colClaw, colDeep, v / 0.12);
        } else if (v < 0.65) {
          tempColor.lerpColors(colDeep, colMid, (v - 0.12) / 0.53);
        } else {
          tempColor.lerpColors(colMid, colTip, (v - 0.65) / 0.35);
        }

        colors[cIdx++] = tempColor.r;
        colors[cIdx++] = tempColor.g;
        colors[cIdx++] = tempColor.b;
      }
    }

    for (let j = 0; j < vSegs; j++) {
      for (let i = 0; i < uSegs; i++) {
        const a = j * (uSegs + 1) + i;
        const b = j * (uSegs + 1) + (i + 1);
        const c = (j + 1) * (uSegs + 1) + i;
        const d = (j + 1) * (uSegs + 1) + (i + 1);
        indices.push(a, b, d, a, d, c);
      }
    }

    this.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    this.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.setIndex(indices);
    this.computeVertexNormals();
  }
}

class BotanicalSepalGeometry extends THREE.BufferGeometry {
  constructor(length = 0.92, width = 0.24, uSegs = 10, vSegs = 20) {
    super();

    const numVertices = (uSegs + 1) * (vSegs + 1);
    const positions = new Float32Array(numVertices * 3);
    const colors = new Float32Array(numVertices * 3);
    const indices = [];

    let vIdx = 0, cIdx = 0;
    const colBase = new THREE.Color(0x166534);
    const colTip = new THREE.Color(0x3f1d38);

    for (let j = 0; j <= vSegs; j++) {
      const v = j / vSegs;
      const widthFactor = Math.pow(1.0 - v, 0.85) * Math.sin(Math.pow(v, 0.38) * Math.PI) * 1.6;
      const effectiveHalfWidth = (width * 0.5) * Math.max(0.02, widthFactor);
      const zLong = 0.14 * Math.sin(v * Math.PI * 0.7) - 0.38 * Math.pow(Math.max(0, v - 0.36), 1.7);

      for (let i = 0; i <= uSegs; i++) {
        const uNorm = (i / uSegs) * 2.0 - 1.0;
        const x = uNorm * effectiveHalfWidth;
        const y = v * length;
        const z = (1.0 - uNorm * uNorm) * 0.04 * Math.sin(v * Math.PI) + zLong;

        positions[vIdx++] = x;
        positions[vIdx++] = y;
        positions[vIdx++] = z;

        const c = new THREE.Color().lerpColors(colBase, colTip, Math.pow(v, 2.0));
        colors[cIdx++] = c.r;
        colors[cIdx++] = c.g;
        colors[cIdx++] = c.b;
      }
    }

    for (let j = 0; j < vSegs; j++) {
      for (let i = 0; i < uSegs; i++) {
        const a = j * (uSegs + 1) + i;
        const b = j * (uSegs + 1) + (i + 1);
        const c = (j + 1) * (uSegs + 1) + i;
        const d = (j + 1) * (uSegs + 1) + (i + 1);
        indices.push(a, b, d, a, d, c);
      }
    }

    this.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.setIndex(indices);
    this.computeVertexNormals();
  }
}

// ============================================================================
// 2. POOL DE GEOMETRÍAS COMPARTIDAS (GPU VRAM OPTIMIZER)
// ============================================================================

class BotanicalGeometryPool {
  constructor() {
    this.petalTiers = new Map();
    this.sepalGeometry = null;
    this.receptacleGeometry = null;
    this.antherGeometry = null;
    this.carpelGeometry = null;
    this.hitGeometry = null;

    this.initGeometries();
  }

  initGeometries() {
    // 5 Geometrías maestras de pétalo
    const tierConfigs = [
      { tier: 1, width: 0.38, length: 0.46, cup: 0.40, curl: 0.35, reflex: 0.00, ruffle: 0.015 },
      { tier: 2, width: 0.52, length: 0.55, cup: 0.34, curl: 0.22, reflex: 0.00, ruffle: 0.025 },
      { tier: 3, width: 0.65, length: 0.64, cup: 0.28, curl: 0.12, reflex: 0.20, ruffle: 0.035 },
      { tier: 4, width: 0.78, length: 0.72, cup: 0.22, curl: 0.12, reflex: 0.20, ruffle: 0.025 },
      { tier: 5, width: 0.92, length: 0.78, cup: 0.16, curl: 0.15, reflex: 0.25, ruffle: 0.025 }
    ];

    tierConfigs.forEach(cfg => {
      this.petalTiers.set(cfg.tier, new BotanicalPetalGeometry(cfg));
    });

    // Sépalos y Cáliz
    this.sepalGeometry = new BotanicalSepalGeometry(0.92, 0.24);

    // Receptáculo carnoso (Lathe)
    const receptaclePoints = [
      new THREE.Vector2(0.045, -0.28),
      new THREE.Vector2(0.090, -0.22),
      new THREE.Vector2(0.160, -0.12),
      new THREE.Vector2(0.200, -0.04),
      new THREE.Vector2(0.220, 0.00),
      new THREE.Vector2(0.120, 0.025),
      new THREE.Vector2(0.000, 0.035)
    ];
    this.receptacleGeometry = new THREE.LatheGeometry(receptaclePoints, 24);

    // Estambres y Anteras
    this.antherGeometry = new THREE.SphereGeometry(0.015, 8, 8);
    this.antherGeometry.scale(1.2, 0.8, 0.9);

    this.carpelGeometry = new THREE.SphereGeometry(0.08, 12, 12);
    this.carpelGeometry.scale(1.0, 0.65, 1.0);

    // Proxy para Raycasting táctil
    this.hitGeometry = new THREE.SphereGeometry(0.68, 8, 8);
  }

  getPetalGeometry(tier) {
    return this.petalTiers.get(tier) || this.petalTiers.get(1);
  }
}

// ============================================================================
// 3. PALETAS CROMÁTICAS Y ACORDES MUSICALES DE LAS 7 FLORES
// ============================================================================

const BOUQUET_FLOWER_PRESETS = [
  {
    id: 0,
    name: 'Morado Real Terciopelo',
    role: 'Central Reina',
    tint: 0xffffff,
    emissive: 0x3b0764,
    emissiveIntensity: 0.18,
    sheenColor: 0xd8b4fe,
    roughness: 0.82,
    transmission: 0.38,
    clearcoat: 0.20,
    pollenColor: 0xfde047,
    // Acorde celestial La Mayor
    chord: [220.00, 329.63, 440.00, 554.37, 659.25]
  },
  {
    id: 1,
    name: 'Ciruela Nocturna Profunda',
    role: 'Corona Frontal Baja',
    tint: 0xf5ebff,
    emissive: 0x2e0854,
    emissiveIntensity: 0.20,
    sheenColor: 0xc084fc,
    roughness: 0.80,
    transmission: 0.32,
    clearcoat: 0.22,
    pollenColor: 0xfef08a,
    // Acorde Do Mayor brillante
    chord: [261.63, 329.63, 392.00, 523.25]
  },
  {
    id: 2,
    name: 'Amatista Imperial',
    role: 'Corona Derecha',
    tint: 0xfcf0ff,
    emissive: 0x581c87,
    emissiveIntensity: 0.18,
    sheenColor: 0xe9d5ff,
    roughness: 0.84,
    transmission: 0.40,
    clearcoat: 0.20,
    pollenColor: 0xfacc15,
    // Acorde Re Mayor
    chord: [293.66, 369.99, 440.00, 587.33]
  },
  {
    id: 3,
    name: 'Lavanda de Provenza',
    role: 'Corona Trasera',
    tint: 0xede9fe,
    emissive: 0x312e81,
    emissiveIntensity: 0.16,
    sheenColor: 0xc7d2fe,
    roughness: 0.78,
    transmission: 0.44,
    clearcoat: 0.25,
    pollenColor: 0xfef9c3,
    // Acorde Mi Menor suave
    chord: [329.63, 392.00, 493.88, 659.25]
  },
  {
    id: 4,
    name: 'Orquídea Silvestre Magenta',
    role: 'Corona Izquierda',
    tint: 0xfce7f3,
    emissive: 0x701a75,
    emissiveIntensity: 0.22,
    sheenColor: 0xf5d0fe,
    roughness: 0.82,
    transmission: 0.36,
    clearcoat: 0.24,
    pollenColor: 0xf472b6,
    // Acorde Fa Mayor
    chord: [349.23, 440.00, 523.25, 698.46]
  },
  {
    id: 5,
    name: 'Lila Perla y Rocío',
    role: 'Capullo Acento Frontal-Izq',
    tint: 0xf5f3ff,
    emissive: 0x4338ca,
    emissiveIntensity: 0.14,
    sheenColor: 0xffffff,
    roughness: 0.75,
    transmission: 0.46,
    clearcoat: 0.28,
    pollenColor: 0xbae6fd,
    // Acorde Sol Mayor agudo
    chord: [392.00, 493.88, 587.33, 783.99]
  },
  {
    id: 6,
    name: 'Bruma Nórdica Nocturna',
    role: 'Capullo Acento Trasero-Der',
    tint: 0xe0f2fe,
    emissive: 0x1e1b4b,
    emissiveIntensity: 0.16,
    sheenColor: 0xa5f3fc,
    roughness: 0.76,
    transmission: 0.42,
    clearcoat: 0.26,
    pollenColor: 0xe0e7ff,
    // Acorde La Menor etéreo
    chord: [440.00, 523.25, 659.25, 880.00]
  }
];

// ============================================================================
// 4. INSTANCIA DE FLOR BOTÁNICA INDIVIDUAL
// ============================================================================

class FlowerInstance {
  constructor(index, config, sharedTextures, geometryPool) {
    this.index = index;
    this.config = config;
    this.sharedTextures = sharedTextures;
    this.geometryPool = geometryPool;

    this.group = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.group.add(this.headGroup);

    this.petals = [];
    this.sepals = [];
    this.stamensGroup = null;
    this.hitMesh = null;

    // Física de rebote al tocar
    this.recoilVelocity = 0;
    this.recoilOffset = 0;
    this.currentBloom = 0.0;

    this.initMaterial();
    this.buildFlower();
    this.setupHitProxy();
  }

  initMaterial() {
    this.material = BotanicalPetalTextures.createBotanicalPetalMaterial(this.sharedTextures, {
      normalScale: 0.18,
      transmission: 0.0,
      thickness: 0.48,
      sheenColor: this.config.sheenColor
    });

    // Clonación ligera con tintes personalizados
    this.material.color = new THREE.Color([0xc7a8e6, 0xefc4d9, 0xb59cd6, 0xdfb9e5, 0xd4c0eb, 0xe9c9df, 0xc9b4e2][this.index]);
    this.material.emissive = new THREE.Color(this.config.emissive);
    this.material.emissiveIntensity = 0.07;
    this.material.roughness = this.config.roughness;
    this.material.clearcoat = 0.08;
  }

  buildFlower() {
    this.group.position.copy(this.config.pos);
    this.group.rotation.copy(this.config.rot);
    this.group.scale.setScalar(this.config.scale);

    // 1. Receptáculo
    const sepalMat = new THREE.MeshPhysicalMaterial({
      roughness: 0.40,
      metalness: 0.04,
      clearcoat: 0.50,
      clearcoatRoughness: 0.30,
      sheen: new THREE.Color(0x86efac).multiplyScalar(0.5),
      vertexColors: true,
      side: THREE.DoubleSide
    });
    this.sepalMat = sepalMat;

    const receptacle = new THREE.Mesh(this.geometryPool.receptacleGeometry, sepalMat);
    this.headGroup.add(receptacle);

    // Luz local subsuperficial (SSS) dentro de cada flor
    this.sssLight = new THREE.PointLight(this.config.sheenColor || 0xc084fc, 0.12, 1.4);
    this.sssLight.position.set(0, 0.25, 0);
    this.headGroup.add(this.sssLight);

    // 2. Sépalos
    for (let s = 0; s < 5; s++) {
      const azimuth = (s / 5) * Math.PI * 2 + (s * 0.04);
      const pivot = new THREE.Group();
      pivot.position.set(0, -0.02, 0);
      pivot.rotation.y = azimuth;

      const sepalMesh = new THREE.Mesh(this.geometryPool.sepalGeometry, sepalMat);
      sepalMesh.position.set(0, 0, 0.18);
      sepalMesh.rotation.x = this.config.isBud ? 0.65 : 1.30;

      pivot.add(sepalMesh);
      this.headGroup.add(pivot);
      this.sepals.push({ mesh: sepalMesh, closedAngle: 0.45, openAngle: this.config.isBud ? 0.85 : 1.38 });
    }

    // 3. Estambres y Polen central
    if (!this.config.isBud || this.config.maxOpen > 0.5) {
      this.stamensGroup = this.createStamens(this.config.isBud ? 18 : 32);
      this.headGroup.add(this.stamensGroup);
    }

    // 4. Pétalos en espiral de Fibonacci usando el pool
    const tierConfigs = this.config.isBud
      ? [
          { tier: 1, count: 6, r: 0.04, y: 0.07, closedAngle: 0.08, openAngle: 0.20, scale: 0.58 },
          { tier: 2, count: 7, r: 0.09, y: 0.05, closedAngle: 0.15, openAngle: 0.38, scale: 0.72 },
          { tier: 3, count: 8, r: 0.16, y: 0.03, closedAngle: 0.22, openAngle: 0.62, scale: 0.88 }
        ]
      : [
          { tier: 1, count: 6, r: 0.05, y: 0.08, closedAngle: 0.10, openAngle: 0.22, scale: 0.60 },
          { tier: 2, count: 7, r: 0.12, y: 0.06, closedAngle: 0.18, openAngle: 0.45, scale: 0.78 },
          { tier: 3, count: 8, r: 0.22, y: 0.04, closedAngle: 0.25, openAngle: 0.75, scale: 0.95 },
          { tier: 4, count: 9, r: 0.22, y: 0.02, closedAngle: 0.32, openAngle: 1.15, scale: 1.15 },
          { tier: 5, count: 10, r: 0.28, y: 0.00, closedAngle: 0.38, openAngle: 1.48, scale: 1.35 }
        ];

    let globalPetalIndex = 0;
    tierConfigs.forEach((tCfg) => {
      const geom = this.geometryPool.getPetalGeometry(tCfg.tier);

      for (let i = 0; i < tCfg.count; i++) {
        const azimuth = (i / tCfg.count) * Math.PI * 2 + tCfg.tier * GOLDEN_ANGLE;
        const pivot = new THREE.Group();
        pivot.position.set(
          Math.sin(azimuth) * tCfg.r,
          tCfg.y,
          Math.cos(azimuth) * tCfg.r
        );
        pivot.rotation.y = azimuth;

        const mesh = new THREE.Mesh(geom, this.material);
        mesh.scale.setScalar(tCfg.scale * 0.70);
        mesh.rotation.x = tCfg.closedAngle;

        mesh.userData = {
          closedAngle: tCfg.closedAngle,
          openAngle: tCfg.openAngle * this.config.maxOpen,
          tier: tCfg.tier,
          azimuth: azimuth,
          phase: azimuth + this.config.phase + tCfg.tier * 0.75,
          freq: 1.1 + tCfg.tier * 0.22
        };

        pivot.add(mesh);
        this.headGroup.add(pivot);
        this.petals.push(mesh);
        globalPetalIndex++;
      }
    });
  }

  createStamens(count) {
    const group = new THREE.Group();
    group.position.set(0, 0.04, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xe8cc8b, roughness: 0.7 });
    group.add(new THREE.Mesh(this.geometryPool.carpelGeometry, mat));
    const anthers = new THREE.InstancedMesh(this.geometryPool.antherGeometry, mat, count);
    const dummy = new THREE.Object3D();
    const vertices = [];
    for (let i = 0; i < count; i++) {
      const angle = i * GOLDEN_ANGLE;
      const radius = 0.035 + Math.sqrt(i / count) * 0.05;
      const height = 0.065 + (Math.sin(i * 2.4) + 1) * 0.017;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      vertices.push(0, 0, 0, x, height, z);
      dummy.position.set(x, height, z);
      dummy.rotation.set(i * 0.7, angle, i * 0.3);
      dummy.updateMatrix();
      anthers.setMatrixAt(i, dummy.matrix);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    group.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xe4ccaa })));
    group.add(anthers);
    return group;
  }

  setupHitProxy() {
    const hitMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true });
    this.hitMesh = new THREE.Mesh(this.geometryPool.hitGeometry, hitMat);
    this.hitMesh.position.set(0, 0.25, 0);
    this.hitMesh.userData = { flowerInstance: this };
    this.headGroup.add(this.hitMesh);
  }

  triggerRecoil(impulse = 0.35) {
    this.recoilVelocity = -impulse;

    // Destello de emisión cromática viva
    this.material.emissiveIntensity = 0.95;
    setTimeout(() => {
      this.material.emissiveIntensity = 0.07;
    }, 450);
  }

  update(delta, elapsed) {
    // Física del rebote amortiguado (resorte elástico)
    const springK = 38.0;
    const damping = 7.5;
    const force = -springK * this.recoilOffset - damping * this.recoilVelocity;
    this.recoilVelocity += force * delta;
    this.recoilOffset += this.recoilVelocity * delta;

    this.headGroup.position.y = this.recoilOffset;
    this.headGroup.rotation.z = this.recoilOffset * 0.45;

    // Respiración botánica suave en cada pétalo
    this.petals.forEach(p => {
      const breathe = Math.sin(elapsed * p.userData.freq + p.userData.phase) * 0.018;
      p.rotation.x = THREE.MathUtils.lerp(
        p.userData.closedAngle,
        p.userData.openAngle,
        this.currentBloom
      ) + breathe;
    });
  }

  setBloom(progress) {
    let localT = 0.0;
    if (progress > this.config.bloomStart) {
      localT = (progress - this.config.bloomStart) / (this.config.bloomEnd - this.config.bloomStart);
      localT = THREE.MathUtils.clamp(localT, 0.0, 1.0);
    }

    // Easing elástico suave
    const c = 0.65;
    const ease = localT >= 1.0 ? 1.0 : (1 + (c + 1) * Math.pow(localT - 1, 3) + c * Math.pow(localT - 1, 2));
    this.currentBloom = ease;

    this.petals.forEach(p => {
      p.rotation.x = THREE.MathUtils.lerp(p.userData.closedAngle, p.userData.openAngle, ease);
    });

    this.sepals.forEach(s => {
      s.mesh.rotation.x = THREE.MathUtils.lerp(s.closedAngle, s.openAngle, ease);
    });

    if (this.stamensGroup) {
      this.stamensGroup.scale.setScalar(Math.max(0.01, ease));
    }
  }

  getWorldPosition(target = new THREE.Vector3()) {
    return this.headGroup.getWorldPosition(target);
  }
}

// ============================================================================
// 5. CLASE PRINCIPAL: RAMO BOTÁNICO (BOTANICAL BOUQUET)
// ============================================================================

class BotanicalBouquet {
  constructor(sharedTextures, geometryPool, options = {}) {
    this.sharedTextures = sharedTextures;
    this.geometryPool = geometryPool;

    this.options = Object.assign({
      bloomDuration: 4.5,
      autoBloom: true,
      scale: 1.0
    }, options);

    this.group = new THREE.Group();
    this.group.scale.setScalar(this.options.scale);

    this.flowersGroup = new THREE.Group();
    this.stemsGroup = new THREE.Group();
    this.foliageGroup = new THREE.Group();
    this.bindingGroup = new THREE.Group();

    this.group.add(this.stemsGroup);
    this.group.add(this.foliageGroup);
    this.group.add(this.bindingGroup);
    this.group.add(this.flowersGroup);

    this.flowers = [];
    this.hitSpheres = [];
    this.bloomProgress = 0.0;
    this.isBloomed = false;
    this.elapsedTime = 0.0;

    this.bindPoint = new THREE.Vector3(0, -0.62, 0);
    this.cutBaseY = -1.35;

    this.initBouquetMaterials();
    this.buildBouquet();
  }

  initBouquetMaterials() {
    // 1. Material de tallos
    this.stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x184a20,
      roughness: 0.55,
      metalness: 0.05
    });

    // 2. Follaje de eucalipto (plata glauco / menta cerosa)
    this.eucalyptusMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x638e7b,
      roughness: 0.52,
      metalness: 0.02,
      sheen: new THREE.Color(0xd1fae5).multiplyScalar(0.08),
      clearcoat: 0.25,
      side: THREE.DoubleSide
    });

    // 3. Corona de hojas de rosa basales
    this.roseLeafMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x14532d,
      roughness: 0.32,
      metalness: 0.03,
      clearcoat: 0.70,
      clearcoatRoughness: 0.18,
      sheen: new THREE.Color(0x86efac).multiplyScalar(0.40),
      side: THREE.DoubleSide
    });

    // 4. Lazo de seda lavanda / champán
    this.ribbonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf3e8ff,
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.65,
      clearcoatRoughness: 0.20,
      sheen: new THREE.Color(0xffffff),
      side: THREE.DoubleSide
    });
  }

  buildBouquet() {
    // Composición Botánica 1+6: Domo Floral Armónico de 7 Flores
    const configs = [
      { pos: new THREE.Vector3(0, 0.92, -0.08), rot: new THREE.Euler(0.1, 0, 0), scale: 0.9, isBud: false, maxOpen: 1, bloomStart: 0.000, bloomEnd: 0.550, phase: 0.0 },
      { pos: new THREE.Vector3(0, 0.55, 0.88), rot: new THREE.Euler(0.48, 0, 0), scale: 0.52, isBud: false, maxOpen: 1, bloomStart: 0.055, bloomEnd: 0.615, phase: 1.2 },
      { pos: new THREE.Vector3(0.87, 0.52, 0.22), rot: new THREE.Euler(0.32, -0.35, -0.22), scale: 0.60, isBud: false, maxOpen: 1, bloomStart: 0.110, bloomEnd: 0.680, phase: 2.4 },
      { pos: new THREE.Vector3(-0.87, 0.52, 0.22), rot: new THREE.Euler(0.32, 0.35, 0.22), scale: 0.60, isBud: false, maxOpen: 1, bloomStart: 0.165, bloomEnd: 0.745, phase: 3.5999999999999996 },
      { pos: new THREE.Vector3(0.7, 0.76, -0.66), rot: new THREE.Euler(-0.12, -0.35, -0.22), scale: 0.54, isBud: false, maxOpen: 1, bloomStart: 0.220, bloomEnd: 0.810, phase: 4.8 },
      { pos: new THREE.Vector3(-0.7, 0.76, -0.66), rot: new THREE.Euler(-0.12, 0.35, 0.22), scale: 0.54, isBud: false, maxOpen: 1, bloomStart: 0.275, bloomEnd: 0.875, phase: 6.0 },
      { pos: new THREE.Vector3(0, 1.1, -0.91), rot: new THREE.Euler(-0.2, 0, 0), scale: 0.54, isBud: false, maxOpen: 1, bloomStart: 0.330, bloomEnd: 0.940, phase: 7.199999999999999 },
    ];

    // 1. Construir las 7 Flores y sus tallos convergentes
    configs.forEach((cfg, idx) => {
      const mergedConfig = Object.assign({}, BOUQUET_FLOWER_PRESETS[idx], cfg);
      const flower = new FlowerInstance(idx, mergedConfig, this.sharedTextures, this.geometryPool);

      this.flowersGroup.add(flower.group);
      this.flowers.push(flower);
      this.hitSpheres.push(flower.hitMesh);

      this.createConvergentStem(mergedConfig, idx);
    });

    // 2. Follaje de relleno botánico
    this.createEucalyptusFoliage();
    this.createPearlSprigs();
    this.createRoseLeafCollar();

    // 3. Atado de seda con lazo 3D
    this.createRibbonBinding();
  }

  createConvergentStem(cfg, index) {
    const localDown = new THREE.Vector3(0, -0.22, 0).applyEuler(cfg.rot);
    const pStart = cfg.pos.clone().add(localDown);

    const pMid = new THREE.Vector3(
      pStart.x * 0.55 + (Math.sin(index * 1.8) * 0.06),
      (pStart.y + this.bindPoint.y) * 0.52,
      pStart.z * 0.55 + (Math.cos(index * 1.8) * 0.06)
    );

    const bindAngle = index * ((Math.PI * 2) / 7) + 0.35;
    const bindRadius = 0.055;
    const pBind = new THREE.Vector3(
      this.bindPoint.x + Math.cos(bindAngle) * bindRadius,
      this.bindPoint.y + (Math.random() - 0.5) * 0.04,
      this.bindPoint.z + Math.sin(bindAngle) * bindRadius
    );

    const flareRadius = 0.14 + (cfg.isBud ? -0.02 : 0.02);
    const flareAngle = bindAngle + 0.55;
    const pCut = new THREE.Vector3(
      Math.cos(flareAngle) * flareRadius,
      this.cutBaseY + (index % 3) * 0.05,
      Math.sin(flareAngle) * flareRadius
    );

    const curve = new THREE.CatmullRomCurve3([pStart, pMid, pBind, pCut]);
    const stemRadius = 0.040 * cfg.scale;
    const stemGeom = new THREE.TubeGeometry(curve, 36, stemRadius, 8, false);
    const stemMesh = new THREE.Mesh(stemGeom, this.stemMaterial);

    this.stemsGroup.add(stemMesh);
  }

  createEucalyptusFoliage() {
    const branchConfigs = [
      { start: new THREE.Vector3(0.50, 0.35, 0.50), dir: new THREE.Vector3(0.70, 0.35, 0.70), count: 6 },
      { start: new THREE.Vector3(-0.52, 0.38, -0.48), dir: new THREE.Vector3(-0.75, 0.38, -0.68), count: 6 },
      { start: new THREE.Vector3(0.68, 0.40, -0.35), dir: new THREE.Vector3(0.85, 0.32, -0.45), count: 5 },
      { start: new THREE.Vector3(-0.65, 0.36, 0.40), dir: new THREE.Vector3(-0.85, 0.30, 0.55), count: 5 }
    ];

    branchConfigs.forEach(bCfg => {
      const p1 = this.bindPoint.clone().add(new THREE.Vector3(bCfg.start.x * 0.2, 0.2, bCfg.start.z * 0.2));
      const p2 = bCfg.start;
      const p3 = bCfg.start.clone().add(bCfg.dir.clone().multiplyScalar(0.75));
      const stemCurve = new THREE.CatmullRomCurve3([p1, p2, p3]);

      const stemMesh = new THREE.Mesh(
        new THREE.TubeGeometry(stemCurve, 24, 0.022, 6, false),
        this.eucalyptusMaterial
      );
      this.foliageGroup.add(stemMesh);

      const leafGeom = new THREE.CircleGeometry(0.095, 16);
      leafGeom.scale(1.0, 1.25, 1.0);

      for (let k = 1; k <= bCfg.count; k++) {
        const t = 0.35 + (k / bCfg.count) * 0.62;
        const pos = stemCurve.getPoint(t);
        const tangent = stemCurve.getTangent(t);
        const leafScale = 0.75 + (k / bCfg.count) * 0.45;

        [-1, 1].forEach(side => {
          const leafMesh = new THREE.Mesh(leafGeom, this.eucalyptusMaterial);
          leafMesh.position.copy(pos);
          leafMesh.scale.setScalar(leafScale);

          leafMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
          leafMesh.rotateY(side * 0.85);
          leafMesh.rotateZ((k % 2 === 0 ? 0 : Math.PI * 0.5) + side * 0.3);
          leafMesh.rotateX(0.25 * side);

          this.foliageGroup.add(leafMesh);
        });
      }
    });
  }

  createPearlSprigs() {
    const pearl = new THREE.SphereGeometry(0.026, 7, 5);
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xffe8df, roughness: 0.72 });
    const branchMat = new THREE.LineBasicMaterial({ color: 0x789481 });
    const pearls = new THREE.InstancedMesh(pearl, petalMat, 140);
    const dummy = new THREE.Object3D();
    let pearlIndex = 0;
    for (let branch = 0; branch < 7; branch++) {
      const angle = branch / 7 * Math.PI * 2 + 0.3;
      const end = new THREE.Vector3(Math.cos(angle) * 1.27, 0.57 + (branch % 3) * 0.11, Math.sin(angle) * 1.15);
      const base = this.bindPoint.clone();
      for (let tip = 0; tip < 4; tip++) {
        const flower = end.clone().add(new THREE.Vector3(Math.sin(tip * 2.4 + branch) * 0.14, tip * 0.07, Math.cos(tip * 2.4) * 0.12));
        this.foliageGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([base, end, flower]), branchMat));
        for (let k = 0; k < 5; k++) {
          dummy.position.copy(flower).add(new THREE.Vector3(Math.cos(k * 1.256) * 0.025, Math.sin(k * 1.256) * 0.025, 0));
          dummy.updateMatrix();
          pearls.setMatrixAt(pearlIndex++, dummy.matrix);
        }
      }
    }
    this.foliageGroup.add(pearls);
  }

  createRoseLeafCollar() {
    const leafCount = 9;
    const leafGeom = new THREE.PlaneGeometry(0.32, 0.65, 8, 12);
    const posAttr = leafGeom.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i) + 0.325;
      posAttr.setY(i, y);
      const v = y / 0.65;
      const w = Math.sin(Math.pow(v, 0.75) * Math.PI);
      posAttr.setX(i, posAttr.getX(i) * w);
      posAttr.setZ(i, Math.sin(v * Math.PI) * 0.08 - Math.pow(v, 1.8) * 0.14);
    }
    posAttr.needsUpdate = true;
    leafGeom.computeVertexNormals();

    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2 + (i * 0.08);
      const radius = 0.62;
      const leafMesh = new THREE.Mesh(leafGeom, this.roseLeafMaterial);

      leafMesh.position.set(
        Math.cos(angle) * radius,
        0.26 + (Math.sin(i * 1.5) * 0.04),
        Math.sin(angle) * radius
      );

      leafMesh.rotation.y = -angle + Math.PI * 0.5;
      leafMesh.rotation.x = 1.05 + (Math.random() * 0.15);
      leafMesh.rotation.z = (Math.random() - 0.5) * 0.20;
      leafMesh.scale.setScalar(0.95 + Math.random() * 0.25);

      this.foliageGroup.add(leafMesh);
    }
  }

  createRibbonBinding() {
    // 1. Fajín envolvente en la convergencia
    const cuffGeom = new THREE.CylinderGeometry(0.135, 0.145, 0.22, 24, 1, true);
    const cuffMesh = new THREE.Mesh(cuffGeom, this.ribbonMaterial);
    cuffMesh.position.set(this.bindPoint.x, this.bindPoint.y, this.bindPoint.z);
    this.bindingGroup.add(cuffMesh);

    // 2. Nudo central
    const knotGeom = new THREE.SphereGeometry(0.065, 14, 14);
    knotGeom.scale(1.2, 0.8, 0.8);
    const knotMesh = new THREE.Mesh(knotGeom, this.ribbonMaterial);
    knotMesh.position.set(0, this.bindPoint.y, 0.16);
    this.bindingGroup.add(knotMesh);

    // 3. Orejas tridimensionales del lazo de seda
    [-1, 1].forEach(side => {
      const loopCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, this.bindPoint.y, 0.16),
        new THREE.Vector3(side * 0.22, this.bindPoint.y + 0.10, 0.20),
        new THREE.Vector3(side * 0.32, this.bindPoint.y + 0.02, 0.16),
        new THREE.Vector3(side * 0.18, this.bindPoint.y - 0.06, 0.14),
        new THREE.Vector3(0, this.bindPoint.y, 0.16)
      ]);
      const loopGeom = new THREE.TubeGeometry(loopCurve, 20, 0.028, 6, false);
      this.bindingGroup.add(new THREE.Mesh(loopGeom, this.ribbonMaterial));
    });

    // 4. Colas de lazo colgantes con caída natural
    [-0.08, 0.08].forEach((xOff, idx) => {
      const tailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xOff, this.bindPoint.y, 0.16),
        new THREE.Vector3(xOff * 1.8, this.bindPoint.y - 0.35, 0.22),
        new THREE.Vector3(xOff * 2.4, this.bindPoint.y - 0.70, 0.18 + idx * 0.04),
        new THREE.Vector3(xOff * 1.5, this.bindPoint.y - 0.95, 0.14)
      ]);
      const tailGeom = new THREE.TubeGeometry(tailCurve, 24, 0.024, 6, false);
      this.bindingGroup.add(new THREE.Mesh(tailGeom, this.ribbonMaterial));
    });
  }

  setBloomProgress(progress) {
    this.bloomProgress = THREE.MathUtils.clamp(progress, 0.0, 1.0);
    this.flowers.forEach(flower => flower.setBloom(this.bloomProgress));

    if (this.bloomProgress >= 1.0) {
      this.isBloomed = true;
    }
  }

  update(delta, elapsed) {
    this.elapsedTime += delta;
    const t = elapsed !== undefined ? elapsed : this.elapsedTime;

    if (this.options.autoBloom && this.bloomProgress < 1.0) {
      const step = delta / this.options.bloomDuration;
      this.setBloomProgress(this.bloomProgress + step);
    }

    this.flowers.forEach(flower => flower.update(delta, t));

    // Suave brisa ambiental en el ramo (offsets para el render loop)
    this.breezeOffsetZ = Math.sin(t * 0.75) * 0.018;
    this.breezeOffsetX = Math.cos(t * 0.60) * 0.014;
  }
}

// ============================================================================
// 6. ESCENA PRINCIPAL: REALISTIC BOUQUET SCENE
// ============================================================================

class RealisticBouquetScene {
  constructor(containerId = 'canvas-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.atmosphere = null;
    this.geometryPool = null;
    this.sharedTextures = null;
    this.bouquet = null;
    this.raycaster = new THREE.Raycaster();

    this.pollenPoints = null;
    this.pollenVels = null;
    this.pollenPhases = null;
    this.bursts = [];

    // Control orbital táctil y de ratón
    this.isPointerDown = false;
    this.prevX = 0;
    this.prevY = 0;
    this.startX = 0;
    this.startY = 0;
    this.targetRotationY = 0;
    this.targetRotationX = 0.35;

    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Escena
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x090214, 0.08);

    // 2. Cámara encuadrada para el ramo floral completo (perspectiva botánica elevada)
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    const aspect = width / height;
    const isMobile = width <= 760;
    const targetZ = isMobile ? 9.8 : 5.8;
    const targetY = isMobile ? 3.8 : 2.35;
    this.camera.position.set(0, targetY, targetZ);
    this.camera.lookAt(0, 0.05, 0);
    this.camera.setViewOffset(width, height, isMobile ? 0 : width * 0.21, isMobile ? height * 0.12 : -height * 0.04, width, height);

    // 3. Renderizador WebGL
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.container.appendChild(this.renderer.domElement);

    // 4. Atmósfera cinematográfica PMREM y luz SSS interna en el corazón del ramo
    this.atmosphere = new BotanicalAtmosphere(this.scene, this.renderer, {
      exposure: 1.12,
      keyIntensity: 2.05,
      rimIntensity: 1.8,
      internalGlowIntensity: 0.35
    });

    // Posicionar luz SSS interna justo en el centro del domo floral
    if (this.atmosphere.lights && this.atmosphere.lights.internalGlow) {
      this.atmosphere.lights.internalGlow.position.set(0, 0.45, 0);
      this.atmosphere.lights.internalGlow.distance = 3.5;
    }

    // 5. Pool de Geometría y Texturas Procedurales Únicas (ahorro del 98% VRAM)
    this.geometryPool = new BotanicalGeometryPool();
    this.sharedTextures = BotanicalPetalTextures.createPetalTextureSet();

    // 6. Construir el Ramo de 7 Flores
    this.bouquet = new BotanicalBouquet(this.sharedTextures, this.geometryPool, {
      bloomDuration: 4.8,
      autoBloom: true,
      scale: 1.0
    });
    this.bouquet.group.position.set(0, -0.15, 0);
    this.scene.add(this.bouquet.group);
    const fill = new THREE.HemisphereLight(0xf3d9ef, 0x372146, 0.65);
    this.scene.add(fill);

    // 7. Polen flotante
    this.setupPollen();

    // 8. Eventos de interacción
    this.setupEvents();

    // 9. Bucle de renderizado
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupPollen() {
    const count = 160;
    const spread = 5.5;
    const positions = new Float32Array(count * 3);
    this.pollenVels = new Float32Array(count * 3);
    this.pollenPhases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3.5 + 0.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread;

      this.pollenVels[i * 3] = (Math.random() - 0.5) * 0.0015;
      this.pollenVels[i * 3 + 1] = 0.002 + Math.random() * 0.0035;
      this.pollenVels[i * 3 + 2] = (Math.random() - 0.5) * 0.0015;

      this.pollenPhases[i] = Math.random() * Math.PI * 2;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const ctx = sprite.getContext('2d');
    const halo = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    halo.addColorStop(0, 'rgba(255,255,255,1)');
    halo.addColorStop(0.2, 'rgba(255,255,255,.65)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, 32, 32);
    const mat = new THREE.PointsMaterial({
      map: new THREE.CanvasTexture(sprite),
      size: 0.024,
      color: new THREE.Color(0xe8cba4),
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.pollenPoints = new THREE.Points(geom, mat);
    this.scene.add(this.pollenPoints);
  }

  triggerBurst(originPosition = null, colorHex = 0xfde047) {
    const origin = originPosition ? originPosition.clone() : new THREE.Vector3(0, 0.72, 0.04);
    const count = 55;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vels = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = origin.x;
      pos[i * 3 + 1] = origin.y;
      pos[i * 3 + 2] = origin.z;

      vels.push({
        x: (Math.random() - 0.5) * 0.08,
        y: 0.02 + Math.random() * 0.09,
        z: (Math.random() - 0.5) * 0.08
      });
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.065,
      color: new THREE.Color(colorHex),
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const burstMesh = new THREE.Points(geom, mat);
    this.scene.add(burstMesh);
    this.bursts.push({ burstMesh, geom, mat, vels, life: 2.0 });
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      const aspect = width / height;
      const isMobile = width <= 760;
      const targetZ = isMobile ? 9.8 : 5.8;
      const targetY = isMobile ? 3.8 : 2.35;
      this.camera.position.set(0, targetY, targetZ);
      this.camera.lookAt(0, 0.05, 0);
    this.camera.setViewOffset(width, height, isMobile ? 0 : width * 0.21, isMobile ? height * 0.12 : -height * 0.04, width, height);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    const isInteractiveElement = (target) => {
      if (!target) return false;
      return !!(
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.card-pill-header') ||
        target.closest('.card-content') ||
        target.closest('.glass-card') ||
        target.closest('.floating-player-widget') ||
        target.closest('#cardToggle') ||
        target.closest('#btnMusic') ||
        target.closest('#btnHug')
      );
    };

    const onStart = (clientX, clientY, target) => {
      if (isInteractiveElement(target)) return;
      this.isPointerDown = true;
      this.prevX = clientX;
      this.prevY = clientY;
      this.startX = clientX;
      this.startY = clientY;
    };

    const onMove = (clientX, clientY) => {
      if (!this.isPointerDown) return;
      const dx = clientX - this.prevX;
      const dy = clientY - this.prevY;
      this.prevX = clientX;
      this.prevY = clientY;

      this.targetRotationY += dx * 0.007;
      this.targetRotationX = Math.max(-0.25, Math.min(0.65, this.targetRotationX + dy * 0.006));
    };

    const onEnd = (clientX, clientY, target) => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;

      if (isInteractiveElement(target)) return;

      const dist = Math.hypot(clientX - this.startX, clientY - this.startY);
      if (dist < 10) {
        this.checkRaycast(clientX, clientY);
      }
    };

    window.addEventListener('mousedown', e => onStart(e.clientX, e.clientY, e.target));
    window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', e => onEnd(e.clientX, e.clientY, e.target));

    window.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }
    }, { passive: true });

    window.addEventListener('touchmove', e => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', e => {
      if (e.changedTouches.length === 1) {
        onEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.target);
      }
    });
  }

  checkRaycast(clientX, clientY) {
    if (!this.bouquet || !this.bouquet.hitSpheres.length) return;

    const mouse = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );

    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.bouquet.hitSpheres, false);

    if (intersects.length > 0) {
      const hitSphere = intersects[0].object;
      const flower = hitSphere.userData.flowerInstance;

      if (flower) {
        // 1. Rebote elástico
        flower.triggerRecoil(0.38);

        // 2. Acorde musical personalizado de esa flor
        if (window.soundEngine && flower.config.chord) {
          window.soundEngine.playChord(flower.config.chord);
        }

        // 3. Ráfaga de polen en la posición tridimensional de la flor tocada
        const flowerPos = flower.getWorldPosition();
        this.triggerBurst(flowerPos, flower.config.pollenColor);
      }
    } else {
      // Si toca cerca del ramo en el aire, hace rebotar suavemente a la flor reina
      const queen = this.bouquet.flowers[0];
      if (queen) {
        queen.triggerRecoil(0.20);
        if (window.soundEngine && queen.config.chord) {
          window.soundEngine.playChord(queen.config.chord);
        }
        this.triggerBurst(queen.getWorldPosition(), queen.config.pollenColor);
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    try {
      const delta = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.getElapsedTime();

      // 1. Actualizar Ramo de Flores
      if (this.bouquet) {
        this.bouquet.update(delta, elapsed);
        // Rotación orbital suave con amortiguamiento lerp y brisa viva
        this.bouquet.group.rotation.y = THREE.MathUtils.lerp(this.bouquet.group.rotation.y, this.targetRotationY, 0.08);
        this.bouquet.group.rotation.x = THREE.MathUtils.lerp(this.bouquet.group.rotation.x, this.targetRotationX + (this.bouquet.breezeOffsetX || 0), 0.08);
        this.bouquet.group.rotation.z = this.bouquet.breezeOffsetZ || 0;
      }

      // 2. Polen ambiental flotante
      if (this.pollenPoints) {
        const pos = this.pollenPoints.geometry.attributes.position.array;
        for (let i = 0; i < pos.length / 3; i++) {
          pos[i * 3] += this.pollenVels[i * 3] + Math.sin(elapsed * 0.7 + this.pollenPhases[i]) * 0.0015;
          pos[i * 3 + 1] += this.pollenVels[i * 3 + 1];
          pos[i * 3 + 2] += this.pollenVels[i * 3 + 2] + Math.cos(elapsed * 0.7 + this.pollenPhases[i]) * 0.0015;

          if (pos[i * 3 + 1] > 2.8) {
            pos[i * 3 + 1] = -1.5;
          }
        }
        this.pollenPoints.geometry.attributes.position.needsUpdate = true;
      }

      // 3. Ráfagas de polen activo
      for (let b = this.bursts.length - 1; b >= 0; b--) {
        const burst = this.bursts[b];
        burst.life -= delta;
        if (burst.life <= 0) {
          this.scene.remove(burst.burstMesh);
          burst.geom.dispose();
          burst.mat.dispose();
          this.bursts.splice(b, 1);
          continue;
        }

        const bPos = burst.geom.attributes.position.array;
        for (let j = 0; j < burst.vels.length; j++) {
          const v = burst.vels[j];
          bPos[j * 3] += v.x;
          bPos[j * 3 + 1] += v.y;
          bPos[j * 3 + 2] += v.z;
          v.y -= 0.0015;
        }
        burst.geom.attributes.position.needsUpdate = true;
        burst.mat.opacity = burst.life / 2.0;
      }

      this.renderer.render(this.scene, this.camera);
    } catch (err) {
      if (!window.__hasLoggedAnimErr) {
        window.__hasLoggedAnimErr = true;
        const errDiv = document.createElement('pre');
        errDiv.id = 'anim-error-log';
        errDiv.textContent = 'ANIM_ERROR: ' + err.message + '\n' + err.stack;
        document.body.appendChild(errDiv);
      }
    }
  }
}

// Inicialización global
window.addEventListener('DOMContentLoaded', () => {
  window.bouquetScene = new RealisticBouquetScene('canvas-container');
  window.flowerScene = window.bouquetScene; // Alias para compatibilidad con app.js
});
