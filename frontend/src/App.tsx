import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from './features/landing'
import { SourceSelection } from './features/source'
import { ProcessingScreen } from './features/processing'
import { TopicSelection } from './features/topics'
import { Workspace } from './features/workspace'
import { ErrorBoundary } from './shared/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/select-source" element={<SourceSelection />} />
        <Route path="/processing" element={<ProcessingScreen />} />
        <Route path="/topics" element={<TopicSelection />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
