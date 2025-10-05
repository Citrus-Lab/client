import { useState } from 'react'
import { api } from '../config/api'

const ApiTest = () => {
  const [testResult, setTestResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    setIsLoading(true)
    setTestResult('')
    
    try {
      const result = await api.healthCheck()
      setTestResult(`✅ Success: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testChat = async () => {
    setIsLoading(true)
    setTestResult('')
    
    try {
      const result = await api.chat('Hello, this is a test message', 'gpt-4', 'manual')
      setTestResult(`✅ Chat Success: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      setTestResult(`❌ Chat Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
      <h3 className="text-white font-medium mb-4">API Connection Test</h3>
      
      <div className="space-y-3 mb-4">
        <button
          onClick={testConnection}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-all"
        >
          {isLoading ? 'Testing...' : 'Test Health Check'}
        </button>
        
        <button
          onClick={testChat}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-all ml-2"
        >
          {isLoading ? 'Testing...' : 'Test Chat API'}
        </button>
      </div>
      
      {testResult && (
        <div className="bg-gray-900 p-3 rounded border border-gray-600">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
            {testResult}
          </pre>
        </div>
      )}
    </div>
  )
}

export default ApiTest