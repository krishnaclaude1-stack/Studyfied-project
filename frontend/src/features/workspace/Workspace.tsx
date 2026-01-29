import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LessonPlayer } from '../player'
import { Toolbar } from './Toolbar'
import { LayerControls } from './LayerControls'
import { CompletionOverlay } from './CompletionOverlay'
import { useLessonStore } from '../../stores/lessonStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useSessionHydration } from '../../hooks/useSessionHydration'
import { SessionWarning } from '../../shared/SessionWarning'
import { clearAllSessions } from '../../lib/session'
import type { LessonManifest } from '../../types/lesson'
import { VisualEventType, Zone, Role, ScaleHint, InteractionType } from '../../types/lesson'

interface LocationState {
  lessonId?: string
}

export function Workspace() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState

  const { lessonManifest, setLesson } = useLessonStore()
  const { currentTime, duration, reset } = usePlayerStore()
  const { transcriptOpen, setTranscriptOpen, setLessonId, clearSession } = useSessionStore()
  
  const [scribbleMode, setScribbleMode] = useState(false)
  const [layerControlsOpen, setLayerControlsOpen] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  // Generate lessonId from location or use a default for mock lessons
  const lessonId = state?.lessonId || 'mock-lesson-1'

  // Session hydration with tab conflict detection
  const { isHydrating, hasTabConflict, isStale, claimOwnership } = useSessionHydration({
    lessonId,
    audioDuration: duration,
    onTabConflict: () => setShowWarning(true),
  })

  // Set lessonId in session store
  useEffect(() => {
    setLessonId(lessonId)
    return () => {
      // Clear session on unmount (component cleanup)
      setLessonId(null)
    }
  }, [lessonId]) // Remove setLessonId from dependencies - it's stable from Zustand

  // Load mock lesson if not already loaded
  useEffect(() => {
    if (!lessonManifest) {
      // Generate a silent audio blob for testing
      const generateSilentAudio = (): string => {
        const sampleRate = 44100
        const duration = 10
        const numChannels = 1
        const numFrames = sampleRate * duration
        
        const buffer = new ArrayBuffer(44 + numFrames * 2)
        const view = new DataView(buffer)
        
        const writeString = (offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
          }
        }
        
        writeString(0, 'RIFF')
        view.setUint32(4, 36 + numFrames * 2, true)
        writeString(8, 'WAVE')
        writeString(12, 'fmt ')
        view.setUint32(16, 16, true)
        view.setUint16(20, 1, true)
        view.setUint16(22, numChannels, true)
        view.setUint32(24, sampleRate, true)
        view.setUint32(28, sampleRate * 2, true)
        view.setUint16(32, 2, true)
        view.setUint16(34, 16, true)
        writeString(36, 'data')
        view.setUint32(40, numFrames * 2, true)
        
        for (let i = 0; i < numFrames; i++) {
          view.setInt16(44 + i * 2, 0, true)
        }
        
        const blob = new Blob([buffer], { type: 'audio/wav' })
        return URL.createObjectURL(blob)
      }

      const mockLesson: LessonManifest = {
        lessonDurationSec: 10,
        scenes: [
          {
            sceneId: 'scene_1',
            purpose: 'Introduction to the topic',
            assetsUsed: ['asset_1', 'asset_2'],
            voiceover: [
              {
                text: 'Welcome to this interactive lesson. Today we will explore fascinating concepts.',
                checkpointId: 'checkpoint_1',
              },
              {
                text: 'Let me show you the key ideas with visual demonstrations.',
                checkpointId: 'checkpoint_2',
              },
            ],
            events: [
              {
                type: VisualEventType.FADE_IN,
                assetId: 'asset_1',
                checkpointId: 'checkpoint_1',
                zone: Zone.CENTER_MAIN,
                role: Role.PRIMARY_DIAGRAM,
                scaleHint: ScaleHint.LARGE,
                params: {
                  duration: 1.0,
                },
              },
              {
                type: VisualEventType.FADE_IN,
                assetId: 'asset_2',
                checkpointId: 'checkpoint_2',
                zone: Zone.LEFT_SUPPORT,
                role: Role.SUPPORTING_DIAGRAM,
                scaleHint: ScaleHint.MEDIUM,
                params: {
                  duration: 0.5,
                },
              },
            ],
            interaction: {
              type: InteractionType.QUIZ,
              prompt: 'What did you learn from this lesson?',
              options: ['Concept A', 'Concept B', 'Concept C'],
              correctAnswer: 'Concept A',
            },
          },
        ],
      }

      const mockAudioUrl = generateSilentAudio()
      setLesson(mockLesson, mockAudioUrl)
    }
  }, [lessonManifest]) // Remove setLesson from dependencies - it's stable from Zustand

  // Check for lesson completion
  useEffect(() => {
    if (currentTime >= duration && duration > 0 && !showCompletion) {
      setShowCompletion(true)
    }
  }, [currentTime, duration, showCompletion])

  // Redirect if no lesson
  useEffect(() => {
    if (!state?.lessonId && !lessonManifest) {
      // Allow time for mock lesson to load
      const timer = setTimeout(() => {
        if (!lessonManifest) {
          navigate('/', { replace: true })
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state, lessonManifest, navigate])

  const handleReplay = () => {
    setShowCompletion(false)
    reset()
    // Note: Replay keeps annotations (as per acceptance criteria)
  }

  const handleNewMaterial = () => {
    // Clear all sessions and navigate to home
    clearAllSessions()
    clearSession()
    navigate('/', { replace: true })
  }

  const handleClaimSession = () => {
    claimOwnership()
    setShowWarning(false)
  }

  const handleDismissWarning = () => {
    setShowWarning(false)
    navigate('/', { replace: true })
  }

  const lessonTitle = 'Interactive Whiteboard Lesson'

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Session Warning for Multi-tab Conflicts */}
      <SessionWarning
        isVisible={showWarning}
        isStale={isStale}
        onClaim={handleClaimSession}
        onDismiss={handleDismissWarning}
      />

      {/* Toolbar */}
      <Toolbar
        lessonTitle={lessonTitle}
        onLayerToggle={() => setLayerControlsOpen(!layerControlsOpen)}
        onScribbleToggle={() => setScribbleMode(!scribbleMode)}
        onTranscriptToggle={() => setTranscriptOpen(!transcriptOpen)}
        scribbleMode={scribbleMode}
        transcriptOpen={transcriptOpen}
      />

      {/* Layer Controls Dropdown */}
      <LayerControls
        isOpen={layerControlsOpen}
        onClose={() => setLayerControlsOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 pt-20 lg:pt-16">
        {isHydrating ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading session...</p>
            </div>
          </div>
        ) : lessonManifest ? (
          <LessonPlayer />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading lesson...</p>
            </div>
          </div>
        )}
      </div>

      {/* Completion Overlay */}
      <CompletionOverlay
        isOpen={showCompletion}
        onReplay={handleReplay}
        onNewMaterial={handleNewMaterial}
      />
    </div>
  )
}
