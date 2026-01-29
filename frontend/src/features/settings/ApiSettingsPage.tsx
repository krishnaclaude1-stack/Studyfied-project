import { useEffect, useMemo, useState } from 'react'
import { Navbar } from '../../shared/Navbar'
import { Button } from '../../shared/Button'
import { Icon } from '../../shared/Icon'
import { useApiSettingsStore } from '../../stores/apiSettingsStore'
import type { AIProviderConfig, ApiSettings } from '../../types/apiSettings'

function TextInput(props: {
  label: string
  value: string
  placeholder?: string
  type?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-text-main dark:text-text-main-dark mb-2">
        {props.label}
      </span>
      <input
        type={props.type ?? 'text'}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-card-dark px-4 py-2.5 text-text-main dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  )
}

function Select(props: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-text-main dark:text-text-main-dark mb-2">
        {props.label}
      </span>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onKeyDown={(e) => {
          // Prevent single character keyboard shortcuts from triggering when typing in other fields
          // Only allow arrow keys, enter, escape, and space for dropdown interaction
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.stopPropagation()
          }
        }}
        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-background-card-dark px-4 py-2.5 text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {props.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ProviderConfigCard(props: {
  title: string
  description?: string
  config: AIProviderConfig
  onChange: (next: AIProviderConfig) => void
  geminiModelFixed?: boolean
  providers?: Array<{ value: string; label: string }>
}) {
  const provider = props.config.provider

  return (
    <div className="bg-white dark:bg-background-card-dark border border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="font-display font-bold text-lg text-text-main dark:text-white">
            {props.title}
          </h3>
          {props.description && (
            <p className="text-sm text-text-muted dark:text-text-muted-dark mt-1">
              {props.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <Select
          label="Model provider"
          value={provider}
          options={
            props.providers ?? [
              { value: 'gemini', label: 'Official Gemini' },
              { value: 'openaiCompatible', label: 'OpenAI-compatible' },
            ]
          }
          onChange={(value) => {
            const nextProvider = value as AIProviderConfig['provider']
            if (nextProvider === props.config.provider) return // Prevent unnecessary updates
            
            if (nextProvider === 'gemini') {
              props.onChange({
                ...props.config,
                provider: 'gemini',
                gemini: props.config.gemini ?? { model: 'gemini-3-flash-preview', apiKey: '' },
              })
            } else if (nextProvider === 'sjinn') {
              props.onChange({
                ...props.config,
                provider: 'sjinn',
                sjinn: props.config.sjinn ?? {
                  baseUrl: 'https://sjinn.ai',
                  apiKey: '',
                  model: 'nano-banana-image-api',
                  imageList: [],
                },
                imageAspectRatio: props.config.imageAspectRatio ?? 'auto',
                imageSize: props.config.imageSize ?? '1K',
              })
            } else {
              props.onChange({
                ...props.config,
                provider: 'openaiCompatible',
                openaiCompatible: props.config.openaiCompatible ?? {
                  baseUrl: '',
                  apiKey: '',
                  model: '',
                },
                // Preserve image settings if switching image generation provider
                imageAspectRatio: props.config.imageAspectRatio,
                imageSize: props.config.imageSize,
              })
            }
          }}
        />

        {provider === 'sjinn' ? (
          <div className="grid gap-4">
            <TextInput
              label="SJinn Base URL"
              value={props.config.sjinn?.baseUrl ?? ''}
              placeholder="https://sjinn.ai"
              onChange={(baseUrl) =>
                props.onChange({
                  ...props.config,
                  provider: 'sjinn',
                  sjinn: {
                    ...(props.config.sjinn ?? { apiKey: '', baseUrl: 'https://sjinn.ai', model: 'nano-banana-image-api', imageList: [] }),
                    baseUrl,
                  },
                })
              }
            />
            <TextInput
              label="SJinn API key"
              type="password"
              value={props.config.sjinn?.apiKey ?? ''}
              placeholder="YOUR_API_KEY"
              onChange={(apiKey) =>
                props.onChange({
                  ...props.config,
                  provider: 'sjinn',
                  sjinn: {
                    ...(props.config.sjinn ?? { apiKey: '', baseUrl: 'https://sjinn.ai', model: 'nano-banana-image-api', imageList: [] }),
                    apiKey,
                  },
                })
              }
            />

            <Select
              label="Model"
              value={props.config.sjinn?.model ?? 'nano-banana-image-api'}
              options={[
                { value: 'nano-banana-image-api', label: 'Standard (50 credits, 1K max)' },
                { value: 'nano-banana-image-pro-api', label: 'Pro (150 credits, 2K max)' },
              ]}
              onChange={(model) =>
                props.onChange({
                  ...props.config,
                  provider: 'sjinn',
                  sjinn: {
                    ...(props.config.sjinn ?? { apiKey: '', baseUrl: 'https://sjinn.ai', model: 'nano-banana-image-api', imageList: [] }),
                    model,
                  },
                })
              }
            />

            <Select
              label="Aspect ratio"
              value={props.config.imageAspectRatio ?? 'auto'}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: '1:1', label: '1:1 - Square' },
                { value: '16:9', label: '16:9 - Widescreen' },
                { value: '9:16', label: '9:16 - Portrait' },
                { value: '4:3', label: '4:3 - Standard' },
                { value: '3:4', label: '3:4 - Standard Portrait' },
                { value: '9:21', label: '9:21 - Ultra-wide Portrait' },
                { value: '21:9', label: '21:9 - Cinematic' },
                { value: '2:3', label: '2:3 - Classic Portrait' },
                { value: '3:2', label: '3:2 - Classic Landscape' },
              ]}
              onChange={(imageAspectRatio) =>
                props.onChange({
                  ...props.config,
                  provider: 'sjinn',
                  imageAspectRatio,
                })
              }
            />

            {/* Resolution field only for Pro model */}
            {props.config.sjinn?.model === 'nano-banana-image-pro-api' && (
              <Select
                label="Resolution"
                value={props.config.imageSize ?? '1K'}
                options={[
                  { value: '1K', label: '1K' },
                  { value: '2K', label: '2K' },
                ]}
                onChange={(imageSize) =>
                  props.onChange({
                    ...props.config,
                    provider: 'sjinn',
                    imageSize,
                  })
                }
              />
            )}
          </div>
        ) : provider === 'gemini' ? (
          <div className="grid gap-4">
            <TextInput
              label="Gemini API key (optional override)"
              type="password"
              value={props.config.gemini?.apiKey ?? ''}
              placeholder="AIza..."
              onChange={(apiKey) =>
                props.onChange({
                  provider: 'gemini',
                  gemini: {
                    ...(props.config.gemini ?? {}),
                    apiKey,
                  },
                })
              }
            />

            <TextInput
              label={`Gemini model${props.geminiModelFixed ? ' (fixed)' : ''}`}
              value={props.config.gemini?.model ?? ''}
              placeholder="gemini-flash-latest"
              onChange={(model) =>
                props.onChange({
                  provider: 'gemini',
                  gemini: {
                    ...(props.config.gemini ?? {}),
                    model,
                  },
                })
              }
            />
            {props.geminiModelFixed && (
              <p className="text-xs text-text-muted dark:text-text-muted-dark">
                Tip: you can keep this as the default to match the backend's recommended model.
              </p>
            )}
          </div>
        ) : provider === 'openaiCompatible' ? (
          <div className="grid gap-4">
            <TextInput
              label="Base URL"
              value={props.config.openaiCompatible?.baseUrl ?? ''}
              placeholder="http://localhost:8317/v1 (or https://api.openai.com/v1)"
              onChange={(baseUrl) =>
                props.onChange({
                  ...props.config,
                  provider: 'openaiCompatible',
                  openaiCompatible: {
                    ...(props.config.openaiCompatible ?? { apiKey: '', model: '', baseUrl: '' }),
                    baseUrl,
                  },
                })
              }
            />
            <TextInput
              label="API key"
              type="password"
              value={props.config.openaiCompatible?.apiKey ?? ''}
              placeholder="sk-..."
              onChange={(apiKey) =>
                props.onChange({
                  ...props.config,
                  provider: 'openaiCompatible',
                  openaiCompatible: {
                    ...(props.config.openaiCompatible ?? { apiKey: '', model: '', baseUrl: '' }),
                    apiKey,
                  },
                })
              }
            />
            <TextInput
              label="Model"
              value={props.config.openaiCompatible?.model ?? ''}
              placeholder="dall-e-3 (for images) or gpt-4o-mini (for text)"
              onChange={(model) =>
                props.onChange({
                  ...props.config,
                  provider: 'openaiCompatible',
                  openaiCompatible: {
                    ...(props.config.openaiCompatible ?? { apiKey: '', model: '', baseUrl: '' }),
                    model,
                  },
                })
              }
            />
            
            {/* Show image size option for image generation */}
            {props.title === 'Image Generation' && (
              <TextInput
                label="Image size"
                value={props.config.imageSize ?? '1024x1024'}
                placeholder="1024x1024"
                onChange={(imageSize) =>
                  props.onChange({
                    ...props.config,
                    imageSize,
                  })
                }
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ApiSettingsPage() {
  const { settings, save, reset, isHydrating, lastSavedAt, setAll } = useApiSettingsStore()

  // Work on a local draft so users can cancel/undo easily
  const [draft, setDraft] = useState<ApiSettings>(settings)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  const hasChanges = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      setAll(draft)
      await save()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Navbar />

      <main className="pt-24 px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-main dark:text-white">
                API Settings
              </h1>
              <p className="text-text-muted dark:text-text-muted-dark mt-1">
                Configure model providers, custom base URLs, and API keys. Settings are stored locally in your browser.
              </p>
              {!isHydrating && lastSavedAt && (
                <p className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
                  Last saved: {new Date(lastSavedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true)
                  try {
                    await reset()
                  } finally {
                    setIsSaving(false)
                  }
                }}
              >
                <Icon name="restart_alt" className="mr-2" />
                Reset
              </Button>
              <Button variant="primary" disabled={isHydrating || isSaving || !hasChanges} onClick={handleSave}>
                <Icon name="save" className="mr-2" />
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Providers */}
          <div className="grid gap-6">
            <ProviderConfigCard
              title="Librarian Agent (Topic extraction)"
              description="Used during analysis to turn your PDF/URL into topics."
              config={draft.librarian}
              onChange={(next) => setDraft((s) => ({ ...s, librarian: next }))}
            />

            <ProviderConfigCard
              title="Image Prompt Agent (Image steering)"
              description="Generates the 5 sketchnote image prompts from the selected topic."
              config={draft.imageSteering}
              onChange={(next) => setDraft((s) => ({ ...s, imageSteering: next }))}
            />

            <ProviderConfigCard
              title="Director Agent (Lesson manifest)"
              description="Creates the scene timeline and canvas events."
              config={draft.aiDirector}
              onChange={(next) => setDraft((s) => ({ ...s, aiDirector: next }))}
            />

            <ProviderConfigCard
              title="Image Generation"
              description="Generates the actual images from prompts (used by the asset pipeline)."
              config={draft.imageGeneration}
              providers={[
                { value: 'sjinn', label: 'SJinn (Nano Banana)' },
                { value: 'openaiCompatible', label: 'OpenAI-compatible' },
                { value: 'gemini', label: 'Official Gemini' },
              ]}
              onChange={(next) => setDraft((s) => ({ ...s, imageGeneration: next }))}
            />

            <div className="bg-white dark:bg-background-card-dark border border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-soft">
              <h3 className="font-display font-bold text-lg text-text-main dark:text-white mb-1">
                ElevenLabs (Text-to-Speech)
              </h3>
              <p className="text-sm text-text-muted dark:text-text-muted-dark mb-5">
                Optional: provide your ElevenLabs API key for higher-quality narration.
              </p>

              <TextInput
                label="ElevenLabs API key"
                type="password"
                value={draft.elevenLabsApiKey ?? ''}
                placeholder="xi-..."
                onChange={(elevenLabsApiKey) => setDraft((s) => ({ ...s, elevenLabsApiKey }))}
              />
            </div>

            <div className="text-xs text-text-muted dark:text-text-muted-dark">
              Security note: these keys are stored locally in your browser storage. Don’t use this on a shared/public machine.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
