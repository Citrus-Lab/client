import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const InvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/collaboration/shared/${token}`);
      const data = await response.json();

      if (response.ok) {
        setInvitation(data);
        setUserEmail(data.invitedEmail || '');
      } else {
        setError(data.error || 'Invalid or expired invitation');
      }
    } catch (err) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!userName.trim()) {
      toast.warning('Please enter your name', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      // Store user info in localStorage
      const user = {
        name: userName,
        email: userEmail || invitation.invitedEmail,
        role: invitation.role,
        chatId: invitation.chatId
      };

      localStorage.setItem('collaborationUser', JSON.stringify(user));

      toast.success('Invitation accepted! Redirecting...', {
        position: 'top-right',
        autoClose: 2000
      });

      // Redirect to chat with the collaboration
      setTimeout(() => {
        window.location.href = `/?chat=${invitation.chatId}&collaboration=true`;
      }, 1000);
    } catch (err) {
      toast.error('Failed to accept invitation. Please try again.', {
        position: 'top-right',
        autoClose: 4000
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-0 max-w-lg w-full overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mx-auto mb-6 p-3">
              <img src="https://ik.imagekit.io/1ukuaaqqhl/citrus%20loogo.png?updatedAt=1760425420880" alt="CitrusLab" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-semibold text-black mb-2">You're invited to collaborate</h1>
            <p className="text-gray-600 text-sm">
              <span className="font-medium text-black">{invitation.inviterName}</span> invited you to join their workspace
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-8 py-6">
          
          {/* Project Details Card */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">You've been invited to</p>
            <h3 className="text-xl font-semibold text-black mb-3">{invitation.chatTitle}</h3>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              invitation.role === 'editor' 
                ? 'bg-amber-100 text-black border border-amber-200' 
                : 'bg-blue-100 text-black border border-blue-200'
            }`}>
              as a {invitation.role === 'editor' ? 'Editor' : 'Viewer'}
            </span>
          </div>

          {/* User Info Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Your name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-black placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Email address</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-black placeholder-gray-500"
              />
            </div>
          </div>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Accept Invitation
          </button>

          <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
            By accepting, you agree to collaborate on this project and follow the team guidelines
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;
