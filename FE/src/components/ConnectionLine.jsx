import React from 'react';
import { motion } from 'framer-motion';

const ConnectionLine = ({ from, to, isActive }) => {
  if (!from || !to) return null;

  // Calculate line coordinates
  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height;
  const x2 = to.x + to.width / 2;
  const y2 = to.y;

  // Control points for curved line
  const midY = (y1 + y2) / 2;

  return (
    <motion.svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        zIndex: 0
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <defs>
        <marker
          id={`arrowhead-${isActive ? 'active' : 'normal'}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3, 0 6"
            fill={isActive ? '#3b82f6' : '#9ca3af'}
          />
        </marker>
      </defs>
      <motion.path
        d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
        stroke={isActive ? '#3b82f6' : '#d1d5db'}
        strokeWidth={isActive ? 3 : 2}
        fill="none"
        markerEnd={`url(#arrowhead-${isActive ? 'active' : 'normal'})`}
        initial={{ pathLength: 0 }}
        animate={{ 
          pathLength: 1,
          stroke: isActive ? '#3b82f6' : '#d1d5db',
          strokeWidth: isActive ? 3 : 2
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
};

export default ConnectionLine;
