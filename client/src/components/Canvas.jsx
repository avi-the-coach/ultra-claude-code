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
  const [ghostPosition, setGhostPosition] = useState(null); // { x, y, w, h }

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

    // Calculate mouse position relative to canvas
    const mouseX = event.clientX - canvasRect.left - dragState.offsetX;
    const mouseY = event.clientY - canvasRect.top - dragState.offsetY;

    // Snap to grid
    const snapped = snapToGrid(mouseX, mouseY);

    // Constrain to canvas bounds
    const maxX = gridConfig.columns - component.gridPos.w;
    const maxY = gridConfig.rows - component.gridPos.h;
    const constrainedX = Math.max(0, Math.min(maxX, snapped.x));
    const constrainedY = Math.max(0, Math.min(maxY, snapped.y));

    setGhostPosition({
      x: constrainedX,
      y: constrainedY,
      w: component.gridPos.w,
      h: component.gridPos.h
    });
  }, [dragState, components, cellSize, gridConfig, snapToGrid]);

  const handleDragEnd = useCallback(() => {
    if (!dragState || !ghostPosition) {
      setDragState(null);
      setGhostPosition(null);
      return;
    }

    // Update component position
    const newComponents = components.map(c =>
      c.id === dragState.componentId
        ? { ...c, gridPos: { ...c.gridPos, x: ghostPosition.x, y: ghostPosition.y } }
        : c
    );

    onLayoutChange(newComponents);
    setDragState(null);
    setGhostPosition(null);

    console.log('Drag ended, new position:', ghostPosition);
  }, [dragState, ghostPosition, components, onLayoutChange]);

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

    // Calculate delta in pixels
    const deltaX = event.clientX - startPos.x;
    const deltaY = event.clientY - startPos.y;

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

    newGridPos.w = Math.max(minW, Math.min(maxW, newGridPos.w));
    newGridPos.h = Math.max(minH, Math.min(maxH, newGridPos.h));

    // Constrain to canvas bounds
    newGridPos.x = Math.max(0, Math.min(gridConfig.columns - newGridPos.w, newGridPos.x));
    newGridPos.y = Math.max(0, Math.min(gridConfig.rows - newGridPos.h, newGridPos.y));

    setGhostPosition(newGridPos);
  }, [resizeState, components, cellSize, gridConfig]);

  const handleResizeEnd = useCallback(() => {
    if (!resizeState || !ghostPosition) {
      setResizeState(null);
      setGhostPosition(null);
      return;
    }

    // Update component size
    const newComponents = components.map(c =>
      c.id === resizeState.componentId
        ? { ...c, gridPos: ghostPosition }
        : c
    );

    onLayoutChange(newComponents);
    setResizeState(null);
    setGhostPosition(null);

    console.log('Resize ended, new size:', ghostPosition);
  }, [resizeState, ghostPosition, components, onLayoutChange]);

  // Mouse event listeners for drag
  useEffect(() => {
    if (!dragState) return;

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [dragState, handleDragMove, handleDragEnd]);

  // Mouse event listeners for resize
  useEffect(() => {
    if (!resizeState) return;

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
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

  // Render ghost outline during drag
  const renderGhost = () => {
    if (!ghostPosition) return null;

    const style = {
      position: 'absolute',
      left: `${ghostPosition.x * cellSize.width}px`,
      top: `${ghostPosition.y * cellSize.height}px`,
      width: `${ghostPosition.w * cellSize.width}px`,
      height: `${ghostPosition.h * cellSize.height}px`,
    };

    return <div className="ghost-outline" style={style} />;
  };

  return (
    <div ref={canvasRef} className="canvas">
      {renderGrid()}
      {renderGhost()}
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
