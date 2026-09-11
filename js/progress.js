/**
 * progress.js — Progress & Assessment Logic
 * QuantumLeap-AI · Screen 7
 *
 * Implements:
 *  - Dynamic data population from progressData mock model
 *  - Radial gauge and animated progress bars for overall and concept mastery
 *  - Pre vs Post assessment gain calculations and bar animations
 *  - Navigation wiring (Practice Weak Concept, Back to Dashboard, Sidebar)
 */

'use strict';

(function ProgressModule() {

  /* ================================================
     1. DATA ARCHITECTURE
     ================================================ */

  const progressData = {
    overallMastery: 72,

    lessonsCompleted: 3,
    totalLessons: 10,

    challengesPassed: 2,
    totalChallenges: 3,

    averageHints: 1.4,
    timeToCorrect: 42,

    assessment: {
      pre: 55,
      post: 80,
      improvement: 25
    },

    concepts: [
      {
        name: "Qubits & Basis States",
        mastery: 85,
        status: "Strong"
      },
      {
        name: "Superposition",
        mastery: 90,
        status: "Strong"
      },
      {
        name: "Measurement",
        mastery: 78,
        status: "Good"
      },
      {
        name: "Quantum Gates",
        mastery: 72,
        status: "Developing"
      },
      {
        name: "Entanglement",
        mastery: 55,
        status: "Needs Practice"
      },
      {
        name: "Bell States",
        mastery: 60,
        status: "Developing"
      }
    ]
  };

  /* ================================================
     2. DOM ELEMENTS
     ================================================ */

  const overallMasteryValEl = document.getElementById('overallMasteryVal');
  const masteryGaugePctEl   = document.getElementById('masteryGaugePct');
  const masteryGaugeCircle  = document.getElementById('masteryGaugeFillCircle');

  const metricLessonsEl     = document.getElementById('metricLessons');
  const metricChallengesEl  = document.getElementById('metricChallenges');
  const metricHintsEl       = document.getElementById('metricHints');
  const metricTimeEl        = document.getElementById('metricTime');

  const preScoreEl          = document.getElementById('preScoreVal');
  const postScoreEl         = document.getElementById('postScoreVal');
  const improveScoreEl      = document.getElementById('improveScoreVal');
  const gainPointsEl        = document.getElementById('gainPointsVal');

  const preBarFillEl        = document.getElementById('preBarFill');
  const postBarFillEl       = document.getElementById('postBarFill');
  const gainBarFillEl       = document.getElementById('gainBarFill');

  const conceptsListEl      = document.getElementById('conceptsList');

  const summaryPreEl        = document.getElementById('summaryPre');
  const summaryPostEl       = document.getElementById('summaryPost');
  const summaryImproveEl    = document.getElementById('summaryImprove');
  const summaryChallengesEl = document.getElementById('summaryChallenges');
  const summaryHintsEl      = document.getElementById('summaryHints');

  const practiceWeakBtn1    = document.getElementById('practiceWeakBtn1');
  const practiceWeakBtn2    = document.getElementById('practiceWeakBtn2');
  const backDashboardBtn    = document.getElementById('backDashboardBtn');

  /* ================================================
     3. RENDER SECTION 1: OVERALL MASTERY
     ================================================ */

  function renderOverallMastery() {
    const val = progressData.overallMastery;
    if (overallMasteryValEl) overallMasteryValEl.textContent = `${val}%`;
    if (masteryGaugePctEl) masteryGaugePctEl.textContent = `${val}%`;

    // Animate radial SVG gauge
    // Radius = 54 -> Circumference = 2 * PI * 54 ≈ 339.292
    if (masteryGaugeCircle) {
      const radius = 54;
      const circumference = 2 * Math.PI * radius;
      masteryGaugeCircle.style.strokeDasharray = `${circumference}`;
      const offset = circumference - (val / 100) * circumference;

      // Animate on next frame
      requestAnimationFrame(() => {
        setTimeout(() => {
          masteryGaugeCircle.style.strokeDashoffset = `${offset}`;
        }, 100);
      });
    }
  }

  /* ================================================
     4. RENDER SECTION 2: LEARNING METRICS
     ================================================ */

  function renderMetrics() {
    if (metricLessonsEl) {
      metricLessonsEl.textContent = `${progressData.lessonsCompleted} / ${progressData.totalLessons}`;
    }
    if (metricChallengesEl) {
      metricChallengesEl.textContent = `${progressData.challengesPassed} / ${progressData.totalChallenges}`;
    }
    if (metricHintsEl) {
      metricHintsEl.textContent = progressData.averageHints.toFixed(1);
    }
    if (metricTimeEl) {
      metricTimeEl.textContent = `${progressData.timeToCorrect} sec`;
    }
  }

  /* ================================================
     5. RENDER SECTION 3: PRE vs POST ASSESSMENT
     ================================================ */

  function renderPrePost() {
    const { pre, post, improvement } = progressData.assessment;

    if (preScoreEl) preScoreEl.textContent = `${pre}%`;
    if (postScoreEl) postScoreEl.textContent = `${post}%`;
    if (improveScoreEl) improveScoreEl.textContent = `+${improvement}%`;
    if (gainPointsEl) gainPointsEl.textContent = `+${improvement} percentage points`;

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (preBarFillEl) preBarFillEl.style.width = `${pre}%`;
        if (postBarFillEl) postBarFillEl.style.width = `${post}%`;
        if (gainBarFillEl) gainBarFillEl.style.width = `${improvement * 2}%`;
      }, 150);
    });
  }

  /* ================================================
     6. RENDER SECTION 4: CONCEPT MASTERY
     ================================================ */

  function renderConcepts() {
    if (!conceptsListEl) return;
    conceptsListEl.innerHTML = '';

    progressData.concepts.forEach(concept => {
      const statusClass = concept.status.toLowerCase().replace(/\s+/g, '');

      const row = document.createElement('div');
      row.className = 'concept-row';

      row.innerHTML = `
        <div class="concept-meta-top">
          <span class="concept-name">${concept.name}</span>
          <div class="concept-status-group">
            <span class="concept-status-badge ${statusClass}">${concept.status}</span>
            <span class="concept-pct">${concept.mastery}%</span>
          </div>
        </div>
        <div class="concept-track">
          <div class="concept-fill ${statusClass}" style="width: 0%" data-target="${concept.mastery}"></div>
        </div>
      `;

      conceptsListEl.appendChild(row);
    });

    // Animate bars
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll('.concept-fill').forEach(fill => {
          const target = fill.getAttribute('data-target');
          fill.style.width = `${target}%`;
        });
      }, 200);
    });
  }

  /* ================================================
     7. RENDER SECTION 7: ASSESSMENT SUMMARY
     ================================================ */

  function renderAssessmentSummary() {
    if (summaryPreEl) summaryPreEl.textContent = `${progressData.assessment.pre}%`;
    if (summaryPostEl) summaryPostEl.textContent = `${progressData.assessment.post}%`;
    if (summaryImproveEl) summaryImproveEl.textContent = `+${progressData.assessment.improvement}%`;
    if (summaryChallengesEl) {
      summaryChallengesEl.textContent = `${progressData.challengesPassed} / ${progressData.totalChallenges}`;
    }
    if (summaryHintsEl) summaryHintsEl.textContent = progressData.averageHints.toFixed(1);
  }

  /* ================================================
     8. NAVIGATION
     ================================================ */

  function setupNavigation() {
    if (practiceWeakBtn1) {
      practiceWeakBtn1.addEventListener('click', () => {
        window.location.href = 'challenge.html';
      });
    }

    if (practiceWeakBtn2) {
      practiceWeakBtn2.addEventListener('click', () => {
        window.location.href = 'challenge.html';
      });
    }

    if (backDashboardBtn) {
      backDashboardBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

    // Sidebar navigation handling
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const route = link.dataset.route;
        if (route === 'dashboard') return;
        if (route === 'learn') return;
        if (route === 'practice') return;
        if (route === 'progress') {
          e.preventDefault();
          return;
        }

        const routePlaceholder = document.getElementById('routePlaceholder');
        if (routePlaceholder) {
          e.preventDefault();
          routePlaceholder.classList.add('visible');
          routePlaceholder.setAttribute('aria-hidden', 'false');
        }
      });
    });

    const placeholderClose = document.getElementById('placeholderClose');
    if (placeholderClose) {
      placeholderClose.addEventListener('click', () => {
        const routePlaceholder = document.getElementById('routePlaceholder');
        if (routePlaceholder) {
          routePlaceholder.classList.remove('visible');
          routePlaceholder.setAttribute('aria-hidden', 'true');
        }
      });
    }
  }

  /* ================================================
     9. INIT
     ================================================ */

  renderOverallMastery();
  renderMetrics();
  renderPrePost();
  renderConcepts();
  renderAssessmentSummary();
  setupNavigation();

})();
