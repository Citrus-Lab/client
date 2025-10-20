import { useRef } from 'react'
import citrusIconDark from '../assets/citrus-icon-dark.png'

const SearchBar = ({
  input,
  setInput,
  onSubmit,
  isLoading,
  mode,
  setMode,
  showModelSelector,
  setShowModelSelector,
  modelButtonRef,
  selectedModelIcon,
  snippets = [],
  addSnippetFromInput,
  removeSnippet,
  setPreviewSnippetIndex,
  snippetTrayHeight = 0,
  snippetTrayRef,
  isCentered = false, // true for initial state, false for bottom
  chatMode = 'normal' // 'normal' or 'engineer'
}) => {
  const textareaRef = useRef(null)

  // Helper function to count words in input
  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Enhanced function to determine search bar size based on word count
  const getSearchBarSize = () => {
    const wordCount = getWordCount(input)
    if (wordCount === 0) return 'empty'
    if (wordCount <= 3) return 'compact'
    if (wordCount <= 8) return 'medium'
    return 'expanded'
  }

  // Get dynamic styles based on search bar size
  const getSearchBarStyles = () => {
    const size = getSearchBarSize()

    if (isCentered) {
      // Centered (initial) state - larger
      switch (size) {
        case 'empty':
          return {
            minHeight: '180px',
            textareaRows: 4,
            textareaMinHeight: '120px',
            textareaMaxHeight: '120px',
            fontSize: 'text-base'
          }
        case 'compact':
          return {
            minHeight: '200px',
            textareaRows: 5,
            textareaMinHeight: '140px',
            textareaMaxHeight: '140px',
            fontSize: 'text-base'
          }
        case 'medium':
          return {
            minHeight: '280px',
            textareaRows: 8,
            textareaMinHeight: '200px',
            textareaMaxHeight: '240px',
            fontSize: 'text-base'
          }
        case 'expanded':
          return {
            minHeight: '360px',
            textareaRows: 12,
            textareaMinHeight: '280px',
            textareaMaxHeight: '320px',
            fontSize: 'text-base'
          }
        default:
          return {
            minHeight: '180px',
            textareaRows: 4,
            textareaMinHeight: '120px',
            textareaMaxHeight: '120px',
            fontSize: 'text-base'
          }
      }
    } else {
      // Bottom state - more compact
      switch (size) {
        case 'empty':
          return {
            minHeight: '80px',
            textareaRows: 2,
            textareaMinHeight: '40px',
            textareaMaxHeight: '80px',
            fontSize: 'text-sm'
          }
        case 'compact':
          return {
            minHeight: '90px',
            textareaRows: 2,
            textareaMinHeight: '45px',
            textareaMaxHeight: '90px',
            fontSize: 'text-sm'
          }
        case 'medium':
          return {
            minHeight: '120px',
            textareaRows: 3,
            textareaMinHeight: '60px',
            textareaMaxHeight: '120px',
            fontSize: 'text-base'
          }
        case 'expanded':
          return {
            minHeight: '160px',
            textareaRows: 5,
            textareaMinHeight: '100px',
            textareaMaxHeight: '180px',
            fontSize: 'text-base'
          }
        default:
          return {
            minHeight: '80px',
            textareaRows: 2,
            textareaMinHeight: '40px',
            textareaMaxHeight: '80px',
            fontSize: 'text-sm'
          }
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(e)
  }

  const styles = getSearchBarStyles()

  return (
    <form onSubmit={handleSubmit} className={`relative ${isCentered ? 'mx-auto w-full max-w-3xl' : 'w-full max-w-4xl mx-auto'}`}>
      <div
        className={`rounded-3xl citrus-neon-border-strong bg-black/60 relative dynamic-search-container search-bar-transition search-bar-${getSearchBarSize()}`}
        style={{
          minHeight: snippets.length > 0
            ? `${Math.max(parseInt(styles.minHeight), 360)}px`
            : styles.minHeight
        }}
      >
        {/* Textarea container */}
        <div
          className={`${isCentered ? 'px-6 pt-6' : 'px-6 pt-4'} flex flex-col transition-all duration-500 ease-in-out`}
          style={{ paddingBottom: `${(snippetTrayHeight || 0) + (isCentered ? 112 : 72)}px` }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (isCentered && e.ctrlKey && e.key === 'Enter') {
                e.preventDefault()
                addSnippetFromInput?.()
              } else if (!isCentered && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder={isCentered ? "Describe your idea..." : "Describe your idea. will make it real."}
            rows={styles.textareaRows}
            className={`w-full bg-transparent outline-none resize-none ${styles.fontSize} text-white placeholder-gray-400 dynamic-search-textarea overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent`}
            style={{
              minHeight: styles.textareaMinHeight,
              maxHeight: styles.textareaMaxHeight
            }}
            disabled={isLoading}
          />
        </div>

        {/* Controls positioned with proper spacing */}
        <div
          className="absolute left-6 right-5 flex items-center justify-between"
          style={{ bottom: snippets.length > 0 ? `${(snippetTrayHeight || 0) + 24}px` : isCentered ? '2rem' : '1.5rem' }}
        >
          <div className="control-group">
            {/* Model selector button */}
            <button
              ref={modelButtonRef}
              type="button"
              disabled={mode === 'auto'}
              onClick={() => {
                if (mode === 'manual') {
                  console.log('Models button clicked, current state:', showModelSelector)
                  setShowModelSelector(!showModelSelector)
                }
              }}
              className={`pill model-selector-container group transition-all duration-200 ${mode === 'auto'
                ? 'opacity-50 cursor-not-allowed bg-gray-700 text-gray-400 border-gray-600'
                : 'hover:bg-[#d7ff2f] hover:text-black hover:brightness-110 active:scale-95 hover:shadow-[0_0_8px_rgba(215,255,47,0.3)] hover:border-[rgba(215,255,47,0.6)] hover:text-shadow-sm cursor-pointer'
                }`}
              style={{
                textShadow: mode === 'manual' ? 'var(--hover-text-shadow, none)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (mode === 'manual') {
                  e.target.style.setProperty('--hover-text-shadow', '0 0 4px rgba(215,255,47,0.8)')
                }
              }}
              onMouseLeave={(e) => {
                if (mode === 'manual') {
                  e.target.style.setProperty('--hover-text-shadow', 'none')
                }
              }}
              title={mode === 'auto' ? 'Model selection is automatic in Auto mode' : 'Select AI model'}
            >
              {/* Official Model icon */}
              {selectedModelIcon || (
                <div className="w-4 h-4 rounded-sm bg-gray-600 flex items-center justify-center">
                  <span className="text-white text-xs">✳</span>
                </div>
              )}

              {/* Models text */}
              <span>Models</span>
            </button>

            {/* Auto/Manual toggle - always use segment group */}
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

            {/* Save snippet button (only in centered mode) */}
            {isCentered && (
              <button
                type="button"
                onClick={addSnippetFromInput}
                disabled={!input.trim() || snippets.length >= 10}
                className={`pill ${!input.trim() || snippets.length >= 10 ? 'pill-disabled' : 'pill-accent'}`}
                title="Save as mini snippet"
              >
                Save snippet
              </button>
            )}
          </div>

          {/* Send/Output button - positioned on the right side */}
          {isCentered && (
            <button
              type="submit"
              disabled={!input.trim() && snippets.length === 0}
              className="group px-3 py-1.5 citrus-accent-bg text-black text-xs rounded transition-all duration-200 hover:brightness-110 font-medium disabled:opacity-60 disabled:cursor-not-allowed z-10 active:scale-95 flex items-center space-x-1.5 relative overflow-hidden focus:outline-none focus:ring-0"
              title={chatMode === 'engineer' ? 'Output' : 'Send'}
            >
              {/* Inner shiny white effect - two tilted lines */}
              <div className="absolute inset-0 opacity-60">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 translate-x-2"></div>
                <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 -translate-x-2"></div>
              </div>

              <span className="relative z-10">{chatMode === 'engineer' ? 'Output' : 'Send'}</span>

              {/* Simple paper plane animation */}
              <div className="relative z-10 group-hover:translate-x-0.5 group-active:translate-x-1 transition-transform duration-200 ease-out">
                {chatMode === 'engineer' ? (
                  <span className="text-xs font-bold">→</span>
                ) : (
                  <img
                    src={citrusIconDark}
                    alt="Send"
                    className="w-3.5 h-3.5"
                  />
                )}
              </div>
            </button>
          )}
        </div>

        {/* Snippets area with curved border */}
        {snippets.length > 0 && (
          <div ref={snippetTrayRef} className="absolute left-0 right-0" style={{ bottom: '0px' }}>
            <div className="rounded-2xl border-2 border-[rgba(215,255,47,0.6)] bg-black/40 p-4">
              <div className="flex flex-wrap gap-2">
                {snippets.map((snip, idx) => (
                  <div key={snip.id} className="relative group">
                    <div className="w-24 h-24 rounded-lg bg-black/80 border-2 border-[rgba(215,255,47,0.6)] p-2 cursor-pointer hover:border-[rgba(215,255,47,0.8)] hover:bg-black/90 transition-all shadow-sm">
                      <div className="text-[11px] text-gray-200 leading-tight overflow-hidden h-full font-mono">
                        {snip.text.substring(0, 80)}...
                      </div>
                    </div>
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeSnippet?.(snip.id)}
                      title="Remove"
                    >
                      ×
                    </button>
                    <button
                      type="button"
                      className="absolute -bottom-1 left-0 right-0 text-[9px] bg-[var(--citrus-accent)] text-black hover:brightness-110 rounded-b-lg px-1 py-0.5 font-medium transition-all"
                      onClick={() => setPreviewSnippetIndex?.(idx)}
                    >
                      Preview
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send/Output button for bottom state only */}
      {!isCentered && (
        <button
          type="submit"
          disabled={!input.trim() && snippets.length === 0}
          className="group absolute right-6 px-3 py-1.5 citrus-accent-bg text-black text-xs rounded transition-all duration-200 hover:brightness-110 font-medium disabled:opacity-60 disabled:cursor-not-allowed z-10 active:scale-95 flex items-center space-x-1.5"
          style={{ bottom: snippets.length > 0 ? `${(snippetTrayHeight || 0) + 24}px` : '1.5rem' }}
          title={chatMode === 'engineer' ? 'Output' : 'Send'}
        >
          <span>{chatMode === 'engineer' ? 'Output' : 'Send'}</span>

          {/* Simple paper plane animation */}
          <div className="group-hover:translate-x-0.5 group-active:translate-x-1 transition-transform duration-200 ease-out">
            {chatMode === 'engineer' ? (
              <span className="text-xs font-bold">→</span>
            ) : (
              <img
                src={citrusIconDark}
                alt="Send"
                className="w-3.5 h-3.5"
              />
            )}
          </div>
        </button>
      )}
    </form>
  )
}

export default SearchBar
