# Client - Main Overview

## Purpose

React + Vite web application providing an intelligent editor with real-time streaming AI responses via Socket.IO connection to our server.

**Tech Stack:**
- **Framework**: React 18+
- **Build Tool**: Vite (fast, modern)
- **Real-time**: Socket.io-client
- **Styling**: TailwindCSS or inline styles
- **Language**: JavaScript/JSX
- **Icons**: lucide-react

---

## Core Features

### Implemented in Example (UX Baseline)
1. ✅ **RTL Text Editor** - Hebrew/Arabic support with line numbers
2. ✅ **Draggable Chat** - Position chat left or right
3. ✅ **Resizable Components** - Chat width + prompt height
4. ✅ **Selection Tracking** - Line:char positions, preview display
5. ✅ **Settings Persistence** - Save/load with documents
6. ✅ **File Management** - Save/load JSON format
7. ✅ **Conversation History** - Persistent chat messages

### New Requirements (Server Integration)
1. 🔜 **Socket.IO Integration** - Replace Anthropic API
2. 🔜 **Streaming Display** - Real-time text chunks
3. 🔜 **Address-Based Context** - Convert selection to start:end format
4. 🔜 **Server Response Handling** - Parse documentUpdate/updateRange

---

## Architecture Overview

```
App Component (Main Container)
    ↓
    ├── Socket Service (connection to server)
    │   └── Session management
    │
    ├── Header Component
    │   ├── Title
    │   ├── Settings button
    │   ├── Help button
    │   └── Chat toggle button
    │
    ├── Main Content Area
    │   ├── Chat Component (left/right)
    │   │   ├── Message list
    │   │   ├── Streaming indicator
    │   │   ├── Selection indicator
    │   │   ├── Prompt resizer
    │   │   └── Input area
    │   │
    │   ├── Width Resizer (vertical bar)
    │   │
    │   └── Editor Component
    │       ├── File controls (save/load)
    │       ├── Line numbers
    │       └── Text area (RTL)
    │
    ├── Settings Modal
    │   └── Configuration UI
    │
    └── Help Modal
        └── Instructions UI
```

---

## State Management Strategy

### Main App State

```javascript
// Connection
const [sessionId, setSessionId] = useState(null);
const [isConnected, setIsConnected] = useState(false);

// Editor
const [content, setContent] = useState('');
const [fileName, setFileName] = useState('מסמך-חדש');
const [isEditingFilename, setIsEditingFilename] = useState(false);

// Selection
const [selectedText, setSelectedText] = useState('');
const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });

// Chat
const [isChatOpen, setIsChatOpen] = useState(false);
const [chatMessages, setChatMessages] = useState([]);
const [userMessage, setUserMessage] = useState('');
const [isProcessingChat, setIsProcessingChat] = useState(false);
const [streamingText, setStreamingText] = useState(''); // NEW
const [chatOnLeft, setChatOnLeft] = useState(false);

// UI Configuration
const [chatWidth, setChatWidth] = useState(350);
const [promptHeight, setPromptHeight] = useState(40);
const [isDragging, setIsDragging] = useState(false);
const [isResizing, setIsResizing] = useState(false);
const [isResizingPrompt, setIsResizingPrompt] = useState(false);

// Modals
const [showHelpModal, setShowHelpModal] = useState(false);
const [showSettingsModal, setShowSettingsModal] = useState(false);

// Settings
const [settings, setSettings] = useState({
  'chat-width': 350,
  'context-window': 1000,
  'prompt-height': 40,
  'chat-on-left': false,
  lastModified: new Date().toISOString()
});
```

---

## Component Breakdown

### Core Components (Separate Specs)

1. **[Editor Component](./editor-component.md)**
   - Text area with RTL support
   - Line numbers
   - Filename editing
   - Word count display
   - File controls (save/load)

2. **[Chat Component](./chat-component.md)**
   - Message display
   - Streaming text indicator (NEW)
   - Selection indicator
   - Input area
   - Draggable positioning

3. **[Selection Management](./selection-management.md)**
   - Track selection (onMouseUp, onKeyUp)
   - Calculate line:char positions
   - Format selection info
   - Convert to address format (NEW)

4. **[Socket Integration](./socket-integration.md)** (CRITICAL)
   - Connect to server
   - Session registration
   - askClaudeCode event
   - Streaming events (NEW)
   - Response handling

5. **[Settings Modal](./settings-modal.md)**
   - Configuration UI
   - Persistence logic
   - Save with documents

6. **[File Management](./file-management.md)**
   - Save as JSON
   - Load from JSON
   - Document format

7. **[Resizer Components](./resizer-components.md)**
   - Chat width resizer
   - Prompt height resizer
   - Mouse event handlers

---

## Project Setup

### Initialize Project

```bash
# Create Vite project
npm create vite@latest ultra-claude-code-client -- --template react

# Navigate to project
cd ultra-claude-code-client

# Install dependencies
npm install socket.io-client lucide-react

# Optional: Add Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Project Structure

```
client/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── EditorComponent.jsx
│   │   │   ├── LineNumbers.jsx
│   │   │   └── FileControls.jsx
│   │   ├── Chat/
│   │   │   ├── ChatComponent.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── StreamingIndicator.jsx
│   │   │   ├── SelectionIndicator.jsx
│   │   │   └── ChatInput.jsx
│   │   ├── Resizers/
│   │   │   ├── WidthResizer.jsx
│   │   │   └── PromptResizer.jsx
│   │   ├── Modals/
│   │   │   ├── SettingsModal.jsx
│   │   │   └── HelpModal.jsx
│   │   └── Header.jsx
│   ├── hooks/
│   │   ├── useSocket.js
│   │   ├── useSelection.js
│   │   ├── useResizer.js
│   │   └── useFileManagement.js
│   ├── services/
│   │   └── socketService.js
│   ├── utils/
│   │   ├── selectionUtils.js
│   │   └── addressUtils.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

---

## Development Flow

### Phase 1: Core Infrastructure
1. **Socket.IO Connection** ([socket-integration.md](./socket-integration.md))
   - Connect to http://localhost:3002
   - Session registration
   - Event listeners setup

2. **Basic Editor** ([editor-component.md](./editor-component.md))
   - Text area with state
   - Basic RTL support

3. **Basic Chat** ([chat-component.md](./chat-component.md))
   - Message display
   - Input area
   - Send button

### Phase 2: Core Features
4. **Selection Tracking** ([selection-management.md](./selection-management.md))
   - onMouseUp/onKeyUp handlers
   - Address calculation

5. **Streaming Integration**
   - Listen to streaming events
   - Display real-time chunks
   - Handle final response

6. **Document Updates**
   - Parse updateRange
   - Apply full/partial updates

### Phase 3: UX Enhancements
7. **Line Numbers**
8. **Selection Indicator**
9. **Word Count**
10. **Filename Editing**

### Phase 4: Advanced Features
11. **Draggable Chat**
12. **Resizable Components**
13. **Settings Modal**
14. **File Save/Load**

---

## Integration Points

### With Server

**Socket.IO Connection:**

```javascript
// Auto-detect URL based on environment
const getServerUrl = () => {
  // In development: Vite proxies to 3002
  // In production: Same origin (3002)
  return window.location.origin;
};

const socket = io(getServerUrl(), {
  transports: ['websocket', 'polling']
});
```

**Socket.IO Events:**

```javascript
// Server → Client
socket.on('sessionRegistered', (data) => {
  setSessionId(data.sessionId);
  setIsConnected(true);
});

socket.on('claudeStreamStart', () => {
  setIsProcessingChat(true);
  setStreamingText('');
});

socket.on('claudeStreamChunk', (data) => {
  setStreamingText(prev => prev + data.text);
});

socket.on('claudeStreamEnd', () => {
  // Streaming complete
});

socket.on('claudeResponse', (data) => {
  // Add message to chat
  // Apply document updates if present
});

// Client → Server
socket.emit('askClaudeCode', {
  sessionId: sessionId,
  prompt: userMessage,
  context: {
    documentContent: content,
    referredText: selectedText || content,
    referredAddress: calculateAddress(), // "0:0" | "0:N" | "start:end"
    conversationHistory: chatMessages,
    systemInstructions: ''
  }
});
```

---

## Key Differences from Example

### What to Keep (UX Baseline)
✅ Overall layout and design
✅ RTL support for Hebrew/Arabic
✅ Draggable chat positioning
✅ Resizable components
✅ Selection indicator display
✅ Line numbers
✅ Settings structure
✅ File save/load format

### What to Change
🔄 Replace Anthropic API → Socket.IO
🔄 Add streaming events handling
🔄 Use address-based semantics (start:end)
🔄 Simplify response parsing (no JSON extraction needed)
🔄 Update context format (referredText, referredAddress)

---

## Dependencies

### Core
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.5.4",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.4.0"
  }
}
```

### Optional (If using Tailwind)
```json
{
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## Running the Application

### Development Mode (Recommended)

**Hybrid setup with hot module replacement:**

```bash
# Terminal 1 - Start Server
cd C:\Users\aviba\Documents\Automation\ultra-claude-code\server
python server.py
# Server runs on http://localhost:3002

# Terminal 2 - Start Client Dev Server
cd C:\Users\aviba\Documents\Automation\ultra-claude-code\client
npm run dev
# Vite dev server runs on http://localhost:5173
# Socket.IO requests proxied to server
```

**Access:** Open browser to `http://localhost:5173`

**Benefits:**
- ⚡ Fast HMR (Hot Module Replacement)
- 🔄 Instant feedback on code changes
- 🛠️ React DevTools work perfectly
- 🚀 No build step needed

### Production Mode

**Build and serve from single server:**

```bash
# Step 1: Build React App
cd client
npm run build
# Creates: server/static/ folder

# Step 2: Start Server
cd ../server
python server.py
# OR
START_SERVER.bat
```

**Access:** Open browser to `http://localhost:3002`

**Benefits:**
- 📦 Single server process
- ⚙️ One command to start
- 🚫 No CORS issues
- 👤 Simpler for end users

---

## Configuration

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3002',
        ws: true,  // Enable WebSocket proxying
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../server/static',  // Build directly to server folder
    emptyOutDir: true
  }
})
```

---

## Next Steps

1. Initialize React + Vite project
2. Install dependencies
3. Read **[socket-integration.md](./socket-integration.md)** (CRITICAL FIRST)
4. Implement basic Socket.IO connection
5. Build basic editor + chat components
6. Add streaming support
7. Implement selection tracking
8. Add UX enhancements from example

---

## Links

- [Architecture Spec](../../architecture-spec.md) - Overall system architecture
- [Server Spec](../server/server.md) - Server API reference
- [Example UI](../../../exampls/hebrew-ai-editor.jsx) - UX baseline reference

---

## Component Specs

**Core Components:**
1. [Editor Component](./editor-component.md)
2. [Chat Component](./chat-component.md)
3. [Selection Management](./selection-management.md)
4. [Socket Integration](./socket-integration.md) ⭐ Start here
5. [Settings Modal](./settings-modal.md)
6. [File Management](./file-management.md)
7. [Resizer Components](./resizer-components.md)
