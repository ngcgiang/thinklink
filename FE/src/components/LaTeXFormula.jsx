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
        // Loại bỏ các dấu $ ở đầu và cuối công thức
        // Xử lý cả $$...$$ (display mode) và $...$ (inline mode)
        let cleanedFormula = formula.trim();
        
        // Kiểm tra và loại bỏ $$ ở đầu và cuối
        if (cleanedFormula.startsWith('$$') && cleanedFormula.endsWith('$$')) {
          cleanedFormula = cleanedFormula.slice(2, -2).trim();
        }
        // Kiểm tra và loại bỏ $ ở đầu và cuối
        else if (cleanedFormula.startsWith('$') && cleanedFormula.endsWith('$')) {
          cleanedFormula = cleanedFormula.slice(1, -1).trim();
        }
        
        // Xử lý double backslash từ JSON escaping
        // Backend trả về \\arctan, \\frac, etc. cần chuyển thành \arctan, \frac
        // Nhưng cẩn thận với các trường hợp đặc biệt như \\ (line break trong LaTeX)
        cleanedFormula = cleanedFormula.replace(/\\\\/g, '\\');
        
        katex.render(cleanedFormula, containerRef.current, {
          displayMode: displayMode,
          throwOnError: false,
          errorColor: '#cc0000',
          strict: false,
          trust: false,
        });
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        console.error('Formula that failed:', formula);
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
