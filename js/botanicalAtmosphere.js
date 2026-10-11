/**
 * botanicalAtmosphere.js
 * Módulo de iluminación cinematográfica y entorno procedural para materiales botánicos en Three.js.
 */

class BotanicalAtmosphere {
  constructor(scene, renderer, options = {}) {
    this.scene = scene;
    this.renderer = renderer;

    this.options = Object.assign({
      exposure: 1.18,
      keyColor: 0xffecd1,          // Champán cálido
      keyIntensity: 2.4,
      rimColor: 0xc084fc,          // Lavanda / violeta eléctrico
      rimIntensity: 4.2,
      internalGlowColor: 0xf472b6, // Rosa orquídea para SSS interno
      internalGlowIntensity: 2.2,
      ambientColor: 0x240d3d,      // Índigo nocturno para sombras
      ambientIntensity: 0.5,
      enableShadows: true
    }, options);

    this.lights = {};
    this.envRenderTarget = null;

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupEnvironmentMap();
    this.setupLighting();
  }

  setupRenderer() {
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.options.exposure;

    if ('outputColorSpace' in this.renderer && THREE.SRGBColorSpace) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if ('outputEncoding' in this.renderer && THREE.sRGBEncoding) {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    const maxDpr = isMobile ? 1.5 : 2.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));

    if (this.options.enableShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  setupEnvironmentMap() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    const canvasTexture = this.createSphericalGradientTexture();
    this.envRenderTarget = pmremGenerator.fromEquirectangular(canvasTexture);
    canvasTexture.dispose();

    this.scene.environment = this.envRenderTarget.texture;
    pmremGenerator.dispose();
  }

  createSphericalGradientTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. Degradado vertical de atmósfera nocturna (suelo índigo -> cénit violeta)
    const skyGrad = ctx.createLinearGradient(0, canvas.height, 0, 0);
    skyGrad.addColorStop(0.00, '#040108');
    skyGrad.addColorStop(0.35, '#120420');
    skyGrad.addColorStop(0.65, '#260a3d');
    skyGrad.addColorStop(1.00, '#3b1259');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Softbox cálida principal (Key) - Superior derecha
    const keySpot = ctx.createRadialGradient(
      canvas.width * 0.72, canvas.height * 0.32, 10,
      canvas.width * 0.72, canvas.height * 0.32, 240
    );
    keySpot.addColorStop(0.0, 'rgba(255, 245, 225, 0.95)');
    keySpot.addColorStop(0.4, 'rgba(255, 215, 170, 0.45)');
    keySpot.addColorStop(1.0, 'rgba(38, 10, 61, 0.0)');
    ctx.fillStyle = keySpot;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Softbox violeta rasante (Rim) - Superior izquierda/trasera
    const rimSpot = ctx.createRadialGradient(
      canvas.width * 0.28, canvas.height * 0.38, 10,
      canvas.width * 0.28, canvas.height * 0.38, 220
    );
    rimSpot.addColorStop(0.0, 'rgba(216, 180, 254, 0.90)');
    rimSpot.addColorStop(0.5, 'rgba(168, 85, 247, 0.35)');
    rimSpot.addColorStop(1.0, 'rgba(38, 10, 61, 0.0)');
    ctx.fillStyle = rimSpot;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4. Luz de rebote inferior
    const floorSpot = ctx.createRadialGradient(
      canvas.width * 0.5, canvas.height * 0.85, 20,
      canvas.width * 0.5, canvas.height * 0.85, 200
    );
    floorSpot.addColorStop(0.0, 'rgba(88, 28, 135, 0.35)');
    floorSpot.addColorStop(1.0, 'rgba(4, 1, 8, 0.0)');
    ctx.fillStyle = floorSpot;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    if ('colorSpace' in texture && THREE.SRGBColorSpace) {
      texture.colorSpace = THREE.SRGBColorSpace;
    } else if ('encoding' in texture && THREE.sRGBEncoding) {
      texture.encoding = THREE.sRGBEncoding;
    }
    return texture;
  }

  setupLighting() {
    // A. Luz ambiental base
    const ambient = new THREE.AmbientLight(this.options.ambientColor, this.options.ambientIntensity);
    this.scene.add(ambient);
    this.lights.ambient = ambient;

    // B. Key Light Cálida Principal
    const keyLight = new THREE.DirectionalLight(this.options.keyColor, this.options.keyIntensity);
    keyLight.position.set(3.5, 5.0, 3.2);
    if (this.options.enableShadows) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 15;
      keyLight.shadow.camera.left = -2.5;
      keyLight.shadow.camera.right = 2.5;
      keyLight.shadow.camera.top = 2.5;
      keyLight.shadow.camera.bottom = -2.5;
      keyLight.shadow.bias = -0.0001;
      keyLight.shadow.radius = 2.5;
    }
    this.scene.add(keyLight);
    this.lights.keyLight = keyLight;

    // C. Rim Light Lateral/Trasera Violeta
    const rimLight = new THREE.DirectionalLight(this.options.rimColor, this.options.rimIntensity);
    rimLight.position.set(-3.5, 3.0, -3.0);
    this.scene.add(rimLight);
    this.lights.rimLight = rimLight;

    // D. Internal Glow Light (Dispersión subsuperficial / SSS en el centro de la flor)
    const internalGlow = new THREE.PointLight(
      this.options.internalGlowColor,
      this.options.internalGlowIntensity,
      2.5,
      2.0
    );
    internalGlow.position.set(0, 0.25, 0);
    this.scene.add(internalGlow);
    this.lights.internalGlow = internalGlow;
  }
}

if (typeof window !== 'undefined') {
  window.BotanicalAtmosphere = BotanicalAtmosphere;
}
