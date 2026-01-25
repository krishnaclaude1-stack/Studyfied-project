import { useMutation } from '@tanstack/react-query'
import { analyzeUrl, analyzePdf, APIError } from '../lib/api'

export function useAnalyzeUrl() {
  return useMutation({
    mutationFn: analyzeUrl,
    onError: (error: APIError) => {
      console.error('URL analysis failed:', error)
      // Error is handled by the component
    },
  })
}

export function useAnalyzePdf() {
  return useMutation({
    mutationFn: analyzePdf,
    onError: (error: APIError) => {
      console.error('PDF analysis failed:', error)
      // Error is handled by the component
    },
  })
}
