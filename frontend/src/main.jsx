import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Import design system CSS files
import './styles/base.css';
import './styles/sidebar.css';
import './styles/header.css';
import './styles/dashboard.css';
import './styles/lesson.css';
import './styles/circuit-builder.css';
import './styles/simulation-output.css';
import './styles/ai-tutor.css';
import './styles/challenge.css';
import './styles/progress.css';
import './styles/video-learning.css';
import './styles/responsive.css';

import { LearningProvider } from './context/LearningContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LearningProvider>
        <App />
      </LearningProvider>
    </BrowserRouter>
  </React.StrictMode>
);
