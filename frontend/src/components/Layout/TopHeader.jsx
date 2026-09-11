import React, { useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function TopHeader({ title = "Dashboard" }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="top-header" role="banner">
      <div className="header-left">
        <button
          className="hamburger-btn"
          id="hamburgerBtn"
          aria-label="Open navigation menu"
          onClick={() => {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            if (sidebar) sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('visible');
          }}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="header-right">
        {/* Notification Bell */}
        <div className="header-action" id="notifWrapper" style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            id="notifBtn"
            aria-label="Notifications"
            onClick={() => setShowNotif(!showNotif)}
          >
            <span aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </span>
            <span className="notif-badge" aria-label="2 unread notifications">2</span>
          </button>

          {showNotif && (
            <div className="popover notif-popover open" style={{ display: 'block', position: 'absolute', right: 0, top: '48px', zIndex: 1000 }}>
              <div className="popover-header">
                <span className="popover-title">Notifications</span>
                <button className="popover-close" onClick={() => setShowNotif(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <ul className="notif-list" role="list">
                <li className="notif-item unread">
                  <div className="notif-dot" aria-hidden="true"></div>
                  <div className="notif-content">
                    <p className="notif-text">Simulation <strong>Hadamard (H) on q0</strong> finished.</p>
                    <time className="notif-time">Just now</time>
                  </div>
                </li>
                <li className="notif-item unread">
                  <div className="notif-dot" aria-hidden="true"></div>
                  <div className="notif-content">
                    <p className="notif-text">Quiz on <strong>Superposition</strong> passed with 100%.</p>
                    <time className="notif-time">1h ago</time>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="header-action" id="profileWrapper" style={{ position: 'relative' }}>
          <button
            className="profile-btn"
            id="profileBtn"
            aria-label="User profile menu for Alex Johnson"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="avatar" aria-hidden="true">
              <span className="avatar-initials">AJ</span>
            </div>
            <div className="profile-info">
              <span className="profile-name">Alex Johnson</span>
              <span className="profile-role">Student</span>
            </div>
            <span className="chevron-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </button>

          {showProfile && (
            <div className="popover profile-popover open" style={{ display: 'block', position: 'absolute', right: 0, top: '48px', zIndex: 1000 }}>
              <div className="profile-popover-header">
                <div className="avatar avatar-lg" aria-hidden="true">
                  <span className="avatar-initials">AJ</span>
                </div>
                <div>
                  <p className="profile-popover-name">Alex Johnson</p>
                  <p className="profile-popover-email">alex.johnson@university.edu</p>
                </div>
              </div>
              <ul className="profile-menu" role="list">
                <li>
                  <button className="profile-menu-item" onClick={() => { setShowProfile(false); navigate('/progress'); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
                    Learning Progress
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default memo(TopHeader);
