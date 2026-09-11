# QuantumLeap-AI System Architecture

## 1. Overview
QuantumLeap-AI is an AI-powered interactive quantum computing education platform designed to move students from theoretical physics concepts to practical quantum circuit intuition.

The core educational philosophy follows a 5-stage experiential loop:
```
Learn ──► Build ──► Simulate ──► Explain ──► Assess
```

---

## 2. Full-Stack Architectural Blueprint

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                         │
│                                                                        │
│  [Dashboard] ──► [Lesson] ──► [CircuitBuilder] ──► [SimulationOutput]  │
│        ▲                                                     │         │
│        │                                                     ▼         │
│  [Progress & Assess] ◄────── [Challenge] ◄────────────── [AI Tutor]    │
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

## 3. Frontend Architecture

- **Build Tool**: Vite with React 19
- **Routing**: React Router DOM (Declarative client-side routing)
- **State Flow**:
  - `localStorage['ql_circuit']`: Transports user-constructed quantum circuits from CircuitBuilder to Simulator.
  - `localStorage['ql_sim_context']`: Transports simulation counts, state vector, and circuit operations to the AI Tutor for grounded explanations.
- **Component Breakdown**:
  - `components/Layout/`: Sidebar, TopHeader
  - `components/CircuitBuilder/`: GatePalette, CircuitGrid, CircuitStats
  - `components/Visualization/`: HistogramChart, BlochSphereSvg (Isometric 3D projection), StateVectorTable
  - `components/AITutor/`: TutorContextCard, ProgressiveHints (3-tiered hint engine)
  - `components/Progress/`: MasteryGauge (SVG circular meter), PrePostComparison, ConceptList

---

## 4. Backend Architecture (Scaffolded for Integration)

1. **`api/circuit.py`**: Accepts circuit JSON, invokes Qiskit Aer simulation, returns counts and state vectors.
2. **`api/ai.py`**: Accepts circuit context and student hint level, generates grounded pedagogical explanations.
3. **`api/progress.py`**: Aggregates lesson completion, challenge validations, and pre/post assessment learning gains.
4. **`quantum/simulator.py`**: Pure Qiskit bridge translating UI gate matrices into quantum circuits.
5. **`ai/hint_engine.py`**: Socratic progressive hint ladder (Conceptual -> Structural -> Direct Insight).
