# Editor Component

## Purpose

Main text editing area with RTL support, line numbers, file controls, and selection tracking.

**Based on**: Example lines 776-896

---

## Features

1. ✅ **Text Area** - Large editing space with RTL support
2. ✅ **Line Numbers** - Synchronized with content
3. ✅ **Filename Editing** - Click to edit filename
4. ✅ **Word Count** - Display word count
5. ✅ **File Controls** - Save/load buttons
6. ✅ **Selection Tracking** - onMouseUp/onKeyUp handlers

---

## Component Structure

```
EditorComponent
    ├── FileControls (header)
    │   ├── Filename (editable)
    │   ├── Word count
    │   ├── Save button
    │   └── Load button
    │
    └── Editor Area
        ├── LineNumbers (left sidebar)
        └── TextArea (RTL)
```

---

## Props

```javascript
EditorComponent.propTypes = {
  content: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSelection: PropTypes.func.isRequired,
  fileName: PropTypes.string.isRequired,
  onFileNameChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onLoad: PropTypes.func.isRequired
};
```

---

## State

```javascript
const EditorComponent = ({ content, onChange, onSelection, ... }) => {
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  const textAreaRef = useRef(null);

  // Word count calculation
  const wordCount = useMemo(() => {
    if (!content.trim()) return 0;
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, [content]);

  // ...
};
```

---

## File Controls Header

### Filename Editing

**Example: Lines 788-820**

```javascript
<div className="flex items-center gap-3">
  <FileText className="w-5 h-5 text-gray-600" />

  {isEditingFilename ? (
    <input
      type="text"
      value={fileName}
      onChange={(e) => {
        // Sanitize filename
        const sanitized = e.target.value.replace(/[<>:"/\\|?*]/g, '');
        onFileNameChange(sanitized);
      }}
      onBlur={() => setIsEditingFilename(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          setIsEditingFilename(false);
        }
      }}
      className="text-gray-700 font-medium bg-transparent border-b-2 border-blue-500 focus:outline-none"
      autoFocus
    />
  ) : (
    <span
      className="text-gray-700 font-medium cursor-pointer hover:text-blue-600 transition-colors"
      onClick={() => setIsEditingFilename(true)}
      title="Click to edit filename"
    >
      {fileName}.json
    </span>
  )}

  <span className="text-gray-500 text-sm">
    ({wordCount} words)
  </span>
</div>
```

### Save/Load Buttons

**Example: Lines 822-840**

```javascript
<div className="flex items-center gap-2">
  <button
    onClick={onSave}
    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
    <Save className="w-4 h-4" />
    Save
  </button>

  <label className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm cursor-pointer">
    <Upload className="w-4 h-4" />
    Load
    <input
      type="file"
      accept=".txt,.md,.json,.html,.rtf"
      onChange={onLoad}
      style={{ display: 'none' }}
    />
  </label>
</div>
```

---

## Editor Area

### Line Numbers

**Example: Lines 844-868**

```javascript
<div
  className="bg-gray-50 border-r border-gray-200 text-xs text-gray-500 font-mono min-w-[50px] overflow-hidden"
  style={{
    direction: 'ltr',  // Line numbers LTR even for RTL text
    paddingTop: '1rem',
    paddingRight: '0.5rem',
    paddingLeft: '0.25rem'
  }}
>
  {content.split('\n').map((_, index) => (
    <div
      key={index}
      className="text-right"
      style={{
        height: '1.5rem',  // Match textarea line-height
        lineHeight: '1.5rem',
        fontSize: '0.75rem'
      }}
    >
      {index + 1}
    </div>
  ))}
</div>
```

**Key Points:**
- Direction `ltr` for line numbers (even if text is RTL)
- Synchronized height with textarea (1.5rem per line)
- Right-aligned numbers
- Matches textarea padding

---

### Text Area (RTL)

**Example: Lines 870-894**

```javascript
<textarea
  ref={textAreaRef}
  value={content}
  onChange={onChange}
  onMouseUp={onSelection}  // Selection tracking
  onKeyUp={onSelection}    // Selection tracking
  onBlur={(e) => {
    // Don't clear selection when losing focus to chat
  }}
  className="flex-1 resize-none focus:border-blue-500 focus:outline-none border-2 border-gray-200 rounded-r-lg"
  style={{
    direction: 'rtl',           // RTL text direction
    textAlign: 'right',         // Right-aligned
    fontFamily: 'Arial, sans-serif',
    fontSize: '1.125rem',       // 18px
    lineHeight: '1.5rem',       // 24px - match line numbers
    padding: '1rem',
    margin: 0,
    border: 'none',
    borderLeft: '2px solid #e5e7eb',
    borderRadius: '0 0.5rem 0.5rem 0'
  }}
  placeholder="Start typing here..."
/>
```

**Critical Styling:**
- `direction: 'rtl'` - Right-to-left text
- `textAlign: 'right'` - Right alignment
- `lineHeight: '1.5rem'` - Matches line numbers exactly
- `resize-none` - Prevent manual resizing
- No bottom border (only left border)

---

## Selection Tracking

### Handle Selection Changes

```javascript
const handleSelection = () => {
  const textarea = textAreaRef.current;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = content.substring(start, end);

  if (selected.trim() && selected.length > 0) {
    onSelection({
      text: selected,
      start: start,
      end: end
    });
  } else {
    onSelection(null); // Clear selection
  }
};
```

---

## Word Count Calculation

```javascript
const getWordCount = (text) => {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};
```

---

## Complete Component Example

```javascript
import React, { useState, useRef, useMemo } from 'react';
import { FileText, Save, Upload } from 'lucide-react';

const EditorComponent = ({
  content,
  onChange,
  onSelection,
  fileName,
  onFileNameChange,
  onSave,
  onLoad
}) => {
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  const textAreaRef = useRef(null);

  // Word count
  const wordCount = useMemo(() => {
    if (!content.trim()) return 0;
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, [content]);

  // Selection handler
  const handleSelection = () => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    if (selected.trim() && selected.length > 0) {
      onSelection({ text: selected, start, end });
    } else {
      onSelection(null);
    }
  };

  return (
    <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
      {/* File Controls Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-600" />
          {isEditingFilename ? (
            <input
              type="text"
              value={fileName}
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[<>:"/\\|?*]/g, '');
                onFileNameChange(sanitized);
              }}
              onBlur={() => setIsEditingFilename(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingFilename(false);
              }}
              className="text-gray-700 font-medium bg-transparent border-b-2 border-blue-500 focus:outline-none"
              autoFocus
            />
          ) : (
            <span
              className="text-gray-700 font-medium cursor-pointer hover:text-blue-600"
              onClick={() => setIsEditingFilename(true)}
            >
              {fileName}.json
            </span>
          )}
          <span className="text-gray-500 text-sm">({wordCount} words)</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700">
            <Save className="w-4 h-4" />
            Save
          </button>

          <label className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            Load
            <input
              type="file"
              accept=".txt,.md,.json"
              onChange={onLoad}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex" style={{ height: 'calc(100% - 80px)' }}>
        {/* Line Numbers */}
        <div
          className="bg-gray-50 border-r border-gray-200 text-xs text-gray-500 font-mono min-w-[50px]"
          style={{
            direction: 'ltr',
            paddingTop: '1rem',
            paddingRight: '0.5rem'
          }}
        >
          {content.split('\n').map((_, index) => (
            <div
              key={index}
              className="text-right"
              style={{ height: '1.5rem', lineHeight: '1.5rem' }}
            >
              {index + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textAreaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onMouseUp={handleSelection}
          onKeyUp={handleSelection}
          className="flex-1 resize-none focus:outline-none border-l-2 border-gray-200"
          style={{
            direction: 'rtl',
            textAlign: 'right',
            fontSize: '1.125rem',
            lineHeight: '1.5rem',
            padding: '1rem'
          }}
          placeholder="Start typing..."
        />
      </div>
    </div>
  );
};

export default EditorComponent;
```

---

## RTL Support Details

### Why RTL?

Hebrew and Arabic are right-to-left languages. The example is designed for Hebrew content.

### CSS for RTL

```css
/* Text area RTL */
textarea {
  direction: rtl;
  text-align: right;
  unicode-bidi: embed;
}

/* Line numbers stay LTR */
.line-numbers {
  direction: ltr;
  text-align: right;
}
```

### Auto-Detect Language (Advanced)

```javascript
const detectDirection = (text) => {
  // Check if text contains Hebrew/Arabic characters
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
  return rtlRegex.test(text) ? 'rtl' : 'ltr';
};

<textarea
  style={{
    direction: detectDirection(content),
    textAlign: detectDirection(content) === 'rtl' ? 'right' : 'left'
  }}
/>
```

---

## Performance Optimization

### Line Numbers

```javascript
// Memoize line numbers to avoid re-rendering on every keystroke
const lineNumbers = useMemo(() => {
  const lines = content.split('\n');
  return lines.map((_, index) => (
    <div key={index} style={{ height: '1.5rem', lineHeight: '1.5rem' }}>
      {index + 1}
    </div>
  ));
}, [content.split('\n').length]); // Only update when line count changes
```

### Debounce onChange

```javascript
import { useDeb ounce } from 'use-debounce';

const [debouncedContent] = useDebounce(content, 300);

useEffect(() => {
  // Auto-save or sync with parent
}, [debouncedContent]);
```

---

## Accessibility

```javascript
<textarea
  ref={textAreaRef}
  value={content}
  onChange={onChange}
  onMouseUp={handleSelection}
  onKeyUp={handleSelection}
  aria-label="Document editor"
  role="textbox"
  aria-multiline="true"
  placeholder="Start typing here..."
/>
```

---

## Next Steps

1. Create `EditorComponent.jsx` in `src/components/Editor/`
2. Extract `FileControls` into separate component (optional)
3. Extract `LineNumbers` into separate component (optional)
4. Test RTL text rendering
5. Move to [selection-management.md](./selection-management.md) for selection logic

---

## Links

- [← Back to Client Overview](./client.md)
- [Selection Management](./selection-management.md) - Selection tracking logic
- [File Management](./file-management.md) - Save/load implementation
- [Example Reference](../../../exampls/hebrew-ai-editor.jsx) - Lines 776-896
