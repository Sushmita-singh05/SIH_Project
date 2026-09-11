import puppeteer from 'puppeteer';

try {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
  });
  page.on('pageerror', err => errors.push('PAGE: ' + err.toString()));

  const routes = ['/', '/lesson', '/circuit-builder', '/simulation-output', '/ai-tutor', '/challenge', '/progress'];
  
  for (const r of routes) {
    await page.goto('http://localhost:5173' + r, { waitUntil: 'networkidle0' });
    const hasHeader = await page.evaluate(() => !!document.querySelector('.top-header, .header-title-group'));
    const headingText = await page.evaluate(() => document.querySelector('h1, h2')?.textContent || '');
    console.log('ROUTE:', r.padEnd(20), '| HEADER FOUND:', hasHeader, '| TITLE:', headingText);
  }

  console.log('TOTAL RUNTIME ERRORS:', errors.length);
  if (errors.length > 0) console.log(errors);

  await page.screenshot({ path: 'verified_screen.png' });
  console.log('SCREENSHOT SAVED: verified_screen.png');

  await browser.close();
} catch (err) {
  console.error('TEST ERROR:', err);
}
