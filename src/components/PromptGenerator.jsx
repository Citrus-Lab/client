import { useState, useRef, useEffect, useCallback } from 'react'
import promptIcon from '../assets/prompt-generator-icon.png'
import logoIcon from '../assets/logo-icon.png'
import citrusIconDark from '../assets/citrus-icon-dark.png'
import { toast } from 'react-toastify'
import { api } from '../config/api'

const PromptGenerator = ({ 
  isVisible,
  onClose,
  currentUser,
  onResetFunctionReady,
  onStateChange
}) => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([]) // Chat-like conversation
  const [generatedPrompts, setGeneratedPrompts] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewPromptIndex, setPreviewPromptIndex] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [isResetting, setIsResetting] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingText, setEditingText] = useState('')
  
  const textareaRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Initialize session ID on component mount
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `pg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      setSessionId(newSessionId)
    }
  }, [sessionId])

  // Load session data when component becomes visible
  useEffect(() => {
    if (isVisible && sessionId) {
      loadSessionData()
    }
  }, [isVisible, sessionId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-save session data when state changes (only if user is authenticated)
  useEffect(() => {
    if (sessionId && currentUser && (generatedPrompts.length > 0 || messages.length > 0 || input.trim())) {
      const timeoutId = setTimeout(() => {
        saveSessionData()
      }, 2000) // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId)
    }
  }, [generatedPrompts, messages, input, sessionId, currentUser])

  // Update parent component with current state (optional)
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        generatedPrompts,
        messages,
        input,
        isResetting
      })
    }
  }, [generatedPrompts, messages, input, isResetting, onStateChange])

  // Load session data from database
  const loadSessionData = async () => {
    try {
      const data = await api.promptGeneratorChat.getActiveSession(sessionId)
      const session = data.session
      
      if (session.messages) setMessages(session.messages)
      if (session.generatedPrompts) setGeneratedPrompts(session.generatedPrompts)
      // Don't restore input to avoid overwriting current typing
    } catch (error) {
      console.error('Failed to load session data:', error)
      // Continue without loading - not critical for guest users
    }
  }

  // Save session data to database
  const saveSessionData = async () => {
    if (!sessionId) return

    try {
      await api.promptGeneratorChat.saveSession({
        sessionId,
        title: 'Prompt Generator Session',
        messages,
        generatedPrompts,
        snippets: [] // Remove snippets from saving
      })
    } catch (error) {
      console.error('Failed to save session data:', error)
      // Continue without saving - not critical for UX (especially for guest users)
    }
  }

  // Reset session (save current and create new)
  const resetSession = useCallback(async () => {
    if (!sessionId) {
      console.log('No session ID available for reset')
      return
    }

    console.log('Resetting session with ID:', sessionId)
    setIsResetting(true)
    
    try {
      // Always try to reset via API (it handles both authenticated and guest users)
      const data = await api.promptGeneratorChat.resetSession(sessionId)
      console.log('Reset response:', data)
      const newSession = data.newSession
      setSessionId(newSession.sessionId)
      
      if (currentUser) {
        toast.success('Session reset! Previous session saved to history.', {
          position: 'top-right',
          autoClose: 3000
        })
      } else {
        toast.success('Session reset!', {
          position: 'top-right',
          autoClose: 3000
        })
      }
      
      // Clear all state
      setInput('')
      setMessages([])
      setGeneratedPrompts([])
      setPreviewPromptIndex(null)
      setEditingMessageId(null)
      setEditingText('')
      
    } catch (error) {
      console.error('Failed to reset session:', error)
      toast.error('Failed to reset session. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      })
    } finally {
      setIsResetting(false)
    }
  }, [sessionId, currentUser])

  // Expose reset function to parent component (optional)
  useEffect(() => {
    if (onResetFunctionReady) {
      onResetFunctionReady(() => resetSession)
    }
  }, [onResetFunctionReady, resetSession])

  // Add user message
  const addUserMessage = () => {
    if (!input.trim()) return
    
    const newMessage = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, newMessage])
    setInput('')
    return newMessage
  }

  // Edit message functionality
  const startEditMessage = (message) => {
    setEditingMessageId(message.id)
    setEditingText(message.text)
  }

  const saveEditMessage = () => {
    if (!editingText.trim()) return
    
    setMessages(prev => prev.map(msg => 
      msg.id === editingMessageId 
        ? { ...msg, text: editingText.trim(), edited: true }
        : msg
    ))
    setEditingMessageId(null)
    setEditingText('')
  }

  const cancelEditMessage = () => {
    setEditingMessageId(null)
    setEditingText('')
  }

  // Delete message
  const deleteMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }



  // Generate comprehensive project context
  const generatePromptContent = async (context) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    return `# Project Context

## Overview
${context}

## Tech Stack
- **Frontend**: React.js with Vite
- **Styling**: TailwindCSS + Custom CSS
- **State Management**: React Hooks (useState, useEffect)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Real-time**: Socket.io

## Key Features
1. User Authentication & Authorization
2. Real-time Data Synchronization
3. Responsive Design (Mobile & Desktop)
4. Dark Mode Support
5. API Integration
6. Data Visualization
7. File Upload/Download
8. Search & Filter Functionality

## Architecture
- **Design Pattern**: MVC (Model-View-Controller)
- **API**: RESTful API
- **Deployment**: Docker + AWS/Vercel

## Development Workflow
1. Setup development environment
2. Implement core features
3. Add authentication layer
4. Integrate database
5. Testing & debugging
6. Deployment & monitoring

## Best Practices
- Clean code architecture
- Component reusability
- Error handling
- Security measures
- Performance optimization
- Accessibility standards (WCAG)

This structured context will help AI assistants provide more accurate and relevant responses for your project.`
  }

  // Handle submit - always generate best prompt
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    
    // Add user message
    const userMessage = addUserMessage()
    
    // Automatically generate the best prompt
    setIsGenerating(true)
    
    try {
      // Get all messages including the new one
      const allMessages = [...messages, userMessage]
      const fullContext = allMessages.map(msg => msg.text).join('\n\n')
      
      // Generate prompt
      const generatedPrompt = {
        id: Date.now(),
        title: `Project Context - ${new Date().toLocaleDateString()}`,
        content: await generatePromptContent(fullContext),
        timestamp: new Date().toISOString(),
        context: fullContext
      }
      
      setGeneratedPrompts(prev => [...prev, generatedPrompt])
      
    } catch (error) {
      console.error('Error generating prompt:', error)
      toast.error('Failed to generate prompt. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!', {
      position: 'top-right',
      autoClose: 2000
    })
  }

  if (!isVisible) return null

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto history-scrollbar">
          <div className="py-4">
            
            {/* User Messages */}
            {messages.map((message) => (
              <div key={message.id} className="flex justify-end items-start gap-4 mb-6 px-4">
                <div className="flex flex-col items-end max-w-[70%] min-w-0">
                  {/* Message bubble - Prompt Generator style with subtle gradient and glow */}
                  <div className="relative bg-gradient-to-br from-[#e8ff4a] via-[#d7ff2f] to-[#c4f01a] text-black rounded-2xl rounded-tr-md px-5 py-3 shadow-xl border border-[rgba(215,255,47,0.3)] backdrop-blur-sm"
                       style={{
                         boxShadow: '0 8px 32px rgba(215, 255, 47, 0.15), 0 0 0 1px rgba(215, 255, 47, 0.1) inset'
                       }}>
                    {editingMessageId === message.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full bg-white/20 border border-black/20 rounded-lg px-3 py-2 text-black placeholder-black/60 resize-none focus:outline-none focus:ring-2 focus:ring-black/30"
                          placeholder="Edit your message..."
                          rows={3}
                          autoFocus
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={cancelEditMessage}
                            className="px-3 py-1 text-xs bg-black/10 hover:bg-black/20 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveEditMessage}
                            className="px-3 py-1 text-xs bg-black/20 hover:bg-black/30 rounded-md transition-colors font-medium"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                          {message.text}
                        </div>
                        {message.edited && (
                          <span className="text-xs text-black/60 mt-2 block">(edited)</span>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Action buttons below message - always visible */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => startEditMessage(message)}
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
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 bg-black/20 hover:bg-red-900/30 rounded-md transition-all"
                      title="Delete message"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* User avatar - Enhanced Prompt Generator style */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg border border-purple-400/30"
                     style={{
                       boxShadow: '0 4px 16px rgba(168, 85, 247, 0.25), 0 0 0 1px rgba(168, 85, 247, 0.1) inset'
                     }}>
                  <span className="text-white text-sm font-semibold drop-shadow-sm">U</span>
                </div>
              </div>
            ))}

            {/* Generated Prompts */}
            {generatedPrompts.map((prompt, index) => (
              <div key={prompt.id} className="flex justify-start items-start gap-4 mb-6 px-4">
                {/* AI avatar with prompt icon - Subtle */}
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-lg bg-[#d7ff2f] flex items-center justify-center border border-dashed border-[rgba(215,255,47,0.6)] hover:border-solid transition-all duration-200">
                    <img src={promptIcon} className="w-4 h-4" alt="AI" />
                  </div>
                </div>
                
                <div className="flex flex-col max-w-[60%] min-w-0 flex-1">
                  {/* Model info header - Subtle */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-gray-300 text-sm font-medium">Generated your best prompt</span>
                  </div>
                  
                  {/* Message bubble - Clean subtle style */}
                  <div className="relative rounded-2xl rounded-tl-md px-5 py-4 shadow-lg bg-[#2a2f1a] border-2 border-dashed border-[rgba(215,255,47,0.3)] prompt-generator-border">
                    <div className="space-y-3">
                      {/* Header with title and action buttons */}
                      <div className="flex items-center justify-between pb-2 border-b border-dashed border-[rgba(215,255,47,0.2)]">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#d7ff2f]"></div>
                          <span className="text-[#d7ff2f] text-sm font-medium">{prompt.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewPromptIndex(index)}
                            className="group px-3 py-1.5 border border-dashed border-[rgba(215,255,47,0.4)] hover:border-[rgba(215,255,47,0.7)] text-[#d7ff2f] text-xs rounded-md transition-all duration-200 flex items-center gap-1.5 font-medium hover:bg-[rgba(215,255,47,0.05)] hover:scale-105 active:scale-95"
                            title="Preview prompt"
                          >
                            <svg className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                          </button>
                          <button
                            onClick={() => copyToClipboard(prompt.content)}
                            className="group px-3 py-1.5 border border-dashed border-[rgba(215,255,47,0.4)] hover:border-[rgba(215,255,47,0.7)] text-[#d7ff2f] text-xs rounded-md transition-all duration-200 flex items-center gap-1.5 font-medium hover:bg-[rgba(215,255,47,0.05)] hover:scale-105 active:scale-95"
                            title="Copy prompt"
                          >
                            <svg className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap text-gray-100 text-sm leading-relaxed">
                        {prompt.content.substring(0, 200)}...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading State */}
            {isGenerating && (
              <div className="flex justify-start items-start gap-4 mb-6 px-4">
                {/* AI avatar with prompt icon - Subtle loading */}
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-lg bg-[#d7ff2f] flex items-center justify-center border border-dashed border-[rgba(215,255,47,0.6)] animate-pulse">
                    <img src={promptIcon} className="w-4 h-4" alt="AI" />
                  </div>
                </div>
                
                <div className="flex flex-col max-w-[60%] min-w-0 flex-1">
                  {/* Model info header - Enhanced */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d7ff2f] animate-pulse"></div>
                      <span className="text-gray-300 text-sm font-medium">Generating your best prompt...</span>
                    </div>
                  </div>
                  
                  {/* Message bubble - Enhanced loading style */}
                  <div className="relative rounded-2xl rounded-tl-md px-5 py-4 shadow-xl bg-gradient-to-br from-[#2a2f1a] via-[#2d321c] to-[#252a18] border border-[rgba(215,255,47,0.25)] backdrop-blur-sm"
                       style={{
                         boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(215, 255, 47, 0.1) inset, 0 4px 16px rgba(215, 255, 47, 0.08)'
                       }}>
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[#d7ff2f] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#d7ff2f] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-[#d7ff2f] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-gray-300 text-sm">Creating your best prompt...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {messages.length === 0 && generatedPrompts.length === 0 && !isGenerating && (
              <div className="text-center text-gray-300">
                <div className="min-h-[50vh] flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--citrus-accent)]/20 flex items-center justify-center mb-3">
                    <img src={promptIcon} className="w-6 h-6" alt="Prompt Generator" />
                  </div>
                  <h2 className="text-2xl font-medium mb-2 text-white">Get your <span className="citrus-accent-text">best prompt</span></h2>
                  <p className="text-gray-400 text-base">Describe your project and I'll create the perfect prompt</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input Form - Fixed at Bottom */}
        <div className="bottom-input-form px-4 py-3 flex-shrink-0">
          <form onSubmit={handleSubmit} className="relative w-full max-w-3xl mx-auto">
            <div className="rounded-xl border border-[#4a5a3a] bg-black/60 relative p-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder="Describe your project context - I'll generate the best prompt for you..."
                rows={1}
                className="w-full bg-transparent outline-none resize-none text-sm text-white placeholder-gray-400 pr-12"
                style={{
                  minHeight: '40px',
                  maxHeight: '120px'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                disabled={isGenerating}
              />
              
              <div className="flex items-center justify-end mt-2">
                <button
                  type="submit"
                  disabled={!input.trim() || isGenerating}
                  className="group px-3 py-1.5 citrus-accent-bg text-black text-xs rounded transition-all duration-200 hover:brightness-110 font-medium disabled:opacity-60 disabled:cursor-not-allowed z-10 active:scale-95 flex items-center space-x-1.5 relative overflow-hidden focus:outline-none focus:ring-0"
                  title="Send & Generate Best Prompt"
                >
                  {/* Inner shiny white effect - two tilted lines */}
                  <div className="absolute inset-0 opacity-60">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 translate-x-2"></div>
                    <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 -translate-x-2"></div>
                  </div>
                  
                  <span className="relative z-10">Send</span>

                  {/* Simple paper plane animation */}
                  <div className="relative z-10 group-hover:translate-x-0.5 group-active:translate-x-1 transition-transform duration-200 ease-out">
                    <img
                      src={citrusIconDark}
                      alt="Send"
                      className="w-3.5 h-3.5"
                    />
                  </div>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Prompt Preview Modal */}
      {previewPromptIndex !== null && generatedPrompts[previewPromptIndex] && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-8" onClick={() => setPreviewPromptIndex(null)}>
          <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg shadow-2xl z-[9999] w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e)=>e.stopPropagation()}>
            <div className="p-4 border-b border-[#4a5a3a] flex items-center justify-between flex-shrink-0">
              <h3 className="text-[#d7ff2f] font-medium">{generatedPrompts[previewPromptIndex].title}</h3>
              <div className="flex items-center gap-2">
                <button 
                  className="bg-[#d7ff2f] hover:brightness-110 text-black px-4 py-2 rounded text-sm font-medium transition-colors"
                  onClick={() => copyToClipboard(generatedPrompts[previewPromptIndex].content)}
                >
                  Copy
                </button>
                <button 
                  className="text-gray-400 hover:text-white px-2 py-1"
                  onClick={() => setPreviewPromptIndex(null)}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 bg-[#1a1f0a] overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">{generatedPrompts[previewPromptIndex].content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptGenerator
