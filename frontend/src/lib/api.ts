// API client functions for backend endpoints

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'APIError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = (await response.json()) as ErrorResponse
    throw new APIError(
      errorData.error.message,
      errorData.error.code,
      errorData.error.details
    )
  }
  return response.json()
}

export interface TopicItem {
  id: string
  title: string
  focus: string
  hook: string
  visualPotentialScore: number
  keyVisuals: string[]
}

export interface AnalyzeResponse {
  topics: TopicItem[]
}

export interface LessonManifest {
  lessonDurationSec: number
  scenes: Array<{
    sceneId: string
    purpose: string
    assetsUsed: string[]
    voiceover: Array<{
      text: string
      checkpointId: string
    }>
    events: Array<{
      type: string
      assetId: string
      checkpointId: string
      zone: string
      role: string
      scaleHint: string
      params: Record<string, unknown>
    }>
    interaction?: {
      type: string
      prompt: string
      options: string[]
      correctAnswer: string
    }
  }>
}

export interface GeneratedAsset {
  assetId: string
  index: number
  purpose: string
  layoutType: string
  imagePrompt: string
  pngBase64: string
}

export interface GenerateLessonResponse {
  lessonManifest: LessonManifest
  audioUrl: string
  assets: GeneratedAsset[]
  transcript: string[]
}

/**
 * Analyze content from a URL
 */
export async function analyzeUrl(url: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/analyze/url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  })

  return handleResponse<AnalyzeResponse>(response)
}

/**
 * Analyze content from a PDF file
 */
export async function analyzePdf(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/v1/analyze/pdf`, {
    method: 'POST',
    body: formData,
  })

  return handleResponse<AnalyzeResponse>(response)
}

/**
 * Generate a complete lesson from a topic
 */
export async function generateLesson(topicText: string): Promise<GenerateLessonResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topicText }),
  })

  return handleResponse<GenerateLessonResponse>(response)
}

export { APIError }
