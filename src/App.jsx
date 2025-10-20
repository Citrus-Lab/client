import './index.css'
import AIChat from './components/AIChat'
import InvitationPage from './components/InvitationPage'
import CollaborationTestPage from './pages/CollaborationTestPage'
import ErrorBoundary from './components/ErrorBoundary'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="w-full h-screen overflow-hidden bg-[#121318] fixed inset-0">
          <Routes>
            <Route path="/invitation/:token" element={<InvitationPage />} />
            <Route path="/share/:token" element={<InvitationPage />} />
            <Route path="/test/collaboration" element={<CollaborationTestPage />} />
            <Route path="/*" element={<AIChat />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            style={{
              zIndex: 99999
            }}
          />
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App