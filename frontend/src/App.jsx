import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';

import Dashboard from './pages/Dashboard';
import Lesson from './pages/Lesson';
import CircuitBuilder from './pages/CircuitBuilder';
import SimulationOutput from './pages/SimulationOutput';
import AITutor from './pages/AITutor';
import Challenge from './pages/Challenge';
import Progress from './pages/Progress';

export default function App() {
  return (
    <div className="app-shell" id="appShell">
      {/* Mobile Overlay */}
      <div 
        className="sidebar-overlay" 
        id="sidebarOverlay" 
        aria-hidden="true"
        onClick={() => {
          const sidebar = document.getElementById('sidebar');
          const overlay = document.getElementById('sidebarOverlay');
          if (sidebar) sidebar.classList.remove('open');
          if (overlay) overlay.classList.remove('visible');
        }}
      ></div>

      <Sidebar />
      <div className="main-area">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lesson" element={<Lesson />} />
          <Route path="/circuit-builder" element={<CircuitBuilder />} />
          <Route path="/simulation-output" element={<SimulationOutput />} />
          <Route path="/ai-tutor" element={<AITutor />} />
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </div>
    </div>
  );
}
