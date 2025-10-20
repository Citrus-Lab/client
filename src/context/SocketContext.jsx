import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      
      // Identify user
      if (user) {
        newSocket.emit('identify', user);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Active users updates
    newSocket.on('active-users', (users) => {
      setActiveUsers(users);
    });

    // User joined
    newSocket.on('user-joined', ({ user, timestamp }) => {
      console.log(`👤 ${user.name || user.email} joined`);
      setActiveUsers(prev => {
        const exists = prev.some(u => u.email === user.email);
        if (exists) return prev;
        return [...prev, { ...user, lastActive: timestamp }];
      });
    });

    // User left
    newSocket.on('user-left', ({ user }) => {
      console.log(`👋 ${user.name || user.email} left`);
      setActiveUsers(prev => prev.filter(u => u.email !== user.email));
    });

    // Typing indicators
    newSocket.on('user-typing', ({ user }) => {
      setTypingUsers(prev => new Set([...prev, user.email]));
    });

    newSocket.on('user-stop-typing', ({ user }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.email);
        return newSet;
      });
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [user]);

  // Socket methods
  const joinChat = (chatId, userData) => {
    if (socket && isConnected) {
      socket.emit('join-chat', { chatId, user: userData });
      console.log(`📥 Joining chat: ${chatId}`);
    }
  };

  const leaveChat = (chatId, userData) => {
    if (socket && isConnected) {
      socket.emit('leave-chat', { chatId, user: userData });
      console.log(`📤 Leaving chat: ${chatId}`);
    }
  };

  const sendMessage = (chatId, message, userData) => {
    if (socket && isConnected) {
      socket.emit('send-message', { chatId, message, user: userData });
    }
  };

  const startTyping = (chatId, userData) => {
    if (socket && isConnected) {
      socket.emit('typing', { chatId, user: userData });
    }
  };

  const stopTyping = (chatId, userData) => {
    if (socket && isConnected) {
      socket.emit('stop-typing', { chatId, user: userData });
    }
  };

  const updatePresence = (chatId, userData, cursor) => {
    if (socket && isConnected) {
      socket.emit('presence-update', { chatId, user: userData, cursor });
    }
  };

  const acceptInvitation = (chatId, userData) => {
    if (socket && isConnected) {
      socket.emit('invitation-accepted', { chatId, user: userData });
    }
  };

  const value = {
    socket,
    isConnected,
    activeUsers,
    typingUsers,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    updatePresence,
    acceptInvitation
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
