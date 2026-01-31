import { useEffect } from 'react'
import { LessonPlayer } from './features/player'
import { useLessonStore } from './stores/lessonStore'
import type { LessonManifest } from './types/lesson'
import { VisualEventType, Zone, Role, ScaleHint, InteractionType } from './types/lesson'

function App() {
  const { setLesson } = useLessonStore()

  useEffect(() => {
    // Mock lesson data for testing
    // TODO: Replace with API call to fetch lesson from backend
    const mockLesson: LessonManifest = {
      lessonDurationSec: 180,
      scenes: [
        {
          sceneId: 'scene_1',
          purpose: 'Introduction to the topic',
          assetsUsed: ['asset_1', 'asset_2'],
          voiceover: [
            {
              text: 'Welcome to this lesson. Today we will explore an interesting topic.',
              checkpointId: 'checkpoint_1',
            },
            {
              text: 'Let me show you the key concepts.',
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
            prompt: 'What did you learn?',
            options: ['Option A', 'Option B', 'Option C'],
            correctAnswer: 'Option A',
          },
        },
      ],
    }

    // Mock audio URL (would be blob URL from IndexedDB in real implementation)
    // Using a small silent audio file for testing
    const mockAudioUrl = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA=='

    // Load mock lesson for testing
    setLesson(mockLesson, mockAudioUrl)
  }, [setLesson])

  return (
    <div className="min-h-screen bg-gray-50">
      <LessonPlayer />
    </div>
  )
}

export default App
