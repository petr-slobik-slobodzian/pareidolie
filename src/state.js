/**
 * Minimalist state management for Pareidolia Lab
 */

export const state = {
  seed: 'mystic-cloud-123',
  running: true,
  biasStrength: 0.2,
  noiseScale: 0.30,
  noiseOctaves: 8,
  contrast: 4.5,
  speed: 0.03,
  showBiasOverlay: false,
  rawMode: false,
  cloudCoverage: 0.15,
  cloudDensity: 0.8,
  windX: 0.05,
  windY: 0.05,
  nightMode: false,
  bottomPerspective: false,
  annotations: [],

  // Listeners for state changes
  listeners: new Set(),

  update(payload) {
    Object.assign(this, payload);
    this.notify();

    // Auto-save annotations if they changed
    if (payload.annotations) {
      this.saveAnnotations();
    }

    // Update URL with all persistent parameters
    const url = new URL(window.location);
    const params = ['seed', 'noiseScale', 'noiseOctaves', 'contrast', 'speed', 'biasStrength', 'rawMode', 'cloudCoverage', 'cloudDensity', 'windX', 'windY', 'nightMode', 'bottomPerspective'];
    params.forEach(p => {
      if (this[p] !== undefined) {
        url.searchParams.set(p, this[p]);
      }
    });
    window.history.replaceState({}, '', url);
  },

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },

  notify() {
    this.listeners.forEach(cb => cb(this));
  },

  saveAnnotations() {
    localStorage.setItem(`pareidolia_ann_${this.seed}`, JSON.stringify(this.annotations));
  },

  loadAnnotations() {
    const saved = localStorage.getItem(`pareidolia_ann_${this.seed}`);
    this.annotations = saved ? JSON.parse(saved) : [];
    this.notify();
  },

  randomizeSeed() {
    const adjectives = ['silent', 'lucky', 'odd', 'fuzzy', 'noisy', 'gentle', 'mystic', 'sleepy', 'weird', 'blur'];
    const nouns = ['owl', 'cloud', 'rock', 'toast', 'tree', 'wave', 'smoke', 'stain', 'sky', 'dust'];
    const r1 = Math.floor(Math.random() * adjectives.length);
    const r2 = Math.floor(Math.random() * nouns.length);
    const r3 = Math.floor(Math.random() * 10000);
    this.update({ seed: `${adjectives[r1]}-${nouns[r2]}-${r3}` });
  }
};

// Initialize from URL
const urlParams = new URLSearchParams(window.location.search);
const paramsMap = {
  seed: 'seed',
  noiseScale: 'scale',
  noiseOctaves: 'octaves',
  contrast: 'contrast',
  speed: 'speed',
  biasStrength: 'bias',
  rawMode: 'raw',
  cloudCoverage: 'coverage',
  cloudDensity: 'density'
};

Object.entries(paramsMap).forEach(([stateKey, urlKey]) => {
  const val = urlParams.get(urlKey);
  if (val !== null) {
    if (stateKey === 'seed') state[stateKey] = val;
    else if (stateKey === 'rawMode' || stateKey === 'nightMode' || stateKey === 'bottomPerspective') state[stateKey] = val === 'true';
    else state[stateKey] = parseFloat(val);
  }
});
