import React, { memo } from 'react';

function BlochSphereSvg({ theta = 1.5708, phi = 0.0, rNorm = 1.0, label = "|+⟩" }) {
  // Pure SVG isometric projection of Bloch sphere
  const cx = 110;
  const cy = 110;
  const sphereR = 75;

  // Vector length scaled by rNorm (purity / Bloch vector norm: 1 for pure, 0 for maximally mixed)
  const norm = Math.max(0, Math.min(1.0, typeof rNorm === 'number' ? rNorm : 1.0));
  const isMixed = norm < 0.15;
  const vecR = sphereR * norm;

  // Vector coordinates
  const vx = cx + vecR * Math.sin(theta) * Math.cos(phi);
  const vy = cy - vecR * Math.cos(theta) + (vecR * 0.3 * Math.sin(theta) * Math.sin(phi));

  return (
    <svg width="220" height="220" viewBox="0 0 220 220" className="bloch-svg">
      <defs>
        <radialGradient id="sphereGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#f0f4f8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#d9e2ec" stopOpacity="0.3" />
        </radialGradient>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#2563eb" />
        </marker>
        <marker id="axisArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 2 L 6 5 L 0 8 z" fill="#94a3b8" />
        </marker>
      </defs>

      {/* Main Sphere outline */}
      <circle cx={cx} cy={cy} r={sphereR} fill="url(#sphereGrad)" stroke="#cbd5e1" strokeWidth="1.5" />

      {/* Equator ellipse */}
      <ellipse cx={cx} cy={cy} rx={sphereR} ry={sphereR * 0.32} fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />

      {/* Vertical meridian */}
      <ellipse cx={cx} cy={cy} rx={sphereR * 0.32} ry={sphereR} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />

      {/* Z Axis */}
      <line x1={cx} y1={cy + sphereR + 15} x2={cx} y2={cy - sphereR - 15} stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#axisArrow)" />
      <text x={cx + 6} y={cy - sphereR - 6} fontSize="11" fill="#475569" fontWeight="bold">|0⟩ (+z)</text>
      <text x={cx + 6} y={cy + sphereR + 16} fontSize="11" fill="#475569" fontWeight="bold">|1⟩ (-z)</text>

      {/* X Axis */}
      <line x1={cx - sphereR - 15} y1={cy} x2={cx + sphereR + 15} y2={cy} stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#axisArrow)" />
      <text x={cx + sphereR + 6} y={cy - 4} fontSize="10" fill="#64748b">+x (|+⟩)</text>

      {/* State Vector */}
      {!isMixed ? (
        <>
          <line x1={cx} y1={cy} x2={vx} y2={vy} stroke="#2563eb" strokeWidth="2.5" markerEnd="url(#arrow)" />
          <circle cx={vx} cy={vy} r="4" fill="#2563eb" />
          <circle cx={cx} cy={cy} r="2.5" fill="#64748b" />
          <text x={vx + 6} y={vy - 6} fontSize="11" fill="#1d4ed8" fontWeight="bold">{label}</text>
        </>
      ) : (
        <>
          {/* Maximally mixed / entangled state: vector at origin */}
          <circle cx={cx} cy={cy} r="5" fill="#d97706" />
          <circle cx={cx} cy={cy} r="9" fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="2 2" />
          <text x={cx + 12} y={cy + 4} fontSize="11" fill="#b45309" fontWeight="bold">
            {label.includes('Mixed') || label.includes('Entangled') ? label : 'Mixed State (r=0)'}
          </text>
        </>
      )}
    </svg>
  );
}

export default memo(BlochSphereSvg);
