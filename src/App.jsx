import './index.css'
import AIChat from './components/AIChat'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <div className="w-full h-screen overflow-hidden bg-gray-900 fixed inset-0">
        <AIChat />
      </div>
    </ErrorBoundary>
  )
}

export default App