import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import ChatMessage from './ChatMessage'
import ChatHistory from './ChatHistory'
import SearchBar from './SearchBar'
import ShareModal from './ShareModal'
import ProfileModal from './ProfileModal'
import CollaborationPanel from './CollaborationPanelCompact'
import citrusLogo from '../assets/citrus-logo.png'
import logoIcon from '../assets/logo-icon.png'
import newChatIcon from '../assets/new-chat-icon.png'
import historyIcon from '../assets/history-icon.png'
import promptIcon from '../assets/prompt-generator-icon.png'
import projectIcon from '../assets/project-context-icon.png'
import templatesIcon from '../assets/templates-icon.png'
import ApiTest from './ApiTest'
import PromptGenerator from './PromptGenerator'
import { aiModels } from '../data/models'
import { api } from '../config/api'
import { toast } from 'react-toastify'

const AIChat = ({ themeWithImage, onToggleTheme }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState(aiModels.find(m => m.name?.includes('Claude')) || aiModels[1] || aiModels[0])
  const [mode, setMode] = useState('manual')
  const [chatMode, setChatMode] = useState('normal') // 'normal' or 'engineer'
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true)
  
  // Mobile sidebar states
  const [mobileLeftSidebarOpen, setMobileLeftSidebarOpen] = useState(false)
  const [mobileRightSidebarOpen, setMobileRightSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showMobileModelSelector, setShowMobileModelSelector] = useState(false)
  
  // Debouncing refs for smooth sidebar animations
  const leftSidebarTimeoutRef = useRef(null)
  const rightSidebarTimeoutRef = useRef(null)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [customTemplates, setCustomTemplates] = useState([])
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const [previewingTemplate, setPreviewingTemplate] = useState(null)
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
    askMe: '',
    icon: '🤖'
  })
  // Prompt Generator / Project Context states
  const [showPromptGenerator, setShowPromptGenerator] = useState(false)
  const [showProjectContext, setShowProjectContext] = useState(false)
  const [promptGeneratorInput, setPromptGeneratorInput] = useState('')
  const [promptGeneratorCategory, setPromptGeneratorCategory] = useState('')
  const [promptGeneratorTone, setPromptGeneratorTone] = useState('')
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [generatedPromptResult, setGeneratedPromptResult] = useState(null)
  const [promptGeneratorResetFn, setPromptGeneratorResetFn] = useState(null)
  const [promptGeneratorState, setPromptGeneratorState] = useState({
    generatedPrompts: [],
    snippets: [],
    input: '',
    isResetting: false
  })
  // Enhanced Project Context states
  const [projectContexts, setProjectContexts] = useState([])
  const [renamingContextId, setRenamingContextId] = useState(null)
  const [renameText, setRenameText] = useState('')
  const [editingContextId, setEditingContextId] = useState(null)
  const [editingContextData, setEditingContextData] = useState(null)
  const [showProjectContextEditor, setShowProjectContextEditor] = useState(false)
  const [currentContextBoxes, setCurrentContextBoxes] = useState([])
  const [nextBoxId, setNextBoxId] = useState(1)
  const [showBoxPreview, setShowBoxPreview] = useState(false)
  const [previewingBox, setPreviewingBox] = useState(null)
  const [renamingBoxId, setRenamingBoxId] = useState(null)
  const [renameBoxText, setRenameBoxText] = useState('')
  const [renamingMainTitle, setRenamingMainTitle] = useState(false)
  const [mainTitleText, setMainTitleText] = useState('')

  // New states for enhanced prompt generator
  const [codeInput, setCodeInput] = useState('')
  const [folderStructure, setFolderStructure] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false)
  const [finalPrompt, setFinalPrompt] = useState('')
  // Mini snippet boxes (Claude-like) under main search
  const [snippets, setSnippets] = useState([])
  const [previewSnippetIndex, setPreviewSnippetIndex] = useState(null)
  // Generate initial session with UUID
  const initialSessionId = uuidv4()
  const [chatSessions, setChatSessions] = useState([
    { id: initialSessionId, title: 'New Chat', messages: [], timestamp: new Date() }
  ])
  const [currentSessionId, setCurrentSessionId] = useState(initialSessionId)
  const [backendStatus, setBackendStatus] = useState('checking')
  const messagesEndRef = useRef(null)
  const historyPanelRef = useRef(null)
  const isDraggingHistoryRef = useRef(false)
  const dragStartYRef = useRef(0)
  const dragStartScrollTopRef = useRef(0)
  const [isRenamingTitle, setIsRenamingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [snippetTrayHeight, setSnippetTrayHeight] = useState(0)
  const snippetTrayRef = useRef(null)



  // Collaboration states
  const [showShareModal, setShowShareModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false)
  const [currentUser, setCurrentUser] = useState({
    name: 'Guest User',
    email: 'guest@citruslab.dev',
    role: 'user'
  })
  const collaborationButtonRef = useRef(null)
  const modelButtonRef = useRef(null)
  const [modelSelectorPosition, setModelSelectorPosition] = useState({ top: 0, left: 0 })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Calculate model selector position relative to the Models button
  const calculateModelSelectorPosition = () => {
    if (modelButtonRef.current) {
      const rect = modelButtonRef.current.getBoundingClientRect()
      const modalHeight = 200 // Approximate height of the modal
      const modalWidth = 240 // Smaller width (w-60 = 240px)
      const newPosition = {
        top: rect.top - modalHeight - 10, // 10px gap above the button
        left: rect.right - modalWidth // Right edge of modal aligns with right edge of button
      }
      console.log('Calculating position:', { rect, newPosition })
      setModelSelectorPosition(newPosition)
    } else {
      console.log('modelButtonRef.current is null')
    }
  }

  // Get selected model official icon
  const getSelectedModelIcon = () => {
    if (!selectedModel) return null
    
    if (selectedModel.name?.includes('ChatGPT')) {
      return (
        <div className="w-4 h-4 rounded-sm bg-white flex items-center justify-center">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142-.0852 4.783-2.7582a.7712.7712 0 0 0 .7806 0l5.8428 3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142.0852-4.7735 2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="#10A37F"/>
          </svg>
        </div>
      )
    }
    
    if (selectedModel.name?.includes('Claude')) {
      return (
        <div className="w-4 h-4 rounded-sm bg-[#CC785C] flex items-center justify-center">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="white">
            <path d="M7.5 8.25h9m-9 3h9m-9 3h6m-3 2.25h.007v.008H10.5v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
        </div>
      )
    }
    
    if (selectedModel.name?.includes('Gemini')) {
      return (
        <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
          </svg>
        </div>
      )
    }
    
    if (selectedModel.name?.includes('Deepseek')) {
      return (
        <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      )
    }
    
    if (selectedModel.name?.includes('Grok')) {
      return (
        <div className="w-4 h-4 rounded-sm bg-black flex items-center justify-center">
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>
      )
    }
    
    return (
      <div className="w-4 h-4 rounded-sm bg-gray-600 flex items-center justify-center">
        <span className="text-white text-xs">✳</span>
      </div>
    )
  }

  // Recalculate position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (showModelSelector) {
        calculateModelSelectorPosition()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showModelSelector])


  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!snippets.length) {
      setSnippetTrayHeight(0)
      return
    }
    const el = snippetTrayRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSnippetTrayHeight(el.offsetHeight || 0)
    })
    ro.observe(el)
    setSnippetTrayHeight(el.offsetHeight || 0)
    return () => ro.disconnect()
  }, [snippets])


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

  // Debounced sidebar hover handlers
  const handleLeftSidebarMouseEnter = useCallback(() => {
    // Only expand on hover for large desktop screens (>1024px)
    if (window.innerWidth <= 1024) return
    
    if (leftSidebarTimeoutRef.current) {
      clearTimeout(leftSidebarTimeoutRef.current)
    }
    setSidebarCollapsed(false)
  }, [])

  const handleLeftSidebarMouseLeave = useCallback(() => {
    // Only collapse on leave for large desktop screens (>1024px)
    if (window.innerWidth <= 1024) return
    
    if (leftSidebarTimeoutRef.current) {
      clearTimeout(leftSidebarTimeoutRef.current)
    }
    leftSidebarTimeoutRef.current = setTimeout(() => {
      setSidebarCollapsed(true)
    }, 150) // Small delay to prevent jitter
  }, [])

  const handleRightSidebarMouseEnter = useCallback(() => {
    // Only expand on hover for large desktop screens (>1024px)
    if (window.innerWidth <= 1024) return
    
    if (rightSidebarTimeoutRef.current) {
      clearTimeout(rightSidebarTimeoutRef.current)
    }
    setRightSidebarCollapsed(false)
  }, [])

  const handleRightSidebarMouseLeave = useCallback(() => {
    // Only collapse on leave for large desktop screens (>1024px)
    if (window.innerWidth <= 1024) return
    
    if (rightSidebarTimeoutRef.current) {
      clearTimeout(rightSidebarTimeoutRef.current)
    }
    rightSidebarTimeoutRef.current = setTimeout(() => {
      setRightSidebarCollapsed(true)
    }, 150) // Small delay to prevent jitter
  }, [])

  // Mobile sidebar toggle functions
  const toggleMobileLeftSidebar = useCallback(() => {
    setMobileLeftSidebarOpen(prev => !prev)
    if (mobileRightSidebarOpen) setMobileRightSidebarOpen(false)
  }, [mobileRightSidebarOpen])

  const toggleMobileRightSidebar = useCallback(() => {
    setMobileRightSidebarOpen(prev => !prev)
    if (mobileLeftSidebarOpen) setMobileLeftSidebarOpen(false)
  }, [mobileLeftSidebarOpen])

  const closeMobileSidebars = useCallback(() => {
    setMobileLeftSidebarOpen(false)
    setMobileRightSidebarOpen(false)
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (leftSidebarTimeoutRef.current) {
        clearTimeout(leftSidebarTimeoutRef.current)
      }
      if (rightSidebarTimeoutRef.current) {
        clearTimeout(rightSidebarTimeoutRef.current)
      }
    }
  }, [])

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Close mobile sidebars when switching to desktop
      if (!mobile) {
        setMobileLeftSidebarOpen(false)
        setMobileRightSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    if (!input.trim() && snippets.length === 0) return

    // Combine current input and all snippets
    let fullText = ''
    if (snippets.length > 0) {
      fullText = snippets.map(s => s.text).join('\n\n')
    }
    if (input.trim()) {
      fullText = fullText ? fullText + '\n\n' + input : input
    }

    const userMessage = {
      id: Date.now(),
      text: fullText,
      sender: 'user',
      timestamp: new Date()
    }

    const modelToUse = mode === 'auto' ? detectBestModel(fullText) : selectedModel
    const messageText = fullText

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSnippets([]) // Clear snippets after sending
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
    const newSessionId = uuidv4()
    const newSession = {
      id: newSessionId,
      title: 'New Chat',
      messages: [],
      timestamp: new Date()
    }
    setChatSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSessionId)
    setMessages([])
    setInput('')
    setIsLoading(false)
    setError('')
    setShowHistory(false)

    console.log('🆕 Created new chat session:', newSessionId)
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
      toast.warning('Please enter a template name', {
        position: 'top-right',
        autoClose: 3000
      })
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
      askMe: '',
      icon: '🤖'
    })
    setShowTemplateEditor(false)

    toast.success('Template saved successfully!', {
      position: 'top-right',
      autoClose: 2000
    })
  }

  const openTemplateEditor = () => {
    setShowTemplateEditor(true)
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
      askMe: '',
      icon: '🤖'
    })
  }

  const openTemplatePreview = (template) => {
    console.log('Opening template preview for:', template.name)
    setPreviewingTemplate(template)
    setShowTemplatePreview(true)
  }

  const closeTemplatePreview = () => {
    setShowTemplatePreview(false)
    setPreviewingTemplate(null)
  }

  const fireTemplate = (template) => {
    let prompt = ''
    if (template.persona) prompt += `Act as: ${template.persona}\n\n`
    if (template.context) prompt += `Context: ${template.context}\n\n`
    if (template.instruction) prompt += `Task: ${template.instruction}\n\n`
    if (template.format) prompt += `Format: ${template.format}\n\n`
    if (template.tone) prompt += `Tone: ${template.tone}\n\n`
    if (template.inputData) prompt += `Reference Data: ${template.inputData}\n\n`
    if (template.deeplyThinkAbout) prompt += `Deeply think about: ${template.deeplyThinkAbout}\n\n`
    if (template.warning) prompt += `Warning/Restrictions: ${template.warning}\n\n`
    if (template.askMe) prompt += `Ask me: ${template.askMe}\n\n`
    prompt += '[Your specific question/request here]'

    const templateMessage = {
      id: Date.now(),
      text: `🔥 **Template Fired**: ${template.name}\n\n${prompt}`,
      sender: 'system',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, templateMessage])
    toast.success(`Fired "${template.name}" template`, {
      position: 'top-right',
      autoClose: 2000
    })
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

  // Generate a short title from the first user message
  const generateTitleFromText = (text) => {
    if (!text) return 'New Chat'
    let cleaned = String(text).replace(/\s+/g, ' ').trim()
    if (!cleaned) return 'New Chat'
    // Prefer up to ~60 chars
    if (cleaned.length > 60) cleaned = cleaned.slice(0, 60)
    return cleaned
  }

  // Auto-set session title when first user message arrives and title is default
  useEffect(() => {
    const session = chatSessions.find(s => s.id === currentSessionId)
    if (!session) return
    const hasDefaultTitle = !session.title || session.title === 'New Chat'
    if (!hasDefaultTitle) return
    const firstUserMsg = messages.find(m => m.sender === 'user')
    if (firstUserMsg && firstUserMsg.text) {
      const autoTitle = generateTitleFromText(firstUserMsg.text)
      if (autoTitle && autoTitle !== session.title) {
        updateSessionTitle(currentSessionId, autoTitle)
      }
    }
  }, [messages, currentSessionId, chatSessions])

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
      toast.error(`Failed to generate prompt: ${error.message}`, {
        position: 'top-right',
        autoClose: 4000
      })
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  // Save current input/final prompt as a Project Context item
  const setAsProjectContext = () => {
    const text = finalPrompt?.trim() || promptGeneratorInput.trim()
    if (!text) return
    if (projectContexts.length >= 3) {
      toast.warning('You can only set up to 3 project contexts.', {
        position: 'top-right',
        autoClose: 3000
      })
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

  // New Project Context functions
  const openContextEditor = (ctx) => {
    setEditingContextId(ctx.id)
    setEditingContextData({
      title: ctx.title,
      content: ctx.content,
      originalContent: ctx.content
    })
  }

  const closeContextEditor = () => {
    setEditingContextId(null)
    setEditingContextData(null)
  }

  const saveContextChanges = () => {
    if (!editingContextData || !editingContextId) return

    setProjectContexts(prev => prev.map(ctx =>
      ctx.id === editingContextId
        ? { ...ctx, title: editingContextData.title, content: editingContextData.content }
        : ctx
    ))
    closeContextEditor()
    toast.success('Project context updated!', {
      position: 'top-right',
      autoClose: 2000
    })
  }

  const enhanceContextWithAI = async () => {
    if (!editingContextData) return

    try {
      // Simulate AI enhancement
      const enhanced = `# Enhanced Project Context

## Overview
${editingContextData.content}

## AI-Enhanced Details
- **Architecture**: Modern, scalable design patterns
- **Performance**: Optimized for speed and efficiency  
- **Security**: Industry-standard security practices
- **Maintainability**: Clean, documented code structure
- **Testing**: Comprehensive test coverage
- **Deployment**: CI/CD pipeline ready

## Technical Recommendations
- Use TypeScript for better type safety
- Implement proper error handling
- Add logging and monitoring
- Follow SOLID principles
- Use design patterns appropriately

This enhanced context provides better guidance for AI assistants.`

      setEditingContextData(prev => ({
        ...prev,
        content: enhanced
      }))

      toast.success('Context enhanced with AI!', {
        position: 'top-right',
        autoClose: 2000
      })
    } catch (error) {
      toast.error('Failed to enhance context', {
        position: 'top-right',
        autoClose: 3000
      })
    }
  }

  const fireProjectContext = (ctx) => {
    // Only send enabled boxes
    const enabledBoxes = ctx.boxes?.filter(box => box.enabled) || []
    const contextContent = enabledBoxes.map(box => box.content).join('\n\n')

    const contextMessage = {
      id: Date.now(),
      text: `🔥 **Project Context Fired**: ${ctx.title}\n\n${contextContent || ctx.content}`,
      sender: 'system',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, contextMessage])
    toast.success(`Fired "${ctx.title}" to AI`, {
      position: 'top-right',
      autoClose: 2000
    })
  }

  // Enhanced Project Context functions
  const openProjectContextEditor = () => {
    setShowProjectContextEditor(true)
    setCurrentContextBoxes([])
    setNextBoxId(1)
  }

  const addContextBox = () => {
    const newBox = {
      id: nextBoxId,
      title: `New Project Context`,
      content: '',
      enabled: true
    }
    setCurrentContextBoxes(prev => [...prev, newBox])
    setNextBoxId(prev => prev + 1)
  }

  const updateContextBox = (boxId, content) => {
    setCurrentContextBoxes(prev =>
      prev.map(box => box.id === boxId ? { ...box, content } : box)
    )
  }

  const updateContextBoxTitle = (boxId, title) => {
    setCurrentContextBoxes(prev =>
      prev.map(box => box.id === boxId ? { ...box, title } : box)
    )
  }

  const toggleContextBox = (boxId) => {
    setCurrentContextBoxes(prev =>
      prev.map(box => box.id === boxId ? { ...box, enabled: !box.enabled } : box)
    )
  }

  const deleteContextBox = (boxId) => {
    setCurrentContextBoxes(prev => prev.filter(box => box.id !== boxId))
  }

  const openBoxPreview = (box) => {
    setPreviewingBox(box)
    setShowBoxPreview(true)
  }

  const closeBoxPreview = () => {
    setShowBoxPreview(false)
    setPreviewingBox(null)
  }

  const startRenameBox = (boxId, currentTitle) => {
    setRenamingBoxId(boxId)
    setRenameBoxText(currentTitle)
  }

  const saveRenameBox = () => {
    if (!renameBoxText.trim()) {
      setRenamingBoxId(null)
      return
    }
    updateContextBoxTitle(renamingBoxId, renameBoxText.trim())
    setRenamingBoxId(null)
    setRenameBoxText('')
  }

  const cancelRenameBox = () => {
    setRenamingBoxId(null)
    setRenameBoxText('')
  }

  const startRenameMainTitle = (currentTitle) => {
    setRenamingMainTitle(true)
    setMainTitleText(currentTitle)
  }

  const saveRenameMainTitle = () => {
    if (!mainTitleText.trim()) {
      setRenamingMainTitle(false)
      return
    }
    // Update the current context title if editing, or set a default title for new contexts
    if (editingContextId) {
      setProjectContexts(prev => prev.map(ctx =>
        ctx.id === editingContextId ? { ...ctx, title: mainTitleText.trim() } : ctx
      ))
    }
    setRenamingMainTitle(false)
    setMainTitleText('')
  }

  const cancelRenameMainTitle = () => {
    setRenamingMainTitle(false)
    setMainTitleText('')
  }

  const saveProjectContext = () => {
    if (currentContextBoxes.length === 0) {
      toast.warning('Add at least one context box', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    const newContext = {
      id: Date.now(),
      title: `Project Context ${projectContexts.length + 1}`,
      boxes: currentContextBoxes,
      createdAt: new Date()
    }

    setProjectContexts(prev => [newContext, ...prev])
    setShowProjectContextEditor(false)
    setCurrentContextBoxes([])

    toast.success('Project context saved!', {
      position: 'top-right',
      autoClose: 2000
    })
  }

  const editExistingContext = (ctx) => {
    setEditingContextId(ctx.id)
    setCurrentContextBoxes(ctx.boxes || [{ id: 1, content: ctx.content || '', enabled: true }])
    setNextBoxId((ctx.boxes?.length || 1) + 1)
    setShowProjectContextEditor(true)
  }

  const saveEditedContext = () => {
    if (!editingContextId) return

    setProjectContexts(prev => prev.map(ctx =>
      ctx.id === editingContextId
        ? { ...ctx, boxes: currentContextBoxes, updatedAt: new Date() }
        : ctx
    ))

    setEditingContextId(null)
    setShowProjectContextEditor(false)
    setCurrentContextBoxes([])

    toast.success('Project context updated!', {
      position: 'top-right',
      autoClose: 2000
    })
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

    toast.success('Template saved successfully!', {
      position: 'top-right',
      autoClose: 3000
    })
    setGeneratedPromptResult(null)
    setPromptGeneratorInput('')
  }
  return (
    <div className="w-full h-[100dvh] flex overflow-hidden">
      {/* Mobile backdrop - only for left sidebar */}
      {mobileLeftSidebarOpen && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 z-[65] md:hidden"
          onClick={closeMobileSidebars}
        />
      )}

      {/* Mobile Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#121318] border-b border-[#272a33] z-[60] md:hidden flex items-center justify-between px-4 mobile-header-bar">
        {/* Left Corner Button - Menu */}
        <button
          onClick={toggleMobileLeftSidebar}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Menu"
        >
          <img src="/mobile-view/right-side-icon.png" alt="Menu" className="w-6 h-6" />
        </button>

        {/* Center - CitrusLab Logo */}
        <div className="flex-1 flex justify-center">
          <img src={citrusLogo} alt="Citruslab" className="h-8" />
        </div>

        {/* Right Corner Button - Settings/Tools */}
        <button
          onClick={toggleMobileRightSidebar}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Tools"
        >
          <img src="/mobile-view/left-side-icon.png" alt="Tools" className="w-6 h-6" />
        </button>
      </div>

      {/* Left Sidebar - Template Style */}
      <div
        className={`${(isMobile && mobileLeftSidebarOpen) || (!isMobile && !sidebarCollapsed) ? 'w-64' : 'w-16'} citrus-surface no-border flex flex-col flex-shrink-0 fixed sidebar-container transition-transform duration-300 
          ${isMobile ? 'top-0 h-[100dvh] z-[70]' : 'top-0 h-full z-50'}
          md:left-2 
          ${mobileLeftSidebarOpen ? 'left-0 translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        onMouseEnter={handleLeftSidebarMouseEnter}
        onMouseLeave={handleLeftSidebarMouseLeave}
      >
        {/* Top logo area - Only show on desktop */}
        {!isMobile && (
          <div className="flex items-center justify-center h-16 flex-shrink-0 mt-4">
            {sidebarCollapsed ? (
              <img src={logoIcon} alt="Logo" className="w-9 h-9" />
            ) : (
              <img src={citrusLogo} alt="Citruslab" className="h-10" />
            )}
          </div>
        )}

        {/* Middle stack */}
        <div className={`flex-1 overflow-hidden flex flex-col p-4 sidebar-content ${isMobile ? 'mt-16 pt-4' : ''}`}>
          {/* Mobile close button at top */}
          {isMobile && mobileLeftSidebarOpen && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setMobileLeftSidebarOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 border border-[#d7ff2f]/30 hover:bg-black/70 hover:border-[#d7ff2f] transition-all"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5 text-[#d7ff2f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {((isMobile && mobileLeftSidebarOpen) || (!isMobile && !sidebarCollapsed)) ? (
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col space-y-2">
              {/* New Chat Section - Compact */}
              <div className="bg-black/30 rounded-lg border citrus-border glow-ring">
                <button
                  onClick={() => {
                    createNewChat()
                    if (isMobile) setMobileLeftSidebarOpen(false)
                  }}
                  className="w-full flex items-center justify-center space-x-2 rounded-lg py-3 px-4 transition-all text-sm font-medium hover:bg-black/50 hover:brightness-110 sidebar-button-enhanced"
                >
                  <img src={newChatIcon} className="w-5 h-5" alt="New" />
                  <span className="citrus-accent-text">New Chat</span>
                </button>
              </div>

              {/* History Section - Compact */}
              <div className="bg-black/30 rounded-lg border citrus-border glow-ring flex-1 min-h-0 overflow-hidden" style={{ maxHeight: '50vh' }}>
                {/* Header */}
                <div className="p-2 border-b border-gray-600">
                  <div className="flex items-center space-x-2">
                    <img src={historyIcon} className="w-4 h-4" alt="History" />
                    <h3 className="citrus-accent-text font-medium text-sm">History Chats</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  <div
                    ref={historyPanelRef}
                    className="h-full overflow-y-auto p-2 history-scrollbar"
                    onMouseDown={onHistoryMouseDown}
                    onMouseMove={onHistoryMouseMove}
                    onMouseUp={endHistoryDrag}
                    onMouseLeave={endHistoryDrag}
                  >
                    {chatSessions.length === 0 ? (
                      <div className="text-center text-gray-400 text-xs py-4">
                        <div className="mb-1">No chat history yet</div>
                        <div className="text-[10px] text-gray-500">Start a new conversation</div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <ChatHistory
                          sessions={chatSessions}
                          currentSessionId={currentSessionId}
                          onSessionSelect={(sessionId) => {
                            switchToSession(sessionId)
                            if (isMobile) setMobileLeftSidebarOpen(false)
                          }}
                          onNewChat={createNewChat}
                          onUpdateTitle={updateSessionTitle}
                          onDeleteSession={deleteSession}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4 py-4">
                {/* New Chat icon under logo */}
                <button className="rail-icon citrus-button rounded-lg icon-button-enhanced" title="New chat" onClick={() => {
                  createNewChat()
                  if (isMobile) setMobileLeftSidebarOpen(false)
                }}>
                  <img src={newChatIcon} alt="New" className="w-6 h-6" />
                </button>
                {/* History icon */}
                <button className="rail-icon citrus-button rounded-lg icon-button-enhanced" title="History">
                  <img src={historyIcon} alt="History" className="w-6 h-6" />
                </button>
              </div>
              {/* Spacer to push profile to bottom */}
              <div className="flex-1"></div>
            </>
          )}
        </div>

        {/* Bottom area - Profile */}
        <div className="p-4 flex-shrink-0">
          {((isMobile && mobileLeftSidebarOpen) || (!isMobile && !sidebarCollapsed)) ? (
            <div className="bg-black/30 rounded-lg border citrus-border glow-ring">
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full flex items-center justify-start space-x-3 rounded-lg py-3 px-4 hover:bg-black/50 hover:brightness-110 transition-colors sidebar-button-enhanced"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg profile-circle">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="citrus-accent-text text-sm font-medium">{currentUser.name}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <button
                onClick={() => setShowProfileModal(true)}
                className="rail-icon citrus-button rounded-full overflow-hidden icon-button-enhanced"
                title="Profile"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg profile-circle">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col h-full min-w-0 overflow-hidden main-content-area transition-all duration-300 px-4"
        style={{ 
          marginLeft: !isMobile ? (sidebarCollapsed ? '4.5rem' : '16.5rem') : '0',
          marginRight: !isMobile ? (rightSidebarCollapsed ? '4.5rem' : '16.5rem') : '0'
        }}
      >
        {/* Unified container: navbar + chat with neon margin box */}
        <div className={`w-full citrus-neon-border-strong rounded-3xl flex-1 flex flex-col relative z-10 bg-[#121318] overflow-hidden ${isMobile ? 'my-0 mb-0' : 'my-4'}`}>
          {/* Top Header - Centered pill with Share */}
          <header className="flex-shrink-0 z-30 relative">
            <div>
              <div className="citrus-header-bar w-full py-4 rounded-none">
                <div className="w-full flex items-center justify-between px-6">
                  {/* Left: session title with inline rename OR back button for prompt generator */}
                  <div className="flex items-center min-h-[32px]">
                    {showPromptGenerator ? (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setShowPromptGenerator(false)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Back to chat"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div className="flex items-center space-x-2">
                          <img src={promptIcon} className="w-5 h-5" alt="Prompt Generator" />
                          <h1 className="citrus-accent-text text-base font-medium">Prompt Generator</h1>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const session = chatSessions.find(s => s.id === currentSessionId)
                        const title = session?.title || 'New Chat'
                        if (isRenamingTitle) {
                          return (
                            <input
                              autoFocus
                              value={titleDraft}
                              onChange={(e) => setTitleDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const newTitle = titleDraft.trim() || 'New Chat'
                                  updateSessionTitle(currentSessionId, newTitle)
                                  setIsRenamingTitle(false)
                                } else if (e.key === 'Escape') {
                                  setIsRenamingTitle(false)
                                }
                              }}
                              onBlur={() => {
                                const newTitle = titleDraft.trim() || 'New Chat'
                                updateSessionTitle(currentSessionId, newTitle)
                                setIsRenamingTitle(false)
                              }}
                              className="bg-transparent border-b border-[rgba(215,255,47,0.35)] outline-none citrus-accent-text text-base"
                              placeholder="Rename chat"
                            />
                          )
                        }
                        return (
                          <div className="flex items-center space-x-4">
                            <h1
                              className="citrus-accent-text text-base font-medium select-none"
                              title="Double-click to rename"
                              onDoubleClick={() => {
                                setTitleDraft(title)
                                setIsRenamingTitle(true)
                              }}
                            >
                              {title}
                            </h1>

                            {/* Chat Mode Toggle - Hidden on mobile */}
                            {!isMobile && (
                            <div className="segment-group">
                              <button
                                className={`segment ${chatMode === 'normal' ? 'segment-active' : ''}`}
                                onClick={() => setChatMode('normal')}
                              >
                                Normal
                              </button>
                              <button
                                className={`segment ${chatMode === 'engineer' ? 'segment-active' : ''}`}
                                onClick={() => setChatMode('engineer')}
                              >
                                Engineer
                              </button>
                            </div>
                            )}
                          </div>
                        )
                      })()
                    )}
                  </div>
                  {/* Right: Share, Collaboration, and connection indicator */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-green-500' :
                          backendStatus === 'disconnected' ? 'bg-red-500' :
                            'bg-yellow-500 animate-pulse'
                          }`}></div>
                        {!isMobile && (
                        <span className={`text-xs ${backendStatus === 'connected' ? 'text-green-400' :
                          backendStatus === 'disconnected' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                          {backendStatus === 'connected' ? 'Connected' :
                            backendStatus === 'disconnected' ? 'Offline' :
                              'Connecting...'}
                        </span>
                        )}
                      </div>

                      {showPromptGenerator && (
                        <>
                          {currentUser && (
                            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                              Auto-saving
                            </span>
                          )}
                          {!currentUser && (
                            <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                              Local only
                            </span>
                          )}
                          <button
                            onClick={() => {
                              console.log('Reset button clicked!', promptGeneratorResetFn)
                              if (promptGeneratorResetFn) {
                                promptGeneratorResetFn()
                              } else {
                                console.log('Reset function not available yet')
                              }
                            }}
                            className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all flex items-center space-x-1"
                            title="Reset session"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Reset</span>
                          </button>
                        </>
                      )}
                    </div>
                    {!showPromptGenerator && (
                      <>
                        <div className="relative">
                          <button
                            ref={collaborationButtonRef}
                            onClick={() => setShowCollaborationPanel(!showCollaborationPanel)}
                            className={isMobile 
                              ? "w-10 h-10 flex items-center justify-center rounded-full bg-[#d7ff2f] hover:brightness-110 transition-all"
                              : `group relative px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 overflow-hidden ${
                              showCollaborationPanel 
                                ? 'bg-[#4a5a3a] text-[#d7ff2f] border border-[#d7ff2f]/30' 
                                : 'bg-[#2a2d35] hover:bg-[#33373f] text-white hover:text-[#d7ff2f] border border-transparent hover:border-[#d7ff2f]/20'
                              }`
                            }
                            title="Collaboration"
                          >
                            {isMobile ? (
                              /* Mobile: People icon in yellow circle */
                              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            ) : (
                              /* Desktop: Full design with animation */
                              <>
                            {/* Background animation */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#d7ff2f]/10 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                            
                            {/* Person icon instead of people */}
                            <div className="relative z-10">
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              
                              {/* Online indicator - smaller */}
                              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-[#2a2d35] animate-pulse"></div>
                            </div>
                            
                            {/* Compact text */}
                            <span className="relative z-10 group-hover:translate-x-0.5 transition-transform duration-200 text-xs">
                              Collab
                            </span>
                              </>
                            )}
                          </button>
                          {/* Collaboration Chat Dropdown */}
                          <CollaborationPanel
                            chatId={currentSessionId}
                            isVisible={showCollaborationPanel}
                            onClose={() => setShowCollaborationPanel(false)}
                            anchorRef={collaborationButtonRef}
                            currentUser={currentUser}
                          />
                        </div>
                        <button
                          onClick={() => setShowShareModal(true)}
                          className="group px-3 py-1 citrus-accent-bg text-black rounded-full text-sm font-medium hover:brightness-110 transition-all flex items-center gap-1 relative overflow-hidden"
                        >
                          {/* Micro interaction background */}
                          <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                          
                          {/* Icon with micro animation */}
                          <svg className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          
                          {/* Text with subtle animation */}
                          <span className="relative z-10 group-hover:translate-x-0.5 transition-transform duration-200">Share</span>
                          
                          {/* Subtle pulse effect */}
                          <div className="absolute inset-0 rounded-full bg-[#d7ff2f]/30 scale-0 group-hover:scale-110 group-hover:opacity-0 transition-all duration-500"></div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 flex min-h-0 items-stretch">
            {/* Conditionally render Prompt Generator or Chat Area */}
            {showPromptGenerator ? (
              <PromptGenerator
                isVisible={showPromptGenerator}
                onClose={() => setShowPromptGenerator(false)}
                currentUser={currentUser}
                onResetFunctionReady={setPromptGeneratorResetFn}
                onStateChange={setPromptGeneratorState}
                onInjectToProjectContext={(content, title) => {
                  const item = {
                    id: Date.now(),
                    title: title || `Generated Context ${projectContexts.length + 1}`,
                    content: content,
                    createdAt: new Date()
                  }
                  setProjectContexts(prev => [item, ...prev])
                  setShowPromptGenerator(false)
                  toast.success('Injected to Project Context!', {
                    position: 'top-right',
                    autoClose: 2000
                  })
                }}
              />
            ) : (
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Messages - Scrollable */}
                <div className={`flex-1 overflow-y-auto ${isMobile ? 'pb-32' : 'px-4'}`}>
                  <div className={`py-6 space-y-6 ${isMobile ? 'px-4' : 'px-0'}`}>
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-300 mt-6">
                        {showProjectContext ? (
                          // Prompt Generator Interface
                          <div className="mx-auto w-full max-w-4xl text-left">
                            <h2 className="text-4xl font-semibold mb-8 text-white">Give Project <span className="citrus-accent-text">Context</span>.</h2>

                            {/* Final Prompt Display */}
                            {finalPrompt && (
                              <div className="mb-6 relative">
                                <div className="flex items-center gap-2 mb-3">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-gray-300 text-sm">Generated</span>
                                </div>

                                <div className={`final-prompt-display transition-all duration-300 relative ${isPreviewExpanded ? 'preview-expanded' : ''
                                  }`}>
                                  <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="citrus-accent-text font-medium text-base">My final prompt</h4>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={setAsProjectContext}
                                          className="px-3 py-1.5 bg-[#4a5a3a] hover:bg-[#5a6a4a] text-white text-xs rounded-lg transition-all"
                                        >
                                          Set
                                        </button>
                                        <button
                                          onClick={() => navigator.clipboard.writeText(finalPrompt)}
                                          className="px-3 py-1.5 citrus-button text-xs rounded-lg hover:brightness-110"
                                        >
                                          Copy
                                        </button>
                                      </div>
                                    </div>
                                    <div className="final-prompt-content">
                                      <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{finalPrompt}</pre>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                                    className="absolute top-3 right-3 px-3 py-1 citrus-accent-bg text-black text-xs rounded-lg hover:brightness-110"
                                  >
                                    {isPreviewExpanded ? 'Minimize' : 'Expand'}
                                  </button>
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
                          <div className={`min-h-[60vh] flex flex-col items-center ${isMobile ? '' : 'px-4 justify-center'}`}>
                            {!isMobile && <h2 className="text-4xl font-semibold mb-8 text-white">What's your <span className="citrus-accent-text">idea</span> ?</h2>}
                            {/* Center Search Bar */}
                            <div className={`w-full max-w-3xl text-left ${isMobile ? '' : 'mt-6'}`}>
                              {isMobile ? (
                                /* Mobile Simplified Input - Fixed at bottom */
                                <div className="fixed bottom-4 left-2 right-2 px-4 py-3 z-40">
                                  <div className="flex items-center gap-3">
                                    {/* Plus Button - Opens Model Selector */}
                                    <button
                                      onClick={() => setShowMobileModelSelector(true)}
                                      className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border-2 border-[#d7ff2f] bg-transparent hover:bg-[#d7ff2f]/10 transition-all"
                                      aria-label="Model & Settings"
                                    >
                                      <svg className="w-6 h-6 text-[#d7ff2f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                      </svg>
                                    </button>
                                    
                                    {/* Input Field with Send Button */}
                                    <div className="flex-1 relative">
                                      <form onSubmit={handleSubmit} className="relative">
                                        <textarea
                                          value={input}
                                          onChange={(e) => setInput(e.target.value)}
                                          placeholder="Type your message..."
                                          className="w-full bg-[#1a1b21] border-2 border-[#d7ff2f] rounded-3xl px-4 py-3 pr-14 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-[#d7ff2f] focus:ring-0"
                                          rows={1}
                                          style={{ minHeight: '48px', maxHeight: '120px' }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault()
                                              handleSubmit(e)
                                            }
                                          }}
                                        />
                                        <button
                                          type="submit"
                                          disabled={!input.trim() || isLoading}
                                          className="absolute right-3 bottom-3 w-10 h-10 flex items-center justify-center rounded-full hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed p-2"
                                          aria-label="Send"
                                        >
                                          <img src={logoIcon} alt="Send" className="w-full h-full object-contain" />
                                        </button>
                                      </form>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Desktop Full SearchBar */
                              <SearchBar
                                input={input}
                                setInput={setInput}
                                onSubmit={handleSubmit}
                                isLoading={isLoading}
                                mode={mode}
                                setMode={setMode}
                                showModelSelector={showModelSelector}
                                setShowModelSelector={(show) => {
                                  console.log('Setting model selector to:', show)
                                  if (show) {
                                    // Use setTimeout to ensure the ref is available
                                    setTimeout(() => calculateModelSelectorPosition(), 0)
                                  }
                                  setShowModelSelector(show)
                                }}
                                modelButtonRef={modelButtonRef}
                                selectedModelIcon={getSelectedModelIcon()}
                                snippets={snippets}
                                addSnippetFromInput={addSnippetFromInput}
                                removeSnippet={removeSnippet}
                                setPreviewSnippetIndex={setPreviewSnippetIndex}
                                snippetTrayHeight={snippetTrayHeight}
                                snippetTrayRef={snippetTrayRef}
                                isCentered={true}
                                chatMode={chatMode}
                              />
                              )}
                            </div>
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
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
                {messages.length > 0 && !isMobile && (
                  <div className="bottom-input-form px-4 py-4 flex-shrink-0">
                    {/* Desktop Full SearchBar */}
                    <SearchBar
                      input={input}
                      setInput={setInput}
                      onSubmit={handleSubmit}
                      isLoading={isLoading}
                      mode={mode}
                      setMode={setMode}
                      showModelSelector={showModelSelector}
                      setShowModelSelector={(show) => {
                        console.log('Setting model selector to:', show)
                        if (show) {
                          // Use setTimeout to ensure the ref is available
                          setTimeout(() => calculateModelSelectorPosition(), 0)
                        }
                        setShowModelSelector(show)
                      }}
                      modelButtonRef={modelButtonRef}
                      selectedModelIcon={getSelectedModelIcon()}
                      snippets={snippets}
                      addSnippetFromInput={addSnippetFromInput}
                      removeSnippet={removeSnippet}
                      setPreviewSnippetIndex={setPreviewSnippetIndex}
                      snippetTrayHeight={snippetTrayHeight}
                      snippetTrayRef={snippetTrayRef}
                      isCentered={false}
                      chatMode={chatMode}
                    />
                  </div>
                )}
                {/* Mobile Input Form - Fixed at Bottom (always visible on mobile) */}
                {messages.length > 0 && isMobile && (
                  <div className="fixed bottom-4 left-2 right-2 px-4 py-3 z-40">
                    <div className="flex items-center gap-3">
                      {/* Plus Button - Opens Model Selector */}
                      <button
                        onClick={() => setShowMobileModelSelector(true)}
                        className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border-2 border-[#d7ff2f] bg-transparent hover:bg-[#d7ff2f]/10 transition-all"
                        aria-label="Model & Settings"
                      >
                        <svg className="w-6 h-6 text-[#d7ff2f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      
                      {/* Input Field with Send Button */}
                      <div className="flex-1 relative">
                        <form onSubmit={handleSubmit} className="relative">
                          <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full bg-[#1a1b21] border-2 border-[#d7ff2f] rounded-3xl px-4 py-3 pr-14 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-[#d7ff2f] focus:ring-0"
                            rows={1}
                            style={{ minHeight: '48px', maxHeight: '120px' }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit(e)
                              }
                            }}
                          />
                          <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-3 bottom-3 w-10 h-10 flex items-center justify-center rounded-full hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed p-2"
                            aria-label="Send"
                          >
                            <img src={logoIcon} alt="Send" className="w-full h-full object-contain" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Right Panel - Template Style - Hidden on Mobile */}
            {!isMobile && (!rightSidebarCollapsed || mobileRightSidebarOpen) && (
              <div className={`w-64 no-border flex flex-col fixed bg-[#121318] sidebar-container transition-transform duration-300 top-0 h-screen z-50 md:right-2 ${rightSidebarCollapsed && !mobileRightSidebarOpen ? 'md:hidden translate-x-full' : 'md:translate-x-0'}`}
                onMouseLeave={handleRightSidebarMouseLeave}>
                {/* Right Sidebar Content */}
                <div className="flex-1 flex flex-col p-4 min-h-0 overflow-y-auto">
                  {/* Top sections with flex-1 to take available space */}
                  <div className="flex flex-col space-y-2">
                    
                    {/* Prompt Generator Button - Compact */}
                    <div className="bg-black/30 rounded-lg border citrus-border glow-ring">
                      <button
                        onClick={() => { 
                          setShowPromptGenerator(true); 
                          setShowProjectContext(false);
                        }}
                        className="w-full p-3 rounded-lg transition-all flex items-center justify-center space-x-2 hover:brightness-110 hover:bg-black/50 sidebar-button-enhanced"
                      >
                        <img src={promptIcon} className="w-4 h-4" alt="Prompt Generator" />
                        <span className="citrus-accent-text font-medium text-sm">Prompt Generator</span>
                      </button>
                    </div>

                    {/* Project Context Section - Expanded for 3 items */}
                    <div className="bg-black/30 rounded-lg border citrus-border glow-ring" style={{ height: '200px' }}>
                      {/* Header */}
                      <div className="p-2 border-b border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img src={projectIcon} className="w-4 h-4" alt="Project Context" />
                            <h3 className="citrus-accent-text font-medium text-sm">Project Context</h3>
                          </div>
                          <button
                            onClick={openProjectContextEditor}
                            className="px-2 py-1 citrus-accent-bg text-black text-xs rounded transition-all hover:brightness-110 font-medium new-button"
                          >
                            New
                          </button>
                        </div>
                      </div>

                      {/* Content - Expanded height for 3 items */}
                      <div className="overflow-y-auto p-2" style={{ height: '160px' }}>
                        {projectContexts.length === 0 ? (
                          <div className="text-center text-gray-400 text-xs py-4">
                            <div className="mb-1">Add your project context</div>
                            <div className="text-[10px] text-gray-500">Click "New" to get started</div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {projectContexts.map((ctx) => (
                              <div key={ctx.id} className="group">
                                {renamingContextId === ctx.id ? (
                                  <div className="flex items-center gap-1 p-1.5 bg-black/30 rounded border border-[rgba(215,255,47,0.35)]">
                                    <input
                                      value={renameText}
                                      onChange={(e) => setRenameText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveRenameContext();
                                        if (e.key === 'Escape') { setRenamingContextId(null) }
                                      }}
                                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                      autoFocus
                                    />
                                    <button onClick={saveRenameContext} className="text-green-400 text-xs hover:text-green-300">✓</button>
                                    <button onClick={() => setRenamingContextId(null)} className="text-red-400 text-xs hover:text-red-300">✕</button>
                                  </div>
                                ) : (
                                  <div className="p-1.5 rounded bg-black/10 hover:bg-black/30 transition-all cursor-pointer project-context-item">
                                    <div className="flex items-center justify-between">
                                      <div
                                        className="flex-1 min-w-0"
                                        onClick={() => editExistingContext(ctx)}
                                      >
                                        <div className="text-xs text-white truncate font-medium">
                                          {ctx.title}
                                        </div>
                                        <div className="text-[10px] text-gray-400 truncate">
                                          {ctx.boxes ? `${ctx.boxes.length} context` : 'Legacy context'}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => fireProjectContext(ctx)}
                                          className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs rounded font-medium fire-button"
                                          title="Fire context to AI"
                                        >
                                          Fire
                                        </button>
                                        <button
                                          onClick={() => deleteProjectContext(ctx.id)}
                                          className="text-red-400 text-xs project-delete-button"
                                          title="Delete"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Templates Section - Sticky at Bottom */}
                  <div className="mt-2 flex-shrink-0">

                    {/* Templates Section - Sticky at Bottom */}
                    <div className="bg-black/30 rounded-lg border citrus-border glow-ring flex flex-col" style={{ height: '300px' }}>
                      {/* Header */}
                      <div className="p-2 border-b border-gray-600 flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img src={templatesIcon} className="w-4 h-4" alt="Templates" />
                            <h3 className="citrus-accent-text font-medium text-sm">Templates</h3>
                          </div>
                          <button
                            onClick={openTemplateEditor}
                            className="px-2 py-1 citrus-accent-bg text-black text-xs rounded transition-all hover:brightness-110 font-medium new-button"
                          >
                            New
                          </button>
                        </div>
                      </div>

                      {/* Content - Scrollable */}
                      <div className="p-2 flex-1 overflow-y-auto history-scrollbar">

                        <div className="space-y-2">
                          <h4 className="citrus-accent-text font-medium text-xs">Quick Templates</h4>

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
                              className="w-full p-2 bg-black/10 hover:bg-black/30 rounded text-left transition-all template-item"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">💻</span>
                                <div>
                                  <h5 className="text-white font-medium text-xs template-title">Code Review Assistant</h5>
                                  <p className="text-gray-400 text-[10px]">Professional code analysis</p>
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
                              className="w-full p-2 bg-black/10 hover:bg-black/30 rounded text-left transition-all template-item"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">✍️</span>
                                <div>
                                  <h5 className="text-white font-medium text-xs template-title">Creative Writer</h5>
                                  <p className="text-gray-400 text-[10px]">Storytelling & content</p>
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
                              className="w-full p-2 bg-black/10 hover:bg-black/30 rounded text-left transition-all template-item"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">📊</span>
                                <div>
                                  <h5 className="text-white font-medium text-xs template-title">Business Analyst</h5>
                                  <p className="text-gray-400 text-[10px]">Strategic insights</p>
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
                              className="w-full p-2 bg-black/10 hover:bg-black/30 rounded text-left transition-all template-item"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">📚</span>
                                <div>
                                  <h5 className="text-white font-medium text-xs template-title">Tech Writer</h5>
                                  <p className="text-gray-400 text-[10px]">Documentation expert</p>
                                </div>
                              </div>
                            </button>
                          </div>

                          {customTemplates.length > 0 && (
                            <>
                              <h4 className="citrus-accent-text font-medium mt-2 text-xs">Your Templates</h4>
                              <div className="space-y-1">
                                {customTemplates.map((template) => (
                                  <div key={template.id} className="group p-1.5 rounded bg-black/10 hover:bg-black/30 transition-all template-item">
                                    <div className="flex items-center justify-between">
                                      <div
                                        className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer"
                                        onClick={() => openTemplatePreview(template)}
                                      >
                                        <span className="text-sm flex-shrink-0">{template.icon || '🤖'}</span>
                                        <div className="flex-1 min-w-0">
                                          <h5 className="text-white font-medium text-xs template-title truncate">{template.name}</h5>
                                          <p className="text-gray-400 text-[10px] truncate">{template.persona || 'AI Assistant'}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => fireTemplate(template)}
                                          className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs rounded font-medium fire-button hover:brightness-110 transition-all"
                                          title="Fire template to AI"
                                        >
                                          Fire
                                        </button>
                                        <button
                                          onClick={() => deleteCustomTemplate(template.id)}
                                          className="text-red-400 hover:text-red-300 text-xs project-delete-button transition-colors"
                                          title="Delete template"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
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
            {rightSidebarCollapsed && !isMobile && (
              <div
                className="right-sidebar flex flex-col items-center justify-between fixed top-0 right-[0.5rem] h-screen z-20 hidden md:flex"
                onMouseEnter={handleRightSidebarMouseEnter}
              >
                {/* Top icons: Prompt Generator and Project Context (reversed order) */}
                <div className="flex flex-col items-center gap-3 mt-2">
                  <button
                    className="rail-icon citrus-button rounded-lg icon-button-enhanced"
                    title="Prompt Generator"
                    onClick={() => { setShowPromptGenerator(true); setShowProjectContext(false); setRightSidebarCollapsed(false); }}
                  >
                    <img src={promptIcon} className="w-6 h-6" alt="Prompt Generator" />
                  </button>
                  <button
                    className="rail-icon citrus-button rounded-lg icon-button-enhanced"
                    title="Project Context"
                    onClick={() => { setShowProjectContext(true); setShowPromptGenerator(false); setRightSidebarCollapsed(false); }}
                  >
                    <img src={projectIcon} className="w-6 h-6" alt="Project Context" />
                  </button>
                </div>
                {/* Bottom icon: Templates */}
                <div className="flex flex-col items-center gap-3 mb-2">
                  <button
                    className="rail-icon citrus-button rounded-lg icon-button-enhanced"
                    title="Templates"
                    onClick={() => setRightSidebarCollapsed(false)}
                  >
                    <img src={templatesIcon} className="w-6 h-6" alt="Templates" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Snippet preview modal */}
      {previewSnippetIndex !== null && snippets[previewSnippetIndex] && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-8" onClick={() => setPreviewSnippetIndex(null)}>
          <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg shadow-2xl z-[9999] w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-[#4a5a3a] flex items-center justify-between">
              <h3 className="text-[#d7ff2f] font-medium">My final prompt</h3>
              <button
                className="bg-[#4a5a3a] hover:bg-[#5a6a4a] text-white px-3 py-1 rounded text-sm transition-colors"
                onClick={() => navigator.clipboard.writeText(snippets[previewSnippetIndex].text)}
              >
                copy
              </button>
            </div>
            <div className="p-4 bg-[#1a1f0a]">
              <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">{snippets[previewSnippetIndex].text}</pre>
            </div>
          </div>
        </div>
      )}
      {/* Model Selector Modal */}
      {showModelSelector && (
        <div className="fixed inset-0 z-[9998]" onClick={() => setShowModelSelector(false)}>
          <div
            className="absolute bg-[#2a2f1a] backdrop-blur-sm border border-[#4a5a3a] rounded-2xl shadow-2xl z-[9999] w-60 overflow-hidden"
            style={{
              top: modelSelectorPosition.top > 0 ? `${modelSelectorPosition.top}px` : 'auto',
              bottom: modelSelectorPosition.top <= 0 ? '120px' : 'auto',
              left: modelSelectorPosition.left > 0 ? `${modelSelectorPosition.left}px` : '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2.5">
              {/* Header */}
              <div className="pb-1.5 mb-1.5 border-b border-[#4a5a3a]">
                <h3 className="text-xs font-medium text-[#d7ff2f]">Select AI Models</h3>
              </div>
              
              {/* Model list */}
              <div className="space-y-0.5">
                {/* ChatGPT */}
                <div 
                  className={`flex items-center space-x-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedModel?.name?.includes('ChatGPT') 
                      ? 'bg-[#d7ff2f]/5 border border-[#d7ff2f]/30 text-[#d7ff2f] shadow-sm' 
                      : 'hover:bg-[#1a1f0a] border border-transparent hover:border-[#4a5a3a] text-white'
                  }`} 
                  onClick={() => { setSelectedModel(aiModels.find(m => m.name.includes('ChatGPT')) || aiModels[0]); setShowModelSelector(false); }}
                >
                  <div className="w-4 h-4 rounded-sm bg-white flex items-center justify-center">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142-.0852 4.783-2.7582a.7712.7712 0 0 0 .7806 0l5.8428 3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142.0852-4.7735 2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="#10A37F"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium">ChatGPT 4.0</span>
                  {selectedModel?.name?.includes('ChatGPT') && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 rounded-full bg-[#d7ff2f]"></div>
                    </div>
                  )}
                </div>

                {/* Claude */}
                <div 
                  className={`flex items-center space-x-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedModel?.name?.includes('Claude') 
                      ? 'bg-[#d7ff2f]/5 border border-[#d7ff2f]/30 text-[#d7ff2f] shadow-sm' 
                      : 'hover:bg-[#1a1f0a] border border-transparent hover:border-[#4a5a3a] text-white'
                  }`} 
                  onClick={() => { setSelectedModel(aiModels.find(m => m.name.includes('Claude')) || aiModels[1]); setShowModelSelector(false); }}
                >
                  <div className="w-4 h-4 rounded-sm bg-[#CC785C] flex items-center justify-center">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="white">
                      <path d="M7.5 8.25h9m-9 3h9m-9 3h6m-3 2.25h.007v.008H10.5v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Claude 3.5 Sonnet</span>
                  {selectedModel?.name?.includes('Claude') && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 rounded-full bg-[#d7ff2f]"></div>
                    </div>
                  )}
                </div>

                {/* Gemini */}
                <div 
                  className={`flex items-center space-x-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedModel?.name?.includes('Gemini') 
                      ? 'bg-[#d7ff2f]/5 border border-[#d7ff2f]/30 text-[#d7ff2f] shadow-sm' 
                      : 'hover:bg-[#1a1f0a] border border-transparent hover:border-[#4a5a3a] text-white'
                  }`} 
                  onClick={() => { setSelectedModel(aiModels.find(m => m.name.includes('Gemini')) || aiModels[2]); setShowModelSelector(false); }}
                >
                  <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Gemini 1.5 Pro</span>
                  {selectedModel?.name?.includes('Gemini') && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 rounded-full bg-[#d7ff2f]"></div>
                    </div>
                  )}
                </div>

                {/* Deepseek */}
                <div 
                  className={`flex items-center space-x-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedModel?.name?.includes('Deepseek') 
                      ? 'bg-[#d7ff2f]/5 border border-[#d7ff2f]/30 text-[#d7ff2f] shadow-sm' 
                      : 'hover:bg-[#1a1f0a] border border-transparent hover:border-[#4a5a3a] text-white'
                  }`} 
                  onClick={() => { setSelectedModel(aiModels.find(m => m.name.includes('Deepseek')) || aiModels[3]); setShowModelSelector(false); }}
                >
                  <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Deepseek-R1</span>
                  {selectedModel?.name?.includes('Deepseek') && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 rounded-full bg-[#d7ff2f]"></div>
                    </div>
                  )}
                </div>

                {/* Grok */}
                <div 
                  className={`flex items-center space-x-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedModel?.name?.includes('Grok') 
                      ? 'bg-[#d7ff2f]/5 border border-[#d7ff2f]/30 text-[#d7ff2f] shadow-sm' 
                      : 'hover:bg-[#1a1f0a] border border-transparent hover:border-[#4a5a3a] text-white'
                  }`} 
                  onClick={() => { setSelectedModel(aiModels.find(m => m.name.includes('Grok')) || aiModels[4]); setShowModelSelector(false); }}
                >
                  <div className="w-4 h-4 rounded-sm bg-black flex items-center justify-center">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="white">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Grok-4</span>
                  {selectedModel?.name?.includes('Grok') && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 rounded-full bg-[#d7ff2f]"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        chatId={currentSessionId}
        chatTitle={chatSessions.find(s => s.id === currentSessionId)?.title || 'Chat'}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
      />

      {/* Enhanced Project Context Editor Modal */}
      {editingContextId && editingContextData && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4" onClick={closeContextEditor}>
          <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg shadow-2xl z-[9999] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-[#4a5a3a] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={projectIcon} className="w-5 h-5 text-[#d7ff2f]" alt="Project Context" />
                <input
                  value={editingContextData.title}
                  onChange={(e) => setEditingContextData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-transparent border-b border-[#4a5a3a] outline-none text-[#d7ff2f] font-medium"
                  placeholder="Context title"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={enhanceContextWithAI}
                  className="bg-[#4a5a3a] hover:bg-[#5a6a4a] text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                >
                  🔥 Enhance with AI
                </button>
                <button
                  onClick={saveContextChanges}
                  className="bg-[#d7ff2f] hover:brightness-110 text-black px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  className="text-gray-400 hover:text-white px-2 py-1"
                  onClick={closeContextEditor}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content Editor */}
            <div className="flex-1 p-6 bg-[#1a1f0a] overflow-hidden">
              <textarea
                value={editingContextData.content}
                onChange={(e) => setEditingContextData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full h-full bg-transparent outline-none resize-none text-base text-gray-300 placeholder-gray-500 font-mono leading-relaxed"
                placeholder="Enter your project context here..."
                style={{ minHeight: '400px' }}
              />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#4a5a3a] bg-[#2a2f1a] flex items-center justify-between">
              <div className="text-xs text-gray-400">
                Use this context to help AI understand your project better
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingContextData(prev => ({ ...prev, content: prev.originalContent }))}
                  className="text-gray-400 hover:text-white text-xs px-2 py-1"
                >
                  Reset
                </button>
                <button
                  onClick={closeContextEditor}
                  className="text-gray-400 hover:text-white text-xs px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Project Context Editor Modal */}
      {showProjectContextEditor && !showBoxPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-center justify-center p-4" onClick={() => setShowProjectContextEditor(false)}>
          <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg shadow-2xl z-[9999] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-3 border-b border-[#4a5a3a] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={projectIcon} className="w-4 h-4 text-[#d7ff2f]" alt="Project Context" />
                {renamingMainTitle ? (
                  <input
                    value={mainTitleText}
                    onChange={(e) => setMainTitleText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRenameMainTitle();
                      if (e.key === 'Escape') cancelRenameMainTitle();
                    }}
                    onBlur={saveRenameMainTitle}
                    className="bg-transparent border-b border-[#d7ff2f] outline-none text-[#d7ff2f] font-medium text-base min-w-0"
                    autoFocus
                  />
                ) : (
                  <h2
                    className="text-[#d7ff2f] font-medium text-base cursor-pointer"
                    onDoubleClick={() => startRenameMainTitle(editingContextId ?
                      projectContexts.find(ctx => ctx.id === editingContextId)?.title || 'My final prompt' :
                      'My final prompt'
                    )}
                    title="Double-click to rename"
                  >
                    {editingContextId ?
                      projectContexts.find(ctx => ctx.id === editingContextId)?.title || 'Edit Project Context' :
                      'My final prompt'
                    }
                  </h2>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addContextBox}
                  className="bg-[#4a5a3a] hover:bg-[#5a6a4a] text-white px-2 py-1 rounded text-xs transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
                <button
                  onClick={editingContextId ? saveEditedContext : saveProjectContext}
                  disabled={currentContextBoxes.length === 0}
                  className="bg-[#d7ff2f] hover:brightness-110 text-black px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  save
                </button>
                <button
                  className="text-gray-400 hover:text-white px-2 py-1"
                  onClick={() => {
                    setShowProjectContextEditor(false)
                    setEditingContextId(null)
                    setCurrentContextBoxes([])
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content Area - Grid Layout */}
            <div className="flex-1 p-4 bg-[#1a1f0a] overflow-y-auto">
              {currentContextBoxes.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="mb-3">
                    <svg className="w-12 h-12 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-300 mb-2">No context boxes yet</h3>
                  <p className="text-xs text-gray-500">Add boxes to organize your project context</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {currentContextBoxes.map((box, index) => (
                    <div key={box.id} className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-md overflow-hidden flex flex-col" style={{ aspectRatio: '2/3' }}>
                      {/* Box Header */}
                      <div className="p-1.5 border-b border-[#4a5a3a] flex items-center justify-between bg-[#1a1f0a] flex-shrink-0">
                        <div className="flex items-center space-x-1 min-w-0 flex-1">
                          <button
                            onClick={() => toggleContextBox(box.id)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${box.enabled
                              ? 'bg-[#d7ff2f] border-[#d7ff2f] text-black'
                              : 'border-gray-500 hover:border-gray-400'
                              }`}
                          >
                            {box.enabled && (
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          {renamingBoxId === box.id ? (
                            <input
                              value={renameBoxText}
                              onChange={(e) => setRenameBoxText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRenameBox();
                                if (e.key === 'Escape') cancelRenameBox();
                              }}
                              onBlur={saveRenameBox}
                              className="flex-1 bg-transparent border-b border-[#d7ff2f] outline-none text-[#d7ff2f] text-xs font-medium min-w-0"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="text-[#d7ff2f] font-medium text-xs truncate cursor-pointer"
                              onDoubleClick={() => startRenameBox(box.id, box.title || `New Project Context`)}
                              title="Double-click to rename"
                            >
                              {box.title || `New Project Context`}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteContextBox(box.id)}
                          className="text-red-400 hover:text-red-300 p-1 transition-colors flex-shrink-0"
                          title="Delete box"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Box Content Preview */}
                      <div
                        className="flex-1 p-1.5 cursor-pointer hover:bg-[#1a1f0a] transition-colors overflow-hidden"
                        onClick={() => openBoxPreview(box)}
                      >
                        <div className="text-xs text-gray-400 font-mono leading-tight line-clamp-10">
                          {box.content || 'Click to add content...'}
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="px-1.5 py-1 border-t border-[#4a5a3a] bg-[#1a1f0a]">
                        <span className={`text-xs px-1 py-0.5 rounded ${box.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                          {box.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#4a5a3a] bg-[#2a2f1a] flex items-center justify-between">
              <div className="text-xs text-gray-400">
                {currentContextBoxes.length > 0 && (
                  <>
                    {currentContextBoxes.filter(box => box.enabled).length} of {currentContextBoxes.length} boxes enabled
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowProjectContextEditor(false)
                    setEditingContextId(null)
                    setCurrentContextBoxes([])
                  }}
                  className="text-gray-400 hover:text-white text-xs px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Box Preview Modal */}
      {showBoxPreview && previewingBox && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={closeBoxPreview}>
          <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg shadow-2xl z-[10000] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header with back button */}
            <div className="p-3 border-b border-[#4a5a3a] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeBoxPreview}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Back to main view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <img src={projectIcon} className="w-4 h-4 text-[#d7ff2f]" alt="Project Context" />
                {renamingBoxId === previewingBox.id ? (
                  <input
                    value={renameBoxText}
                    onChange={(e) => setRenameBoxText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRenameBox();
                      if (e.key === 'Escape') cancelRenameBox();
                    }}
                    onBlur={saveRenameBox}
                    className="bg-transparent border-b border-[#d7ff2f] outline-none text-[#d7ff2f] font-medium text-base min-w-0"
                    autoFocus
                  />
                ) : (
                  <h2
                    className="text-[#d7ff2f] font-medium text-base cursor-pointer"
                    onDoubleClick={() => startRenameBox(previewingBox.id, previewingBox.title || 'New Project Context')}
                    title="Double-click to rename"
                  >
                    {previewingBox.title || 'New Project Context'}
                  </h2>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    toggleContextBox(previewingBox.id)
                    setPreviewingBox(prev => ({ ...prev, enabled: !prev.enabled }))
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors ${previewingBox.enabled
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                >
                  {previewingBox.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(previewingBox.content)}
                  className="bg-[#4a5a3a] hover:bg-[#5a6a4a] text-white px-2 py-1 rounded text-xs transition-colors"
                >
                  Copy
                </button>
                <button
                  onClick={closeBoxPreview}
                  className="text-gray-400 hover:text-white px-2 py-1"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 bg-[#1a1f0a] overflow-y-auto">
              <textarea
                value={previewingBox.content}
                onChange={(e) => {
                  updateContextBox(previewingBox.id, e.target.value)
                  setPreviewingBox(prev => ({ ...prev, content: e.target.value }))
                }}
                className="w-full h-full min-h-[300px] bg-transparent outline-none resize-none text-sm text-gray-300 placeholder-gray-500 font-mono leading-relaxed"
                placeholder="Enter context content here... (folder structure, code snippets, project details, etc.)

You can paste text content here. Use Ctrl+V to paste."
              />
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {showTemplatePreview && previewingTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={closeTemplatePreview}>
          <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg shadow-2xl z-[10000] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-3 border-b border-[#4a5a3a] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeTemplatePreview}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Back to templates"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xl">{previewingTemplate.icon || '🤖'}</span>
                <h2 className="text-[#d7ff2f] font-medium text-base">{previewingTemplate.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    fireTemplate(previewingTemplate)
                    closeTemplatePreview()
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs rounded font-medium hover:brightness-110 transition-all"
                >
                  🔥 Fire
                </button>
                <button
                  onClick={() => useCustomTemplate(previewingTemplate)}
                  className="bg-[#4a5a3a] hover:bg-[#5a6a4a] text-white px-3 py-1.5 rounded text-xs transition-colors"
                >
                  Use Template
                </button>
                <button
                  onClick={closeTemplatePreview}
                  className="text-gray-400 hover:text-white px-2 py-1"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 bg-[#1a1f0a] overflow-y-auto">
              <div className="space-y-4">
                {/* Template Info */}
                <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{previewingTemplate.icon || '🤖'}</span>
                    <div>
                      <h3 className="text-white font-medium">{previewingTemplate.name}</h3>
                      <p className="text-gray-400 text-sm">{previewingTemplate.persona || 'AI Assistant'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#d7ff2f] font-medium">Format: </span>
                      <span className="text-gray-300 capitalize">{previewingTemplate.format?.replace('-', ' ') || 'Paragraph'}</span>
                    </div>
                    <div>
                      <span className="text-[#d7ff2f] font-medium">Tone: </span>
                      <span className="text-gray-300 capitalize">{previewingTemplate.tone || 'Professional'}</span>
                    </div>
                  </div>
                </div>

                {/* Template Details */}
                <div className="space-y-3 text-sm">
                  {previewingTemplate.context && (
                    <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg p-3">
                      <h4 className="text-[#d7ff2f] font-medium mb-2">Context</h4>
                      <p className="text-gray-300">{previewingTemplate.context}</p>
                    </div>
                  )}

                  {previewingTemplate.instruction && (
                    <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg p-3">
                      <h4 className="text-[#d7ff2f] font-medium mb-2">Task/Instruction</h4>
                      <p className="text-gray-300">{previewingTemplate.instruction}</p>
                    </div>
                  )}

                  {previewingTemplate.inputData && (
                    <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg p-3">
                      <h4 className="text-[#d7ff2f] font-medium mb-2">Reference Data</h4>
                      <p className="text-gray-300">{previewingTemplate.inputData}</p>
                    </div>
                  )}

                  {previewingTemplate.deeplyThinkAbout && (
                    <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg p-3">
                      <h4 className="text-[#d7ff2f] font-medium mb-2">Focus Areas</h4>
                      <p className="text-gray-300">{previewingTemplate.deeplyThinkAbout}</p>
                    </div>
                  )}

                  {previewingTemplate.warning && (
                    <div className="bg-[#2a2f1a] border border-red-500/30 rounded-lg p-3">
                      <h4 className="text-red-400 font-medium mb-2">⚠️ Restrictions</h4>
                      <p className="text-gray-300">{previewingTemplate.warning}</p>
                    </div>
                  )}

                  {previewingTemplate.askMe && (
                    <div className="bg-[#2a2f1a] border border-blue-500/30 rounded-lg p-3">
                      <h4 className="text-blue-400 font-medium mb-2">❓ Will Ask</h4>
                      <p className="text-gray-300">{previewingTemplate.askMe}</p>
                    </div>
                  )}
                </div>

                {/* Generated Prompt Preview */}
                <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg p-3">
                  <h4 className="text-[#d7ff2f] font-medium mb-3">Generated Prompt</h4>
                  <div className="bg-[#1a1f0a] rounded p-3 text-xs text-gray-300 font-mono leading-relaxed max-h-40 overflow-y-auto">
                    {(() => {
                      let prompt = ''
                      if (previewingTemplate.persona) prompt += `Act as: ${previewingTemplate.persona}\n\n`
                      if (previewingTemplate.context) prompt += `Context: ${previewingTemplate.context}\n\n`
                      if (previewingTemplate.instruction) prompt += `Task: ${previewingTemplate.instruction}\n\n`
                      if (previewingTemplate.format) prompt += `Format: ${previewingTemplate.format}\n\n`
                      if (previewingTemplate.tone) prompt += `Tone: ${previewingTemplate.tone}\n\n`
                      if (previewingTemplate.inputData) prompt += `Reference Data: ${previewingTemplate.inputData}\n\n`
                      if (previewingTemplate.deeplyThinkAbout) prompt += `Deeply think about: ${previewingTemplate.deeplyThinkAbout}\n\n`
                      if (previewingTemplate.warning) prompt += `Warning/Restrictions: ${previewingTemplate.warning}\n\n`
                      if (previewingTemplate.askMe) prompt += `Ask me: ${previewingTemplate.askMe}\n\n`
                      prompt += '[Your specific question/request here]'
                      return prompt
                    })()}
                  </div>
                  <button
                    onClick={() => {
                      const fullPrompt = (() => {
                        let prompt = ''
                        if (previewingTemplate.persona) prompt += `Act as: ${previewingTemplate.persona}\n\n`
                        if (previewingTemplate.context) prompt += `Context: ${previewingTemplate.context}\n\n`
                        if (previewingTemplate.instruction) prompt += `Task: ${previewingTemplate.instruction}\n\n`
                        if (previewingTemplate.format) prompt += `Format: ${previewingTemplate.format}\n\n`
                        if (previewingTemplate.tone) prompt += `Tone: ${previewingTemplate.tone}\n\n`
                        if (previewingTemplate.inputData) prompt += `Reference Data: ${previewingTemplate.inputData}\n\n`
                        if (previewingTemplate.deeplyThinkAbout) prompt += `Deeply think about: ${previewingTemplate.deeplyThinkAbout}\n\n`
                        if (previewingTemplate.warning) prompt += `Warning/Restrictions: ${previewingTemplate.warning}\n\n`
                        if (previewingTemplate.askMe) prompt += `Ask me: ${previewingTemplate.askMe}\n\n`
                        prompt += '[Your specific question/request here]'
                        return prompt
                      })()
                      navigator.clipboard.writeText(fullPrompt)
                      toast.success('Prompt copied to clipboard!', {
                        position: 'top-right',
                        autoClose: 2000
                      })
                    }}
                    className="mt-2 px-3 py-1 bg-[#4a5a3a] hover:bg-[#5a6a4a] text-white text-xs rounded transition-colors"
                  >
                    Copy Prompt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowTemplateEditor(false)}>
          <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg shadow-2xl z-[10000] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-[#4a5a3a] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowTemplateEditor(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Back to templates"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <img src={templatesIcon} className="w-5 h-5" alt="Templates" />
                <h2 className="text-[#d7ff2f] font-medium text-lg">Create AI Template</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={saveCustomTemplate}
                  disabled={!templateForm.name.trim()}
                  className="bg-[#d7ff2f] hover:brightness-110 text-black px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Template
                </button>
                <button
                  onClick={() => setShowTemplateEditor(false)}
                  className="text-gray-400 hover:text-white px-2 py-1"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content Area - Split Layout */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Left Side - Form */}
              <div className="w-1/2 border-r border-[#4a5a3a] overflow-y-auto">
                <div className="p-6 space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-medium text-white mb-2">Design Your AI Assistant</h3>
                    <p className="text-gray-400 text-sm">Create a professional template for AI to understand your needs</p>
                  </div>

                  {/* Icon & Name Section */}
                  <div className="bg-[#1a1f0a] rounded-lg p-4 border border-[#4a5a3a]">
                    <h4 className="text-[#d7ff2f] font-medium mb-3 text-sm">Template Identity</h4>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg flex items-center justify-center text-2xl">
                          {templateForm.icon}
                        </div>
                        <input
                          type="text"
                          value={templateForm.icon}
                          onChange={(e) => setTemplateForm({ ...templateForm, icon: e.target.value })}
                          className="w-12 mt-1 bg-transparent border border-[#4a5a3a] rounded text-center text-xs text-white"
                          placeholder="🤖"
                          maxLength={2}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-gray-300 text-sm block mb-2">Template Name *</label>
                        <input
                          type="text"
                          placeholder="e.g., Code Review Assistant"
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                          className="w-full bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#d7ff2f] text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Persona Section */}
                  <div className="bg-[#1a1f0a] rounded-lg p-4 border border-[#4a5a3a]">
                    <h4 className="text-[#d7ff2f] font-medium mb-3 text-sm">AI Persona</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-gray-300 text-sm block mb-2">Act As (Role)</label>
                        <input
                          type="text"
                          placeholder="e.g., Expert Software Engineer, Creative Writer, Business Analyst"
                          value={templateForm.persona}
                          onChange={(e) => setTemplateForm({ ...templateForm, persona: e.target.value })}
                          className="w-full bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#d7ff2f] text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-gray-300 text-sm block mb-2">Format</label>
                          <select
                            value={templateForm.format}
                            onChange={(e) => setTemplateForm({ ...templateForm, format: e.target.value })}
                            className="w-full bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#d7ff2f] text-sm"
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
                          <label className="text-gray-300 text-sm block mb-2">Tone</label>
                          <select
                            value={templateForm.tone}
                            onChange={(e) => setTemplateForm({ ...templateForm, tone: e.target.value })}
                            className="w-full bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#d7ff2f] text-sm"
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
                    </div>
                  </div>

                  {/* Context & Instructions */}
                  <div className="bg-[#1a1f0a] rounded-lg p-4 border border-[#4a5a3a]">
                    <h4 className="text-[#d7ff2f] font-medium mb-3 text-sm">Context & Instructions</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-gray-300 text-sm block mb-2">Context/Background</label>
                        <textarea
                          placeholder="Describe the situation, domain, or background context..."
                          value={templateForm.context}
                          onChange={(e) => setTemplateForm({ ...templateForm, context: e.target.value })}
                          className="w-full bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#d7ff2f] text-sm resize-none"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm block mb-2">Main Task/Instruction</label>
                        <input
                          type="text"
                          placeholder="e.g., Analyze, Generate, Write, Review, Explain..."
                          value={templateForm.instruction}
                          onChange={(e) => setTemplateForm({ ...templateForm, instruction: e.target.value })}
                          className="w-full bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#d7ff2f] text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="bg-[#1a1f0a] rounded-lg p-4 border border-[#4a5a3a]">
                    <h4 className="text-[#d7ff2f] font-medium mb-3 text-sm">Advanced Configuration</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-gray-300 text-sm block mb-2">Focus Areas (Think Deeply About)</label>
                        <textarea
                          placeholder="What should AI focus on? Key considerations, quality aspects..."
                          value={templateForm.deeplyThinkAbout}
                          onChange={(e) => setTemplateForm({ ...templateForm, deeplyThinkAbout: e.target.value })}
                          className="w-full bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#d7ff2f] text-sm resize-none"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm block mb-2">Restrictions/Warnings</label>
                        <textarea
                          placeholder="What to avoid, limitations, important restrictions..."
                          value={templateForm.warning}
                          onChange={(e) => setTemplateForm({ ...templateForm, warning: e.target.value })}
                          className="w-full bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#d7ff2f] text-sm resize-none"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm block mb-2">Questions to Ask User</label>
                        <textarea
                          placeholder="What additional details should AI request from the user?"
                          value={templateForm.askMe}
                          onChange={(e) => setTemplateForm({ ...templateForm, askMe: e.target.value })}
                          className="w-full bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#d7ff2f] text-sm resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Preview */}
              <div className="w-1/2 bg-[#1a1f0a] overflow-y-auto">
                <div className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-medium text-white mb-2">Live Preview</h3>
                    <p className="text-gray-400 text-sm">See how your template will appear</p>
                  </div>

                  {/* Template Preview Card */}
                  <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-[#1a1f0a] border border-[#4a5a3a] rounded-lg flex items-center justify-center text-xl">
                        {templateForm.icon}
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm">
                          {templateForm.name || 'Template Name'}
                        </h4>
                        <p className="text-gray-400 text-xs">
                          {templateForm.persona || 'AI Assistant Role'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      {templateForm.context && (
                        <div>
                          <span className="text-[#d7ff2f] font-medium">Context: </span>
                          <span className="text-gray-300">{templateForm.context}</span>
                        </div>
                      )}
                      {templateForm.instruction && (
                        <div>
                          <span className="text-[#d7ff2f] font-medium">Task: </span>
                          <span className="text-gray-300">{templateForm.instruction}</span>
                        </div>
                      )}
                      <div className="flex gap-4">
                        <div>
                          <span className="text-[#d7ff2f] font-medium">Format: </span>
                          <span className="text-gray-300 capitalize">{templateForm.format.replace('-', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-[#d7ff2f] font-medium">Tone: </span>
                          <span className="text-gray-300 capitalize">{templateForm.tone}</span>
                        </div>
                      </div>
                      {templateForm.deeplyThinkAbout && (
                        <div>
                          <span className="text-[#d7ff2f] font-medium">Focus: </span>
                          <span className="text-gray-300">{templateForm.deeplyThinkAbout}</span>
                        </div>
                      )}
                      {templateForm.warning && (
                        <div>
                          <span className="text-red-400 font-medium">⚠️ Restrictions: </span>
                          <span className="text-gray-300">{templateForm.warning}</span>
                        </div>
                      )}
                      {templateForm.askMe && (
                        <div>
                          <span className="text-blue-400 font-medium">❓ Will Ask: </span>
                          <span className="text-gray-300">{templateForm.askMe}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Generated Prompt Preview */}
                  <div className="bg-[#2a2f1a] border border-[#4a5a3a] rounded-lg p-4">
                    <h4 className="text-[#d7ff2f] font-medium mb-3 text-sm">Generated Prompt Preview</h4>
                    <div className="bg-[#1a1f0a] rounded p-3 text-xs text-gray-300 font-mono leading-relaxed max-h-60 overflow-y-auto">
                      {(() => {
                        let prompt = ''
                        if (templateForm.persona) prompt += `Act as: ${templateForm.persona}\n\n`
                        if (templateForm.context) prompt += `Context: ${templateForm.context}\n\n`
                        if (templateForm.instruction) prompt += `Task: ${templateForm.instruction}\n\n`
                        if (templateForm.format) prompt += `Format: ${templateForm.format}\n\n`
                        if (templateForm.tone) prompt += `Tone: ${templateForm.tone}\n\n`
                        if (templateForm.deeplyThinkAbout) prompt += `Deeply think about: ${templateForm.deeplyThinkAbout}\n\n`
                        if (templateForm.warning) prompt += `Warning/Restrictions: ${templateForm.warning}\n\n`
                        if (templateForm.askMe) prompt += `Ask me: ${templateForm.askMe}\n\n`
                        prompt += '[Your specific question/request here]'
                        return prompt || 'Start filling the form to see the generated prompt...'
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Model Selector Modal */}
      {showMobileModelSelector && isMobile && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-end md:hidden"
          onClick={() => setShowMobileModelSelector(false)}
        >
          <div 
            className="w-full bg-[#1a1b21] border-t-2 border-[#d7ff2f] rounded-t-3xl max-h-[70vh] overflow-hidden flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-[#d7ff2f] font-semibold text-lg">Model & Settings</h3>
              <button
                onClick={() => setShowMobileModelSelector(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Mode Selection - Auto/Manual */}
              <div>
                <label className="text-gray-300 text-sm font-medium mb-3 block">Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('auto')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                      mode === 'auto'
                        ? 'bg-[#d7ff2f] border-[#d7ff2f] text-black'
                        : 'bg-transparent border-gray-600 text-gray-300 hover:border-[#d7ff2f]/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Auto</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setMode('manual')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                      mode === 'manual'
                        ? 'bg-[#d7ff2f] border-[#d7ff2f] text-black'
                        : 'bg-transparent border-gray-600 text-gray-300 hover:border-[#d7ff2f]/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span>Manual</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="text-gray-300 text-sm font-medium mb-3 block">Select AI Model</label>
                <div className="space-y-2">
                  {aiModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model)
                        setTimeout(() => setShowMobileModelSelector(false), 300)
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedModel.id === model.id
                          ? 'bg-[#d7ff2f]/10 border-[#d7ff2f] shadow-lg'
                          : 'bg-[#0a0b0e] border-gray-700 hover:border-[#d7ff2f]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            model.name?.includes('Claude') ? 'bg-[#CC785C]' :
                            model.name?.includes('GPT') ? 'bg-white' :
                            model.name?.includes('Gemini') ? 'bg-gradient-to-br from-blue-500 to-purple-600' :
                            'bg-gradient-to-br from-green-500 to-blue-500'
                          }`}>
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-white">{model.name}</div>
                            <div className="text-xs text-gray-400">{model.provider}</div>
                          </div>
                        </div>
                        {selectedModel.id === model.id && (
                          <div className="w-6 h-6 rounded-full bg-[#d7ff2f] flex items-center justify-center">
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AIChat