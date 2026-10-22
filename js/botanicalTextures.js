/**
 * botanicalTextures.js
 * Generador procedural botánico de texturas en HTML5 Canvas (1024x1024) para Three.js.
 * Genera Albedo, Normal Map y Roughness Map con acabado de terciopelo morado hiperrealista.
 */

const BotanicalPetalTextures = (function () {
  'use strict';

  function createCanvas(width, height) {
    if (typeof document !== 'undefined' && document.createElement) {
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      return c;
    }
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(width, height);
    }
    throw new Error('Canvas no soportado.');
  }

  function hexToRGB(hex) {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function lerpRGB(c1, c2, t) {
    t = Math.max(0, Math.min(1, t));
    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * t),
      Math.round(c1[1] + (c2[1] - c1[1]) * t),
      Math.round(c1[2] + (c2[2] - c1[2]) * t)
    ];
  }

  function configureCanvasTexture(texture, isColorMap, THREE_REF) {
    const T = THREE_REF || (typeof THREE !== 'undefined' ? THREE : null);
    if (!T) return;

    texture.wrapS = T.ClampToEdgeWrapping;
    texture.wrapT = T.ClampToEdgeWrapping;
    texture.generateMipmaps = true;

    if (isColorMap) {
      if ('colorSpace' in texture && T.SRGBColorSpace) {
        texture.colorSpace = T.SRGBColorSpace;
      } else if (T.sRGBEncoding) {
        texture.encoding = T.sRGBEncoding;
      }
    } else {
      if ('colorSpace' in texture && T.NoColorSpace) {
        texture.colorSpace = T.NoColorSpace;
      } else if (T.LinearEncoding) {
        texture.encoding = T.LinearEncoding;
      }
    }

    texture.needsUpdate = true;
  }

  function computePetalFields(width, height, options = {}) {
    const numBranchPairs = options.numBranchPairs || 9;
    const cellFreq = options.cellFrequency || 115.0;

    const branches = [];
    for (let i = 0; i < numBranchPairs; i++) {
      const t = i / (numBranchPairs - 1);
      const vStart = 0.04 + t * 0.70;
      const spread = 0.38 + t * 0.52;
      const curvature = 0.52 + (1.0 - t) * 0.32;
      const thickness = 0.018 * (1.0 - t * 0.45);
      branches.push({ vStart, spread: -spread, curvature, thickness, side: -1, idx: i });
      branches.push({ vStart, spread: spread, curvature, thickness, side: 1, idx: i });
    }

    const rowBranches = new Array(height);
    for (let y = 0; y < height; y++) {
      const v = 1.0 - (y / height);
      const left = [];
      const right = [];
      for (let b = 0; b < branches.length; b++) {
        const br = branches[b];
        if (v >= br.vStart && v <= 1.04) {
          const vProg = (v - br.vStart) / (1.04 - br.vStart);
          const branchX = br.spread * Math.pow(vProg, br.curvature);
          const wave = Math.sin(vProg * 16.0 + br.idx) * 0.012 * vProg;
          const posX = branchX + wave;
          const weight = (1.0 - vProg * 0.35);
          const invTwoThickSq = 1.0 / (2.0 * br.thickness * br.thickness);
          const item = { posX, weight, invTwoThickSq };
          if (br.side === -1) left.push(item);
          else right.push(item);
        }
      }
      rowBranches[y] = { left, right };
    }

    const veinBuffer = new Float32Array(width * height);
    const heightBuffer = new Float32Array(width * height);
    const cellBuffer = new Float32Array(width * height);

    const veinWeight = options.veinBumpWeight !== undefined ? options.veinBumpWeight : 0.70;
    const cellWeight = options.cellBumpWeight !== undefined ? options.cellBumpWeight : 0.22;

    for (let y = 0; y < height; y++) {
      const v = 1.0 - (y / height);
      const rowOffset = y * width;
      const active = rowBranches[y];

      const midribWidth = 0.024 * (1.0 - v * 0.52);
      const invTwoMidribSq = 1.0 / (2.0 * midribWidth * midribWidth);

      const cy = (1.0 - v) * cellFreq;
      const icy = Math.floor(cy);
      const fcy = cy - icy;

      for (let x = 0; x < width; x++) {
        const u = x / width;
        const uCenter = (u - 0.5) * 2.0;
        const absUCenter = Math.abs(uCenter);

        // A. Nervadura Central
        const midrib = Math.exp(- (absUCenter * absUCenter) * invTwoMidribSq);

        // B. Nervaduras Laterales
        const list = uCenter < 0 ? active.left : active.right;
        let branchMax = 0;
        for (let k = 0; k < list.length; k++) {
          const br = list[k];
          const dist = absUCenter - Math.abs(br.posX);
          if (Math.abs(dist) < 0.065) {
            const val = Math.exp(- (dist * dist) * br.invTwoThickSq) * br.weight;
            if (val > branchMax) branchMax = val;
          }
        }

        // C. Micro-estrías longitudinales
        const warp = Math.sin(v * 28.0 + uCenter * 6.0) * 0.018 + Math.sin(v * 75.0) * 0.006;
        const striationU = (uCenter + warp) * 115.0;
        const s1 = Math.sin(striationU);
        const s2 = Math.sin(striationU * 2.2);
        const striation = Math.max(0, s1 * 0.6 + s2 * 0.4);
        const striationMask = (1.0 - absUCenter * 0.25) * 0.22;

        const veinIntensity = Math.min(1.0, midrib * 1.05 + branchMax * 0.88 + striation * striationMask);
        veinBuffer[rowOffset + x] = veinIntensity;

        // D. Papilas celulares epidérmicas cónicas
        const cx = u * cellFreq;
        const icx = Math.floor(cx);
        const fcx = cx - icx;

        const chash = Math.sin(icx * 12.9898 + icy * 78.233) * 43758.5453;
        const jx = 0.5 + (chash - Math.floor(chash) - 0.5) * 0.42;
        const chash2 = Math.sin((icx + 23) * 17.135 + (icy + 59) * 91.411) * 23421.631;
        const jy = 0.5 + (chash2 - Math.floor(chash2) - 0.5) * 0.42;

        const cdx = fcx - jx;
        const cdy = fcy - jy;
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
        const cellDome = Math.max(0, 1.0 - cdist * 1.75);
        cellBuffer[rowOffset + x] = cellDome;

        heightBuffer[rowOffset + x] = veinIntensity * veinWeight + cellDome * cellWeight + striation * 0.08;
      }
    }

    return { veinBuffer, heightBuffer, cellBuffer };
  }

  function createPetalAlbedoTexture(options = {}) {
    const width = options.width || 1024;
    const height = options.height || 1024;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const fields = options.fields || computePetalFields(width, height, options);
    const { veinBuffer, cellBuffer } = fields;

    const cDeepBase = hexToRGB(options.colorDeepBase || '#704183');
    const cRoyalMid = hexToRGB(options.colorRoyalMid || '#9766ad');
    const cOrchid   = hexToRGB(options.colorOrchid   || '#bd8ecd');
    const cLavanda  = hexToRGB(options.colorLavanda  || '#d6b0e2');
    const cLavLight = hexToRGB(options.colorLavLight || '#e9c9ed');
    const cLavPale  = hexToRGB(options.colorLavPale  || '#efdae9');
    const cEdgeRim  = hexToRGB(options.colorEdgeRim  || '#fff2ed');

    for (let y = 0; y < height; y++) {
      const v = 1.0 - (y / height);
      const rowOffset = y * width;

      for (let x = 0; x < width; x++) {
        const u = x / width;
        const uCenter = (u - 0.5) * 2.0;
        const absUCenter = Math.abs(uCenter);
        const pixelIdx = (rowOffset + x) * 4;

        const vein = veinBuffer[rowOffset + x];
        const cell = cellBuffer[rowOffset + x];

        let baseColor;
        if (v < 0.25) {
          const t = v / 0.25;
          baseColor = lerpRGB(cDeepBase, cRoyalMid, t);
        } else if (v < 0.55) {
          const t = (v - 0.25) / 0.30;
          baseColor = lerpRGB(cRoyalMid, cOrchid, t);
        } else if (v < 0.80) {
          const t = (v - 0.55) / 0.25;
          baseColor = lerpRGB(cOrchid, cLavanda, t);
        } else {
          const t = (v - 0.80) / 0.20;
          baseColor = lerpRGB(cLavanda, cLavLight, t);
        }

        const lateralFactor = Math.pow(absUCenter, 1.6);
        let petalColor = lerpRGB(baseColor, cLavPale, lateralFactor * 0.45);

        const edgeDist = Math.max(Math.pow(absUCenter, 4.0), Math.pow(v, 6.0));
        petalColor = lerpRGB(petalColor, cEdgeRim, edgeDist * 0.65);

        const veinColorBase = [34, 4, 62];
        const veinColorApex = [138, 43, 226];
        const veinTone = lerpRGB(veinColorBase, veinColorApex, v * 0.85);
        const finalColor = lerpRGB(petalColor, veinTone, vein * 0.10);

        const microShade = (cell - 0.5) * 7.5;

        data[pixelIdx]     = Math.max(0, Math.min(255, finalColor[0] + microShade));
        data[pixelIdx + 1] = Math.max(0, Math.min(255, finalColor[1] + microShade));
        data[pixelIdx + 2] = Math.max(0, Math.min(255, finalColor[2] + microShade));
        data[pixelIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const T = options.THREE || (typeof THREE !== 'undefined' ? THREE : null);
    if (!T) return canvas;

    const texture = new T.CanvasTexture(canvas);
    configureCanvasTexture(texture, true, T);
    return texture;
  }

  function createPetalNormalTexture(options = {}) {
    const width = options.width || 1024;
    const height = options.height || 1024;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const fields = options.fields || computePetalFields(width, height, options);
    const { heightBuffer } = fields;

    const normalStrength = options.normalStrength !== undefined ? options.normalStrength : 0.7;

    for (let y = 0; y < height; y++) {
      const rowOffset = y * width;
      const yPrev = Math.max(0, y - 1);
      const yNext = Math.min(height - 1, y + 1);
      const rowPrev = yPrev * width;
      const rowNext = yNext * width;

      for (let x = 0; x < width; x++) {
        const xPrev = Math.max(0, x - 1);
        const xNext = Math.min(width - 1, x + 1);
        const pixelIdx = (rowOffset + x) * 4;

        const hTL = heightBuffer[rowPrev + xPrev];
        const hT  = heightBuffer[rowPrev + x];
        const hTR = heightBuffer[rowPrev + xNext];
        const hL  = heightBuffer[rowOffset + xPrev];
        const hR  = heightBuffer[rowOffset + xNext];
        const hBL = heightBuffer[rowNext + xPrev];
        const hB  = heightBuffer[rowNext + x];
        const hBR = heightBuffer[rowNext + xNext];

        const dX = (hTR + 2.0 * hR + hBR) - (hTL + 2.0 * hL + hBL);
        const dY = (hBL + 2.0 * hB + hBR) - (hTL + 2.0 * hT + hTR);

        let nx = -dX * normalStrength;
        let ny =  dY * normalStrength;
        let nz =  1.0;

        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len;
        ny /= len;
        nz /= len;

        data[pixelIdx]     = Math.round((nx * 0.5 + 0.5) * 255);
        data[pixelIdx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        data[pixelIdx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
        data[pixelIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const T = options.THREE || (typeof THREE !== 'undefined' ? THREE : null);
    if (!T) return canvas;

    const texture = new T.CanvasTexture(canvas);
    configureCanvasTexture(texture, false, T);
    return texture;
  }

  function createPetalRoughnessTexture(options = {}) {
    const width = options.width || 1024;
    const height = options.height || 1024;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const fields = options.fields || computePetalFields(width, height, options);
    const { veinBuffer, cellBuffer } = fields;

    const rValley = options.valleyRoughness !== undefined ? options.valleyRoughness : 0.82;
    const rVein   = options.veinRoughness   !== undefined ? options.veinRoughness   : 0.30;

    for (let y = 0; y < height; y++) {
      const v = 1.0 - (y / height);
      const rowOffset = y * width;

      for (let x = 0; x < width; x++) {
        const u = x / width;
        const uCenter = (u - 0.5) * 2.0;
        const absUCenter = Math.abs(uCenter);
        const pixelIdx = (rowOffset + x) * 4;

        const vein = veinBuffer[rowOffset + x];
        const cell = cellBuffer[rowOffset + x];

        let roughness = rValley - vein * (rValley - rVein);
        roughness -= (cell - 0.5) * 0.08;

        const edgeDist = Math.max(Math.pow(absUCenter, 4.0), Math.pow(v, 6.0));
        roughness = roughness * (1.0 - edgeDist * 0.20);

        const rByte = Math.round(Math.max(0, Math.min(1, roughness)) * 255);
        data[pixelIdx]     = rByte;
        data[pixelIdx + 1] = rByte;
        data[pixelIdx + 2] = rByte;
        data[pixelIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const T = options.THREE || (typeof THREE !== 'undefined' ? THREE : null);
    if (!T) return canvas;

    const texture = new T.CanvasTexture(canvas);
    configureCanvasTexture(texture, false, T);
    return texture;
  }

  function createPetalTextureSet(options = {}) {
    const width = options.width || 1024;
    const height = options.height || 1024;

    const fields = computePetalFields(width, height, options);
    const passOptions = Object.assign({}, options, { width, height, fields });

    const albedoTexture = createPetalAlbedoTexture(passOptions);
    const normalTexture = createPetalNormalTexture(passOptions);
    const roughnessTexture = createPetalRoughnessTexture(passOptions);

    const T = options.THREE || (typeof THREE !== 'undefined' ? THREE : null);

    return {
      albedoTexture,
      normalTexture,
      roughnessTexture,
      albedoCanvas: T ? albedoTexture.image : albedoTexture,
      normalCanvas: T ? normalTexture.image : normalTexture,
      roughnessCanvas: T ? roughnessTexture.image : roughnessTexture
    };
  }

  function createBotanicalPetalMaterial(textures, options = {}) {
    const T = options.THREE || (typeof THREE !== 'undefined' ? THREE : null);
    if (!T) throw new Error('THREE no está disponible.');

    const normalScale = options.normalScale !== undefined ? options.normalScale : 0.85;
    const sheenInput = options.sheenColor !== undefined ? options.sheenColor : options.sheen;
    const sheenColor = (sheenInput instanceof T.Color)
      ? sheenInput
      : new T.Color(sheenInput || 0xd8b4fe);

    return new T.MeshPhysicalMaterial({
      map: textures.albedoTexture,
      // Soft petal surfaces use geometry normals to avoid noisy microfacets.
      normalScale: new T.Vector2(normalScale, normalScale),

      roughness: 1.0,
      metalness: 0.02,

      // En Three.js r128 sheen debe ser THREE.Color directamente
      sheen: sheenColor.clone().multiplyScalar(0.08),

      transmission: options.transmission !== undefined ? options.transmission : 0.35,

      clearcoat: 0.22,
      clearcoatRoughness: 0.32,

      side: T.DoubleSide
    });
  }

  return {
    createPetalAlbedoTexture,
    createPetalNormalTexture,
    createPetalRoughnessTexture,
    createPetalTextureSet,
    createBotanicalPetalMaterial
  };
})();

if (typeof window !== 'undefined') {
  window.BotanicalPetalTextures = BotanicalPetalTextures;
}
