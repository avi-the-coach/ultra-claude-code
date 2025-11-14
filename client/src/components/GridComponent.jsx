import { useRef } from 'react';
import './GridComponent.css';

function GridComponent({
  id,
  type,
  gridPos,
  cellSize,
  children,
  onDragStart,
  onResizeStart,
  isDragging,
  isResizing
}) {
  const componentRef = useRef(null);

  // Calculate pixel position from grid position
  const style = {
    position: 'absolute',
    left: `${gridPos.x * cellSize.width}px`,
    top: `${gridPos.y * cellSize.height}px`,
    width: `${gridPos.w * cellSize.width}px`,
    height: `${gridPos.h * cellSize.height}px`,
  };

  const handleMouseDown = (e) => {
    if (onDragStart) {
      onDragStart(id, e);
    }
  };

  const handleResizeMouseDown = (handle) => (e) => {
    e.stopPropagation(); // Prevent drag from starting
    if (onResizeStart) {
      onResizeStart(id, handle, e);
    }
  };

  // Resize handles: 4 corners + 4 edges
  const resizeHandles = [
    { handle: 'nw', className: 'resize-handle-nw', cursor: 'nwse-resize' },
    { handle: 'n', className: 'resize-handle-n', cursor: 'ns-resize' },
    { handle: 'ne', className: 'resize-handle-ne', cursor: 'nesw-resize' },
    { handle: 'e', className: 'resize-handle-e', cursor: 'ew-resize' },
    { handle: 'se', className: 'resize-handle-se', cursor: 'nwse-resize' },
    { handle: 's', className: 'resize-handle-s', cursor: 'ns-resize' },
    { handle: 'sw', className: 'resize-handle-sw', cursor: 'nesw-resize' },
    { handle: 'w', className: 'resize-handle-w', cursor: 'ew-resize' },
  ];

  return (
    <div
      ref={componentRef}
      className={`grid-component ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={style}
      data-component-id={id}
      data-component-type={type}
    >
      <div
        className="grid-component-header"
        onMouseDown={handleMouseDown}
      >
        <span className="grid-component-title">{type}</span>
      </div>
      <div className="grid-component-content">
        {children}
      </div>

      {/* Resize handles */}
      {resizeHandles.map(({ handle, className, cursor }) => (
        <div
          key={handle}
          className={`resize-handle ${className}`}
          style={{ cursor }}
          onMouseDown={handleResizeMouseDown(handle)}
        />
      ))}
    </div>
  );
}

export default GridComponent;
