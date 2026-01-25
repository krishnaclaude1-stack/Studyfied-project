import { Icon } from '../../shared/Icon'

export interface Topic {
  id: string
  title: string
  description: string
  tags: string[]
  duration: string
  isRecommended?: boolean
  topicText?: string
}

interface TopicCardProps {
  topic: Topic
  onClick: (topicId: string) => void
}

export function TopicCard({ topic, onClick }: TopicCardProps) {
  return (
    <div
      onClick={() => onClick(topic.id)}
      className={`bg-white dark:bg-background-card-dark rounded-2xl p-6 border-2 transition-all hover:-translate-y-1 shadow-soft hover:shadow-lg flex flex-col cursor-pointer ${
        topic.isRecommended 
          ? 'border-primary ring-4 ring-primary/10' 
          : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300'
      }`}
    >
      {/* Recommended Badge */}
      {topic.isRecommended && (
        <div className="mb-4 -mt-2 -ml-2">
          <span className="bg-primary text-white text-[10px] uppercase font-bold px-2 py-1 rounded tracking-wider">
            Recommended
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-bold text-text-main dark:text-white mb-2 leading-tight">
        {topic.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-text-muted dark:text-text-muted-dark mb-4 flex-grow">
        {topic.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {topic.tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-xs rounded-md font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1 text-xs font-mono text-gray-500">
          <Icon name="schedule" className="text-sm" />
          {topic.duration}
        </div>
        <button
          className={`p-2 rounded-lg transition-colors ${
            topic.isRecommended 
              ? 'bg-primary text-white hover:bg-primary-hover' 
              : 'bg-gray-100 hover:bg-indigo-100 text-gray-900'
          }`}
        >
          <Icon name="arrow_forward" />
        </button>
      </div>
    </div>
  )
}
