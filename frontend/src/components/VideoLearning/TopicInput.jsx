import React, { useState, useRef, useEffect } from 'react';

const GENERATION_STAGES = [
  'Understanding concept...',
  'Identifying quantum concepts...',
  'Generating interactive lesson...'
];

const SUGGESTED_TOPICS = [
  'Superposition', 'Bell State', 'Quantum Entanglement',
  'Quantum Gates', 'Quantum Measurement', "Grover's Algorithm",
  'Quantum Teleportation', 'Hadamard Gate', 'CNOT Gate', 'Qubits'
];

export default function TopicInput({ onGenerate, isLoading, error, generationStep }) {
  const [topic, setTopic] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleGenerate = () => {
    if (topic.trim()) onGenerate(topic);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleGenerate();
  };

  return (
    <div className="vl-hero-section">
      <h1 className="vl-hero-title">✨ AI Quantum Learning Studio</h1>
      <p className="vl-hero-subtitle">Learn any quantum concept through interactive animated lessons.</p>
      
      <div className="vl-input-card">
        <input 
          ref={inputRef}
          type="text" 
          className="vl-input-single" 
          placeholder="e.g. Explain Quantum Entanglement" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        
        <button 
          className="btn btn-primary vl-generate-btn" 
          onClick={handleGenerate} 
          disabled={isLoading || !topic.trim()}
        >
          {isLoading ? (
            <>
              <span className="vl-spinner"></span> {GENERATION_STAGES[generationStep] || GENERATION_STAGES[0]}
            </>
          ) : 'Generate Interactive Lesson'}
        </button>
      </div>

      {error && <div className="vl-error">{error}</div>}

      <div className="vl-chip-row">
        {SUGGESTED_TOPICS.map(t => (
          <button 
            key={t} 
            className="vl-chip" 
            onClick={() => { setTopic(t); onGenerate(t); }}
            disabled={isLoading}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
