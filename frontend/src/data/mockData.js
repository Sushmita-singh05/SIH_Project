// Mock data for QuantumLeap-AI React application

export const QUANTUM_CONCEPTS = [
  'Qubit',
  'Superposition',
  'Hadamard',
  'Measurement',
  'Entanglement',
  'Bell State',
  'CNOT'
];

export const TOTAL_LESSONS = 7;
export const TOTAL_CHALLENGES = 3;

export const AppData = {
  user: {
    name: "Alex Mercer",
    role: "Quantum Computing Explorer",
    avatar: "AM",
    level: "Intermediate Learner",
    overallMastery: 72,
    studyStreakDays: 14,
    totalSimulations: 87,
    conceptsMastered: 18,
    activePathway: "Quantum Algorithms & Protocols"
  },
  
  notifications: [
    { id: 1, title: "Simulation Finished", text: "Bell State circuit achieved 99.8% fidelity", time: "5m ago", unread: true },
    { id: 2, title: "AI Tutor Insight", text: "New insight available for Hadamard gate phase shifts", time: "1h ago", unread: true },
    { id: 3, title: "Weekly Goal Met", text: "You completed 5 circuits this week", time: "1d ago", unread: false }
  ],

  courses: [
    {
      id: "q-foundations",
      title: "Quantum Computing Foundations",
      tagline: "Core mathematical and physical principles of qubits",
      progress: 68,
      totalModules: 8,
      completedModules: 5,
      activeLessonId: "superposition",
      lessons: [
        { id: "qubits-intro", title: "Introduction to Qubits & Dirac Notation", status: "completed", score: 95 },
        { id: "bloch-sphere", title: "The Bloch Sphere Representation", status: "completed", score: 90 },
        { id: "single-qubit-gates", title: "Single-Qubit Logic Gates (X, Y, Z)", status: "completed", score: 88 },
        { id: "superposition", title: "Superposition & The Hadamard Gate", status: "in-progress", score: null },
        { id: "measurement", title: "Quantum Measurement & Wavefunction Collapse", status: "locked", score: null },
        { id: "entanglement", title: "Multi-Qubit Systems & Entanglement", status: "locked", score: null },
        { id: "bell-states", title: "Bell States and Quantum Teleportation", status: "locked", score: null },
        { id: "algorithms-intro", title: "Intro to Deutsch-Jozsa & Grover", status: "locked", score: null }
      ]
    }
  ]
};

export const DEMO_RESULT = {
  shots: 1024,
  qubits: 2,
  executionTimeMs: 42,
  backend: "Aer Simulator (Statevector)",
  counts: { "00": 519, "01": 505 },
  probabilities: { "00": 0.507, "01": 0.493 },
  statevector: [
    { basis: "|00>", real: 0.7071, imag: 0.0000, prob: 0.5000, phaseRad: 0.0, phaseDeg: "0°" },
    { basis: "|01>", real: 0.7071, imag: 0.0000, prob: 0.5000, phaseRad: 0.0, phaseDeg: "0°" },
    { basis: "|10>", real: 0.0000, imag: 0.0000, prob: 0.0000, phaseRad: 0.0, phaseDeg: "—" },
    { basis: "|11>", real: 0.0000, imag: 0.0000, prob: 0.0000, phaseRad: 0.0, phaseDeg: "—" }
  ],
  blochSpheres: [
    { qubit: 0, theta: 1.5708, phi: 0.0, x: 1.0, y: 0.0, z: 0.0, label: "q0: |+> = (|0>+|1>)/sqrt(2)" },
    { qubit: 1, theta: 0.0, phi: 0.0, x: 0.0, y: 0.0, z: 1.0, label: "q1: |0>" }
  ]
};

export const TUTOR_CONTEXT = {
  circuitSummary: "Hadamard (H) on q0",
  qubitDetails: [
    { name: "q0", gate: "H", inputState: "|0>", outputState: "|+> = (|0> + |1>)/sqrt(2)" },
    { name: "q1", gate: "None (Wire)", inputState: "|0>", outputState: "|0>" }
  ]
};

export const PROGRESS_DATA = {
  overallScore: 72,
  preAssessmentScore: 48,
  postAssessmentScore: 73,
  timeInvestedHours: 12.5,
  completedLabs: 7,
  quizzesPassed: 9,
  skillCategories: [
    { name: "Superposition & State Vectors", score: 88, status: "Strong" },
    { name: "Unitary Single-Qubit Gates", score: 82, status: "Strong" },
    { name: "Bloch Sphere Coordinates", score: 76, status: "Proficient" },
    { name: "Multi-Qubit Entanglement", score: 62, status: "Needs Practice" },
    { name: "Phase Kickback & Interference", score: 52, status: "Focus Area" }
  ]
};
