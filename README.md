# QuantumLeap-AI

> **Interactive, Context-Aware Quantum Computing Education Platform**  
> Move learners from abstract linear algebra to intuitive quantum circuit mastery through a structured 5-stage experiential cycle:  
> **Learn → Build → Simulate → Explain → Assess**

---

## Overview

**QuantumLeap-AI** bridges the gap between quantum mechanical theory and practical quantum computing intuition. Built for hackathons and classroom environments, it combines an interactive React-based circuit builder and simulator with a context-aware AI tutor and visual learning generator.

### The 5-Stage Experiential Loop
1. **Learn**: Conceptual foundations with visual state vector analogies and interactive mini-quizzes.
2. **Build**: Multi-qubit circuit assembly with drag/click gate palettes (H, X, Y, Z, CNOT, Measurement).
3. **Simulate**: State vector calculation, multi-shot measurement distributions, and isometric 3D Bloch sphere projections.
4. **Explain**: Socratic, context-aware AI tutoring with a 3-tiered progressive hint engine that never reveals solutions prematurely.
5. **Assess**: Challenge circuits (e.g., Bell State creation) with pre/post-assessment learning gain analytics.

---

## Educational Screens & Modules

1. **Dashboard** (`/`): Unit curriculum roadmap, streak tracking, concept mastery overview, and quick challenge access.
2. **Superposition Lesson** (`/lesson`): Interactive basis state probability breakdown, state vector sliders, and comprehension checks.
3. **Circuit Builder** (`/circuit-builder`): Multi-qubit gate placement canvas, depth/gate counter, and circuit state export.
4. **Simulation Output** (`/simulation-output`): Quantum measurement histograms, isometric 3D Bloch sphere projection, and state amplitudes.
5. **AI Tutor** (`/ai-tutor`): Grounded pedagogical assistant reading real-time circuit state with progressive hint disclosure (Conceptual → Structural → Direct Insight).
6. **Bell State Challenge** (`/challenge`): Interactive circuit verification task with pre- and post-challenge conceptual checks.
7. **Progress & Assessment** (`/progress`): Circular SVG mastery gauges, normalized learning gain calculation, and breakdown by quantum concepts.
8. **AI Visual Learning** (`/video-learning`): Scene-by-scene quantum storyboard player with dynamic circuit schematics and contextual tutoring.

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                         │
│                                                                        │
│  [Dashboard] ──► [Lesson] ──► [CircuitBuilder] ──► [SimulationOutput]  │
│        ▲                                                     │         │
│        │                                                     ▼         │
│  [Progress & Assess] ◄────── [Challenge] ◄────────────── [AI Tutor]    │
│        ▲                                                               │
│        └────────────────── [AI Visual Learning] ───────────────────────┘
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON (REST API)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Backend (FastAPI Engine)                        │
│                                                                        │
│  ┌───────────────────────┐   ┌──────────────────┐   ┌───────────────┐  │
│  │   /api/circuit        │   │     /api/ai      │   │ /api/progress │  │
│  └──────────┬────────────┘   └────────┬─────────┘   └───────┬───────┘  │
│             │                         │                     │          │
│             ▼                         ▼                     ▼          │
│  ┌───────────────────────┐   ┌──────────────────┐   ┌───────────────┐  │
│  │   quantum/simulator   │   │     ai/tutor     │   │   db/models   │  │
│  │ (Qiskit Aer Backend)  │   │  (Hint Engine)   │   │  (Assessment) │  │
│  └───────────────────────┘   └──────────────────┘   └───────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
Quantum_sih/
├── README.md                      # Project documentation and guide
├── .gitignore                     # Git ignore rules for node, python, dist, etc.
├── requirements.txt               # Backend Python dependencies
│
├── frontend/                      # React + Vite application
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html                 # Vite HTML entry point
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── main.jsx               # Application entry point
│   │   ├── App.jsx                # Router & shell layout
│   │   ├── components/            # Reusable UI widgets & quantum visualizations
│   │   ├── pages/                 # 8 Educational pages
│   │   ├── styles/                # Design tokens & component stylesheets
│   │   ├── context/               # React state context
│   │   ├── services/              # API & client services
│   │   ├── data/                  # Curriculum seed data & quiz questions
│   │   └── utils/                 # Matrix math & quantum helpers
│   ├── scripts/                   # Automated E2E verification scripts (Puppeteer)
│   └── __tests__/                 # Frontend route & visual regression tests
│
├── backend/                       # FastAPI & Qiskit simulation engine
│   ├── main.py                    # API entry point & route registration
│   ├── api/                       # REST endpoint handlers
│   │   ├── circuit.py             # Quantum circuit execution endpoints
│   │   ├── ai.py                  # AI Tutor & explanation endpoints
│   │   ├── challenge.py           # Verification & challenge endpoints
│   │   ├── progress.py            # Learner progress & analytics endpoints
│   │   └── video.py               # Video/storyboard generation endpoints
│   ├── quantum/                   # Quantum computing core
│   │   ├── simulator.py           # Qiskit simulator bridge
│   │   ├── circuit_parser.py      # Circuit JSON validator & parser
│   │   ├── challenge_evaluator.py # Unitary & measurement verification
│   │   ├── state_utils.py         # State vector & probability helpers
│   │   └── adapters/              # Multi-backend simulator adapters
│   ├── ai/                        # AI & LLM intelligence modules
│   │   ├── tutor.py               # Pedagogical dialogue orchestrator
│   │   ├── hint_engine.py         # 3-tier progressive hint engine
│   │   ├── explanation_generator.py # Concept-to-analogy synthesizer
│   │   ├── storyboard_generator.py# Visual scene storyboard builder
│   │   └── storyboard_validator.py# Educational storyboard validator
│   ├── db/                        # Data models & storage
│   │   └── models.py              # User, progress, & assessment schemas
│   └── video/                     # Video generation & transcription services
│
├── config/
│   └── config.yaml                # Application configuration & thresholds
│
├── curriculum/                    # Curriculum definitions
│   ├── lessons.yaml               # Structured lesson blueprints
│   └── challenges.yaml            # Challenge specifications & criteria
│
├── tests/                         # Backend Python test suite (pytest)
│   ├── test_challenge_evaluation.py
│   ├── test_multi_backend.py
│   ├── test_storyboard.py
│   └── test_tutor_context.py
│
├── notebooks/                     # Research & evaluation notebooks
│   ├── 01_concept_validation.ipynb
│   └── 02_eval_results.ipynb
│
└── docs/                          # Documentation & artifacts
    ├── architecture.md            # Detailed system architecture
    ├── demo_script.md             # Walkthrough script for demonstrations
    ├── evaluation.md              # Educational evaluation metrics
    └── screenshots/               # Verified UI screenshots & visual proofs
```

---

## Getting Started

### Prerequisites
- **Node.js**: >= 18.0.0 (`npm` >= 9.0.0)
- **Python**: >= 3.10

---

### 1. Frontend Setup (React + Vite)

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

To produce an optimized production bundle:
```bash
npm run build
```

---

### 2. Backend Setup (FastAPI + Qiskit)

```bash
# From the repository root, create and activate a virtual environment
python -m venv venv

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source venv/bin/activate

# Install required Python packages
pip install -r requirements.txt

# Launch the backend server
uvicorn backend.main:app --reload --port 8000
```

The API docs will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## Running Tests

### Backend Unit Tests (pytest)
```bash
python -m pytest tests/ -v
```

### Frontend Automated Verification (Puppeteer)
```bash
cd frontend
node __tests__/test_all_routes.mjs
```

---

## License

This project is developed for educational and hackathon demonstration purposes.
