import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Target, Lightbulb } from 'lucide-react';
import InteractiveProblemText from './InteractiveProblemText';
import AnalysisGraphView from './AnalysisGraphView';
import LaTeXFormula from './LaTeXFormula';

const ProblemVisualizer = ({ analysisData, problemText }) => {
  const [activeNodeId, setActiveNodeId] = useState(null);

  const handleNodeClick = (nodeId) => {
    setActiveNodeId(activeNodeId === nodeId ? null : nodeId);
  };

  const handleTextClick = (nodeId) => {
    setActiveNodeId(activeNodeId === nodeId ? null : nodeId);
    
    // Scroll to the corresponding node
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeElement) {
      nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Summary Section */}
      {analysisData.analysis_summary && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border border-blue-200"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Tóm Tắt Bài Toán</h3>
              <p className="text-gray-700 leading-relaxed">{analysisData.analysis_summary}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Unknowns Section */}
      {analysisData.target_unknowns && analysisData.target_unknowns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-md p-6 border border-amber-200"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Cần Tìm</h3>
              <ul className="list-disc list-inside space-y-1">
                {analysisData.target_unknowns.map((unknown, idx) => (
                  <li key={idx} className="text-gray-700 font-mono">
                    { <LaTeXFormula formula={unknown} displayMode={true} />}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area A: Interactive Problem Text */}
        <div className="lg:col-span-1">
          <InteractiveProblemText
            problemText={problemText}
            keyPoints={analysisData.key_points}
            activeNodeId={activeNodeId}
            onTextClick={handleTextClick}
          />
        </div>

        {/* Area B: Analysis Graph View (New!) */}
        <div className="lg:col-span-1">
          <AnalysisGraphView
            keyPoints={analysisData.key_points}
            activeNodeId={activeNodeId}
            onNodeClick={handleNodeClick}
          />
        </div>
      </div>

      {/* Suggested Formulas */}
      {analysisData.suggested_formulas && analysisData.suggested_formulas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-md p-6 border border-purple-200"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Công Thức Gợi Ý</h3>
              <div className="space-y-3">
                {analysisData.suggested_formulas.map((formula, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="bg-white bg-opacity-80 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-purple-100"
                  >
                    <div className="flex items-center justify-center">
                      <LaTeXFormula formula={formula} displayMode={true} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-100 rounded-lg p-4 text-center"
      >
        <p className="text-sm text-gray-600">
          💡 <strong>Hướng dẫn:</strong> Click vào các phần được highlight trong đề bài hoặc các node phân tích 
          để xem mối liên hệ giữa đề bài và quá trình suy luận
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ProblemVisualizer;
