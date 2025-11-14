# Canvas Grid

## Overview

A grid-based layout system that allows draggable and resizable components on a canvas. Components snap to an invisible grid and can be freely positioned and layered, giving users maximum flexibility in arranging their workspace. All components are managed uniformly through a dynamic array, enabling future extensibility.

---

## Purpose

Transform the current fixed two-panel layout (Editor + Chat) into a flexible, dashboard-style canvas where:
- Components can be dragged anywhere on the canvas
- Components can be resized by dragging borders/corners
- All positioning snaps to an invisible grid for clean alignment
- Components can overlap and layer, giving users complete freedom
- Layout persists across browser refreshes
- System is ready for future component types

---

## Current State vs. Desired State

### Current (Part 7 Implementation)
```
┌─────────────────────────────────────┐
│ Header (fixed)                      │
├──────────────┬──────────────────────┤
│              │                      │
│   Editor     │   Chat (toggle)      │
│   (fixed)    │   (resizable width)  │
│              │                      │
└──────────────┴──────────────────────┘
```
- Two components side-by-side
- Vertical resizer between them
- Chat can be toggled on/off
- Components fill entire height

### Desired (Canvas Grid)
```
┌─────────────────────────────────────┐
│ Header (fixed)                      │
├─────────────────────────────────────┤
│ ░░░░░░░░ Canvas (gray bg) ░░░░░░░░ │
│ ┌────────┐         ┌──────────────┐│
│ │ Editor │         │     Chat     ││
│ │(drag)  │         │   (drag)     ││
│ │        │         │              ││
│ └────────┘         └──────────────┘│
│                                     │
│  (Components can overlap/layer)     │
└─────────────────────────────────────┘
```
- Components can be positioned anywhere
- Drag by header, resize by borders/corners
- Snap to invisible grid
- Components can overlap (layering supported)
- Chat toggle in header still works

---

## Core Concepts

### Grid System

An invisible grid divides the canvas into cells:

```
Grid Intersection Points (docking points):
●───●───●───●───●───●
│   │   │   │   │   │
●───●───●───●───●───●
│   │   │   │   │   │
●───●───●───●───●───●
```

**Properties:**
- **Grid Cells**: Defined by columns × rows (e.g., 12 × 8)
- **Cell Size**: Calculated dynamically based on canvas size
- **Minimum Cell Size**: Enforced minimum in pixels (prevents tiny cells on small screens)
- **Docking Points**: Grid intersections where components can be positioned
- **Snap Behavior**: Components "magnetize" to nearest valid grid position

### Component Structure

All components (Editor, Chat, future components) are managed uniformly:

```javascript
{
  id: 'editor-1',              // Unique identifier
  type: 'Editor',              // Component type
  gridPos: {
    x: 0,                      // Grid column (0-based)
    y: 0,                      // Grid row (0-based)
    w: 6,                      // Width in grid cells
    h: 8                       // Height in grid cells
  },
  minSize: { w: 4, h: 4 },     // Minimum size in grid cells
  maxSize: null,               // Maximum size in grid cells (null = unlimited)
  removable: true,             // Can be removed
  visible: true                // Currently visible
}
```

### Default Layout

Initial component configuration:

```javascript
const defaultComponents = [
  {
    id: 'editor-1',
    type: 'Editor',
    gridPos: { x: 0, y: 0, w: 6, h: 8 },
    minSize: { w: 4, h: 4 },
    maxSize: null,
    removable: true,
    visible: true
  },
  {
    id: 'chat-1',
    type: 'Chat',
    gridPos: { x: 6, y: 0, w: 6, h: 8 },
    minSize: { w: 3, h: 4 },
    maxSize: { w: 8, h: 12 },
    removable: true,
    visible: true
  }
];
```

**Note**: All components are managed through the same array - no special cases.

---

## Technical Requirements

### 1. Configuration (config.json)

```json
{
  "canvasGrid": {
    "columns": 12,
    "rows": 8,
    "cellMinSize": 50,
    "gridVisibility": "always",
    "snapThreshold": 20,
    "enablePersistence": true
  }
}
```

**Configuration Options:**

| Option | Type | Description | Values |
|--------|------|-------------|--------|
| `columns` | number | Number of grid columns | 1-24 |
| `rows` | number | Number of grid rows | 1-20 |
| `cellMinSize` | number | Minimum cell size in pixels | 20-100 |
| `gridVisibility` | string | When to show grid lines | `"always"` \| `"dragging"` \| `"never"` |
| `snapThreshold` | number | Pixels before snapping | 5-50 |
| `enablePersistence` | boolean | Save layout to localStorage | true/false |

### 2. State Management

**Component State:**
```javascript
const [components, setComponents] = useState(defaultComponents);
const [dragState, setDragState] = useState(null);
const [resizeState, setResizeState] = useState(null);
```

**Grid State:**
```javascript
const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
const [cellSize, setCellSize] = useState({ width: 0, height: 0 });
const [ghostPosition, setGhostPosition] = useState(null);
```

### 3. Core Behaviors

#### Drag Behavior

**User Action**: Click and hold component header → drag → release

**System Behavior**:
1. On mouse down (header):
   - Set `dragState = { componentId, offsetX, offsetY, originalPos }`
   - Change cursor to `grabbing`
   - Increase component z-index (bring to front)

2. During drag (mouse move):
   - Calculate cursor position relative to canvas
   - Convert to grid coordinates
   - Show ghost outline at nearest grid position
   - Constrain to canvas bounds

3. On mouse up (release):
   - Snap component to grid position
   - Update component gridPos in state
   - Reset cursor and z-index

**Edge Cases**:
- Drag beyond canvas bounds → constrain to canvas

#### Resize Behavior

**User Action**: Click and hold component border/corner → drag → release

**Resize Handles**:
- 8 handles per component: 4 corners + 4 edges
- Corners: Resize both width and height
- Edges: Resize one dimension only

**System Behavior**:
1. On mouse down (handle):
   - Set `resizeState = { componentId, handle, originalSize }`
   - Change cursor based on handle direction

2. During resize (mouse move):
   - Calculate new size based on handle type
   - Snap to grid cell boundaries
   - Enforce min/max size constraints
   - Show ghost outline

3. On mouse up (release):
   - Update component gridPos (size)
   - Reset cursor

**Edge Cases**:
- Resize beyond canvas → constrain to canvas bounds
- Resize below minSize → stop at minimum
- Resize above maxSize → stop at maximum

#### Snap Behavior

**Purpose**: Align components to grid automatically

**Algorithm**:
```javascript
function snapToGrid(pixelPosition, cellSize) {
  const gridX = Math.round(pixelPosition.x / cellSize.width);
  const gridY = Math.round(pixelPosition.y / cellSize.height);
  return { x: gridX, y: gridY };
}
```

**Visual Feedback**:
- Component smoothly animates to grid position (CSS transition)
- Transition duration: 150ms

### 4. Window Resize Handling

**Strategy**: Proportional scaling with pixel constraints

**Behavior**:
1. **Grid Cell Size Calculation**:
   ```javascript
   const cellWidth = Math.max(config.cellMinSize, canvasWidth / config.columns);
   const cellHeight = Math.max(config.cellMinSize, canvasHeight / config.rows);
   ```

2. **On Window Resize**:
   - Recalculate cell sizes
   - Components maintain grid position (x, y, w, h in cells)
   - Pixel dimensions scale automatically
   - If window too small → components hit minimum → may overflow

3. **Overflow Handling**:
   - Show scrollbars if canvas content exceeds viewport

### 5. Session Persistence

**Purpose**: Remember layout across browser refreshes

**Storage**: localStorage

**What to Save**:
```javascript
{
  version: 1,
  timestamp: "2025-01-13T...",
  components: [
    { id: "editor-1", gridPos: {...}, visible: true },
    { id: "chat-1", gridPos: {...}, visible: false }
  ]
}
```

**Save Trigger**:
- After drag completes
- After resize completes
- On chat toggle
- Debounced (wait 500ms after last change)

**Load Behavior**:
```javascript
useEffect(() => {
  if (!config.enablePersistence) return;

  const saved = localStorage.getItem('ultra-claude-canvas-layout');
  if (saved) {
    try {
      const { components: savedComponents } = JSON.parse(saved);
      const merged = mergeLayouts(defaultComponents, savedComponents);
      setComponents(merged);
    } catch (e) {
      console.warn('Failed to load layout:', e);
      setComponents(defaultComponents);
    }
  }
}, []);
```

---

## Component Architecture

### Architecture Overview

```
App.jsx
├── <header> (stays unchanged)
└── <Canvas> (new component)
    ├── Grid background (SVG/CSS)
    ├── Ghost outline (during drag/resize)
    └── GridComponent wrappers
        ├── <GridComponent><Editor /></GridComponent>
        └── <GridComponent><Chat /></GridComponent>
```

**Key Principle**: Canvas is a component that owns all grid logic and component management.

### Canvas Component

**Responsibilities**:
- Render grid background (if visible)
- Render ghost outline during drag/resize
- Render all GridComponent wrappers
- Handle drag & drop events
- Handle resize events
- Manage component state (positions, sizes)
- Calculate grid positions
- Persist layout to localStorage

**File**: `client/src/components/Canvas.jsx`

### GridComponent Wrapper

**Responsibilities**:
- Wrap each component (Editor, Chat, etc.)
- Provide drag handle (header)
- Provide resize handles (borders/corners)
- Display component at grid position
- Handle mouse events
- Pass through to inner component

**File**: `client/src/components/GridComponent.jsx`

### Component Registry

**Purpose**: Map component type strings to React components

**File**: `client/src/components/ComponentRegistry.js`

```javascript
import Editor from './Editor';
import Chat from './Chat';

const ComponentRegistry = {
  'Editor': Editor,
  'Chat': Chat,
  // Future components go here
};

export default ComponentRegistry;
```

---

## Visual Design

### Grid Display

**When `gridVisibility === "always"`**:
- Dotted lines for grid
- Medium gray color (#9ca3af)
- 1.5px lines
- Always visible

**When `gridVisibility === "dragging"`**:
- Show grid on drag/resize start
- Fade in animation (200ms)
- Fade out on drag/resize end

**When `gridVisibility === "never"`**:
- No grid lines visible
- Snapping still works (invisible grid)

### Component Appearance

**Default State**:
```css
.grid-component {
  border: 2px solid #d1d5db;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

**Dragging State**:
```css
.grid-component.dragging {
  opacity: 0.7;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  cursor: grabbing;
  z-index: 1000;
}
```

**Resize Handles**:
- 8px wide hit area
- Visible on hover
- Cursor changes based on direction:
  - Corners: `nwse-resize`, `nesw-resize`
  - Sides: `ew-resize`, `ns-resize`

**Ghost Outline** (during drag/resize):
```css
.ghost-outline {
  border: 2px dashed #2563eb;
  background: rgba(37, 99, 235, 0.1);
  border-radius: 8px;
  pointer-events: none;
  z-index: 999;
  transition: all 0.15s ease;
}
```

---

## Integration with Existing Code

### App.jsx Changes

**Before** (current):
```jsx
function App() {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <EditorProvider>
      <header className="app-header">
        {/* Header content */}
      </header>
      <main className="app-main">
        <Editor />
        {isChatOpen && (
          <>
            <div className="resize-handle" />
            <Chat />
          </>
        )}
      </main>
    </EditorProvider>
  );
}
```

**After** (canvas grid):
```jsx
import Canvas from './components/Canvas';

function App() {
  const [components, setComponents] = useState(defaultComponents);

  const handleLayoutChange = (newComponents) => {
    setComponents(newComponents);
  };

  const toggleChat = () => {
    setComponents(prev => prev.map(c =>
      c.type === 'Chat' ? { ...c, visible: !c.visible } : c
    ));
  };

  return (
    <EditorProvider>
      <header className="app-header">
        {/* Header unchanged - still has chat toggle button */}
        <button onClick={toggleChat}>
          <MessageCircle />
        </button>
      </header>
      <main className="app-main">
        <Canvas
          components={components}
          socket={socket}
          sessionId={sessionId}
          onLayoutChange={handleLayoutChange}
        />
      </main>
    </EditorProvider>
  );
}
```

### Chat Toggle Behavior

**How It Works**:
1. Header button calls `toggleChat()`
2. `toggleChat()` updates `visible` property in component state
3. Canvas filters out invisible components when rendering
4. Layout/position preserved when hidden
5. Component re-appears in same position when toggled back on

**Note**: Chat is just a regular component with a toggle button in the header. Any future component could have a similar toggle if needed.

---

## Future Considerations

### Auto-Arrange Button (Future Feature)

**Purpose**: Automatically arrange components to fit optimally without overlap

**When User Clicks "Auto-Arrange"**:
- Analyze current components and their sizes
- Calculate optimal non-overlapping layout
- Animate components to new positions
- Preserve as much of current layout as possible

**Algorithm Considerations**:
- Prioritize larger components
- Minimize total movement
- Respect min/max sizes
- Fill canvas efficiently

### Add/Remove Components (Future Feature)

**When Implemented**:
- Add button in header or context menu
- Component picker modal
- Drag from picker to canvas
- Close button on each component
- Confirmation dialog for removal

### Layout Presets (Future Feature)

**Purpose**: Save/load named layouts

**Examples**:
- "Coding Mode": Large editor, small chat
- "Review Mode": Side-by-side equal
- "Planning Mode": Multiple panels

### Multi-Monitor Support (Future)

**Consideration**: Component positions as percentage of canvas

### Accessibility (Future)

- Keyboard navigation for drag/drop
- Screen reader announcements for position changes
- Focus management

---

## Implementation Checklist

- [x] Update config.json with canvasGrid settings
- [x] Create Canvas component
- [x] Create GridComponent wrapper
- [x] Create ComponentRegistry
- [x] Implement grid calculation logic
- [x] Implement drag behavior (with direct manipulation, no ghost)
- [x] Implement resize behavior (with 8 handles)
- [x] Implement snap-to-grid
- [x] Implement mouseleave detection
- [x] Disable text selection during drag/resize
- [x] Constrain mouse to canvas bounds
- [x] Make resize handles thinner (6px corners, 4px edges)
- [x] Implement session persistence (localStorage)
- [x] Update App.jsx to use Canvas
- [x] Update Chat toggle to work with new system
- [x] Add CSS for grid, components, handles
- [ ] Implement Settings modal with config.json management
- [ ] Implement grid visibility modes (always/dragging/never)
- [ ] Remove debug console.logs
- [ ] Test with different grid configurations
- [ ] Test cross-browser (Chrome, Firefox, Edge)

---

## Success Criteria

✅ Components can be dragged anywhere on canvas
✅ Components snap to grid cleanly
✅ Components can overlap and layer freely
✅ Dragged component appears above others (z-index)
✅ Direct manipulation (no ghost - component moves in real-time)
✅ Cursor changes appropriately (grab/grabbing, resize cursors)
✅ Chat toggle shows/hides Chat component
✅ Layout persists across browser refresh
✅ Grid is configurable via config.json
✅ All components managed uniformly (no hardcoded components)
✅ System ready for future component types
✅ Components can be resized by 8 handles (4 corners + 4 edges)
✅ Mouse leaving canvas auto-ends drag/resize
✅ Text selection disabled during drag/resize
✅ Mouse coordinates constrained to canvas bounds
⏳ Settings modal to edit config.json (Story 6 - in progress)
⏳ Grid visibility modes (always/dragging/never) (Story 6 - in progress)
