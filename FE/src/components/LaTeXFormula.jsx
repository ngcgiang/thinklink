import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Component to render LaTeX formulas using KaTeX
 * @param {string} formula - LaTeX string to render
 * @param {boolean} displayMode - If true, renders in display mode (centered, larger)
 */
const LaTeXFormula = ({ formula, displayMode = false }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && formula) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode: displayMode,
          throwOnError: false,
          errorColor: '#cc0000',
          strict: false,
          trust: false,
        });
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        // Fallback to plain text if LaTeX rendering fails
        containerRef.current.textContent = formula;
      }
    }
  }, [formula, displayMode]);

  return (
    <span 
      ref={containerRef} 
      className={displayMode ? 'katex-display-wrapper' : 'katex-inline-wrapper'}
    />
  );
};

export default LaTeXFormula;
