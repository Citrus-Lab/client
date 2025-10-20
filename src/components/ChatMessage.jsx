import { useState, useRef, useEffect } from 'react'

const ChatMessage = ({ message }) => {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)
  const [showActions, setShowActions] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const messageRef = useRef(null)
  const editTextareaRef = useRef(null)

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Enhanced code detection
  const containsCode = (text) => {
    const codePatterns = [
      /```[\s\S]*?```/g, // Code blocks
      /`[^`\n]+`/g, // Inline code
      /^\s*(import|export|function|const|let|var|class|interface|type)\s/m,
      /\{[\s\S]*?\}/g, // Object/function blocks
      /<[^>]+>/g, // HTML/JSX tags
      /^\s*\/\/|^\s*\/\*/m, // Comments
      /\b(npm|yarn|git|docker|kubectl)\s+\w+/g // CLI commands
    ]
    return codePatterns.some(pattern => pattern.test(text))
  }

  // Get proper AI model icon
  const getModelIcon = () => {
    if (!message.model) return null
    
    const modelName = message.model.name?.toLowerCase() || ''
    
    if (modelName.includes('claude')) {
      return (
        <div className="w-6 h-6 rounded-lg bg-[#CC785C] flex items-center justify-center">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
            <path d="M7.5 8.25h9m-9 3h9m-9 3h6m-3 2.25h.007v.008H10.5v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
        </div>
      )
    }
    
    if (modelName.includes('gpt') || modelName.includes('chatgpt')) {
      return (
        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142-.0852 4.783-2.7582a.7712.7712 0 0 0 .7806 0l5.8428 3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142.0852-4.7735 2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="#10A37F"/>
          </svg>
        </div>
      )
    }
    
    if (modelName.includes('gemini')) {
      return (
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
          </svg>
        </div>
      )
    }
    
    // Default AI icon
    return (
      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
    )
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditText(message.text)
    setTimeout(() => {
      editTextareaRef.current?.focus()
      editTextareaRef.current?.setSelectionRange(editText.length, editText.length)
    }, 100)
  }

  const handleSaveEdit = () => {
    // In a real app, you'd call an API to update the message
    console.log('Saving edited message:', editText)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditText(message.text)
  }

  const isLongMessage = message.text.length > 500

  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      const textarea = editTextareaRef.current
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [isEditing, editText])

  if (message.sender === 'user') {
    return (
      <div className="group flex justify-end items-start gap-4 mb-6 px-4">
        <div className="flex flex-col items-end max-w-[70%] min-w-0">
          {/* Message bubble */}
          <div 
            className="relative bg-gradient-to-br from-[#d7ff2f] to-[#b8e025] text-black rounded-2xl rounded-tr-md px-5 py-3 shadow-lg"
          >
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  ref={editTextareaRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-white/20 border border-black/20 rounded-lg px-3 py-2 text-black placeholder-black/60 resize-none focus:outline-none focus:ring-2 focus:ring-black/30"
                  placeholder="Edit your message..."
                  rows={3}
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-xs bg-black/10 hover:bg-black/20 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-xs bg-black/20 hover:bg-black/30 rounded-md transition-colors font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                  {isLongMessage && !isExpanded 
                    ? message.text.substring(0, 500) + '...'
                    : message.text
                  }
                </div>
                
                {isLongMessage && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 text-xs text-black/70 hover:text-black underline"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </>
            )}
          </div>
          
          {/* Action buttons below message - always visible */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-black/20 hover:bg-black/30 rounded-md transition-all"
              title="Edit message"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => copyToClipboard(message.text)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-black/20 hover:bg-black/30 rounded-md transition-all"
              title="Copy message"
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-white text-sm font-semibold">U</span>
        </div>
      </div>
    )
  }

  // AI Message
  return (
    <div className="group flex justify-start items-start gap-4 mb-6 px-4">
      {/* AI avatar with model icon */}
      <div className="flex-shrink-0">
        {getModelIcon()}
      </div>
      
      <div className="flex flex-col max-w-[60%] min-w-0 flex-1">
        {/* Model info header - simplified, no colored dots */}
        {message.model && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-gray-300 text-sm font-medium">{message.model.name}</span>
          </div>
        )}
        
        {/* Message bubble */}
        <div 
          ref={messageRef}
          className={`relative rounded-2xl rounded-tl-md px-5 py-4 shadow-lg ${
            message.isError 
              ? 'bg-red-900/30 border border-red-500/30' 
              : containsCode(message.text)
                ? 'bg-[#1a1f0a] border border-[rgba(215,255,47,0.2)]'
                : 'bg-[#2a2f1a] border border-[rgba(215,255,47,0.15)]'
          }`}
        >
          {containsCode(message.text) ? (
            <div className="space-y-3">
              {/* Code header */}
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(215,255,47,0.1)]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#d7ff2f]"></div>
                  <span className="text-[#d7ff2f] text-sm font-medium">Code Response</span>
                </div>
                <button
                  onClick={() => copyToClipboard(message.text)}
                  className="px-3 py-1.5 bg-[rgba(215,255,47,0.1)] hover:bg-[rgba(215,255,47,0.2)] text-[#d7ff2f] text-xs rounded-lg transition-all flex items-center gap-1.5 font-medium"
                >
                  {copied ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-gray-200 text-sm font-mono leading-relaxed overflow-x-auto">
                {isLongMessage && !isExpanded 
                  ? message.text.substring(0, 500) + '...'
                  : message.text
                }
              </pre>
              {isLongMessage && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-[#d7ff2f] hover:text-[#b8e025] underline"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="whitespace-pre-wrap text-gray-100 text-sm leading-relaxed">
                {isLongMessage && !isExpanded 
                  ? message.text.substring(0, 500) + '...'
                  : message.text
                }
              </div>
              {isLongMessage && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-gray-400 hover:text-gray-300 underline"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Action buttons below message - always visible */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => copyToClipboard(message.text)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-black/20 hover:bg-black/30 rounded-md transition-all"
            title="Copy message"
          >
            {copied ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-black/20 hover:bg-black/30 rounded-md transition-all"
            title="Regenerate response"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Regenerate
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatMessage