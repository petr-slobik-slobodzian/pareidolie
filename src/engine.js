import * as THREE from 'https://unpkg.com/three@0.150.1/build/three.module.js';

/**
 * Visual Engine: Three.js + GLSL Shaders
 * Cinematic Layered Engine (Perspective + High Clarity)
 * Version: "Vertical Mass" Edition
 */
export class VisualEngine {
  constructor(container, state) {
    this.container = container;
    this.state = state;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true });

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.initUniforms();
    this.setupShader();
    this.setupEvents();
    this.animate();
  }

  initUniforms() {
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(this.container.clientWidth, this.container.clientHeight) },
      uSeed: { value: this.hashString(this.state.seed) },
      uNoiseScale: { value: this.state.noiseScale },
      uNoiseOctaves: { value: parseInt(this.state.noiseOctaves) || 4 },
      uContrast: { value: this.state.contrast },
      uBiasStrength: { value: this.state.biasStrength },
      uCloudCoverage: { value: this.state.cloudCoverage },
      uCloudDensity: { value: this.state.cloudDensity },
      uRawMode: { value: this.state.rawMode },
      uNightMode: { value: this.state.nightMode },
      uBottomPerspective: { value: this.state.bottomPerspective },
      uOffset: { value: new THREE.Vector2(0, 0) },
      uCameraOffset: { value: new THREE.Vector2(0, 0) }
    };
  }

  getVertexShader() {
    return `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  getFragmentShader() {
    return `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uSeed;
      uniform float uNoiseScale;
      uniform int uNoiseOctaves;
      uniform float uContrast;
      uniform float uBiasStrength;
      uniform float uCloudCoverage;
      uniform float uCloudDensity;
      uniform bool uRawMode;
      uniform bool uNightMode;
      uniform bool uBottomPerspective;
      uniform vec2 uOffset;
      uniform vec2 uCameraOffset;
      varying vec2 vUv;

      #define UI0 1597334673U
      #define UI1 3812015801U
      #define UI2 uvec2(UI0, UI1)
      #define UI3 uvec3(UI0, UI1, 2798796415U)
      #define UIF (1.0 / float(0xffffffffU))

      vec3 hash33(vec3 p) {
        uvec3 q = uvec3(ivec3(p)) * UI3;
        q = (q.x ^ q.y ^ q.z)*UI3;
        return -1. + 2. * vec3(q) * UIF;
      }

      float remap(float x, float a, float b, float c, float d) {
        return (((x - a) / (max(b - a, 0.0001))) * (d - c)) + c;
      }

      float gradientNoise(vec3 x) {
        vec3 p = floor(x);
        vec3 w = fract(x);
        vec3 u = w * w * w * (w * (w * 6. - 15.) + 10.);
        vec3 ga = hash33(p + vec3(0., 0., 0.));
        vec3 gb = hash33(p + vec3(1., 0., 0.));
        vec3 gc = hash33(p + vec3(0., 1., 0.));
        vec3 gd = hash33(p + vec3(1., 1., 0.));
        vec3 ge = hash33(p + vec3(0., 0., 1.));
        vec3 gf = hash33(p + vec3(1., 0., 1.));
        vec3 gg = hash33(p + vec3(0., 1., 1.));
        vec3 gh = hash33(p + vec3(1., 1., 1.));
        float va = dot(ga, w - vec3(0., 0., 0.));
        float vb = dot(gb, w - vec3(1., 0., 0.));
        float vc = dot(gc, w - vec3(0., 1., 0.));
        float vd = dot(gd, w - vec3(1., 1., 0.));
        float ve = dot(ge, w - vec3(0., 0., 1.));
        float vf = dot(gf, w - vec3(1., 0., 1.));
        float vg = dot(gg, w - vec3(0., 1., 1.));
        float vh = dot(gh, w - vec3(1., 1., 1.));
        return va + u.x * (vb - va) + u.y * (vc - va) + u.z * (ve - va) + 
               u.x * u.y * (va - vb - vc + vd) + u.y * u.z * (va - vc - ve + vg) + 
               u.z * u.x * (va - vb - ve + vf) + u.x * u.y * u.z * (-va + vb + vc - vd + ve - vf - vg + vh);
      }

      float worleyNoise(vec3 uv) {    
        vec3 id = floor(uv);
        vec3 p = fract(uv);
        vec3 offsetBase = step(vec3(0.5), p) - vec3(1.0);
        float minDist = 10.0;
        for (float x = 0.; x <= 1.; ++x) {
          for(float y = 0.; y <= 1.; ++y) {
            for(float z = 0.; z <= 1.; ++z) {
              vec3 offset = offsetBase + vec3(x, y, z);
              vec3 h = hash33(id + offset) * .5 + .5;
              vec3 d = p - (offset + h);
              minDist = min(minDist, dot(d, d));
            }
          }
        }
        return 1. - minDist;
      }

      float perlinfbm(vec3 p, float freq, int octaves) {
        float G = exp2(-.85);
        float amp = 1.;
        float noise = 0.;
        for (int i = 0; i < 8; ++i) {
          if (i >= octaves) break;
          noise += amp * gradientNoise(p * freq);
          freq *= 2.;
          amp *= G;
        }
        return noise;
      }

      float worleyFbm(vec3 p, float freq) {
        return worleyNoise(p*freq) * .625 +
               worleyNoise(p*freq*2.) * .25 +
               worleyNoise(p*freq*4.) * .125;
      }

      float getBias(vec2 p, float seed, float aspect) {
        float b = 0.0;
        // Center-align and aspect-correct for bias shapes
        vec2 pAdj = vec2((p.x - 0.5) * aspect + 0.5, p.y);
        
        for(int i=0; i<8; i++) {
          float fi = float(i);
          float h1 = fract(sin(seed + fi * 123.4) * 43758.545);
          float h2 = fract(sin(seed + fi * 567.8) * 43758.545);
          float h3 = fract(sin(seed + fi * 910.1) * 43758.545);
          vec2 pos = vec2(h1, h2);
          float size = 0.05 + 0.15 * h3;
          float rot = fract(sin(seed + fi * 111.1) * 43758.545) * 6.28;
          vec2 d = pAdj - pos;
          float cosR = cos(rot); float sinR = sin(rot);
          d = vec2(d.x * cosR - d.y * sinR, d.x * sinR + d.y * cosR);
          float eyeDist = size * 0.4;
          float eyeSize = size * 0.2;
          float e1 = smoothstep(eyeSize, 0.0, length(d - vec2(-eyeDist, 0.0)));
          float e2 = smoothstep(eyeSize, 0.0, length(d - vec2(eyeDist, 0.0)));
          float m = smoothstep(size * 0.5, 0.0, length(d - vec2(0.0, -size*0.3))) * smoothstep(0.0, 0.1, d.y + size*0.3);
          b += (e1 + e2 + m * 0.5) * (0.1 + 0.3 * fract(sin(seed + fi) * 43758.545));
        }
        return b;
      }

      float getCloudDensity(vec3 p3) {
        float pfbm = mix(1., perlinfbm(p3, 4., uNoiseOctaves), .5);
        pfbm = abs(pfbm * 2. - 1.);
        float wfbm_low = worleyFbm(p3, 4.);
        float perlinWorley = clamp(remap(pfbm, 0., 1., wfbm_low, 1.0), 0.0, 1.0);
        float wfbm_high = worleyFbm(p3 * 2.0, 8.0);
        float cloud = clamp(remap(perlinWorley, wfbm_high - 1.0, 1.0, 0.0, 1.0), 0.0, 1.0);
        cloud = clamp(remap(cloud, 1.0 - uCloudCoverage, 1.0, 0.0, 1.0), 0.0, 1.0);
        return cloud * uCloudDensity;
      }

      void main() {
        vec2 uv = vUv;
        float finalV = 0.0;
        float aspect = uResolution.x / uResolution.y;
        
        if (uBottomPerspective) {
          // Center noise coordinates
          vec2 p = vec2((uv.x - 0.5) * aspect + 0.5, uv.y);
          vec3 seedOffset = vec3(uSeed * 100.0, uSeed * 200.0, uSeed * 300.0);

          float b = 0.0;
          if (!uRawMode) b = getBias(uv, uSeed, aspect);

          for(int i=0; i<6; i++) {
            float heightOffset = float(i) * 0.04;
            vec2 pTilted = p; 
            vec3 p3 = vec3(pTilted * uNoiseScale * 1.5 - uOffset - uCameraOffset, uTime * 0.01 + heightOffset) + seedOffset;
            
            float cloud = getCloudDensity(p3);
            
            if (!uRawMode) {
              cloud = clamp(cloud - b * uBiasStrength * 0.5, 0.0, 1.0);
            }

            float power = uNightMode ? 0.8 : 1.5;
            float layerV = pow(clamp((cloud - 0.5) * uContrast + 0.5, 0.0, 1.0), power);
            finalV = max(finalV, layerV);
            if (finalV > 0.99) break;
          }
        } else {
          float horizonLine = 0.20;
          float dist = uv.y - horizonLine;
          
          if (dist > 0.0) {
            float normDist = dist / (1.0 - horizonLine);
            float perspective = mix(0.25, 1.0, normDist); 
            
            // Adjust x by aspect ratio and center coordinates
            vec2 p = vec2(((uv.x - 0.5) * aspect) / perspective + 0.5, 1.0 / (0.15 + dist * 1.5));
            
            vec3 seedOffset = vec3(uSeed * 100.0, uSeed * 200.0, uSeed * 300.0);

            float b = 0.0;
            if (!uRawMode) b = getBias(uv, uSeed, aspect);

            for(int i=0; i<6; i++) {
              float heightOffset = float(i) * 0.04;
              vec2 pTilted = p - vec2(0.0, heightOffset * (p.y - 1.0));
              vec3 p3 = vec3(pTilted * uNoiseScale * 1.5 - uOffset - uCameraOffset, uTime * 0.01 + heightOffset) + seedOffset;
              
              float cloud = getCloudDensity(p3);
              
              if (!uRawMode) {
                cloud = clamp(cloud - b * uBiasStrength * 0.5, 0.0, 1.0);
              }

              float power = uNightMode ? 0.8 : 1.5;
              float layerV = pow(clamp((cloud - 0.5) * uContrast + 0.5, 0.0, 1.0), power);
              finalV = max(finalV, layerV);
              if (finalV > 0.99) break;
            }
            
            finalV *= smoothstep(0.0, 0.1, dist);
          }
        }

        vec3 skyTop = uNightMode ? vec3(0.0) : vec3(0.02, 0.05, 0.15);
        vec3 skyBot = uNightMode ? vec3(0.0) : vec3(0.3, 0.5, 0.8);
        vec3 sky = mix(skyBot, skyTop, uv.y);
        
        vec3 cloudColor = uNightMode ? vec3(0.98, 0.98, 1.0) : vec3(0.95, 0.98, 1.0);
        vec3 color = mix(sky, cloudColor, finalV);

        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }

  setupShader() {
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader()
    });

    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return Math.abs(h % 100000) / 100000;
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.uniforms.uResolution.value.set(this.container.clientWidth, this.container.clientHeight);
    });

    this.state.subscribe((s) => {
      this.uniforms.uSeed.value = this.hashString(s.seed);
      this.uniforms.uNoiseScale.value = s.noiseScale;
      this.uniforms.uNoiseOctaves.value = parseInt(s.noiseOctaves) || 4;
      this.uniforms.uContrast.value = s.contrast;
      this.uniforms.uBiasStrength.value = s.biasStrength;
      this.uniforms.uCloudCoverage.value = s.cloudCoverage;
      this.uniforms.uCloudDensity.value = s.cloudDensity;
      this.uniforms.uRawMode.value = s.rawMode;
      this.uniforms.uNightMode.value = s.nightMode;
      this.uniforms.uBottomPerspective.value = s.bottomPerspective;
    });
  }

  animate(time) {
    requestAnimationFrame(this.animate.bind(this));
    if (this.state.running) {
      this.uniforms.uTime.value += 0.002;
      this.uniforms.uOffset.value.x += this.state.windX * this.state.speed * 0.1;
      this.uniforms.uOffset.value.y += this.state.windY * this.state.speed * 0.1;
    }
    this.renderer.render(this.scene, this.camera);
  }

  snapshot() {
    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `pareidolia-${this.state.seed}.png`;
    link.href = dataUrl;
    link.click();
  }

  pan(x, y) {
    this.uniforms.uCameraOffset.value.x += x;
    this.uniforms.uCameraOffset.value.y += y;
  }

  getPixelData(x, y, width, height) {
    const dpr = window.devicePixelRatio;
    const canvas = this.renderer.domElement;
    const gl = this.renderer.getContext();
    const readX = Math.round(x * dpr);
    const readY = Math.round(canvas.height - (y + height) * dpr);
    const readW = Math.round(width * dpr);
    const readH = Math.round(height * dpr);
    if (readW <= 0 || readH <= 0) return null;
    const pixels = new Uint8Array(readW * readH * 4);
    gl.readPixels(readX, readY, readW, readH, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return { data: pixels, width: readW, height: readH };
  }

  getRegionDataURL(x, y, width, height) {
    const dpr = window.devicePixelRatio;
    const canvas = this.renderer.domElement;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width * dpr;
    tempCanvas.height = height * dpr;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, x * dpr, y * dpr, width * dpr, height * dpr, 0, 0, width * dpr, height * dpr);
    return tempCanvas.toDataURL('image/png');
  }
}
