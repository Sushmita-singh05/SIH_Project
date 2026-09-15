import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SceneRenderer from './SceneRenderer';
import SceneControls from './SceneControls';
import QuizCheckpoint from './QuizCheckpoint';
import LessonSummary from './LessonSummary';
import FloatingAITutorBtn from '../AITutor/FloatingAITutorBtn';
import { buildTutorContext, saveTutorContext } from '../../utils/tutorContext';
import { useLearningContext } from '../../context/LearningContext';

export default function LessonPlayer({ lesson, onBack }) {
  const navigate = useNavigate();
  const context = useLearningContext();
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState(new Map());
  const [scenesViewed, setScenesViewed] = useState(new Set([0]));
  const [startTime] = useState(Date.now());
  const timerRef = useRef(null);

  const scene = lesson.scenes[currentSceneIndex];
  const isQuiz = scene.type === 'quiz';
  const isSummary = scene.type === 'summary';
  const quizState = quizAnswers.get(scene.id);
  const canAdvance = !isQuiz || (quizState?.submitted && quizState?.correct);

  useEffect(() => {
    if (isPlaying) {
      if (isQuiz || isSummary) {
        setIsPlaying(false);
        return;
      }
      timerRef.current = setTimeout(() => {
        if (currentSceneIndex < lesson.scenes.length - 1 && canAdvance) {
          handleNext();
        } else {
          setIsPlaying(false);
        }
      }, 8000);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentSceneIndex, isQuiz, isSummary, canAdvance]);

  const handleNext = useCallback(() => {
    if (currentSceneIndex < lesson.scenes.length - 1 && canAdvance) {
      const nextIdx = currentSceneIndex + 1;
      setCurrentSceneIndex(nextIdx);
      setScenesViewed(prev => new Set(prev).add(nextIdx));
    }
  }, [currentSceneIndex, lesson.scenes.length, canAdvance]);

  const handlePrev = useCallback(() => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
    }
  }, [currentSceneIndex]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleQuizAnswer = useCallback((sceneId, isCorrect, optionIndex, reset = false) => {
    setQuizAnswers(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(sceneId) || { attempts: 0 };
      if (reset) {
        newMap.set(sceneId, { selected: null, submitted: false, correct: false, attempts: current.attempts });
      } else {
        newMap.set(sceneId, {
          selected: optionIndex,
          submitted: true,
          correct: isCorrect,
          attempts: current.attempts + (!isCorrect ? 1 : 0)
        });
      }
      return newMap;
    });
  }, []);

  const handleComplete = useCallback(() => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    let correct = 0;
    quizAnswers.forEach(q => { if (q.correct) correct++; });
    
    if (context?.setLastUserAction) {
      context.setLastUserAction('completed_video_lesson');
    }
    
    localStorage.setItem('ql_video_lesson_' + lesson.lessonId, JSON.stringify({
      lessonId: lesson.lessonId,
      topic: lesson.topic,
      quizScore: correct,
      quizTotal: lesson.scenes.filter(s => s.type === 'quiz').length,
      scenesViewed: scenesViewed.size,
      timeSpent,
      completedAt: new Date().toISOString()
    }));
    
    onBack();
  }, [lesson, startTime, quizAnswers, scenesViewed, onBack, context]);

  const handleAskQuickQuestion = (q) => {
    const tCtx = buildTutorContext('video-learning', {
      topic: lesson.topic,
      sceneTitle: scene.title,
      sceneType: scene.type,
      userPrompt: q,
      circuit: scene.circuit
    });
    saveTutorContext(tCtx);
    navigate('/ai-tutor');
  };

  const getQuickQuestions = () => {
    switch (scene.type) {
      case 'circuit': return ["Why is this gate used?", "What happened to the qubit?", "Explain this circuit"];
      case 'bloch': return ["What does this vector mean?", "Why did the vector move?"];
      case 'simulation': return ["Why these probabilities?", "What does |00⟩ mean?"];
      case 'concept': return ["Can you simplify this?", "Why is this important?"];
      default: return [];
    }
  };

  const getContextData = () => ({
    topic: lesson.topic,
    sceneTitle: scene.title,
    sceneType: scene.type,
    circuit: scene.circuit
  });

  return (
    <div className="lesson-player">
      <div className="lesson-header">
        <div>
          <h2>{lesson.title}</h2>
          <span className="badge badge-primary">{lesson.difficulty}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onBack}>Back to Topics</button>
      </div>
      
      <div className="lesson-scene-meta">
        Scene {currentSceneIndex + 1} / {lesson.scenes.length} &bull; {scene.title}
      </div>
      
      <div className="scene-stage">
        {isQuiz ? (
          <QuizCheckpoint scene={scene} onAnswer={handleQuizAnswer} quizState={quizState} />
        ) : isSummary ? (
          <LessonSummary 
            scene={scene} 
            lessonData={lesson} 
            quizResults={quizAnswers} 
            timeSpent={Math.round((Date.now() - startTime) / 1000)}
            scenesViewed={scenesViewed.size}
            onComplete={handleComplete}
            onNewLesson={onBack}
          />
        ) : (
          <SceneRenderer scene={scene} isActive={true} />
        )}
      </div>

      {!isQuiz && !isSummary && (
        <>
          <div className="scene-narration" key={scene.id}>
            <p>{scene.narration}</p>
            {scene.keyConcept && <span className="scene-key-concept">Key Concept: {scene.keyConcept}</span>}
          </div>
          
          <div className="quick-questions-row">
            {getQuickQuestions().map((q, i) => (
              <button key={i} className="btn btn-sm btn-outline" onClick={() => handleAskQuickQuestion(q)}>
                {q}
              </button>
            ))}
          </div>
        </>
      )}

      <SceneControls 
        currentIndex={currentSceneIndex}
        totalScenes={lesson.scenes.length}
        onPrev={handlePrev}
        onNext={handleNext}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        canAdvance={canAdvance}
      />

      <FloatingAITutorBtn 
        screen="video-learning" 
        getContextData={getContextData} 
        customLabel="Ask AI" 
        bottom="20px" 
        right="20px" 
      />
    </div>
  );
}
