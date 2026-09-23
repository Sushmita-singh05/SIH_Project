/** Debug challenge → progress after a real submit */
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5173';
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
page.setDefaultTimeout(15000);

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await new Promise((r) => setTimeout(r, 500));

// Lesson quiz correct
await page.goto(`${BASE}/lesson`, { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => {
  const labels = [...document.querySelectorAll('label')];
  const b = labels.find((l) => l.textContent.includes('50%'));
  if (b) b.click();
});
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Check Answer')); if (b) b.click(); });
await new Promise((r) => setTimeout(r, 900));

// Circuit builder: H + CNOT
await page.goto(`${BASE}/circuit-builder`, { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const h = btns.find((b) => b.textContent.trim() === 'H');
  if (h) h.click();
});
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => {
  const cells = [...document.querySelectorAll('div')].filter((d) => d.textContent.trim() === '+' && d.style.width === '48px');
  if (cells[0]) cells[0].click();
});
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const c = btns.find((b) => b.textContent.trim() === 'CNOT');
  if (c) c.click();
});
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => {
  const cells = [...document.querySelectorAll('div')].filter((d) => d.textContent.trim() === '+' && d.style.width === '48px');
  if (cells[0]) cells[0].click();
});
await new Promise((r) => setTimeout(r, 400));

// Simulate
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Simulate') && !x.textContent.includes('Inspect')); if (b) b.click(); });
await new Promise((r) => setTimeout(r, 4000));

// Challenge
await page.goto(`${BASE}/challenge`, { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 700));
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Auto-place Solution'));
  if (b) b.click();
});
await new Promise((r) => setTimeout(r, 500));
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Verify Circuit Check'));
  if (b) b.click();
});
await new Promise((r) => setTimeout(r, 4500));

const chText = await page.evaluate(() => document.body.innerText);
console.log('CHALLENGE:');
console.log('passed:', /Status:\s*Passed/i.test(chText), '| score:', chText.match(/Score:\s*(\d+)\/100/));
console.log(chText.slice(0, 500));

// Click "View Updated Progress"
const navigated = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Updated Progress'));
  if (b) { b.click(); return 'clicked'; }
  return 'not-found';
});
console.log('progress nav:', navigated);
await new Promise((r) => setTimeout(r, 1800));

const prText = await page.evaluate(() => document.body.innerText);
console.log('\nPROGRESS PAGE:');
console.log('has 1/3:', /1\s*\/\s*3/.test(prText));
const match = prText.match(/Challenges Passed:[^\n]*/);
console.log('challengesPassed text:', match ? match[0] : 'not found');
console.log(prText.slice(0, 700));

const ctx = JSON.parse(await page.evaluate(() => localStorage.getItem('quantumLeapLearningContext') || '{}'));
console.log('\nlocalStorage challengeResults:', ctx.challengeResults);
console.log('conceptMastery:', ctx.conceptMastery);

await browser.close();
