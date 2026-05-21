/**
 * Marching Squares implementation for smooth contour extraction
 */
function getMarchingSquaresPath(grid, gridSize, threshold, svgW, svgH) {
  let pathD = "";
  const cellW = svgW / (gridSize - 1);
  const cellH = svgH / (gridSize - 1);

  for (let gy = 0; gy < gridSize - 1; gy++) {
    for (let gx = 0; gx < gridSize - 1; gx++) {
      // Sample 4 corners (top-left, top-right, bottom-right, bottom-left)
      // Note: grid is stored gy * gridSize + gx
      const v0 = grid[gy * gridSize + gx];
      const v1 = grid[gy * gridSize + (gx + 1)];
      const v2 = grid[(gy + 1) * gridSize + (gx + 1)];
      const v3 = grid[(gy + 1) * gridSize + gx];

      let msIndex = 0;
      if (v0 >= threshold) msIndex |= 1;
      if (v1 >= threshold) msIndex |= 2;
      if (v2 >= threshold) msIndex |= 4;
      if (v3 >= threshold) msIndex |= 8;

      if (msIndex === 0 || msIndex === 15) continue;

      // Linear interpolation helper
      const lerp = (vA, vB, t) => (t - vA) / (vB - vA);

      // Points on edges
      const pN = { x: (gx + lerp(v0, v1, threshold)) * cellW, y: gy * cellH };
      const pE = { x: (gx + 1) * cellW, y: (gy + lerp(v1, v2, threshold)) * cellH };
      const pS = { x: (gx + lerp(v3, v2, threshold)) * cellW, y: (gy + 1) * cellH };
      const pW = { x: gx * cellW, y: (gy + lerp(v0, v3, threshold)) * cellH };

      switch (msIndex) {
        case 1: case 14: pathD += `M${pN.x},${pN.y} L${pW.x},${pW.y} `; break;
        case 2: case 13: pathD += `M${pN.x},${pN.y} L${pE.x},${pE.y} `; break;
        case 3: case 12: pathD += `M${pW.x},${pW.y} L${pE.x},${pE.y} `; break;
        case 4: case 11: pathD += `M${pS.x},${pS.y} L${pE.x},${pE.y} `; break;
        case 6: case 9:  pathD += `M${pN.x},${pN.y} L${pS.x},${pS.y} `; break;
        case 7: case 8:  pathD += `M${pW.x},${pW.y} L${pS.x},${pS.y} `; break;
        case 5:          pathD += `M${pN.x},${pN.y} L${pE.x},${pE.y} M${pS.x},${pS.y} L${pW.x},${pW.y} `; break;
        case 10:         pathD += `M${pN.x},${pN.y} L${pW.x},${pW.y} M${pE.x},${pE.y} L${pS.x},${pS.y} `; break;
      }
    }
  }
  return pathD;
}

/**
 * Generates a clean, professional discovery SVG (Black outline on white background)
 * Supports 90-degree increments of rotation.
 */
export function generateDiscoverySVG(pixelData, label, sourceW, sourceH, rotation = 0, threshold = 0.5) {
  if (!pixelData) return '';
  
  const { data, width, height } = pixelData;
  const gridSize = 48; // Higher resolution for professional output
  const cellW = width / gridSize;
  const cellH = height / gridSize;
  
  // Calculate raw grid from pixel data (sampling brightness)
  const rawGrid = new Float32Array(gridSize * gridSize);
  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      let brightness = 0;
      let count = 0;
      for (let py = Math.floor(gy * cellH); py < Math.floor((gy + 1) * cellH); py++) {
        for (let px = Math.floor(gx * cellW); px < Math.floor((gx + 1) * cellW); px++) {
          const idx = (py * width + px) * 4;
          if (idx < data.length) {
            brightness += (data[idx] + data[idx+1] + data[idx+2]) / 3;
            count++;
          }
        }
      }
      const invertedGy = gridSize - 1 - gy;
      rawGrid[invertedGy * gridSize + gx] = count > 0 ? brightness / count / 255 : 0;
    }
  }

  // Create a rotated grid based on the rotation state
  const grid = new Float32Array(gridSize * gridSize);
  const G = gridSize;
  const rot = (rotation % 360 + 360) % 360;

  for (let gy = 0; gy < G; gy++) {
    for (let gx = 0; gx < G; gx++) {
      if (rot === 90) {
        grid[gy * G + gx] = rawGrid[gx * G + (G - 1 - gy)];
      } else if (rot === 180) {
        grid[gy * G + gx] = rawGrid[(G - 1 - gy) * G + (G - 1 - gx)];
      } else if (rot === 270) {
        grid[gy * G + gx] = rawGrid[(G - 1 - gx) * G + gy];
      } else {
        grid[gy * G + gx] = rawGrid[gy * G + gx];
      }
    }
  }
  
  // Determine SVG dimensions (flip if 90 or 270)
  const isPortrait = rot === 90 || rot === 270;
  const aspectRatio = sourceH / sourceW;
  const svgW = isPortrait ? 100 * aspectRatio : 100;
  const svgH = isPortrait ? 100 : 100 * aspectRatio;

  // Generate single clean black path
  const pathData = getMarchingSquaresPath(grid, gridSize, threshold, svgW, svgH);
  
  return `
    <svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="background-color: white;">
      <path d="${pathData}" fill="none" stroke="black" stroke-width="0.4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}

/**
 * Generates an abstract SVG with professional contour detection (Deprecated for Discoveries)
 */
export function generateAbstractSVG(pixelData, label, sourceW, sourceH) {
  // Keeping this for potential legacy use, but discoveries now use generateDiscoverySVG
  return generateDiscoverySVG(pixelData, label, sourceW, sourceH, 0);
}

