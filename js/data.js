/**
 * data.js — Mock data layer for QuantumLeap-AI Dashboard
 *
 * All static/mock data lives here so it can later be replaced
 * with API calls or a state management layer without touching UI code.
 */

'use strict';

const AppData = Object.freeze({

  /**
   * Current authenticated student.
   * Replace with API response: GET /api/user/me
   */
  student: {
    id: 'usr_alex001',
    name: 'Alex Johnson',
    firstName: 'Alex',
    email: 'alex.johnson@university.edu',
    avatarInitials: 'AJ',
    role: 'Student',
    streakDays: 7,
  },

  /**
   * Learning progress.
   * Replace with API response: GET /api/progress/:userId
   */
  progress: {
    lessonsCompleted: 3,
    totalLessons: 10,
    challengesPassed: 4,
    totalChallenges: 8,
    masteryPercent: 62,

    // Computed helpers
    get lessonPercent() {
      return Math.round((this.lessonsCompleted / this.totalLessons) * 100);
    },
    get challengePercent() {
      return Math.round((this.challengesPassed / this.totalChallenges) * 100);
    },
  },

  /**
   * Recommended lesson (AI-driven in production).
   * Replace with API response: GET /api/recommendations/:userId/lesson
   */
  recommendedLesson: {
    id: 'lesson_superposition',
    title: 'Superposition',
    slug: 'superposition',
    unit: 'Unit 1: Quantum Foundations',
    estimatedMinutes: 15,
    description:
      'Understand how a qubit can exist in a combination of basis states and explore the effect of the Hadamard gate on quantum state preparation.',
    route: '/learn/superposition',
    tag: 'CONTINUE LEARNING',
  },

  /**
   * Quick challenge recommendation.
   * Replace with API response: GET /api/recommendations/:userId/challenge
   */
  quickChallenge: {
    id: 'ch_bell_state',
    title: 'Build a Bell State',
    slug: 'bell-state',
    difficulty: 'Intermediate',           // 'Beginner' | 'Intermediate' | 'Advanced'
    difficultyKey: 'intermediate',         // for CSS class binding
    description:
      'Test your understanding of superposition and entanglement by constructing a simple Bell-state circuit using Hadamard and CNOT gates.',
    topics: ['Superposition', 'Entanglement', 'CNOT Gate'],
    route: '/challenge/bell-state',
  },

  /**
   * Notifications list.
   * Replace with API response: GET /api/notifications/:userId
   */
  notifications: [
    {
      id: 'notif_001',
      text: 'New lesson <strong>Quantum Entanglement</strong> is now available.',
      time: 'Yesterday',
      dateTime: '2026-09-05',
      read: false,
    },
    {
      id: 'notif_002',
      text: "You're 38% away from completing <strong>Unit 1</strong>.",
      time: '2 days ago',
      dateTime: '2026-09-04',
      read: false,
    },
    {
      id: 'notif_003',
      text: 'Challenge <strong>Single-Qubit Gates</strong> passed successfully.',
      time: '3 days ago',
      dateTime: '2026-09-03',
      read: true,
    },
  ],

  /**
   * Learning journey stages (fixed product concept).
   * Order matters — represents the Learn → Build → Simulate → Explain → Assess flow.
   */
  learningJourney: [
    { id: 'learn',    label: 'Learn',    status: 'active' },
    { id: 'build',    label: 'Build',    status: 'upcoming' },
    { id: 'simulate', label: 'Simulate', status: 'upcoming' },
    { id: 'explain',  label: 'Explain',  status: 'upcoming' },
    { id: 'assess',   label: 'Assess',   status: 'upcoming' },
  ],

  /**
   * Navigation routes — maps route ids to URLs.
   * Extend this map as new screens are built.
   */
  routes: {
    dashboard:  'index.html',
    learn:      'lesson-superposition.html',
    practice:   'circuit-builder.html',
    progress:   'progress.html',
    settings:   '/settings',
    help:       '/help',
  },

  /**
   * Routes not yet implemented (show placeholder).
   */
  unbuiltRoutes: new Set(['settings', 'help']),
});
