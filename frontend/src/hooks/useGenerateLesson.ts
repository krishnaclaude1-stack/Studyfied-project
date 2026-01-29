import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { generateLesson, APIError, GenerateLessonResponse } from '../lib/api'

type UseGenerateLessonOptions = Omit<UseMutationOptions<GenerateLessonResponse, APIError, string>, 'mutationFn'>

export function useGenerateLesson(options?: UseGenerateLessonOptions) {
  return useMutation({
    mutationFn: generateLesson,
    onError: (error: APIError) => {
      console.error('Lesson generation failed:', error)
    },
    ...options,
  })
}
