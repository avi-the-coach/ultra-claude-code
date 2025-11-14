# Ultra Claude Code - Server

Real-time AI-powered document editing server with persistent Claude Agent SDK and streaming responses.

## Overview

FastAPI + Socket.IO server providing intelligent document editing through Claude Code's Agent SDK. Features persistent connections, real-time streaming, and unified context architecture.

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Claude Code subscription
- No API key needed

### Installation

```bash
# Install server dependencies
pip install -r requirements.txt

# Install client dependencies
cd ../client
npm install
```

### Development Mode (Both Server + Client)

Smart startup scripts that check what's running:

```bash
# From project root - starts both server and client
START_DEV.bat

# Stop both services
STOP_DEV.bat
```

**What START_DEV.bat does:**
- ✅ Checks if server is running (port 3002)
- ✅ Checks if Vite is running (port 5173)
- ✅ Starts only what's needed in separate terminals
- ✅ Safe to run multiple times

**Servers:**
- Server: `http://localhost:3002`
- Client: `http://localhost:5173`

### Server Only

```bash
# Start server only
python server.py
# OR
START_SERVER.bat
```

Server runs on: `http://localhost:3002`

### Testing

```bash
# Open browser test client (no build needed)
# Navigate to: tests/test_client.html
```

## Architecture

```
Client Browser
    ↓ WebSocket (Socket.IO)
Server (server.py)
    ↓
SessionManager (session_manager.py)
    ↓
ClaudeAgent (claude_agent.py)
    ├─→ Persistent ClaudeSDKClient
    └─→ Streaming callback
    ↓
Claude API (via SDK)
    ↓
Streaming response chunks
    ↓
Client sees real-time text
```

### Key Features

- **Persistent SDK Connection**: One ClaudeSDKClient per session, reused across requests
- **Real-time Streaming**: See Claude's response as it generates
- **Unified Context**: Document, selection, history always sent
- **Address-Based Semantics**: Simple `start:end` format for edits
- **Direct JSON Prompting**: No tools, just structured responses

## Deployment Modes

### Development Mode
- **Server** runs on port 3002 (Socket.IO + API)
- **Client** runs on port 5173 (Vite dev server with HMR)
- Vite proxies Socket.IO requests to server
- Fast development with hot module replacement

### Production Mode (Hybrid)
- **Server** runs on port 3002 (serves everything)
- Serves React build at `/`
- Serves Socket.IO at `/socket.io`
- Single command to start: `START_SERVER.bat`

## Folder Structure

```
server/
├── README.md                   # This file
├── requirements.txt            # Python dependencies
├── config.json                 # Server configuration
├── START_SERVER.bat           # Windows startup script
│
├── Core Components
│   ├── server.py              # FastAPI + Socket.IO + Static serving
│   ├── claude_agent.py        # Claude Agent with persistent SDK
│   ├── session_manager.py     # Session management
│   └── config.py              # Configuration loader
│
├── instructions/
│   └── agent-instructions.md  # Agent behavior instructions
│
├── docs/
│   └── interactive-flow-map.html  # Visual flow diagram
│
├── tests/
│   ├── test_client.html       # Browser test client
│   └── test-results/          # Test output files
│
└── static/                     # React build output (production)
    ├── index.html
    ├── assets/
    └── ...
```

## Core Components

### server.py
FastAPI server with Socket.IO for real-time bidirectional communication, plus static file serving for production React app.

**Features:**
- Socket.IO integration for real-time communication
- Static file serving for React client (production)
- SPA routing support (all routes → index.html)
- Health check endpoint

**Socket.IO Events (Client → Server):**
- `askClaudeCode` - Send user request with context

**Socket.IO Events (Server → Client):**
- `sessionRegistered` - Session created
- `claudeStreamStart` - Streaming begins
- `claudeStreamChunk` - Text chunk (real-time)
- `claudeStreamEnd` - Streaming complete
- `claudeResponse` - Final structured response

**HTTP Endpoints:**
- `GET /` - Serve React app (if built) or service info
- `GET /health` - Health check
- `GET /{path}` - Serve React app for all routes (SPA support)

### claude_agent.py
Claude Agent with persistent SDK client and streaming support.

**Key Methods:**
- `__init__(session_id, config)` - Creates persistent ClaudeSDKClient (not connected)
- `process(prompt, context, on_chunk)` - Main entry point with streaming callback
- `cleanup()` - Disconnects SDK client

**Architecture:**
- Lazy connection on first request
- Client reused for all subsequent requests
- Streaming callback emits chunks in real-time
- JSON response parsing (3 strategies)

### session_manager.py
Manages global session with single persistent ClaudeAgent instance.

**Key Methods:**
- `registerSession(socketId)` - Returns 'global-session' ID
- `getAgent(sessionId)` - Returns persistent agent
- `cleanup(sessionId)` - Disconnects SDK client

### config.py
Loads configuration from config.json.

**Configuration:**
```json
{
  "port": 3002,
  "host": "localhost",
  "corsOrigin": "*",
  "socketPath": "/socket.io",
  "editor-agent-instructions": "instructions/agent-instructions.md"
}
```

## Usage

### Client Request Format

```javascript
socket.emit('askClaudeCode', {
  sessionId: 'global-session',
  prompt: "Make this more exciting",
  context: {
    documentContent: "Full document text...",
    referredText: "Selected text...",
    referredAddress: "45:92",  // start:end
    conversationHistory: [],
    systemInstructions: ""
  }
});
```

### Response Format

```javascript
// Streaming events
socket.on('claudeStreamStart', (data) => {
  // Streaming begins
});

socket.on('claudeStreamChunk', (data) => {
  // data.text = real-time text chunk
});

socket.on('claudeStreamEnd', (data) => {
  // Streaming complete
});

// Final structured response
socket.on('claudeResponse', (data) => {
  // data = {
  //   conversationMessage: "I've made it more exciting!",
  //   documentUpdate: "Updated text...",  // Optional
  //   updateRange: "45:92"  // Optional
  // }
});
```

## Operation Modes

### 1. Question/Conversation (address: "0:0")
**When:** No document or just asking questions
**Response:** `conversationMessage` only
**Example:**
```javascript
referredAddress: "0:0"
// Response: { conversationMessage: "..." }
```

### 2. Full Document Edit (address: "0:end" or "0:N")
**When:** Edit entire document
**Response:** `conversationMessage` + `documentUpdate` + `updateRange`
**Example:**
```javascript
referredAddress: "0:231"
// Response: {
//   conversationMessage: "...",
//   documentUpdate: "Complete new text",
//   updateRange: "0:231"
// }
```

### 3. Selection Edit (address: "start:end")
**When:** Edit specific selection
**Response:** `conversationMessage` + `documentUpdate` + `updateRange`
**Example:**
```javascript
referredAddress: "45:92"
// Response: {
//   conversationMessage: "...",
//   documentUpdate: "Updated selection",
//   updateRange: "45:92"
// }
```

## Address-Based Semantics

The `referredAddress` field determines edit mode:

| Address | Meaning | Response |
|---------|---------|----------|
| `"0:0"` | No edit (question) | conversationMessage only |
| `"0:end"` | Full document | conversationMessage + documentUpdate |
| `"0:123"` | Full document (123 chars) | conversationMessage + documentUpdate |
| `"45:92"` | Selection from char 45-92 | conversationMessage + documentUpdate |

## Streaming Flow

```
1. Client sends request
2. Server emits claudeStreamStart
3. Claude generates response
4. Server emits claudeStreamChunk (multiple times)
   → Client displays text in real-time
5. Server emits claudeStreamEnd
6. Server emits claudeResponse (final structured data)
```

## Development

### Agent Instructions

Edit behavior by modifying `instructions/agent-instructions.md`:
- System prompt
- Response format requirements
- JSON structure expectations

File path configured in `config.json` via `editor-agent-instructions` key.

### Testing Streaming

1. Open `tests/test_client.html`
2. Type a prompt
3. Click "Send Request"
4. Watch text appear in real-time
5. See final structured response

### Visual Flow Map

Open `docs/interactive-flow-map.html` for interactive architecture visualization:
- Drag elements to rearrange
- Right-click or Ctrl+Click to copy element IDs
- Paste IDs in conversation for precise questions

## Production Deployment

### Building the Client

Before running in production mode, build the React client:

```bash
# Navigate to client directory
cd ../client

# Install dependencies (first time only)
npm install

# Build for production
npm run build
# This creates: server/static/ folder with built React app
```

### Running in Production

```bash
# Navigate to server directory
cd server

# Start server (serves both React app and Socket.IO)
python server.py
# OR
START_SERVER.bat

# Access application at: http://localhost:3002
```

### Development vs Production

**Development:**
```bash
# Terminal 1 - Server
cd server
python server.py

# Terminal 2 - Client (with HMR)
cd client
npm run dev

# Access at: http://localhost:5173
```

**Production:**
```bash
# Build client once
cd client && npm run build

# Start server
cd ../server
START_SERVER.bat

# Access at: http://localhost:3002
```

### Distribution

To distribute the application:
1. Build the client: `cd client && npm run build`
2. Package the `server/` folder (includes `static/`)
3. User only needs: Python + requirements.txt
4. User runs: `START_SERVER.bat`

## Troubleshooting

**Issue:** Port 3002 already in use
**Fix:** Change port in config.json or kill process

**Issue:** Client not found at `/`
**Fix:** Build the React client: `cd ../client && npm run build`

**Issue:** SDK connection timeout
**Fix:** Ensure Claude Code is running and authorized

**Issue:** Streaming not working
**Fix:** Check browser console for Socket.IO connection errors

**Issue:** Empty responses
**Fix:** Check agent instructions file exists and is valid

## Requirements

```
fastapi==0.115.5
python-socketio==5.11.4
uvicorn==0.32.0
claude-agent-sdk==0.1.15
```

## Configuration Files

### config.json
```json
{
  "port": 3002,
  "host": "localhost",
  "corsOrigin": "*",
  "socketPath": "/socket.io",
  "editor-agent-instructions": "instructions/agent-instructions.md"
}
```

### instructions/agent-instructions.md
Contains system prompt for Claude Agent behavior.

## Performance

- **Persistent Connection**: No reconnection overhead between requests
- **Streaming**: Real-time feedback, perceived latency ~0ms
- **Session Reuse**: Single SDK client per session
- **Lazy Connection**: SDK connects on first request only

## License

MIT

## Support

For issues, see project documentation and interactive flow map in `docs/` folder.
