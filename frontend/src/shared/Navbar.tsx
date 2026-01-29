import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { ThemeToggle } from './ThemeToggle'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
  ]

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled || mobileMenuOpen 
          ? 'bg-white/90 dark:bg-background-dark/90 backdrop-blur-md shadow-sm py-3' 
          : 'bg-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group z-50 relative">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-DEFAULT text-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-DEFAULT/30 group-hover:scale-105 transition-transform">
            <Icon name="draw" className="text-xl sm:text-2xl" />
          </div>
          <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-text-main dark:text-white">
            Studyfied
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-text-muted dark:text-text-muted-dark hover:text-indigo-DEFAULT dark:hover:text-indigo-light font-medium transition-colors text-sm"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/settings"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-text-muted dark:text-text-muted-dark transition-colors"
            aria-label="API Settings"
          >
            <Icon name="settings" />
          </Link>
          <ThemeToggle />
          <Link to="/select-source" className="btn-primary py-2 px-5 text-sm">
            Try Guest Mode
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 z-50 relative text-text-main dark:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="text-2xl" />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed inset-0 bg-white dark:bg-background-dark z-40 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } pt-24 px-6`}
      >
        <div className="flex flex-col gap-6">
          <Link
            to="/select-source"
            className="btn-primary w-full justify-center"
            onClick={() => setMobileMenuOpen(false)}
          >
            Try Guest Mode
          </Link>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 text-text-main dark:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon name="settings" />
            API Settings
          </Link>
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-xl font-display font-bold text-text-main dark:text-white py-2 border-b border-gray-100 dark:border-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-800 mt-4">
            <span className="text-text-muted dark:text-text-muted-dark">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
