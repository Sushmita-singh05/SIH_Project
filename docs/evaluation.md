# QuantumLeap-AI Evaluation Framework

## 1. Pedagogical Evaluation Methodology
QuantumLeap-AI evaluates educational efficacy through measurable pre- and post-intervention learning gains.

### Metrics Defined
1. **Normalized Learning Gain ($g$)**:
   $$g = \frac{\text{Post-Score} - \text{Pre-Score}}{100 - \text{Pre-Score}}$$
   In current prototype baseline:
   $$g = \frac{80 - 55}{100 - 55} = \frac{25}{45} \approx 0.56 \quad (\text{Moderate-to-High Gain})$$

2. **Hint Dependency Index (HDI)**:
   $$\text{HDI} = \frac{\sum \text{Hints Requested}}{\text{Total Challenges Completed}}$$
   Current prototype average: $1.4$ hints per challenge (scale 1 to 3).

3. **Time-to-Correct (TTC)**:
   Elapsed time from challenge start to valid circuit submission (prototype baseline: $42\text{ sec}$).

---

## 2. Concept Competency Matrix
| Competency | Baseline Score | Target Post-Lesson | Prototype Assessment |
|------------|---------------|-------------------|----------------------|
| Qubits & Basis States | 60% | 85% | 85% (Strong) |
| Superposition | 50% | 85% | 90% (Strong) |
| Measurement | 55% | 80% | 78% (Good) |
| Quantum Gates | 50% | 75% | 72% (Developing) |
| Entanglement | 35% | 70% | 55% (Needs Practice) |
| Bell States | 40% | 75% | 60% (Developing) |
