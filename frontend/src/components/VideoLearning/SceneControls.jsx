import React from 'react';

export default function SceneControls({ currentIndex, totalScenes, onPrev, onNext, isPlaying, onTogglePlay, canAdvance }) {
  return (
    <>
      <div className="scene-controls">
        <button className="btn btn-outline btn-sm" onClick={onPrev} disabled={currentIndex === 0}>
          ← Previous
        </button>
        
        <button className="btn btn-sm scene-play-btn" onClick={onTogglePlay}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        
        <span className="scene-counter">Scene {currentIndex + 1} / {totalScenes}</span>
        
        <button className="btn btn-primary btn-sm" onClick={onNext} disabled={currentIndex === totalScenes - 1 || !canAdvance}>
          Next →
        </button>
      </div>

      <div className="scene-progress-bar">
        <div className="scene-progress-fill" style={{ width: `${((currentIndex + 1) / totalScenes) * 100}%` }} />
      </div>
    </>
  );
}
