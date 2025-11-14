# Claude Agent Component

## Purpose

The Claude Agent is the **core AI component** of Ultra Claude Code, providing intelligent document editing capabilities through the Claude Agent SDK. It acts as an autonomous agent that can decide how to handle different types of requests (conversation, full document updates, or partial selection updates).

## Key Concept

**Agent-Native Design**: Instead of explicit orchestration (LangGraph), we define custom tools and let Claude decide which tool to use based on the user's prompt and context. This leverages Claude's natural intelligence for decision-making.

---

## Component Architecture

```
Claude Agent
├── Claude Agent SDK Client
│   ├── Session Management (conversation memory)
│   ├── Streaming Responses (async iteration)
│   └── Built-in Tools (Bash, Read, Write, Edit, etc.)
│
├── Custom Tools (@tool decorator)
│   ├── update_full_document - Replace entire document
│   ├── update_selection - Replace selected text
│   └── respond_conversation_only - Just chat, no edits
│
└── Hooks (PreToolUse/PostToolUse)
    ├── Validation (check document operations)
    ├── Response Formatting (structure output)
    └── Logging (track agent activity)
```

---

## Class Definition

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, tool, HookMatcher
from typing import Any, Dict, List

class ClaudeAgent:
    """
    Claude Agent component using Claude Agent SDK.

    Provides intelligent document editing through:
    - Custom tools for document operations
    - Hooks for validation and formatting
    - Session-based conversation memory
    """

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.client = None
        self.tools = self._define_tools()
        self.hooks = self._define_hooks()
        self.options = ClaudeAgentOptions(
            tools=self.tools,
            hooks=self.hooks
        )

    def _define_tools(self) -> List:
        """Define custom tools for document operations."""
        pass

    def _define_hooks(self) -> Dict:
        """Define hooks for validation and formatting."""
        pass

    async def process(self, prompt: str, context: Dict) -> Dict:
        """
        Process user request through Claude Agent SDK.

        Args:
            prompt: User's message
            context: Document context (content, selection, history)

        Returns:
            Response dict with conversationMessage, updateType, etc.
        """
        pass
```

---

## Custom Tools

### 1. Update Full Document

```python
@tool(
    "update_full_document",
    "Replace the entire document with new content",
    {
        "new_content": str,
        "explanation": str
    }
)
async def update_full_document(args: dict[str, Any]) -> dict[str, Any]:
    """
    Tool for full document replacement.
    Claude uses this when user wants to rewrite/transform entire document.
    """
    return {
        "content": [{
            "type": "text",
            "text": args["explanation"]
        }],
        "tool_result": {
            "updateType": "full",
            "documentUpdate": args["new_content"]
        }
    }
```

**When Claude Uses This:**
- "Summarize this to 50 words"
- "Translate the document to Spanish"
- "Rewrite this in a professional tone"

### 2. Update Selection

```python
@tool(
    "update_selection",
    "Replace only the selected text with new content",
    {
        "new_text": str,
        "selection_range": dict,
        "explanation": str
    }
)
async def update_selection(args: dict[str, Any]) -> dict[str, Any]:
    """
    Tool for partial document updates.
    Claude uses this when user wants to edit selected text.
    """
    return {
        "content": [{
            "type": "text",
            "text": args["explanation"]
        }],
        "tool_result": {
            "updateType": "partial",
            "documentUpdate": args["new_text"],
            "selectionRange": args["selection_range"]
        }
    }
```

**When Claude Uses This:**
- "Rephrase this paragraph" (with text selected)
- "Fix grammar in selected text"
- "Make this more concise"

### 3. Respond Conversation Only

```python
@tool(
    "respond_conversation_only",
    "Respond without making any document changes",
    {
        "response": str
    }
)
async def respond_conversation_only(args: dict[str, Any]) -> dict[str, Any]:
    """
    Tool for pure conversation.
    Claude uses this for questions, explanations, discussions.
    """
    return {
        "content": [{
            "type": "text",
            "text": args["response"]
        }],
        "tool_result": {
            "updateType": "none"
        }
    }
```

**When Claude Uses This:**
- "What makes a good article opening?"
- "Explain passive voice"
- "How should I structure this essay?"

---

## Hooks

### PreToolUse Hook (Validation)

```python
async def validate_document_operation(
    input_data: dict[str, Any],
    tool_use_id: str | None,
    context: HookContext
) -> dict[str, Any]:
    """
    Validate document operations before execution.
    Ensures selection range is valid, content isn't too large, etc.
    """
    tool_name = input_data['tool_name']

    if tool_name == 'update_selection':
        # Validate selection range
        selection = input_data['tool_input'].get('selection_range')
        if not selection or selection.get('start') > selection.get('end'):
            return {
                'hookSpecificOutput': {
                    'permissionDecision': 'deny',
                    'permissionDecisionReason': 'Invalid selection range'
                }
            }

    if tool_name == 'update_full_document':
        # Check content size
        content = input_data['tool_input'].get('new_content', '')
        if len(content) > 100000:  # 100k chars
            return {
                'hookSpecificOutput': {
                    'permissionDecision': 'deny',
                    'permissionDecisionReason': 'Content too large'
                }
            }

    return {}  # Allow
```

### PostToolUse Hook (Formatting)

```python
async def format_response(
    output_data: dict[str, Any],
    context: HookContext
) -> dict[str, Any]:
    """
    Format tool responses into standard structure.
    Adds metadata, timestamps, logs activity.
    """
    tool_name = output_data.get('tool_name')
    tool_result = output_data.get('tool_result', {})

    # Add timestamp
    tool_result['timestamp'] = datetime.now().isoformat()

    # Add session ID
    tool_result['sessionId'] = context.session_id

    # Log activity
    print(f"[{context.session_id}] Tool used: {tool_name}")

    return {
        'hookSpecificOutput': {
            'modifiedToolResult': tool_result
        }
    }
```

---

## Process Flow

```python
async def process(self, prompt: str, context: Dict) -> Dict:
    """
    Main processing method.

    Flow:
    1. Format prompt with context (document, selection)
    2. Create SDK client with tools & hooks
    3. Send query to Claude
    4. Claude analyzes and decides which tool to use
    5. Tool executes (with PreToolUse validation)
    6. Response formatted (with PostToolUse hook)
    7. Return structured response
    """

    # Format prompt with document context
    full_prompt = self._format_prompt_with_context(prompt, context)

    # Create SDK client
    async with ClaudeSDKClient(options=self.options) as client:
        # Send query
        await client.query(full_prompt)

        # Collect streaming response
        response_parts = []
        tool_results = []

        async for message in client.receive_response():
            # Extract text responses
            if hasattr(message, 'content'):
                for block in message.content:
                    if hasattr(block, 'text'):
                        response_parts.append(block.text)

            # Extract tool results
            if hasattr(message, 'tool_result'):
                tool_results.append(message.tool_result)

        # Format final response
        return self._format_final_response(
            response_parts,
            tool_results
        )
```

---

## Context Formatting

```python
def _format_prompt_with_context(self, prompt: str, context: Dict) -> str:
    """
    Format prompt to include document context.

    Context structure:
    {
        "documentContent": str,
        "selection": {
            "text": str,
            "start": int,
            "end": int
        },
        "conversationHistory": [...],
        "systemInstructions": str
    }
    """

    parts = []

    # System instructions
    if context.get('systemInstructions'):
        parts.append(f"Instructions: {context['systemInstructions']}")

    # Document content
    if context.get('documentContent'):
        parts.append(f"\n\nCurrent Document:\n{context['documentContent']}")

    # Selected text
    if context.get('selection') and context['selection'].get('text'):
        sel = context['selection']
        parts.append(f"\n\nSelected Text (chars {sel['start']}-{sel['end']}):\n{sel['text']}")

    # User prompt
    parts.append(f"\n\nUser Request: {prompt}")

    # Available tools info
    parts.append("""

Available Tools:
- update_full_document: Use when request requires replacing entire document
- update_selection: Use when request targets selected text only
- respond_conversation_only: Use for questions, discussions, no edits
    """)

    return '\n'.join(parts)
```

---

## Response Structure

```python
def _format_final_response(
    self,
    response_parts: List[str],
    tool_results: List[Dict]
) -> Dict:
    """
    Format final response for server/client.

    Returns:
    {
        "conversationMessage": str,
        "updateType": "none" | "full" | "partial",
        "documentUpdate": str (optional),
        "selectionRange": dict (optional)
    }
    """

    result = {
        "conversationMessage": '\n'.join(response_parts),
        "updateType": "none"
    }

    # Check if tools were used
    if tool_results:
        latest = tool_results[-1]

        result["updateType"] = latest.get("updateType", "none")

        if "documentUpdate" in latest:
            result["documentUpdate"] = latest["documentUpdate"]

        if "selectionRange" in latest:
            result["selectionRange"] = latest["selectionRange"]

    return result
```

---

## Integration with Server

```python
# In session_manager.py
class SessionManager:
    def registerSession(self, socketId):
        """Create new session with Claude Agent."""

        # Create agent for this session
        agent = ClaudeAgent(session_id)
        agent.spawn()  # Initialize SDK client

        self.sessions[session_id] = {
            'socketId': socketId,
            'agent': agent,  # Claude Agent component
            'createdAt': time.time()
        }

        return session_id

# In server.py
@sio.event
async def askClaudeCode(sid, data):
    """Route request to Claude Agent."""

    # Get agent for this session
    session = sessionManager.getSession(data['sessionId'])
    agent = session['agent']

    # Process through agent
    response = await agent.process(
        prompt=data['prompt'],
        context=data['context']
    )

    # Send response to client
    await sio.emit('claudeResponse', response, room=sid)
```

---

## Benefits of This Approach

### 1. **Simpler Architecture**
- No explicit orchestration (LangGraph)
- Claude decides what to do naturally
- Less code, fewer abstractions

### 2. **More Powerful**
- Leverages Claude's intelligence for decision-making
- Built-in conversation memory
- Extensible through tools and hooks

### 3. **SDK-Native**
- Uses Claude Agent SDK as designed
- Takes advantage of all SDK features
- Better aligned with Claude Code's capabilities

### 4. **Maintainable**
- Clear separation: Tools, Hooks, Agent
- Each component has single responsibility
- Easy to add new tools/hooks

---

## Future Enhancements

### Additional Tools
```python
@tool("insert_at_cursor", ...)  # Insert text at cursor position
@tool("find_and_replace", ...)  # Find/replace operations
@tool("suggest_improvements", ...)  # Suggest without executing
```

### Planning Mode
```python
# Enable planning mode for complex edits
options = ClaudeAgentOptions(
    permission_mode='plan',  # Plan before execute
    tools=self.tools,
    hooks=self.hooks
)
```

### Multi-Document Support
```python
@tool("update_document_by_id", ...)  # Work with multiple docs
@tool("create_new_document", ...)    # Create new docs
```

---

## Testing Strategy

### Unit Tests
```python
# Test tool definitions
def test_update_full_document_tool():
    result = update_full_document({
        "new_content": "New text",
        "explanation": "Updated"
    })
    assert result['tool_result']['updateType'] == 'full'

# Test hooks
def test_validate_document_operation():
    invalid_selection = {
        'tool_name': 'update_selection',
        'tool_input': {'selection_range': {'start': 100, 'end': 50}}
    }
    result = validate_document_operation(invalid_selection, None, context)
    assert result['hookSpecificOutput']['permissionDecision'] == 'deny'
```

### Integration Tests
```python
# Test full agent flow
async def test_agent_conversation():
    agent = ClaudeAgent('test-session')
    response = await agent.process(
        "What makes a good opening?",
        {"documentContent": "..."}
    )
    assert response['updateType'] == 'none'

async def test_agent_full_document_update():
    agent = ClaudeAgent('test-session')
    response = await agent.process(
        "Summarize to 50 words",
        {"documentContent": "Long text..."}
    )
    assert response['updateType'] == 'full'
    assert 'documentUpdate' in response
```

---

## Links

- [← Server Architecture](./server.md)
- [Session Manager](./session-manager.md) - Creates and manages agents
- [Claude Agent SDK Docs](https://docs.claude.com/en/docs/agent-sdk/python)
- [Architecture Overview](../../architecture-spec.md)
