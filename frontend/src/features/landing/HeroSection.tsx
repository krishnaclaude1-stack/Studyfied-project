import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../shared/Icon'
import { Button } from '../../shared/Button'

export function HeroSection() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL')
      return
    }

    setIsSubmitting(true)
    
    // Navigate to processing screen with analysis stage
    navigate('/processing', { state: { stage: 'analysis', source: url } })
  }

  return (
    <section className="relative pt-28 pb-16 lg:pt-48 lg:pb-32 overflow-hidden px-4 sm:px-6">
      {/* Background with Grid */}
      <div className="absolute inset-0 bg-background-light dark:bg-background-dark">
        <div className="absolute inset-0 bg-grid-slate dark:bg-grid-slate-dark [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto relative z-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-DEFAULT dark:text-indigo-300 text-xs sm:text-sm font-bold mb-6 sm:mb-8 border border-indigo-100 dark:border-indigo-800/50 animate-fade-in mx-auto">
          <Icon name="auto_awesome" className="text-base sm:text-lg" filled />
          <span>AI Whiteboard Engine v2.0 Live</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 sm:mb-8 leading-[1.1] text-text-main dark:text-white animate-slide-up px-2">
          Turn dense text into <br className="hidden md:block" />
          <span className="block sm:inline mt-2 sm:mt-0">
            <span className="relative inline-block text-indigo-DEFAULT">
              whiteboard lessons
              <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-2 sm:h-3 text-secondary" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="3" />
              </svg>
            </span>
          </span>
          <span className="block sm:inline mt-2 sm:mt-0 ml-0 sm:ml-3 font-hand text-secondary rotate-2">instantly</span>.
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-text-muted dark:text-text-muted-dark leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10 px-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Studyfied uses Generative AI to sketch concepts in real-time. Just drop a PDF or URL, and watch the magic happen.
        </p>

        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto relative z-20 animate-slide-up px-2 sm:px-0" style={{ animationDelay: '0.2s' }}>
          <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl shadow-indigo-900/10 border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-2">
            <div className="flex-grow relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon name="link" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a URL (Wikipedia, Article)..."
                className="w-full pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base rounded-xl bg-transparent focus:outline-none text-text-main dark:text-white placeholder:text-gray-400"
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary py-3 px-6 text-sm sm:text-base whitespace-nowrap"
            >
              <Icon name="auto_awesome" />
              Generate
            </button>
          </div>
          {error && (
            <p className="mt-3 text-danger text-sm flex items-center justify-center gap-2">
              <Icon name="error" className="text-base" />
              {error}
            </p>
          )}

          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/select-source')}
              className="text-sm font-medium text-text-muted hover:text-indigo-DEFAULT transition-colors inline-flex items-center justify-center gap-1"
            >
              Or upload a PDF document <Icon name="arrow_forward" className="text-sm" />
            </button>
          </div>
        </form>

        {/* Demo Preview */}
        <div className="mt-12 sm:mt-16 relative max-w-5xl mx-auto rounded-xl sm:rounded-3xl border-4 sm:border-8 border-gray-900 dark:border-gray-800 bg-gray-900 shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[2/1] animate-slide-up group cursor-pointer lg:hover:scale-[1.02] transition-transform" style={{ animationDelay: '0.3s' }}>
          <div className="absolute top-0 w-full h-6 sm:h-8 bg-gray-800 flex items-center px-4 gap-1.5 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity" 
            alt="Demo Interface" 
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg sm:group-hover:scale-110 transition-transform duration-300">
              <Icon name="play_arrow" className="text-4xl sm:text-5xl text-white ml-1" filled />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
