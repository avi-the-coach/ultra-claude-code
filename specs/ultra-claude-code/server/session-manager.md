# Session Manager

## Purpose
Manages client session lifecycle, tracking connections and their Claude Code subprocesses.

---

## Development Phases

### Phase 1: Single Shared Session (MVP)
**Current Implementation**: All clients connect to ONE shared session.
- Server maintains interface for session isolation
- SessionManager returns the same session for all clients
- One Claude Code subprocess shared by all browsers
- Simplifies initial development and testing
- Server code remains unchanged when moving to Phase 2

### Phase 2+: Multiple Isolated Sessions (Future)
**Future Implementation**: Each client gets isolated session.
- Session persistence and resume (like `/resume` in Claude Code)
- List and switch between sessions
- Independent Claude Code subprocess per session
- Full session isolation

**Key Design**: Server calls SessionManager with same interface in both phases. SessionManager behavior changes, server doesn't.

---

## Class Definition

```pseudo
class SessionManager:
    '''
    **PHASE 1**: Manages single shared session for all clients
    **PHASE 2+**: Manages multiple isolated sessions

    Current Phase 1 behavior: Always returns the one global session
    '''

    globalSession = None  # PHASE 1: Single shared session
    # PHASE 2: Remove globalSession, use sessions dict

    sessions = {}  # PHASE 2: sessionId -> session object (dict in Python)
```

---

## Constructor (Phase 1)

```pseudo
function __init__():
    '''
    PHASE 1: Initialize with single global session.
    Creates one Claude Code subprocess at startup.

    PHASE 2: Initialize empty, create sessions on demand.
    '''

    # PHASE 1: Create global session at startup
    import time

    self.globalSession = {
        'sessionId': 'global-session',
        'socket': None,  # Updated when client connects
        'claudeService': ClaudeCodeLLM('global-session'),
        'createdAt': time.time(),
        'lastActivity': time.time()
    }

    # Spawn Claude Code subprocess immediately
    self.globalSession['claudeService'].spawn()

    self.sessions = {}

    '''
    Returns: SessionManager instance
    '''
```

---

## Register Session

```pseudo
function registerSession(socket):
    '''
    PHASE 1: Returns global session ID, updates socket reference.
    All clients get the same session ID.

    PHASE 2: Creates new unique session per client.

    Parameters:
    - socket: Socket.io socket instance

    References:
    - ClaudeCodeLLM in claude-code-service.md
    - Called by: server.md handleConnection()
    '''

    # PHASE 1: Return global session, update socket
    import time

    self.globalSession['socket'] = socket
    self.globalSession['lastActivity'] = time.time()

    return self.globalSession['sessionId']

    # PHASE 2 IMPLEMENTATION (commented for now):
    '''
    sessionId = self.generateSessionId()
    claudeService = ClaudeCodeLLM(sessionId)

    self.sessions[sessionId] = {
        'sessionId': sessionId,
        'socket': socket,
        'claudeService': claudeService,
        'createdAt': time.time(),
        'lastActivity': time.time()
    }

    return sessionId
    '''

    '''
    Returns: sessionId (string)
    PHASE 1: Always returns 'global-session'
    PHASE 2: Returns unique session ID
    '''
```

---

## Get Session

```pseudo
function getSession(sessionId):
    '''
    PHASE 1: Ignores sessionId parameter, always returns global session.
    PHASE 2: Looks up specific session by ID.

    Parameters:
    - sessionId: string (ignored in Phase 1)

    References:
    - Called by: server.md handleAskClaudeCode()
    '''

    # PHASE 1: Always return global session
    import time

    self.globalSession['lastActivity'] = time.time()
    return self.globalSession

    # PHASE 2 IMPLEMENTATION (commented for now):
    '''
    session = self.sessions.get(sessionId)

    if session:
        session['lastActivity'] = time.time()

    return session
    '''

    '''
    Returns: session object or None if not found
    PHASE 1: Always returns global session (never None)
    PHASE 2: Returns specific session or None
    '''
```

---

## Cleanup Session

```pseudo
function cleanupSession(sessionId):
    '''
    PHASE 1: Does nothing (keeps global session alive).
    PHASE 2: Removes specific session and terminates subprocess.

    Parameters:
    - sessionId: string (ignored in Phase 1)

    References:
    - claudeService.cleanup() in claude-code-service.md
    - Called by: server.md handleDisconnect()
    '''

    # PHASE 1: Do nothing, keep global session alive
    return

    # PHASE 2 IMPLEMENTATION (commented for now):
    '''
    session = self.sessions.get(sessionId)

    if not session:
        return

    session['claudeService'].cleanup()
    del self.sessions[sessionId]
    '''

    '''
    Returns: None
    PHASE 1: No-op
    PHASE 2: Removes session, kills subprocess
    '''
```

---

## Generate Session ID (Phase 2)

```pseudo
function generateSessionId():
    '''
    PHASE 2: Creates unique session identifier.

    Format: session_{timestamp}_{random}
    Example: session_1704123456789_x7k9m2p

    Not used in Phase 1 (only 'global-session' exists).
    '''

    import time
    import random
    import string

    timestamp = int(time.time() * 1000)  # milliseconds
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=9))

    sessionId = f"session_{timestamp}_{random_str}"

    '''
    Returns: sessionId (string)
    '''
    return sessionId
```

---

## List Sessions (Phase 2)

```pseudo
function listSessions():
    '''
    PHASE 2: Returns list of all sessions for resume/switch functionality.
    Like Claude Code's /resume - user can see and resume previous sessions.

    Not implemented in Phase 1.
    '''

    return [
        {
            'sessionId': session['sessionId'],
            'createdAt': session['createdAt'],
            'lastActivity': session['lastActivity']
        }
        for session in self.sessions.values()
    ]

    '''
    Returns: List of session summary objects
    '''
```

---

## Resume Session (Phase 2)

```pseudo
function resumeSession(sessionId, socket):
    '''
    PHASE 2: Reconnects client to existing session.
    Updates socket reference, maintains Claude Code subprocess.

    Not implemented in Phase 1.

    Parameters:
    - sessionId: string (from listSessions)
    - socket: new Socket.io socket instance
    '''

    import time

    session = self.sessions.get(sessionId)

    if not session:
        return None

    # Update socket for this session
    session['socket'] = socket
    session['lastActivity'] = time.time()

    return session

    '''
    Returns: session object or None if not found
    '''
```

---

## Session Isolation

**Phase 1**: No isolation - all clients share one session and one Claude Code process.

**Phase 2**: Complete isolation:
- Separate Claude Code subprocess per session
- Independent conversation history
- No shared state between sessions
- Allows multiple browser tabs without interference

---

## Storage

**Phase 1**: Single `globalSession` variable, no Map needed.

**Phase 2**: Python `dict` for in-memory storage:
- Fast O(1) lookup by session ID
- Automatic cleanup on server restart
- Future: Add persistence for session resume across server restarts

---

## Things to Consider

### Phase 1
- **Shared state**: All clients see same conversation - acceptable for MVP
- **No cleanup needed**: Global session lives for server lifetime
- **Simplicity**: Test core functionality without session complexity

### Phase 2
- **Memory management**: Monitor session count, max limit
- **Session timeout**: Cleanup inactive sessions
- **Persistence**: Save/restore sessions across server restarts
- **Subprocess limits**: OS process limits for multiple Claude Code instances
- **Graceful shutdown**: Cleanup all sessions on server stop
- **Resume UI**: Client needs UI to list and select sessions

---

## Links

- [← Back to Server](./server.md)
- [ClaudeCodeService](./claude-code-service.md)
