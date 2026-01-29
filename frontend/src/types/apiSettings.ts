export type AIProvider = 'gemini' | 'openaiCompatible'

export type ImageProvider = AIProvider | 'sjinn'

export interface GeminiProviderConfig {
  apiKey?: string
  /** Keep fixed by default, but we store it for future flexibility */
  model?: string
}

export interface OpenAICompatibleProviderConfig {
  baseUrl: string
  apiKey: string
  model: string
}

export interface SjinnConfig {
  baseUrl: string
  apiKey: string
  model: string // 'nano-banana-image-api' (standard, 50 credits) or 'nano-banana-image-pro-api' (pro, 150 credits)
  imageList?: string[] // URLs as strings (must be valid URLs, validated by backend)
}

export interface AIProviderConfig {
  provider: AIProvider | 'sjinn'
  gemini?: GeminiProviderConfig
  openaiCompatible?: OpenAICompatibleProviderConfig
  sjinn?: SjinnConfig

  // image-only fields (used by imageGeneration)
  imageSize?: string
  imageAspectRatio?: string
}

export interface ApiSettings {
  // Text agents
  librarian: AIProviderConfig
  imageSteering: AIProviderConfig
  aiDirector: AIProviderConfig

  // Image generation (used by asset pipeline)
  imageGeneration: AIProviderConfig

  // TTS
  elevenLabsApiKey?: string
}

export const DEFAULT_API_SETTINGS: ApiSettings = {
  librarian: {
    provider: 'gemini',
    gemini: {
      model: 'gemini-3-flash-preview',
    },
  },
  imageSteering: {
    provider: 'gemini',
    gemini: {
      model: 'gemini-3-flash-preview',
    },
  },
  aiDirector: {
    provider: 'gemini',
    gemini: {
      model: 'gemini-3-flash-preview',
    },
  },
  imageGeneration: {
    provider: 'sjinn',
    sjinn: {
      baseUrl: 'https://sjinn.ai',
      apiKey: '',
      model: 'nano-banana-image-api', // Standard model (50 credits) by default
      imageList: [],
    },
    imageAspectRatio: 'auto',
    imageSize: '1K',
  },
  elevenLabsApiKey: '',
}
