import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ProgressIndicator } from './ProgressIndicator'
import { ErrorOverlay } from './ErrorOverlay'
import { Button } from '../../shared/Button'
import { Icon } from '../../shared/Icon'
import { useAnalyzeUrl, useAnalyzePdf } from '../../hooks/useAnalyzeContent'
import { useGenerateLesson } from '../../hooks/useGenerateLesson'
import { useLessonStore } from '../../stores/lessonStore'

type ProcessingStage = 'analysis' | 'generation'

interface LocationState {
  stage: ProcessingStage
  source?: string | File
  topicId?: string
  topicText?: string
}

export function ProcessingScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState
  const { setLesson } = useLessonStore()

  const [error, setError] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Mutations for analysis
  const analyzeUrlMutation = useAnalyzeUrl()
  const analyzePdfMutation = useAnalyzePdf()
  
  // Mutation for generation
  const generateLessonMutation = useGenerateLesson()

  // Redirect if no state or invalid state
  useEffect(() => {
    if (!state || !state.stage) {
      navigate('/', { replace: true })
      return
    }
    
    if (state.stage === 'analysis' && !state.source) {
      navigate('/', { replace: true })
      return
    }
    
    if (state.stage === 'generation' && (!state.topicId || !state.topicText)) {
      navigate('/', { replace: true })
      return
    }
  }, [state, navigate])

  const stageConfigs = {
    analysis: {
      stages: [
        'Connecting to Librarian Agent...',
        'Parsing Semantic Structure...',
        'Identifying Key Topics...',
      ],
      duration: 4, // 3-5 seconds
      successRoute: '/topics',
    },
    generation: {
      stages: [
        'Activating Image Steering Agent...',
        'Synthesizing Assets...',
        'Director Composing Scene Plan...',
        'Generating Audio Narration...',
        'Finalizing Lesson Manifest...',
      ],
      duration: 50, // 45-60 seconds
      successRoute: '/workspace',
    },
  }

  const currentConfig = state?.stage ? stageConfigs[state.stage] : stageConfigs.analysis

  // Invoke mutations on mount based on stage
  useEffect(() => {
    if (!state) return

    if (state.stage === 'analysis' && state.source) {
      // Detect if source is File or string
      if (state.source instanceof File) {
        analyzePdfMutation.mutate(state.source)
      } else {
        analyzeUrlMutation.mutate(state.source)
      }
    } else if (state.stage === 'generation' && state.topicText) {
      generateLessonMutation.mutate(state.topicText)
    }
  }, []) // Empty dependency array - only run on mount

  // Handle analysis success
  useEffect(() => {
    if (analyzeUrlMutation.isSuccess && analyzeUrlMutation.data) {
      navigate('/topics', {
        state: {
          topics: analyzeUrlMutation.data.topics.map((topic) => ({
            id: topic.id,
            title: topic.title,
            description: topic.focus,
            tags: topic.keyVisuals.slice(0, 3),
            duration: '5-8 min',
            isRecommended: topic.visualPotentialScore > 0.8,
            topicText: `${topic.title}. ${topic.focus}. ${topic.hook}`,
          })),
        },
      })
    }
  }, [analyzeUrlMutation.isSuccess, analyzeUrlMutation.data, navigate])

  useEffect(() => {
    if (analyzePdfMutation.isSuccess && analyzePdfMutation.data) {
      navigate('/topics', {
        state: {
          topics: analyzePdfMutation.data.topics.map((topic) => ({
            id: topic.id,
            title: topic.title,
            description: topic.focus,
            tags: topic.keyVisuals.slice(0, 3),
            duration: '5-8 min',
            isRecommended: topic.visualPotentialScore > 0.8,
            topicText: `${topic.title}. ${topic.focus}. ${topic.hook}`,
          })),
        },
      })
    }
  }, [analyzePdfMutation.isSuccess, analyzePdfMutation.data, navigate])

  // Handle generation success
  useEffect(() => {
    if (generateLessonMutation.isSuccess && generateLessonMutation.data) {
      // Store lesson in Zustand store first
      setLesson(generateLessonMutation.data.lessonManifest, generateLessonMutation.data.audioUrl)
      
      // Then navigate to workspace
      navigate('/workspace', {
        state: {
          lessonId: generateLessonMutation.data.lessonManifest.scenes[0]?.sceneId || 'lesson_1',
        },
      })
    }
  }, [generateLessonMutation.isSuccess, generateLessonMutation.data, setLesson, navigate])

  // Handle errors from mutations
  useEffect(() => {
    if (analyzeUrlMutation.isError) {
      setError(analyzeUrlMutation.error.message || 'Failed to analyze URL. Please try again.')
    }
  }, [analyzeUrlMutation.isError, analyzeUrlMutation.error])

  useEffect(() => {
    if (analyzePdfMutation.isError) {
      setError(analyzePdfMutation.error.message || 'Failed to analyze PDF. Please try again.')
    }
  }, [analyzePdfMutation.isError, analyzePdfMutation.error])

  useEffect(() => {
    if (generateLessonMutation.isError) {
      setError(generateLessonMutation.error.message || 'Failed to generate lesson. Please try again.')
    }
  }, [generateLessonMutation.isError, generateLessonMutation.error])

  const handleBack = () => {
    if (state?.stage === 'generation') {
      setShowCancelDialog(true)
    } else {
      navigate(-1)
    }
  }

  const handleConfirmCancel = () => {
    setShowCancelDialog(false)
    navigate('/')
  }

  const handleRetry = () => {
    setError(null)
    
    // Retry the appropriate mutation based on stage and source
    if (state.stage === 'analysis' && state.source) {
      if (state.source instanceof File) {
        analyzePdfMutation.mutate(state.source)
      } else {
        analyzeUrlMutation.mutate(state.source)
      }
    } else if (state.stage === 'generation' && state.topicText) {
      generateLessonMutation.mutate(state.topicText)
    }
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  if (!state) {
    return null
  }

  const title = state.stage === 'analysis' ? 'Analyzing Content...' : 'Generating Lesson...'
  const icon = state.stage === 'analysis' ? 'library_books' : 'brush'

  return (
    <div className="h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent dark:from-indigo-900/20"></div>
      
      <div className="relative z-10 text-center max-w-xl w-full">
        {/* Spinning Border Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-6 sm:mb-8 relative">
          <div className="absolute inset-0 border-4 border-indigo-DEFAULT rounded-3xl animate-[spin_3s_linear_infinite]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 20%, 0 20%)' }}></div>
          <Icon name={icon} className="text-3xl sm:text-4xl text-indigo-DEFAULT animate-pulse" filled />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-text-main dark:text-white mb-4 animate-slide-up">
          {title}
        </h2>

        <div className="space-y-3 max-w-sm mx-auto text-left">
          {currentConfig.stages.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-text-muted dark:text-text-muted-dark animate-slide-up"
              style={{ animationDelay: `${0.2 + (i * 0.5)}s` }}
            >
              <div className="w-5 h-5 min-w-[20px] rounded-full border-2 border-primary flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
              </div>
              <span className="font-mono text-sm">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Overlay */}
      {error && <ErrorOverlay message={error} onRetry={handleRetry} onGoBack={handleGoBack} />}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-background-card-dark rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
            <Icon name="warning" className="text-6xl text-warning mx-auto mb-4" />
            
            <h2 className="text-2xl font-bold text-text-main dark:text-white mb-3">
              Cancel Generation?
            </h2>
            
            <p className="text-text-muted dark:text-text-muted-dark mb-6">
              Generation in progress. Are you sure you want to cancel? Your progress will be lost.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowCancelDialog(false)} className="btn-primary bg-gray-500 hover:bg-gray-600 flex-1">
                Continue
              </button>
              <button onClick={handleConfirmCancel} className="btn-primary flex-1">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
