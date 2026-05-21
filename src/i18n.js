export const translations = {
  cs: {
    title: "Pareidolia Lab",
    howToDiscover: "Jak objevovat",
    generateClouds: "Generovat oblaka",
    runPause: "Spustit/Pozastavit",
    windDirection: "Směr větru",
    windUp: "Vítr nahoru",
    windDown: "Vítr dolů",
    windLeft: "Vítr doleva",
    windRight: "Vítr doprava",
    windFlow: "Změnit pohled",
    settings: "Nastavení",
    fullscreen: "Celá obrazovka",
    close: "Zavřít",
    newDiscovery: "Nový objev",
    original: "Originál",
    rotateCcw: "Otočit o 90° doleva",
    contour: "Obrys",
    narrower: "Tenčí",
    wider: "Širší",
    namePlaceholder: "Pojmenujte tento objev...",
    discard: "Zrušit",
    analyzeMatch: "Analyzovat shodu",
    saveFindings: "Uložit objev",
    printFindings: "Vytisknout objev",
    noiseScale: "Měřítko šumu",
    complexity: "Komplexita (Oktávy)",
    cloudCoverage: "Pokrytí oblohy",
    cloudDensity: "Hustota oblaků",
    renderContrast: "Kontrast",
    driftSpeed: "Rychlost pohybu",
    nightMode: "Noční režim",
    tutorial: "Nápověda",
    done: "Hotovo",
    unnamedDiscovery: "Nepojmenovaný objev",
    enterNameFirst: "Nejprve zadejte název!",
    analyzing: "Analyzuji...",
    loadingAi: "Načítám AI...",
    yourDiscovery: "Váš objev",
    demoWillClose: "Demo se zavře za",
    dragHint: "Táhněte myší pro vytvoření nového objevu."
  },
  en: {
    title: "Pareidolia Lab",
    howToDiscover: "How to Discover",
    generateClouds: "Generate Clouds",
    runPause: "Run/Pause",
    windDirection: "Wind Direction",
    windUp: "Wind Up",
    windDown: "Wind Down",
    windLeft: "Wind Left",
    windRight: "Wind Right",
    windFlow: "Change view",
    settings: "Settings",
    fullscreen: "Fullscreen",
    close: "Close",
    newDiscovery: "New Discovery",
    original: "Original",
    rotateCcw: "Rotate 90° CCW",
    contour: "Contour",
    narrower: "Narrower",
    wider: "Wider",
    namePlaceholder: "Name this discovery...",
    discard: "Discard",
    analyzeMatch: "Analyze Match",
    saveFindings: "Save Findings",
    printFindings: "Print Findings",
    noiseScale: "Noise Scale",
    complexity: "Complexity (Octaves)",
    cloudCoverage: "Cloud Coverage",
    cloudDensity: "Cloud Density",
    renderContrast: "Render Contrast",
    driftSpeed: "Drift Speed",
    nightMode: "Night Mode",
    tutorial: "Tutorial",
    done: "Done",
    unnamedDiscovery: "Unnamed Discovery",
    enterNameFirst: "Please enter a name first!",
    analyzing: "Analyzing...",
    loadingAi: "Loading AI...",
    yourDiscovery: "Your Discovery",
    demoWillClose: "Demo will close in",
    dragHint: "Drag and drop to make a new discovery."
  }
};

let currentLang = 'cs'; // Default to Czech

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  currentLang = lang;
  updateDOM();
  
  // Update flag button
  const langIcon = document.getElementById('lang-icon');
  if (langIcon) {
    // If it's CS, show UK flag to click for EN
    // If it's EN, show CZ flag to click for CS
    langIcon.innerText = currentLang === 'cs' ? '🇬🇧' : '🇨🇿';
  }
}

export function t(key) {
  return translations[currentLang][key] || key;
}

export function updateDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (el.tagName === 'INPUT' && el.type === 'text') {
      el.placeholder = t(key);
    } else {
      el.innerText = t(key);
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.title = t(key);
  });
}
