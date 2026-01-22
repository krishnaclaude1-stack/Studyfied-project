import { useEffect, useState } from 'react'
import { LoadingSpinner } from '../../shared/LoadingSpinner'

interface ProgressIndicatorProps {
  stages: string[]
  estimatedDuration: number // in seconds
}

export function ProgressIndicator({ stages, estimatedDuration }: ProgressIndicatorProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const stageInterval = estimatedDuration / stages.length
    const progressInterval = 100 // Update progress every 100ms

    // Update stage
    const stageTimer = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, stageInterval * 1000)

    // Update progress bar
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) {
          return Math.min(prev + (100 / (estimatedDuration * 10)), 100)
        }
        return prev
      })
    }, progressInterval)

    return () => {
      clearInterval(stageTimer)
      clearInterval(progressTimer)
    }
  }, [stages, estimatedDuration])

  return (
    <div className="w-full max-w-md">
      <LoadingSpinner size="lg" />
      
      <div className="mt-8">
        {/* Current Stage */}
        <p className="text-xl font-medium text-gray-900 dark:text-white text-center mb-6 animate-pulse">
          {stages[currentStageIndex]}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage Steps */}
        <div className="mt-6 space-y-2">
          {stages.map((stage, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 text-sm transition-opacity ${
                index === currentStageIndex
                  ? 'text-primary font-medium opacity-100'
                  : index < currentStageIndex
                  ? 'text-success opacity-70'
                  : 'text-gray-400 dark:text-gray-600 opacity-50'
              }`}
            >
              {index < currentStageIndex ? (
                <span className="material-symbols-outlined text-success text-lg">check_circle</span>
              ) : index === currentStageIndex ? (
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
              )}
              <span>{stage}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
