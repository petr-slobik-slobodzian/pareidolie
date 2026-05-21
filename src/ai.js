import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Ensure it loads weights from CDN
env.allowLocalModels = false;

export class AI {
  constructor() {
    this.status = 'initializing';
    this.classifier = null;
    this.onReadyCallbacks = [];
    this.loadModel();
  }

  async loadModel() {
    try {
      this.classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
      this.status = 'ready';
      console.log("CLIP Model loaded successfully.");
      this.onReadyCallbacks.forEach(cb => cb());
      this.onReadyCallbacks = [];
    } catch (e) {
      console.error("Failed to load CLIP model:", e);
      this.status = 'error';
    }
  }

  onReady(callback) {
    if (this.status === 'ready') {
      callback();
    } else if (this.status === 'initializing') {
      this.onReadyCallbacks.push(callback);
    }
  }

  async analyzeMatch(imageURL, label) {
    if (this.status !== 'ready' || !this.classifier) {
      throw new Error("Model is not ready yet. Please wait a moment.");
    }

    // Simple translation map for common Czech Pareidolia targets
    const translations = {
      'drak': 'dragon',
      'pes': 'dog',
      'kocka': 'cat',
      'kočka': 'cat',
      'oblicej': 'face',
      'obličej': 'face',
      'tvar': 'face',
      'tvář': 'face',
      'postava': 'person',
      'clovek': 'person',
      'člověk': 'person',
      'zvire': 'animal',
      'zvíře': 'animal',
      'srdce': 'heart',
      'oko': 'eye',
      'ptak': 'bird',
      'pták': 'bird'
    };

    const searchLabel = translations[label.toLowerCase()] || label;
    const userPrompt = `a cloud shaped like ${searchLabel}`;
    const candidateLabels = [
      userPrompt,
      "abstract cloud patterns",
      "unstructured noise"
    ];

    const results = await this.classifier(imageURL, candidateLabels);
    
    const userResult = results.find(r => r.label === userPrompt);
    if (userResult) {
      let score = userResult.score;

      // CALIBRATION: CLIP scores are softmax probabilities.
      // In a set of 3, a score of 0.33 is "random chance".
      // We remap the score to be more meaningful for the user.
      if (results[0].label === userPrompt) {
        // If it's the winner, we boost it to show confidence (40% - 99%)
        score = 0.4 + (score * 0.6);
      } else {
        // If it's not the winner, we still show the relative confidence
        score = score * 0.8;
      }

      return Math.round(Math.min(score * 100, 99));
    }
    
    return 0;
  }
}
