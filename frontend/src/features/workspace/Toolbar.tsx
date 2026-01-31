import { useNavigate } from 'react-router-dom'
import { Icon } from '../../shared/Icon'
import { Button } from '../../shared/Button'
import { usePlayerStore } from '../../stores/playerStore'

interface ToolbarProps {
  lessonTitle: string
  onLayerToggle: () => void
  onScribbleToggle: () => void
  onTranscriptToggle: () => void
  scribbleMode: boolean
  transcriptOpen: boolean
}

export function Toolbar({
  lessonTitle,
  onLayerToggle,
  onScribbleToggle,
  onTranscriptToggle,
  scribbleMode,
  transcriptOpen,
}: ToolbarProps) {
  const navigate = useNavigate()
  const { isPlaying, togglePlayPause, currentTime, duration } = usePlayerStore()

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleBack = () => {
    const confirmed = window.confirm('Are you sure you want to leave? Your progress will be lost.')
    if (confirmed) {
      navigate('/topics')
    }
  }

  return (
    <div className="fixed top-0 w-full bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back Button + Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Back to topics"
            >
              <Icon name="arrow_back" className="text-xl" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate hidden md:block">
              {lessonTitle}
            </h1>
          </div>

          {/* Center: Player Controls (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-full bg-primary hover:bg-primary/90 text-white transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <Icon name={isPlaying ? 'pause' : 'play_arrow'} className="text-2xl" filled />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Layer Toggle */}
            <button
              onClick={onLayerToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden sm:block"
              aria-label="Toggle layers"
            >
              <Icon name="layers" className="text-xl" />
            </button>

            {/* Scribble Mode */}
            <button
              onClick={onScribbleToggle}
              className={`p-2 rounded-lg transition-colors ${
                scribbleMode
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label="Toggle annotation mode"
            >
              <Icon name="edit" className="text-xl" />
            </button>

            {/* Transcript Toggle */}
            <button
              onClick={onTranscriptToggle}
              className={`p-2 rounded-lg transition-colors ${
                transcriptOpen
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label="Toggle transcript"
            >
              <Icon name="subject" className="text-xl" />
            </button>
          </div>
        </div>

        {/* Mobile Player Controls */}
        <div className="flex lg:hidden items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={togglePlayPause}
            className="p-2 rounded-full bg-primary hover:bg-primary/90 text-white transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <Icon name={isPlaying ? 'pause' : 'play_arrow'} className="text-xl" filled />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
