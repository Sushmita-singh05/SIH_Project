import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Creates a text sprite using a dynamic 2D canvas texture.
 * Completely self-contained, no external font files needed.
 */
function createTextSprite(text, color = '#1e293b', scale = 0.45) {
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = color;
  ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

/**
 * Creates circular latitude / longitude rings for the Bloch sphere wireframe.
 */
function createRing(radius, normalAxis = 'y', color = 0x94a3b8, opacity = 0.45, isDashed = false) {
  const segments = 64;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    if (normalAxis === 'y') {
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    } else if (normalAxis === 'z') {
      points.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
    } else {
      points.push(new THREE.Vector3(0, Math.cos(theta) * radius, Math.sin(theta) * radius));
    }
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = isDashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.08, gapSize: 0.05, opacity, transparent: true })
    : new THREE.LineBasicMaterial({ color, opacity, transparent: true });
  const line = new THREE.Line(geometry, material);
  if (isDashed) line.computeLineDistances();
  return line;
}

function BlochSphere({
  blochData = [],
  numQubits = 2,
  statevector = null,
  fallbackMessage = null,
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const vectorGroupRef = useRef(null);
  const animFrameIdRef = useRef(null);

  const [selectedQubit, setSelectedQubit] = useState(0);

  // Normalize bloch coordinate data
  const normalizedList = Array.isArray(blochData) && blochData.length > 0 ? blochData : [];
  const currentQubitData = normalizedList[selectedQubit] || normalizedList[0] || null;

  // Derive coordinates (default to |+⟩ if missing or fallback)
  const x = typeof currentQubitData?.x === 'number' ? currentQubitData.x : 1.0;
  const y = typeof currentQubitData?.y === 'number' ? currentQubitData.y : 0.0;
  const z = typeof currentQubitData?.z === 'number' ? currentQubitData.z : 0.0;
  const r = typeof currentQubitData?.r === 'number' ? currentQubitData.r : 1.0;
  const label = currentQubitData?.label || (r < 0.15 ? 'Entangled Subsystem' : 'State Vector');
  const isEntangled = r < 0.15;

  // Fallback condition: explicitly unavailable statevector and no blochData
  const hasNoData = fallbackMessage || (!normalizedList.length && (!statevector || !statevector.length));

  // Reset camera view callback
  const handleResetView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(1.8, 1.4, 2.4);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (hasNoData || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 320;
    const height = 300;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    // Physics axes mapping to 3D graphics:
    // Quantum +Z (North pole |0⟩) -> Graphics +Y
    // Quantum -Z (South pole |1⟩) -> Graphics -Y
    // Quantum +X (|+⟩)             -> Graphics +X
    // Quantum +Y (|i⟩)             -> Graphics +Z
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(1.8, 1.4, 2.4);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.6;
    controls.maxDistance = 6.0;
    controls.enablePan = false;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    // 6. Translucent Sphere Body
    const sphereRadius = 1.0;
    const sphereGeom = new THREE.SphereGeometry(sphereRadius, 36, 28);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.08,
      shininess: 40,
      depthWrite: false,
    });
    const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
    scene.add(sphereMesh);

    // 7. Latitude & Longitude Reference Rings
    // Equator (Quantum X-Y plane -> Graphics X-Z plane)
    const equator = createRing(sphereRadius, 'y', 0x3b82f6, 0.6, false);
    scene.add(equator);

    // Prime Meridian (Quantum X-Z plane -> Graphics X-Y plane)
    const primeMeridian = createRing(sphereRadius, 'z', 0x94a3b8, 0.35, true);
    scene.add(primeMeridian);

    // Orthogonal Meridian (Quantum Y-Z plane -> Graphics Y-Z plane)
    const crossMeridian = createRing(sphereRadius, 'x', 0x94a3b8, 0.25, true);
    scene.add(crossMeridian);

    // 8. Coordinate Axes
    const axisLen = 1.28;
    const axisColor = 0x64748b;

    // Z-Axis (Vertical in graphics: |0⟩ on top, |1⟩ on bottom)
    const zGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -axisLen, 0),
      new THREE.Vector3(0, axisLen, 0),
    ]);
    const zAxisLine = new THREE.Line(zGeom, new THREE.LineBasicMaterial({ color: 0x1d4ed8, linewidth: 2 }));
    scene.add(zAxisLine);

    // X-Axis (Horizontal)
    const xGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-axisLen, 0, 0),
      new THREE.Vector3(axisLen, 0, 0),
    ]);
    const xAxisLine = new THREE.Line(xGeom, new THREE.LineBasicMaterial({ color: axisColor }));
    scene.add(xAxisLine);

    // Y-Axis (Depth)
    const yGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -axisLen),
      new THREE.Vector3(0, 0, axisLen),
    ]);
    const yAxisLine = new THREE.Line(yGeom, new THREE.LineBasicMaterial({ color: axisColor }));
    scene.add(yAxisLine);

    // 9. Static Labels
    // North Pole |0⟩ (+Z quantum -> +Y graphics)
    const label0 = createTextSprite('|0⟩ (+z)', '#1e3a8a', 0.42);
    label0.position.set(0, axisLen + 0.16, 0);
    scene.add(label0);

    // South Pole |1⟩ (-Z quantum -> -Y graphics)
    const label1 = createTextSprite('|1⟩ (-z)', '#1e3a8a', 0.42);
    label1.position.set(0, -axisLen - 0.16, 0);
    scene.add(label1);

    // +X (|+⟩)
    const labelPlus = createTextSprite('|+⟩ (+x)', '#0369a1', 0.38);
    labelPlus.position.set(axisLen + 0.18, 0, 0);
    scene.add(labelPlus);

    // -X (|−⟩)
    const labelMinus = createTextSprite('|−⟩ (-x)', '#64748b', 0.36);
    labelMinus.position.set(-axisLen - 0.18, 0, 0);
    scene.add(labelMinus);

    // +Y (|i⟩)
    const labelPlusI = createTextSprite('+y (|i⟩)', '#0284c7', 0.35);
    labelPlusI.position.set(0, 0, axisLen + 0.16);
    scene.add(labelPlusI);

    // -Y (|-i⟩)
    const labelMinusI = createTextSprite('-y', '#64748b', 0.32);
    labelMinusI.position.set(0, 0, -axisLen - 0.16);
    scene.add(labelMinusI);

    // 10. Dynamic Vector Group container
    const vectorGroup = new THREE.Group();
    scene.add(vectorGroup);
    vectorGroupRef.current = vectorGroup;

    // Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries.length) return;
      const newWidth = entries[0].contentRect.width;
      if (newWidth > 0 && camera && renderer) {
        camera.aspect = newWidth / height;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, height);
      }
    });
    resizeObserver.observe(container);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      sphereGeom.dispose();
      sphereMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [hasNoData]);

  // Update State Vector Arrow and Endpoint when coordinates change
  useEffect(() => {
    const vectorGroup = vectorGroupRef.current;
    if (!vectorGroup) return;

    // Clear previous vector graphics
    while (vectorGroup.children.length > 0) {
      const child = vectorGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
      vectorGroup.remove(child);
    }

    // Mapping:
    // Quantum X -> Graphics X
    // Quantum Z -> Graphics Y
    // Quantum Y -> Graphics Z
    const targetVec = new THREE.Vector3(x, z, y);
    const length = targetVec.length();

    if (isEntangled || length < 0.15) {
      // Mixed / Entangled state: draw dashed sphere at center origin
      const centerGeom = new THREE.SphereGeometry(0.08, 16, 16);
      const centerMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        roughness: 0.3,
      });
      const centerMesh = new THREE.Mesh(centerGeom, centerMat);
      vectorGroup.add(centerMesh);

      const mixedLabel = createTextSprite('Mixed State (r≈0)', '#b45309', 0.42);
      mixedLabel.position.set(0.4, 0.2, 0);
      vectorGroup.add(mixedLabel);
    } else {
      // Pure or partially pure state: 3D arrow with conical tip and glowing tip sphere
      const dir = targetVec.clone().normalize();
      const arrowLength = Math.min(length, 1.0);

      // Arrow stem line
      const arrowColor = 0x2563eb;
      const arrowGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(dir.x * arrowLength, dir.y * arrowLength, dir.z * arrowLength),
      ]);
      const arrowLine = new THREE.Line(
        arrowGeom,
        new THREE.LineBasicMaterial({ color: arrowColor, linewidth: 3 })
      );
      vectorGroup.add(arrowLine);

      // Endpoint glowing sphere
      const tipRadius = 0.055;
      const tipGeom = new THREE.SphereGeometry(tipRadius, 16, 16);
      const tipMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        emissive: 0x3b82f6,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      });
      const tipMesh = new THREE.Mesh(tipGeom, tipMat);
      tipMesh.position.set(dir.x * arrowLength, dir.y * arrowLength, dir.z * arrowLength);
      vectorGroup.add(tipMesh);

      // State label sprite near tip
      const cleanName = label.replace(/^q\d+:\s*/, '');
      const stateSprite = createTextSprite(cleanName, '#1d4ed8', 0.42);
      stateSprite.position.set(
        dir.x * (arrowLength + 0.18),
        dir.y * (arrowLength + 0.18) + 0.05,
        dir.z * (arrowLength + 0.18)
      );
      vectorGroup.add(stateSprite);
    }
  }, [x, y, z, r, label, isEntangled]);

  // If statevector data is unavailable, render safe beginner-friendly fallback
  if (hasNoData) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '360px', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌐</div>
        <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Bloch Sphere</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', maxWidth: '340px', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
          {fallbackMessage ||
            'State-vector data is unavailable for this simulation. Run the circuit with a state-vector capable backend to visualize the quantum state.'}
        </p>
        <span className="badge badge-outline" style={{ fontSize: '0.8rem' }}>
          Exact Statevector Required
        </span>
      </div>
    );
  }

  return (
    <div className="card bloch-sphere-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
      {/* Header & Qubit Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 className="card-title" style={{ margin: 0, fontSize: '1.05rem' }}>
              Interactive Bloch Sphere (3D)
            </h3>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
              Qubit {selectedQubit}
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
            Drag with mouse to rotate in 3D · Scroll to zoom.
          </p>
        </div>

        {/* Qubit Selector buttons for multi-qubit systems */}
        {numQubits > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--color-bg)', padding: '2px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
            {Array.from({ length: numQubits }, (_, idx) => (
              <button
                key={idx}
                className={`btn btn-sm ${selectedQubit === idx ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600, minWidth: '40px' }}
                onClick={() => setSelectedQubit(idx)}
              >
                q{idx}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3D Canvas Viewport */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '300px',
          position: 'relative',
          background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          cursor: 'grab',
        }}
      />

      {/* Footer Controls & Coordinate Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          <span>Coordinates:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            [{x.toFixed(2)}, {y.toFixed(2)}, {z.toFixed(2)}]
          </span>
          <span style={{ color: '#94a3b8' }}>·</span>
          <span>r = {r.toFixed(2)}</span>
        </div>

        <button
          className="btn btn-outline btn-sm"
          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
          onClick={handleResetView}
        >
          ↺ Reset Angle
        </button>
      </div>

      {/* Subsystem Entanglement Notice if r < 0.15 */}
      {isEntangled && (
        <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', color: '#92400e', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>ℹ️</span>
          <span>
            <strong>Entangled state:</strong> Qubit {selectedQubit} is correlated with other qubits. Its reduced state has vector length <em>r ≈ 0</em> (center of the sphere).
          </span>
        </div>
      )}
    </div>
  );
}

export default memo(BlochSphere);
