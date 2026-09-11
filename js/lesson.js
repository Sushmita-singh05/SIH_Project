/**
 * lesson.js — Lesson View interactions
 * QuantumLeap-AI — Superposition Lesson
 *
 * Handles:
 *  - Mini quiz logic (selection, validation, feedback, retry)
 *  - Probability bar entrance animation via IntersectionObserver
 *  - AI Tutor "Learn More" button → placeholder
 *  - Next Activity button → placeholder
 *  - Unbuilt nav routes → placeholder
 */

'use strict';

(function LessonModule() {

  // ============================================================
  // MINI QUIZ
  // ============================================================
  const CORRECT_ANSWER = 'C'; // 50% — after Hadamard on |0⟩

  const quizOptions   = document.querySelectorAll('.quiz-option');
  const submitBtn     = document.getElementById('quizSubmitBtn');
  const retryBtn      = document.getElementById('quizRetryBtn');
  const feedbackEl    = document.getElementById('quizFeedback');

  let selectedValue = null;
  let answered      = false;

  /** Select an option */
  function selectOption(value) {
    if (answered) return;
    selectedValue = value;
    quizOptions.forEach((opt) => {
      const isSelected = opt.dataset.value === value;
      opt.classList.toggle('selected', isSelected);
      opt.setAttribute('aria-checked', String(isSelected));
    });
    if (submitBtn) submitBtn.disabled = false;
  }

  /** Submit the quiz */
  function submitQuiz() {
    if (!selectedValue || answered) return;
    answered = true;

    const isCorrect = selectedValue === CORRECT_ANSWER;

    // Style all options
    quizOptions.forEach((opt) => {
      opt.disabled = true;
      const val = opt.dataset.value;
      if (val === CORRECT_ANSWER) {
        opt.classList.add('correct');
        opt.classList.remove('selected');
      } else if (val === selectedValue && !isCorrect) {
        opt.classList.add('incorrect');
        opt.classList.remove('selected');
      } else {
        opt.classList.remove('selected');
      }
    });

    // Show feedback
    if (feedbackEl) {
      feedbackEl.innerHTML = isCorrect
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Correct! The Hadamard gate creates an equal superposition — 50% probability for each outcome.`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Not quite. Review the visual explanation above and try again.`;
      feedbackEl.className = `quiz-feedback visible ${isCorrect ? 'correct-feedback' : 'incorrect-feedback'}`;
      feedbackEl.setAttribute('aria-hidden', 'false');
    }

    // Toggle button visibility
    if (submitBtn) submitBtn.style.display = 'none';
    if (retryBtn)  retryBtn.style.display  = isCorrect ? 'none' : '';
  }

  /** Reset the quiz */
  function resetQuiz() {
    answered      = false;
    selectedValue = null;

    quizOptions.forEach((opt) => {
      opt.disabled = false;
      opt.classList.remove('selected', 'correct', 'incorrect');
      opt.setAttribute('aria-checked', 'false');
    });

    if (feedbackEl) {
      feedbackEl.className = 'quiz-feedback';
      feedbackEl.textContent = '';
      feedbackEl.setAttribute('aria-hidden', 'true');
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.display = '';
    }
    if (retryBtn) retryBtn.style.display = 'none';
  }

  // Wire quiz option clicks
  quizOptions.forEach((opt) => {
    opt.addEventListener('click', () => selectOption(opt.dataset.value));
    // Keyboard: Space/Enter to select
    opt.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        selectOption(opt.dataset.value);
      }
    });
  });

  if (submitBtn) submitBtn.addEventListener('click', submitQuiz);
  if (retryBtn)  retryBtn.addEventListener('click',  resetQuiz);

  // ============================================================
  // PROBABILITY BARS — animate on scroll into view
  // ============================================================
  function animateProbBars() {
    const fills = document.querySelectorAll('.prob-fill');
    fills.forEach((fill) => {
      const target = fill.style.width;
      fill.style.width = '0';
      void fill.offsetWidth; // force reflow
      fill.style.transition = 'width 900ms cubic-bezier(0.4, 0, 0.2, 1)';
      fill.style.width = target;
    });
  }

  const probSection = document.querySelector('.prob-panel');
  if (probSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateProbBars();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(probSection);
  } else if (probSection) {
    animateProbBars();
  }

  // Also animate lesson progress bar
  const lessonFill = document.querySelector('.lesson-progress-fill');
  if (lessonFill) {
    const target = lessonFill.style.width;
    lessonFill.style.width = '0';
    void lessonFill.offsetWidth;
    lessonFill.style.transition = 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)';
    lessonFill.style.width = target;
  }

  // ============================================================
  // PLACEHOLDER (unbuilt routes)
  // ============================================================
  const routePlaceholder = document.getElementById('routePlaceholder');
  const placeholderClose = document.getElementById('placeholderClose');

  function showPlaceholder() {
    if (!routePlaceholder) return;
    routePlaceholder.classList.add('visible');
    routePlaceholder.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    placeholderClose && placeholderClose.focus();
  }

  function hidePlaceholder() {
    if (!routePlaceholder) return;
    routePlaceholder.classList.remove('visible');
    routePlaceholder.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (placeholderClose) placeholderClose.addEventListener('click', hidePlaceholder);
  if (routePlaceholder) {
    routePlaceholder.addEventListener('click', (e) => {
      if (e.target === routePlaceholder) hidePlaceholder();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && routePlaceholder && routePlaceholder.classList.contains('visible')) {
      hidePlaceholder();
    }
  });

  // Wire unbuilt CTA buttons to placeholder
  const aiTutorMoreBtn   = document.getElementById('aiTutorMoreBtn');
  // NOTE: startBuildingBtn is intentionally NOT listed here.
  // circuit-builder.html is a real page — its <a href="circuit-builder.html">
  // navigates directly; no interception needed.

  if (aiTutorMoreBtn) {
    aiTutorMoreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showPlaceholder();
    });
  }


  // ---- Sidebar nav routing on lesson page ----
  // Real pages navigate; unbuilt routes show placeholder
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const route = link.dataset.route;
      // dashboard → navigate to index.html (browser handles href)
      if (route === 'dashboard') return;
      // learn → already on this page, do nothing
      if (route === 'learn') { e.preventDefault(); return; }
      // practice → circuit-builder.html is built, allow navigation
      if (route === 'practice') return;
      // progress → progress.html is built, allow navigation
      if (route === 'progress') return;
      // All others (settings, help) → placeholder
      e.preventDefault();
      showPlaceholder();
    });
  });


  // ============================================================
  // JOURNEY STAGE HOVER
  // ============================================================
  document.querySelectorAll('.journey-stage').forEach((stage) => {
    const icon = stage.querySelector('.journey-icon-wrap');
    if (!icon) return;
    stage.addEventListener('mouseenter', () => { icon.style.transform = 'scale(1.08)'; });
    stage.addEventListener('mouseleave', () => { icon.style.transform = ''; });
  });

  // ============================================================
  // CONCEPT CARD HOVER ICON
  // ============================================================
  document.querySelectorAll('.concept-card').forEach((card) => {
    card.addEventListener('mouseenter', () => { card.style.borderColor = '#CBD5E1'; });
    card.addEventListener('mouseleave', () => { card.style.borderColor = ''; });
  });

})();
