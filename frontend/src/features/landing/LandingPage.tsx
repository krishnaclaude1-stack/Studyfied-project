import { Navbar } from '../../shared/Navbar'
import { HeroSection } from './HeroSection'
import { HowItWorks } from './HowItWorks'

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <HowItWorks />
      </main>
      <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 py-12 safe-bottom">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-text-muted dark:text-text-muted-dark text-sm">
          <p className="mb-4 font-hand text-xl">Studyfied - Made for the hackathon.</p>
          <p>© 2026 Studyfied Inc.</p>
        </div>
      </footer>
    </div>
  )
}
