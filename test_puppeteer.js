const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => {
    console.log(`[PAGE ${msg.type().toUpperCase()}]:`, msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  await page.goto('http://localhost:8000');
  
  // Wait for initial load
  await new Promise(r => setTimeout(r, 2000));
  
  // Open settings
  await page.click('#settings-btn');
  await new Promise(r => setTimeout(r, 500));
  
  // Toggle night mode programmatically in the page context
  await page.evaluate(() => {
    const toggle = document.getElementById('night-mode-toggle');
    toggle.click(); // Trigger change event
  });
  
  await new Promise(r => setTimeout(r, 500));
  await page.click('#settings-close');
  
  // Wait for rendering to update
  await new Promise(r => setTimeout(r, 3000));
  
  // Save night screenshot
  await page.screenshot({ path: '/Users/petrslobodzian/.gemini/antigravity/brain/526f8efa-b940-4f30-bae6-7cffe1649d49/screenshot_night.png' });
  console.log('Night screenshot saved to artifacts directory.');
  
  await browser.close();
})();
