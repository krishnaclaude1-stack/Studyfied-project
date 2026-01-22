import { useState, useRef, ChangeEvent, DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../shared/Icon'
import { Button } from '../../shared/Button'
import { Navbar } from '../../shared/Navbar'

export function SourceSelection() {
  const navigate = useNavigate()
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfError, setPdfError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

  const validatePdfFile = (file: File): boolean => {
    setPdfError('')

    if (file.type !== 'application/pdf') {
      setPdfError('File must be a PDF')
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      setPdfError('File must be under 10MB. Try a shorter document.')
      return false
    }

    return true
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validatePdfFile(file)) {
      setPdfFile(file)
      // Navigate to processing screen
      navigate('/processing', { state: { stage: 'analysis', source: file } })
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file && validatePdfFile(file)) {
      setPdfFile(file)
      navigate('/processing', { state: { stage: 'analysis', source: file } })
    }
  }

  const handleUrlSubmit = () => {
    setUrlError('')

    if (!url.trim()) {
      setUrlError('Please enter a URL')
      return
    }

    try {
      new URL(url)
      navigate('/processing', { state: { stage: 'analysis', source: url } })
    } catch {
      setUrlError('Please enter a valid URL')
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 mt-16 sm:mt-20">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-center text-text-main dark:text-white mb-3 sm:mb-4">
            Choose your material
          </h2>
          <p className="text-center text-text-muted dark:text-text-muted-dark mb-8 sm:mb-12 max-w-xl mx-auto text-sm sm:text-base">
            We don't store your documents. Everything is processed in transient memory.
          </p>

          {/* Two Card Options */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-12">
            {/* PDF Upload Card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer bg-white dark:bg-background-card-dark rounded-3xl p-6 sm:p-8 border-2 border-gray-100 dark:border-gray-700 hover:border-indigo-DEFAULT dark:hover:border-indigo-DEFAULT transition-all shadow-soft hover:shadow-hard-indigo relative overflow-hidden active:scale-[0.98]"
            >
              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              
              <div className="relative z-10 flex flex-col h-full items-center text-center md:items-start md:text-left">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-DEFAULT rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <Icon name="picture_as_pdf" className="text-2xl sm:text-3xl" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-text-main dark:text-white mb-2">Upload PDF</h3>
                <p className="text-text-muted dark:text-text-muted-dark mb-6 sm:mb-8 text-sm sm:text-base">
                  Textbooks, research papers, or lecture notes.
                </p>
                <div className="mt-auto w-full border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl h-24 sm:h-32 flex flex-col items-center justify-center text-gray-400 group-hover:border-indigo-300 dark:group-hover:border-indigo-700 group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-900/20 transition-all">
                  <Icon name="cloud_upload" className="text-2xl sm:text-3xl mb-1 sm:mb-2" />
                  <span className="font-medium text-xs sm:text-sm">Tap to browse</span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {pdfError && (
                <p className="mt-3 text-danger text-sm flex items-center gap-2">
                  <Icon name="error" className="text-base" />
                  {pdfError}
                </p>
              )}
            </div>

            {/* URL Paste Card */}
            <div className="group cursor-pointer bg-white dark:bg-background-card-dark rounded-3xl p-6 sm:p-8 border-2 border-gray-100 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-all shadow-soft hover:shadow-hard-primary relative overflow-hidden active:scale-[0.98]">
              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-light/20 dark:bg-primary/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              
              <div className="relative z-10 flex flex-col h-full items-center text-center md:items-start md:text-left">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-100 dark:bg-orange-900/20 text-primary rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <Icon name="link" className="text-2xl sm:text-3xl" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-text-main dark:text-white mb-2">Paste Link</h3>
                <p className="text-text-muted dark:text-text-muted-dark mb-6 sm:mb-8 text-sm sm:text-base">
                  Wikipedia, Medium, or any public article URL.
                </p>
                <div className="mt-auto w-full">
                  <div className="flex bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-600 p-2 group-focus-within:ring-2 ring-primary/20 transition-all">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                      placeholder="https://..."
                      className="bg-transparent w-full px-3 text-text-main dark:text-white py-2 text-sm focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUrlSubmit()
                      }}
                      className="bg-primary text-white p-2 rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      <Icon name="arrow_forward" />
                    </button>
                  </div>
                  {urlError && (
                    <p className="mt-2 text-danger text-sm flex items-center gap-2">
                      <Icon name="error" className="text-base" />
                      {urlError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors inline-flex items-center gap-2"
            >
              <Icon name="arrow_back" />
              Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
