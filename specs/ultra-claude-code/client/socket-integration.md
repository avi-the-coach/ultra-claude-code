# Socket Integration

## Purpose

**CRITICAL COMPONENT** - Replaces Anthropic API with Socket.IO connection to our server. This is the foundation of the entire client-server communication.

---

## Overview

The example uses direct Anthropic API calls. We need to replace this with Socket.IO for:
- Real-time bidirectional communication
- Streaming responses
- Session management
- Persistent connection

---

## Setup

### Install Socket.IO Client

```bash
npm install socket.io-client
```

### Import

```javascript
import { io } from 'socket.io-client';
```

---

## Connection Management

### Create Socket Service

**File**: `src/services/socketService.js`

```javascript
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.sessionId = null;
  }

  connect(url = 'http://localhost:3002') {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.sessionId = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  getSessionId() {
    return this.sessionId;
  }

  setSessionId(id) {
    this.sessionId = id;
  }
}

export const socketService = new SocketService();
```

---

## Custom Hook: useSocket

**File**: `src/hooks/useSocket.js`

```javascript
import { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';

export const useSocket = (url = 'http://localhost:3002') => {
  const [sessionId, setSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to server
    const socketInstance = socketService.connect(url);
    setSocket(socketInstance);

    // Handle connection
    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Socket connected');
    });

    // Handle session registration
    socketInstance.on('sessionRegistered', (data) => {
      const { sessionId: id } = data;
      setSessionId(id);
      socketService.setSessionId(id);
      console.log('✅ Session registered:', id);
    });

    // Handle disconnection
    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Socket disconnected');
    });

    // Cleanup on unmount
    return () => {
      // Don't disconnect - keep connection alive
      // socketService.disconnect();
    };
  }, [url]);

  return { socket, sessionId, isConnected };
};
```

---

## Streaming Events Integration

### Setup Streaming Listeners

```javascript
import { useEffect } from 'react';

export const useStreamingEvents = (socket, handlers) => {
  const {
    onStreamStart,
    onStreamChunk,
    onStreamEnd,
    onResponse
  } = handlers;

  useEffect(() => {
    if (!socket) return;

    // Streaming start
    socket.on('claudeStreamStart', (data) => {
      console.log('📡 Stream started');
      onStreamStart?.(data);
    });

    // Stream chunks
    socket.on('claudeStreamChunk', (data) => {
      console.log('📝 Chunk received:', data.text?.substring(0, 50));
      onStreamChunk?.(data);
    });

    // Streaming end
    socket.on('claudeStreamEnd', (data) => {
      console.log('✅ Stream ended');
      onStreamEnd?.(data);
    });

    // Final response
    socket.on('claudeResponse', (data) => {
      console.log('📨 Final response:', data);
      onResponse?.(data);
    });

    // Cleanup listeners
    return () => {
      socket.off('claudeStreamStart');
      socket.off('claudeStreamChunk');
      socket.off('claudeStreamEnd');
      socket.off('claudeResponse');
    };
  }, [socket, onStreamStart, onStreamChunk, onStreamEnd, onResponse]);
};
```

---

## Sending Requests: askClaudeCode

### Replace Example's API Call

**Example (lines 446-469) - REMOVE:**
```javascript
// OLD - Direct API call
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({...})
});
```

**NEW - Socket.IO emit:**
```javascript
const sendRequest = (socket, sessionId, prompt, context) => {
  if (!socket || !sessionId) {
    console.error('Socket or session not ready');
    return;
  }

  socket.emit('askClaudeCode', {
    sessionId: sessionId,
    prompt: prompt,
    context: context
  });

  console.log('📤 Request sent:', { prompt, context });
};
```

---

## Context Building

### Format Context for Server

```javascript
const buildContext = (content, selectedText, selectionRange, chatMessages) => {
  // Calculate address
  const referredAddress = calculateAddress(content, selectedText, selectionRange);

  // Determine referred text
  const referredText = selectedText || content;

  return {
    documentContent: content,
    referredText: referredText,
    referredAddress: referredAddress,
    conversationHistory: chatMessages.map(msg => ({
      role: msg.role,
      message: msg.content,
      timestamp: msg.timestamp
    })),
    systemInstructions: ''  // Server loads from file
  };
};
```

### Calculate Address

```javascript
const calculateAddress = (content, selectedText, selectionRange) => {
  // No selection - question mode
  if (!selectedText || selectionRange.start === selectionRange.end) {
    return "0:0";
  }

  // Selection exists - selection mode
  return `${selectionRange.start}:${selectionRange.end}`;
};
```

---

## Complete Integration Example

### In Main Component

```javascript
import { useSocket } from './hooks/useSocket';
import { useStreamingEvents } from './hooks/useStreamingEvents';

const App = () => {
  // State
  const [content, setContent] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Socket connection
  const { socket, sessionId, isConnected } = useSocket();

  // Streaming event handlers
  useStreamingEvents(socket, {
    onStreamStart: () => {
      setIsProcessingChat(true);
      setStreamingText('');
    },

    onStreamChunk: (data) => {
      setStreamingText(prev => prev + data.text);
    },

    onStreamEnd: () => {
      // Streaming complete (final response coming)
    },

    onResponse: (data) => {
      // Add conversation message to chat
      const aiMessage = {
        role: 'assistant',
        content: data.conversationMessage,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, aiMessage]);

      // Handle document updates
      handleDocumentUpdate(data);

      // Reset state
      setIsProcessingChat(false);
      setStreamingText('');
    }
  });

  // Send message function
  const sendChatMessage = () => {
    if (!userMessage.trim() || isProcessingChat) return;
    if (!socket || !sessionId) {
      console.error('Socket not ready');
      return;
    }

    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, newUserMessage]);

    // Build context
    const context = buildContext(
      content,
      selectedText,
      selectionRange,
      [...chatMessages, newUserMessage]
    );

    // Send request
    socket.emit('askClaudeCode', {
      sessionId: sessionId,
      prompt: userMessage,
      context: context
    });

    // Clear input
    setUserMessage('');
  };

  // Handle document updates
  const handleDocumentUpdate = (data) => {
    if (!data.documentUpdate) return;

    // Parse update range
    const [start, end] = parseUpdateRange(data.updateRange);

    if (start === 0 && end === content.length) {
      // Full document update
      setContent(data.documentUpdate);
      console.log('📄 Full document updated');
    } else if (start < end) {
      // Partial update
      const newContent =
        content.substring(0, start) +
        data.documentUpdate +
        content.substring(end);
      setContent(newContent);
      console.log('📄 Partial document updated');

      // Clear selection
      setSelectedText('');
      setSelectionRange({ start: 0, end: 0 });
    }
  };

  // Parse update range "start:end"
  const parseUpdateRange = (range) => {
    if (!range) return [0, 0];
    const [start, end] = range.split(':').map(Number);
    return [start, end];
  };

  return (
    // ... UI components
  );
};
```

---

## Streaming Text Display

### Show Real-Time Chunks in Chat

```javascript
const ChatMessages = ({ chatMessages, streamingText, isProcessingChat }) => {
  return (
    <div className="messages">
      {/* Regular messages */}
      {chatMessages.map((message, index) => (
        <div key={index} className={`message ${message.role}`}>
          <p>{message.content}</p>
          <span className="timestamp">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      ))}

      {/* Streaming text */}
      {isProcessingChat && streamingText && (
        <div className="message assistant streaming">
          <p>{streamingText}</p>
          <span className="loading">AI is typing...</span>
        </div>
      )}

      {/* Loading indicator (before streaming starts) */}
      {isProcessingChat && !streamingText && (
        <div className="message assistant">
          <Loader className="animate-spin" />
          <span>AI thinking...</span>
        </div>
      )}
    </div>
  );
};
```

---

## Error Handling

### Connection Errors

```javascript
useEffect(() => {
  if (!socket) return;

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
    // Show user notification
    showErrorNotification('Unable to connect to server. Please ensure server is running.');
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server disconnected, try to reconnect
      socket.connect();
    }
  });

  return () => {
    socket.off('connect_error');
    socket.off('disconnect');
  };
}, [socket]);
```

### Response Errors

```javascript
onResponse: (data) => {
  if (data.error) {
    console.error('Server error:', data.error);
    const errorMessage = {
      role: 'assistant',
      content: `Error: ${data.error}`,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, errorMessage]);
    setIsProcessingChat(false);
    return;
  }

  // Normal handling...
}
```

---

## Testing the Integration

### Test Checklist

1. **Connection Test**
   ```javascript
   // Check browser console
   // Should see: "✅ Connected to server"
   // Should see: "✅ Session registered: global-session"
   ```

2. **Question Test** (0:0)
   ```javascript
   // Don't select text
   // Type: "What is this document about?"
   // Should get conversation response only
   ```

3. **Full Document Test** (0:N)
   ```javascript
   // Don't select text
   // Type: "Summarize this document"
   // Should get conversation + full document update
   ```

4. **Selection Test** (start:end)
   ```javascript
   // Select some text
   // Type: "Make this more exciting"
   // Should get conversation + partial update
   ```

5. **Streaming Test**
   ```javascript
   // Send any request
   // Should see text appear in real-time
   // Should see "AI is typing..." while streaming
   ```

---

## Key Differences from Example

### OLD (Example - Lines 392-574)
```javascript
// ❌ Direct API fetch
const response = await fetch("https://api.anthropic.com/v1/messages", {...});
const data = await response.json();

// ❌ Complex JSON parsing
let parsedResponse = JSON.parse(cleanedResponse);

// ❌ No streaming
// ❌ Manual selection update logic
```

### NEW (Our Implementation)
```javascript
// ✅ Socket.IO emit
socket.emit('askClaudeCode', {...});

// ✅ Streaming events
socket.on('claudeStreamChunk', (data) => {...});

// ✅ Simple response format
socket.on('claudeResponse', (data) => {
  // data.conversationMessage
  // data.documentUpdate
  // data.updateRange
});

// ✅ Address-based semantics
referredAddress: "0:0" | "0:123" | "45:92"
```

---

## Debugging

### Enable Socket.IO Debug Logs

```javascript
// In socketService.js
this.socket = io(url, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  debug: true  // Add this for debugging
});
```

### Log All Events

```javascript
socket.onAny((eventName, ...args) => {
  console.log(`[Socket Event] ${eventName}:`, args);
});
```

---

## Performance Considerations

1. **Single Connection**: Reuse same socket instance across app
2. **Cleanup**: Remove event listeners on unmount
3. **Reconnection**: Auto-reconnect on disconnect
4. **Buffering**: Socket.IO handles message buffering automatically

---

## Security

- **Local Only**: Server runs on localhost (no auth needed)
- **No Credentials**: No API keys exposed in client
- **Session ID**: Managed by server

---

## Next Steps

1. Implement `useSocket` hook
2. Replace API call in example with `socket.emit`
3. Add streaming event listeners
4. Test all operation modes (0:0, 0:N, start:end)
5. Add error handling
6. Move to [chat-component.md](./chat-component.md) for UI integration

---

## Links

- [← Back to Client Overview](./client.md)
- [Server Socket.IO Events](../server/server.md) - Server-side reference
- [Chat Component](./chat-component.md) - UI for displaying streaming
- [Selection Management](./selection-management.md) - Address calculation
