# Server

## Purpose
Python FastAPI server managing Claude Code subprocess and multi-agent orchestration via LangGraph.

**Platform Vision**: Extensible server designed to grow from editor-only to full "One UI to Rule Them All" platform.

---

## Server Startup

```pseudo
function startServer() {
    '''
    Server initialization and startup.
    Sets up FastAPI, Socket.io, and LangGraph orchestration.

    Phase 1: Simple editor agent
    Phase 2+: Multi-agent registry (Gmail, Calendar, etc.)
    '''

    config = loadConfig()  // See config.md

    app = FastAPI()
    sio = SocketIO(app, cors_allowed_origins="*")

    sessionManager = SessionManager()  # See session-manager.md

    # Phase 1: LangGraph with editor workflow
    orchestrator = LangGraphOrchestrator(sessionManager)  # Using LangGraph from start

    # Phase 2+: Expand with more agents
    # agentRegistry = AgentRegistry()
    # agentRegistry.register("editor", EditorAgent())
    # agentRegistry.register("gmail", GmailAgent())
    # agentRegistry.register("calendar", CalendarAgent())

    # Register Socket.io event handlers
    @sio.on('connect')
    async def handleConnection(sid, environ):
        handleConnectionLogic(sid, sessionManager)

    @sio.on('askClaudeCode')
    async def handleAskClaudeCode(sid, data):
        handleAskClaudeCodeLogic(sid, sessionManager, orchestrator, data)

    @sio.on('disconnect')
    async def handleDisconnect(sid):
        handleDisconnectLogic(sid, sessionManager)

    # Start server
    uvicorn.run(app, host=config.host, port=config.port)

    '''
    Returns: Running server instance
    '''
}
```

---

## Connection Handler

```pseudo
async function handleConnection(sid, sessionManager) {
    '''
    Called when client connects via Socket.io.
    Registers session and sends session ID to client.

    Phase 1: Single shared session
    Phase 2+: Unique session per client

    References:
    - sessionManager.registerSession() in session-manager.md
    '''

    sessionId = sessionManager.registerSession(sid)

    # Send session ID back to client
    await sio.emit('sessionRegistered', {
        'sessionId': sessionId
    }, room=sid)

    '''
    Returns: void (async)
    Side effects: Session created, session ID sent to client
    '''
}
```

---

## Ask Claude Code Handler (Main Entry Point)

```pseudo
async function handleAskClaudeCode(sid, sessionManager, orchestrator, data) {
    '''
    **MAIN ENTRY POINT** - Core endpoint handling AI requests from client.
    Receives prompt and context, routes through orchestrator, returns response.

    Input data structure:
    {
        sessionId: string,
        prompt: string,
        context: {
            documentContent: string (optional),
            selectedText: {
                text: string,
                start: {line, char},
                end: {line, char}
            } (optional)
        }
    }

    Flow:
    1. Validate session
    2. Route through orchestrator (cascade or LangGraph)
    3. Return response to client

    Phase 1: Simple cascade (context → intent → execute)
    Phase 2+: LangGraph state machine with agent routing

    References:
    - sessionManager.getSession() in session-manager.md
    - orchestrator.process() in langgraph-orchestrator.md
    '''

    # Validate session
    session = sessionManager.getSession(data['sessionId'])
    if not session:
        await sio.emit('claudeResponse', {
            'sessionId': data['sessionId'],
            'error': 'Invalid session ID',
            'done': True
        }, room=sid)
        return

    try:
        # Route through LangGraph orchestrator
        # Phase 1: Editor workflow only
        # Phase 2+: Multi-agent routing
        result = await orchestrator.process(
            prompt=data['prompt'],
            context=data.get('context', {})
        )

        # Send response to client
        await sio.emit('claudeResponse', {
            'sessionId': data['sessionId'],
            'fullResponse': result,
            'done': True
        }, room=sid)

    except Exception as error:
        await sio.emit('claudeResponse', {
            'sessionId': data['sessionId'],
            'error': str(error),
            'done': True
        }, room=sid)

    '''
    Returns: void (async)
    Side effects: Emits claudeResponse event to client
    '''
}
```

---

## Disconnect Handler

```pseudo
async function handleDisconnect(sid, sessionManager):
    '''
    Called when client disconnects.

    Phase 1: Does nothing (global session persists)
    Phase 2+: Cleans up session and terminates Claude Code subprocess

    References:
    - sessionManager.cleanupSession() in session-manager.md
    '''

    # Phase 1: No cleanup needed (global session)
    pass

    # Phase 2+: Cleanup individual session
    # sessionManager.cleanupSession(sessionId)

    '''
    Returns: void (async)
    Side effects: Session cleaned up (Phase 2+)
    '''
}
```

---

## Configuration

See [config.md](./config.md) for server configuration details.

---

## Dependencies

**Core Framework:**
- `fastapi` - Modern Python web framework
- `python-socketio` - Socket.io server for Python
- `uvicorn` - ASGI server

**AI/Orchestration:**
- `langgraph` - Multi-agent orchestration (Phase 2+)
- `langchain` - LangChain ecosystem tools (Phase 2+)

**Subprocess:**
- `subprocess` - Python built-in for Claude Code CLI

**Future Integrations (Phase 2+):**
- `google-api-python-client` - Gmail, Calendar APIs
- `asyncio` - Async operations

---

## Platform Architecture (Future)

### Phase 2+: Agent Registry

```pseudo
class AgentRegistry:
    '''
    Central registry for all agents in the platform.
    Allows dynamic agent loading and routing.
    '''

    agents = {}

    function register(name, agent):
        this.agents[name] = agent

    function get(name):
        return this.agents.get(name)

    function listAgents():
        return list(this.agents.keys())
```

### Phase 2+: LangGraph Integration

```pseudo
function buildLangGraphOrchestrator():
    '''
    Constructs LangGraph state machine for multi-agent routing.

    Nodes:
    - analyze_intent: Determine what user wants
    - route_agent: Dispatch to specialist agent
    - editor_agent: Handle editor tasks
    - gmail_agent: Handle email tasks (Phase 2)
    - calendar_agent: Handle calendar tasks (Phase 2)
    '''

    from langgraph.graph import StateGraph

    graph = StateGraph(PlatformState)

    graph.add_node("analyze_intent", analyze_intent_node)
    graph.add_node("editor_agent", editor_agent_node)
    # Phase 2: Add more agents
    # graph.add_node("gmail_agent", gmail_agent_node)

    graph.add_conditional_edges("analyze_intent", route_to_agent)
    graph.add_edge("editor_agent", END)

    return graph.compile()
```

---

## Things to Consider

**Phase 1:**
- **Simple orchestration**: Basic cascade, no LangGraph yet
- **Single session**: All clients share one Claude Code process
- **Editor only**: Focus on getting editor working well

**Phase 2+:**
- **LangGraph integration**: When adding Gmail/Calendar agents
- **Agent registry**: Pluggable architecture for new agents
- **Session isolation**: Each client gets own session + subprocess
- **State persistence**: Save/restore conversations across restarts
- **Error recovery**: Graceful handling of agent failures
- **Logging**: Comprehensive logging for debugging multi-agent flows
- **Observability**: LangSmith integration for tracing
- **Performance**: Monitor latency as agent complexity grows

---

## Links

- [← Back to Project](../ultra-claude-code.md)
- [Config](./config.md) - Server configuration
- [SessionManager](./session-manager.md) - Session management
- [ClaudeCodeService](./claude-code-service.md) - Claude Code subprocess wrapper (LLM interface)
- [LangGraphOrchestrator](./langgraph-orchestrator.md) - LangGraph orchestration (Phase 1+)
- [Client](../client/client.md) - Client-side integration
