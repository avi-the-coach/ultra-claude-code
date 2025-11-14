"""
Ultra Claude Code - Main Server

FastAPI + Socket.io server for AI-powered document editing platform.
"""

from fastapi import FastAPI
import socketio
from session_manager import SessionManager
from config import loadConfig


# Load configuration
config = loadConfig()

# Create FastAPI app
app = FastAPI(title="Ultra Claude Code Server")

# Create Socket.io server with async mode
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Wrap Socket.io in ASGI app
socket_app = socketio.ASGIApp(sio, app)

# Initialize session manager
sessionManager = SessionManager()


# Socket.io Event Handlers

@sio.event
async def connect(sid, environ):
    """
    Handle client connection.

    Args:
        sid (str): Socket.io connection ID
        environ (dict): Connection environment
    """
    print(f"[CONNECT] Client connected: {sid}")

    sessionId = sessionManager.registerSession(sid)

    await sio.emit('sessionRegistered', {
        'sessionId': sessionId
    }, room=sid)

    print(f"[SESSION] Registered session: {sessionId} for socket: {sid}")


@sio.event
async def askClaudeCode(sid, data):
    """
    Handle askClaudeCode request from client with streaming support.

    Args:
        sid (str): Socket.io connection ID
        data (dict): Request data with:
            - sessionId (str): Session ID
            - prompt (str): User prompt
            - context (dict): Context data
    """
    print(f"[ASK CLAUDE] Request from {sid}")
    print(f"  Session ID: {data.get('sessionId')}")
    print(f"  Prompt: {data.get('prompt')}")

    try:
        agent = sessionManager.getAgent(data.get('sessionId'))
        if not agent:
            raise Exception(f"No agent found for session: {data.get('sessionId')}")

        # Notify client that streaming is starting
        await sio.emit('claudeStreamStart', {
            'sessionId': data.get('sessionId')
        }, room=sid)

        # Define streaming callback
        async def on_chunk(text: str):
            """Emit each chunk as it arrives from Claude"""
            await sio.emit('claudeStreamChunk', {
                'text': text
            }, room=sid)

        # Process with streaming
        response = await agent.process(
            prompt=data.get('prompt', ''),
            context=data.get('context', {}),
            on_chunk=on_chunk
        )

        # Notify streaming complete
        await sio.emit('claudeStreamEnd', {
            'sessionId': data.get('sessionId')
        }, room=sid)

        # Send final structured response
        await sio.emit('claudeResponse', response, room=sid)

        print(f"[RESPONSE] Sent response to {sid}")

    except Exception as e:
        print(f"[ERROR] Failed to get response: {e}")
        await sio.emit('claudeResponse', {
            'conversationMessage': f"Error: {str(e)}",
            'error': str(e)
        }, room=sid)


@sio.event
async def disconnect(sid):
    """
    Handle client disconnection.

    Args:
        sid (str): Socket.io connection ID
    """
    print(f"[DISCONNECT] Client disconnected: {sid}")


# FastAPI Routes (for health checks, etc.)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Ultra Claude Code Server",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


# Main Entry Point

if __name__ == "__main__":
    import uvicorn

    print(f"""
============================================================
         Ultra Claude Code Server
============================================================

Starting server...
  Host: {config['host']}
  Port: {config['port']}
  CORS: {config['corsOrigin']}

Socket.io endpoint: ws://{config['host']}:{config['port']}{config['socketPath']}
Health check: http://{config['host']}:{config['port']}/health

Press Ctrl+C to stop
""")

    # Run server
    uvicorn.run(
        socket_app,
        host=config['host'],
        port=config['port'],
        log_level="info"
    )
