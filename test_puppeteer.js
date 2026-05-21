const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    // console.log('RESPONSE:', response.url(), response.status());
  });
  page.on('dialog', async dialog => {
    console.log('DIALOG:', dialog.message());
    await dialog.accept();
  });

  await page.goto('http://localhost:5173');
  
  // Wait a bit for initialization
  await new Promise(r => setTimeout(r, 2000));
  
  // Trigger error
  await page.evaluate(async () => {
    try {
      const rect = document.getElementById('canvas-container').getBoundingClientRect();
      const svg = document.getElementById('annotation-svg');
      // Fake a mousedown, mousemove, mouseup
      svg.dispatchEvent(new MouseEvent('mousedown', {clientX: rect.left + 50, clientY: rect.top + 50}));
      svg.dispatchEvent(new MouseEvent('mousemove', {clientX: rect.left + 150, clientY: rect.top + 150}));
      svg.dispatchEvent(new MouseEvent('mouseup', {clientX: rect.left + 150, clientY: rect.top + 150}));
      
      document.getElementById('discovery-name').value = "Test";
      document.getElementById('analyze-match').click();
    } catch(e) {
      console.log('EVAL ERROR:', e.message);
    }
  });
  
  await new Promise(r => setTimeout(r, 4000));

  await browser.close();
})();
