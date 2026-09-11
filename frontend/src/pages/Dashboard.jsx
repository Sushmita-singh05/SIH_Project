import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/Layout/TopHeader';
import { useLearningContext } from '../context/LearningContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentLesson, currentChallenge } = useLearningContext();

  return (
    <>
      <TopHeader title="Dashboard" />

      <main className="dashboard-content" id="dashboardContent" role="main">
        {/* Welcome Section */}
        <section className="welcome-section" aria-labelledby="welcomeHeading">
          <div className="welcome-text">
            <h2 id="welcomeHeading" className="welcome-heading">Welcome back, Alex! 👋</h2>
            <p className="welcome-subtext">Continue your quantum learning journey and strengthen your understanding through hands-on practice.</p>
          </div>
        </section>

        {/* Progress Overview */}
        <section className="section" aria-labelledby="progressHeading">
          <h2 id="progressHeading" className="section-title">Your Progress</h2>
          <div className="progress-grid" role="list">

            {/* Card 1: Lessons */}
            <article className="progress-card" role="listitem" tabIndex="0" aria-label="Lessons Completed: 3 out of 10, 30 percent">
              <div className="progress-card-top">
                <div className="progress-icon-wrap lessons-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <div className="progress-card-meta">
                  <span className="progress-card-title">Lessons Completed</span>
                  <span className="progress-card-value">3 <span className="progress-total">/ 10</span></span>
                </div>
              </div>
              <div className="progress-bar-wrap" role="progressbar" aria-valuenow="30" aria-valuemin="0" aria-valuemax="100" aria-label="30 percent of lessons completed">
                <div className="progress-bar lessons-bar" style={{ width: '30%' }}></div>
              </div>
              <p className="progress-card-sub">30% completed</p>
            </article>

            {/* Card 2: Challenges */}
            <article className="progress-card" role="listitem" tabIndex="0" aria-label="Challenges Passed: 4 out of 8, 50 percent success rate">
              <div className="progress-card-top">
                <div className="progress-icon-wrap challenges-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                  </svg>
                </div>
                <div className="progress-card-meta">
                  <span className="progress-card-title">Challenges Passed</span>
                  <span className="progress-card-value">4 <span className="progress-total">/ 8</span></span>
                </div>
              </div>
              <div className="progress-bar-wrap" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" aria-label="50 percent challenge success rate">
                <div className="progress-bar challenges-bar" style={{ width: '50%' }}></div>
              </div>
              <p className="progress-card-sub">50% success rate</p>
            </article>

            {/* Card 3: Mastery */}
            <article className="progress-card" role="listitem" tabIndex="0" aria-label="Overall Mastery: 62 percent">
              <div className="progress-card-top">
                <div className="progress-icon-wrap mastery-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                  </svg>
                </div>
                <div className="progress-card-meta">
                  <span className="progress-card-title">Overall Mastery</span>
                  <span className="progress-card-value">62<span className="progress-pct">%</span></span>
                </div>
              </div>
              <div className="progress-bar-wrap" role="progressbar" aria-valuenow="62" aria-valuemin="0" aria-valuemax="100" aria-label="62 percent overall mastery">
                <div className="progress-bar mastery-bar" style={{ width: '62%' }}></div>
              </div>
              <p className="progress-card-sub">Keep improving</p>
            </article>

          </div>
        </section>

        {/* Main Actions Grid */}
        <div className="main-actions-grid">

          {/* Recommended Next Lesson */}
          <section className="section" aria-labelledby="recommendedHeading">
            <h2 id="recommendedHeading" className="section-title">Recommended Next Lesson</h2>
            <article className="lesson-card" aria-label="Recommended lesson: Superposition">
              <div className="lesson-card-content">
                <div className="lesson-card-body">
                  <span className="lesson-tag">CONTINUE LEARNING</span>
                  <h3 className="lesson-title">Superposition</h3>
                  <p className="lesson-description">
                    Understand how a qubit can exist in a combination of basis states and explore the effect of the Hadamard gate on quantum state preparation.
                  </p>
                  <div className="lesson-meta">
                    <span className="lesson-meta-item" aria-label="Estimated time: 15 minutes">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      15 min
                    </span>
                    <span className="lesson-meta-item" aria-label="Unit 1: Quantum Foundations">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      Unit 1: Quantum Foundations
                    </span>
                  </div>
                  <button className="btn btn-primary" id="continueLearnBtn" aria-label="Continue learning Superposition lesson" onClick={() => navigate('/lesson')}>
                    Continue Learning
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </div>
                <div className="lesson-card-visual" aria-hidden="true">
                  <div className="circuit-diagram">
                    <div className="circuit-label">|0⟩</div>
                    <div className="circuit-line"></div>
                    <div className="circuit-gate">H</div>
                    <div className="circuit-line"></div>
                    <div className="circuit-output">
                      <span className="circuit-state">|+⟩</span>
                    </div>
                  </div>
                  <p className="circuit-caption">Hadamard Gate</p>
                  <div className="bloch-visual">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="40" cy="40" r="30" stroke="#E2E8F0" strokeWidth="1.5" fill="#F8FAFC"/>
                      <ellipse cx="40" cy="40" rx="30" ry="10" stroke="#CBD5E1" strokeWidth="1" fill="none"/>
                      <line x1="40" y1="10" x2="40" y2="70" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3,3"/>
                      <line x1="40" y1="40" x2="62" y2="22" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="62" cy="22" r="3" fill="#2563EB"/>
                      <text x="37" y="8" fontSize="9" fill="#64748B" fontFamily="Inter, sans-serif">|0⟩</text>
                      <text x="37" y="78" fontSize="9" fill="#64748B" fontFamily="Inter, sans-serif">|1⟩</text>
                    </svg>
                    <p className="circuit-caption">Bloch Sphere</p>
                  </div>
                </div>
              </div>
            </article>
          </section>

          {/* Quick Challenge */}
          <section className="section" aria-labelledby="challengeHeading">
            <h2 id="challengeHeading" className="section-title">Quick Challenge</h2>
            <article className="challenge-card" aria-label="Quick challenge: Build a Bell State">
              <div className="challenge-card-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="8" width="4" height="8" rx="1"/>
                  <rect x="10" y="5" width="4" height="14" rx="1"/>
                  <rect x="18" y="10" width="4" height="6" rx="1"/>
                  <line x1="6" y1="12" x2="10" y2="12"/>
                  <line x1="14" y1="12" x2="18" y2="12"/>
                </svg>
              </div>
              <span className="difficulty-badge badge-intermediate" aria-label="Difficulty: Intermediate">Intermediate</span>
              <h3 className="challenge-title">Build a Bell State</h3>
              <p className="challenge-description">
                Test your understanding of superposition and entanglement by constructing a simple Bell-state circuit using Hadamard and CNOT gates.
              </p>
              <div className="challenge-tags" aria-label="Topics covered">
                <span className="tag">Superposition</span>
                <span className="tag">Entanglement</span>
                <span className="tag">CNOT Gate</span>
              </div>
              <button className="btn btn-outline" id="startChallengeBtn" aria-label="Start Bell State challenge" onClick={() => navigate('/challenge')}>
                Start Challenge
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </article>
          </section>

        </div>

        {/* Learning Journey */}
        <section className="section journey-section" aria-labelledby="journeyHeading">
          <h2 id="journeyHeading" className="section-title">Your Learning Journey</h2>
          <div className="journey-container" role="list" aria-label="Learning stages">
            <div className="journey-stage active-stage" role="listitem" aria-label="Learn — current stage" onClick={() => navigate('/lesson')} style={{ cursor: 'pointer' }}>
              <div className="journey-icon-wrap learn-stage">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <span className="journey-label">Learn</span>
              <span className="journey-status" aria-label="In progress">In Progress</span>
            </div>

            <div className="journey-connector" aria-hidden="true">
              <div className="connector-line"></div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div className="journey-stage" role="listitem" aria-label="Build — upcoming stage" onClick={() => navigate('/circuit-builder')} style={{ cursor: 'pointer' }}>
              <div className="journey-icon-wrap build-stage">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="16" y1="12" x2="8" y2="12" strokeDasharray="2,2"/>
                </svg>
              </div>
              <span className="journey-label">Build</span>
              <span className="journey-status upcoming" aria-label="Upcoming">Upcoming</span>
            </div>

            <div className="journey-connector" aria-hidden="true">
              <div className="connector-line"></div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div className="journey-stage" role="listitem" aria-label="Simulate — upcoming stage" onClick={() => navigate('/simulation-output')} style={{ cursor: 'pointer' }}>
              <div className="journey-icon-wrap simulate-stage">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <span className="journey-label">Simulate</span>
              <span className="journey-status upcoming" aria-label="Upcoming">Upcoming</span>
            </div>

            <div className="journey-connector" aria-hidden="true">
              <div className="connector-line"></div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div className="journey-stage" role="listitem" aria-label="Explain — upcoming stage" onClick={() => navigate('/ai-tutor')} style={{ cursor: 'pointer' }}>
              <div className="journey-icon-wrap explain-stage">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span className="journey-label">Explain</span>
              <span className="journey-status upcoming" aria-label="Upcoming">Upcoming</span>
            </div>

            <div className="journey-connector" aria-hidden="true">
              <div className="connector-line"></div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div className="journey-stage" role="listitem" aria-label="Assess — upcoming stage" onClick={() => navigate('/challenge')} style={{ cursor: 'pointer' }}>
              <div className="journey-icon-wrap assess-stage">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <span className="journey-label">Assess</span>
              <span className="journey-status upcoming" aria-label="Upcoming">Upcoming</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
