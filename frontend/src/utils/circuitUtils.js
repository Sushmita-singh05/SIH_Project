/**
 * QuantumLeap-AI — Circuit Utilities
 *
 * Single source-of-truth conversion layer between:
 *   Visual Grid  ↔  operations[]  ↔  Qiskit Code  ↔  Backend Payload
 *
 * Every other module reads / writes the canonical `operations[]` array.
 */

// ────────────────────────────────────────────
//  Gate Metadata
// ────────────────────────────────────────────
const SINGLE_QUBIT_GATES = ['H', 'X', 'Y', 'Z', 'S', 'T'];
const PARAMETERIZED_GATES = ['RX', 'RY', 'RZ'];
const TWO_QUBIT_GATES = ['CNOT', 'CX', 'CZ', 'SWAP'];
const THREE_QUBIT_GATES = ['TOFFOLI', 'CCX'];
const SPECIAL_OPS = ['M', 'MEASURE', 'RESET'];

// Qiskit method name → internal gate name
const QISKIT_TO_GATE = {
  h: 'H', x: 'X', y: 'Y', z: 'Z', s: 'S', t: 'T',
  rx: 'RX', ry: 'RY', rz: 'RZ',
  cx: 'CNOT', cnot: 'CNOT', cz: 'CZ', swap: 'SWAP',
  ccx: 'TOFFOLI',
  measure: 'M', reset: 'RESET',
};

// Internal gate name → Qiskit method
const GATE_TO_QISKIT = {
  H: 'h', X: 'x', Y: 'y', Z: 'z', S: 's', T: 't',
  RX: 'rx', RY: 'ry', RZ: 'rz',
  CNOT: 'cx', CX: 'cx', CZ: 'cz', SWAP: 'swap',
  TOFFOLI: 'ccx', CCX: 'ccx',
  M: 'measure', MEASURE: 'measure', RESET: 'reset',
};

// ────────────────────────────────────────────
//  Grid → Operations
// ────────────────────────────────────────────

/**
 * Convert a 2D visual grid into the canonical operations array.
 *
 * Grid format: grid[qubitIdx][stepIdx] = gateName | null
 *
 * Multi-qubit logic:
 *   • Two CNOT markers at the same step → one CNOT op (min→control, max→target)
 *   • Single CNOT marker → default control = qubit, target = nearest neighbor
 *   • Same rules for SWAP / CZ
 */
export function gridToOperations(grid) {
  const operations = [];
  const stepMap = {};

  for (let q = 0; q < grid.length; q++) {
    for (let s = 0; s < grid[q].length; s++) {
      const gate = grid[q][s];
      if (gate) {
        if (!stepMap[s]) stepMap[s] = [];
        stepMap[s].push({ gate, qubit: q, step: s });
      }
    }
  }

  const sortedSteps = Object.keys(stepMap).map(Number).sort((a, b) => a - b);

  for (const s of sortedSteps) {
    const stepOps = stepMap[s];

    // Group multi-qubit markers
    const multiGate = (name) => stepOps.filter((o) => o.gate === name);

    const cnots = multiGate('CNOT');
    const swaps = multiGate('SWAP');
    const czs   = multiGate('CZ');

    const handled = new Set();

    if (cnots.length >= 2) {
      const qs = cnots.map((o) => o.qubit).sort((a, b) => a - b);
      operations.push({ gate: 'CNOT', qubit: qs[1], step: s, control: qs[0], target: qs[1] });
      cnots.forEach((o) => handled.add(o));
    } else if (cnots.length === 1) {
      const c = cnots[0].qubit;
      const t = c < grid.length - 1 ? c + 1 : c - 1;
      operations.push({ gate: 'CNOT', qubit: Math.max(c, t), step: s, control: Math.min(c, t), target: Math.max(c, t) });
      handled.add(cnots[0]);
    }

    if (swaps.length >= 2) {
      const qs = swaps.map((o) => o.qubit).sort((a, b) => a - b);
      operations.push({ gate: 'SWAP', qubit: qs[0], step: s, control: qs[0], target: qs[1] });
      swaps.forEach((o) => handled.add(o));
    } else if (swaps.length === 1) {
      const q = swaps[0].qubit;
      const t = q < grid.length - 1 ? q + 1 : q - 1;
      operations.push({ gate: 'SWAP', qubit: q, step: s, control: Math.min(q, t), target: Math.max(q, t) });
      handled.add(swaps[0]);
    }

    if (czs.length >= 2) {
      const qs = czs.map((o) => o.qubit).sort((a, b) => a - b);
      operations.push({ gate: 'CZ', qubit: qs[1], step: s, control: qs[0], target: qs[1] });
      czs.forEach((o) => handled.add(o));
    } else if (czs.length === 1) {
      const q = czs[0].qubit;
      const t = q < grid.length - 1 ? q + 1 : q - 1;
      operations.push({ gate: 'CZ', qubit: Math.max(q, t), step: s, control: Math.min(q, t), target: Math.max(q, t) });
      handled.add(czs[0]);
    }

    // Remaining single-qubit ops
    for (const o of stepOps) {
      if (!handled.has(o)) operations.push(o);
    }
  }

  return operations;
}

// ────────────────────────────────────────────
//  Operations → Grid
// ────────────────────────────────────────────

/**
 * Rebuild a visual grid from the operations array.
 */
export function operationsToGrid(operations, numQubits, numSteps = 8) {
  const grid = Array.from({ length: numQubits }, () => Array(numSteps).fill(null));

  for (const op of operations) {
    const step = op.step || 0;
    if (step >= numSteps) continue;

    if (op.gate === 'CNOT' || op.gate === 'CX') {
      const c = op.control != null ? op.control : op.qubit;
      const t = op.target != null ? op.target : (c === 0 ? 1 : 0);
      if (c < numQubits) grid[c][step] = 'CNOT';
      if (t < numQubits) grid[t][step] = 'CNOT';
    } else if (op.gate === 'SWAP') {
      const q1 = op.control != null ? op.control : op.qubit;
      const q2 = op.target != null ? op.target : (q1 === 0 ? 1 : 0);
      if (q1 < numQubits) grid[q1][step] = 'SWAP';
      if (q2 < numQubits) grid[q2][step] = 'SWAP';
    } else if (op.gate === 'CZ') {
      const c = op.control != null ? op.control : op.qubit;
      const t = op.target != null ? op.target : (c === 0 ? 1 : 0);
      if (c < numQubits) grid[c][step] = 'CZ';
      if (t < numQubits) grid[t][step] = 'CZ';
    } else {
      const q = op.qubit || 0;
      if (q < numQubits) grid[q][step] = op.gate;
    }
  }

  return grid;
}

// ────────────────────────────────────────────
//  Operations → Qiskit Code
// ────────────────────────────────────────────

/**
 * Generate Qiskit-style Python code from the operations array.
 */
export function operationsToQiskitCode(operations, numQubits) {
  const lines = [
    'from qiskit import QuantumCircuit',
    '',
    `qc = QuantumCircuit(${numQubits})`,
    '',
  ];

  const sorted = [...operations].sort((a, b) => (a.step || 0) - (b.step || 0));

  for (const op of sorted) {
    const gate = op.gate.toUpperCase();
    const method = GATE_TO_QISKIT[gate];
    if (!method) continue;

    if (gate === 'CNOT' || gate === 'CX') {
      const c = op.control != null ? op.control : 0;
      const t = op.target != null ? op.target : 1;
      lines.push(`qc.cx(${c}, ${t})`);
    } else if (gate === 'CZ') {
      const c = op.control != null ? op.control : 0;
      const t = op.target != null ? op.target : 1;
      lines.push(`qc.cz(${c}, ${t})`);
    } else if (gate === 'SWAP') {
      const q1 = op.control != null ? op.control : (op.qubit || 0);
      const q2 = op.target != null ? op.target : 1;
      lines.push(`qc.swap(${q1}, ${q2})`);
    } else if (gate === 'TOFFOLI' || gate === 'CCX') {
      const c1 = op.control1 != null ? op.control1 : 0;
      const c2 = op.control2 != null ? op.control2 : 1;
      const t  = op.target   != null ? op.target   : 2;
      lines.push(`qc.ccx(${c1}, ${c2}, ${t})`);
    } else if (['RX', 'RY', 'RZ'].includes(gate)) {
      const angle = op.params && op.params[0] != null ? op.params[0] : 'pi/2';
      lines.push(`qc.${method}(${angle}, ${op.qubit || 0})`);
    } else if (gate === 'M' || gate === 'MEASURE') {
      lines.push(`qc.measure(${op.qubit || 0}, ${op.qubit || 0})`);
    } else if (gate === 'RESET') {
      lines.push(`qc.reset(${op.qubit || 0})`);
    } else {
      // Single-qubit gate (H, X, Y, Z, S, T)
      lines.push(`qc.${method}(${op.qubit || 0})`);
    }
  }

  return lines.join('\n');
}

// ────────────────────────────────────────────
//  Qiskit Code → Operations
// ────────────────────────────────────────────

/**
 * Parse a simple angle expression.  Handles `pi`, `math.pi`, `np.pi`,
 * numeric literals, and basic arithmetic (+, -, *, /).
 */
function parseAngle(str) {
  let s = str.trim();
  s = s.replace(/math\.pi/g, String(Math.PI));
  s = s.replace(/numpy\.pi/g, String(Math.PI));
  s = s.replace(/np\.pi/g, String(Math.PI));
  s = s.replace(/(?<![a-zA-Z])pi(?![a-zA-Z])/g, String(Math.PI));

  // Only allow digits, dot, operators, parens, whitespace — nothing else
  if (/^[\d.+\-*/() e]+$/i.test(s)) {
    try {
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + s + ')')();
      if (typeof result === 'number' && Number.isFinite(result)) return result;
    } catch { /* fall through */ }
  }

  const num = parseFloat(s);
  if (Number.isNaN(num)) throw new Error('Invalid angle');
  return num;
}

/**
 * Parse Qiskit-style Python code into operations + numQubits.
 *
 * Returns `{ numQubits, operations, errors }`.
 * Errors are human-readable strings with line numbers.
 */
export function qiskitCodeToOperations(code) {
  const errors = [];
  let numQubits = 2; // default
  const operations = [];
  let stepCounter = 0;

  const lines = code.split('\n');

  // ── Pass 1: find QuantumCircuit constructor ──
  for (const line of lines) {
    const m = line.trim().match(/QuantumCircuit\(\s*(\d+)\s*\)/);
    if (m) {
      numQubits = parseInt(m[1], 10);
      if (numQubits < 1 || numQubits > 10) {
        errors.push(`Number of qubits must be between 1 and 10, got ${numQubits}.`);
        numQubits = Math.max(1, Math.min(10, numQubits));
      }
      break;
    }
  }

  // ── Pass 2: parse gate operations ──
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();

    // Skip blanks, comments, imports, constructor
    if (!line || line.startsWith('#') || line.startsWith('from ') || line.startsWith('import ')) continue;
    if (/QuantumCircuit\(/.test(line)) continue;

    // Match pattern:  qc.method( args )
    const gateMatch = line.match(/^(\w+)\.(\w+)\(\s*([^)]*)\s*\)/);
    if (!gateMatch) {
      // If it looks like a method call we didn't parse, warn
      if (/^\w+\./.test(line)) {
        errors.push(`Line ${lineNum}: Could not parse "${line}".`);
      }
      continue;
    }

    const [, /* varName */, method, argsStr] = gateMatch;
    const methodLower = method.toLowerCase();
    const gateName = QISKIT_TO_GATE[methodLower];

    if (!gateName) {
      errors.push(`Line ${lineNum}: Unsupported operation: qc.${method}()`);
      continue;
    }

    const args = argsStr.split(',').map((a) => a.trim()).filter((a) => a.length > 0);

    // ── Single-qubit gates ──
    if (SINGLE_QUBIT_GATES.includes(gateName)) {
      const qubit = args.length > 0 ? parseInt(args[0], 10) : 0;
      if (Number.isNaN(qubit)) { errors.push(`Line ${lineNum}: Invalid qubit index "${args[0]}".`); continue; }
      if (qubit < 0 || qubit >= numQubits) { errors.push(`Line ${lineNum}: Qubit ${qubit} does not exist. Current circuit has ${numQubits} qubit${numQubits !== 1 ? 's' : ''} (0–${numQubits - 1}).`); continue; }
      operations.push({ gate: gateName, qubit, step: stepCounter++ });
      continue;
    }

    // ── Parameterized gates ──
    if (PARAMETERIZED_GATES.includes(gateName)) {
      if (args.length < 2) { errors.push(`Line ${lineNum}: Gate ${method} requires an angle parameter, e.g. qc.${method}(3.14, 0)`); continue; }
      let angle;
      try { angle = parseAngle(args[0]); } catch { errors.push(`Line ${lineNum}: Invalid angle parameter "${args[0]}".`); continue; }
      const qubit = parseInt(args[1], 10);
      if (Number.isNaN(qubit) || qubit < 0 || qubit >= numQubits) { errors.push(`Line ${lineNum}: Qubit ${qubit >= 0 ? qubit : args[1]} does not exist. Current circuit has ${numQubits} qubit${numQubits !== 1 ? 's' : ''} (0–${numQubits - 1}).`); continue; }
      operations.push({ gate: gateName, qubit, step: stepCounter++, params: [angle] });
      continue;
    }

    // ── Two-qubit gates ──
    if (gateName === 'CNOT') {
      if (args.length < 2) { errors.push(`Line ${lineNum}: CNOT gate requires two qubit arguments, e.g. qc.cx(0, 1)`); continue; }
      const control = parseInt(args[0], 10);
      const target  = parseInt(args[1], 10);
      if (Number.isNaN(control) || Number.isNaN(target)) { errors.push(`Line ${lineNum}: Invalid qubit indices for CNOT gate.`); continue; }
      if (control < 0 || control >= numQubits) { errors.push(`Line ${lineNum}: Control qubit ${control} does not exist. Current circuit has ${numQubits} qubit${numQubits !== 1 ? 's' : ''} (0–${numQubits - 1}).`); continue; }
      if (target  < 0 || target  >= numQubits) { errors.push(`Line ${lineNum}: Target qubit ${target} does not exist. Current circuit has ${numQubits} qubit${numQubits !== 1 ? 's' : ''} (0–${numQubits - 1}).`); continue; }
      if (control === target) { errors.push(`Line ${lineNum}: Control and target qubits must be different.`); continue; }
      operations.push({ gate: 'CNOT', qubit: target, step: stepCounter++, control, target });
      continue;
    }

    if (gateName === 'CZ') {
      if (args.length < 2) { errors.push(`Line ${lineNum}: CZ gate requires two qubit arguments, e.g. qc.cz(0, 1)`); continue; }
      const control = parseInt(args[0], 10);
      const target  = parseInt(args[1], 10);
      if (Number.isNaN(control) || Number.isNaN(target)) { errors.push(`Line ${lineNum}: Invalid qubit indices for CZ gate.`); continue; }
      if (control < 0 || control >= numQubits || target < 0 || target >= numQubits) { errors.push(`Line ${lineNum}: Qubit index out of range. Current circuit has ${numQubits} qubit${numQubits !== 1 ? 's' : ''} (0–${numQubits - 1}).`); continue; }
      if (control === target) { errors.push(`Line ${lineNum}: Control and target qubits must be different.`); continue; }
      operations.push({ gate: 'CZ', qubit: target, step: stepCounter++, control, target });
      continue;
    }

    if (gateName === 'SWAP') {
      if (args.length < 2) { errors.push(`Line ${lineNum}: SWAP gate requires two qubit arguments, e.g. qc.swap(0, 1)`); continue; }
      const q1 = parseInt(args[0], 10);
      const q2 = parseInt(args[1], 10);
      if (Number.isNaN(q1) || Number.isNaN(q2)) { errors.push(`Line ${lineNum}: Invalid qubit indices for SWAP gate.`); continue; }
      if (q1 < 0 || q1 >= numQubits || q2 < 0 || q2 >= numQubits) { errors.push(`Line ${lineNum}: Qubit index out of range. Current circuit has ${numQubits} qubit${numQubits !== 1 ? 's' : ''} (0–${numQubits - 1}).`); continue; }
      if (q1 === q2) { errors.push(`Line ${lineNum}: SWAP requires two different qubits.`); continue; }
      operations.push({ gate: 'SWAP', qubit: q1, step: stepCounter++, control: q1, target: q2 });
      continue;
    }

    // ── Three-qubit gates ──
    if (gateName === 'TOFFOLI') {
      if (args.length < 3) { errors.push(`Line ${lineNum}: Toffoli gate requires three qubit arguments, e.g. qc.ccx(0, 1, 2)`); continue; }
      const c1 = parseInt(args[0], 10);
      const c2 = parseInt(args[1], 10);
      const t  = parseInt(args[2], 10);
      if ([c1, c2, t].some(Number.isNaN)) { errors.push(`Line ${lineNum}: Invalid qubit indices for Toffoli gate.`); continue; }
      if ([c1, c2, t].some((q) => q < 0 || q >= numQubits)) { errors.push(`Line ${lineNum}: Qubit index out of range. Current circuit has ${numQubits} qubit${numQubits !== 1 ? 's' : ''} (0–${numQubits - 1}).`); continue; }
      operations.push({ gate: 'TOFFOLI', qubit: t, step: stepCounter++, control1: c1, control2: c2, target: t });
      continue;
    }

    // ── Measure / Reset ──
    if (gateName === 'M' || gateName === 'MEASURE') {
      const qubit = args.length > 0 ? parseInt(args[0], 10) : 0;
      if (Number.isNaN(qubit) || qubit < 0 || qubit >= numQubits) { errors.push(`Line ${lineNum}: Qubit ${Number.isNaN(qubit) ? args[0] : qubit} does not exist. Current circuit has ${numQubits} qubit${numQubits !== 1 ? 's' : ''} (0–${numQubits - 1}).`); continue; }
      operations.push({ gate: 'M', qubit, step: stepCounter++ });
      continue;
    }

    if (gateName === 'RESET') {
      const qubit = args.length > 0 ? parseInt(args[0], 10) : 0;
      if (Number.isNaN(qubit) || qubit < 0 || qubit >= numQubits) { errors.push(`Line ${lineNum}: Qubit ${Number.isNaN(qubit) ? args[0] : qubit} does not exist. Current circuit has ${numQubits} qubit${numQubits !== 1 ? 's' : ''} (0–${numQubits - 1}).`); continue; }
      operations.push({ gate: 'RESET', qubit, step: stepCounter++ });
      continue;
    }
  }

  return { numQubits, operations, errors };
}

// ────────────────────────────────────────────
//  Validation
// ────────────────────────────────────────────

/**
 * Validate an operations array against qubit bounds.
 */
export function validateCircuit(operations, numQubits) {
  const errors = [];
  for (const op of operations) {
    const q = op.qubit ?? 0;
    if (q < 0 || q >= numQubits) errors.push(`Gate ${op.gate} at step ${op.step}: qubit ${q} out of range.`);
    if (op.control != null && (op.control < 0 || op.control >= numQubits)) errors.push(`Gate ${op.gate} at step ${op.step}: control qubit ${op.control} out of range.`);
    if (op.target  != null && (op.target  < 0 || op.target  >= numQubits)) errors.push(`Gate ${op.gate} at step ${op.step}: target qubit ${op.target} out of range.`);
  }
  return errors;
}

// ────────────────────────────────────────────
//  Backend Payload Builder
// ────────────────────────────────────────────

/**
 * Build the JSON payload expected by POST /api/circuit/simulate.
 */
export function toBackendPayload(numQubits, operations, shots = 1024) {
  return {
    qubits: numQubits,
    shots,
    operations: operations.map((op) => {
      const o = { gate: op.gate, qubit: op.qubit ?? 0, step: op.step ?? 0 };
      if (op.control  != null) o.control  = op.control;
      if (op.target   != null) o.target   = op.target;
      if (op.control1 != null) o.control1 = op.control1;
      if (op.control2 != null) o.control2 = op.control2;
      return o;
    }),
  };
}
