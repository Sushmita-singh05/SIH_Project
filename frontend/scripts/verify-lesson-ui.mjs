import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5174';
const failures = [];

function check(name, cond, detail = '') {
  if (!cond) failures.push(name);
  console.log(`${cond ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
page.setDefaultTimeout(15000);
await page.setViewport({ width: 1280, height: 800 });

try {
  console.log('--- 1. Testing Lesson Page Load ---');
  await page.goto(`${BASE}/lesson`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  // Check Title
  const title = await page.$eval('.lesson-heading', el => el.textContent.trim());
  check('Lesson title rendered', title.includes('Superposition & The Hadamard Gate'), title);

  // Check Progress bar
  const progressPct = await page.$eval('.lesson-progress-pct', el => el.textContent.trim());
  check('Progress percentage rendered', progressPct.includes('%'), progressPct);

  // Check Concept Cards count (2 main cards)
  const conceptTitles = await page.$$eval('.concept-title', els => els.map(e => e.textContent.trim()));
  check('Concept cards rendered', conceptTitles.length === 2, conceptTitles.join(', '));

  // Check Sidebar cards
  const asideTitles = await page.$$eval('.aside-card-title, .ai-tutor-title', els => els.map(e => e.textContent.trim()));
  check('Sidebar cards rendered', asideTitles.some(t => t.includes('Learning Objectives')) && asideTitles.some(t => t.includes('AI Tutor')), asideTitles.join(', '));

  await page.screenshot({ path: 'frontend/lesson_improved_preview.png' });
  await page.screenshot({ path: 'frontend/lesson_full_preview.png', fullPage: true });
  console.log('📸 Screenshots saved');

  console.log('\n--- 2. Testing Quiz Interaction & Evaluation ---');
  // Select option B (50%)
  const optionBtns = await page.$$('.quiz-option.compact');
  check('Quiz has 4 options', optionBtns.length === 4);

  // Click Option B
  await optionBtns[1].click();
  await new Promise(r => setTimeout(r, 300));

  // Verify option is selected
  const isSelected = await page.$eval('.quiz-option.compact:nth-child(2)', el => el.classList.contains('selected'));
  check('Option B has selected class', isSelected);

  // Submit Answer
  await page.click('#quizSubmitBtn');
  await new Promise(r => setTimeout(r, 800));

  // Check Feedback
  const feedbackText = await page.$eval('.quiz-feedback', el => el.textContent.trim());
  check('Quiz gives correct feedback', feedbackText.includes('Correct'), feedbackText);

  // Check updated Progress to 100%
  const updatedProgress = await page.$eval('.lesson-progress-pct', el => el.textContent.trim());
  check('Progress updated after quiz completion', updatedProgress === '100%', updatedProgress);

  console.log('\n--- 3. Testing Lesson Completion on Next Lesson ---');
  // Click Next Lesson
  await page.click('#startBuildingBtn');
  await new Promise(r => setTimeout(r, 1000));
  const currentUrl = page.url();
  check('Next Lesson navigated to Circuit Builder', currentUrl.includes('/circuit-builder'), currentUrl);

  // Check localStorage for lesson completion
  const contextState = JSON.parse(await page.evaluate(() => localStorage.getItem('quantumLeapLearningContext') || '{}'));
  const completedLessons = contextState.lessonsCompleted || contextState.progress?.lessonsCompleted || [];
  check('Lesson completion recorded in LearningContext', completedLessons.includes('superposition'), JSON.stringify(completedLessons));

  console.log('\n--- 4. Testing AI Tutor Context Passing ---');
  await page.goto(`${BASE}/lesson`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 800));

  // Click in-page "Ask AI Tutor"
  await page.click('.ai-tutor-btn');
  await new Promise(r => setTimeout(r, 1000));

  const tutorUrl = page.url();
  check('AI Tutor navigated to /ai-tutor', tutorUrl.includes('/ai-tutor'), tutorUrl);

  const tutorCtx = JSON.parse(await page.evaluate(() => localStorage.getItem('ql_tutor_context') || '{}'));
  check('TutorContext screen is lesson', tutorCtx.screen === 'lesson');
  check('TutorContext has lesson details', tutorCtx.lesson?.id === 'superposition');
  check('TutorContext has quizState', typeof tutorCtx.quizState === 'object');
  check('TutorContext has progress', !!tutorCtx.progress);

  console.log('\n--- Verification Summary ---');
  if (failures.length === 0) {
    console.log('🎉 ALL 12 VERIFICATION CHECKS PASSED!');
  } else {
    console.error(`FAILED CHECKS (${failures.length}):`, failures);
    process.exit(1);
  }
} catch (err) {
  console.error('Error during verification:', err);
  process.exit(1);
} finally {
  await browser.close();
}
