import { Icon } from './Icon'

export function ThemeToggle() {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-text-muted dark:text-text-muted-dark transition-colors"
      aria-label="Toggle Theme"
    >
      <span className="dark:hidden">
        <Icon name="dark_mode" />
      </span>
      <span className="hidden dark:block">
        <Icon name="light_mode" />
      </span>
    </button>
  )
}
