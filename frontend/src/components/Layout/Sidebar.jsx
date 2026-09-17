import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';

const getNavClass = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '');

function Sidebar() {

  return (
    <aside className="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="16" rx="14" ry="6" stroke="#2563EB" strokeWidth="1.5" fill="none" transform="rotate(-30 16 16)" opacity="0.6"/>
            <ellipse cx="16" cy="16" rx="14" ry="6" stroke="#4F46E5" strokeWidth="1.5" fill="none" transform="rotate(30 16 16)" opacity="0.4"/>
            <circle cx="16" cy="16" r="3.5" fill="#2563EB"/>
            <circle cx="5" cy="11" r="1.5" fill="#4F46E5" opacity="0.7"/>
            <circle cx="27" cy="21" r="1.5" fill="#4F46E5" opacity="0.7"/>
            <circle cx="26" cy="10" r="1" fill="#2563EB" opacity="0.5"/>
          </svg>
        </div>
        <span className="logo-text">QuantumLeap<span className="logo-accent">-AI</span></span>
      </div>

      {/* Primary Nav */}
      <nav className="sidebar-nav" aria-label="Primary navigation">
        <ul className="nav-list" role="list">
          <li className="nav-item">
            <NavLink to="/" end className={getNavClass}>
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </span>
              <span className="nav-label">Dashboard</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/lesson" className={getNavClass}>
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </span>
              <span className="nav-label">Learn</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/circuit-builder" className={getNavClass}>
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </span>
              <span className="nav-label">Practice</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/progress" className={getNavClass}>
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </span>
              <span className="nav-label">Progress</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/video-learning" className={getNavClass}>
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </span>
              <span className="nav-label">AI Visual Learning</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Bottom Nav */}
      <div className="sidebar-bottom">
        <ul className="nav-list" role="list">
          <li className="nav-item">
            <NavLink to="/ai-tutor" className={getNavClass}>
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </span>
              <span className="nav-label">AI Tutor</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/challenge" className={getNavClass}>
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </span>
              <span className="nav-label">Challenge</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default memo(Sidebar);
