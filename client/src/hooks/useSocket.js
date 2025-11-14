import { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';
import config from '../config.js';

export const useSocket = (url = config.serverUrl) => {
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
