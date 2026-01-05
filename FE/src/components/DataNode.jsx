import React from 'react';
import { motion } from 'framer-motion';
import { Info, Lightbulb, Link2 } from 'lucide-react';

const DataNode = ({ node, isActive, onClick, index, nodeRef }) => {
  const getLevelColor = (level) => {
    switch (level) {
      case 1:
        return 'border-blue-400 bg-blue-50';
      case 2:
        return 'border-green-400 bg-green-50';
      case 3:
        return 'border-purple-400 bg-purple-50';
      default:
        return 'border-gray-400 bg-gray-50';
    }
  };

  const getLevelLabel = (level) => {
    switch (level) {
      case 1:
        return 'Dữ kiện';
      case 2:
        return 'Phân tích';
      case 3:
        return 'Kết luận';
      default:
        return 'Thông tin';
    }
  };

  const hasSourceText = node.source_text && node.source_text.trim() !== '';

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100
      }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick(node.id)}
      className={`
        data-node relative
        ${getLevelColor(node.level)}
        ${isActive ? 'data-node-active scale-105' : ''}
      `}
      style={{ zIndex: isActive ? 10 : 1 }}
    >
      {/* Level Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold px-2 py-1 bg-white rounded-full border">
          {getLevelLabel(node.level)} #{node.id}
        </span>
        {hasSourceText && (
          <Link2 className="w-4 h-4 text-blue-500" title="Liên kết với đề bài" />
        )}
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-lg font-semibold text-gray-800 mb-1">
          {node.content}
        </p>
      </div>

      {/* Explanation */}
      {node.explanation && (
        <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-2">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">{node.explanation}</p>
          </div>
        </div>
      )}

      {/* Source Text Preview */}
      {hasSourceText && (
        <div className="bg-white bg-opacity-60 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600 italic line-clamp-2">
              "{node.source_text}"
            </p>
          </div>
        </div>
      )}

      {/* Active Indicator */}
      {isActive && (
        <motion.div
          className="absolute -inset-1 bg-blue-400 rounded-lg -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
};

export default DataNode;
