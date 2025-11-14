# Ultra Claude Code

## Vision

An AI-powered local application providing an intelligent editor with real-time streaming responses, powered by Claude Agent SDK.

**Philosophy**: Simple, efficient architecture for AI-powered document editing with persistent SDK connections.

## Core Concept

- **Local-first**: Everything runs on localhost
- **Real-time**: WebSocket communication with streaming responses
- **Persistent SDK**: Single connection per session, reused across requests
- **Address-Based**: Simple start:end format for operations
- **Phase-based Development**: Start simple (editor), expand systematically

## Architecture Overview

```
Browser (Client)  ←→  Python Server  ←→  Claude Agent SDK
   [React UI]         [FastAPI +           [Persistent Connection]
   [Streaming]         Socket.IO]
```

### Components

1. **[Client](./client/client.md)** - React web application (Editor + Chat with streaming)
2. **[Server](./server/server.md)** - Python FastAPI server with Claude Agent SDK

### Current Implementation

**Server (Complete):**
- FastAPI + Socket.IO for real-time communication
- SessionManager with single global session
- ClaudeAgent with persistent SDK connection
- Streaming support via callbacks
- Address-based semantics (0:0, 0:N, start:end)
- Configurable instruction file

**Client (To Be Built):**
- React application with Vite
- Socket.IO integration
- Chat component with streaming display
- Editor component with selection tracking
- Address calculation and management

### Communication Flow

1. Client connects to server via Socket.io
2. Server assigns session ID and creates persistent agent
3. Client sends prompts via `askClaudeCode` event with context
4. Server streams responses in real-time (start/chunk/end)
5. Client displays text as it generates
6. Final structured response includes document updates if any

## Key Features

### Implemented ✅
- **Persistent SDK Connection** - One ClaudeSDKClient per session, reused across requests
- **Real-time Streaming** - See Claude's response as it generates
- **Unified Context** - Document, selection, history always sent
- **Address-Based Semantics** - Simple `start:end` format for edits
- **Direct JSON Prompting** - No tools, just structured responses
- **Configurable Instructions** - Loaded from .md file

### To Be Implemented
- **React Client** - Full UI implementation
- **Streaming Display** - Real-time text rendering
- **Selection Management** - Address calculation and tracking
- **Document Updates** - Apply full/partial edits

## Technology Stack

- **Client**: React, Vite, Socket.io-client
- **Server**: Python, FastAPI, python-socketio, claude-agent-sdk
- **AI**: Claude Agent SDK (persistent connection, no tools)

## Socket.IO Events

**Server → Client:**
- `sessionRegistered` - Session created with ID
- `claudeStreamStart` - Streaming begins
- `claudeStreamChunk` - Text chunk (real-time)
- `claudeStreamEnd` - Streaming complete
- `claudeResponse` - Final structured response

**Client → Server:**
- `askClaudeCode` - Send request with context

## Address-Based Semantics

| Address | Meaning | Usage |
|---------|---------|-------|
| `"0:0"` | Question/conversation | No document edit |
| `"0:123"` | Full document (123 chars) | Edit entire document |
| `"45:92"` | Selection (chars 45-92) | Edit specific selection |

## Project Structure

```
ultra-claude-code/
├── server/                         # Python server (COMPLETE)
│   ├── server.py
│   ├── session_manager.py
│   ├── claude_agent.py
│   ├── config.py
│   ├── config.json
│   ├── requirements.txt
│   ├── START_SERVER.bat
│   ├── instructions/
│   │   └── agent-instructions.md
│   ├── docs/
│   │   └── interactive-flow-map.html
│   └── tests/
│       ├── test_client.html
│       └── test-results/
│
├── client/                         # React client (TO BE BUILT)
│   ├── src/
│   ├── package.json
│   └── README.md
│
└── specs/                          # Documentation
    ├── architecture-spec.md
    ├── implementation-plan.md
    ├── ultra-claude-code/
    │   ├── ultra-claude-code.md    # This file
    │   ├── client/
    │   │   └── client.md
    │   └── server/
    │       ├── server.md
    │       ├── session-manager.md
    │       ├── claude-agent.md
    │       └── config.md
```

## Implementation Status

### Phase 1: Server (Complete ✅)

**Goal**: Fully functional server with streaming support

- ✅ FastAPI + Socket.IO setup
- ✅ SessionManager with global session
- ✅ ClaudeAgent with persistent SDK
- ✅ Streaming callbacks
- ✅ Address-based semantics
- ✅ Configurable instructions
- ✅ Test client (HTML)
- ✅ Documentation

### Phase 2: Client (Next)

**Goal**: React client with streaming UI

- [ ] React project structure
- [ ] Socket.IO integration
- [ ] Chat component with streaming
- [ ] Editor component with selection
- [ ] Address calculation
- [ ] Document update application

### Phase 3: UI Polish

**Goal**: Enhanced user experience

- [ ] Draggable/resizable chat
- [ ] RTL support
- [ ] File save/load
- [ ] Settings panel
- [ ] Undo/redo

### Phase 4: Extended Features

**Goal**: Additional capabilities

- [ ] Multiple documents
- [ ] Syntax highlighting
- [ ] Line numbers
- [ ] Keyboard shortcuts

## Key Design Decisions

### Why Persistent SDK Connection?
**Efficiency** - No reconnection overhead. SDK designed for session-based use.

### Why Streaming?
**UX** - Real-time feedback, perceived latency ~0ms. Shows progress.

### Why Address-Based Semantics?
**Simplicity** - Easy to calculate, parse, and validate. No complex objects.

### Why Direct JSON Prompting?
**Performance** - No tools, hooks, or orchestration overhead. Simple pattern.

### Why Single Global Session?
**Simplicity** - Single-user local app. Can expand later if needed.

### Why No Authentication?
**Local-only** - Security boundary is the local machine.

## Performance

- **Persistent Connection**: No reconnection overhead between requests
- **Streaming**: Real-time feedback, perceived latency ~0ms
- **Session Reuse**: Single SDK client for global session
- **Lazy Connection**: SDK connects on first request only
- **Memory**: Single agent instance

## Testing

### Server (Complete)
- Connection and session registration ✅
- Streaming events (start/chunk/end) ✅
- Question mode (0:0) ✅
- Full document mode (0:N) ✅
- Selection mode (start:end) ✅

### Client (To Do)
- Socket.IO connection
- Streaming display
- Selection tracking
- Document updates

### Test Client
Reference implementation: `server/tests/test_client.html`

## Development

- **[Implementation Plan](../implementation-plan.md)** - Development strategy
- **[Architecture Spec](../architecture-spec.md)** - Detailed technical spec
- **[Server README](../../server/README.md)** - Server documentation
- **[Client Spec](./client/client.md)** - Client implementation guide

## Next Steps

1. Initialize React client project
2. Implement Socket.IO connection
3. Build chat component with streaming display
4. Build editor component with selection tracking
5. Connect everything and test end-to-end

---

## Links

- [Architecture Spec](../architecture-spec.md) - Detailed architecture
- [Server Spec](./server/server.md) - Server implementation
- [Client Spec](./client/client.md) - Client implementation
- [Implementation Plan](../implementation-plan.md) - Development plan
