"""
Session Manager for Ultra Claude Code server.

Manages client sessions with Claude Agent instances.
"""

import time
from claude_agent import ClaudeAgent
from config import loadConfig


class SessionManager:
    """
    Manages client sessions.

    All clients share a single global session.
    """

    def __init__(self):
        """
        Initialize SessionManager with a global session.
        """
        config = loadConfig()

        # Create Claude Agent for global session
        agent = ClaudeAgent('global-session', config=config)

        # Single global session for all clients
        self.globalSession = {
            'sessionId': 'global-session',
            'socket': None,
            'agent': agent,
            'createdAt': time.time(),
            'lastActivity': time.time()
        }

        self.sessions = {}

    def registerSession(self, socketId):
        """
        Register a new client connection.

        Args:
            socketId (str): Socket.io connection ID

        Returns:
            str: Session ID
        """
        self.globalSession['lastActivity'] = time.time()
        return self.globalSession['sessionId']

    def getSession(self, sessionId):
        """
        Get session by ID.

        Args:
            sessionId (str): Session ID

        Returns:
            dict: Session object or None if not found
        """
        if sessionId == 'global-session':
            return self.globalSession
        return None

    async def cleanup(self, sessionId):
        """
        Clean up a session.

        Args:
            sessionId (str): Session ID to clean up
        """
        session = self.getSession(sessionId)
        if session and session.get('agent'):
            await session['agent'].cleanup()

    def getAgent(self, sessionId):
        """
        Get Claude Agent for a session.

        Args:
            sessionId (str): Session ID

        Returns:
            ClaudeAgent: Agent instance or None if not found
        """
        session = self.getSession(sessionId)
        if session:
            return session.get('agent')
        return None
