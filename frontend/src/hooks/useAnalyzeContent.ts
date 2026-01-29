import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { analyzeUrl, analyzePdf, APIError, AnalyzeResponse } from '../lib/api'

type UseAnalyzeUrlOptions = Omit<UseMutationOptions<AnalyzeResponse, APIError, string>, 'mutationFn'>

export function useAnalyzeUrl(options?: UseAnalyzeUrlOptions) {
  return useMutation({
    mutationFn: analyzeUrl,
    onError: (error: APIError) => {
      console.error('URL analysis failed:', error)
    },
    ...options,
  })
}

type UseAnalyzePdfOptions = Omit<UseMutationOptions<AnalyzeResponse, APIError, File>, 'mutationFn'>

export function useAnalyzePdf(options?: UseAnalyzePdfOptions) {
  return useMutation({
    mutationFn: analyzePdf,
    onError: (error: APIError) => {
      console.error('PDF analysis failed:', error)
    },
    ...options,
  })
}
