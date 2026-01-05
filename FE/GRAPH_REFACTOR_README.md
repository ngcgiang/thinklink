# ThinkLink - Graph Visualization Refactor

## 🎯 Overview

The Analysis Results section has been refactored from a card-based list view to an **interactive Node-Link Graph visualization** using React Flow and Dagre layout algorithms.

## 📦 New Dependencies

```bash
npm install reactflow dagre @types/dagre --legacy-peer-deps
```

### Installed Packages:
- **reactflow**: ^11.x - Interactive graph rendering library
- **dagre**: ^0.8.x - Hierarchical graph layout algorithm
- **@types/dagre**: TypeScript definitions for dagre

## 🆕 New Components

### 1. `AnalysisGraphView.jsx`
**Location**: `src/components/AnalysisGraphView.jsx`

Main graph visualization component that:
- Uses React Flow for rendering interactive nodes and edges
- Implements Dagre layout for automatic hierarchical positioning
- Provides circular node design with level-based coloring
- Supports zoom, pan, and minimap navigation
- Handles node and edge click interactions

**Key Features**:
- **Custom Nodes**: Circular nodes (120px diameter) with:
  - Level-based color coding (Blue=L1, Green=L2, Purple=L3)
  - Source text indicator badge
  - Level badge at bottom
  - Hover/selection effects
  
- **Smart Layout**: Dagre algorithm arranges nodes hierarchically:
  - Top-to-bottom flow (TB direction)
  - Automatic spacing (100px rank separation, 80px node separation)
  - Parent-child relationships maintained
  
- **Interactive Edges**:
  - Smooth step curves with arrow markers
  - Animated when active
  - Click to show inference reasoning in popover
  
- **Navigation Controls**:
  - Zoom controls
  - Minimap for overview
  - Fit view button
  - Pan by dragging background

### 2. `NodeDetailsSidebar.jsx`
**Location**: `src/components/NodeDetailsSidebar.jsx`

Sliding sidebar panel that displays detailed node information:
- Slides in from right on node click
- Shows all node data:
  - Full content text
  - Explanation with icon
  - Source text (if available)
  - Parent relationship info
  - Level and metadata
- Backdrop overlay for focus
- Smooth animations with Framer Motion

### 3. Updated `ProblemVisualizer.jsx`
**Location**: `src/components/ProblemVisualizer.jsx`

Main container updated to:
- Import and use `AnalysisGraphView` instead of `CascadingGraph`
- Maintain bi-directional highlighting between graph and problem text
- Preserve all existing state management

## 🎨 Visual Design

### Node Styling
```
Level 1 (Data/Facts): 
  - Border: #60a5fa (Blue)
  - Background: #eff6ff (Light Blue)
  - Text: #1e40af (Dark Blue)

Level 2 (Analysis):
  - Border: #4ade80 (Green)
  - Background: #f0fdf4 (Light Green)
  - Text: #166534 (Dark Green)

Level 3 (Conclusion):
  - Border: #a78bfa (Purple)
  - Background: #faf5ff (Light Purple)
  - Text: #6b21a8 (Dark Purple)
```

### Edge Styling
- Default: 2px, #d1d5db (Gray)
- Active/Hover: 3px, #3b82f6 (Blue)
- Arrow markers match edge color
- Smooth step curves for clean appearance

## 🔄 Interaction Flow

### Node Click
1. User clicks a node in the graph
2. `onNodeClickHandler` triggered
3. Node details sidebar slides in from right
4. Corresponding text in problem area highlights (yellow)
5. Graph node gets selection ring effect

### Edge Click
1. User clicks an edge between two nodes
2. `onEdgeClickHandler` triggered
3. Popover appears near cursor showing:
   - Source node content
   - Target node content
   - Inference reasoning (from target's explanation)
4. Auto-dismisses after 5 seconds or on click

### Text Click (Problem Area)
1. User clicks highlighted text in problem area
2. Corresponding node in graph gets selected
3. Node details sidebar opens automatically
4. Graph pans to show the selected node

## 📊 Data Flow

```javascript
// Input: keyPoints array from API
[
  {
    id: 1,
    content: "m = 100g",
    level: 1,
    parent_id: null,
    explanation: "Mass given in problem",
    source_text: "A pendulum with mass 100g..."
  },
  {
    id: 4,
    content: "ω = ...",
    level: 2,
    parent_id: 1,
    explanation: "Derived from mass and stiffness",
    source_text: null
  }
]

// Converted to React Flow format:
nodes = [
  {
    id: "1",
    type: "custom",
    data: { label: "m = 100g", level: 1, ... },
    position: { x: 60, y: 60 } // Calculated by Dagre
  },
  ...
]

edges = [
  {
    id: "e1-4",
    source: "1",
    target: "4",
    type: "smoothstep",
    animated: false,
    ...
  },
  ...
]
```

## 🎯 Key Implementation Details

### Dagre Layout Algorithm
```javascript
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({ 
    rankdir: direction,  // Top to Bottom
    ranksep: 100,        // Vertical spacing
    nodesep: 80          // Horizontal spacing
  });
  
  // Add nodes and edges...
  dagre.layout(dagreGraph);
  
  // Extract calculated positions...
  return { nodes: layoutedNodes, edges };
};
```

### Bi-directional Highlighting
- **State**: `activeNodeId` stored in `ProblemVisualizer`
- **Graph → Text**: Node click updates `activeNodeId`, triggers text highlight
- **Text → Graph**: Text click updates `activeNodeId`, triggers node selection
- Both components react to the same state variable

### Performance Considerations
- `useMemo` for node/edge transformations (prevents recalculation)
- `useCallback` for event handlers (prevents re-renders)
- React Flow's built-in virtualization for large graphs
- Dagre layout calculated once per data change

## 🚀 Usage Example

```jsx
import AnalysisGraphView from './components/AnalysisGraphView';

<AnalysisGraphView
  keyPoints={analysisData.key_points}
  activeNodeId={activeNodeId}
  onNodeClick={(nodeId) => setActiveNodeId(nodeId)}
/>
```

## 📱 Responsive Design

- **Desktop**: Full graph view with sidebar (96 max-width on sidebar)
- **Mobile**: Sidebar takes full width, graph remains pannable/zoomable
- **Touch**: Full touch support for pan/zoom gestures
- **Portrait/Landscape**: Adapts to viewport changes

## 🧪 Testing Checklist

- [x] Nodes render correctly with circular shape
- [x] Level-based coloring works (Blue/Green/Purple)
- [x] Edges connect parent-child relationships
- [x] Node click opens sidebar with full details
- [x] Edge click shows inference popover
- [x] Highlighting syncs between graph and problem text
- [x] Zoom/pan controls work smoothly
- [x] Minimap shows accurate overview
- [x] Sidebar animations are smooth
- [x] Edge popover auto-dismisses
- [x] Mobile responsive layout works

## 🔮 Future Enhancements

Potential improvements for future iterations:

1. **Multiple Parents**: Support nodes with multiple parent_id values
2. **Edge Labels**: Show relationship types on edges
3. **Node Search**: Quick find/filter nodes by content
4. **Export**: Save graph as PNG/SVG
5. **Clustering**: Group related nodes visually
6. **Animation**: Animate graph building process
7. **Comparison**: Compare different problem analyses side-by-side
8. **Custom Layouts**: Allow users to manually adjust node positions

## 📝 Migration Notes

### From Old Component (CascadingGraph)
- All functionality preserved
- Better visual hierarchy
- More intuitive interactions
- Professional graph appearance
- Mobile-friendly

### Breaking Changes
- None! Drop-in replacement
- Same props interface maintained
- Existing state management works as-is

## 🐛 Known Issues

- Edge popover position may overflow on small screens (fixed with boundary checking)
- Very large graphs (>50 nodes) may need additional performance optimization
- Safari may require vendor prefixes for some CSS transitions

## 📚 Resources

- [React Flow Documentation](https://reactflow.dev/)
- [Dagre Wiki](https://github.com/dagrejs/dagre/wiki)
- [Framer Motion](https://www.framer.com/motion/)

---

**Last Updated**: January 5, 2026  
**Version**: 2.0.0 (Graph Visualization)
