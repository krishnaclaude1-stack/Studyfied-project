import { useEffect, useState } from 'react'

interface HealthCheckResponse {
  status: string
  timestamp: string
}

function App() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: HealthCheckResponse = await response.json()
        setHealth(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to backend')
        setHealth(null)
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Studyfied
        </h1>
        
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Backend Health Check
          </h2>
          
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Checking backend...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-2">✗</span>
                <div>
                  <p className="font-medium text-red-800">Connection Failed</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {health && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <span className="text-green-500 text-xl mr-2">✓</span>
                <div>
                  <p className="font-medium text-green-800">Backend Connected</p>
                  <p className="text-sm text-green-600">
                    Status: {health.status}
                  </p>
                  <p className="text-sm text-green-600">
                    Timestamp: {health.timestamp}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Frontend: Vite + React + TypeScript</p>
          <p>Backend: FastAPI + Python</p>
        </div>
      </div>
    </div>
  )
}

export default App
