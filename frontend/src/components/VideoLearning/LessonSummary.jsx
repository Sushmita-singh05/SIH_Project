import React from 'react';

export default function LessonSummary({ scene, lessonData, quizResults, timeSpent, scenesViewed, onComplete, onNewLesson }) {
  const quizScores = Array.from(quizResults.values());
  const correctAnswers = quizScores.filter(q => q.correct).length;
  const totalQuizzes = lessonData.scenes.filter(s => s.type === 'quiz').length;
  
  const mins = Math.floor(timeSpent / 60);
  const secs = timeSpent % 60;
  
  return (
    <div className="lesson-summary">
      <h3>{scene.title || 'Lesson Complete!'}</h3>
      <div className="lesson-summary-stats">
        <div className="stat-card">
          <span>Quiz Score</span>
          <strong>{correctAnswers} / {totalQuizzes}</strong>
        </div>
        <div className="stat-card">
          <span>Time Spent</span>
          <strong>{mins}m {secs}s</strong>
        </div>
        <div className="stat-card">
          <span>Scenes Viewed</span>
          <strong>{scenesViewed} / {lessonData.scenes.length}</strong>
        </div>
      </div>
      
      <div className="lesson-summary-takeaways">
        <h4>Key Takeaways:</h4>
        <ul>
          {scene.takeaways?.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="lesson-summary-actions">
        <button className="btn btn-primary" onClick={onComplete}>Complete Lesson</button>
        <button className="btn btn-outline" onClick={onNewLesson}>Generate Another Lesson</button>
      </div>
    </div>
  );
}
