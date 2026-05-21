const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf-8');

// Top nav
content = content.replace('<div class="top-nav">', '<div class="top-nav" style="display: flex; gap: 8px;">\n      <button class="icon-btn-sm" id="lang-btn" title="Switch Language">\n        <span id="lang-icon">🇬🇧</span>\n      </button>');
content = content.replace('id="help-btn-top" title="How to Discover"', 'id="help-btn-top" title="How to Discover" data-i18n-title="howToDiscover"');

// Controls
content = content.replace('title="Generate Clouds"', 'title="Generate Clouds" data-i18n-title="generateClouds"');
content = content.replace('<span>Generate Clouds</span>', '<span data-i18n="generateClouds">Generate Clouds</span>');
content = content.replace('title="Run/Pause"', 'title="Run/Pause" data-i18n-title="runPause"');
content = content.replace('<span>Run/Pause</span>', '<span data-i18n="runPause">Run/Pause</span>');
content = content.replace('title="Wind Direction"', 'title="Wind Direction" data-i18n-title="windDirection"');
content = content.replace('<span>Wind Direction</span>', '<span data-i18n="windDirection">Wind Direction</span>');
content = content.replace('title="Wind Up"', 'title="Wind Up" data-i18n-title="windUp"');
content = content.replace('title="Wind Down"', 'title="Wind Down" data-i18n-title="windDown"');
content = content.replace('title="Wind Left"', 'title="Wind Left" data-i18n-title="windLeft"');
content = content.replace('title="Wind Right"', 'title="Wind Right" data-i18n-title="windRight"');
content = content.replace('title="Wind Flow"', 'title="Wind Flow" data-i18n-title="windFlow"');
content = content.replace('<span>Wind Flow</span>', '<span data-i18n="windFlow">Wind Flow</span>');
content = content.replace('title="Settings"', 'title="Settings" data-i18n-title="settings"');
content = content.replace('<span>Settings</span>', '<span data-i18n="settings">Settings</span>');
content = content.replace('title="Fullscreen"', 'title="Fullscreen" data-i18n-title="fullscreen"');
content = content.replace('<span>Fullscreen</span>', '<span data-i18n="fullscreen">Fullscreen</span>');

// Modals
content = content.replace('title="Close"', 'title="Close" data-i18n-title="close"');
content = content.replace('<h2>New Discovery</h2>', '<h2 data-i18n="newDiscovery">New Discovery</h2>');
content = content.replace('<span class="view-label">Original</span>', '<span class="view-label" data-i18n="original">Original</span>');
content = content.replace('title="Rotate 90° CCW"', 'title="Rotate 90° CCW" data-i18n-title="rotateCcw"');
content = content.replace('<span class="view-label">Contour</span>', '<span class="view-label" data-i18n="contour">Contour</span>');
content = content.replace('title="Narrower"', 'title="Narrower" data-i18n-title="narrower"');
content = content.replace('title="Wider"', 'title="Wider" data-i18n-title="wider"');
content = content.replace('placeholder="Name this discovery..."', 'placeholder="Name this discovery..." data-i18n="namePlaceholder"');
content = content.replace('>Discard</button>', ' data-i18n="discard">Discard</button>');
content = content.replace('>Analyze Match</button>', ' data-i18n="analyzeMatch">Analyze Match</button>');
content = content.replace('>Save Findings</button>', ' data-i18n="saveFindings">Save Findings</button>');
content = content.replace('>Print Findings</button>', ' data-i18n="printFindings">Print Findings</button>');

// Settings modal
content = content.replace('id="settings-close-x" title="Close"', 'id="settings-close-x" title="Close" data-i18n-title="close"');
content = content.replace('<h2>Settings</h2>', '<h2 data-i18n="settings">Settings</h2>');
content = content.replace('<label>Noise Scale</label>', '<label data-i18n="noiseScale">Noise Scale</label>');
content = content.replace('<label>Complexity (Octaves)</label>', '<label data-i18n="complexity">Complexity (Octaves)</label>');
content = content.replace('<label>Cloud Coverage</label>', '<label data-i18n="cloudCoverage">Cloud Coverage</label>');
content = content.replace('<label>Cloud Density</label>', '<label data-i18n="cloudDensity">Cloud Density</label>');
content = content.replace('<label>Render Contrast</label>', '<label data-i18n="renderContrast">Render Contrast</label>');
content = content.replace('<label>Drift Speed</label>', '<label data-i18n="driftSpeed">Drift Speed</label>');
content = content.replace('<span class="toggle-label">Night Mode</span>', '<span class="toggle-label" data-i18n="nightMode">Night Mode</span>');
content = content.replace('>Tutorial</button>', ' data-i18n="tutorial">Tutorial</button>');
content = content.replace('>Done</button>', ' data-i18n="done">Done</button>');

fs.writeFileSync('index.html', content, 'utf-8');
console.log('index.html updated with i18n attributes');
