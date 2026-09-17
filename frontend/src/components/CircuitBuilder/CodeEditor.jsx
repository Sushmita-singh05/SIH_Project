import React, { useRef, useCallback } from 'react';

/**
 * CodeEditor — lightweight VS-Code-like code editor for Qiskit circuit code.
 *
 * Props:
 *   code     – current code string
 *   onChange – (newCode: string) => void
 *   errors   – string[] of validation messages
 *   onApply  – () => void  – called when user clicks "Apply Code"
 */
export default function CodeEditor({ code, onChange, errors, onApply }) {
  const textareaRef = useRef(null);
  const lineNumRef  = useRef(null);

  const lineCount = (code || '').split('\n').length;

  // Keep line-number scroll in sync with textarea
  const handleScroll = useCallback(() => {
    if (lineNumRef.current && textareaRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Tab inserts 4 spaces instead of moving focus
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta    = e.target;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const updated = code.substring(0, start) + '    ' + code.substring(end);
      onChange(updated);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  }, [code, onChange]);

  return (
    <div className="code-editor-container">
      {/* ── Header bar ── */}
      <div className="code-editor-header">
        <div className="code-editor-tab">
          <span className="code-editor-tab-icon">🐍</span>
          <span>circuit.py</span>
        </div>
        <div className="code-editor-actions">
          <button className="btn btn-sm btn-primary" onClick={onApply}>
            ▶ Apply Code
          </button>
        </div>
      </div>

      {/* ── Editor body ── */}
      <div className="code-editor-body">
        {/* Line numbers */}
        <div className="code-editor-line-numbers" ref={lineNumRef}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="code-editor-line-number">{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="code-editor-textarea"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          data-gramm="false"
        />
      </div>

      {/* ── Errors panel (only shown when there are problems) ── */}
      {errors && errors.length > 0 && (
        <div className="code-editor-errors">
          <div className="code-editor-errors-header">
            ⚠ Problems ({errors.length})
          </div>
          <div className="code-editor-errors-list">
            {errors.map((err, i) => (
              <div key={i} className="code-editor-error-item">
                <span className="code-editor-error-icon">✕</span>
                <span>{err}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
