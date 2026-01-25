import { useNavigate } from 'react-router-dom'
import { Icon } from '../../shared/Icon'
import { Button } from '../../shared/Button'

interface CompletionOverlayProps {
  isOpen: boolean
  quizScore?: { answered: number; total: number }
  onReplay: () => void
  onNewMaterial?: () => void
}

export function CompletionOverlay({ isOpen, quizScore, onReplay, onNewMaterial }: CompletionOverlayProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleChooseAnotherTopic = () => {
    navigate('/topics')
  }

  const handleNewMaterial = () => {
    if (onNewMaterial) {
      onNewMaterial()
    } else {
      navigate('/')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="check_circle" className="text-5xl text-success" filled />
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Lesson Complete! 🎉
        </h2>

        {/* Quiz Summary */}
        {quizScore && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You answered {quizScore.answered} out of {quizScore.total} questions
          </p>
        )}

        {!quizScore && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Great job! You've completed the entire lesson.
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={onReplay} variant="primary" className="w-full">
            <Icon name="replay" className="mr-2" />
            Replay Lesson
          </Button>
          
          <Button onClick={handleChooseAnotherTopic} variant="outline" className="w-full">
            <Icon name="topic" className="mr-2" />
            Choose Another Topic
          </Button>
          
          <Button onClick={handleNewMaterial} variant="outline" className="w-full">
            <Icon name="home" className="mr-2" />
            New Material
          </Button>
        </div>
      </div>
    </div>
  )
}
