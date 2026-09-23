/**
 * End-to-end E2E test for Simulation-Based Challenge Evaluation.
 *
 * Prerequisites:
 *   - FastAPI backend running on http://127.0.0.1:8010
 *   - Vite dev server running on http://localhost:5173
 *
 * Covers:
 *   TEST 1 — Correct Bell State (H + CNOT) -> passed, high score
 *   TEST 2 — Only H                        -> failed
 *   Empty circuit                          -> friendly failure
 *   TEST 4 — Browser refresh               -> progress persists
 *   TEST 5 — Dashboard / Progress counters -> updated
 *   Smoke  — Dashboard, Lesson, Circuit Builder, Simulation Output,
 *            AI Tutor, Progress, Video Learning render without crashing
 *
 * Run:  node scripts/e2e-challenge.mjs
 */
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5173';
const results = [];

function check(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
page.setDefaultTimeout(15000);

const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

/** Click the first element whose trimmed textContent matches `text`. */
async function clickByText(text, selector = 'button') {
  const clicked = await page.evaluate(
    (sel, txt) => {
      const els = [...document.querySelectorAll(sel)];
      const el = els.find((e) => e.textContent.trim().includes(txt));
      if (!el) return false;
      el.click();
      return true;
    },
    selector,
    text
  );
  if (!clicked) throw new Error(`Element not found: ${selector} containing "${text}"`);
}

async function bodyIncludes(text) {
  return page.evaluate(
    (t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()),
    text
  );
}

async function waitForText(text) {
  await page.waitForFunction(
    (t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()),
    { timeout: 20000 },
    text
  );
}

try {
  // ── Fresh start ────────────────────────────────────────────────
  await page.goto(`${BASE}/challenge`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  check('Challenge page loads', await bodyIncludes('Bell State'));

  // ── Empty circuit submission ──────────────────────────────────
  await clickByText('Verify Circuit Check');
  await waitForText('Circuit Incomplete');
  check('Empty circuit -> friendly failure, score 0',
    (await bodyIncludes('Score: 0/100')) && (await bodyIncludes('empty')));

  // ── TEST 2: only H ────────────────────────────────────────────
  await page.evaluate(() => {
    // q0, slot 0 — the first gate cell of the first wire
    const cells = [...document.querySelectorAll('div')].filter(
      (d) => d.textContent.trim() === '+' && d.style.width === '48px'
    );
    cells[0].click();
  });
  await clickByText('Verify Circuit Check');
  await waitForText('Your Output');
  check('TEST 2: H only -> not passed',
    (await bodyIncludes('Status: Failed')) && (await bodyIncludes('Score')));

  // ── TEST 3: incorrect circuit (X + CNOT → |11> only) ──────────
  await clickByText('Clear');
  await clickByText('X', 'button');           // select X gate
  await page.evaluate(() => {
    const cells = [...document.querySelectorAll('div')].filter(
      (d) => d.textContent.trim() === '+' && d.style.width === '48px'
    );
    cells[0].click(); // place X on q0 slot 0
  });
  await clickByText('CNOT', 'button');        // select CNOT gate
  await page.evaluate(() => {
    const cells = [...document.querySelectorAll('div')].filter(
      (d) => d.textContent.trim() === '+' && d.style.width === '48px'
    );
    cells[0].click(); // place CNOT marker on q0 slot 1 (cells[0] = first empty slot)
  });
  await clickByText('Verify Circuit Check');
  await waitForText('Status:');
  const t3Card = await page.evaluate(() => document.body.innerText);
  check('TEST 3: incorrect circuit -> failed or low score',
    /Status:\s*Failed/i.test(t3Card) || (() => {
      const m = t3Card.match(/Score:\s*(\d+)\/100/);
      return m && parseInt(m[1], 10) < 80;
    })());

  // ── TEST 1: correct Bell State (auto-placed H + CNOT) ─────────
  await clickByText('Auto-place Solution');
  await clickByText('Verify Circuit Check');
  await waitForText('Status: Passed');
  const resultCard = await page.evaluate(() => document.body.innerText);
  const lcCard = resultCard.toLowerCase();
  const scoreMatch = resultCard.match(/Score:\s*(\d+)\/100/);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : -1;

  check('TEST 1: H+CNOT -> passed', true, `score=${score}`);
  check('TEST 1: high score (>=80)', score >= 80, `score=${score}`);
  check('Result shows Expected Output', lcCard.includes('expected output'));
  check('Result shows Your Output', lcCard.includes('your output'));
  check('Result shows Feedback', lcCard.includes('feedback'));
  check('Result shows dynamic percentages', /\|00⟩\s*≈\s*\d+%/.test(resultCard));

  // ── Challenge → AI Tutor context handoff ───────────────────────
  await clickByText('Need a Hint?', 'button');
  await page.waitForFunction(() => window.location.pathname === '/ai-tutor', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1200));
  const tutorCtx = await page.evaluate(() => localStorage.getItem('ql_tutor_context'));
  const parsedCtx = tutorCtx ? JSON.parse(tutorCtx) : {};
  check('AI Tutor receives challenge evaluation context',
    parsedCtx.screen === 'challenge'
      && !!parsedCtx.evaluationResult
      && typeof parsedCtx.score === 'number'
      && typeof parsedCtx.passed === 'boolean'
      && !!parsedCtx.evaluationResult.expected
      && !!parsedCtx.evaluationResult.actual,
    `screen=${parsedCtx.screen} score=${parsedCtx.score} passed=${parsedCtx.passed}`);

  await page.goto(`${BASE}/challenge`, { waitUntil: 'domcontentloaded' });

  // ── TEST 5: Progress page counters ────────────────────────────
  await page.goto(`${BASE}/progress`, { waitUntil: 'domcontentloaded' });
  await waitForText('Progress');
  const progressText = await page.evaluate(() => document.body.innerText);
  check('TEST 5: Progress shows 1/3 challenges', /1\s*\/\s*3/.test(progressText));
  check('TEST 5: Progress shows activity entry',
    progressText.includes('Bell State Generation') || progressText.toLowerCase().includes('passed'));

  // ── TEST 5: Dashboard counters ────────────────────────────────
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  const dashText = await page.evaluate(() => document.body.innerText);
  check('TEST 5: Dashboard shows 1/3 challenges', /1\s*\/\s*3/.test(dashText));

  // ── TEST 4: refresh -> progress persists ──────────────────────
  await page.goto(`${BASE}/progress`, { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const afterReload = await page.evaluate(() => document.body.innerText);
  check('TEST 4: progress persists after refresh', /1\s*\/\s*3/.test(afterReload));

  // Multiple submissions must not create duplicate challenge records
  const lcRaw = await page.evaluate(() => localStorage.getItem('quantumLeapLearningContext'));
  const lcCtx = lcRaw ? JSON.parse(lcRaw) : {};
  const chRecords = Array.isArray(lcCtx.challengeResults) ? lcCtx.challengeResults : [];
  check('No duplicate challenge records from repeated submissions',
    chRecords.length === 1 && chRecords[0].id === 'bell-state' && chRecords[0].passed === true,
    `records=${chRecords.length} passed=${chRecords[0]?.passed} score=${chRecords[0]?.score}`);

  // ── Smoke: every route renders ────────────────────────────────
  const routes = [
    ['/', 'Dashboard'],
    ['/lesson', 'Lesson'],
    ['/circuit-builder', 'Circuit'],
    ['/simulation-output', 'Simulation'],
    ['/ai-tutor', 'Tutor'],
    ['/challenge', 'Challenge'],
    ['/progress', 'Progress'],
    ['/video-learning', 'Video'],
  ];
  for (const [route, label] of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 800));
    const len = await page.evaluate(() => document.body.innerText.trim().length);
    check(`Smoke: ${label} renders`, len > 100, `textLen=${len}`);
  }

  check('No uncaught page errors', pageErrors.length === 0,
    pageErrors.slice(0, 3).join(' | '));
} catch (err) {
  check('E2E script completed', false, err.message);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
