# Ultra Claude Code - Architecture Specification

## Project Overview

Ultra Claude Code is a local AI-powered application that provides a web-based chat interface with an integrated editor. The system uses **Claude Agent SDK** to provide AI capabilities through the user's existing Claude Code subscription (no API costs).

## Core Concept

- **Client**: Web-based UI with chat and editor components
- **Server**: Local Python server (FastAPI + Socket.IO) with Claude Agent SDK
- **AI Agent**: Claude via persistent SDK connection with streaming responses
- **Goal**: Full modularity between client and server to enable alternative client implementations

**Key Innovation**: Using Claude Agent SDK's persistent connection with streaming callbacks for real-time AI-powered document editing.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│           Browser Client (Unique Session ID)             │
│  ┌──────────────┐  ┌──────────────────────────────┐     │
│  │   Chat UI    │  │   Editor UI                  │     │
│  │  (Streaming) │  │   (Selection tracking)       │     │
│  └──────┬───────┘  └────────┬─────────────────────┘     │
│         │                   │                            │
│         └───────┬───────────┘                            │
│                 │                                        │
└─────────────────┼────────────────────────────────────────┘
                  │ Socket.IO (Real-time)
                  │ Events: askClaudeCode, streaming events
                  │
┌─────────────────▼────────────────────────────────────────┐
│         Local Server (Python + FastAPI)                  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │      Socket.IO Event Handlers                    │   │
│  │  • connect → register session                    │   │
│  │  • askClaudeCode → route to agent               │   │
│  │  • disconnect → cleanup                          │   │
│  └────────┬─────────────────────────────────────────┘   │
│           │                                              │
│  ┌────────▼─────────────────────────────────────────┐   │
│  │     Session Manager                              │   │
│  │  • Single global session                         │   │
│  │  • Manages persistent Claude Agent              │   │
│  └────────┬─────────────────────────────────────────┘   │
│           │                                              │
│  ┌────────▼─────────────────────────────────────────┐   │
│  │  Claude Agent Component                          │   │
│  │                                                   │   │
│  │  ┌───────────────────────────────────────────┐   │   │
│  │  │ Claude Agent SDK Client (Persistent)      │   │   │
│  │  │  • One connection per session             │   │   │
│  │  │  • Lazy connection on first request       │   │   │
│  │  │  • Streaming async responses via callback │   │   │
│  │  │  • Direct JSON prompting (no tools)       │   │   │
│  │  └───────────────────────────────────────────┘   │   │
│  │                                                   │   │
│  │  • Loads instructions from .md file              │   │
│  │  • Builds unified context (doc + selection)      │   │
│  │  • Streams chunks via callback                   │   │
│  │  • Parses JSON responses                         │   │
│  │                                                   │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────┬───────────────────────────────────────┘
                   │ Claude Agent SDK
                   │
┌──────────────────▼───────────────────────────────────────┐
│            Claude Code (via Subscription)                │
│  • Analyzes context (document, selection, prompt)       │
│  • Generates response                                   │
│  • Streams back to server                               │
└──────────────────────────────────────────────────────────┘
```

---

## Communication Flow

### Startup

1. **Server starts** → Creates SessionManager with persistent ClaudeAgent
2. **Client connects** → Server emits `sessionRegistered` with session ID
3. **SDK initialization** → ClaudeAgent creates ClaudeSDKClient (not connected yet)

### Request Processing

1. **Client sends request** → `askClaudeCode` event with context
2. **Agent receives request** → Lazy connect on first request
3. **Context building** → Agent formats unified context with instructions, document, selection
4. **SDK query** → Send prompt to persistent SDK connection
5. **Streaming begins** → Server emits `claudeStreamStart`
6. **Chunks arrive** → Server emits `claudeStreamChunk` for each text chunk
7. **Streaming ends** → Server emits `claudeStreamEnd`
8. **Response parsing** → Agent parses JSON response
9. **Final response** → Server emits `claudeResponse` with structured data

---

## Project Structure

```
ultra-claude-code/
├── server/                    # Backend application
│   ├── server.py              # FastAPI + Socket.IO + Static serving
│   ├── session_manager.py     # Session management (global session)
│   ├── claude_agent.py        # Claude Agent with persistent SDK
│   ├── config.py              # Configuration loader
│   ├── config.json            # Server configuration
│   ├── requirements.txt       # Python dependencies
│   ├── START_SERVER.bat       # Windows startup script
│   │
│   ├── instructions/
│   │   └── agent-instructions.md  # Agent behavior instructions
│   │
│   ├── docs/
│   │   └── interactive-flow-map.html  # Visual architecture
│   │
│   ├── tests/
│   │   ├── test_client.html   # Browser test client
│   │   └── test-results/      # Test output files
│   │
│   └── static/                # React build output (production)
│       ├── index.html
│       ├── assets/
│       └── ...
│
├── client/                    # Frontend application (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   └── Editor/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js         # Proxy + build config
│   └── README.md
│
└── specs/                     # Documentation
    ├── architecture-spec.md   # This file
    ├── ultra-claude-code/
    │   ├── ultra-claude-code.md
    │   ├── client/
    │   │   └── client.md
    │   └── server/
    │       ├── server.md
    │       ├── session-manager.md
    │       ├── claude-agent.md
    │       └── config.md
    └── implementation-plan.md
```

---

## Server Architecture

### Core Components

**server.py**
- FastAPI + Socket.IO server
- Event handlers for connection, askClaudeCode, disconnect
- Streaming callback implementation
- Emits streaming events (start/chunk/end/response)

**session_manager.py**
- Single global session for all clients
- Creates and manages persistent ClaudeAgent
- Async cleanup with SDK disconnect

**claude_agent.py**
- Persistent ClaudeSDKClient connection
- Lazy connection pattern (connect on first request)
- Loads instructions from configurable .md file
- Builds unified context (instructions + history + document + selection)
- Streaming callback for real-time chunks
- JSON response parsing (3 strategies)

**config.py**
- Loads configuration from config.json
- Provides port, host, CORS, instructions file path

### Socket.io Events

**Server → Client:**
- `sessionRegistered` - Session created with ID
- `claudeStreamStart` - Streaming begins
- `claudeStreamChunk` - Text chunk (real-time)
- `claudeStreamEnd` - Streaming complete
- `claudeResponse` - Final structured response

**Client → Server:**
- `askClaudeCode` - Send request with context

---

## Client Architecture

### Components Overview

**Chat Component**
- Message history display
- Text input
- Streaming text indicator
- Shows real-time chunks as they arrive

**Editor Component**
- Text area for document editing
- Selection tracking (start/end positions)
- Word/character count display

### Key Features

1. **Streaming Display**: Real-time text as Claude generates
2. **Address-Based Context**: Simple start:end format for operations
3. **Selection Tracking**: Character-based positions for edits
4. **Unified Context**: Always send full document + selection

### Socket.io Integration

```javascript
// Connect
const socket = io('http://localhost:3002');

// Receive session
socket.on('sessionRegistered', (data) => {
  sessionId = data.sessionId;
});

// Listen for streaming
socket.on('claudeStreamStart', () => {
  // Show streaming indicator
});

socket.on('claudeStreamChunk', (data) => {
  // Append data.text to display
});

socket.on('claudeStreamEnd', () => {
  // Hide streaming indicator
});

socket.on('claudeResponse', (data) => {
  // Add to chat
  // Apply document updates if present
});

// Send request
socket.emit('askClaudeCode', {
  sessionId: sessionId,
  prompt: 'User message',
  context: {
    documentContent: 'Full text...',
    referredText: 'Selection or full text...',
    referredAddress: 'start:end',
    conversationHistory: [],
    systemInstructions: ''  // Loaded by server
  }
});
```

---

## Client-Server Communication Protocol

### askClaudeCode Request

```javascript
{
  sessionId: string,
  prompt: string,
  context: {
    documentContent: string,      // Full document text
    referredText: string,          // Selection or full document
    referredAddress: string,       // "0:0" | "0:N" | "start:end"
    conversationHistory: Array,    // [{role, message, timestamp}]
    systemInstructions: string     // Leave empty (server loads)
  }
}
```

### Address Semantics

| Address | Meaning | Usage |
|---------|---------|-------|
| `"0:0"` | Question/conversation | No document edit |
| `"0:123"` | Full document (123 chars) | Edit entire document |
| `"45:92"` | Selection (chars 45-92) | Edit specific selection |

### Response Events

**Streaming Flow:**
```
1. claudeStreamStart    → {sessionId}
2. claudeStreamChunk    → {text} (multiple times)
3. claudeStreamEnd      → {sessionId}
4. claudeResponse       → {conversationMessage, documentUpdate?, updateRange?}
```

**Final Response:**
```javascript
{
  conversationMessage: string,    // For chat display (always)
  documentUpdate?: string,        // Updated text (optional)
  updateRange?: string            // "start:end" (optional)
}
```

---

## Technology Stack

### Server
- **Runtime**: Python 3.10+
- **Framework**: FastAPI (async web framework)
- **Real-time**: python-socketio (Socket.IO for Python)
- **AI Integration**: claude-agent-sdk (Claude Agent SDK)
- **Session Management**: In-memory global session

### Client
- **Framework**: React
- **Build**: Vite (fast dev experience)
- **Real-time**: socket.io-client
- **Styling**: TailwindCSS or basic CSS

### Server Capabilities
- ✅ Claude Agent SDK integration (persistent connection)
- ✅ Streaming responses via callbacks
- ✅ Direct JSON prompting (no tools/hooks)
- ✅ Unified context architecture
- ✅ Address-based semantics
- ✅ Configurable instruction file
- ✅ Static file serving for React app (production)

### Deployment Modes

**Development Mode:**
- Server: `python server.py` (port 3002)
- Client: `npm run dev` (port 5173, proxies to 3002)
- Fast HMR, instant feedback

**Production Mode (Hybrid):**
- Build: `cd client && npm run build` → creates `server/static/`
- Server: `python server.py` (port 3002, serves everything)
- Single process, single port, no CORS

---

## Implementation Status

### Completed ✅
**Server:**
- [x] FastAPI + Socket.IO setup
- [x] SessionManager with global session
- [x] ClaudeAgent with persistent SDK
- [x] Streaming support with callbacks
- [x] Address-based semantics
- [x] Configurable instructions
- [x] Test client (HTML)
- [x] Documentation

**Client:**
- [ ] React project structure
- [ ] Socket.IO integration
- [ ] Chat component with streaming
- [ ] Editor component with selection
- [ ] Address calculation

### Next Steps

**Development Setup:**
1. Initialize React client project: `npm create vite@latest client -- --template react`
2. Configure Vite (proxy + build path)
3. Implement Socket.IO connection
4. Build chat component with streaming display
5. Build editor component with selection tracking
6. Test in development mode

**Production Build:**
1. Build client: `cd client && npm run build`
2. Test production: `cd server && python server.py`
3. Access at `http://localhost:3002`

---

## Key Design Decisions

### 1. Persistent SDK Connection
**Why**: Efficient reuse of connection across requests. SDK designed for session-based use, not per-request activation.

### 2. Streaming via Callbacks
**Why**: Real-time feedback, perceived latency ~0ms. Backward compatible - can skip streaming if not needed.

### 3. Address-Based Semantics
**Why**: Simple, deterministic format (start:end). Easy to parse and validate. No complex selection objects.

### 4. Direct JSON Prompting
**Why**: No tools, no hooks, no orchestration overhead. Simple prompt → JSON response pattern.

### 5. Single Global Session
**Why**: Simplifies architecture for single-user local app. Can expand to multi-session later if needed.

### 6. Unified Context
**Why**: Always send full context (document + selection + history). Agent has all information to make decisions.

### 7. Instructions from File
**Why**: Easy to modify agent behavior. No client-side instruction management needed in Phase 1.

### 8. No Authentication
**Why**: Local-only application on localhost. Security boundary is the local machine.

---

## Performance Characteristics

- **Persistent Connection**: No reconnection overhead between requests
- **Streaming**: Real-time feedback, perceived latency ~0ms
- **Session Reuse**: Single SDK client per session
- **Lazy Connection**: SDK connects on first request only
- **Memory**: Single agent instance for global session

---

## Testing Strategy

### Server Testing
1. **Connection test**: Socket.IO connection and session registration
2. **Streaming test**: Verify all streaming events (start/chunk/end)
3. **Question test**: Address "0:0" returns conversation only
4. **Full document test**: Address "0:N" updates entire document
5. **Selection test**: Address "start:end" updates partial text

### Client Testing (TBD)
1. **Socket connection**: Connect and receive session ID
2. **Streaming display**: Show chunks in real-time
3. **Selection tracking**: Calculate addresses correctly
4. **Document updates**: Apply full/partial updates correctly

### Integration Testing
- Use `test_client.html` as reference for expected behavior
- Test all operation modes (question, full, partial)
- Verify streaming works end-to-end

---

## Reference Implementation

The test client (`server/tests/test_client.html`) demonstrates:
- Socket.IO connection and session management
- Streaming event handling
- Address-based requests (0:0, 0:N, start:end)
- Real-time text display
- Document update application

**Use as reference** for building the React client.

---

## Links

- [Main Spec](./ultra-claude-code/ultra-claude-code.md)
- [Implementation Plan](./implementation-plan.md)
- [Server Spec](./ultra-claude-code/server/server.md)
- [Client Spec](./ultra-claude-code/client/client.md)
