import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTutorContext, saveTutorContext } from '../../utils/tutorContext';

/**
 * FloatingAITutorBtn
 * Global context-aware floating button that captures the active screen state
 * and seamlessly opens the AI Tutor.
 */
function FloatingAITutorBtn({
  screen = 'dashboard',
  getContextData = null,
  customLabel = 'Ask AI Tutor',
  bottom = '24px',
  right = '28px',
}) {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    const data = getContextData ? getContextData() : {};
    const context = buildTutorContext(screen, data);
    saveTutorContext(context);
    navigate('/ai-tutor');
  }, [screen, getContextData, navigate]);

  return (
    <button
      className="floating-tutor-btn"
      onClick={handleClick}
      title={`Ask AI Tutor about this ${screen.replace('-', ' ')}`}
      style={{
        position: 'fixed',
        bottom,
        right,
        zIndex: 999,
        borderRadius: '9999px',
        boxShadow: '0 8px 20px -2px rgba(37, 99, 235, 0.35)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        fontWeight: 700,
        fontSize: '0.88rem',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        border: '2px solid #ffffff',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 24px -2px rgba(37, 99, 235, 0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 20px -2px rgba(37, 99, 235, 0.35)';
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>🤖</span>
      <span>{customLabel}</span>
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#4ade80',
          boxShadow: '0 0 6px #4ade80',
        }}
      />
    </button>
  );
}

export default memo(FloatingAITutorBtn);
