import { Icon } from '../../shared/Icon'

export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Input Source',
      desc: 'Upload a PDF or paste a link. We strip the noise instantly.',
      icon: 'upload_file',
      color: 'bg-indigo-DEFAULT',
      rotate: '-rotate-2',
    },
    {
      step: '02',
      title: 'AI Magic',
      desc: 'Our engine identifies concepts and sketches visuals live.',
      icon: 'auto_awesome',
      color: 'bg-primary',
      rotate: 'rotate-1',
    },
    {
      step: '03',
      title: 'Interactive Insight',
      desc: 'Get a clickable, hand-drawn lesson ready to share.',
      icon: 'lightbulb',
      color: 'bg-indigo-DEFAULT',
      rotate: '-rotate-2',
    },
  ]

  return (
    <section id="how-it-works" className="relative py-20 sm:py-32 px-4 sm:px-6 bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate dark:bg-grid-slate-dark opacity-30" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 font-display tracking-tight text-text-main dark:text-white">
            How It Works
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-text-muted dark:text-text-muted-dark leading-relaxed max-w-2xl mx-auto px-4">
            From static PDF to interactive lesson in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
          {steps.map((s, i) => (
            <div key={i} className="relative flex flex-col items-center text-center group">
              {/* Step Number Badge */}
              <div className="mb-6 text-5xl sm:text-6xl font-bold text-gray-200 dark:text-gray-800 font-display">
                {s.step}
              </div>

              {/* Step Card */}
              <div className={`${s.color} ${s.rotate} text-white w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-0 transition-all duration-300`}>
                <Icon name={s.icon} className="text-3xl sm:text-4xl" filled />
              </div>

              {/* Content */}
              <h3 className="text-xl sm:text-2xl font-bold text-text-main dark:text-white mb-3 font-display">
                {s.title}
              </h3>
              <p className="text-base sm:text-lg text-text-muted dark:text-text-muted-dark leading-relaxed px-2">
                {s.desc}
              </p>

              {/* Connector Arrow (not on last item) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/3 -right-8 xl:-right-12 text-primary/20">
                  <Icon name="arrow_forward" className="text-4xl" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
