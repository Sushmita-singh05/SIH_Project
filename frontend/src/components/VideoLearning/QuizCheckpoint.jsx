import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTutorContext, saveTutorContext } from '../../utils/tutorContext';

export default function QuizCheckpoint({ scene, onAnswer, quizState }) {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(quizState?.selected || null);

  const handleSubmit = () => {
    if (selectedOption === null) return;
    const isCorrect = selectedOption === scene.quiz?.correctIndex;
    onAnswer(scene.id, isCorrect, selectedOption);
  };

  const handleAskAITutor = () => {
    const context = buildTutorContext('video-learning', {
      topic: scene.title,
      sceneTitle: scene.title,
      sceneType: scene.type,
      userPrompt: `I need help understanding this question: ${scene.quiz?.question}`
    });
    saveTutorContext(context);
    navigate('/ai-tutor');
  };

  const hasSubmitted = quizState?.submitted;
  const isCorrect = quizState?.correct;
  const attempts = quizState?.attempts || 0;
  const showExplanation = isCorrect || attempts >= 3;

  return (
    <div className="quiz-checkpoint">
      <h3 className="quiz-question">{scene.quiz?.question}</h3>
      <div className="quiz-options">
        {scene.quiz?.options?.map((opt, i) => {
          let className = "quiz-option";
          if (selectedOption === i) className += " selected";
          if (hasSubmitted && isCorrect && selectedOption === i) className += " correct";
          if (hasSubmitted && !isCorrect && selectedOption === i) className += " incorrect";
          if (showExplanation && i === scene.quiz?.correctIndex) className += " correct";
          
          return (
            <button 
              key={i} 
              className={className}
              onClick={() => !hasSubmitted && setSelectedOption(i)}
              disabled={hasSubmitted && isCorrect}
            >
              {opt}
            </button>
          );
        })}
      </div>
      
      {!hasSubmitted && (
        <button 
          className="btn btn-primary quiz-submit-btn" 
          onClick={handleSubmit} 
          disabled={selectedOption === null}
        >
          Submit
        </button>
      )}

      {hasSubmitted && (
        <div className={`quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect ? (
            <>
              <p>✅ Correct! {scene.explanation}</p>
            </>
          ) : (
            <>
              <p>❌ Not quite. Think about it...</p>
              {showExplanation && <p><strong>Explanation:</strong> {scene.explanation}</p>}
              <div className="quiz-actions">
                <button className="btn btn-outline btn-sm" onClick={() => onAnswer(scene.id, false, null, true)}>
                  Try Again
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleAskAITutor}>
                  Ask AI Tutor
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
