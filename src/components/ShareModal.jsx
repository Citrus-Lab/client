import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import apiClient, { API_CONFIG } from '../config/api';

const ShareModal = ({ isOpen, onClose, chatId, chatTitle }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [shareLink, setShareLink] = useState('');
  const [shareLinkEnabled, setShareLinkEnabled] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const modalRef = useRef(null);

  // Load collaboration data when modal opens
  useEffect(() => {
    if (isOpen && chatId) {
      console.log('🔍 ShareModal: Loading collaboration data for chatId:', chatId);
      console.log('   Chat ID type:', typeof chatId);
      console.log('   Chat ID length:', chatId?.length);
      loadCollaboration();
      loadActiveUsers();
    } else {
      console.log('⚠️ ShareModal: Not loading - isOpen:', isOpen, 'chatId:', chatId);
    }
  }, [isOpen, chatId]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const loadCollaboration = async () => {
    try {
      console.log('📡 ShareModal: Making request to load collaboration for chatId:', chatId);
      const response = await apiClient.post(`${API_CONFIG.endpoints.collaboration}/${chatId}`, {
        userId: 'temp-user-id'
      });
      console.log('   Response data:', data);
      
      if (data.collaboration) {
        setCollaborators(data.collaboration.collaborators || []);
        setShareLinkEnabled(data.collaboration.shareLinkEnabled || false);
        if (data.collaboration.shareLink && data.collaboration.shareLinkEnabled) {
          setShareLink(`${window.location.origin}/invitation/${data.collaboration.shareLink}`);
        }
        console.log('✅ ShareModal: Collaboration loaded successfully');
      } else {
        console.log('⚠️ ShareModal: No collaboration data in response');
      }
    } catch (error) {
      console.error('❌ ShareModal: Failed to load collaboration:', error);
      toast.error('Failed to load collaboration data', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const loadActiveUsers = async () => {
    try {
      const response = await apiClient.get(`${API_CONFIG.endpoints.collaboration}/${chatId}/active-users`);
      setActiveUsers(response.data.activeUsers || []);
    } catch (error) {
      console.error('Failed to load active users:', error);
    }
  };

  const handleInvite = async () => {
    if (!emailInput.trim()) return;

    console.log('📧 ShareModal: Sending invitation for chatId:', chatId, 'to email:', emailInput.trim());
    setIsLoading(true);
    try {
      const response = await apiClient.post(`${API_CONFIG.endpoints.collaboration}/${chatId}/invite`, {
        email: emailInput.trim(),
        role: selectedRole,
        userId: 'temp-user-id' // TODO: Replace with actual user ID from auth
      });
      console.log('   Request body:', {
        email: emailInput.trim(),
        role: selectedRole,
        userId: 'temp-user-id'
      });
      
      if (response.data) {
        const data = response.data;
        setCollaborators(data.collaboration.collaborators);
        setEmailInput('');
        
        // Check email status and show appropriate message
        if (data.emailStatus?.sent) {
          toast.success('Invitation email sent successfully!', {
            position: 'top-right',
            autoClose: 3000
          });
        } else if (data.emailStatus?.error) {
          toast.warning(`Invitation created but email failed: ${data.emailStatus.error}`, {
            position: 'top-right',
            autoClose: 5000
          });
        } else {
          toast.info('Invitation created (email status unknown)', {
            position: 'top-right',
            autoClose: 3000
          });
        }
        
        // Show invitation link to user
        if (data.invitationLink) {
          // Copy link to clipboard
          navigator.clipboard.writeText(data.invitationLink);
          toast.info('Invitation link copied to clipboard', {
            position: 'top-right',
            autoClose: 2000
          });
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to invite collaborator', {
          position: 'top-right',
          autoClose: 4000
        });
      }
    } catch (error) {
      console.error('Invite error:', error);
      toast.error('Failed to invite collaborator. Please try again.', {
        position: 'top-right',
        autoClose: 4000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (collaboratorId, newRole) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/collaboration/${chatId}/collaborators/${collaboratorId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            role: newRole,
            userId: 'temp-user-id' 
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaboration.collaborators);
      }
    } catch (error) {
      console.error('Role update error:', error);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/collaboration/${chatId}/collaborators/${collaboratorId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'temp-user-id' })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaboration.collaborators);
      }
    } catch (error) {
      console.error('Remove collaborator error:', error);
    }
  };

  const handleGenerateShareLink = async () => {
    try {
      console.log('🔗 ShareModal: Generating share link for chatId:', chatId);
      const url = `http://localhost:3001/api/collaboration/${chatId}/share-link`;
      console.log('   Share link URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiryDays: 7,
          role: 'viewer',
          userId: 'temp-user-id'
        })
      });
      
      console.log('   Share link response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        // Use shareUrl from response, or construct it from shareToken
        const fullShareUrl = data.shareUrl || `${window.location.origin}/invitation/${data.shareToken}`;
        setShareLink(fullShareUrl);
        setShareLinkEnabled(true);
        toast.success('Share link generated successfully!', {
          position: 'top-right',
          autoClose: 2000
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate share link', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('Generate link error:', error);
      toast.error('Failed to generate share link. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return '👑';
      case 'editor':
        return '✏️';
      case 'viewer':
        return '👁️';
      default:
        return '👤';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-300',
      accepted: 'bg-green-500/20 text-green-300',
      rejected: 'bg-red-500/20 text-red-300'
    };
    return colors[status] || colors.pending;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div 
        ref={modalRef}
        className="bg-[#2a2f1a] rounded-2xl shadow-2xl w-full max-w-2xl border border-[#4a5a3a] overflow-hidden"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#4a5a3a]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#d7ff2f]">Share "{chatTitle || 'Chat'}"</h2>
              <p className="text-sm text-gray-400 mt-1">Collaborate with your team in real-time</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          {/* Active Users */}
          {activeUsers.length > 0 && (
            <div className="px-6 py-4 bg-[#1a1f0a] border-b border-[#4a5a3a]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-400">0 online</span>
                <div className="flex -space-x-2 ml-4">
                  {activeUsers.slice(0, 5).map((user, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full border-2 border-[#4a5a3a] flex items-center justify-center text-xs font-medium"
                      style={{ backgroundColor: user.cursor?.color || '#4a5a3a' }}
                      title={user.name || user.email}
                    >
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {activeUsers.length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-[#4a5a3a] bg-[#4a5a3a] flex items-center justify-center text-xs">
                      +{activeUsers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Invite Section */}
          <div className="px-6 py-4 border-b border-[#4a5a3a]">
            <label className="block text-sm font-medium text-white mb-2">
              Invite people by email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                placeholder="Enter email address"
                className="flex-1 bg-[#1a1f0a] border border-[#4a5a3a] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#d7ff2f] transition-colors"
              />
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-[#1a1f0a] border border-[#4a5a3a] rounded-lg px-3 py-2 pr-8 text-white text-sm focus:outline-none focus:border-[#d7ff2f] cursor-pointer appearance-none hover:bg-[#2a2f1a] transition-colors"
                >
                  <option value="viewer">Can view</option>
                  <option value="editor">Can edit</option>
                </select>
                {/* Custom dropdown icon */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleInvite}
                disabled={!emailInput.trim() || isLoading}
                className="group px-4 py-2 citrus-accent-bg text-black rounded-lg text-sm font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden"
              >
                {/* Micro interaction background */}
                <div className="absolute inset-0 bg-black/10 scale-x-0 group-hover:scale-x-100 group-disabled:scale-x-0 transition-transform duration-300 origin-left"></div>
                
                {/* Loading spinner */}
                {isLoading && (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin"></div>
                  </div>
                )}
                
                {/* Button text */}
                <span className={`relative z-10 transition-transform duration-200 ${isLoading ? 'ml-4' : 'group-hover:scale-105'}`}>
                  {isLoading ? 'Inviting...' : 'Invite'}
                </span>
              </button>
            </div>
          </div>

          {/* Collaborators List */}
          <div className="px-6 py-4">
            <h3 className="text-sm font-medium text-white mb-3">
              People with access ({collaborators.length})
            </h3>
            <div className="space-y-2">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#1a1f0a] hover:bg-[#2a2f1a] transition-colors border border-[#4a5a3a]"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white font-medium">
                      {(collaborator.name || collaborator.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">
                          {collaborator.name || collaborator.email}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(collaborator.status)}`}>
                          {collaborator.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 truncate">{collaborator.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {collaborator.role === 'owner' ? (
                      <span className="text-sm text-gray-300 px-3 py-1">
                        — Owner
                      </span>
                    ) : (
                      <>
                        <div className="relative">
                          <select
                            value={collaborator.role}
                            onChange={(e) => handleRoleChange(collaborator._id, e.target.value)}
                            className="bg-[#1a1f0a] border border-[#4a5a3a] rounded-lg px-3 py-1 pr-8 text-sm text-white focus:outline-none focus:border-[#d7ff2f] cursor-pointer appearance-none hover:bg-[#2a2f1a] transition-colors"
                          >
                            <option value="viewer">Can view</option>
                            <option value="editor">Can edit</option>
                          </select>
                          {/* Custom dropdown icon */}
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCollaborator(collaborator._id)}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1"
                          title="Remove"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share Link Section */}
          <div className="px-6 py-4 border-t border-[#4a5a3a]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Share link</h3>
              {!shareLinkEnabled && (
                <button
                  onClick={handleGenerateShareLink}
                  className="text-sm citrus-accent-text hover:underline"
                >
                  Generate link
                </button>
              )}
            </div>
            {shareLinkEnabled && shareLink && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-[#1a1f0a] border border-[#4a5a3a] rounded-lg px-4 py-2 text-white text-sm focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-[#4a5a3a] hover:bg-[#5a6a4a] text-white rounded-lg text-sm font-medium transition-colors relative"
                >
                  {showCopied ? (
                    <>
                      <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-1">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="ml-1">Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
            <p className="text-xs text-gray-300 mt-2">
              Anyone with the link can view this chat
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
