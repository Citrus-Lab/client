import { useState, useEffect, useRef } from 'react';

const ProfileModal = ({ isOpen, onClose, user }) => {
  const [profile, setProfile] = useState({
    name: user?.name || 'Guest User',
    email: user?.email || 'guest@citruslab.dev',
    avatar: user?.avatar || '',
    bio: user?.bio || '',
    role: user?.role || 'user'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [stats, setStats] = useState({
    totalChats: 0,
    totalMessages: 0,
    collaborations: 0,
    templatesCreated: 0
  });
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadUserStats();
    }
  }, [isOpen]);

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

  const loadUserStats = async () => {
    // TODO: Fetch actual stats from backend
    setStats({
      totalChats: 24,
      totalMessages: 156,
      collaborations: 5,
      templatesCreated: 8
    });
  };

  const handleSaveProfile = async () => {
    try {
      // TODO: Save to backend
      console.log('Saving profile:', profile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-[#2a2f1a] rounded-2xl shadow-2xl w-full max-w-3xl border border-[#4a5a3a] overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#4a5a3a] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#d7ff2f]">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-[#4a5a3a]">
          <div className="flex gap-4">
            {['profile', 'settings', 'stats'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-2 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab
                    ? 'text-[#d7ff2f] border-[#d7ff2f]'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-[#d7ff2f]"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#4a5a3a] flex items-center justify-center text-white text-2xl font-bold border-2 border-[#d7ff2f]">
                      {getInitials(profile.name)}
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-[#d7ff2f] text-black rounded-full p-2 cursor-pointer hover:brightness-110 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-semibold text-white">{profile.name}</h3>
                    <span className="px-2 py-1 bg-[#4a5a3a] text-[#d7ff2f] text-xs rounded-full">
                      {profile.role}
                    </span>
                  </div>
                  <p className="text-gray-400">{profile.email}</p>
                </div>
                <button
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  className="px-4 py-2 bg-[#d7ff2f] text-black rounded-lg text-sm font-medium hover:brightness-110 transition-all"
                >
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </button>
              </div>

              {/* Profile Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full bg-[#1a1f0a] border border-[#4a5a3a] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#d7ff2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full bg-[#1a1f0a] border border-[#4a5a3a] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#d7ff2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-[#1a1f0a] border border-[#4a5a3a] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#d7ff2f] disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
                
                <div className="flex items-center justify-between p-4 bg-[#1a1f0a] rounded-lg">
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-400">Receive email updates about collaborations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d7ff2f]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1a1f0a] rounded-lg">
                  <div>
                    <p className="text-white font-medium">Auto-save Chats</p>
                    <p className="text-sm text-gray-400">Automatically save chat history</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d7ff2f]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1a1f0a] rounded-lg">
                  <div>
                    <p className="text-white font-medium">Show Active Users</p>
                    <p className="text-sm text-gray-400">Display who's currently viewing</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d7ff2f]"></div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-[#4a5a3a]">
                <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
                <div className="space-y-3">
                  <button className="w-full text-left px-4 py-3 bg-[#1a1f0a] hover:bg-[#2a2f1a] rounded-lg text-white transition-colors">
                    Change Password
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-[#1a1f0a] hover:bg-[#2a2f1a] rounded-lg text-white transition-colors">
                    Export Data
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Activity</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                  <div className="text-3xl font-bold text-white mb-2">{stats.totalChats}</div>
                  <div className="text-sm text-gray-300">Total Chats</div>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
                  <div className="text-3xl font-bold text-white mb-2">{stats.totalMessages}</div>
                  <div className="text-sm text-gray-300">Messages Sent</div>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                  <div className="text-3xl font-bold text-white mb-2">{stats.collaborations}</div>
                  <div className="text-sm text-gray-300">Collaborations</div>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
                  <div className="text-3xl font-bold text-white mb-2">{stats.templatesCreated}</div>
                  <div className="text-sm text-gray-300">Templates Created</div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#4a5a3a]">
                <h4 className="text-md font-semibold text-white mb-3">Recent Activity</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-[#1a1f0a] rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">Created new chat session</p>
                      <p className="text-xs text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#1a1f0a] rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">Invited collaborator to project</p>
                      <p className="text-xs text-gray-400">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#1a1f0a] rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">Created custom template</p>
                      <p className="text-xs text-gray-400">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
