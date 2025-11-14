# Infinite Canvas Feature

## Overview

Transform the fixed-size canvas into an infinite, zoomable workspace similar to Miro or Windows Whiteboard. Users can pan, zoom, and work across a large virtual space with components that scale proportionally.

---

## Goals

1. **Infinite Virtual Space**: Components can be positioned anywhere in a large bounded canvas
2. **Pan Navigation**: Click-drag background to move viewport around the canvas
3. **Zoom In/Out**: Scale the entire canvas with components and grid scaling proportionally
4. **Multi-Scale Grid**: Grid cells scale with zoom, with larger-scale grids appearing at extreme zoom levels
5. **Performance**: Only render visible components (viewport culling)
6. **Window Resize**: Viewport adjusts to browser size without affecting canvas scale

---

## User Experience

### Pan (Move Around Canvas)
- **Mouse drag on canvas background**: Moves viewport
  - Drag background left → viewport moves right (content appears to move left)
  - Drag background right → viewport moves left (content appears to move right)
- **Scroll**:
  - Mouse wheel alone → scroll up/down
  - Ctrl + Shift + Mouse wheel → scroll left/right

### Zoom
- **Control**: Ctrl + Mouse wheel
- **Zoom Levels**: 25%, 50%, 75%, 100%, 125%, 150%, 200%
- **Progression**: 10% jump steps when using mouse wheel
- **Center Point**: Zoom centered on mouse cursor position
- **Limits**:
  - Minimum zoom: 25%
  - Maximum zoom: 200%

### Grid Behavior
- **Scaling**: Grid cells scale proportionally with zoom level
- **Multi-Scale**:
  - At extreme zoom out: cells shrink until they disappear, replaced by larger-scale grid (e.g., 1 cell → 5 cells)
  - At extreme zoom in: cells grow until limit reached
  - Always have some level of grid visible
- **Grid Types**:
  - Primary grid (1x1 cell)
  - Secondary grid (5x5 cells) - appears when primary too small
  - Tertiary grid (25x25 cells) - appears when secondary too small

### Component Behavior
- **Positioning**: Components maintain grid position (x, y, w, h in cells)
- **Visual Scaling**: Components scale proportionally with zoom
- **Drag/Resize**: Still snap to grid at current zoom level
- **Selection**: Click to select, drag header to move, drag borders to resize

---

## Technical Architecture

### Coordinate Systems

**1. Grid Coordinates** (logical)
- Component position stored as grid cells: `{ x: 2, y: 3, w: 4, h: 3 }`
- Independent of zoom/pan
- Used for snap-to-grid calculations

**2. Canvas Coordinates** (virtual)
- Virtual canvas space in pixels
- Canvas size: configurable (e.g., 100×100 grid = 10,000px × 10,000px at 100% zoom)
- Formula: `canvasX = gridX × cellSize`

**3. Viewport Coordinates** (screen)
- What user sees on screen
- Viewport offset: `{ x, y }` - top-left corner of visible area
- Viewport size: `{ width, height }` - browser window size

**4. Screen Coordinates** (final render)
- Formula: `screenX = (canvasX - viewportX) × zoom`
- Or combined: `screenX = (gridX × cellSize - viewportX) × zoom`

### State Management

```javascript
const [viewport, setViewport] = useState({
  offsetX: 0,        // Viewport top-left X in canvas coordinates
  offsetY: 0,        // Viewport top-left Y in canvas coordinates
  zoom: 1.0,         // Zoom level (0.25 to 2.0)
  width: 0,          // Viewport width (browser window)
  height: 0          // Viewport height (browser window)
});

const [canvasConfig] = useState({
  gridColumns: 100,      // Virtual grid columns
  gridRows: 100,         // Virtual grid rows
  baseCellSize: 100,     // Cell size at 100% zoom (pixels)
  minZoom: 0.25,         // 25%
  maxZoom: 2.0,          // 200%
  zoomStep: 0.1          // 10% increments
});
```

### Viewport Culling

Only render components within viewport bounds (with margin):

```javascript
function isComponentVisible(component, viewport) {
  const margin = 200; // pixels - render slightly outside viewport

  const compLeft = (component.gridPos.x * cellSize - viewport.offsetX) * viewport.zoom;
  const compTop = (component.gridPos.y * cellSize - viewport.offsetY) * viewport.zoom;
  const compRight = compLeft + (component.gridPos.w * cellSize * viewport.zoom);
  const compBottom = compTop + (component.gridPos.h * cellSize * viewport.zoom);

  return !(
    compRight < -margin ||
    compLeft > viewport.width + margin ||
    compBottom < -margin ||
    compTop > viewport.height + margin
  );
}
```

### Grid Rendering

Multi-scale grid system:

```javascript
function getActiveGridScale(zoom) {
  const cellPixelSize = baseCellSize * zoom;

  // Primary grid (1x1) - show when cells are visible enough
  if (cellPixelSize >= 20) {
    return { scale: 1, cellSize: baseCellSize };
  }

  // Secondary grid (5x5) - show when primary too small
  if (cellPixelSize >= 4) {
    return { scale: 5, cellSize: baseCellSize * 5 };
  }

  // Tertiary grid (25x25) - show when secondary too small
  return { scale: 25, cellSize: baseCellSize * 25 };
}
```

Only render grid lines within viewport:

```javascript
function renderGrid(viewport, gridScale) {
  const startCol = Math.floor(viewport.offsetX / gridScale.cellSize);
  const endCol = Math.ceil((viewport.offsetX + viewport.width / viewport.zoom) / gridScale.cellSize);
  const startRow = Math.floor(viewport.offsetY / gridScale.cellSize);
  const endRow = Math.ceil((viewport.offsetY + viewport.height / viewport.zoom) / gridScale.cellSize);

  // Render only visible grid lines
  for (let col = startCol; col <= endCol; col++) {
    // Vertical line at col * gridScale.cellSize
  }
  for (let row = startRow; row <= endRow; row++) {
    // Horizontal line at row * gridScale.cellSize
  }
}
```

### Pan Implementation

```javascript
function handlePanStart(event) {
  // Only on canvas background, not on components
  if (event.target.classList.contains('canvas-background')) {
    setPanState({
      isPanning: true,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: viewport.offsetX,
      startOffsetY: viewport.offsetY
    });
  }
}

function handlePanMove(event) {
  if (!panState.isPanning) return;

  const deltaX = event.clientX - panState.startX;
  const deltaY = event.clientY - panState.startY;

  // Inverse: drag left = move viewport right (increase offsetX)
  setViewport(prev => ({
    ...prev,
    offsetX: Math.max(0, Math.min(
      maxCanvasWidth - prev.width / prev.zoom,
      panState.startOffsetX - deltaX / prev.zoom
    )),
    offsetY: Math.max(0, Math.min(
      maxCanvasHeight - prev.height / prev.zoom,
      panState.startOffsetY - deltaY / prev.zoom
    ))
  }));
}
```

### Zoom Implementation

```javascript
function handleZoom(event) {
  if (!event.ctrlKey) return; // Ctrl must be pressed

  event.preventDefault();

  const delta = -Math.sign(event.deltaY); // Wheel up = +1, down = -1
  const newZoom = Math.max(
    canvasConfig.minZoom,
    Math.min(
      canvasConfig.maxZoom,
      viewport.zoom + delta * canvasConfig.zoomStep
    )
  );

  if (newZoom === viewport.zoom) return;

  // Zoom centered on mouse cursor
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  // Mouse position in canvas coordinates (before zoom)
  const canvasX = viewport.offsetX + mouseX / viewport.zoom;
  const canvasY = viewport.offsetY + mouseY / viewport.zoom;

  // Update viewport to keep mouse position fixed
  setViewport(prev => ({
    ...prev,
    zoom: newZoom,
    offsetX: canvasX - mouseX / newZoom,
    offsetY: canvasY - mouseY / newZoom
  }));
}
```

### Scroll Implementation

```javascript
function handleWheel(event) {
  // Ctrl + Wheel = Zoom (handled by handleZoom)
  if (event.ctrlKey) {
    handleZoom(event);
    return;
  }

  // Ctrl + Shift + Wheel = Horizontal scroll
  if (event.ctrlKey && event.shiftKey) {
    event.preventDefault();
    setViewport(prev => ({
      ...prev,
      offsetX: Math.max(0, Math.min(
        maxCanvasWidth - prev.width / prev.zoom,
        prev.offsetX + event.deltaY / prev.zoom
      ))
    }));
    return;
  }

  // Wheel alone = Vertical scroll
  event.preventDefault();
  setViewport(prev => ({
    ...prev,
    offsetY: Math.max(0, Math.min(
      maxCanvasHeight - prev.height / prev.zoom,
      prev.offsetY + event.deltaY / prev.zoom
    ))
  }));
}
```

### Window Resize Handling

```javascript
useEffect(() => {
  function handleWindowResize() {
    const { width, height } = canvasRef.current.getBoundingClientRect();

    setViewport(prev => ({
      ...prev,
      width,
      height
      // offsetX, offsetY, zoom remain unchanged
    }));
  }

  window.addEventListener('resize', handleWindowResize);
  handleWindowResize(); // Initial size

  return () => window.removeEventListener('resize', handleWindowResize);
}, []);
```

### Component Rendering with Transform

```javascript
function renderComponent(component, viewport) {
  // Skip if not visible
  if (!isComponentVisible(component, viewport)) return null;

  // Calculate screen position
  const screenX = (component.gridPos.x * baseCellSize - viewport.offsetX) * viewport.zoom;
  const screenY = (component.gridPos.y * baseCellSize - viewport.offsetY) * viewport.zoom;
  const screenW = component.gridPos.w * baseCellSize * viewport.zoom;
  const screenH = component.gridPos.h * baseCellSize * viewport.zoom;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: `${screenW}px`,
        height: `${screenH}px`,
        transformOrigin: 'top left',
        // Components maintain their internal aspect ratio
      }}
    >
      {/* Component content */}
    </div>
  );
}
```

---

## Configuration

Add to `config.json`:

```json
{
  "infiniteCanvas": {
    "enabled": true,
    "gridColumns": 100,
    "gridRows": 100,
    "baseCellSize": 100,
    "minZoom": 0.25,
    "maxZoom": 2.0,
    "zoomStep": 0.1,
    "gridScales": [1, 5, 25],
    "gridMinPixelSize": 20,
    "viewportCullingMargin": 200,
    "enablePersistence": true
  }
}
```

---

## Persistence

Save to localStorage:

```json
{
  "version": 1,
  "timestamp": "2025-01-14T12:00:00Z",
  "viewport": {
    "offsetX": 500,
    "offsetY": 300,
    "zoom": 1.0
  },
  "components": [
    {
      "id": "editor-1",
      "gridPos": { "x": 10, "y": 5, "w": 6, "h": 8 },
      "visible": true
    }
  ]
}
```

---

## Performance Considerations

1. **Viewport Culling**: Only render components in visible area (with margin)
2. **Grid Line Culling**: Only render visible grid lines
3. **CSS Transforms**: Use GPU-accelerated transforms for smooth panning/zooming
4. **Debounced Updates**: Debounce zoom/pan state updates for smooth performance
5. **RequestAnimationFrame**: Use RAF for smooth animations
6. **Virtual Scrolling**: For extremely large number of components

---

## Future Enhancements (Separate Features)

These are nice-to-have but leave to last:

1. **Mini-Map**: Small overview showing viewport position and all components
2. **Fit to Screen**: Button to zoom/pan to show all components
3. **Reset View**: Button to return to 100% zoom and center
4. **Zoom to Selection**: Focus on selected component(s)
5. **Keyboard Shortcuts**: Arrow keys to pan, +/- to zoom
6. **Touch Gestures**: Pinch to zoom, two-finger pan on touch devices
7. **Canvas Boundaries Indicator**: Visual indicator when approaching canvas edges
8. **Component Grouping**: Group components and move/scale together

---

## Implementation Stories

See `implementation.md` for detailed breakdown of implementation steps.

---

## Acceptance Criteria

### Pan
- ✅ Click-drag canvas background moves viewport
- ✅ Drag left moves content left (viewport moves right)
- ✅ Mouse wheel scrolls up/down
- ✅ Ctrl+Shift+Wheel scrolls left/right
- ✅ Pan constrained to canvas boundaries

### Zoom
- ✅ Ctrl+Wheel zooms in/out
- ✅ Zoom levels: 25%, 50%, 75%, 100%, 125%, 150%, 200%
- ✅ Zoom centered on mouse cursor
- ✅ Components scale proportionally with zoom
- ✅ Grid scales proportionally with zoom
- ✅ Zoom limits enforced (25% min, 200% max)

### Grid
- ✅ Multi-scale grid system (1x, 5x, 25x)
- ✅ Primary grid visible at normal zoom
- ✅ Secondary grid appears when primary too small
- ✅ Tertiary grid appears when secondary too small
- ✅ Always some level of grid visible
- ✅ Grid lines only render in viewport

### Components
- ✅ Components maintain grid positions
- ✅ Components scale with zoom
- ✅ Drag/resize still snaps to grid
- ✅ Only visible components rendered
- ✅ No performance lag with many components

### Window Resize
- ✅ Viewport size updates on window resize
- ✅ Zoom and offset remain unchanged
- ✅ Components stay in same position
- ✅ No jarring jumps or reflows

### Persistence
- ✅ Viewport position and zoom saved to localStorage
- ✅ Component positions saved
- ✅ Layout restored on browser refresh
- ✅ Graceful fallback if saved data invalid

---

## Testing Strategy

### Manual Testing
1. **Pan**: Drag canvas in all directions, verify smooth movement
2. **Zoom**: Ctrl+Wheel to zoom in/out, verify centered on cursor
3. **Scroll**: Wheel up/down, Ctrl+Shift+Wheel left/right
4. **Grid**: Zoom to different levels, verify multi-scale grid switching
5. **Components**: Verify scaling, drag/resize still works
6. **Performance**: Add many components, verify smooth pan/zoom
7. **Window Resize**: Resize browser, verify viewport adjusts correctly
8. **Persistence**: Pan/zoom, refresh browser, verify state restored

### Edge Cases
- Zoom to minimum (25%) - verify tertiary grid visible
- Zoom to maximum (200%) - verify primary grid visible
- Pan to canvas boundaries - verify can't pan beyond
- Window resize to very small - verify no crashes
- Many components (50+) - verify viewport culling works

---

## Non-Goals (Out of Scope)

- Touch/mobile optimization (future)
- Mini-map (future)
- Keyboard shortcuts (future)
- Component grouping (future)
- Canvas export/import (future)
