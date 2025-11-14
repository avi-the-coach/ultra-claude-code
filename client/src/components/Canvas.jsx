import { useState, useEffect, useRef, useCallback } from 'react';
import GridComponent from './GridComponent';
import ComponentRegistry from './ComponentRegistry';
import config from '../../config.json';
import './Canvas.css';

// Default component layout
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

function Canvas({ components: propsComponents, socket, sessionId, onLayoutChange }) {
  const canvasRef = useRef(null);
  const components = propsComponents || defaultComponents;
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [cellSize, setCellSize] = useState({ width: 0, height: 0 });
  const [dragState, setDragState] = useState(null); // { componentId, offsetX, offsetY, originalPos }
  const [resizeState, setResizeState] = useState(null); // { componentId, handle, originalSize, startPos }

  const gridConfig = config.canvasGrid;

  // Calculate grid cell sizes
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!canvasRef.current) return;

      const { width, height } = canvasRef.current.getBoundingClientRect();

      setCanvasSize({ width, height });
      setCellSize({
        width: Math.max(gridConfig.cellMinSize, width / gridConfig.columns),
        height: Math.max(gridConfig.cellMinSize, height / gridConfig.rows)
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [gridConfig.cellMinSize, gridConfig.columns, gridConfig.rows]);

  // Snap pixel position to grid
  const snapToGrid = useCallback((pixelX, pixelY) => {
    const gridX = Math.round(pixelX / cellSize.width);
    const gridY = Math.round(pixelY / cellSize.height);
    return { x: gridX, y: gridY };
  }, [cellSize]);

  // Drag handlers
  const handleDragStart = (componentId, event) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    const rect = event.currentTarget.parentElement.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();

    setDragState({
      componentId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      originalPos: { ...component.gridPos }
    });

    console.log('Drag started:', componentId);
  };

  const handleDragMove = useCallback((event) => {
    if (!dragState) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const component = components.find(c => c.id === dragState.componentId);
    if (!component) return;

    // Constrain mouse position to canvas bounds
    const constrainedClientX = Math.max(canvasRect.left, Math.min(canvasRect.right, event.clientX));
    const constrainedClientY = Math.max(canvasRect.top, Math.min(canvasRect.bottom, event.clientY));

    // Calculate mouse position relative to canvas
    const mouseX = constrainedClientX - canvasRect.left - dragState.offsetX;
    const mouseY = constrainedClientY - canvasRect.top - dragState.offsetY;

    // Snap to grid
    const snapped = snapToGrid(mouseX, mouseY);

    // Constrain to canvas bounds
    const maxX = gridConfig.columns - component.gridPos.w;
    const maxY = gridConfig.rows - component.gridPos.h;
    const constrainedX = Math.max(0, Math.min(maxX, snapped.x));
    const constrainedY = Math.max(0, Math.min(maxY, snapped.y));

    // Update component position directly
    const newComponents = components.map(c =>
      c.id === dragState.componentId
        ? { ...c, gridPos: { ...c.gridPos, x: constrainedX, y: constrainedY } }
        : c
    );

    onLayoutChange(newComponents);
  }, [dragState, components, cellSize, gridConfig, snapToGrid, onLayoutChange]);

  const handleDragEnd = useCallback(() => {
    if (!dragState) return;

    setDragState(null);

    console.log('Drag ended');
  }, [dragState]);

  // Resize handlers
  const handleResizeStart = (componentId, handle, event) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    setResizeState({
      componentId,
      handle,
      originalSize: { ...component.gridPos },
      startPos: { x: event.clientX, y: event.clientY }
    });

    console.log('Resize started:', componentId, handle);
  };

  const handleResizeMove = useCallback((event) => {
    if (!resizeState) return;

    const component = components.find(c => c.id === resizeState.componentId);
    if (!component) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const { originalSize, startPos, handle } = resizeState;

    // Constrain mouse position to canvas bounds
    const constrainedClientX = Math.max(canvasRect.left, Math.min(canvasRect.right, event.clientX));
    const constrainedClientY = Math.max(canvasRect.top, Math.min(canvasRect.bottom, event.clientY));

    // Calculate delta in pixels
    const deltaX = constrainedClientX - startPos.x;
    const deltaY = constrainedClientY - startPos.y;

    // Convert to grid cells
    const deltaGridX = Math.round(deltaX / cellSize.width);
    const deltaGridY = Math.round(deltaY / cellSize.height);

    let newGridPos = { ...originalSize };

    // Calculate new size based on handle
    switch (handle) {
      case 'se': // bottom-right corner
        newGridPos.w = originalSize.w + deltaGridX;
        newGridPos.h = originalSize.h + deltaGridY;
        break;
      case 'sw': // bottom-left corner
        newGridPos.x = originalSize.x + deltaGridX;
        newGridPos.w = originalSize.w - deltaGridX;
        newGridPos.h = originalSize.h + deltaGridY;
        break;
      case 'ne': // top-right corner
        newGridPos.y = originalSize.y + deltaGridY;
        newGridPos.w = originalSize.w + deltaGridX;
        newGridPos.h = originalSize.h - deltaGridY;
        break;
      case 'nw': // top-left corner
        newGridPos.x = originalSize.x + deltaGridX;
        newGridPos.y = originalSize.y + deltaGridY;
        newGridPos.w = originalSize.w - deltaGridX;
        newGridPos.h = originalSize.h - deltaGridY;
        break;
      case 'e': // right edge
        newGridPos.w = originalSize.w + deltaGridX;
        break;
      case 'w': // left edge
        newGridPos.x = originalSize.x + deltaGridX;
        newGridPos.w = originalSize.w - deltaGridX;
        break;
      case 's': // bottom edge
        newGridPos.h = originalSize.h + deltaGridY;
        break;
      case 'n': // top edge
        newGridPos.y = originalSize.y + deltaGridY;
        newGridPos.h = originalSize.h - deltaGridY;
        break;
    }

    // Enforce min/max size constraints
    const minW = component.minSize?.w || 2;
    const minH = component.minSize?.h || 2;
    const maxW = component.maxSize?.w || gridConfig.columns;
    const maxH = component.maxSize?.h || gridConfig.rows;

    // Store original right/bottom edges before clamping
    const rightEdge = originalSize.x + originalSize.w;
    const bottomEdge = originalSize.y + originalSize.h;

    // Clamp size
    newGridPos.w = Math.max(minW, Math.min(maxW, newGridPos.w));
    newGridPos.h = Math.max(minH, Math.min(maxH, newGridPos.h));

    // Fix position for handles that move both position and size
    // This prevents "sticking" when hitting min/max constraints
    if (handle === 'w' || handle === 'nw' || handle === 'sw') {
      // Left edge handles: keep right edge stationary
      newGridPos.x = rightEdge - newGridPos.w;
    }
    if (handle === 'n' || handle === 'nw' || handle === 'ne') {
      // Top edge handles: keep bottom edge stationary
      newGridPos.y = bottomEdge - newGridPos.h;
    }

    // Constrain to canvas bounds
    newGridPos.x = Math.max(0, Math.min(gridConfig.columns - newGridPos.w, newGridPos.x));
    newGridPos.y = Math.max(0, Math.min(gridConfig.rows - newGridPos.h, newGridPos.y));

    // Update component size directly
    const newComponents = components.map(c =>
      c.id === resizeState.componentId
        ? { ...c, gridPos: newGridPos }
        : c
    );

    onLayoutChange(newComponents);
  }, [resizeState, components, cellSize, gridConfig, onLayoutChange]);

  const handleResizeEnd = useCallback(() => {
    if (!resizeState) return;

    setResizeState(null);

    console.log('Resize ended');
  }, [resizeState]);

  // Mouse event listeners for drag
  useEffect(() => {
    if (!dragState) return;

    const cleanup = () => {
      setDragState(null);
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') cleanup();
    };

    const handleMouseLeave = () => {
      // Mouse left the canvas area - end drag
      cleanup();
      console.log('Mouse left canvas, ending drag');
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('keydown', handleEscape); // ESC to cancel
    window.addEventListener('blur', cleanup); // Clean up if window loses focus

    // Add mouseleave to canvas to detect when mouse exits canvas area
    if (canvasRef.current) {
      canvasRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('blur', cleanup);

      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [dragState, handleDragMove, handleDragEnd]);

  // Mouse event listeners for resize
  useEffect(() => {
    if (!resizeState) return;

    const cleanup = () => {
      setResizeState(null);
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') cleanup();
    };

    const handleMouseLeave = () => {
      // Mouse left the canvas area - end resize
      cleanup();
      console.log('Mouse left canvas, ending resize');
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.addEventListener('keydown', handleEscape); // ESC to cancel
    window.addEventListener('blur', cleanup); // Clean up if window loses focus

    // Add mouseleave to canvas to detect when mouse exits canvas area
    if (canvasRef.current) {
      canvasRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('blur', cleanup);

      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [resizeState, handleResizeMove, handleResizeEnd]);

  // Render grid lines
  const renderGrid = () => {
    if (gridConfig.gridVisibility === 'never') return null;
    if (canvasSize.width === 0 || canvasSize.height === 0) return null;

    console.log('Rendering grid:', { canvasSize, cellSize, gridConfig });

    const lines = [];

    // Vertical lines
    for (let i = 0; i <= gridConfig.columns; i++) {
      lines.push(
        <line
          key={`v-${i}`}
          x1={i * cellSize.width}
          y1={0}
          x2={i * cellSize.width}
          y2={canvasSize.height}
          stroke="#9ca3af"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= gridConfig.rows; i++) {
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * cellSize.height}
          x2={canvasSize.width}
          y2={i * cellSize.height}
          stroke="#9ca3af"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />
      );
    }

    return (
      <svg className="canvas-grid" width={canvasSize.width} height={canvasSize.height}>
        {lines}
      </svg>
    );
  };

  return (
    <div
      ref={canvasRef}
      className={`canvas ${dragState || resizeState ? 'no-select' : ''}`}
    >
      {renderGrid()}
      <div className="canvas-components">
        {components
          .filter(c => c.visible)
          .map(component => {
            const ComponentType = ComponentRegistry[component.type];

            if (!ComponentType) {
              console.warn(`Component type "${component.type}" not found in registry`);
              return null;
            }

            // Prepare props for the component
            const componentProps = {};
            if (component.type === 'Chat') {
              componentProps.socket = socket;
              componentProps.sessionId = sessionId;
            }

            return (
              <GridComponent
                key={component.id}
                id={component.id}
                type={component.type}
                gridPos={component.gridPos}
                cellSize={cellSize}
                minSize={component.minSize}
                maxSize={component.maxSize}
                onDragStart={handleDragStart}
                onResizeStart={handleResizeStart}
                isDragging={dragState?.componentId === component.id}
                isResizing={resizeState?.componentId === component.id}
              >
                <ComponentType {...componentProps} />
              </GridComponent>
            );
          })}
      </div>
    </div>
  );
}

export default Canvas;
