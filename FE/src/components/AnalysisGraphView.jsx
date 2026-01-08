import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import dagre from 'dagre';
import { GitBranch, ZoomIn } from 'lucide-react';
import 'reactflow/dist/style.css';
import NodeDetailsSidebar from './NodeDetailsSidebar';
import LaTeXFormula from './LaTeXFormula';

/**
 * Helper function to render text that may contain LaTeX formulas
 */
const renderTextWithLaTeX = (text) => {
  if (!text) return null;
  
  const hasLaTeX = /\$\$[\s\S]+?\$\$|\$[^$]+?\$/.test(text);
  
  if (!hasLaTeX) {
    return text;
  }
  
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
};

// Custom Node Component
const CustomNode = ({ data, selected }) => {
  const getLevelColor = (level) => {
    switch (level) {
      case 1:
        return { border: '#60a5fa', bg: '#eff6ff', text: '#1e40af' };
      case 2:
        return { border: '#4ade80', bg: '#f0fdf4', text: '#166534' };
      case 3:
        return { border: '#a78bfa', bg: '#faf5ff', text: '#6b21a8' };
      default:
        return { border: '#9ca3af', bg: '#f9fafb', text: '#374151' };
    }
  };

  const colors = getLevelColor(data.level);
  const hasSourceText = data.source_text && data.source_text.trim() !== '';

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative rounded-full flex items-center justify-center
        transition-all duration-200 cursor-pointer
        ${selected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
      `}
      style={{
        width: '120px',
        height: '120px',
        backgroundColor: colors.bg,
        border: `3px solid ${selected ? '#3b82f6' : colors.border}`,
        boxShadow: selected 
          ? '0 10px 30px rgba(59, 130, 246, 0.3)' 
          : '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* React Flow Handles - Required for edge connections */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: colors.border,
          width: '10px',
          height: '10px',
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: colors.border,
          width: '10px',
          height: '10px',
          border: '2px solid white',
        }}
      />

      {/* Node Content */}
      <div className="text-center px-3">
        <div 
          className="font-bold text-base leading-tight mb-0.5"
          style={{ color: colors.text }}
        >
          {data.symbol ? (
            <LaTeXFormula formula={data.symbol} displayMode={false} />
          ) : null}
        </div>
        {data.value && (
          <p className="text-xs font-medium text-gray-600">
            {  renderTextWithLaTeX(data.value)}
          </p>
        )}
      </div>

      {/* Link Indicator Badge */}
      {hasSourceText && (
        <div 
          className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
          title="Có liên kết với đề bài"
        >
          <svg 
            className="w-3 h-3 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
            />
          </svg>
        </div>
      )}

      {/* Level Badge */}
      <div 
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-white rounded-full text-xs font-semibold shadow-md"
        style={{ color: colors.text, borderColor: colors.border, borderWidth: '1px' }}
      >
        L{data.level}
      </div>
    </motion.div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Dagre layout function
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 120, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 60,
        y: nodeWithPosition.y - 60,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const AnalysisGraphView = ({ keyPoints, activeNodeId, onNodeClick }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [edgeInfo, setEdgeInfo] = useState(null);

  // Convert keyPoints to React Flow nodes
  const initialNodes = useMemo(() => {
    return keyPoints.map((point) => ({
      id: String(point.id),
      type: 'custom',
      data: {
        label: point.symbol || point.value || 'Node',
        symbol: point.symbol,
        value: point.value,
        unit: point.unit,
        level: point.level,
        source_text: point.source_text,
        related_formula: point.related_formula,
        fullData: point,
      },
      position: { x: 0, y: 0 },
    }));
  }, [keyPoints]);

  // Convert parent-child relationships to React Flow edges
  // Supports both old parent_id field and new dependencies array
  const initialEdges = useMemo(() => {
    const edges = [];
    
    keyPoints.forEach((point) => {
      // Handle new dependencies array (multi-parent support)
      if (point.dependencies && Array.isArray(point.dependencies) && point.dependencies.length > 0) {
        point.dependencies.forEach((depId) => {
          const isActive = activeNodeId === String(point.id) || activeNodeId === String(depId);
          edges.push({
            id: `e${depId}-${point.id}`,
            source: String(depId),
            target: String(point.id),
            type: 'smoothstep',
            animated: isActive,
            style: {
              stroke: isActive ? '#3b82f6' : '#d1d5db',
              strokeWidth: isActive ? 3 : 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isActive ? '#3b82f6' : '#9ca3af',
            },
            data: {
              sourceId: depId,
              targetId: point.id,
            },
          });
        });
      }
      // Backward compatibility: handle old parent_id field
      else if (point.parent_id !== null && point.parent_id !== undefined) {
        const isActive = activeNodeId === String(point.id) || activeNodeId === String(point.parent_id);
        edges.push({
          id: `e${point.parent_id}-${point.id}`,
          source: String(point.parent_id),
          target: String(point.id),
          type: 'smoothstep',
          animated: isActive,
          style: {
            stroke: isActive ? '#3b82f6' : '#d1d5db',
            strokeWidth: isActive ? 3 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isActive ? '#3b82f6' : '#9ca3af',
          },
          data: {
            sourceId: point.parent_id,
            targetId: point.id,
          },
        });
      }
    });
    
    return edges;
  }, [keyPoints, activeNodeId]);

  // Layout nodes with dagre
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges);
  }, [initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Handle node click
  const onNodeClickHandler = useCallback(
    (event, node) => {
      const nodeData = keyPoints.find((p) => String(p.id) === node.id);
      setSelectedNode(nodeData);
      setIsSidebarOpen(true);
      onNodeClick(node.id);
    },
    [keyPoints, onNodeClick]
  );

  // Handle edge click
  const onEdgeClickHandler = useCallback(
    (event, edge) => {
      const sourceNode = keyPoints.find((p) => String(p.id) === edge.source);
      const targetNode = keyPoints.find((p) => String(p.id) === edge.target);
      
      setEdgeInfo({
        source: sourceNode,
        target: targetNode,
        x: event.clientX,
        y: event.clientY,
      });

      // Auto-hide after 5 seconds
      setTimeout(() => setEdgeInfo(null), 5000);
    },
    [keyPoints]
  );

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setTimeout(() => setSelectedNode(null), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg relative overflow-hidden"
      style={{ height: '700px' }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-300 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <GitBranch className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Sơ Đồ Phân Tích</h3>
              <p className="text-xs text-gray-500">Click vào node để xem chi tiết, click vào mũi tên để xem suy luận</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ZoomIn className="w-4 h-4" />
            <span>Cuộn để zoom</span>
          </div>
        </div>
      </div>

      {/* React Flow Graph */}
      <div className="w-full h-full pt-20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClickHandler}
          onEdgeClick={onEdgeClickHandler}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.5}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Background color="#e5e7eb" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.data.level) {
                case 1: return '#60a5fa';
                case 2: return '#4ade80';
                case 3: return '#a78bfa';
                default: return '#9ca3af';
              }
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Edge Info Popover */}
      {edgeInfo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed z-50 bg-white rounded-lg shadow-2xl p-4 border-2 border-blue-300 max-w-sm"
          style={{
            left: `${edgeInfo.x + 10}px`,
            top: `${edgeInfo.y + 10}px`,
          }}
          onClick={() => setEdgeInfo(null)}
        >
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-blue-100 rounded">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-gray-800 mb-1">Suy luận</h4>
              <p className="text-xs text-gray-700 leading-relaxed">
                Dữ kiện <span className="font-bold">{renderTextWithLaTeX(edgeInfo.target.symbol)}: {edgeInfo.target.value}</span> được suy ra từ <span className="font-bold">{renderTextWithLaTeX(edgeInfo.source.symbol)}: {edgeInfo.source.value}</span>
              </p>
              {edgeInfo.target.related_formula && (
                <div className="text-xs text-gray-600 mt-2 italic border-t pt-2">
                  Công thức: <LaTeXFormula formula={edgeInfo.target.related_formula} displayMode={false} />
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => setEdgeInfo(null)}
            className="absolute top-1 right-1 p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 border border-gray-200 z-10">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Chú thích</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-blue-400 bg-blue-50"></div>
            <span className="text-xs text-gray-600">Dữ kiện gốc</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-green-400 bg-green-50"></div>
            <span className="text-xs text-gray-600">Phân tích</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-purple-400 bg-purple-50"></div>
            <span className="text-xs text-gray-600">Dữ liệu ẩn</span>
          </div>
        </div>
      </div>

      {/* Node Details Sidebar */}
      <NodeDetailsSidebar
        node={selectedNode}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
    </motion.div>
  );
};

export default AnalysisGraphView;
