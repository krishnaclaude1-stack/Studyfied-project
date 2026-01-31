import { useMutation } from '@tanstack/react-query'
import { generateLesson, APIError } from '../lib/api'

export function useGenerateLesson() {
  return useMutation({
    mutationFn: generateLesson,
    onError: (error: APIError) => {
      console.error('Lesson generation failed:', error)
      // Error is handled by the component
    },
  })
}
