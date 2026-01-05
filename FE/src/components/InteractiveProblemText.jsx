import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

const InteractiveProblemText = ({ problemText, keyPoints, activeNodeId, onTextClick }) => {
  // Find all source texts that need to be highlighted
  // Deduplicates when multiple nodes have the same source_text
  const highlightMap = useMemo(() => {
    const textPositionMap = new Map(); // Track unique text positions
    
    keyPoints.forEach(point => {
      if (point.source_text && point.source_text.trim() !== '') {
        const sourceText = point.source_text;
        const index = problemText.indexOf(sourceText);
        
        if (index !== -1) {
          const key = `${index}-${sourceText}`; // Unique key for position + text
          
          if (!textPositionMap.has(key)) {
            // First occurrence of this text at this position
            textPositionMap.set(key, {
              ids: [point.id], // Array to store all node IDs with same source_text
              text: sourceText,
              start: index,
              end: index + sourceText.length
            });
          } else {
            // Same text at same position - add this node ID to the list
            textPositionMap.get(key).ids.push(point.id);
          }
        }
      }
    });
    
    // Convert map to array and sort by start position
    return Array.from(textPositionMap.values()).sort((a, b) => a.start - b.start);
  }, [problemText, keyPoints]);

  // Build the rendered text with highlights
  const renderProblemText = () => {
    if (highlightMap.length === 0) {
      return <p className="text-gray-800 leading-relaxed">{problemText}</p>;
    }

    const segments = [];
    let lastIndex = 0;

    highlightMap.forEach((highlight, idx) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        segments.push({
          type: 'text',
          content: problemText.substring(lastIndex, highlight.start),
          key: `text-${idx}`
        });
      }

      // Add highlighted text
      segments.push({
        type: 'highlight',
        content: highlight.text,
        ids: highlight.ids, // Array of node IDs
        key: `highlight-${highlight.ids.join('-')}`
      });

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < problemText.length) {
      segments.push({
        type: 'text',
        content: problemText.substring(lastIndex),
        key: `text-end`
      });
    }

    return (
      <p className="text-gray-800 leading-relaxed">
        {segments.map(segment => {
          if (segment.type === 'text') {
            return <span key={segment.key}>{segment.content}</span>;
          } else {
            // Check if any of the node IDs in this highlight is active
            const isActive = segment.ids.some(id => id === activeNodeId);
            return (
              <motion.mark
                key={segment.key}
                onClick={() => onTextClick(segment.ids[0])} // Click on first node ID
                className={`
                  highlight-text
                  ${isActive ? 'highlight-text-active' : ''}
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  backgroundColor: isActive ? '#fbbf24' : '#fef08a',
                  boxShadow: isActive ? '0 0 20px rgba(251, 191, 36, 0.6)' : 'none'
                }}
                transition={{ duration: 0.2 }}
                title={segment.ids.length > 1 ? `Liên kết với ${segment.ids.length} nodes` : ''}
              >
                {segment.content}
              </motion.mark>
            );
          }
        })}
      </p>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Đề Bài Gốc</h3>
          <p className="text-xs text-gray-500">Click vào phần được highlight để xem chi tiết</p>
        </div>
      </div>

      {/* Problem Text */}
      <div className="prose max-w-none">
        {renderProblemText()}
      </div>

      {/* Legend */}
      {highlightMap.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-yellow-200 rounded"></span>
            Phần được highlight có liên kết với các dữ kiện phân tích bên dưới
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default InteractiveProblemText;
