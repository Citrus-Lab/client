import React, { useState } from 'react';
import CollaborationTest from '../components/CollaborationTest';
import CollaborationPanelTest from '../components/CollaborationPanelTest';
import { Users, Settings, MessageSquare, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CollaborationTestPage = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="h-screen bg-[#121318] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1b23] border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </Link>
            <div className="w-px h-6 bg-white/10"></div>
            <h1 className="text-xl font-semibold text-white">Collaboration Test</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPanel(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              Manage Collaboration
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Side - Mock Chat Interface */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'chat' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                AI Chat
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
              </button>
            </div>
          </div>

          <div className="flex-1 p-6">
            {activeTab === 'chat' ? (
              <div className="space-y-4">
                <div className="bg-[#1a1b23] rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-medium mb-2">Mock AI Chat Interface</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    This is a test environment for collaboration features. In the real app, 
                    this would be the main AI chat interface.
                  </p>
                  
                  {/* Mock Messages */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                        U
                      </div>
                      <div className="flex-1">
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white text-sm">
                            Can you help me write a React component for user authentication?
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                        AI
                      </div>
                      <div className="flex-1">
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                          <p className="text-white text-sm">
                            I'll help you create a React authentication component. Here's a basic structure...
                          </p>
                          <div className="mt-2 p-2 bg-black/20 rounded text-xs text-gray-300 font-mono">
                            {`import React, { useState } from 'react';

const AuthComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  return (
    <form>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
};`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1b23] rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-medium mb-2">Collaboration Features</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="text-purple-400 font-medium text-sm mb-1">Real-time Presence</h4>
                      <p className="text-gray-400 text-xs">See who's online and active in the chat</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="text-blue-400 font-medium text-sm mb-1">Shared Sessions</h4>
                      <p className="text-gray-400 text-xs">Collaborate on the same conversation</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="text-green-400 font-medium text-sm mb-1">Role Management</h4>
                      <p className="text-gray-400 text-xs">Control who can view, edit, or manage</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="text-yellow-400 font-medium text-sm mb-1">Share Links</h4>
                      <p className="text-gray-400 text-xs">Generate shareable links for easy access</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#1a1b23] rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-medium mb-4">Collaboration Settings</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-gray-300">Enable real-time collaboration</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-300">Show typing indicators</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-300">Allow public sharing</span>
                      <input type="checkbox" className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-300">Require approval for new members</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                  </div>
                </div>

                <div className="bg-[#1a1b23] rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-medium mb-4">Notification Settings</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-gray-300">New message notifications</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-300">User join/leave notifications</span>
                      <input type="checkbox" className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-300">Sound notifications</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Collaboration Panel */}
        <div className="w-80">
          <CollaborationTest chatId="test-chat-123" />
        </div>
      </div>

      {/* Collaboration Management Modal */}
      {showPanel && (
        <CollaborationPanelTest 
          chatId="test-chat-123"
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  );
};

export default CollaborationTestPage;