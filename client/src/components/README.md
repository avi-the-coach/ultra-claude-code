# Components Documentation

## Component Metadata System

This project uses a **hybrid architecture** where components own their metadata, while Canvas manages layout state.

## Architecture Overview

```
App.jsx
├─ Manages layout state (position, size, visibility)
├─ Persists layout to localStorage
└─> Canvas.jsx
      ├─ Merges layout with component metadata
      ├─ Manages drag/resize interactions
      ├─ Queries component metadata from ComponentRegistry
      ├─> Editor (defines own metadata)
      └─> Chat (defines own metadata)
```

### Key Principles

1. **App** - Knows Canvas exists, nothing about component metadata
2. **Canvas** - Manages layout (positions, sizes, visibility), queries component metadata
3. **Components** - Define their own constraints/metadata (minSize, maxSize, etc.)
4. **Persistence** - Only layout data is persisted (position, size, visibility)
5. **Metadata** - Never persisted, always comes from component files

## Component Metadata Structure

Each component exports a `metadata` object alongside its default export:

```javascript
// Component metadata for canvas grid system
export const metadata = {
  type: 'ComponentName',          // Component type identifier
  minSize: { w: 1, h: 1 },        // Minimum grid size (cells)
  maxSize: null,                   // Maximum size (null = no limit)
  removable: true,                 // Can be removed from canvas
  defaultSize: { w: 6, h: 8 }     // Default size when added
};

export default ComponentName;
```

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Unique component type identifier (must match ComponentRegistry key) |
| `minSize` | {w, h} | Minimum size in grid cells (default: {w:1, h:1}) |
| `maxSize` | {w, h} \| null | Maximum size in grid cells (null = canvas bounds only) |
| `removable` | boolean | Whether component can be removed from canvas |
| `defaultSize` | {w, h} | Default size when component is added to canvas |

## How to Add a New Component

### 1. Create Component File

Create your component in `src/components/YourComponent.jsx`:

```javascript
import { useState } from 'react';
import './YourComponent.css';

function YourComponent() {
  // Your component logic
  return (
    <div className="your-component">
      {/* Your component UI */}
    </div>
  );
}

// Component metadata for canvas grid system
export const metadata = {
  type: 'YourComponent',
  minSize: { w: 2, h: 2 },
  maxSize: { w: 8, h: 8 },
  removable: true,
  defaultSize: { w: 4, h: 4 }
};

export default YourComponent;
```

### 2. Register Component

Add to `ComponentRegistry.js`:

```javascript
import YourComponent, { metadata as YourComponentMetadata } from './YourComponent';

const ComponentRegistry = {
  'Editor': Editor,
  'Chat': Chat,
  'YourComponent': YourComponent,  // Add here
};

export const ComponentMetadata = {
  'Editor': EditorMetadata,
  'Chat': ChatMetadata,
  'YourComponent': YourComponentMetadata,  // Add here
};
```

### 3. Add to Default Layout (Optional)

Add to `App.jsx` if you want it in the default layout:

```javascript
const defaultLayout = [
  { id: 'editor-1', type: 'Editor', gridPos: { x: 0, y: 0, w: 6, h: 8 }, visible: true },
  { id: 'chat-1', type: 'Chat', gridPos: { x: 6, y: 0, w: 6, h: 8 }, visible: true },
  { id: 'yours-1', type: 'YourComponent', gridPos: { x: 0, y: 8, w: 4, h: 4 }, visible: true },
];
```

## Layout Data vs Metadata

### Layout Data (Persisted)
Stored in localStorage, managed by App.jsx:
- `id` - Unique instance identifier
- `type` - Component type (references ComponentRegistry)
- `gridPos` - Position and size `{x, y, w, h}`
- `visible` - Visibility state

### Component Metadata (Not Persisted)
Defined in component files, never stored:
- `minSize`, `maxSize` - Size constraints
- `removable` - Can be removed
- `defaultSize` - Default when added

## Example: Complete Component

```javascript
// src/components/Terminal.jsx
import { useState, useRef } from 'react';
import './Terminal.css';

function Terminal() {
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  const handleCommand = (cmd) => {
    setHistory([...history, { type: 'command', text: cmd }]);
    // Execute command logic...
  };

  return (
    <div className="terminal">
      <div className="terminal-history">
        {history.map((entry, i) => (
          <div key={i} className={`entry ${entry.type}`}>
            {entry.text}
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder="$ "
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleCommand(e.target.value);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}

// Component metadata
export const metadata = {
  type: 'Terminal',
  minSize: { w: 3, h: 3 },      // Terminal needs minimum space
  maxSize: null,                 // Can fill entire canvas
  removable: true,
  defaultSize: { w: 6, h: 6 }
};

export default Terminal;
```

## Best Practices

1. **Metadata Location**: Always export metadata from the component file itself
2. **Type Naming**: Use PascalCase for component types, match the component name
3. **Size Constraints**: Set realistic minSize based on component's UI needs
4. **No Hardcoding**: Never hardcode component metadata in App.jsx or Canvas.jsx
5. **Single Source of Truth**: Metadata lives in component file only
6. **Layout Separation**: Only persist layout data (id, type, gridPos, visible)

## Future Enhancements

- **Per-instance overrides**: Allow layout to override component metadata per instance
- **Dynamic components**: Load components dynamically without rebuild
- **Component marketplace**: Share and install community components
- **Configurable metadata**: Edit component constraints via UI
