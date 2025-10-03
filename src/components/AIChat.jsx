import { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'
import ChatHistory from './ChatHistory'
import citrusLogo from '../assets/citrus-logo.png'
import logoIcon from '../assets/logo-icon.png'
import newChatIcon from '../assets/new-chat-icon.png'
import historyIcon from '../assets/history-icon.png'
import promptIcon from '../assets/prompt-generator-icon.png'
import projectIcon from '../assets/project-context-icon.png'
import templatesIcon from '../assets/templates-icon.png'
import ApiTest from './ApiTest'
import { aiModels } from '../data/models'
import { api } from '../config/api'

const AIChat = ({ themeWithImage, onToggleTheme }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState(aiModels.find(m => m.cost === 'Free') || aiModels[0])
  const [mode, setMode] = useState('manual')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [customTemplates, setCustomTemplates] = useState([])
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    name: '', 
    persona: '', 
    context: '', 
    instruction: '', 
    format: 'paragraph', 
    tone: 'professional', 
    inputData: '', 
    deeplyThinkAbout: '', 
    warning: '', 
    askMe: ''
  })
  // Prompt Generator / Project Context states
  const [showPromptGenerator, setShowPromptGenerator] = useState(false)
  const [showProjectContext, setShowProjectContext] = useState(false)
  const [promptGeneratorInput, setPromptGeneratorInput] = useState('')
  const [promptGeneratorCategory, setPromptGeneratorCategory] = useState('')
  const [promptGeneratorTone, setPromptGeneratorTone] = useState('')
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [generatedPromptResult, setGeneratedPromptResult] = useState(null)
  // Simple saved Project Contexts
  const [projectContexts, setProjectContexts] = useState([])
  const [renamingContextId, setRenamingContextId] = useState(null)
  const [renameText, setRenameText] = useState('')
  
  // New states for enhanced prompt generator
  const [codeInput, setCodeInput] = useState('')
  const [folderStructure, setFolderStructure] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false)
  const [finalPrompt, setFinalPrompt] = useState('')
  // Mini snippet boxes (Claude-like) under main search
  const [snippets, setSnippets] = useState([])
  const [previewSnippetIndex, setPreviewSnippetIndex] = useState(null)
  const [chatSessions, setChatSessions] = useState([
    { id: 1, title: 'New Chat', messages: [], timestamp: new Date() }
  ])
  const [currentSessionId, setCurrentSessionId] = useState(1)
  const [backendStatus, setBackendStatus] = useState('checking')
  const messagesEndRef = useRef(null)
  const historyPanelRef = useRef(null)
  const isDraggingHistoryRef = useRef(false)
  const dragStartYRef = useRef(0)
  const dragStartScrollTopRef = useRef(0)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // History drag-to-scroll handlers
  const onHistoryMouseDown = (e) => {
    // Only left click and avoid when clicking interactive controls
    if (e.button !== 0) return
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return
    const el = historyPanelRef.current
    if (!el) return
    isDraggingHistoryRef.current = true
    dragStartYRef.current = e.clientY
    dragStartScrollTopRef.current = el.scrollTop
    el.classList.add('dragging')
  }

  const onHistoryMouseMove = (e) => {
    if (!isDraggingHistoryRef.current) return
    const el = historyPanelRef.current
    if (!el) return
    const deltaY = e.clientY - dragStartYRef.current
    el.scrollTop = dragStartScrollTopRef.current - deltaY
  }

  const endHistoryDrag = () => {
    if (!isDraggingHistoryRef.current) return
    isDraggingHistoryRef.current = false
    historyPanelRef.current?.classList.remove('dragging')
  }

  // Load custom templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('customTemplates')
    if (savedTemplates) {
      setCustomTemplates(JSON.parse(savedTemplates))
    }
  }, [])

  // Backend health check on component mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        setBackendStatus('checking')
        await api.healthCheck()
        setBackendStatus('connected')
        console.log('✅ Backend is running and accessible')
      } catch (error) {
        setBackendStatus('disconnected')
        console.warn('⚠️ Backend health check failed:', error.message)
        console.log('Make sure your backend server is running on http://localhost:3001')
      }
    }

    checkBackendHealth()
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarCollapsed(!sidebarCollapsed)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault()
        setRightSidebarCollapsed(!rightSidebarCollapsed)
      }
      if (e.key === 'Escape') {
        setShowModelSelector(false)
      }
    }

    const handleClickOutside = (e) => {
      if (showModelSelector && !e.target.closest('.model-selector-container')) {
        setShowModelSelector(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleClickOutside)
    }
  }, [sidebarCollapsed, rightSidebarCollapsed, showModelSelector])

  const detectBestModel = (question) => {
    const lowerQuestion = question.toLowerCase()
    
    if (lowerQuestion.includes('code') || lowerQuestion.includes('programming') || 
        lowerQuestion.includes('javascript') || lowerQuestion.includes('python') ||
        lowerQuestion.includes('react') || lowerQuestion.includes('api')) {
      return aiModels.find(m => m.id === 'anthropic/claude-3.5-sonnet') || aiModels[1]
    }
    
    if (lowerQuestion.includes('calculate') || lowerQuestion.includes('math') ||
        lowerQuestion.includes('equation') || lowerQuestion.includes('solve')) {
      return aiModels.find(m => m.id === 'openai/gpt-4o') || aiModels[0]
    }
    
    if (lowerQuestion.includes('latest') || lowerQuestion.includes('current') ||
        lowerQuestion.includes('news') || lowerQuestion.includes('research')) {
      return aiModels.find(m => m.id === 'meta-llama/llama-3-70b-instruct') || aiModels[2]
    }
    
    if (lowerQuestion.includes('write') || lowerQuestion.includes('story') ||
        lowerQuestion.includes('creative') || lowerQuestion.includes('poem')) {
      return aiModels.find(m => m.id === 'google/gemini-pro-1.5') || aiModels[3]
    }
    
    return aiModels[0]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    }

    const modelToUse = mode === 'auto' ? detectBestModel(input) : selectedModel
    const messageText = input

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      console.log('Sending message to backend:', {
        message: messageText,
        model: modelToUse.id,
        mode: mode
      })

      const data = await api.chat(messageText, modelToUse.id, mode)
      
      const aiMessage = {
        id: Date.now() + 1,
        text: data.response || data.message || 'Sorry, I encountered an error processing your request.',
        sender: 'ai',
        model: modelToUse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
      console.log('Received response:', data)
    } catch (error) {
      console.error('Chat API Error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        text: `Error: ${error.message || 'Failed to connect to backend. Please check if the server is running on http://localhost:3001'}`,
        sender: 'ai',
        model: modelToUse,
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Create a mini snippet card from current input (max 10)
  const addSnippetFromInput = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setSnippets(prev => {
      if (prev.length >= 10) return prev
      return [...prev, { id: Date.now(), text: trimmed }]
    })
    setInput('')
  }

  const removeSnippet = (id) => {
    setSnippets(prev => prev.filter(s => s.id !== id))
  }

  const createNewChat = () => {
    const newSession = {
      id: Date.now(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date()
    }
    setChatSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    setMessages([])
  }

  const switchToSession = (sessionId) => {
    const session = chatSessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages)
    }
  }

  const updateSessionTitle = (sessionId, newTitle) => {
    setChatSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, title: newTitle }
        : session
    ))
  }

  const deleteSession = (sessionId) => {
    setChatSessions(prev => {
      const remaining = prev.filter(s => s.id !== sessionId)
      // If we deleted the current session, switch to first remaining or create a new one
      if (sessionId === currentSessionId) {
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[0].id)
          setMessages(remaining[0].messages)
        } else {
          const fresh = { id: Date.now(), title: 'New Chat', messages: [], timestamp: new Date() }
          setMessages([])
          setCurrentSessionId(fresh.id)
          return [fresh]
        }
      }
      return remaining
    })
  }

  const saveCustomTemplate = () => {
    if (!templateForm.name.trim()) {
      alert('Please enter a template name')
      return
    }

    const newTemplate = {
      id: Date.now(),
      ...templateForm,
      createdAt: new Date()
    }

    const updatedTemplates = [...customTemplates, newTemplate]
    setCustomTemplates(updatedTemplates)
    localStorage.setItem('customTemplates', JSON.stringify(updatedTemplates))
    
    setTemplateForm({
      name: '', 
      persona: '', 
      context: '', 
      instruction: '', 
      format: 'paragraph', 
      tone: 'professional', 
      inputData: '', 
      deeplyThinkAbout: '', 
      warning: '', 
      askMe: ''
    })
    setShowCreateTemplate(false)
  }

  const deleteCustomTemplate = (templateId) => {
    const updatedTemplates = customTemplates.filter(t => t.id !== templateId)
    setCustomTemplates(updatedTemplates)
    localStorage.setItem('customTemplates', JSON.stringify(updatedTemplates))
  }

  const useCustomTemplate = (template) => {
    let prompt = ''
    
    if (template.persona || template.actAs) {
      prompt += `Act as: ${template.persona || template.actAs}\n\n`
    }
    
    if (template.context) {
      prompt += `Context: ${template.context}\n\n`
    }
    
    if (template.instruction) {
      prompt += `Task: ${template.instruction}\n\n`
    }
    
    if (template.format) {
      prompt += `Format: ${template.format}\n\n`
    }
    
    if (template.tone) {
      prompt += `Tone: ${template.tone}\n\n`
    }
    
    if (template.inputData) {
      prompt += `Reference Data: ${template.inputData}\n\n`
    }
    
    if (template.deeplyThinkAbout) {
      prompt += `Deeply think about: ${template.deeplyThinkAbout}\n\n`
    }
    
    if (template.warning) {
      prompt += `Warning/Restrictions: ${template.warning}\n\n`
    }
    
    if (template.askMe) {
      prompt += `Ask me: ${template.askMe}\n\n`
    }
    
    prompt += '[Your specific question/request here]'
    
    setInput(prompt)
  }

  useEffect(() => {
    setChatSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { ...session, messages, timestamp: new Date() }
        : session
    ))
  }, [messages, currentSessionId])

  // Prompt Generator Functions
  const generateImprovedPrompt = async () => {
    if (!promptGeneratorInput.trim()) return

    setIsGeneratingPrompt(true)
    setGeneratedPromptResult(null)

    try {
      console.log('Generating improved prompt:', promptGeneratorInput)

      // Build comprehensive input with code and folder structure
      let fullInput = promptGeneratorInput
      
      if (codeInput.trim()) {
        fullInput += `\n\nCode:\n${codeInput}`
      }
      
      if (folderStructure.trim()) {
        fullInput += `\n\nFolder Structure:\n${folderStructure}`
      }

      // For now, use the test endpoint since we don't have auth
      const response = await fetch('http://localhost:3001/api/prompt-generator-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: fullInput,
          category: promptGeneratorCategory,
          preferredTone: promptGeneratorTone
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      setGeneratedPromptResult({
        generatedPrompt: data.result.improved,
        category: data.result.category,
        confidence: data.result.confidence,
        improvements: data.result.improvements
      })

      // Set the final prompt for display
      setFinalPrompt(data.result.improved)
      setShowPreview(true)

      console.log('Prompt generated successfully:', data)

    } catch (error) {
      console.error('Prompt generation error:', error)
      alert(`Failed to generate prompt: ${error.message}`)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  // Save current input/final prompt as a Project Context item
  const setAsProjectContext = () => {
    const text = finalPrompt?.trim() || promptGeneratorInput.trim()
    if (!text) return
    if (projectContexts.length >= 3) {
      alert('You can only set up to 3 project contexts.')
      return
    }
    const item = {
      id: Date.now(),
      title: `My project ${projectContexts.length + 1}`,
      content: text,
      createdAt: new Date()
    }
    setProjectContexts(prev => [item, ...prev])
  }

  const deleteProjectContext = (id) => {
    setProjectContexts(prev => prev.filter(p => p.id !== id))
  }

  const startRenameContext = (ctx) => {
    setRenamingContextId(ctx.id)
    setRenameText(ctx.title)
  }

  const saveRenameContext = () => {
    if (!renameText.trim()) { setRenamingContextId(null); return }
    setProjectContexts(prev => prev.map(p => p.id === renamingContextId ? { ...p, title: renameText.trim() } : p))
    setRenamingContextId(null)
    setRenameText('')
  }

  const saveGeneratedAsTemplate = () => {
    if (!generatedPromptResult) return

    const templateName = prompt('Enter template name:', `Generated Template - ${generatedPromptResult.category}`)
    if (!templateName) return

    const newTemplate = {
      id: Date.now(),
      name: templateName,
      actAs: 'AI Assistant',
      context: `Generated from: "${promptGeneratorInput}"`,
      deeplyThinkAbout: generatedPromptResult.improvements?.join(', ') || 'Quality and accuracy',
      warning: 'Follow the generated structure',
      askMe: 'What specific details do you need?',
      createdAt: new Date()
    }

    const updatedTemplates = [...customTemplates, newTemplate]
    setCustomTemplates(updatedTemplates)
    localStorage.setItem('customTemplates', JSON.stringify(updatedTemplates))
    
    alert('Template saved successfully!')
    setGeneratedPromptResult(null)
    setPromptGeneratorInput('')
  } 
 return (
    <div className="w-full h-screen flex overflow-hidden">
      {/* Left Sidebar - Icon rail when collapsed */}
      {/* Left rail is fixed; center never shifts */}
      <div
        className={`${sidebarCollapsed ? 'w-16' : 'w-64'} citrus-surface no-border flex flex-col transition-all duration-500 ease-in-out flex-shrink-0 h-full fixed left-0 top-0 z-20`}
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => { if (!sidebarCollapsed) setSidebarCollapsed(true) }}
      >
        {/* Top logo area */}
        <div className="flex items-center justify-center h-16 flex-shrink-0">
          {sidebarCollapsed ? (
            <img src={logoIcon} alt="Logo" className="w-7 h-7" />
          ) : (
            <img src={citrusLogo} alt="Citruslab" className="h-10" />
          )}
        </div>

        {/* Middle stack */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-3 py-2">
              {/* New Chat icon under logo */}
              <button className="rail-icon citrus-button rounded-lg" title="New chat" onClick={createNewChat}>
                <img src={newChatIcon} alt="New" className="w-5 h-5" />
              </button>
              {/* History icon */}
              <button className="rail-icon citrus-button rounded-lg" title="History">
                <img src={historyIcon} alt="History" className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden px-2">
              {/* New Chat action placed above History when expanded */}
              <div className="px-1 pb-3">
                <button
                  onClick={createNewChat}
                  className="w-full flex items-center justify-start space-x-2 citrus-button rounded-lg py-2 px-3 transition-all text-sm"
                >
                  <img src={newChatIcon} className="w-4 h-4" alt="New" />
                  <span>New Chat</span>
                </button>
              </div>

              {/* History panel (header moved inside) */}
              <div
                ref={historyPanelRef}
                className="history-panel min-h-[18rem] max-h-[60vh] overflow-y-auto cursor-default select-none"
                onMouseDown={onHistoryMouseDown}
                onMouseMove={onHistoryMouseMove}
                onMouseUp={endHistoryDrag}
                onMouseLeave={endHistoryDrag}
              >
                <div className="sticky top-0 z-10 bg-black/20 px-2 py-2 border-b border-[rgba(215,255,47,0.25)]">
                  <div className="flex items-center space-x-2 text-[13px] text-gray-300">
                    <img src={historyIcon} className="w-4 h-4" alt="History" />
                    <span>History Chats</span>
                  </div>
                </div>
                <div className="p-2">
                  <ChatHistory 
                    sessions={chatSessions}
                    currentSessionId={currentSessionId}
                    onSessionSelect={switchToSession}
                    onNewChat={createNewChat}
                    onUpdateTitle={updateSessionTitle}
                    onDeleteSession={deleteSession}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom area - only profile in both states when expanded; new chat moved above history */}
        <div className="p-3 flex-shrink-0">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <button className="rail-icon citrus-button rounded-full overflow-hidden" title="Profile"></button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button className="w-full flex items-center justify-start space-x-2 citrus-button rounded-full py-2 px-3">
                <span className="w-6 h-6 bg-gray-500 rounded-full inline-block" />
                <span className="text-sm">Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem', marginRight: rightSidebarCollapsed ? '4rem' : '20rem' }}
      >
        {/* Unified container: navbar + chat with neon margin box */}
        <div className="w-full max-w-7xl mx-auto my-4 citrus-neon-border-strong rounded-3xl p-4 flex-1 flex flex-col relative z-10">
        {/* Top Header - Centered pill with Share */}
        <header className="px-6 pt-1 flex-shrink-0 z-30 relative -mx-6">
          <div>
            <div className="citrus-header-bar w-full py-2 rounded-none -mx-4">
              <div className="w-full flex items-center justify-between px-4">
              {/* Left: dynamic title placeholder (empty until chat starts) */}
              <div className="flex items-center min-h-[28px]">
                <h1 className="text-white/90 text-sm">
                  {(() => {
                    const firstUserMsg = messages.find(m => m.sender === 'user')
                    if (!firstUserMsg) return ''
                    const text = firstUserMsg.text || ''
                    return text.length > 70 ? text.slice(0, 70) + '…' : text
                  })()}
                </h1>
              </div>
              {/* Right: Share and connection indicator only */}
              <div className="flex items-center space-x-2 py-1">
                <div className="flex items-center space-x-2 py-1">
                  <div className={`w-2 h-2 rounded-full ${
                    backendStatus === 'connected' ? 'bg-green-500' :
                    backendStatus === 'disconnected' ? 'bg-red-500' :
                    'bg-yellow-500 animate-pulse'
                  }`}></div>
                  <span className={`text-xs ${
                    backendStatus === 'connected' ? 'text-green-400' :
                    backendStatus === 'disconnected' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {backendStatus === 'connected' ? 'Connected' :
                     backendStatus === 'disconnected' ? 'Offline' :
                     'Connecting...'}
                  </span>
                </div>
                <button className="px-3 py-1 citrus-accent-bg text-black rounded-full text-sm">Share</button>
              </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex min-h-0 items-stretch">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Messages - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-300 mt-6">
                    {showProjectContext ? (
                      // Prompt Generator Interface
                      <div className="mx-auto w-full max-w-4xl text-left">
                        <h2 className="text-4xl font-semibold mb-8 text-white">Give Project <span className="citrus-accent-text">Context</span>.</h2>
                        
                        {/* Final Prompt Display */}
                        {finalPrompt && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Generated your final prompt.
                              </h3>
                              <button
                                onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                                className="px-3 py-1 citrus-accent-bg text-black text-sm rounded-lg hover:brightness-110"
                              >
                                {isPreviewExpanded ? 'Minimize' : 'Expand'}
                              </button>
                            </div>
                            
                            <div className={`final-prompt-display transition-all duration-300 ${
                              isPreviewExpanded ? 'preview-expanded' : ''
                            }`}>
                              <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-white font-medium">My final prompt</h4>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setInput(finalPrompt)}
                                      className="px-3 py-1 citrus-accent-bg text-black text-sm rounded-lg hover:brightness-110"
                                    >
                                      Use in Chat
                                    </button>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(finalPrompt)}
                                      className="px-3 py-1 citrus-button text-sm rounded-lg hover:brightness-110"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                                <div className="final-prompt-content">
                                  <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{finalPrompt}</pre>
                                </div>
                                
                              </div>
                            </div>
                            
                            {isPreviewExpanded && (
                              <div 
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                                onClick={() => setIsPreviewExpanded(false)}
                              />
                            )}
                          </div>
                        )}

                        {/* Main Input Area */}
                        <div className="input-area-enhanced">
                          <div className="px-6 pt-5 pb-6">
                            <p className="text-gray-300 text-sm mb-2">Give your project context, we will remember it.</p>
                            <textarea
                              value={promptGeneratorInput}
                              onChange={(e) => setPromptGeneratorInput(e.target.value)}
                              placeholder="Describe your project in 1-3 concise paragraphs..."
                              className="w-full bg-transparent outline-none resize-y min-h-[180px] max-h-[360px] text-sm text-white placeholder-gray-400"
                            />
                            <div className="flex items-center gap-3 mt-4">
                              <button
                                type="button"
                                onClick={generateImprovedPrompt}
                                disabled={!promptGeneratorInput.trim() || isGeneratingPrompt}
                                className="px-3 py-1 rounded-full text-xs citrus-accent-bg text-black disabled:bg-gray-600"
                              >
                                {isGeneratingPrompt ? 'Generating…' : 'Improve'}
                              </button>
                              <button
                                type="button"
                                onClick={setAsProjectContext}
                                disabled={!(promptGeneratorInput.trim() || finalPrompt?.trim())}
                                className="px-3 py-1 rounded-full text-xs citrus-button"
                              >
                                Set
                              </button>
                            </div>
                          </div>
                        </div>
                        
                      </div>
                    ) : (
                    // Default Chat Interface
                    <div className="min-h-[60vh] flex flex-col items-center justify-center">
                        <h2 className="text-4xl font-semibold mb-8 text-white">What's your <span className="citrus-accent-text">idea</span> ?</h2>
                        {/* Center Chat Panel */}
                        <form onSubmit={handleSubmit} className="relative mx-auto w-full max-w-3xl text-left">
                          <div className="rounded-3xl citrus-neon-border-strong bg-black/60 relative min-h-[120px]">
                            <div className="px-6 pt-3 pb-6 flex flex-col h-full">
                              <textarea
                                value={input}
                                onChange={(e)=>setInput(e.target.value)}
                                placeholder="Describe your idea..."
                                className="w-full bg-transparent outline-none resize-none min-h-[48px] text-sm text-white placeholder-gray-400"
                              />
                              <div className="flex items-end justify-between mt-auto mb-0">
                                <div className="control-group">
                                  <button
                                    type="button"
                                    onClick={() => setShowModelSelector(true)}
                                    className="pill"
                                  >
                                    <span>✳</span>
                                    <span>Models</span>
                                  </button>
                                  <div className="segment-group">
                                    <button
                                      type="button"
                                      onClick={() => setMode('auto')}
                                      className={`segment ${mode === 'auto' ? 'segment-active' : ''}`}
                                    >
                                      Auto
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMode('manual')}
                                      className={`segment ${mode === 'manual' ? 'segment-active' : ''}`}
                                    >
                                      Manual
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={addSnippetFromInput}
                                    disabled={!input.trim() || snippets.length >= 10}
                                    className={`pill ${!input.trim() || snippets.length >= 10 ? 'pill-disabled' : 'pill-accent'}`}
                                    title="Save as mini snippet"
                                  >
                                    Save snippet
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button type="submit" disabled={!input.trim()} className="citrus-send-fab glow-ring absolute bottom-4 right-4 disabled:opacity-60" title="Send">
                            <img src={logoIcon} alt="Send" className="w-5 h-5" />
                          </button>
                        </form>

                        {/* Mini snippets grid under the main search */}
                        {snippets.length > 0 && (
                          <div className="mx-auto w-full max-w-4xl mt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {snippets.map((snip, idx) => (
                                <div key={snip.id} className="p-3 rounded-xl citrus-neon-border-strong bg-black/50 relative">
                                  <div className="text-xs text-gray-400 mb-2">snippet {idx+1}</div>
                                  <div className="max-h-28 overflow-hidden text-sm text-gray-200 whitespace-pre-wrap">
                                    {snip.text}
                                  </div>
                                  <div className="mt-3 flex items-center justify-between">
                                    <button
                                      className="px-2 py-1 text-xs citrus-button rounded-lg"
                                      onClick={() => setPreviewSnippetIndex(idx)}
                                    >
                                      Preview
                                    </button>
                                    <div className="flex items-center gap-2">
                                      <button
                                        className="px-2 py-1 text-xs citrus-accent-bg text-black rounded-lg"
                                        onClick={() => setInput(prev => `${prev ? prev + '\n\n' : ''}${snip.text}`)}
                                      >
                                        Paste
                                      </button>
                                      <button
                                        className="px-2 py-1 text-xs text-red-400 citrus-button rounded-lg"
                                        onClick={() => removeSnippet(snip.id)}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="citrus-surface rounded-2xl p-4 max-w-xs">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-gray-400 text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>       
     {/* Input Form - Fixed at Bottom (hidden on empty state) */}
            {messages.length > 0 && (
            <div className="border-t citrus-border px-4 py-3 flex-shrink-0 bg-transparent">
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-300 text-sm">Mode:</span>
                    <div className="flex bg-black/30 rounded-lg p-1 glow-ring">
                      <button
                        onClick={() => setMode('manual')}
                        className={`px-3 py-1 rounded text-sm transition-all ${
                          mode === 'manual' 
                            ? 'citrus-accent-bg text-black font-medium' 
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        Manual
                      </button>
                      <button
                        onClick={() => setMode('auto')}
                        className={`px-3 py-1 rounded text-sm transition-all ${
                          mode === 'auto' 
                            ? 'citrus-accent-bg text-black font-medium' 
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                  
                  {mode === 'manual' && (
                    <div className="flex items-center space-x-2">
                      <div className="relative model-selector-container">
                        <button
                          onClick={() => setShowModelSelector(!showModelSelector)}
                          className="flex items-center space-x-2 text-sm bg-black/30 hover:bg-black/40 px-3 py-2 rounded-lg transition-all glow-ring"
                        >
                          <span className="text-gray-400">Model:</span>
                          <span className="text-white font-medium">{selectedModel.name}</span>
                          <span className="text-lg">{selectedModel.icon}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {mode === 'auto' && input && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-400">Auto-selected:</span>
                      <span className="text-blue-400 font-medium">{detectBestModel(input).name}</span>
                      <span className="text-lg">{detectBestModel(input).icon}</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={mode === 'auto' ? "Ask anything and I'll choose the best AI model..." : `Message ${selectedModel.name}...`}
                      className="w-full bg-black/35 border citrus-border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--citrus-accent)]/30 focus:border-transparent glow-ring"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-2 citrus-accent-bg hover:brightness-110 disabled:bg-gray-600 text-black rounded-xl font-medium transition-all disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
            )}
          </div>

          {/* Right Panel - Simplified with Project Context, Prompt Generator, and Templates */}
          {!rightSidebarCollapsed && (
            <div className="w-80 no-border flex flex-col transition-all duration-500 ease-in-out h-screen fixed top-0 right-0 z-20 bg-[#121318]"
                 onMouseLeave={() => setRightSidebarCollapsed(true)}>
              {/* Right Sidebar Content - simplified headerless */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <div className="space-y-4 flex flex-col h-full">
                  {/* Prompt Generator button */}
                  <div className="bg-black/30 rounded-lg border citrus-border glow-ring">
                    <button
                      onClick={() => { setShowPromptGenerator(true); setShowProjectContext(false) }}
                      className={`w-full p-4 rounded-lg transition-all flex items-center justify-center space-x-2 hover:brightness-110 ${showPromptGenerator ? 'citrus-accent-bg text-black' : 'bg-transparent text-[var(--citrus-accent)]'}`}
                    >
                      <img src={promptIcon} className="w-5 h-5" alt="Prompt Generator" />
                      <span className="font-medium">Prompt Generator</span>
                    </button>
                  </div>

                  {/* Project Context button */}
                  <div className="bg-black/30 rounded-lg border citrus-border glow-ring">
                    <button
                      onClick={() => { setShowProjectContext(true); setShowPromptGenerator(false) }}
                      className={`w-full p-4 rounded-lg transition-all flex items-center justify-center space-x-2 hover:brightness-110 ${showProjectContext ? 'citrus-accent-bg text-black' : 'bg-transparent text-[var(--citrus-accent)]'}`}
                    >
                      <img src={projectIcon} className="w-5 h-5" alt="Project Context" />
                      <span className="font-medium">Project Context</span>
                    </button>
                  </div>

                  {/* Project Contexts menu (visible when items exist) */}
                  {projectContexts.length > 0 && (
                    <div className="bg-black/30 rounded-lg border citrus-border glow-ring">
                      <div className="p-3 border-b border-gray-600 flex items-center justify-between">
                        <h3 className="text-white font-medium text-sm flex items-center space-x-2">
                          <img src={projectIcon} className="w-4 h-4" alt="Project Context" />
                          <span>Project Context</span>
                        </h3>
                        <button onClick={() => setRightSidebarCollapsed(true)} className="text-gray-400 hover:text-gray-200 text-sm">Close</button>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                        {projectContexts.map((ctx) => (
                          <div key={ctx.id} className="p-2 rounded bg-black/30 border border-[rgba(215,255,47,0.35)]">
                            {renamingContextId === ctx.id ? (
                              <div className="flex items-center gap-2">
                                <input value={renameText} onChange={(e)=>setRenameText(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') saveRenameContext(); if(e.key==='Escape'){setRenamingContextId(null)} }} className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs" />
                                <button onClick={saveRenameContext} className="text-green-400 text-xs">Save</button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs text-white truncate">{ctx.title}</div>
                                <div className="flex items-center gap-2">
                                  <button className="text-blue-400 text-xs" onClick={()=>startRenameContext(ctx)}>Rename</button>
                                  <button className="text-red-400 text-xs" onClick={()=>deleteProjectContext(ctx.id)}>Delete</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Templates Section (pinned to bottom) */}
                  <div className="bg-black/30 rounded-lg border citrus-border glow-ring mt-auto">
                    <div className="p-3 border-b border-gray-600">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium flex items-center space-x-2">
                          <img src={templatesIcon} className="w-4 h-4" alt="Templates" />
                          <span>Templates</span>
                        </h3>
                        <button
                          onClick={() => setShowCreateTemplate(!showCreateTemplate)}
                          className="px-2 py-1 citrus-accent-bg text-black text-xs rounded transition-all hover:brightness-110"
                        >
                          {showCreateTemplate ? 'Cancel' : 'New'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      {showCreateTemplate && (
                        <div className="mb-4 p-3 bg-black/30 rounded-lg max-h-96 overflow-y-auto glow-ring">
                          <h4 className="text-white font-medium mb-3 text-sm">Create Custom Template</h4>
                          <div className="space-y-3">
                            {/* Template Name */}
                            <div>
                              <label className="text-gray-300 text-xs block mb-1">Template Name *</label>
                              <input
                                type="text"
                                placeholder="e.g., Code Review Assistant"
                                value={templateForm.name}
                                onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                                className="w-full bg-black/30 border citrus-border rounded px-2 py-1 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--citrus-accent)]/30 text-xs"
                              />
                            </div>

                            {/* Persona */}
                            <div>
                              <label className="text-gray-300 text-xs block mb-1">Persona (Act as)</label>
                              <input
                                type="text"
                                placeholder="e.g., Expert Software Engineer"
                                value={templateForm.persona}
                                onChange={(e) => setTemplateForm({...templateForm, persona: e.target.value})}
                                className="w-full bg-black/30 border citrus-border rounded px-2 py-1 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--citrus-accent)]/30 text-xs"
                              />
                            </div>

                            {/* Context */}
                            <div>
                              <label className="text-gray-300 text-xs block mb-1">Context</label>
                              <textarea
                                placeholder="Background or situation..."
                                value={templateForm.context}
                                onChange={(e) => setTemplateForm({...templateForm, context: e.target.value})}
                                className="w-full bg-black/30 border citrus-border rounded px-2 py-1 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--citrus-accent)]/30 h-12 resize-none text-xs"
                              />
                            </div>

                            {/* Instruction/Task */}
                            <div>
                              <label className="text-gray-300 text-xs block mb-1">Instruction/Task</label>
                              <input
                                type="text"
                                placeholder="e.g., Analyze, Generate, Write, Review..."
                                value={templateForm.instruction}
                                onChange={(e) => setTemplateForm({...templateForm, instruction: e.target.value})}
                                className="w-full bg-black/30 border citrus-border rounded px-2 py-1 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--citrus-accent)]/30 text-xs"
                              />
                            </div>

                            {/* Format & Tone Row */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-gray-300 text-xs block mb-1">Format</label>
                                <select
                                  value={templateForm.format}
                                  onChange={(e) => setTemplateForm({...templateForm, format: e.target.value})}
                                  className="w-full bg-black/30 border citrus-border rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-[var(--citrus-accent)]/30 text-xs"
                                >
                                  <option value="paragraph">Paragraph</option>
                                  <option value="bullet-points">Bullet Points</option>
                                  <option value="numbered-list">Numbered List</option>
                                  <option value="table">Table</option>
                                  <option value="code">Code</option>
                                  <option value="json">JSON</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-gray-300 text-xs block mb-1">Tone</label>
                                <select
                                  value={templateForm.tone}
                                  onChange={(e) => setTemplateForm({...templateForm, tone: e.target.value})}
                                  className="w-full bg-black/30 border citrus-border rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-[var(--citrus-accent)]/30 text-xs"
                                >
                                  <option value="professional">Professional</option>
                                  <option value="formal">Formal</option>
                                  <option value="casual">Casual</option>
                                  <option value="friendly">Friendly</option>
                                  <option value="technical">Technical</option>
                                  <option value="creative">Creative</option>
                                </select>
                              </div>
                            </div>

                            {/* Input Data */}
                            <div>
                              <label className="text-gray-300 text-xs block mb-1">Reference Data</label>
                              <textarea
                                placeholder="Reference information, examples, or data..."
                                value={templateForm.inputData}
                                onChange={(e) => setTemplateForm({...templateForm, inputData: e.target.value})}
                                className="w-full bg-black/30 border citrus-border rounded px-2 py-1 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--citrus-accent)]/30 h-12 resize-none text-xs"
                              />
                            </div>

                            {/* Deeply Think About */}
                            <div>
                              <label className="text-gray-300 text-xs block mb-1">Deeply Think About</label>
                              <textarea
                                placeholder="Specific focus areas, considerations..."
                                value={templateForm.deeplyThinkAbout}
                                onChange={(e) => setTemplateForm({...templateForm, deeplyThinkAbout: e.target.value})}
                                className="w-full bg-black/30 border citrus-border rounded px-2 py-1 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--citrus-accent)]/30 h-12 resize-none text-xs"
                              />
                            </div>

                            {/* Warning */}
                            <div>
                              <label className="text-gray-300 text-xs block mb-1">Warning/Restrictions</label>
                              <textarea
                                placeholder="Things to avoid, restrictions, cautions..."
                                value={templateForm.warning}
                                onChange={(e) => setTemplateForm({...templateForm, warning: e.target.value})}
                                className="w-full bg-black/30 border citrus-border rounded px-2 py-1 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--citrus-accent)]/30 h-12 resize-none text-xs"
                              />
                            </div>

                            {/* Ask Me */}
                            <div>
                              <label className="text-gray-300 text-xs block mb-1">Ask Me</label>
                              <textarea
                                placeholder="Additional details AI should request..."
                                value={templateForm.askMe}
                                onChange={(e) => setTemplateForm({...templateForm, askMe: e.target.value})}
                                className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 h-12 resize-none text-xs"
                              />
                            </div>

                            <button
                              onClick={saveCustomTemplate}
                              className="w-full citrus-accent-bg text-black hover:brightness-110 py-2 rounded transition-all text-xs font-medium"
                            >
                              Save Template
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <h4 className="text-white font-medium text-sm">Quick Templates</h4>
                        
                        <div className="space-y-1">
                          <button
                            onClick={() => useCustomTemplate({
                              persona: 'Expert Software Engineer',
                              context: 'Code review for production applications',
                              instruction: 'Analyze and review the provided code',
                              format: 'bullet-points',
                              tone: 'professional',
                              deeplyThinkAbout: 'Security vulnerabilities, performance bottlenecks, code maintainability, best practices',
                              warning: 'Do not suggest breaking changes without proper explanation and migration path',
                              askMe: 'What specific code needs review? What programming language? Any particular concerns?'
                            })}
                            className="w-full p-2 template-button rounded text-left transition-all"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">💻</span>
                              <div>
                                <h5 className="text-white font-medium text-xs">Code Review Assistant</h5>
                                <p className="text-gray-400 text-xs">Professional code analysis</p>
                              </div>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => useCustomTemplate({
                              persona: 'Creative Writing Mentor',
                              context: 'Helping with creative writing projects and storytelling',
                              instruction: 'Generate creative content based on the requirements',
                              format: 'paragraph',
                              tone: 'creative',
                              deeplyThinkAbout: 'Character development, plot structure, narrative flow, emotional impact',
                              warning: 'Keep content appropriate for all audiences, avoid controversial topics',
                              askMe: 'What type of creative writing? Genre? Target audience? Specific themes or elements?'
                            })}
                            className="w-full p-2 template-button rounded text-left transition-all"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">✍️</span>
                              <div>
                                <h5 className="text-white font-medium text-xs">Creative Writer</h5>
                                <p className="text-gray-400 text-xs">Storytelling & content</p>
                              </div>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => useCustomTemplate({
                              persona: 'Senior Business Analyst',
                              context: 'Business strategy and market analysis consultation',
                              instruction: 'Analyze the business scenario and provide strategic recommendations',
                              format: 'numbered-list',
                              tone: 'professional',
                              inputData: 'Market research, financial data, competitor analysis',
                              deeplyThinkAbout: 'Market trends, ROI calculations, risk assessment, implementation feasibility',
                              warning: 'Base recommendations only on provided data, avoid speculation without evidence',
                              askMe: 'What business challenge are you facing? Industry? Company size? Specific goals?'
                            })}
                            className="w-full p-2 template-button rounded text-left transition-all"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">📊</span>
                              <div>
                                <h5 className="text-white font-medium text-xs">Business Analyst</h5>
                                <p className="text-gray-400 text-xs">Strategic insights</p>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => useCustomTemplate({
                              persona: 'Technical Documentation Specialist',
                              context: 'Creating clear and comprehensive technical documentation',
                              instruction: 'Write technical documentation for the specified topic',
                              format: 'numbered-list',
                              tone: 'technical',
                              deeplyThinkAbout: 'Clarity for different skill levels, step-by-step instructions, troubleshooting scenarios',
                              warning: 'Ensure accuracy of technical details, include version information where relevant',
                              askMe: 'What needs documentation? Target audience skill level? Specific format requirements?'
                            })}
                            className="w-full p-2 template-button rounded text-left transition-all"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">📚</span>
                              <div>
                                <h5 className="text-white font-medium text-xs">Tech Writer</h5>
                                <p className="text-gray-400 text-xs">Documentation expert</p>
                              </div>
                            </div>
                          </button>
                        </div>
                        
                        {customTemplates.length > 0 && (
                          <>
                            <h4 className="text-white font-medium mt-3 text-sm">Your Templates</h4>
                            <div className="space-y-1">
                              {customTemplates.map((template) => (
                                <div key={template.id} className="p-2 bg-black/30 rounded glow-ring">
                                  <div className="flex items-center justify-between mb-1">
                                    <h5 className="text-white font-medium text-xs">{template.name}</h5>
                                    <button
                                      onClick={() => deleteCustomTemplate(template.id)}
                                      className="text-red-400 hover:text-red-300 text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => useCustomTemplate(template)}
                                    className="w-full text-left text-blue-400 hover:text-blue-300 text-xs"
                                  >
                                    Use Template
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {rightSidebarCollapsed && (
            <div
              className="w-16 no-border flex flex-col items-center justify-between py-2 fixed top-0 right-0 h-screen z-20 bg-[#121318]"
              onMouseEnter={() => setRightSidebarCollapsed(false)}
            >
              {/* Top icons: Project Context and Prompt Generator */}
              <div className="flex flex-col items-center gap-3 mt-2">
                <button 
                  className="rail-icon citrus-button rounded-lg" 
                  title="Project Context"
                  onClick={() => { setShowProjectContext(true); setShowPromptGenerator(false); setRightSidebarCollapsed(false); }}
                >
                  <img src={projectIcon} className="w-5 h-5" alt="Project Context" />
                </button>
                <button 
                  className="rail-icon citrus-button rounded-lg" 
                  title="Prompt Generator"
                  onClick={() => { setShowPromptGenerator(true); setShowProjectContext(false); setRightSidebarCollapsed(false); }}
                >
                  <img src={promptIcon} className="w-5 h-5" alt="Prompt Generator" />
                </button>
              </div>
              {/* Bottom icon: Templates */}
              <div className="flex flex-col items-center gap-3 mb-2">
                <button 
                  className="rail-icon citrus-button rounded-lg" 
                  title="Templates"
                  onClick={() => setRightSidebarCollapsed(false)}
                >
                  <img src={templatesIcon} className="w-5 h-5" alt="Templates" />
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>  
      {/* Snippet preview modal */}
      {previewSnippetIndex !== null && snippets[previewSnippetIndex] && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4" onClick={() => setPreviewSnippetIndex(null)}>
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl z-[9999] w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
            <div className="p-3 border-b border-gray-600 flex items-center justify-between">
              <h3 className="text-white font-medium">Snippet Preview</h3>
              <button className="text-gray-300 citrus-button rounded-lg px-2 py-1" onClick={() => setPreviewSnippetIndex(null)}>Close</button>
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-200">{snippets[previewSnippetIndex].text}</pre>
            </div>
          </div>
        </div>
      )}
    {/* Model Selector Modal */}
      {showModelSelector && (
        <div className="fixed inset-0 bg-black/30 z-[9998] flex items-center justify-center p-4" onClick={() => setShowModelSelector(false)}>
          <div 
            className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl z-[9999] w-full max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-gray-600">
              <h3 className="text-white font-medium">Select AI Model</h3>
            </div>
            <div className="p-2">
              {aiModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model)
                    setShowModelSelector(false)
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-all border mb-2 ${
                    selectedModel.id === model.id
                      ? 'bg-blue-600/20 border-blue-500/50 ring-1 ring-blue-500/30'
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{model.icon}</span>
                      <h4 className="font-medium text-white text-sm">{model.name}</h4>
                    </div>
                    <div className="flex items-center space-x-1">
                      {model.capabilities.map((cap, index) => (
                        <span
                          key={index}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cap.color }}
                          title={cap.name}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                    {model.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500">
                        Speed: <span className="text-gray-400">{model.speed}</span>
                      </span>
                      <span className="text-gray-500">
                        Cost: <span className="text-gray-400">{model.cost}</span>
                      </span>
                    </div>
                    {selectedModel.id === model.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIChat