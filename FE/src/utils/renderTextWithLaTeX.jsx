import React from 'react';
import LaTeXFormula from '../components/LaTeXFormula';

/**
 * Helper function to render text that may contain LaTeX formulas
 * Detects inline LaTeX ($...$), display LaTeX ($$...$$), and auto-detects math expressions
 * 
 * @param {string} text - Text that may contain LaTeX formulas marked with $ or $$
 * @returns {React.ReactNode} - Rendered text with LaTeX formulas
 * 
 * @example
 * renderTextWithLaTeX("The force is $F = m \times a$")
 * renderTextWithLaTeX("Display formula: $$E = mc^2$$")
 */
const renderTextWithLaTeX = (text) => {
  if (!text) return null;
  
  // First, check for explicit LaTeX markers ($...$ or $$...$$)
  const hasExplicitLaTeX = /\$\$[\s\S]+?\$\$|\$[^$]+?\$/.test(text);
  
  // If has explicit markers, use them
  if (hasExplicitLaTeX) {
    const parts = [];
    let lastIndex = 0;
    const regex = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before the LaTeX formula
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }
      
      // Extract formula (without $ markers)
      const formula = match[1] || match[2];
      const isDisplayMode = !!match[1]; // $$ indicates display mode
      
      parts.push({
        type: 'latex',
        content: formula,
        displayMode: isDisplayMode
      });
      
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text after last match
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }
    
    return (
      <>
        {parts.map((part, idx) => (
          part.type === 'latex' ? (
            <LaTeXFormula 
              key={idx} 
              formula={part.content} 
              displayMode={part.displayMode}
            />
          ) : (
            <span key={idx}>{part.content}</span>
          )
        ))}
      </>
    );
  }
  
  // Auto-detect math expressions (variables with subscripts, equations, etc.)
  // Pattern: detects expressions like "v = v_0 + a * t" or "F = m * a"
  const mathPattern = /([a-zA-Z][a-zA-Z0-9]*(?:_[a-zA-Z0-9]+|\^[a-zA-Z0-9]+)*(?:\s*[+\-*/=]\s*[a-zA-Z0-9_^()\s+\-*/]+)*)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = mathPattern.exec(text)) !== null) {
    // Check if this looks like a real math expression (has operators or subscripts)
    const expr = match[1];
    const hasMathChars = /[_^+\-*/=]/.test(expr);
    
    if (hasMathChars) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }
      
      // Add math expression
      parts.push({
        type: 'latex',
        content: expr.trim(),
        displayMode: false
      });
      
      lastIndex = match.index + match[0].length;
    }
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }
  
  // If no math detected, return plain text
  if (parts.length === 0) {
    return text;
  }
  
  return (
    <>
      {parts.map((part, idx) => (
        part.type === 'latex' ? (
          <LaTeXFormula 
            key={idx} 
            formula={part.content} 
            displayMode={part.displayMode}
          />
        ) : (
          <span key={idx}>{part.content}</span>
        )
      ))}
    </>
  );
};

export default renderTextWithLaTeX;
