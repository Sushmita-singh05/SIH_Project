/**
 * dashboard.js — Dashboard page interactions
 * QuantumLeap-AI Dashboard
 *
 * Handles:
 *  - Progress bar animation on load
 *  - Progress card hover interactions
 *  - Any dashboard-specific micro-interactions
 */

'use strict';

(function DashboardModule() {

  // ---- Animate progress bars on load ----
  function animateProgressBars() {
    const bars = document.querySelectorAll('.progress-bar');
    bars.forEach((bar) => {
      const targetWidth = bar.style.width;
      bar.style.width = '0';
      // Trigger reflow
      void bar.offsetWidth;
      bar.style.transition = 'width 900ms cubic-bezier(0.4, 0, 0.2, 1)';
      bar.style.width = targetWidth;
    });
  }

  // ---- Intersection Observer for progress section ----
  // Triggers animation only when progress section enters viewport
  function observeProgressSection() {
    const progressGrid = document.querySelector('.progress-grid');
    if (!progressGrid) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateProgressBars();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(progressGrid);
  }

  // ---- Journey stage hover interaction ----
  function initJourneyInteractions() {
    const stages = document.querySelectorAll('.journey-stage');
    stages.forEach((stage) => {
      stage.addEventListener('mouseenter', () => {
        stage.querySelector('.journey-icon-wrap').style.transform = 'scale(1.08)';
      });
      stage.addEventListener('mouseleave', () => {
        stage.querySelector('.journey-icon-wrap').style.transform = '';
      });
    });
  }

  // ---- Progress card subtle hover enhancement ----
  function initProgressCardInteractions() {
    const cards = document.querySelectorAll('.progress-card');
    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        const bar = card.querySelector('.progress-bar');
        if (bar) {
          bar.style.filter = 'brightness(1.08)';
        }
      });
      card.addEventListener('mouseleave', () => {
        const bar = card.querySelector('.progress-bar');
        if (bar) {
          bar.style.filter = '';
        }
      });
    });
  }

  // ---- Lesson card subtle lift ----
  function initLessonCardInteraction() {
    const lessonCard = document.querySelector('.lesson-card');
    if (lessonCard) {
      // Visual cue: slight border color shift on hover
      lessonCard.addEventListener('mouseenter', () => {
        lessonCard.style.borderColor = '#CBD5E1';
      });
      lessonCard.addEventListener('mouseleave', () => {
        lessonCard.style.borderColor = '';
      });
    }
  }

  // ---- Initialize ----
  function init() {
    observeProgressSection();
    initJourneyInteractions();
    initProgressCardInteractions();
    initLessonCardInteraction();
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
