import { useState, useEffect, useRef } from 'react';
import {
  User, Users, Settings, ArrowLeft, Send, Paperclip, X,
  Bell, Clock, Download, UserPlus, ChevronRight, Volume2
} from 'lucide-react';

const CollaborationPanelCompact = ({ chatId, isVisible, onClose, anchorRef, currentUser }) => {
  // State Management
  const [activeUsers, setActiveUsers] = useState([
    { email: 'john@example.com', name: 'John Doe', lastActive: new Date() },
    { email: 'jane@example.com', name: 'Jane Smith', lastActive: new Date() }
  ]);
  const [collaborators, setCollaborators] = useState([
    { _id: '1', email: 'john@example.com', name: 'John Doe', role: 'editor', status: 'accepted', invitedAt: new Date() },
    { _id: '2', email: 'jane@example.com', name: 'Jane Smith', role: 'viewer', status: 'accepted', invitedAt: new Date() },
    { _id: '3', email: 'alex@example.com', name: 'Alex Wilson', role: 'viewer', status: 'pending', invitedAt: new Date() }
  ]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [view, setView] = useState('people'); // 'people', 'chat', 'settings'
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const panelRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Effects
  useEffect(() => {
    if (isVisible && chatId) {
      loadCollaborationData();
      const interval = setInterval(loadActiveUsers, 5000);
      return () => clearInterval(interval);
    }
  }, [isVisible, chatId]);

  useEffect(() => {
    if (isVisible && chatId) {
      updatePresence();
      const interval = setInterval(updatePresence, 30000);
      return () => clearInterval(interval);
    }
  }, [isVisible, chatId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
        anchorRef?.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose, anchorRef]);

  // API Functions
  const loadCollaborationData = async () => {
    await Promise.all([
      loadActiveUsers(),
      loadCollaborators(),
      loadComments()
    ]);
  };

  const loadActiveUsers = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/collaboration/${chatId}/active-users`);
      const data = await response.json();
      setActiveUsers(data.activeUsers || []);
    } catch (error) {
      console.error('Failed to load active users:', error);
    }
  };

  const loadCollaborators = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/collaboration/${chatId}`);
      const data = await response.json();
      setCollaborators(data.collaboration?.collaborators || []);
    } catch (error) {
      console.error('Failed to load collaborators:', error);
    }
  };

  const loadComments = async () => {
    // TODO: Implement comments API
  };

  const updatePresence = async () => {
    try {
      await fetch(`http://localhost:3001/api/collaboration/${chatId}/active-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'current-user@example.com',
          name: 'Current User',
          cursor: { position: 0, color: '#6366f1' }
        })
      });
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  };

  // Event Handlers
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newCollaborator = {
        _id: Date.now().toString(),
        email: inviteEmail,
        name: inviteEmail.split('@')[0],
        role: inviteRole,
        status: 'pending',
        invitedAt: new Date().toISOString()
      };

      setCollaborators(prev => [...prev, newCollaborator]);
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to send invite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPerson) return;

    try {
      const messageData = {
        content: newMessage,
        type: 'text',
        sender: {
          email: currentUser?.email || 'current-user@example.com',
          name: currentUser?.name || 'Current User',
        },
        recipient: selectedPerson.email,
        chatId: chatId
      };

      const newMsg = {
        ...messageData,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      stopTyping();
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    setIsTyping(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Handle image upload
      };
      reader.readAsDataURL(file);
    }
  };

  // Utility Functions
  const getUserColor = (email) => {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
      '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isVisible) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-80 bg-[#2a2f3a]/95 border border-[#d7ff2f]/20 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl collaboration-panel-compact"
      style={{ maxHeight: '800px' }}
    >
      {/* Compact Header - Exactly like reference */}
      <div className="px-4 py-3 border-b border-[#d7ff2f]/10 flex items-center justify-between bg-[#1a1f2a]/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#d7ff2f] flex items-center justify-center">
            <Users className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">Collaboration</h3>
            <div className="flex items-center gap-1 text-xs text-white/60">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span>{activeUsers.length} online • {collaborators.length} members</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Enhanced Navigation Tabs with Sliding Animation */}
      <div className="px-4 py-3 border-b border-[#d7ff2f]/10 bg-[#1a1f2a]/30">
        <div className="relative flex gap-1 bg-[#d7ff2f]/5 rounded-lg p-1">
          {/* Sliding Background */}
          <div
            className={`absolute top-1 bottom-1 bg-[#d7ff2f] rounded-md transition-all duration-300 ease-out ${view === 'people' ? 'left-1 right-1/2 mr-0.5' : 'left-1/2 right-1 ml-0.5'
              }`}
          />

          <button
            onClick={() => setView('people')}
            className={`relative z-10 flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 group ${view === 'people'
              ? 'text-black'
              : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className={`w-4 h-4 transition-all duration-300 ${view === 'people'
                ? 'scale-105'
                : 'group-hover:scale-110 group-hover:rotate-3'
                }`} />
              <span className={`transition-all duration-300 ${view === 'people' ? 'font-semibold' : 'group-hover:font-medium'
                }`}>People</span>
            </div>
          </button>

          <button
            onClick={() => setView('settings')}
            className={`relative z-10 flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 group ${view === 'settings'
              ? 'text-black'
              : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Settings className={`w-4 h-4 transition-all duration-300 ${view === 'settings'
                ? 'rotate-90 scale-105'
                : 'group-hover:rotate-90 group-hover:scale-110'
                }`} />
              <span className={`transition-all duration-300 ${view === 'settings' ? 'font-semibold' : 'group-hover:font-medium'
                }`}>Settings</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content with Sliding Animation */}
      <div className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-transform duration-500 ease-out ${view === 'people' ? 'translate-x-0' : '-translate-x-full'
          }`}>
          {/* People View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Active Now Section - Compact with Invite button on right */}
            <div className="px-3 py-2 pb-150 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-white font-medium">Active Now</span>
                  <span className="text-xs text-white/40 bg-[#d7ff2f]/10 px-2 py-0.5 rounded-full">{activeUsers.length}</span>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="text-[#d7ff2f] hover:text-[#d7ff2f]/80 text-sm font-medium transition-all duration-200 px-2 py-1 rounded-lg hover:bg-[#d7ff2f]/10 hover:scale-105"
                >
                  + Invite
                </button>
              </div>
              {activeUsers.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(215, 255, 47, 0.2) transparent' }}>
                  {activeUsers.map((user, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedPerson(user);
                        setView('chat');
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-[#d7ff2f]/3 hover:bg-[#d7ff2f]/6 transition-all duration-300 text-left border border-transparent hover:border-[#d7ff2f]/8 group"
                    >
                      <div className="relative">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white transition-transform duration-300"
                          style={{ backgroundColor: getUserColor(user.email) }}
                        >
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#2a2f3a] animate-pulse"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate transition-colors duration-300">{user.name || user.email}</p>
                        <p className="text-xs text-white/40 truncate">{user.email}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-all duration-300" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-[#d7ff2f]/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <Users className="w-6 h-6 text-[#d7ff2f]" />
                    </div>
                    <p className="text-sm text-white/40 mb-3">No one online</p>
                    <p className="text-xs text-white/30">Invite people to start collaborating</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`absolute inset-0 transition-transform duration-500 ease-out ${view === 'settings' ? 'translate-x-0' : 'translate-x-full'
          }`}>
          {/* Settings View */}
          <div className="flex-1 overflow-y-auto pr-1 h-full" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(215, 255, 47, 0.2) transparent' }}>
            <div className="p-3 space-y-3">
              {/* Manage Access Section */}
              <div>
                <h4 className="text-xs font-medium text-white mb-2 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#d7ff2f]" />
                  Manage Access
                </h4>
                <div className="space-y-1.5">
                  {collaborators.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="w-8 h-8 rounded-lg bg-[#d7ff2f]/10 flex items-center justify-center mx-auto mb-2">
                        <Users className="w-4 h-4 text-[#d7ff2f]" />
                      </div>
                      <p className="text-xs text-white/40 mb-1">No collaborators yet</p>
                      <p className="text-xs text-white/30">Use the + Invite button to add people</p>
                    </div>
                  ) : (
                    collaborators.map((collab) => (
                      <div
                        key={collab._id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-[#d7ff2f]/3 border border-[#d7ff2f]/8 hover:bg-[#d7ff2f]/5 transition-all duration-300"
                      >
                        <div className="relative">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white"
                            style={{ backgroundColor: getUserColor(collab.email) }}
                          >
                            {(collab.name || collab.email).charAt(0).toUpperCase()}
                          </div>
                          {collab.status === 'pending' && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-[#2a2f3a]"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{collab.name || collab.email}</p>
                          <p className="text-xs text-white/40 truncate">{collab.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {collab.role === 'owner' ? (
                            <span className="text-xs text-white/60 px-2 py-1 bg-white/10 rounded-md">Owner</span>
                          ) : (
                            <div className="relative">
                              <select
                                value={collab.role}
                                onChange={(e) => {
                                  const newRole = e.target.value;
                                  setCollaborators(prev => prev.map(c =>
                                    c._id === collab._id ? { ...c, role: newRole } : c
                                  ));
                                }}
                                className="bg-[#d7ff2f]/10 border border-[#d7ff2f]/20 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#d7ff2f]/40 cursor-pointer appearance-none hover:bg-[#d7ff2f]/20 transition-all duration-200 pr-6"
                              >
                                <option value="viewer">Can view</option>
                                <option value="editor">Can edit</option>
                              </select>
                              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <ChevronRight className="w-3 h-3 text-white/40 rotate-90" />
                              </div>
                            </div>
                          )}
                          {collab.role !== 'owner' && (
                            <button
                              onClick={() => {
                                setCollaborators(prev => prev.filter(c => c._id !== collab._id));
                              }}
                              className="w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 flex items-center justify-center"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Preferences */}
              <div className="border-t border-[#d7ff2f]/10 pt-3">
                <h4 className="text-xs font-medium text-white mb-2">Preferences</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-[#d7ff2f]/3 rounded-lg border border-[#d7ff2f]/8 hover:bg-[#d7ff2f]/5 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-[#d7ff2f]" />
                      <div>
                        <p className="text-xs font-medium text-white">Notifications</p>
                        <p className="text-xs text-white/60">Get notified of new messages</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications(!notifications)}
                      className={`w-10 h-5 rounded-full transition-all duration-300 ${notifications ? 'bg-[#d7ff2f]' : 'bg-white/15'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#d7ff2f]/3 rounded-lg border border-[#d7ff2f]/8 hover:bg-[#d7ff2f]/5 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-[#d7ff2f]" />
                      <div>
                        <p className="text-xs font-medium text-white">Sound Effects</p>
                        <p className="text-xs text-white/60">Play sounds for notifications</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`w-10 h-5 rounded-full transition-all duration-300 ${soundEnabled ? 'bg-[#d7ff2f]' : 'bg-white/15'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-[#d7ff2f]/10 pt-3">
                <h4 className="text-xs font-medium text-white mb-2">Actions</h4>
                <div className="space-y-1.5">
                  <button className="w-full flex items-center gap-3 p-2.5 text-left text-xs text-white/80 hover:text-white hover:bg-[#d7ff2f]/5 rounded-lg transition-all duration-300 group">
                    <svg className="w-4 h-4 text-[#d7ff2f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium">Share Link</p>
                      <p className="text-xs text-white/60">Generate shareable link</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-all duration-300" />
                  </button>
                  <button className="w-full flex items-center gap-3 p-2.5 text-left text-xs text-white/80 hover:text-white hover:bg-[#d7ff2f]/5 rounded-lg transition-all duration-300 group">
                    <Download className="w-4 h-4 text-[#d7ff2f]" />
                    <div className="flex-1">
                      <p className="font-medium">Export Chat</p>
                      <p className="text-xs text-white/60">Download conversation</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-all duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {view === 'chat' && selectedPerson ? (
          /* Compact Chat View */
          <div className="flex flex-col h-full">
            {/* Back Button Header */}
            <div className="px-4 py-3 border-b border-[#d7ff2f]/10 bg-[#1a1f2a]/30">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setView('people');
                    setSelectedPerson(null);
                  }}
                  className="w-6 h-6 rounded-lg bg-[#d7ff2f]/10 hover:bg-[#d7ff2f]/20 text-[#d7ff2f] transition-all duration-200 flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: getUserColor(selectedPerson.email) }}
                  >
                    {(selectedPerson.name || selectedPerson.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-white font-medium truncate">{selectedPerson.name || selectedPerson.email}</span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.filter(msg =>
                msg.sender.email === selectedPerson.email ||
                msg.sender.email === currentUser?.email
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-6">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white mb-3"
                    style={{ backgroundColor: getUserColor(selectedPerson.email) }}
                  >
                    {(selectedPerson.name || selectedPerson.email).charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-white font-medium mb-2">{selectedPerson.name || selectedPerson.email}</p>
                  <p className="text-xs text-white/40 mb-3">Start a conversation</p>
                  <button
                    onClick={() => setNewMessage('Hello! 👋')}
                    className="px-3 py-2 bg-[#d7ff2f] text-black rounded-lg text-xs font-medium hover:brightness-110 transition-all"
                  >
                    Say Hello 👋
                  </button>
                </div>
              ) : (
                messages
                  .filter(msg =>
                    msg.sender.email === selectedPerson.email ||
                    msg.sender.email === currentUser?.email
                  )
                  .map((msg, idx) => {
                    const isOwn = msg.sender.email === currentUser?.email;
                    return (
                      <div key={idx} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                          style={{ backgroundColor: getUserColor(msg.sender.email) }}
                        >
                          {(msg.sender.name || msg.sender.email).charAt(0).toUpperCase()}
                        </div>
                        <div className={`flex-1 max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className={`rounded-lg px-3 py-2 ${isOwn
                            ? 'bg-[#d7ff2f] text-black'
                            : 'bg-[#d7ff2f]/10 text-white'
                            }`}>
                            <p className="text-xs break-words">{msg.content}</p>
                          </div>
                          <span className="text-xs text-white/40 mt-1 px-1">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compact Input Area */}
            <div className="p-3 border-t border-[#d7ff2f]/10 bg-[#1a1f2a]/30">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#d7ff2f]/10 text-[#d7ff2f] hover:bg-[#d7ff2f]/20 transition-all duration-200"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder={`Message ${selectedPerson.name || selectedPerson.email}...`}
                  className="flex-1 bg-[#d7ff2f]/5 border border-[#d7ff2f]/20 rounded-lg px-3 py-2 text-white text-xs placeholder-white/40 focus:outline-none focus:border-[#d7ff2f]/40 focus:bg-[#d7ff2f]/10 transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#d7ff2f] text-black hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : view === 'settings' ? (
          /* Professional Settings - Like Figma */
          <div className="flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(215, 255, 47, 0.2) transparent' }}>
            <div className="p-3 space-y-3">
              {/* Manage Access Section */}
              <div>
                <h4 className="text-xs font-medium text-white mb-2 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#d7ff2f]" />
                  Manage Access
                </h4>
                <div className="space-y-1.5">
                  {collaborators.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="w-8 h-8 rounded-lg bg-[#d7ff2f]/10 flex items-center justify-center mx-auto mb-2">
                        <Users className="w-4 h-4 text-[#d7ff2f]" />
                      </div>
                      <p className="text-xs text-white/40 mb-1">No collaborators yet</p>
                      <p className="text-xs text-white/30">Use the + Invite button to add people</p>
                    </div>
                  ) : (
                    collaborators.map((collab) => (
                      <div
                        key={collab._id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-[#d7ff2f]/3 border border-[#d7ff2f]/8 hover:bg-[#d7ff2f]/5 transition-all duration-300"
                      >
                        <div className="relative">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white"
                            style={{ backgroundColor: getUserColor(collab.email) }}
                          >
                            {(collab.name || collab.email).charAt(0).toUpperCase()}
                          </div>
                          {collab.status === 'pending' && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-[#2a2f3a]"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{collab.name || collab.email}</p>
                          <p className="text-xs text-white/40 truncate">{collab.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {collab.role === 'owner' ? (
                            <span className="text-xs text-white/60 px-2 py-1 bg-white/10 rounded-md">Owner</span>
                          ) : (
                            <div className="relative">
                              <select
                                value={collab.role}
                                onChange={(e) => {
                                  // Handle role change
                                  const newRole = e.target.value;
                                  setCollaborators(prev => prev.map(c =>
                                    c._id === collab._id ? { ...c, role: newRole } : c
                                  ));
                                }}
                                className="bg-[#d7ff2f]/10 border border-[#d7ff2f]/20 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#d7ff2f]/40 cursor-pointer appearance-none hover:bg-[#d7ff2f]/20 transition-all duration-200 pr-6"
                              >
                                <option value="viewer">Can view</option>
                                <option value="editor">Can edit</option>
                              </select>
                              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <ChevronRight className="w-3 h-3 text-white/40 rotate-90" />
                              </div>
                            </div>
                          )}
                          {collab.role !== 'owner' && (
                            <button
                              onClick={() => {
                                // Handle remove collaborator
                                setCollaborators(prev => prev.filter(c => c._id !== collab._id));
                              }}
                              className="w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 flex items-center justify-center"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Preferences */}
              <div className="border-t border-[#d7ff2f]/10 pt-3">
                <h4 className="text-xs font-medium text-white mb-2">Preferences</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-[#d7ff2f]/3 rounded-lg border border-[#d7ff2f]/8 hover:bg-[#d7ff2f]/5 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-[#d7ff2f]" />
                      <div>
                        <p className="text-xs font-medium text-white">Notifications</p>
                        <p className="text-xs text-white/60">Get notified of new messages</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications(!notifications)}
                      className={`w-10 h-5 rounded-full transition-all duration-300 ${notifications ? 'bg-[#d7ff2f]' : 'bg-white/15'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#d7ff2f]/3 rounded-lg border border-[#d7ff2f]/8 hover:bg-[#d7ff2f]/5 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-[#d7ff2f]" />
                      <div>
                        <p className="text-xs font-medium text-white">Sound Effects</p>
                        <p className="text-xs text-white/60">Play sounds for notifications</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`w-10 h-5 rounded-full transition-all duration-300 ${soundEnabled ? 'bg-[#d7ff2f]' : 'bg-white/15'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Collaboration Actions */}
              <div className="border-t border-[#d7ff2f]/10 pt-3">
                <h4 className="text-xs font-medium text-white mb-2">Actions</h4>
                <div className="space-y-1.5">
                  <button className="w-full flex items-center gap-3 p-2.5 text-left text-xs text-white/80 hover:text-white hover:bg-[#d7ff2f]/5 rounded-lg transition-all duration-300 group">
                    <svg className="w-4 h-4 text-[#d7ff2f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium">Share Link</p>
                      <p className="text-xs text-white/60">Generate shareable link</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-all duration-300" />
                  </button>
                  <button className="w-full flex items-center gap-3 p-2.5 text-left text-xs text-white/80 hover:text-white hover:bg-[#d7ff2f]/5 rounded-lg transition-all duration-300 group">
                    <Download className="w-4 h-4 text-[#d7ff2f]" />
                    <div className="flex-1">
                      <p className="font-medium">Export Chat</p>
                      <p className="text-xs text-white/60">Download conversation</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-all duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Compact Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#2a2f3a]/95 rounded-xl shadow-2xl w-full max-w-md border border-[#d7ff2f]/20 overflow-hidden backdrop-blur-xl">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#d7ff2f]/10 bg-[#1a1f2a]/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#d7ff2f]">Invite Team Members</h2>
                  <p className="text-xs text-white/50 mt-1">Add people to collaborate on this chat</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <label className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <div className="space-y-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && inviteEmail.trim() && handleInvite()}
                  placeholder="Enter email address"
                  className="w-full bg-[#d7ff2f]/5 border border-[#d7ff2f]/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#d7ff2f]/40 focus:bg-[#d7ff2f]/10 transition-all duration-200"
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full bg-[#d7ff2f]/5 border border-[#d7ff2f]/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#d7ff2f]/40 cursor-pointer appearance-none hover:bg-[#d7ff2f]/10 transition-all duration-200"
                    >
                      <option value="viewer">Can view</option>
                      <option value="editor">Can edit</option>
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || isLoading}
                    className="px-4 py-2 bg-[#d7ff2f] text-black rounded-lg text-sm font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Invite</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationPanelCompact;