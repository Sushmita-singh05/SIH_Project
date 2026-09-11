import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/Layout/TopHeader';
import { PROGRESS_DATA } from '../data/mockData';
import { useLearningContext } from '../context/LearningContext';

export default function Progress() {
  const navigate = useNavigate();
  const { studentLevel, currentLesson } = useLearningContext();

  return (
    <div className="app-main-content">
      <TopHeader title="Progress & Assessment" subtitle="Track your learning progress, mastery, and improvement." />

      <div className="progress-container">
        {/* Top Summary Cards */}
        <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="metric-card">
            <span className="metric-title">Overall Quantum Mastery</span>
            <div className="metric-value">72%</div>
            <div className="metric-progress-bar">
              <div className="metric-progress-fill" style={{ width: '72%' }}></div>
            </div>
            <span className="metric-subtext">Proficient level achieved</span>
          </div>

          <div className="metric-card">
            <span className="metric-title">Learning Gain (Pre vs Post)</span>
            <div className="metric-value" style={{ color: '#16a34a' }}>+25%</div>
            <span className="metric-subtext">Diagnostic: 48% → Post: 73%</span>
          </div>

          <div className="metric-card">
            <span className="metric-title">Labs Completed</span>
            <div className="metric-value">{PROGRESS_DATA.completedLabs} / 8</div>
            <span className="metric-subtext">Superposition & Bell State verified</span>
          </div>

          <div className="metric-card">
            <span className="metric-title">Hours Practiced</span>
            <div className="metric-value">{PROGRESS_DATA.timeInvestedHours}h</div>
            <span className="metric-subtext">Interactive builder & simulations</span>
          </div>
        </div>

        {/* Detailed Concept Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
          {/* Skill Breakdown Card */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Concept Mastery Evaluation</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {PROGRESS_DATA.skillCategories.map((cat, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 600 }}>{cat.name}</span>
                    <span style={{ fontWeight: 'bold', color: cat.score >= 75 ? '#16a34a' : cat.score >= 60 ? '#2563eb' : '#d97706' }}>
                      {cat.score}% ({cat.status})
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${cat.score}%`,
                        background: cat.score >= 75 ? '#16a34a' : cat.score >= 60 ? '#2563eb' : '#d97706',
                        borderRadius: '4px'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Recommendations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#16a34a' }}>Key Strengths</h4>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                <li>Strong command of superposition & Hadamard basis changes.</li>
                <li>Single-qubit unitary rotation mastery on the Bloch Sphere.</li>
                <li>Clear grasp of 2-qubit computational measurement distributions.</li>
              </ul>
            </div>

            <div className="card">
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#d97706' }}>Focus Area</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Phase kickback and quantum interference require additional practice circuits to solidify.
              </p>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/circuit-builder')}>
                Practice Phase Circuits →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
