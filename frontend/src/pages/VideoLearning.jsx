import React, { useState, useCallback, useRef, useEffect } from 'react';
import TopHeader from '../components/Layout/TopHeader';
import TopicInput from '../components/VideoLearning/TopicInput';
import LessonPlayer from '../components/VideoLearning/LessonPlayer';
import { generateLesson } from '../services/api';
import '../styles/video-learning.css';

const GENERATION_STAGES_DURATION = [600, 1400]; // timings for step transitions

export default function VideoLearning() {
  const [lesson, setLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationStep, setGenerationStep] = useState(0);
  const timersRef = useRef([]);

  // Check sessionStorage for cached lesson
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('ql_current_lesson');
      if (cached) setLesson(JSON.parse(cached));
    } catch {}
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const handleGenerate = useCallback(async (topic) => {
    setError('');
    setIsLoading(true);
    setGenerationStep(0);
    setLesson(null);
    timersRef.current.forEach(clearTimeout);
    
    // Animate generation steps
    const t1 = setTimeout(() => setGenerationStep(1), 600);
    const t2 = setTimeout(() => setGenerationStep(2), 1400);
    timersRef.current = [t1, t2];
    
    try {
      const data = await generateLesson(topic);
      timersRef.current.forEach(clearTimeout);
      setLesson(data);
      sessionStorage.setItem('ql_current_lesson', JSON.stringify(data));
    } catch (err) {
      timersRef.current.forEach(clearTimeout);
      setError(err.message || 'Failed to generate lesson.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setLesson(null);
    sessionStorage.removeItem('ql_current_lesson');
  }, []);

  return (
    <>
      <TopHeader title="AI Quantum Learning Studio" />
      <main className="vl-content" role="main">
        {!lesson ? (
          <TopicInput
            onGenerate={handleGenerate}
            isLoading={isLoading}
            error={error}
            generationStep={generationStep}
          />
        ) : (
          <LessonPlayer lesson={lesson} onBack={handleBack} />
        )}
      </main>
    </>
  );
}
