import { Icon } from '../../shared/Icon'
import { Button } from '../../shared/Button'

interface ErrorOverlayProps {
  message: string
  onRetry: () => void
  onGoBack: () => void
}

export function ErrorOverlay({ message, onRetry, onGoBack }: ErrorOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-danger/20 max-w-md w-full p-8 text-center shadow-2xl">
        <Icon name="error" className="text-6xl text-danger mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Something went wrong
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onRetry} variant="primary" className="flex-1">
            <Icon name="refresh" className="mr-2" />
            Retry
          </Button>
          <Button onClick={onGoBack} variant="outline" className="flex-1">
            <Icon name="arrow_back" className="mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}
