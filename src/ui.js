/**
 * UI & Annotation System for Pareidolia Lab
 */
import { generateDiscoverySVG } from './geometry.js';
import { t } from './i18n.js';

export class UI {
  constructor(state, engine, ai) {
    this.state = state;
    this.engine = engine;
    this.ai = ai;
    this.pendingDiscovery = null;

    this.initControls();
    this.initAnnotations();
    this.initModal();
    this.syncUI();

    this.state.subscribe(() => this.syncUI());
  }

  initControls() {
    document.getElementById('generate-clouds').addEventListener('click', () => {
      this.state.randomizeSeed();
    });

    document.getElementById('run-pause').addEventListener('click', () => {
      this.state.update({ running: !this.state.running });
    });

    const windPopover = document.getElementById('wind-popover');
    document.getElementById('wind-direction-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      windPopover.style.display = windPopover.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.popover-wrapper')) {
        windPopover.style.display = 'none';
      }
    });

    document.getElementById('wind-flow').addEventListener('click', () => {
      this.state.update({ bottomPerspective: !this.state.bottomPerspective });
    });

    // Wind Controls
    document.getElementById('wind-up').addEventListener('click', () => {
      this.state.update({ windY: 0.1, windX: 0.0, running: true });
    });
    document.getElementById('wind-down').addEventListener('click', () => {
      this.state.update({ windY: -0.1, windX: 0.0, running: true });
    });
    document.getElementById('wind-left').addEventListener('click', () => {
      this.state.update({ windX: 0.1, windY: 0.0, running: true });
    });
    document.getElementById('wind-right').addEventListener('click', () => {
      this.state.update({ windX: -0.1, windY: 0.0, running: true });
    });

    document.getElementById('fullscreen-btn').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    });
    
    // Settings modal toggle
    const settingsModal = document.getElementById('settings-modal');
    document.getElementById('settings-btn').addEventListener('click', () => {
      settingsModal.style.display = 'flex';
      this.syncSliders();
    });
    document.getElementById('settings-close').addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });
    document.getElementById('settings-close-x').addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });

    // Sliders
    const sliders = [
      { id: 'slider-noise', key: 'noiseScale' },
      { id: 'slider-octaves', key: 'noiseOctaves' },
      { id: 'slider-coverage', key: 'cloudCoverage' },
      { id: 'slider-density', key: 'cloudDensity' },
      { id: 'slider-contrast', key: 'contrast' },
      { id: 'slider-speed', key: 'speed' }
    ];

    sliders.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          this.state.update({ [key]: parseFloat(e.target.value) });
        });
      }
    });

    document.getElementById('night-mode-toggle').addEventListener('change', (e) => {
      this.state.update({ nightMode: e.target.checked });
    });

    document.getElementById('help-btn').addEventListener('click', () => {
      settingsModal.style.display = 'none';
      this.runTutorial();
    });

    const helpBtnTop = document.getElementById('help-btn-top');
    if (helpBtnTop) {
      helpBtnTop.addEventListener('click', () => {
        this.runTutorial();
      });
    }
  }

  syncSliders() {
    const map = {
      'noiseScale': { slider: 'slider-noise', val: 'val-noise' },
      'noiseOctaves': { slider: 'slider-octaves', val: 'val-octaves' },
      'cloudCoverage': { slider: 'slider-coverage', val: 'val-coverage' },
      'cloudDensity': { slider: 'slider-density', val: 'val-density' },
      'contrast': { slider: 'slider-contrast', val: 'val-contrast' },
      'speed': { slider: 'slider-speed', val: 'val-speed' }
    };
    
    Object.entries(map).forEach(([key, ids]) => {
      const sliderEl = document.getElementById(ids.slider);
      const valEl = document.getElementById(ids.val);
      if (sliderEl && valEl) {
        sliderEl.value = this.state[key];
        valEl.innerText = this.state[key].toFixed(2);
      }
    });
  }

  initAnnotations() {
    const svg = document.getElementById('annotation-svg');
    let isDrawing = false;
    let startPoint = { x: 0, y: 0 };
    let currentRect = null;

    const getPos = (e) => {
      const rect = svg.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handleStart = (e) => {
      // Prevent scrolling while drawing on mobile
      if (e.type === 'touchstart') e.preventDefault();
      
      startPoint = getPos(e);
      isDrawing = true;

      currentRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      currentRect.setAttribute('class', 'annotation-rect');
      svg.appendChild(currentRect);
    };

    const handleMove = (e) => {
      if (!isDrawing) return;
      if (e.type === 'touchmove') e.preventDefault();
      
      const currentPoint = getPos(e);

      const x = Math.min(startPoint.x, currentPoint.x);
      const y = Math.min(startPoint.y, currentPoint.y);
      const width = Math.abs(startPoint.x - currentPoint.x);
      const height = Math.abs(startPoint.y - currentPoint.y);

      currentRect.setAttribute('x', x);
      currentRect.setAttribute('y', y);
      currentRect.setAttribute('width', width);
      currentRect.setAttribute('height', height);
    };

    const handleEnd = (e) => {
      if (!isDrawing) return;
      isDrawing = false;

      const rect = {
        x: parseFloat(currentRect.getAttribute('x')),
        y: parseFloat(currentRect.getAttribute('y')),
        width: parseFloat(currentRect.getAttribute('width')),
        height: parseFloat(currentRect.getAttribute('height'))
      };

      if (currentRect) currentRect.remove();

      // Minimal selection check (handles NaN from clicks)
      if (!rect.width || isNaN(rect.width) || rect.width < 10 || rect.height < 10) {
        this.showToast(t('dragHint'));
        return;
      }

      this.openDiscoveryModal(rect);
    };

    svg.addEventListener('mousedown', handleStart);
    svg.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    svg.addEventListener('touchstart', handleStart, { passive: false });
    svg.addEventListener('touchmove', handleMove, { passive: false });
    svg.addEventListener('touchend', handleEnd);
  }

  initModal() {
    const modal = document.getElementById('discovery-modal');
    const closeBtn = document.getElementById('close-modal');
    const saveBtn = document.getElementById('save-discovery');
    const printBtn = document.getElementById('print-discovery');
    const rotateBtn = document.getElementById('rotate-left');
    const nameInput = document.getElementById('discovery-name');
    const threshInc = document.getElementById('threshold-inc');
    const threshDec = document.getElementById('threshold-dec');
    const closeX = document.getElementById('modal-close-x');
    
    const analyzeBtn = document.getElementById('analyze-match');
    const aiMatchContainer = document.getElementById('ai-match-container');
    const aiMatchBar = document.getElementById('ai-match-bar');
    const aiMatchScore = document.getElementById('ai-match-score');

    const closeAll = () => {
      modal.style.display = 'none';
      this.pendingDiscovery = null;
      aiMatchContainer.style.display = 'none';
      aiMatchBar.style.width = '0%';
      aiMatchScore.innerText = '--%';
    };

    closeBtn.onclick = closeAll;
    closeX.onclick = closeAll;

    saveBtn.onclick = () => {
      const label = nameInput.value || t('unnamedDiscovery');
      this.saveDiscovery(label);
      closeAll();
    };

    printBtn.onclick = () => {
      const label = nameInput.value || t('unnamedDiscovery');
      this.printDiscovery(label);
      closeAll();
    };

    rotateBtn.onclick = () => {
      if (!this.pendingDiscovery) return;
      this.pendingDiscovery.rotation = (this.pendingDiscovery.rotation + 90) % 360;
      this.updateModalViews();
    };

    threshInc.onclick = () => {
      if (!this.pendingDiscovery) return;
      this.pendingDiscovery.threshold = Math.max(0.1, this.pendingDiscovery.threshold - 0.05);
      this.updateModalViews();
    };

    threshDec.onclick = () => {
      if (!this.pendingDiscovery) return;
      this.pendingDiscovery.threshold = Math.min(0.9, this.pendingDiscovery.threshold + 0.05);
      this.updateModalViews();
    };

    analyzeBtn.onclick = async () => {
      if (!this.pendingDiscovery) return;
      const label = nameInput.value.trim();
      if (!label) {
        alert(t('enterNameFirst'));
        return;
      }
      
      aiMatchContainer.style.display = 'flex';
      aiMatchScore.innerText = '...';
      aiMatchBar.style.width = '0%';
      analyzeBtn.innerText = t('analyzing');
      analyzeBtn.disabled = true;

      try {
        // Change text based on AI status
        if (this.ai.status === 'initializing') {
            aiMatchScore.innerText = t('loadingAi');
            // Wait for model to load
            await new Promise(resolve => this.ai.onReady(resolve));
        }

        const score = await this.ai.analyzeMatch(this.pendingDiscovery.originalDataURL, label);
        aiMatchBar.style.width = `${score}%`;
        aiMatchScore.innerText = `${score}%`;
      } catch (e) {
        aiMatchScore.innerText = e.message || 'Err';
        console.error("Analysis error:", e);
      } finally {
        analyzeBtn.innerText = t('analyzeMatch');
        analyzeBtn.disabled = false;
      }
    };

    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') saveBtn.click();
    };
  }

  openDiscoveryModal(rect, isTutorial = false) {
    const modal = document.getElementById('discovery-modal');
    const nameInput = document.getElementById('discovery-name');
    const header = modal.querySelector('.modal-header h2');

    // Capture Original Render & Pixel Data
    const originalDataURL = this.engine.getRegionDataURL(rect.x, rect.y, rect.width, rect.height);
    const pixelData = this.engine.getPixelData(rect.x, rect.y, rect.width, rect.height);

    this.pendingDiscovery = {
      rect,
      pixelData,
      originalDataURL,
      rotation: 0,
      threshold: 0.5
    };

    this.updateModalViews();

    // Reset Input
    nameInput.value = isTutorial ? t('yourDiscovery') : '';
    modal.style.display = 'flex';
    nameInput.focus();

    // Reset Header
    header.innerText = t('newDiscovery');

    // Auto-close and Countdown if tutorial
    if (isTutorial) {
      let count = 3;
      header.innerText = `${t('demoWillClose')} ${count}...`;

      const countdown = setInterval(() => {
        count--;
        if (count > 0) {
          header.innerText = `${t('demoWillClose')} ${count}...`;
        } else {
          clearInterval(countdown);
        }
      }, 1000);

      this.tutorialTimeout = setTimeout(() => {
        if (modal.style.display === 'flex') {
          modal.style.display = 'none';
          this.pendingDiscovery = null;
        }
        clearInterval(countdown);
      }, 3000);
    }
  }

  updateModalViews() {
    if (!this.pendingDiscovery) return;
    const { originalDataURL, pixelData, rect, rotation, threshold } = this.pendingDiscovery;
    const originalView = document.getElementById('original-view');
    const contourPreview = document.getElementById('contour-preview');

    // Update Original View (CSS Rotation)
    originalView.innerHTML = `<img src="${originalDataURL}" style="transform: rotate(${-rotation}deg)" />`;

    // Update Outline View (Regenerated rotated SVG with custom threshold)
    const contourSVG = generateDiscoverySVG(pixelData, 'preview', rect.width, rect.height, rotation, threshold);
    contourPreview.innerHTML = contourSVG;
    contourPreview.className = 'view-canvas'; // Ensure class is maintained
  }

  saveDiscovery(label) {
    if (!this.pendingDiscovery) return;
    const { rect, pixelData, rotation, threshold, originalDataURL } = this.pendingDiscovery;

    // Generate the final contour SVG for the composite
    const contourSVG = generateDiscoverySVG(pixelData, label, rect.width, rect.height, rotation, threshold);

    // Generate the A4 Report
    this.downloadDiscoveryReport(originalDataURL, contourSVG, label, rotation);

    this.pendingDiscovery = null;
  }

  printDiscovery(label) {
    if (!this.pendingDiscovery) return;
    const { rect, pixelData, rotation, threshold, originalDataURL } = this.pendingDiscovery;

    // Generate the final contour SVG for the composite
    const contourSVG = generateDiscoverySVG(pixelData, label, rect.width, rect.height, rotation, threshold);

    // Print the A4 Report directly
    this.printDiscoveryReport(originalDataURL, contourSVG, label, rotation);

    this.pendingDiscovery = null;
  }

  async printDiscoveryReport(originalURL, contourSVG, label, rotation) {
    // A4 Landscape at 300 DPI
    const W = 3508;
    const H = 2480;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 1. Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // 2. Load Images
    const [imgOriginal, imgContour] = await Promise.all([
      this.loadImage(originalURL),
      this.loadSVGImage(contourSVG)
    ]);

    // 3. Layout Calculations
    const margin = 200;
    const innerW = W - margin * 2;
    const innerH = H - margin * 3; // Extra space for text at bottom
    const boxW = (innerW - 100) / 2;
    const boxH = innerH;

    // 4. Draw Original (Left)
    ctx.save();
    const centerX = margin + boxW / 2;
    const centerY = margin + boxH / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    const scaleO = Math.min(boxW / imgOriginal.width, boxH / imgOriginal.height);
    const dwo = imgOriginal.width * scaleO;
    const dho = imgOriginal.height * scaleO;
    ctx.drawImage(imgOriginal, -dwo / 2, -dho / 2, dwo, dho);
    ctx.restore();

    // 5. Draw Contour (Right)
    const contourX = margin + boxW + 100;
    const scaleC = Math.min(boxW / imgContour.width, boxH / imgContour.height);
    const dwc = imgContour.width * scaleC;
    const dhc = imgContour.height * scaleC;
    ctx.drawImage(imgContour, contourX + (boxW - dwc) / 2, margin + (boxH - dhc) / 2, dwc, dhc);

    // 6. Draw Label (Bottom Center)
    ctx.fillStyle = '#03486B';
    ctx.font = 'bold 80px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label.toUpperCase(), W / 2, H - 150);

    // 7. Print
    const dataURL = canvas.toDataURL('image/png');
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print - ${label}</title>
          <style>
            @page {
              size: landscape;
              margin: 0;
            }
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background: white;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${dataURL}" />
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 100);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();

    // Clean up
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 10000);
  }

  async downloadDiscoveryReport(originalURL, contourSVG, label, rotation) {
    // A4 Landscape at 300 DPI
    const W = 3508;
    const H = 2480;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 1. Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // 2. Load Images
    const [imgOriginal, imgContour] = await Promise.all([
      this.loadImage(originalURL),
      this.loadSVGImage(contourSVG)
    ]);

    // 3. Layout Calculations
    const margin = 200;
    const innerW = W - margin * 2;
    const innerH = H - margin * 3; // Extra space for text at bottom
    const boxW = (innerW - 100) / 2;
    const boxH = innerH;

    // 4. Draw Original (Left)
    ctx.save();
    const centerX = margin + boxW / 2;
    const centerY = margin + boxH / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    const scaleO = Math.min(boxW / imgOriginal.width, boxH / imgOriginal.height);
    const dwo = imgOriginal.width * scaleO;
    const dho = imgOriginal.height * scaleO;
    ctx.drawImage(imgOriginal, -dwo / 2, -dho / 2, dwo, dho);
    ctx.restore();

    // 5. Draw Contour (Right)
    const contourX = margin + boxW + 100;
    const scaleC = Math.min(boxW / imgContour.width, boxH / imgContour.height);
    const dwc = imgContour.width * scaleC;
    const dhc = imgContour.height * scaleC;
    ctx.drawImage(imgContour, contourX + (boxW - dwc) / 2, margin + (boxH - dhc) / 2, dwc, dhc);

    // 6. Draw Label (Bottom Center)
    ctx.fillStyle = '#03486B';
    ctx.font = 'bold 80px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label.toUpperCase(), W / 2, H - 150);

    // 7. Download
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const safeLabel = label.toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.href = dataURL;
    link.download = `discovery-report-${safeLabel}.png`;
    link.click();
  }

  loadImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = url;
    });
  }

  loadSVGImage(svgString) {
    return new Promise((resolve) => {
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.src = url;
    });
  }

  runTutorial() {
    if (this.tutorialTimeout) clearTimeout(this.tutorialTimeout);
    const group = document.getElementById('tutorial-group');
    const cursor = document.getElementById('ghost-cursor');
    const rect = document.getElementById('ghost-rect');

    group.style.opacity = '1';

    // 1. Center the demo in the viewport
    const endW = 240;
    const endH = 240;
    const svg = document.getElementById('annotation-svg');
    const svgW = svg.clientWidth;
    const svgH = svg.clientHeight;

    const startX = (svgW - endW) / 2;
    const startY = (svgH - endH) / 2;

    cursor.setAttribute('cx', startX);
    cursor.setAttribute('cy', startY);
    rect.setAttribute('x', startX);
    rect.setAttribute('y', startY);
    rect.setAttribute('width', 0);
    rect.setAttribute('height', 0);

    // Sequence
    setTimeout(() => {
      // 2. Pulse (Click)
      cursor.style.transform = 'scale(1.3)';

      setTimeout(() => {
        // 3. Drag to bottom-right precisely
        let startTime = null;
        const duration = 1500;

        const animateDrag = (time) => {
          if (!startTime) startTime = time;
          const progress = Math.min((time - startTime) / duration, 1.0);

          const currentW = endW * progress;
          const currentH = endH * progress;

          rect.setAttribute('width', currentW);
          rect.setAttribute('height', currentH);

          // Force exact bottom-right alignment
          const targetX = startX + currentW;
          const targetY = startY + currentH;
          cursor.setAttribute('cx', targetX);
          cursor.setAttribute('cy', targetY);

          if (progress < 1.0) {
            requestAnimationFrame(animateDrag);
          } else {
            // 4. Finish
            setTimeout(() => {
              group.style.opacity = '0';
              cursor.style.transform = 'scale(1)';
              this.openDiscoveryModal({ x: startX, y: startY, width: endW, height: endH }, true);
            }, 400);
          }
        };
        requestAnimationFrame(animateDrag);
      }, 400);
    }, 500);
  }

  syncUI() {
    this.syncSliders();

    const runPauseSvg = document.getElementById('run-pause-svg');
    if (runPauseSvg) {
      if (this.state.running) {
        runPauseSvg.innerHTML = `
          <rect x="6" y="4" width="4" height="16" fill="currentColor"></rect>
          <rect x="14" y="4" width="4" height="16" fill="currentColor"></rect>
        `;
      } else {
        runPauseSvg.innerHTML = `
          <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
        `;
      }
    }

    const nightModeToggle = document.getElementById('night-mode-toggle');
    if (nightModeToggle) {
      nightModeToggle.checked = this.state.nightMode;
    }

    if (this.state.nightMode) {
      document.body.classList.add('night-mode');
    } else {
      document.body.classList.remove('night-mode');
    }
    
    const windFlowBtn = document.getElementById('wind-flow');
    if (windFlowBtn) {
      windFlowBtn.style.opacity = this.state.bottomPerspective ? '1' : '1';
    }
  }

  showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}
