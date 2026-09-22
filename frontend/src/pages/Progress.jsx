import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/Layout/TopHeader';
import { QUANTUM_CONCEPTS } from '../data/mockData';
import { useLearningContext } from '../context/LearningContext';

function formatTimestamp(isoStr) {
  if (!isoStr) return 'Recently';
  try {
    const d = new Date(isoStr);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  } catch {
    return 'Recently';
  }
}

export default function Progress() {
  const navigate = useNavigate();
  const { progress, resetProgress } = useLearningContext();

  const masteryPct = progress?.overallMastery || 0;
  const learningGain = progress?.learningGain || 0;
  const lessonsCount = progress?.lessonsCompletedCount || 0;
  const totalLessons = progress?.totalLessons || 7;
  const challengesCount = progress?.challengesPassedCount || 0;
  const totalChallenges = progress?.totalChallenges || 3;
  const conceptMastery = progress?.conceptMastery || {};
  const activityHistory = progress?.activityHistory || [];

  // Categorize strengths and focus areas dynamically
  const { strengths, focusAreas } = useMemo(() => {
    const strongList = [];
    const focusList = [];
    QUANTUM_CONCEPTS.forEach(concept => {
      const score = conceptMastery[concept] || 0;
      if (score >= 50) {
        strongList.push({ name: concept, score });
      } else {
        focusList.push({ name: concept, score });
      }
    });
    return { strengths: strongList, focusAreas: focusList };
  }, [conceptMastery]);

  return (
    <div className="app-main-content">
      <TopHeader
        title="Progress & Assessment"
        subtitle="Live tracking of your quantum computing mastery, verified labs, and learning activity."
      />

      <div className="progress-container" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Top Action Bar with Demo Reset */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              Status: <strong style={{ color: 'var(--color-primary)' }}>Live Tracking Active</strong>
            </span>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              if (window.confirm('Reset progress data for a fresh demo run?')) {
                resetProgress();
              }
            }}
            title="Reset progress to 0% for demonstration"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderColor: '#cbd5e1' }}
          >
            ↻ Reset Progress (Demo)
          </button>
        </div>

        {/* Top Summary Cards */}
        <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
          {/* 1. Overall Quantum Mastery */}
          <div className="metric-card">
            <span className="metric-title">Overall Quantum Mastery</span>
            <div className="metric-value">{masteryPct}%</div>
            <div className="metric-progress-bar">
              <div className="metric-progress-fill" style={{ width: `${masteryPct}%` }}></div>
            </div>
            <span className="metric-subtext">
              {masteryPct >= 75
                ? 'Advanced Mastery achieved'
                : masteryPct >= 50
                ? 'Proficient level achieved'
                : masteryPct > 0
                ? 'Foundations in progress'
                : 'Begin your journey'}
            </span>
          </div>

          {/* 2. Learning Gain */}
          <div className="metric-card">
            <span className="metric-title">Learning Gain (Pre vs Post)</span>
            <div className="metric-value" style={{ color: '#16a34a' }}>
              +{learningGain}%
            </div>
            <span className="metric-subtext">
              Baseline: 0% → Current: {masteryPct}%
            </span>
          </div>

          {/* 3. Lessons Completed */}
          <div className="metric-card">
            <span className="metric-title">Lessons Completed</span>
            <div className="metric-value">{lessonsCount} / {totalLessons}</div>
            <span className="metric-subtext">
              {lessonsCount > 0 ? `${progress?.lessonProgressPercent}% curriculum completed` : 'Start your first lesson'}
            </span>
          </div>

          {/* 4. Challenges & Quizzes */}
          <div className="metric-card">
            <span className="metric-title">Challenges & Quizzes</span>
            <div className="metric-value">{challengesCount} / {totalChallenges}</div>
            <span className="metric-subtext">
              {progress?.quizzesTaken || 0} quizzes taken (Avg: {progress?.averageQuizScore || 0}%)
            </span>
          </div>
        </div>

        {/* Detailed Concept Breakdown & Recommendations */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Skill Breakdown Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>Concept Mastery Evaluation</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Weighted: Lessons (30%) · Quizzes (40%) · Challenges (30%)
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {QUANTUM_CONCEPTS.map((concept) => {
                const score = conceptMastery[concept] || 0;
                const status = score >= 75 ? 'Strong' : score >= 50 ? 'Proficient' : score > 0 ? 'Needs Practice' : 'Not Started';
                const barColor = score >= 75 ? '#16a34a' : score >= 50 ? '#2563eb' : score > 0 ? '#d97706' : '#94a3b8';

                return (
                  <div key={concept}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 600 }}>{concept}</span>
                      <span style={{ fontWeight: 'bold', color: barColor }}>
                        {score}% ({status})
                      </span>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${score}%`,
                          background: barColor,
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths & Recommendations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#16a34a' }}>Key Strengths</h4>
              {strengths.length > 0 ? (
                <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  {strengths.map(s => (
                    <li key={s.name}>
                      <strong>{s.name}</strong>: Demonstrated {s.score}% mastery through verified exercises.
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                  Complete the <strong>Superposition</strong> lesson, pass the concept quiz, or solve the <strong>Bell State</strong> challenge to build your strengths.
                </p>
              )}
            </div>

            <div className="card">
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#d97706' }}>Recommended Focus Area</h4>
              {focusAreas.length > 0 ? (
                <>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                    Focus on <strong>{focusAreas[0].name}</strong> ({focusAreas[0].score}%) and practice interactive circuits to elevate your understanding.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate('/lesson')}>
                      Read Superposition Lesson →
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/challenge')}>
                      Solve Bell State Challenge →
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#16a34a', fontWeight: 500 }}>
                  Outstanding! You have established proficiency across all core quantum concepts!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Activity History Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Recent Learning Activity</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Showing latest {Math.min(activityHistory.length, 20)} events
            </span>
          </div>

          {activityHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activityHistory.slice(0, 10).map((act) => {
                const isLesson = act.type === 'lesson';
                const isQuiz = act.type === 'quiz';
                const isChallenge = act.type === 'challenge';
                const badgeBg = isLesson ? '#eff6ff' : isQuiz ? '#f5f3ff' : '#ecfdf5';
                const badgeColor = isLesson ? '#2563eb' : isQuiz ? '#7c3aed' : '#059669';
                const badgeBorder = isLesson ? '#bfdbfe' : isQuiz ? '#ddd6fe' : '#a7f3d0';

                return (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          background: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeBorder}`
                        }}
                      >
                        {act.type}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                          {act.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          {act.details}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {formatTimestamp(act.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)', background: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>No learning activity recorded yet.</p>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Complete lessons, check answers on quizzes, or verify challenge circuits to see real-time updates here.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

