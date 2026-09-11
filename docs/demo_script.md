# QuantumLeap-AI Prototype Demo Script

## Flow Summary
This walkthrough demonstrates the end-to-end learning lifecycle on QuantumLeap-AI:
**Learn → Build → Simulate → Explain → Assess**

---

### Step 1: Dashboard (`/`)
- Student Alex Johnson lands on the EdTech Dashboard.
- Highlights: "Unit 1: Quantum Foundations", 62% current unit progress, and recommended next lesson.
- **Action**: Click **"Continue Learning"** on the Superposition card.

### Step 2: Superposition Lesson (`/lesson`)
- Reads theoretical explanation of basis states $|0\rangle$ and $|1\rangle$, and linear combination $|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$.
- Interacts with dynamic probability distribution bars.
- Solves Mini-Quiz: "What is the probability of measuring $|0\rangle$ after Hadamard?" -> Selects Option C (50%) -> verifies instant feedback.
- **Action**: Click **"Start Building →"**.

### Step 3: Circuit Builder (`/circuit-builder`)
- Opens the interactive quantum circuit builder.
- Selects the **H** (Hadamard) gate from the palette.
- Places the H gate on qubit `q0` at Step 1.
- Circuit stats automatically update: Qubits: 2, Gates: 1, Depth: 1.
- **Action**: Click **"Run Simulation →"**.

### Step 4: Simulation Output (`/simulation-output`)
- Displays realistic simulated output for 1,024 shots:
  - Histogram: $|0\rangle \approx 50\%$, $|1\rangle \approx 50\%$.
  - 3D Bloch Sphere SVG: Vector pointing to $|+\rangle$ on the positive X-axis equator.
  - State Vector: $|\psi\rangle = 0.707|0\rangle + 0.707|1\rangle$.
- Tests **"Run Again"** with realistic statistical noise.
- **Action**: Click **"Explain This Result →"**.

### Step 5: AI Tutor (`/ai-tutor`)
- Tutor context ingestion clearly displays grounded inputs:
  - Current Lesson: Superposition | Level: Beginner | Circuit: Hadamard (H) on q0
- Reads contextual AI explanation linking the circuit transformation to the Bloch sphere equator.
- Uses **"Show Next Hint"** to step through Hint 1 → Hint 2 → Hint 3.
- **Action**: Click **"Try Another Challenge"**.

### Step 6: Bell State Challenge (`/challenge`)
- Challenge prompt: "Build a Bell State ($|00\rangle \approx 50\%, |11\rangle \approx 50\%$)".
- Places **H** on `q0`, followed by **CNOT** with control `q0` and target `q1`.
- Clicks **"Check My Circuit →"** -> Validates correct circuit.
- Observes 100% score card with time elapsed and hints used metrics.
- Solves the post-assessment Learning Check question.
- **Action**: Click **"Continue to Assessment →"**.

### Step 7: Progress & Assessment (`/progress`)
- Views measurable learning gain metrics:
  - Overall Mastery: **72%** (SVG radial gauge).
  - Pre-Assessment (55%) vs Post-Assessment (80%) -> **+25% Learning Gain**.
  - Concept Mastery breakdown (Superposition 90%, Entanglement 55%).
- Demonstrates return navigation: **"Practice Weak Concept"** or **"Back to Dashboard"**.
