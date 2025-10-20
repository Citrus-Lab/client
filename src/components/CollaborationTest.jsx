import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, Settings, Bell, Volume2, VolumeX } from 'lucide-react';

const CollaborationTest = ({ chatId }) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Mock active users
    setActiveUsers([
      { _id: '1', name: 'John Doe', email: 'john@example.com', isTyping: false },
      { _id: '2', name: 'Jane Smith', email: 'jane@example.com', isTyping: true },
      { _id: '3', name: 'Bob Wilson', email: 'bob@example.com', isTyping: false }
    ]);

    // Mock collaboration messages
    setMessages([
      {
        _id: '1',
        userId: '2',
        userName: 'Jane Smith',
        message: 'I think we should focus on the authentication flow first',
        timestamp: new Date(Date.now() - 300000),
        type: 'message'
      },
      {
        _id: '2',
        userId: '1',
        userName: 'John Doe',
        message: 'Agreed! Let me work on the login component',
        timestamp: new Date(Date.now() - 240000),
        type: 'message'
      },
      {
        _id: '3',
        userId: '3',
        userName: 'Bob Wilson',
        message: 'I can handle the backend API endpoints',
        timestamp: new Date(Date.now() - 180000),
        type: 'message'
      }
    ]);
  }, [chatId]);

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getUserInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getUserColor = (userId) => {
    const colors = [
      'from-purple-400 to-pink-400',
      'from-blue-400 to-cyan-400',
      'from-green-400 to-emerald-400',
      'from-yellow-400 to-orange-400',
      'from-red-400 to-pink-400'
    ];
    return colors[parseInt(userId) % colors.length];
  };

  return (
    <div className="h-full flex flex-col bg-[#0f1015] border-l border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-medium">Collaboration</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNotifications(!notifications)}
              className={`p-2 rounded-lg transition-colors ${
                notifications ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400'
              }`}
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Active Users */}
        <div>
          <div className="text-xs text-gray-400 mb-2">Active Users ({activeUsers.length})</div>
          <div className="space-y-2">
            {activeUsers.map(user => (
              <div key={user._id} className="flex items-center gap-2">
                <div className={`w-6 h-6 bg-gradient-to-br ${getUserColor(user._id)} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                  {getUserInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">{user.name}</div>
                  {user.isTyping && (
                    <div className="text-xs text-purple-400 flex items-center gap-1">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      typing...
                    </div>
                  )}
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-xs text-gray-400 text-center mb-4">
          Collaboration chat for this session
        </div>
        
        {messages.map(message => (
          <div key={message._id} className="flex gap-3">
            <div className={`w-8 h-8 bg-gradient-to-br ${getUserColor(message.userId)} rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
              {getUserInitials(message.userName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white text-sm font-medium">{message.userName}</span>
                <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
              </div>
              <div className="text-gray-300 text-sm leading-relaxed">
                {message.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Send a message to collaborators..."
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 text-sm"
          />
          <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaborationTest;