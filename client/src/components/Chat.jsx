import { useState, useRef, useEffect } from 'react';
import { useEditor } from '../contexts/EditorContext';
import './Chat.css';

function Chat({ socket, sessionId }) {
  const { content, setContent, selection } = useEditor();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(100);
  const [isResizingInput, setIsResizingInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('claudeStreamStart', () => {
      setIsProcessing(true);
      setStreamingText('');
    });

    socket.on('claudeStreamChunk', (data) => {
      setStreamingText((prev) => prev + data.text);
    });

    socket.on('claudeStreamEnd', () => {
      // Stream ended
    });

    socket.on('claudeResponse', (data) => {
      setIsProcessing(false);

      // Add assistant message (handle both formats)
      const messageText = data.conversationMessage || data.response || streamingText;
      const assistantMessage = {
        id: Date.now(),
        text: messageText,
        type: 'assistant',
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingText('');

      // Apply document updates if present
      if (data.documentUpdate) {
        // Handle single update format from server
        const updateRange = data.updateRange || '0:0';
        if (updateRange === '0:0') {
          // Full document replacement
          setContent(data.documentUpdate);
        } else {
          // Partial update
          const [start, end] = updateRange.split(':').map(Number);
          setContent((prevContent) => {
            return prevContent.substring(0, start) + data.documentUpdate + prevContent.substring(end);
          });
        }
      } else if (data.documentUpdates) {
        // Handle array format
        handleDocumentUpdates(data.documentUpdates);
      }
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      setIsProcessing(false);
      const errorMessage = {
        id: Date.now(),
        text: `Error: ${error.message || 'An error occurred'}`,
        type: 'error',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    });

    return () => {
      socket.off('claudeStreamStart');
      socket.off('claudeStreamChunk');
      socket.off('claudeStreamEnd');
      socket.off('claudeResponse');
      socket.off('error');
    };
  }, [socket]);

  const handleDocumentUpdates = (updates) => {
    if (!updates || updates.length === 0) return;

    updates.forEach((update) => {
      if (update.type === 'full') {
        setContent(update.content);
      } else if (update.type === 'partial') {
        // Apply partial update
        const { address, content: newContent } = update;
        const [start, end] = address.split(':').map(Number);

        setContent((prevContent) => {
          return prevContent.substring(0, start) + newContent + prevContent.substring(end);
        });
      }
    });
  };

  // Get line and character position from text index
  const getTextPosition = (index) => {
    const textUpToIndex = content.substring(0, index);
    const lines = textUpToIndex.split('\n');
    const line = lines.length;
    const char = lines[lines.length - 1].length + 1;
    return { line, char };
  };

  // Get selection position info for display
  const getSelectionInfo = () => {
    if (!selection.text || selection.start === selection.end) return null;

    const startPos = getTextPosition(selection.start);
    const endPos = getTextPosition(selection.end);

    return `Line ${startPos.line}:${startPos.char} - Line ${endPos.line}:${endPos.char} • ${selection.text.length} characters`;
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !socket || isProcessing) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputText,
      type: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages([...messages, userMessage]);

    // Build context for server
    const context = {
      documentContent: content,
      referredText: selection.text || content,
      referredAddress: selection.text ? `${selection.start}:${selection.end}` : '0:0',
      conversationHistory: messages.map((msg) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      systemInstructions: ''
    };

    // Send to server with correct event name
    console.log('📤 Sending message to server:', { sessionId, prompt: inputText, context });
    socket.emit('askClaudeCode', {
      sessionId: sessionId || 'global-session',
      prompt: inputText,
      context
    });

    setInputText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResizeMouseDown = (e) => {
    setIsResizingInput(true);
    e.preventDefault();
  };

  const handleResizeMouseMove = (e) => {
    if (!isResizingInput || !inputRef.current) return;

    const inputRect = inputRef.current.getBoundingClientRect();
    const newHeight = inputRect.bottom - e.clientY;

    // Constrain between 60px and 300px
    const constrainedHeight = Math.max(60, Math.min(300, newHeight));
    setInputHeight(constrainedHeight);
  };

  const handleResizeMouseUp = () => {
    setIsResizingInput(false);
  };

  useEffect(() => {
    if (isResizingInput) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
    } else {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizingInput]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>AI Assistant</h3>
        {isProcessing && (
          <div className="processing-indicator">
            <span className="processing-dot"></span>
            <span className="processing-text">Thinking...</span>
          </div>
        )}
      </div>
      <div className="chat-messages">
        {messages.length === 0 && !streamingText ? (
          <div className="chat-empty">
            <p>No messages yet. Start a conversation with the AI!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.type}`}>
                <div className="message-content">{message.text}</div>
                <div className="message-time">{message.timestamp}</div>
              </div>
            ))}
            {streamingText && (
              <div className="chat-message assistant streaming">
                <div className="message-content">{streamingText}</div>
                <div className="message-time">Streaming...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Selection Indicator */}
      {selection.text && (
        <div className="selection-indicator-wrapper">
          <div className="selection-indicator">
            <div className="selection-indicator-header">
              <svg className="selection-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="selection-indicator-label">Selected text:</span>
            </div>
            <div className="selection-indicator-info">
              {getSelectionInfo()}
            </div>
            <div className="selection-indicator-preview">
              "{selection.text.substring(0, 60)}{selection.text.length > 60 ? '...' : ''}"
            </div>
          </div>
        </div>
      )}

      <div
        className={`input-resize-handle ${isResizingInput ? 'resizing' : ''}`}
        onMouseDown={handleResizeMouseDown}
      >
        <div className="input-resize-bar"></div>
      </div>
      <div className="chat-input" ref={inputRef} style={{ height: `${inputHeight}px` }}>
        <textarea
          className="chat-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={selection.text ? "Ask about the selected text..." : "Ask a question or give instructions..."}
        />
        <button
          className="chat-send-button"
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// Component metadata for canvas grid system
export const metadata = {
  type: 'Chat',
  minSize: { w: 1, h: 1 },
  maxSize: null,
  removable: true,
  defaultSize: { w: 6, h: 8 }
};

export default Chat;
