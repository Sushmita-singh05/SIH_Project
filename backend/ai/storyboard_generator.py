import uuid
import json
import httpx
from typing import Dict, Any
from backend.ai.explanation_generator import get_gemini_api_key, get_model_name
from backend.ai.storyboard_validator import validate_storyboard

def _get_fallback_storyboard(topic: str) -> Dict:
    t_lower = topic.lower()
    
    if 'qubit' in t_lower:
        return {
          "lessonId": "fallback-qubit",
          "title": "Understanding Qubits",
          "topic": "Qubits",
          "difficulty": "beginner",
          "estimatedMinutes": 4,
          "source": "fallback",
          "scenes": [
            {"id":"scene-1","title":"What is a Qubit?","type":"concept","narration":"A qubit (quantum bit) is the fundamental unit of quantum information. Unlike a classical bit which is either 0 or 1, a qubit can exist in a superposition of both states simultaneously. Mathematically, a qubit state is written as |ψ⟩ = α|0⟩ + β|1⟩, where α and β are complex amplitudes satisfying |α|² + |β|² = 1.","keyConcept":"Qubits generalize classical bits to quantum mechanics"},
            {"id":"scene-2","title":"The |0⟩ State on the Bloch Sphere","type":"bloch","narration":"The computational basis state |0⟩ corresponds to the north pole of the Bloch sphere. This is the default initial state of every qubit in a quantum computer. On the Bloch sphere, the state vector points straight up along the +z axis.","keyConcept":"The |0⟩ state is the north pole of the Bloch sphere","blochData":[{"x":0.0,"y":0.0,"z":1.0,"r":1.0,"label":"|0⟩"}]},
            {"id":"scene-3","title":"Flipping a Qubit with the X Gate","type":"circuit","narration":"The Pauli-X gate is the quantum equivalent of a classical NOT gate. It flips |0⟩ to |1⟩ and |1⟩ to |0⟩. On the Bloch sphere, this is a 180° rotation around the X-axis.","keyConcept":"The X gate flips a qubit's state","circuit":{"qubits":1,"operations":[{"gate":"X","qubit":0,"step":0}]}},
            {"id":"scene-4","title":"The |1⟩ State on the Bloch Sphere","type":"bloch","narration":"After applying the X gate, the qubit is now in state |1⟩, which corresponds to the south pole of the Bloch sphere. The state vector points straight down along the -z axis. Measuring this qubit will always give outcome 1.","keyConcept":"The |1⟩ state is the south pole of the Bloch sphere","blochData":[{"x":0.0,"y":0.0,"z":-1.0,"r":1.0,"label":"|1⟩"}]},
            {"id":"scene-5","title":"Check Your Understanding","type":"quiz","question":"A qubit in state |0⟩ has X gate applied. What state is it in now?","options":["Still |0⟩","|1⟩","|+⟩ (superposition)","Undefined"],"correctIndex":1,"explanation":"The X gate flips |0⟩ to |1⟩, just like a classical NOT gate flips 0 to 1."},
            {"id":"scene-6","title":"Summary","type":"summary","narration":"You learned that a qubit is the quantum analog of a classical bit. It can be in state |0⟩, |1⟩, or a superposition of both. The Bloch sphere provides a geometric visualization where |0⟩ is the north pole and |1⟩ is the south pole. The X gate flips between these states.","keyConcept":"Qubits are visualized on the Bloch sphere and manipulated with quantum gates","takeaways":["Qubits generalize classical bits with superposition","|0⟩ = north pole, |1⟩ = south pole on Bloch sphere","X gate is the quantum NOT gate"]}
          ]
        }
    elif 'superposition' in t_lower:
        return {
          "lessonId": "fallback-superposition",
          "title": "Quantum Superposition",
          "topic": "Superposition",
          "difficulty": "beginner",
          "estimatedMinutes": 5,
          "source": "fallback",
          "scenes": [
            {"id":"scene-1","title":"What is Superposition?","type":"concept","narration":"Superposition is a fundamental principle of quantum mechanics where a qubit exists in a combination of |0⟩ and |1⟩ simultaneously. Unlike a coin that is either heads or tails, a quantum coin can be both at once — until you look at it. Mathematically: |ψ⟩ = α|0⟩ + β|1⟩ where |α|² + |β|² = 1.","keyConcept":"Superposition means existing in multiple states simultaneously"},
            {"id":"scene-2","title":"Creating Superposition with the Hadamard Gate","type":"circuit","narration":"The Hadamard (H) gate transforms |0⟩ into an equal superposition |+⟩ = (|0⟩ + |1⟩)/√2. This means the qubit has a 50% chance of being measured as 0 and a 50% chance of being measured as 1.","keyConcept":"The H gate creates equal superposition from |0⟩","circuit":{"qubits":1,"operations":[{"gate":"H","qubit":0,"step":0}]}},
            {"id":"scene-3","title":"Superposition on the Bloch Sphere","type":"bloch","narration":"The |+⟩ state sits on the equator of the Bloch sphere, pointing along the +x axis. This is exactly halfway between |0⟩ (north pole) and |1⟩ (south pole), reflecting the equal 50/50 probability distribution.","keyConcept":"Equal superposition lies on the Bloch sphere equator","blochData":[{"x":1.0,"y":0.0,"z":0.0,"r":1.0,"label":"|+⟩"}]},
            {"id":"scene-4","title":"Measuring Superposition","type":"simulation","narration":"When we measure a qubit in superposition, the quantum state collapses to either |0⟩ or |1⟩. Over 1024 measurement shots, we observe approximately 50% outcome 0 and 50% outcome 1. This is the Born rule: P(outcome) = |amplitude|².","keyConcept":"Measurement collapses superposition according to the Born rule","circuit":{"qubits":1,"operations":[{"gate":"H","qubit":0,"step":0}]},"simulationData":{"counts":{"0":512,"1":512},"probabilities":{"0":0.5,"1":0.5},"shots":1024}},
            {"id":"scene-5","title":"Check Your Understanding","type":"quiz","question":"What is the probability of measuring |0⟩ after applying a Hadamard gate to |0⟩?","options":["0%","25%","50%","100%"],"correctIndex":2,"explanation":"The Hadamard gate creates equal superposition (|0⟩ + |1⟩)/√2, giving exactly 50% probability for each outcome."},
            {"id":"scene-6","title":"Summary","type":"summary","narration":"Superposition is the quantum property that allows qubits to exist in combinations of |0⟩ and |1⟩. The Hadamard gate is the primary tool for creating superposition. Measurement collapses the superposition into a definite outcome following the Born rule.","keyConcept":"Superposition + measurement = probabilistic outcomes","takeaways":["Superposition allows qubits to be in multiple states","H gate: |0⟩ → (|0⟩ + |1⟩)/√2","Born rule determines measurement probabilities"]}
          ]
        }
    elif 'hadamard' in t_lower or 'h gate' in t_lower:
        return {
          "lessonId": "fallback-hadamard",
          "title": "The Hadamard Gate",
          "topic": "Hadamard Gate",
          "difficulty": "beginner",
          "estimatedMinutes": 4,
          "source": "fallback",
          "scenes": [
            {"id":"scene-1","title":"What is the Hadamard Gate?","type":"concept","narration":"The Hadamard (H) gate is one of the most important single-qubit gates in quantum computing. It creates superposition by mapping basis states to equal combinations. Its matrix representation is H = (1/√2)[[1,1],[1,-1]]. The H gate is its own inverse: applying it twice returns the qubit to its original state.","keyConcept":"H gate creates superposition and is self-inverse"},
            {"id":"scene-2","title":"H Gate Applied to |0⟩","type":"circuit","narration":"When applied to |0⟩, the Hadamard gate produces |+⟩ = (|0⟩ + |1⟩)/√2. Both amplitudes are positive and equal, giving a 50/50 measurement probability.","keyConcept":"H|0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2","circuit":{"qubits":1,"operations":[{"gate":"H","qubit":0,"step":0}]}},
            {"id":"scene-3","title":"The |+⟩ and |−⟩ States","type":"state","narration":"H|0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2 has amplitudes [1/√2, 1/√2]. H|1⟩ = |−⟩ = (|0⟩ − |1⟩)/√2 has amplitudes [1/√2, −1/√2]. Both give 50/50 measurement probabilities, but they differ in relative phase.","keyConcept":"Phase difference distinguishes |+⟩ from |−⟩","stateData":{"states":[{"label":"|+⟩ = H|0⟩","amplitudes":[{"basis":"|0⟩","value":"1/√2 ≈ 0.707"},{"basis":"|1⟩","value":"1/√2 ≈ 0.707"}]},{"label":"|−⟩ = H|1⟩","amplitudes":[{"basis":"|0⟩","value":"1/√2 ≈ 0.707"},{"basis":"|1⟩","value":"−1/√2 ≈ −0.707"}]}]}},
            {"id":"scene-4","title":"H Gate is Self-Inverse","type":"circuit","narration":"Applying H twice returns the qubit to its original state: HH|0⟩ = |0⟩. This is because H² = I (the identity matrix). This property makes the Hadamard gate uniquely useful for switching between computational and superposition bases.","keyConcept":"HH = I (identity)","circuit":{"qubits":1,"operations":[{"gate":"H","qubit":0,"step":0},{"gate":"H","qubit":0,"step":1}]}},
            {"id":"scene-5","title":"Check Your Understanding","type":"quiz","question":"What happens when you apply two Hadamard gates in sequence to |0⟩?","options":["You get |1⟩","You get |+⟩ superposition","You get back |0⟩","The qubit is destroyed"],"correctIndex":2,"explanation":"The Hadamard gate is self-inverse: H·H = I. Applying it twice returns the qubit to its original state."},
            {"id":"scene-6","title":"Summary","type":"summary","narration":"The Hadamard gate is the gateway to quantum computing. It creates superposition from basis states, and its self-inverse property (HH = I) makes it essential for quantum algorithms.","keyConcept":"The H gate bridges classical and quantum computation","takeaways":["H|0⟩ = (|0⟩+|1⟩)/√2 and H|1⟩ = (|0⟩−|1⟩)/√2","H is self-inverse: HH = I","Creates equal superposition with 50/50 probabilities"]}
          ]
        }
    elif 'measurement' in t_lower or 'born' in t_lower:
        return {
          "lessonId": "fallback-measurement",
          "title": "Quantum Measurement",
          "topic": "Quantum Measurement",
          "difficulty": "beginner",
          "estimatedMinutes": 5,
          "source": "fallback",
          "scenes": [
            {"id":"scene-1","title":"What is Quantum Measurement?","type":"concept","narration":"Quantum measurement is the process of extracting classical information from a quantum system. When you measure a qubit in superposition |ψ⟩ = α|0⟩ + β|1⟩, the state collapses to either |0⟩ with probability |α|² or |1⟩ with probability |β|². This irreversible collapse is a fundamental feature of quantum mechanics.","keyConcept":"Measurement collapses quantum states irreversibly"},
            {"id":"scene-2","title":"Measuring a Superposition State","type":"circuit","narration":"Let's create a superposition with H and then measure. The H gate puts qubit 0 into |+⟩ = (|0⟩ + |1⟩)/√2. Upon measurement, we get |0⟩ or |1⟩ each with 50% probability.","keyConcept":"Measurement of |+⟩ gives 50/50 outcomes","circuit":{"qubits":1,"operations":[{"gate":"H","qubit":0,"step":0}]}},
            {"id":"scene-3","title":"The Born Rule in Action","type":"simulation","narration":"The Born rule states P(x) = |⟨x|ψ⟩|². Over many measurement shots, the distribution converges to these theoretical probabilities. With 1024 shots on |+⟩, we see approximately 512 outcomes of 0 and 512 of 1.","keyConcept":"Born rule: P(outcome) = |amplitude|²","circuit":{"qubits":1,"operations":[{"gate":"H","qubit":0,"step":0}]},"simulationData":{"counts":{"0":518,"1":506},"probabilities":{"0":0.506,"1":0.494},"shots":1024}},
            {"id":"scene-4","title":"Deterministic vs Probabilistic","type":"comparison","narration":"Compare: A qubit in |0⟩ measured directly always gives 0 (deterministic). A qubit with H gate measured gives 50/50 (probabilistic). The gate determines whether the outcome is certain or random.","keyConcept":"Superposition introduces quantum randomness","comparisonData":{"left":{"label":"No H gate (|0⟩)","counts":{"0":1024,"1":0}},"right":{"label":"With H gate (|+⟩)","counts":{"0":512,"1":512}}}},
            {"id":"scene-5","title":"Check Your Understanding","type":"quiz","question":"A qubit is in state |ψ⟩ = √(3/4)|0⟩ + √(1/4)|1⟩. What is the probability of measuring |1⟩?","options":["75%","50%","25%","0%"],"correctIndex":2,"explanation":"By the Born rule, P(|1⟩) = |√(1/4)|² = 1/4 = 25%."},
            {"id":"scene-6","title":"Summary","type":"summary","narration":"Quantum measurement collapses superposition into definite outcomes. The Born rule governs the probability: P(x) = |amplitude|². Measurement is irreversible — once collapsed, the original superposition is lost.","keyConcept":"Measurement and the Born rule are central to quantum mechanics","takeaways":["Measurement collapses superposition","Born rule: P(x) = |⟨x|ψ⟩|²","Measurement is irreversible"]}
          ]
        }
    elif 'entangle' in t_lower:
        return {
          "lessonId": "fallback-entanglement",
          "title": "Quantum Entanglement",
          "topic": "Quantum Entanglement",
          "difficulty": "beginner",
          "estimatedMinutes": 5,
          "source": "fallback",
          "scenes": [
            {"id":"scene-1","title":"What is Entanglement?","type":"concept","narration":"Quantum entanglement is a correlation between two or more qubits that cannot be explained by classical physics. When qubits are entangled, measuring one qubit instantly determines the state of the other, regardless of the distance between them. Einstein called this 'spooky action at a distance'.","keyConcept":"Entangled qubits share quantum correlations"},
            {"id":"scene-2","title":"Step 1: Create Superposition","type":"circuit","narration":"Entanglement starts with superposition. Apply a Hadamard gate to qubit 0 to create |+⟩ = (|0⟩ + |1⟩)/√2. Qubit 1 remains in |0⟩. The two-qubit state is now (|00⟩ + |10⟩)/√2 — a product state, not yet entangled.","keyConcept":"Superposition is the first step toward entanglement","circuit":{"qubits":2,"operations":[{"gate":"H","qubit":0,"step":0}]}},
            {"id":"scene-3","title":"Step 2: Entangle with CNOT","type":"circuit","narration":"The CNOT gate flips the target qubit (q1) when the control qubit (q0) is |1⟩. Applied after H, it transforms (|00⟩ + |10⟩)/√2 into (|00⟩ + |11⟩)/√2. Now the qubits are entangled — their outcomes are perfectly correlated.","keyConcept":"CNOT on a superposed qubit creates entanglement","circuit":{"qubits":2,"operations":[{"gate":"H","qubit":0,"step":0},{"gate":"CNOT","control":0,"target":1,"qubit":1,"step":1}]}},
            {"id":"scene-4","title":"Entangled Measurement Results","type":"simulation","narration":"Measuring the entangled state (|00⟩ + |11⟩)/√2 reveals perfect correlation: both qubits always agree. You see ~50% |00⟩ and ~50% |11⟩, but never |01⟩ or |10⟩. This is the hallmark of quantum entanglement.","keyConcept":"Entangled qubits produce correlated measurements","circuit":{"qubits":2,"operations":[{"gate":"H","qubit":0,"step":0},{"gate":"CNOT","control":0,"target":1,"qubit":1,"step":1}]},"simulationData":{"counts":{"00":512,"11":512},"probabilities":{"00":0.5,"11":0.5},"shots":1024}},
            {"id":"scene-5","title":"Check Your Understanding","type":"quiz","question":"After creating (|00⟩ + |11⟩)/√2, what outcomes are possible when measuring?","options":["Only |00⟩","Only |11⟩","|00⟩ or |11⟩ (each ~50%)","All four: |00⟩, |01⟩, |10⟩, |11⟩"],"correctIndex":2,"explanation":"The entangled state (|00⟩ + |11⟩)/√2 can only produce |00⟩ or |11⟩. The qubits are perfectly correlated."},
            {"id":"scene-6","title":"Summary","type":"summary","narration":"Quantum entanglement creates correlations that have no classical analog. The recipe is H + CNOT: put one qubit in superposition, then use CNOT to correlate it with another. Measurement of entangled qubits always produces correlated results.","keyConcept":"H + CNOT = Entanglement","takeaways":["Entanglement = non-classical correlation","Recipe: H gate → CNOT","Measurement outcomes are perfectly correlated"]}
          ]
        }
    elif 'bell' in t_lower:
        return {
          "lessonId": "fallback-bell-state",
          "title": "The Bell State",
          "topic": "Bell State",
          "difficulty": "beginner",
          "estimatedMinutes": 6,
          "source": "fallback",
          "scenes": [
            {"id":"scene-1","title":"What is a Bell State?","type":"concept","narration":"A Bell state is a maximally entangled two-qubit quantum state. There are four Bell states, and the most common one is |Φ⁺⟩ = (|00⟩ + |11⟩)/√2. Bell states are fundamental to quantum teleportation, superdense coding, and quantum error correction.","keyConcept":"Bell states are maximally entangled two-qubit states"},
            {"id":"scene-2","title":"Step 1: Start with |00⟩","type":"bloch","narration":"Both qubits start in the |0⟩ state. On the Bloch sphere, both state vectors point to the north pole (+z). The combined two-qubit state is |00⟩.","keyConcept":"Both qubits initialize to |0⟩","blochData":[{"x":0.0,"y":0.0,"z":1.0,"r":1.0,"label":"q0: |0⟩"},{"x":0.0,"y":0.0,"z":1.0,"r":1.0,"label":"q1: |0⟩"}]},
            {"id":"scene-3","title":"Step 2: Apply Hadamard to q0","type":"circuit","narration":"The Hadamard gate on qubit 0 creates superposition: |00⟩ → (|0⟩ + |1⟩)/√2 ⊗ |0⟩ = (|00⟩ + |10⟩)/√2. Qubit 0 is now in superposition while qubit 1 remains |0⟩. They are NOT yet entangled.","keyConcept":"H creates superposition on one qubit","circuit":{"qubits":2,"operations":[{"gate":"H","qubit":0,"step":0}]}},
            {"id":"scene-4","title":"Step 3: Apply CNOT","type":"circuit","narration":"CNOT with q0 as control and q1 as target transforms (|00⟩ + |10⟩)/√2 into (|00⟩ + |11⟩)/√2 = |Φ⁺⟩. The CNOT flipped q1 only in the |10⟩ component, creating perfect correlation.","keyConcept":"CNOT creates entanglement from superposition","circuit":{"qubits":2,"operations":[{"gate":"H","qubit":0,"step":0},{"gate":"CNOT","control":0,"target":1,"qubit":1,"step":1}]}},
            {"id":"scene-5","title":"Bell State Measurements","type":"simulation","narration":"The Bell state |Φ⁺⟩ produces perfectly correlated measurements: ~50% |00⟩ and ~50% |11⟩. The probabilities of |01⟩ and |10⟩ are exactly zero. This proves the qubits are entangled.","keyConcept":"Bell state measurements are perfectly correlated","circuit":{"qubits":2,"operations":[{"gate":"H","qubit":0,"step":0},{"gate":"CNOT","control":0,"target":1,"qubit":1,"step":1}]},"simulationData":{"counts":{"00":519,"11":505},"probabilities":{"00":0.507,"11":0.493},"shots":1024}},
            {"id":"scene-6","title":"Check Your Understanding","type":"quiz","question":"Which gates are needed to create the Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2?","options":["X then CNOT","H then CNOT","CNOT then H","H then H"],"correctIndex":1,"explanation":"The Bell state is created by first applying H to qubit 0 (creating superposition), then CNOT with q0 as control and q1 as target."},
            {"id":"scene-7","title":"Summary","type":"summary","narration":"The Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 is the simplest example of maximal entanglement. It is created with just two gates: H on q0 followed by CNOT(q0→q1). Bell states are the building blocks of quantum communication protocols.","keyConcept":"H + CNOT = Bell State |Φ⁺⟩","takeaways":["Bell state = maximally entangled 2-qubit state","Circuit: H(q0) → CNOT(q0, q1)","Measurements: only |00⟩ and |11⟩, perfectly correlated","Foundation for quantum teleportation and superdense coding"]}
          ]
        }
    elif 'cnot' in t_lower or 'controlled' in t_lower:
        return {
          "lessonId": "fallback-cnot",
          "title": "The CNOT Gate",
          "topic": "CNOT Gate",
          "difficulty": "beginner",
          "estimatedMinutes": 4,
          "source": "fallback",
          "scenes": [
            {"id":"scene-1","title":"What is the CNOT Gate?","type":"concept","narration":"The Controlled-NOT (CNOT) gate is a two-qubit gate that is essential for creating entanglement. It has a control qubit and a target qubit. If the control qubit is |1⟩, the target qubit is flipped (NOT operation). If the control is |0⟩, nothing happens to the target.","keyConcept":"CNOT flips the target qubit when control is |1⟩"},
            {"id":"scene-2","title":"CNOT on |10⟩","type":"circuit","narration":"Starting with |10⟩ (q0=1, q1=0): Since the control qubit (q0) is |1⟩, the CNOT flips the target (q1) from |0⟩ to |1⟩. Result: |11⟩.","keyConcept":"Control=|1⟩ → target flips","circuit":{"qubits":2,"operations":[{"gate":"X","qubit":0,"step":0},{"gate":"CNOT","control":0,"target":1,"qubit":1,"step":1}]}},
            {"id":"scene-3","title":"CNOT on |00⟩","type":"circuit","narration":"Starting with |00⟩ (q0=0, q1=0): Since the control qubit (q0) is |0⟩, CNOT does nothing. The target qubit stays |0⟩. Result: |00⟩.","keyConcept":"Control=|0⟩ → target unchanged","circuit":{"qubits":2,"operations":[{"gate":"CNOT","control":0,"target":1,"qubit":1,"step":0}]}},
            {"id":"scene-4","title":"CNOT Truth Table","type":"comparison","narration":"CNOT acts like a conditional XOR: |control, target⟩ → |control, control⊕target⟩. Input |00⟩→|00⟩, |01⟩→|01⟩, |10⟩→|11⟩, |11⟩→|10⟩. Only when control=1 does the target change.","keyConcept":"CNOT implements reversible XOR","comparisonData":{"left":{"label":"Input States","counts":{"00":256,"01":256,"10":256,"11":256}},"right":{"label":"After CNOT","counts":{"00":256,"01":256,"11":256,"10":256}}}},
            {"id":"scene-5","title":"Check Your Understanding","type":"quiz","question":"What is the output of CNOT applied to |11⟩ (control=q0, target=q1)?","options":["|11⟩","|10⟩","|01⟩","|00⟩"],"correctIndex":1,"explanation":"Control q0 is |1⟩, so target q1 is flipped: |1⟩→|0⟩. Result is |10⟩."},
            {"id":"scene-6","title":"Summary","type":"summary","narration":"The CNOT gate is the most important two-qubit gate. It conditionally flips the target based on the control qubit. Combined with superposition (H gate), CNOT creates quantum entanglement.","keyConcept":"CNOT + superposition = entanglement","takeaways":["CNOT flips target when control = |1⟩","Does nothing when control = |0⟩","Essential for creating entanglement with H gate","Implements reversible XOR"]}
          ]
        }
    else:
        return {
          "lessonId": "fallback-generic",
          "title": "Topic Not Supported",
          "topic": topic,
          "difficulty": "beginner",
          "estimatedMinutes": 1,
          "source": "fallback",
          "scenes": [
              {"id":"scene-1", "title": "Unsupported", "type": "concept", "narration": "This topic is not currently supported in fallback mode. Try 'Qubits', 'Superposition', 'Hadamard', 'Measurement', 'Entanglement', 'Bell State', or 'CNOT'."}
          ]
        }

async def _generate_with_gemini(topic: str, difficulty: str, language: str, api_key: str) -> Dict:
    model = get_model_name()
    prompt = f"""
    Generate a highly structured JSON storyboard for the quantum topic: '{topic}'.
    Difficulty: {difficulty}, Language: {language}.
    You MUST return ONLY valid JSON matching this schema exactly, and nothing else.
    {{
      "title": "string",
      "topic": "string",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedMinutes": 5,
      "scenes": [
        {{
          "id": "scene-1",
          "title": "string",
          "type": "concept|circuit|bloch|simulation|state|comparison|quiz|summary",
          "narration": "2-4 sentences",
          "keyConcept": "string",
          "circuit": {{ "qubits": 2, "operations": [{{"gate":"H","qubit":0,"step":0}}] }},
          "blochData": [{{"x":1.0,"y":0.0,"z":0.0,"r":1.0,"label":"|+⟩"}}],
          "simulationData": {{ "counts":{{"00":512,"11":512}}, "probabilities":{{"00":0.5,"11":0.5}}, "shots":1024 }},
          "question": "string",
          "options": ["A","B","C","D"],
          "correctIndex": 2,
          "explanation": "string"
        }}
      ]
    }}
    IMPORTANT: Use only these gates: H, X, Y, Z, S, T, CNOT, CX, SWAP, CCNOT, CCX, TOFFOLI.
    Must include at least one quiz scene and one summary scene.
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 4096
        }
    }
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        
    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        raise ValueError("No candidates returned from Gemini")
        
    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    
    # Strip markdown
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
        
    storyboard = json.loads(text.strip())
    storyboard["lessonId"] = uuid.uuid4().hex[:12]
    storyboard["source"] = "gemini"
    
    return storyboard

async def generate_storyboard(topic: str, difficulty: str = 'beginner', language: str = 'English') -> Dict[str, Any]:
    api_key = get_gemini_api_key()
    
    storyboard = None
    if api_key:
        try:
            storyboard = await _generate_with_gemini(topic, difficulty, language, api_key)
        except Exception:
            pass
            
    if not storyboard:
        storyboard = _get_fallback_storyboard(topic)
        
    is_valid, cleaned, errors = validate_storyboard(storyboard)
    
    if not is_valid:
        storyboard = _get_fallback_storyboard(topic)
        _, cleaned, _ = validate_storyboard(storyboard)
        
    return cleaned
