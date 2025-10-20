import { useState, useRef, useEffect } from 'react'

const ChatHistory = ({ sessions, currentSessionId, onSessionSelect, onNewChat, onUpdateTitle, onDeleteSession }) => {
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const scrollContainerRef = useRef(null)

  const startEditing = (session) => {
    setEditingId(session.id)
    setEditTitle(session.title)
  }

  const saveTitle = () => {
    if (editTitle.trim()) {
      onUpdateTitle(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const formatDate = (timestamp) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const getSessionPreview = (messages) => {
    const userMessage = messages.find(m => m.sender === 'user')
    if (userMessage) {
      return userMessage.text.length > 50 
        ? userMessage.text.substring(0, 50) + '...'
        : userMessage.text
    }
    return null
  }

  const toggleMenu = (e, sessionId) => {
    e.stopPropagation()
    setOpenMenuId(prev => prev === sessionId ? null : sessionId)
  }

  const handleRename = (e, session) => {
    e.stopPropagation()
    setOpenMenuId(null)
    startEditing(session)
  }

  const handleDelete = (e, sessionId) => {
    e.stopPropagation()
    setOpenMenuId(null)
    onDeleteSession?.(sessionId)
  }

  // Check if there's more content to scroll
  const checkScrollIndicator = () => {
    const container = scrollContainerRef.current
    if (container) {
      const hasScroll = container.scrollHeight > container.clientHeight
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 20
      setShowScrollIndicator(hasScroll && !isAtBottom)
    }
  }

  useEffect(() => {
    checkScrollIndicator()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollIndicator)
      return () => container.removeEventListener('scroll', checkScrollIndicator)
    }
  }, [sessions])

  return (
    <div 
      className="space-y-2"
      ref={scrollContainerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {sessions.map((session) => (
        <div
          key={session.id}
          onClick={() => onSessionSelect(session.id)}
          className={`py-2.5 px-3 rounded-lg cursor-pointer transition-colors duration-200 group border hover:border-[rgba(215,255,47,0.35)] chat-history-item ${
            currentSessionId === session.id
              ? 'history-item-bg border-[rgba(215,255,47,0.35)] text-white'
              : 'bg-black/20 border-[rgba(215,255,47,0.15)] text-gray-300 hover:bg-black/40 hover:shadow-[0_0_0_1px_rgba(215,255,47,0.25)_inset]'
          }`}
        >
          <div className="flex items-center justify-between">
            {editingId === session.id ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle()
                  if (e.key === 'Escape') cancelEditing()
                }}
                onBlur={saveTitle}
                className="flex-1 bg-transparent border-none outline-none text-white font-medium chat-history-title"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <h3 
                  className="font-medium flex-1 truncate cursor-pointer chat-history-title"
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    startEditing(session)
                  }}
                  title="Double-click to rename"
                >
                  {session.title}
                </h3>
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all delete-button-micro"
                  title="Delete"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ChatHistory