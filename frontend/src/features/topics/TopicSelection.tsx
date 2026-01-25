import { useLocation, useNavigate } from 'react-router-dom'
import { TopicCard, Topic } from './TopicCard'
import { Button } from '../../shared/Button'
import { Icon } from '../../shared/Icon'
import { Navbar } from '../../shared/Navbar'

interface LocationState {
  topics?: Topic[]
}

export function TopicSelection() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState

  const topics = state?.topics || []

  const handleTopicSelect = (topicId: string) => {
    const selectedTopic = topics.find(t => t.id === topicId)
    navigate('/processing', {
      state: {
        stage: 'generation',
        topicId,
        topicText: selectedTopic?.topicText || selectedTopic?.description || '',
      },
    })
  }

  const handleTryDifferentContent = () => {
    navigate('/')
  }

  // Empty state
  if (topics.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-24 px-4 pb-12 flex items-center justify-center min-h-[calc(100vh-6rem)]">
          <div className="text-center max-w-md">
            <Icon name="topic" className="text-6xl text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No topics found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't extract any topics from this content. Try different material or a more structured document.
            </p>
            <Button onClick={handleTryDifferentContent} variant="primary">
              <Icon name="refresh" className="mr-2" />
              Try Different Content
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center p-4 sm:p-6 mt-16 sm:mt-20">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold mb-4">
              <Icon name="check_circle" className="text-sm" filled />
              Librarian Agent Analysis Complete
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-text-main dark:text-white mb-3">
              Choose a Learning Path
            </h2>
            <p className="text-text-muted dark:text-text-muted-dark max-w-xl mx-auto">
              We found {topics.length} distinct concepts in your document. Which one do you want to start with?
            </p>
          </div>

          {/* Topics Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} onClick={handleTopicSelect} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
