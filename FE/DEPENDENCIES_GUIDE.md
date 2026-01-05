# Dependencies Array Guide

## Overview
The new `dependencies` field in the API response allows for **multi-parent relationships** in the analysis graph. This enables more complex reasoning chains where a single conclusion depends on multiple pieces of evidence.

## API Response Structure

### Old Structure (Single Parent)
```json
{
  "id": "p5",
  "content": "Result",
  "level": 2,
  "parent_id": "p1",  // Only ONE parent
  "source_text": "...",
  "explanation": "..."
}
```

### New Structure (Multiple Dependencies)
```json
{
  "id": "p5",
  "symbol": "v",
  "value": "unknown",
  "unit": "m/s",
  "level": 3,
  "source_text": "Tính vận tốc khi chạm đất",
  "related_formula": "v = v_0 + a t",
  "dependencies": ["p3", "p4", "p2"]  // Multiple dependencies!
}
```

## Complete Example

```json
{
  "success": true,
  "message": "Phân tích đề bài thành công",
  "data": {
    "analysis_summary": "Bài toán về vật rơi tự do từ độ cao h = 20m, tính vận tốc khi chạm đất.",
    "unit_check": {
      "is_consistent": true,
      "warning": null
    },
    "key_points": [
      // Level 1: Initial data from problem
      {
        "id": "p1",
        "symbol": "m",
        "value": "2kg",
        "unit": "kg",
        "level": 1,
        "source_text": "Một vật 2kg",
        "related_formula": null,
        "dependencies": []
      },
      {
        "id": "p2",
        "symbol": "h",
        "value": "20m",
        "unit": "m",
        "level": 1,
        "source_text": "rơi từ độ cao 20m",
        "related_formula": null,
        "dependencies": []
      },
      {
        "id": "p3",
        "symbol": "v₀",
        "value": "0",
        "unit": "m/s",
        "level": 1,
        "source_text": "thả rơi tự do",
        "related_formula": null,
        "dependencies": []
      },
      {
        "id": "p4",
        "symbol": "g",
        "value": "10",
        "unit": "m/s²",
        "level": 1,
        "source_text": "lấy g = 10m/s²",
        "related_formula": null,
        "dependencies": []
      },
      
      // Level 2: Intermediate calculations
      {
        "id": "p5",
        "symbol": "a",
        "value": "10",
        "unit": "m/s²",
        "level": 2,
        "source_text": null,
        "related_formula": "a = g",
        "dependencies": ["p4"]  // Depends on g
      },
      
      // Level 3: Final answer (depends on MULTIPLE level 1 & 2 nodes)
      {
        "id": "p6",
        "symbol": "v",
        "value": "20",
        "unit": "m/s",
        "level": 3,
        "source_text": "Tính vận tốc khi chạm đất",
        "related_formula": "v² = v₀² + 2gh",
        "dependencies": ["p3", "p4", "p2"]  // Multiple dependencies!
      }
    ],
    "target_unknowns": ["v"],
    "suggested_formulas": [
      "v² = v₀² + 2as",
      "v = v₀ + at",
      "s = v₀t + ½at²"
    ]
  }
}
```

## How Dependencies Work

### Visualization
```
Level 1:    [m]   [h]   [v₀]   [g]
             │     │      │      │
Level 2:     │     │      │     [a]
             │     │      │    ╱
Level 3:     │     └──────┴──[v]
```

In the graph above:
- Node `v` (p6) has **3 dependencies**: `v₀` (p3), `g` (p4), and `h` (p2)
- This creates **3 edges** pointing to node `v`
- Node `a` (p5) has **1 dependency**: `g` (p4)

### Edge Creation Logic

The system automatically creates edges based on the `dependencies` array:

```javascript
// For node p6 with dependencies: ["p3", "p4", "p2"]
// Creates 3 edges:
Edge 1: p3 → p6
Edge 2: p4 → p6  
Edge 3: p2 → p6
```

## Backward Compatibility

The system still supports the old `parent_id` field:

```json
{
  "id": "p5",
  "content": "Result",
  "level": 2,
  "parent_id": "p1",  // ✅ Still works!
  "dependencies": null  // or omitted
}
```

**Priority**: If `dependencies` array exists and has items, it will be used. Otherwise, falls back to `parent_id`.

## Features

### 1. Interactive Highlighting
- Click on a node → all connected edges highlight
- Edges connected to active node turn **blue** and **animate**

### 2. Edge Popover
- Click on any edge → shows inference reasoning
- Displays: "Node X depends on Node Y"
- Shows related formula if available

### 3. Sidebar Details
- Click on node → opens detailed sidebar
- Shows: symbol, value, unit, formula, source text
- Displays all metadata

## Best Practices

### 1. Use Dependencies for Complex Reasoning
```json
{
  "id": "conclusion",
  "dependencies": ["evidence1", "evidence2", "evidence3"],
  "related_formula": "Combined reasoning formula"
}
```

### 2. Keep Graph Organized by Levels
- **Level 1**: Direct facts from problem text
- **Level 2**: Intermediate calculations/derivations  
- **Level 3**: Hidden information or final answers

### 3. Empty Dependencies for Root Nodes
```json
{
  "id": "p1",
  "level": 1,
  "dependencies": []  // or null, or omit field
}
```

## Testing

### Example Test Data
```javascript
const testData = {
  data: {
    analysis_summary: "Test problem with multiple dependencies",
    key_points: [
      { id: "p1", symbol: "a", value: "5", level: 1, dependencies: [] },
      { id: "p2", symbol: "b", value: "3", level: 1, dependencies: [] },
      { id: "p3", symbol: "c", value: "8", level: 2, dependencies: ["p1", "p2"] }
    ],
    target_unknowns: ["c"],
    suggested_formulas: ["c = a + b"]
  }
};
```

### Expected Graph
```
[a:5] ──┐
        ├──→ [c:8]
[b:3] ──┘
```

## Troubleshooting

### Issue: Edges not showing
- ✅ Check `dependencies` is an array
- ✅ Verify dependency IDs match node IDs exactly
- ✅ Ensure IDs are strings (will be converted internally)

### Issue: Edge highlighting not working
- ✅ Make sure `activeNodeId` is passed correctly
- ✅ Check node IDs are consistent (string vs number)

### Issue: Circular dependencies
- ⚠️ Avoid: `A → B → C → A`
- Use proper level hierarchy to prevent cycles

## Summary

The `dependencies` array enables:
- ✅ **Multiple parent nodes** for complex reasoning
- ✅ **Rich relationship graphs** beyond simple trees
- ✅ **Better representation** of real-world problem solving
- ✅ **Backward compatibility** with `parent_id`

Use `dependencies` when a conclusion requires **multiple pieces of evidence**!
