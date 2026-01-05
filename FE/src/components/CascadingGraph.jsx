import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';
import DataNode from './DataNode';
import ConnectionLine from './ConnectionLine';

const CascadingGraph = ({ keyPoints, activeNodeId, onNodeClick }) => {
  const [nodePositions, setNodePositions] = useState({});
  const nodeRefs = useRef({});

  // Group nodes by level
  const nodesByLevel = React.useMemo(() => {
    const levels = {};
    keyPoints.forEach(node => {
      if (!levels[node.level]) {
        levels[node.level] = [];
      }
      levels[node.level].push(node);
    });
    return levels;
  }, [keyPoints]);

  // Update node positions for drawing connections
  useEffect(() => {
    const updatePositions = () => {
      const positions = {};
      Object.keys(nodeRefs.current).forEach(id => {
        const element = nodeRefs.current[id];
        if (element) {
          const rect = element.getBoundingClientRect();
          const containerRect = element.closest('.cascading-container')?.getBoundingClientRect();
          
          if (containerRect) {
            positions[id] = {
              x: rect.left - containerRect.left,
              y: rect.top - containerRect.top,
              width: rect.width,
              height: rect.height
            };
          }
        }
      });
      setNodePositions(positions);
    };

    // Update positions after render
    const timer = setTimeout(updatePositions, 100);
    window.addEventListener('resize', updatePositions);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePositions);
    };
  }, [keyPoints]);

  // Build parent-child connections
  const connections = React.useMemo(() => {
    return keyPoints
      .filter(node => node.parent_id !== null)
      .map(node => ({
        from: node.parent_id,
        to: node.id,
        isActive: activeNodeId === node.id || activeNodeId === node.parent_id
      }));
  }, [keyPoints, activeNodeId]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg p-6 relative"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-300">
        <div className="p-2 bg-green-100 rounded-lg">
          <GitBranch className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Sơ Đồ Phân Tích</h3>
          <p className="text-xs text-gray-500">Click vào từng node để xem liên kết với đề bài</p>
        </div>
      </div>

      {/* Cascading Nodes Container */}
      <div className="cascading-container relative" style={{ minHeight: '400px' }}>
        {/* Draw connections */}
        {connections.map((conn, idx) => (
          <ConnectionLine
            key={`conn-${idx}`}
            from={nodePositions[conn.from]}
            to={nodePositions[conn.to]}
            isActive={conn.isActive}
          />
        ))}

        {/* Render nodes by level */}
        <div className="relative space-y-8" style={{ zIndex: 1 }}>
          {Object.keys(nodesByLevel)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(level => (
              <div key={`level-${level}`} className="space-y-4">
                {/* Level Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-gray-300"></div>
                  <span className="text-xs font-semibold text-gray-500 px-3 py-1 bg-white rounded-full border border-gray-300">
                    Cấp độ {level}
                  </span>
                  <div className="h-px flex-1 bg-gray-300"></div>
                </div>

                {/* Nodes Grid */}
                <div 
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`,
                    marginLeft: level > 1 ? `${(parseInt(level) - 1) * 30}px` : '0'
                  }}
                >
                  {nodesByLevel[level].map((node, idx) => (
                    <DataNode
                      key={node.id}
                      node={node}
                      isActive={activeNodeId === node.id}
                      onClick={onNodeClick}
                      index={idx}
                      nodeRef={(el) => {
                        if (el) {
                          nodeRefs.current[node.id] = el;
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-300 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 bg-blue-50 rounded"></div>
          <span className="text-xs text-gray-600">Dữ kiện ban đầu</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-400 bg-green-50 rounded"></div>
          <span className="text-xs text-gray-600">Phân tích suy luận</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-400 bg-purple-50 rounded"></div>
          <span className="text-xs text-gray-600">Kết luận</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CascadingGraph;
