import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Lightbulb, Link2, Tag } from 'lucide-react';
import LaTeXFormula from './LaTeXFormula';

/**
 * Helper function to render text that may contain LaTeX formulas
 * Detects inline LaTeX ($...$), display LaTeX ($$...$$), and auto-detects math expressions
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
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }
      
      const formula = match[1] || match[2];
      const isDisplayMode = !!match[1];
      
      parts.push({
        type: 'latex',
        content: formula,
        displayMode: isDisplayMode
      });
      
      lastIndex = regex.lastIndex;
    }
    
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


const NodeDetailsSidebar = ({ node, isOpen, onClose }) => {
  if (!node) return null;

  const getLevelColor = (level) => {
    switch (level) {
      case 1:
        return 'text-blue-600 bg-blue-100';
      case 2:
        return 'text-green-600 bg-green-100';
      case 3:
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelLabel = (level) => {
    switch (level) {
      case 1:
        return 'Dữ kiện gốc';
      case 2:
        return 'Phân tích suy luận';
      case 3:
        return 'Dữ liệu ẩn';
      default:
        return 'Thông tin';
    }
  };

  const hasSourceText = node.source_text && node.source_text.trim() !== '';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">Chi Tiết Node</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Node ID and Level Badge */}
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getLevelColor(node.level)}`}>
                  {getLevelLabel(node.level)}
                </span>
                <span className="text-sm text-gray-500">ID: {node.id}</span>
              </div>

              {/* Main Content - Symbol, Value, Unit */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
                <h4 className="text-sm font-medium text-gray-600 mb-3">Dữ liệu</h4>
                <div className="space-y-2">
                  {node.symbol && (
                    <div>
                      <span className="text-xs text-gray-500">Ký hiệu:</span>
                      <div className="text-2xl font-bold text-gray-900">
                        <LaTeXFormula formula={node.symbol} displayMode={false} />
                      </div>
                    </div>
                  )}
                  {node.value && (
                    <div>
                      <span className="text-xs text-gray-500">Giá trị:</span>
                      <p className="text-xl font-semibold text-gray-800">{renderTextWithLaTeX(node.value)}</p>
                    </div>
                  )}
                  {node.unit && (
                    <div>
                      <span className="text-xs text-gray-500">Đơn vị:</span>
                      <p className="text-base font-medium text-gray-700">{node.unit}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Formula */}
              {node.related_formula && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-200 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-purple-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Công thức liên quan</h4>
                      <div className="bg-white px-3 py-2 rounded flex items-center justify-center">
                        <LaTeXFormula formula={node.related_formula} displayMode={false} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Source Text */}
              {hasSourceText && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-200 rounded-lg">
                      <Link2 className="w-5 h-5 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Nguồn suy luận</h4>
                      <p className="text-gray-800 italic leading-relaxed">"{renderTextWithLaTeX(node.source_text)}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Metadata */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Thông tin bổ sung</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cấp độ:</span>
                    <span className="text-sm font-medium text-gray-800">Level {node.level}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Có liên kết đề bài:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {hasSourceText ? 'Có' : 'Không'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ID Node:</span>
                    <span className="text-sm font-medium text-gray-800 font-mono">
                      {node.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NodeDetailsSidebar;
