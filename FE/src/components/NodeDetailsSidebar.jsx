import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Lightbulb, Link2, Tag } from 'lucide-react';

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
        return 'Kết luận';
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

              {/* Main Content */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Nội dung</h4>
                <p className="text-xl font-bold text-gray-900">{node.content}</p>
              </div>

              {/* Explanation */}
              {node.explanation && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-5 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-200 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Giải thích</h4>
                      <p className="text-gray-800 leading-relaxed">{node.explanation}</p>
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
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Nguồn từ đề bài</h4>
                      <p className="text-gray-800 italic leading-relaxed">"{node.source_text}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Parent Information */}
              {node.parent_id !== null && (
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-200 rounded-lg">
                      <Info className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Mối liên hệ</h4>
                      <p className="text-gray-700">
                        Dữ kiện này được suy ra từ Node <span className="font-bold">#{node.parent_id}</span>
                      </p>
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
                    <span className="text-sm text-gray-600">Node cha:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {node.parent_id !== null ? `#${node.parent_id}` : 'Không có (Node gốc)'}
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
