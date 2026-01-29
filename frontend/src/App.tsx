import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { LandingPage } from './features/landing'
import { SourceSelection } from './features/source'
import { ProcessingScreen } from './features/processing'
import { TopicSelection } from './features/topics'
import { Workspace } from './features/workspace'
import { ApiSettingsPage } from './features/settings'
import { ErrorBoundary } from './shared/ErrorBoundary'
import { Button } from './shared/Button'

// Specific error fallback for settings page (handles IndexedDB corruption)
function SettingsErrorFallback() {
  const handleClearStorage = async () => {
    try {
      // Clear IndexedDB
      const databases = await window.indexedDB.databases()
      for (const db of databases) {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name)
        }
      }
      // Clear localStorage
      localStorage.clear()
      // Reload page
      window.location.href = '/settings'
    } catch (error) {
      console.error('Failed to clear storage:', error)
      alert('Failed to clear storage. Please try manually clearing your browser data.')
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-background-card-dark rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⚙️</div>
        <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2">
          Settings Error
        </h1>
        <p className="text-text-muted dark:text-text-muted-dark mb-6">
          There was a problem loading your settings. This might be due to corrupted browser storage.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={handleClearStorage} variant="primary">
            Clear Storage & Retry
          </Button>
          <Link to="/">
            <Button variant="outline" className="w-full">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/select-source" element={<SourceSelection />} />
        <Route path="/processing" element={<ProcessingScreen />} />
        <Route path="/topics" element={<TopicSelection />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route 
          path="/settings" 
          element={
            <ErrorBoundary fallback={<SettingsErrorFallback />}>
              <ApiSettingsPage />
            </ErrorBoundary>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
