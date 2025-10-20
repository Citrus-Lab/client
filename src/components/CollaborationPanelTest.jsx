import { useState } from 'react';
import CollaborationPanelCompact from './CollaborationPanelCompact.jsx';

const CollaborationPanelTest = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [chatId] = useState('test-chat-123');
  
  const mockCurrentUser = {
    email: 'current-user@example.com',
    name: 'Current User'
  };

  return (
    <div className="min-h-screen bg-[#1a1f2a] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Collaboration Panel Test</h1>
        
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="px-4 py-2 bg-[#d7ff2f] text-black rounded-lg font-medium hover:brightness-110 transition-all duration-200"
          >
            {isVisible ? 'Hide Panel' : 'Show Panel'}
          </button>
        </div>

        <div className="relative">
          <div className="w-80 h-20 bg-[#2a2f3a] rounded-lg border border-[#d7ff2f]/20 flex items-center justify-center">
            <span className="text-white">Anchor Element (Panel appears below this)</span>
          </div>
          
          <CollaborationPanelCompact
            chatId={chatId}
            isVisible={isVisible}
            onClose={() => setIsVisible(false)}
            anchorRef={null}
            currentUser={mockCurrentUser}
          />
        </div>

        <div className="mt-8 p-4 bg-[#2a2f3a]/50 rounded-lg border border-[#d7ff2f]/10">
          <h3 className="text-white font-medium mb-2">Test Instructions:</h3>
          <ul className="text-white/70 text-sm space-y-1">
            <li>• Panel should be visible and have proper height (600px)</li>
            <li>• "Active Now" header should show with green dot and count</li>
            <li>• Current user should be displayed in the list</li>
            <li>• "+ Invite" button should be visible and clickable</li>
            <li>• Settings tab should show notification toggles</li>
            <li>• "Add Demo Data" button should add test users</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanelTest;