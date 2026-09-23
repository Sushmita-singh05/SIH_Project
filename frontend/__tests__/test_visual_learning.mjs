import { spawn } from 'child_process';
import puppeteer from 'puppeteer';

async function runTests() {
  console.log('--- Starting Vite Preview Server ---');
  const server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: 'c:\\Users\\sushm\\OneDrive\\Desktop\\Quantum_sih\\frontend',
    shell: true,
    stdio: 'pipe'
  });

  server.stdout.on('data', (d) => console.log('[Server stdout]:', d.toString().trim()));
  server.stderr.on('data', (d) => console.log('[Server stderr]:', d.toString().trim()));

  // Wait for preview server to be available
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://localhost:4173/');
      if (res.ok) {
        ready = true;
        break;
      }
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!ready) {
    console.error('Preview server failed to start within timeout.');
    server.kill();
    process.exit(1);
  }

  console.log('Preview server ready at http://localhost:4173/');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push('CONSOLE: ' + msg.text());
    }
  });
  page.on('pageerror', (err) => errors.push('PAGE: ' + err.toString()));

  const routes = [
    '/',
    '/lesson',
    '/circuit-builder',
    '/simulation-output',
    '/ai-tutor',
    '/challenge',
    '/progress',
    '/video-learning'
  ];

  console.log('\n--- Verifying All Core Routes ---');
  for (const r of routes) {
    await page.goto('http://localhost:4173' + r, { waitUntil: 'networkidle0' });
    const hasHeader = await page.evaluate(() => !!document.querySelector('.top-header, .header-title-group'));
    const headingText = await page.evaluate(() => document.querySelector('h1, h2')?.textContent?.trim() || '');
    console.log(`ROUTE: ${r.padEnd(20)} | HEADER: ${hasHeader ? 'PASS' : 'FAIL'} | TITLE: "${headingText}"`);
  }

  console.log('\n--- Deep Testing AI Visual Learning Page ---');
  await page.goto('http://localhost:4173/video-learning', { waitUntil: 'networkidle0' });

  // 1. Verify Nav label in Sidebar
  const navText = await page.evaluate(() => {
    const activeNav = document.querySelector('a[href="/video-learning"]');
    return activeNav ? activeNav.textContent.trim() : null;
  });
  console.log(`Sidebar Nav Label: "${navText}" -> ${navText === 'AI Visual Learning' ? 'PASS' : 'FAIL'}`);

  // 2. Verify Empty Input Validation
  console.log('Testing empty input validation...');
  await page.click('button.vl-generate-btn');
  await new Promise((r) => setTimeout(r, 200));

  const errorText = await page.evaluate(() => {
    return document.querySelector('.vl-validation-error span')?.textContent?.trim();
  });
  console.log(`Validation Error Message: "${errorText}" -> ${errorText === 'Please enter a quantum topic or some learning material.' ? 'PASS' : 'FAIL'}`);

  // 3. Click an example prompt pill
  console.log('Testing example prompt selection...');
  await page.click('.vl-prompt-pill');
  await new Promise((r) => setTimeout(r, 200));
  const inputValue = await page.evaluate(() => document.querySelector('#quantumTopicInput')?.value);
  console.log(`Textarea populated with: "${inputValue}"`);

  // 4. Trigger Visual Explanation Generation
  console.log('Triggering generation...');
  await page.click('button.vl-generate-btn');

  // Verify progress states
  await new Promise((r) => setTimeout(r, 700));
  const isGeneratingVisible = await page.evaluate(() => !!document.querySelector('.vl-generation-card'));
  console.log(`Generation progress UI visible: ${isGeneratingVisible ? 'PASS' : 'FAIL'}`);

  // Wait for generation to complete (approx 2.6s)
  console.log('Waiting for generation completion...');
  await page.waitForSelector('.vl-viewer-card', { timeout: 10000 });
  console.log('Interactive Scene Viewer displayed successfully! -> PASS');

  // 5. Inspect Scene 1
  const scene1Info = await page.evaluate(() => {
    return {
      counter: document.querySelector('.vl-scene-badge')?.textContent?.trim(),
      type: document.querySelector('.vl-scene-type-tag')?.textContent?.trim(),
      title: document.querySelector('.vl-scene-title')?.textContent?.trim(),
      explanation: document.querySelector('.vl-explanation-text')?.textContent?.trim()
    };
  });
  console.log('Scene 1 Info:', scene1Info);

  // 6. Test Next Scene Navigation
  console.log('Navigating to next scene...');
  const nextBtn = await page.$('.vl-player-controls .btn-primary');
  await nextBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  const scene2Info = await page.evaluate(() => {
    return {
      counter: document.querySelector('.vl-scene-badge')?.textContent?.trim(),
      type: document.querySelector('.vl-scene-type-tag')?.textContent?.trim(),
      title: document.querySelector('.vl-scene-title')?.textContent?.trim()
    };
  });
  console.log('Scene 2 Info:', scene2Info);

  // 7. Navigate to Scene 3 (Circuit Scene)
  await nextBtn.click();
  await new Promise((r) => setTimeout(r, 200));

  const scene3Info = await page.evaluate(() => {
    return {
      counter: document.querySelector('.vl-scene-badge')?.textContent?.trim(),
      type: document.querySelector('.vl-scene-type-tag')?.textContent?.trim(),
      title: document.querySelector('.vl-scene-title')?.textContent?.trim(),
      hasCircuit: !!document.querySelector('.vl-circuit-schematic'),
      circuitText: document.querySelector('.vl-circuit-ascii')?.textContent?.trim()
    };
  });
  console.log('Scene 3 Info (Quantum Circuit):', scene3Info);

  // 8. Verify Ask AI Tutor section
  const tutorInfo = await page.evaluate(() => {
    return {
      heading: document.querySelector('.vl-tutor-heading')?.textContent?.trim(),
      tags: Array.from(document.querySelectorAll('.vl-ctx-tag')).map((el) => el.textContent.trim())
    };
  });
  console.log('Ask AI Tutor Info:', tutorInfo);

  // 9. Save Screenshot
  await page.screenshot({ path: 'c:\\Users\\sushm\\OneDrive\\Desktop\\Quantum_sih\\docs\\screenshots\\verified_ai_visual_learning.png', fullPage: true });
  console.log('Saved screenshot to docs/screenshots/verified_ai_visual_learning.png');

  console.log('\nTOTAL RUNTIME ERRORS:', errors.length);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }

  await browser.close();
  server.kill();
  console.log('--- Verification Complete ---');
}

runTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
