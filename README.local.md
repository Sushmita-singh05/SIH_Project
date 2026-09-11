# QuantumLeap-AI

> **Interactive, Context-Aware Quantum Computing Education Platform**  
> Move learners from abstract linear algebra to intuitive quantum circuit mastery through a structured 5-stage experiential cycle:  
> **Learn → Build → Simulate → Explain → Assess**

---

## Prototype Status
All 7 educational screens are fully implemented, interactive, and tested:
1. **Dashboard**: Unit curriculum roadmap, metrics, and quick challenge entry.
2. **Superposition Lesson**: Interactive basis state visualization and mini-quiz.
3. **Circuit Builder**: Multi-qubit gate drag/click canvas with JSON export.
4. **Simulation Output**: Quantum measurement histogram, SVG Bloch sphere, and state vectors.
5. **AI Tutor**: Context-aware grounded guidance with a 3-tiered progressive hint engine.
6. **Bell State Challenge**: Simplified circuit verification and pre/post conceptual check.
7. **Progress & Assessment**: Measurable learning gain (+25 percentage points), concept mastery, and radial gauge.

---

## Project Structure
```
quantumleap-ai/
├── README.md
├── requirements.txt
├── config/
│   └── config.yaml
├── backend/                  # FastAPI & Qiskit simulation backend (scaffold)
│   ├── api/
│   ├── quantum/
│   ├── ai/
│   └── db/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/       # Reusable layout & quantum widgets
│   │   ├── pages/            # 7 Educational screens
│   │   └── styles/           # Design system tokens & modular styles
├── curriculum/               # Structured lesson & challenge YAML definitions
├── notebooks/                # Jupyter evaluation notebooks
├── tests/                    # Python unit test scaffold
└── docs/                     # Architecture, demo script, and eval documentation
```

---

## Quick Start (Frontend React App)

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
