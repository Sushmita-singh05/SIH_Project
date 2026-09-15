import React from 'react';
import CircuitSummary from '../Quantum/CircuitSummary';
import BlochSphereSvg from '../Visualization/BlochSphereSvg';
import MeasurementResults from '../Quantum/MeasurementResults';
import QuizCheckpoint from './QuizCheckpoint';
import LessonSummary from './LessonSummary';

export default function SceneRenderer({ scene, isActive }) {
  if (!scene) return null;

  const renderContent = () => {
    switch (scene.type) {
      case 'concept':
        return (
          <div className="scene-visual scene-concept">
            <div className="scene-concept-icon">💡</div>
            <div className="scene-concept-card">
              <h4>{scene.keyConcept}</h4>
            </div>
          </div>
        );
      case 'circuit':
        return (
          <div className="scene-visual scene-circuit">
            <CircuitSummary
              operations={scene.circuit?.operations || []}
              qubits={scene.circuit?.qubits || 2}
              shots={1024}
              backend="Lesson Demo"
            />
          </div>
        );
      case 'bloch':
        const bd = scene.blochData?.[0] || { x: 0, y: 0, z: 1, r: 1, label: '|0⟩' };
        const theta = Math.acos(Math.max(-1, Math.min(1, bd.z)));
        const phi = Math.atan2(bd.y, bd.x);
        return (
          <div className="scene-visual scene-bloch">
            <BlochSphereSvg theta={theta} phi={phi} rNorm={bd.r} label={bd.label} />
            <p className="scene-bloch-label">{bd.label}</p>
          </div>
        );
      case 'simulation':
        return (
          <div className="scene-visual scene-simulation">
            {scene.circuit && (
              <CircuitSummary operations={scene.circuit.operations} qubits={scene.circuit.qubits} />
            )}
            {scene.simulationData && (
              <MeasurementResults
                counts={scene.simulationData.counts}
                probabilities={scene.simulationData.probabilities}
                shots={scene.simulationData.shots || 1024}
                numQubits={scene.circuit?.qubits || 2}
              />
            )}
          </div>
        );
      case 'state':
        return (
          <div className="scene-visual scene-state">
            {scene.stateData?.states?.map((s, i) => (
              <div key={i} className="state-vector-card">
                <h4>{s.label}</h4>
                <table><tbody>
                  {s.amplitudes.map((a, j) => (
                    <tr key={j}><td>{a.basis}</td><td>{a.value}</td></tr>
                  ))}
                </tbody></table>
              </div>
            ))}
          </div>
        );
      case 'comparison':
        return (
          <div className="scene-visual scene-comparison">
            <div className="comparison-panel">
              <h4>{scene.comparisonData?.left?.label}</h4>
              <MeasurementResults
                counts={scene.comparisonData?.left?.counts || {}}
                probabilities={scene.comparisonData?.left?.probabilities || {}}
                shots={1024}
                numQubits={2}
              />
            </div>
            <div className="comparison-divider">vs</div>
            <div className="comparison-panel">
              <h4>{scene.comparisonData?.right?.label}</h4>
              <MeasurementResults
                counts={scene.comparisonData?.right?.counts || {}}
                probabilities={scene.comparisonData?.right?.probabilities || {}}
                shots={1024}
                numQubits={2}
              />
            </div>
          </div>
        );
      case 'quiz':
      case 'summary':
        return <div className="scene-visual scene-concept"><div className="scene-concept-card"><h4>{scene.title}</h4></div></div>;
      default:
        return (
          <div className="scene-visual scene-concept">
            <div className="scene-concept-icon">💡</div>
            <div className="scene-concept-card">
              <h4>{scene.keyConcept || scene.title}</h4>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`scene-renderer ${isActive ? 'active' : ''}`}>
      {renderContent()}
    </div>
  );
}
