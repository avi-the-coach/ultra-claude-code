# Ultra Claude Code - Implementation Plan

## Project Structure: Monorepo Approach

This project is structured as a **monorepo** with self-contained components:

```
ultra-claude-code/
├── specs/                          # All design documentation
│   ├── implementation-plan.md      # This file
│   ├── ultra-claude-code/          # Architecture specs
│   └── exampls/                    # Reference examples
│
├── server/                         # Python server (standalone)
│   ├── server.py
│   ├── config.py
│   ├── session_manager.py
│   ├── claude_code_service.py
│   ├── langgraph_orchestrator.py
│   ├── requirements.txt
│   ├── config.json
│   ├── README.md
│   └── tests/
│       ├── test_phase1_socketio.py
│       ├── test_phase2_subprocess.py
│       ├── test_phase3_langgraph.py
│       ├── test_phase4_workflow.py
│       ├── test_client.html
│       └── test_data/
│           ├── conversation.json
│           ├── full_document.json
│           └── selection.json
│
└── client/                         # React client (standalone)
    ├── src/
    ├── public/
    ├── package.json
    ├── README.md
    └── tests/
```

**Key Principles**:
- Each component (`server/`, `client/`) is **self-contained**
- Each has its own dependencies, tests, README
- Can be developed, tested, deployed independently
- Shared only through well-defined APIs (Socket.io in this case)

---

## Implementation Strategy

**Phased Approach**: Build incrementally, test each phase before moving forward

**Rule**: ❌ **DO NOT** move to next phase until current phase is tested and working

---

## Server Implementation Phases

### 🎯 Phase 1: Basic Server + Socket.io (Foundation)

**Goal**: Get FastAPI + Socket.io running, test connection and session management

#### Implementation Tasks

1. **Setup Project**:
   - Create `server/` folder
   - Create `requirements.txt`
   - Install dependencies: `fastapi`, `uvicorn`, `python-socketio`

2. **Create Files**:
   - `server.py` - Main FastAPI app with Socket.io
   - `config.py` - Configuration loader
   - `session_manager.py` - SessionManager class (Phase 1: global session)
   - `config.json` - Server configuration (port, host)

3. **Implement Core**:
   - FastAPI app initialization
   - Socket.io integration
   - `connect` event handler → emit `sessionRegistered`
   - `askClaudeCode` event handler → echo response (dummy)
   - `disconnect` event handler

4. **Create Test Client**:
   - `tests/test_client.html` - Simple HTML page with socket.io-client
   - Test connection, session registration, echo

#### Code Structure

**server.py**:
```python
from fastapi import FastAPI
import socketio
from session_manager import SessionManager
from config import loadConfig

# Load config
config = loadConfig()

# Create FastAPI app
app = FastAPI()

# Create Socket.io server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# Session manager
sessionManager = SessionManager()

@sio.event
async def connect(sid, environ):
    sessionId = sessionManager.registerSession(sid)
    await sio.emit('sessionRegistered', {'sessionId': sessionId}, room=sid)

@sio.event
async def askClaudeCode(sid, data):
    # Phase 1: Echo response
    await sio.emit('claudeResponse', {
        'conversationMessage': f"Echo: {data['prompt']}",
        'updateType': 'none'
    }, room=sid)

@sio.event
async def disconnect(sid):
    pass  # Phase 1: No cleanup

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host=config['host'], port=config['port'])
```

#### Testing Phase 1

**Test Checklist**:
- ✅ Server starts without errors
- ✅ Can access server at `http://localhost:3001`
- ✅ Socket.io connection established
- ✅ `sessionRegistered` event received with session ID
- ✅ Echo `askClaudeCode` works (send prompt, get echo back)
- ✅ Server logs show connection/disconnect

**Test Tools**:
- `tests/test_client.html` - Open in browser
- Browser console - Check for errors
- Server terminal - Check logs

**Test Script** (`tests/test_client.html`):
```html
<!DOCTYPE html>
<html>
<head>
  <title>Phase 1 Test: Socket.io</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Phase 1 Test: Server Connection</h1>
  <div id="status">Connecting...</div>
  <input id="prompt" type="text" placeholder="Type message">
  <button onclick="sendMessage()">Send</button>
  <div id="response"></div>

  <script>
    const socket = io('http://localhost:3001');
    let sessionId = null;

    socket.on('sessionRegistered', (data) => {
      sessionId = data.sessionId;
      document.getElementById('status').innerHTML =
        `✅ Connected! Session ID: ${sessionId}`;
      console.log('Session registered:', data);
    });

    socket.on('claudeResponse', (data) => {
      document.getElementById('response').innerHTML =
        `Response: ${data.conversationMessage}`;
      console.log('Response received:', data);
    });

    function sendMessage() {
      const prompt = document.getElementById('prompt').value;
      socket.emit('askClaudeCode', {
        sessionId: sessionId,
        prompt: prompt,
        context: {}
      });
    }
  </script>
</body>
</html>
```

**Success Criteria**:
- Open test_client.html in browser
- See "✅ Connected! Session ID: ..."
- Type message, click Send
- See "Response: Echo: [your message]"

**Exit Criteria**: All checkboxes ✅ before moving to Phase 2

---

### 🎯 Phase 2: Claude Agent SDK Integration (LLM Wrapper)

**Goal**: Integrate Claude Code using Claude Agent SDK with subscription authentication

**CRITICAL**: Must remove `ANTHROPIC_API_KEY` environment variable to use subscription instead of API!

#### Implementation Tasks

1. **Install Dependencies**:
   - Add to `requirements.txt`: `claude-agent-sdk`
   - Install: `pip install claude-agent-sdk`

2. **Create File**:
   - `claude_code_service.py` - ClaudeCodeLLM class using SDK

3. **Implement Core**:
   - `__init__()` - Store session ID
   - `spawn()` - Initialize SDK client (optional pre-configuration)
   - `askClaudeCode()` - Send prompt via SDK, collect streaming response
   - `formatMessage()` - Format prompt with context
   - `cleanup()` - SDK auto-cleanup via context manager

4. **Integrate with Server**:
   - Update `session_manager.py` to create ClaudeCodeLLM
   - Update `server.py` to use SDK-based LLM instead of echo

5. **Create Tests**:
   - `tests/test_phase2_subprocess.py` - Direct SDK test
   - Update `test_client.html` for real AI responses

#### Code Structure

**claude_code_service.py**:
```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

class ClaudeCodeLLM:
    """LLM wrapper using Claude Agent SDK with subscription."""

    def __init__(self, sessionId):
        self.sessionId = sessionId
        self.client = None
        self.options = None

    def spawn(self):
        """Initialize SDK client configuration (optional)."""
        self.options = ClaudeAgentOptions()
        # Client created in async context when needed

    async def askClaudeCode(self, prompt, context=None):
        """Send prompt to Claude using SDK."""
        message = self.formatMessage(prompt, context)

        # Create client in async context
        async with ClaudeSDKClient() as client:
            # Send query
            await client.query(message)

            # Collect streaming response
            response_parts = []
            async for response_message in client.receive_response():
                if hasattr(response_message, 'content'):
                    for block in response_message.content:
                        if hasattr(block, 'text'):
                            response_parts.append(block.text)

            return '\n'.join(response_parts)

    def formatMessage(self, prompt, context):
        """Format prompt with context (Phase 2: pass-through)."""
        return prompt

    def cleanup(self):
        """SDK handles cleanup via context manager."""
        pass
```

#### Testing Phase 2

**Test Checklist**:
- ✅ Claude Agent SDK imports successfully
- ✅ SDK client initializes without errors
- ✅ Can send simple prompt: "What is 2+2?"
- ✅ Response is received and readable
- ✅ Streaming response collection works
- ✅ Multiple prompts in sequence work
- ✅ Cleanup works (SDK auto-cleanup)
- ✅ Integration with server works
- ✅ Subscription authentication confirmed (apiKeySource: 'none')

**Direct Test** (`tests/test_phase2_subprocess.py`):
```python
import asyncio
from claude_code_service import ClaudeCodeLLM

async def test_basic_prompt():
    print("Testing Claude Agent SDK...")

    llm = ClaudeCodeLLM('test-session')
    llm.spawn()

    print("Sending prompt: 'What is 2+2?'")
    response = await llm.askClaudeCode("What is 2+2?", {})

    print(f"Response: {response}")
    assert response is not None
    assert len(response) > 0

    llm.cleanup()
    print("✅ Phase 2 test passed!")

if __name__ == "__main__":
    asyncio.run(test_basic_prompt())
```

**Integration Test**:
- Use `test_client.html` from Phase 1
- Send real prompt instead of echo
- Verify real Claude Code response

**Success Criteria**:
- Direct test passes
- Integration test shows real AI responses in browser
- SDK streaming works correctly
- Subscription mode confirmed (no API key needed)

**Exit Criteria**: All checkboxes ✅ before moving to Phase 3

---

### 🎯 Phase 3: Claude Agent with Custom Tools

**Goal**: Implement Claude Agent component with custom tools for document operations

#### Implementation Tasks

1. **Create Claude Agent Component**:
   - `claude_agent.py` - ClaudeAgent class
   - Implement tool definitions using `@tool()` decorator
   - Implement hooks for validation and formatting

2. **Define Custom Tools**:
   - `update_full_document` - Replace entire document
   - `update_selection` - Replace selected text
   - `respond_conversation_only` - Just conversation, no edits

3. **Implement Hooks**:
   - PreToolUse - Validate document operations
   - PostToolUse - Format responses, add metadata

4. **Update Service Wrapper**:
   - Modify `claude_code_service.py` to use ClaudeAgent
   - Maintain backwards compatibility

5. **Test Agent Logic**:
   - Test tool selection (Claude chooses right tool)
   - Test structured responses
   - Test hooks execution

#### Code Structure

**claude_agent.py**:
```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, tool
from typing import Any, Dict

class ClaudeAgent:
    """Claude Agent with custom tools for document operations."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.tools = self._define_tools()
        self.hooks = self._define_hooks()
        self.options = ClaudeAgentOptions(
            tools=self.tools,
            hooks=self.hooks
        )

    def _define_tools(self):
        """Define custom tools."""
        return [
            self._update_full_document_tool(),
            self._update_selection_tool(),
            self._respond_only_tool()
        ]

    def _update_full_document_tool(self):
        @tool(
            "update_full_document",
            "Replace entire document with new content",
            {"new_content": str, "explanation": str}
        )
        async def tool_impl(args: dict[str, Any]) -> dict[str, Any]:
            return {
                "content": [{"type": "text", "text": args["explanation"]}],
                "tool_result": {
                    "updateType": "full",
                    "documentUpdate": args["new_content"]
                }
            }
        return tool_impl

    async def process(self, prompt: str, context: Dict) -> Dict:
        """Process request through Claude Agent SDK."""
        full_prompt = self._format_with_context(prompt, context)

        async with ClaudeSDKClient(options=self.options) as client:
            await client.query(full_prompt)

            response_parts = []
            tool_results = []

            async for message in client.receive_response():
                if hasattr(message, 'content'):
                    for block in message.content:
                        if hasattr(block, 'text'):
                            response_parts.append(block.text)
                if hasattr(message, 'tool_result'):
                    tool_results.append(message.tool_result)

            return self._format_response(response_parts, tool_results)
```

#### Testing Phase 3

**Test Checklist**:
- ✅ Claude Agent component created successfully
- ✅ Custom tools defined and registered
- ✅ Hooks implemented (PreToolUse, PostToolUse)
- ✅ Agent decides correct tool based on prompt
- ✅ Conversation-only works (no document changes)
- ✅ Full document update works
- ✅ Partial selection update works
- ✅ Structured responses formatted correctly
- ✅ Integration with server works

**Direct Test**:
```python
import asyncio
from claude_agent import ClaudeAgent

async def test_agent_tools():
    print("Testing Claude Agent with custom tools...")

    agent = ClaudeAgent('test-session')

    # Test 1: Conversation only
    result = await agent.process(
        "What makes a good opening?",
        {"documentContent": "Sample document..."}
    )
    assert result['updateType'] == 'none'
    print("✅ Conversation test passed")

    # Test 2: Full document update
    result = await agent.process(
        "Summarize this to 50 words",
        {"documentContent": "Long document... (200 words)"}
    )
    assert result['updateType'] == 'full'
    assert 'documentUpdate' in result
    print("✅ Full document test passed")

    # Test 3: Selection update
    result = await agent.process(
        "Rephrase this paragraph",
        {
            "documentContent": "Full doc...",
            "selection": {
                "text": "Selected text...",
                "start": 100,
                "end": 150
            }
        }
    )
    assert result['updateType'] == 'partial'
    assert 'selectionRange' in result
    print("✅ Selection update test passed")

if __name__ == "__main__":
    asyncio.run(test_agent_tools())
```

**Success Criteria**:
- All three operation types work (conversation, full, partial)
- Claude correctly selects appropriate tool
- Hooks validate and format responses
- Integration test shows structured responses

**Exit Criteria**: All checkboxes ✅ before moving to Phase 4

---

### 🎯 Phase 4: Enhanced Agent Features & Client Integration

**Goal**: Polish agent features and integrate with browser client

#### Implementation Tasks

1. **Update State Schema**:
   - Create `EditorState` with all fields (from langgraph-orchestrator.md)

2. **Implement 5 Nodes**:
   - `context_builder` - Formats context
   - `operation_detector` - Determines operation type (uses Claude Code LLM)
   - `conversation_handler` - Handles chat-only
   - `document_handler` - Handles document/selection updates
   - `response_formatter` - Validates response

3. **Wire Conditional Routing**:
   - operation_detector → conversation OR document
   - Both → response_formatter → END

4. **Update Orchestrator**:
   - Get LLM from session manager
   - Pass to nodes via config
   - Return proper response format

#### Testing Phase 4

**Test Cases**:

**Test 1: Conversation Only**
```json
{
  "prompt": "What makes a good article opening?",
  "context": {
    "systemInstructions": "...",
    "conversationHistory": [],
    "documentContent": "",
    "selection": {}
  }
}
```
**Expected**:
```json
{
  "conversationMessage": "A good opening should...",
  "updateType": "none"
}
```

**Test 2: Full Document Update**
```json
{
  "prompt": "Summarize this to 50 words",
  "context": {
    "systemInstructions": "...",
    "conversationHistory": [],
    "documentContent": "Long document here... (200 words)",
    "selection": {}
  }
}
```
**Expected**:
```json
{
  "conversationMessage": "I've summarized the document.",
  "documentUpdate": "Summarized text (50 words)",
  "updateType": "full"
}
```

**Test 3: Selection Update**
```json
{
  "prompt": "Rephrase this paragraph",
  "context": {
    "systemInstructions": "...",
    "conversationHistory": [],
    "documentContent": "Full document...",
    "selection": {
      "text": "Selected paragraph...",
      "start": 100,
      "end": 250,
      "startLine": 5,
      "startChar": 0,
      "endLine": 8,
      "endChar": 20
    }
  }
}
```
**Expected**:
```json
{
  "conversationMessage": "I've rephrased the paragraph.",
  "documentUpdate": "Rephrased paragraph...",
  "updateType": "partial",
  "selectionRange": {
    "start": 100,
    "end": 250
  }
}
```

#### Test Files

Create test data files:
- `tests/test_data/conversation.json`
- `tests/test_data/full_document.json`
- `tests/test_data/selection.json`

Create test runner:
```python
# tests/test_phase4_workflow.py
import pytest
import json
from langgraph_orchestrator import LangGraphOrchestrator

@pytest.fixture
def orchestrator():
    from session_manager import SessionManager
    sm = SessionManager()
    return LangGraphOrchestrator(sm)

def test_conversation_only(orchestrator):
    with open('test_data/conversation.json') as f:
        data = json.load(f)

    result = orchestrator.process(
        prompt=data['prompt'],
        context=data['context']
    )

    assert result['updateType'] == 'none'
    assert 'conversationMessage' in result
    print("✅ Conversation test passed")

def test_full_document(orchestrator):
    with open('test_data/full_document.json') as f:
        data = json.load(f)

    result = orchestrator.process(
        prompt=data['prompt'],
        context=data['context']
    )

    assert result['updateType'] == 'full'
    assert 'documentUpdate' in result
    print("✅ Full document test passed")

def test_selection_update(orchestrator):
    with open('test_data/selection.json') as f:
        data = json.load(f)

    result = orchestrator.process(
        prompt=data['prompt'],
        context=data['context']
    )

    assert result['updateType'] == 'partial'
    assert 'selectionRange' in result
    print("✅ Selection test passed")
```

**Test Checklist**:
- ✅ All 5 nodes implemented
- ✅ Conditional routing works
- ✅ Test 1 (conversation) passes
- ✅ Test 2 (full document) passes
- ✅ Test 3 (selection) passes
- ✅ Error handling works
- ✅ Integration test with browser works

**Success Criteria**: All three operation types work end-to-end

**Exit Criteria**: All checkboxes ✅ before moving to Phase 5

---

### 🎯 Phase 5: Integration & Polish

**Goal**: End-to-end testing, error handling, production readiness

#### Tasks

1. **Enhanced Browser Test Client**:
   - Add system instructions input
   - Add document textarea
   - Add selection tracking
   - Test all three operation types

2. **Error Handling**:
   - JSON parsing errors → graceful fallback
   - Subprocess crashes → cleanup and error response
   - Timeout handling
   - Invalid input validation

3. **Logging**:
   - Add structured logging
   - Log all LLM calls
   - Log graph execution
   - Debug mode

4. **Performance**:
   - Test with large documents (10k+ words)
   - Test with long conversations (50+ messages)
   - Monitor memory usage

5. **Documentation**:
   - Update server/README.md
   - Add deployment instructions
   - Document environment variables

#### Testing Phase 5

**Test Checklist**:
- ✅ Full workflow from enhanced browser client works
- ✅ All three operation types work reliably
- ✅ Error scenarios handled gracefully
- ✅ Multiple conversations work
- ✅ Session cleanup works
- ✅ Large documents handled
- ✅ Long conversations handled
- ✅ Logs are clear and helpful
- ✅ Server can restart without issues

**Success Criteria**: Production-ready server

---

## Development Workflow

### For Each Phase:

1. **Implement**:
   - Write code for that phase
   - Follow specs from `specs/ultra-claude-code/server/`

2. **Test**:
   - Run direct tests (Python scripts)
   - Run integration tests (browser)
   - Check all boxes in Test Checklist

3. **Review**:
   - User reviews and tests
   - User confirms all working

4. **Document**:
   - Update any specs if needed
   - Add comments to code
   - Update README

5. **Commit**:
   - Commit this phase before starting next
   - Tag: `server-phase-N` (e.g., `server-phase-1`)

6. **Move to Next Phase**:
   - Only when all ✅ in current phase

---

## Testing Protocol

### Every Phase Must Pass:

**Automated Tests** (where applicable):
```bash
# Run pytest
pytest tests/test_phase{N}_*.py -v
```

**Manual Browser Tests**:
```bash
# Start server
python server.py

# Open browser test
# Navigate to: file:///path/to/tests/test_client.html
```

**Verification Checklist**:
- ✅ No errors in server logs
- ✅ No errors in browser console
- ✅ Expected behavior matches actual
- ✅ Edge cases handled
- ✅ Previous phases still work (no regression)

---

## Dependencies

**Server** (`requirements.txt`):
```
# Phase 1-2
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-socketio==5.10.0
claude-agent-sdk

# Phase 3+ (added later)
# langgraph==0.0.30
# langchain==0.1.0
# pytest==7.4.3
```

**Client** (Phase 2+ of overall project):
- React
- Socket.io-client
- (To be detailed when starting client implementation)

---

## Git Strategy

**Branches**:
- `main` - Stable, tested code only
- `server-dev` - Server development
- `client-dev` - Client development (later)

**Commits**:
- One commit per phase completion
- Tag each phase: `server-phase-1`, `server-phase-2`, etc.

**Pull Requests**:
- Each phase = one PR to main
- Must pass all tests
- User review required

---

## Timeline Estimate

**Phase 1**: 1-2 days
**Phase 2**: 2-3 days (completion detection is tricky)
**Phase 3**: 1 day
**Phase 4**: 3-4 days (full workflow complexity)
**Phase 5**: 2-3 days (testing and polish)

**Total Server**: ~2 weeks

---

## Success Metrics

**Phase 1**: Can connect, echo messages
**Phase 2**: Can talk to Claude Code
**Phase 3**: LangGraph basics work
**Phase 4**: All three operation types work
**Phase 5**: Production-ready, robust server

**Overall**: Fully functional server ready for client integration

---

## Next Steps

1. ✅ Review this plan
2. ✅ Confirm approach
3. 🚀 **Start Phase 1 Implementation**

---

## Links

- [Architecture Specs](./ultra-claude-code/ultra-claude-code.md)
- [Server Design](./ultra-claude-code/server/server.md)
- [LangGraph Workflow](./ultra-claude-code/server/langgraph-orchestrator.md)
- [Client Design](./ultra-claude-code/client/client.md)
