# Remaining Client Specs - Summary

Due to context limits, here's a summary of the remaining 5 component specs to be created. Ask me to expand any specific one when needed.

---

## 1. chat-component.md

**Based on**: Example lines 5-166 (ChatComponent), 203-207 (chat states)

**Key Features:**
- Message list display (user/assistant)
- **Streaming text indicator** (NEW - shows real-time chunks)
- Selection indicator (shows selected text info)
- Resizable prompt input (40-200px height)
- Draggable positioning (left/right)
- Auto-scroll to bottom
- Enter to send, Shift+Enter for new line

**Key Changes from Example:**
- Remove API call logic
- Add streaming text display
- Keep selection indicator UI (lines 98-122)
- Keep prompt resizer (lines 124-125, 356-365)
- Keep message format

**Props:**
```javascript
{
  chatMessages,
  streamingText, // NEW
  isProcessing,
  selectedText,
  userMessage,
  onSendMessage,
  onMessageChange,
  chatWidth,
  promptHeight,
  chatOnLeft,
  onClose
}
```

---

## 2. selection-management.md

**Based on**: Example lines 227-248 (handleSelection), 367-389 (getSelectionInfo)

**Key Features:**
- Track selection on mouseUp/keyUp
- Calculate character positions (start/end)
- Calculate line:char positions
- **Convert to address format** (NEW - "0:0", "0:N", "start:end")
- Format selection info for display
- Clear selection

**Key Functions:**
```javascript
handleSelection() // Track selection
getTextPosition(index) // Get line:char from index
getSelectionInfo() // Format selection data
calculateAddress() // NEW - Convert to "start:end"
clearSelection() // Clear selection state
```

**Address Calculation (NEW):**
```javascript
const calculateAddress = (content, selectedText, selectionRange) => {
  if (!selectedText || selectionRange.start === selectionRange.end) {
    return "0:0"; // Question mode
  }
  return `${selectionRange.start}:${selectionRange.end}`; // Selection mode
};
```

---

## 3. settings-modal.md

**Based on**: Example lines 189-196 (settings state), 966-1080 (modal UI), 599-611 (save logic)

**Key Features:**
- Modal UI for configuration
- Chat width setting (250-600px)
- Context window size (500-5000 words)
- Prompt height (40-200px)
- Chat position (left/right)
- Custom link field (Facebook - optional)
- Save/cancel buttons

**Settings Structure:**
```javascript
{
  'chat-width': 350,
  'context-window': 1000,
  'prompt-height': 40,
  'chat-on-left': false,
  lastModified: ISO string
}
```

**Persistence:**
- Saved with document (in JSON file)
- Loaded when opening document
- Default values if not saved

---

## 4. file-management.md

**Based on**: Example lines 614-695 (save/load functions)

**Key Features:**
- Save as JSON format
- Load from JSON
- Preserve conversation history
- Preserve settings
- Handle file picker
- Sanitize line breaks
- Error handling for invalid files

**Document Format:**
```json
{
  "content": "document text",
  "conversation": [...chatMessages],
  "fileName": "document-name",
  "timestamp": "ISO timestamp",
  "settings": {...settings}
}
```

**Key Functions:**
```javascript
saveContentToFile() // Create JSON blob + download
loadContentFromFile(event) // Read file + parse JSON
```

---

## 5. resizer-components.md

**Based on**: Example lines 251-364 (resizer logic), 311-321, 356-365 (components)

**Key Features:**
- **Chat Width Resizer** (vertical bar)
  - Mouse down/move/up handlers
  - Global event listeners
  - Min 250px, max 600px
  - RTL direction handling
  - Visual feedback (hover/active states)

- **Prompt Height Resizer** (horizontal bar)
  - Mouse down/move/up handlers
  - Global event listeners
  - Min 40px (1 line), max 200px (~5 lines)
  - Drag up to increase height
  - Visual feedback

**Components:**
```javascript
<WidthResizer
  onMouseDown={handleResizerMouseDown}
  isResizing={isResizing}
/>

<PromptResizer
  onMouseDown={handlePromptResizerMouseDown}
  isResizing={isResizingPrompt}
/>
```

**Mouse Event Pattern:**
```javascript
// 1. Mouse down - capture start position
// 2. Add global listeners (move, up)
// 3. Mouse move - calculate delta, update width/height
// 4. Mouse up - remove global listeners, cleanup
```

---

## Priority Order for Expansion

1. **chat-component.md** - Critical for displaying streaming
2. **selection-management.md** - Critical for address calculation
3. **file-management.md** - Nice to have for saving work
4. **settings-modal.md** - Nice to have for customization
5. **resizer-components.md** - Nice to have for UX

---

## Status

**Created:**
- ✅ client.md (main overview)
- ✅ socket-integration.md (CRITICAL)
- ✅ editor-component.md

**To Create:**
- 🔜 chat-component.md
- 🔜 selection-management.md
- 🔜 settings-modal.md
- 🔜 file-management.md
- 🔜 resizer-components.md

---

## Next Steps

Ask me to expand any of these specs when you're ready to implement that component:

```
"Please expand chat-component.md"
"Please expand selection-management.md"
etc.
```

I'll create a full, detailed spec just like the ones already created.
