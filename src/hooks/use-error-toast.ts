import { useToast } from '@/components/ui/use-toast'
import { AppError, getErrorMessage, shouldRetry } from '@/lib/errors'
import { useCallback } from 'react'

interface UseErrorToastOptions {
  title?: string
  description?: string
  duration?: number
  onRetry?: () => void
  onDismiss?: () => void
}

export function useErrorToast() {
  const { toast } = useToast()
  
  const showError = useCallback((
    error: unknown,
    options: UseErrorToastOptions = {}
  ) => {
    const errorMessage = getErrorMessage(error)
    const canRetry = shouldRetry(error)
    
    const title = options.title || 'Error'
    const description = options.description || errorMessage
    
    toast({
      title,
      description,
      variant: 'destructive',
      duration: options.duration || 5000,
      action: canRetry && options.onRetry ? (
        <button
          onClick={() => {
            options.onRetry?.()
          }}
          className="text-sm font-medium underline underline-offset-4 hover:no-underline"
        >
          Retry
        </button>
      ) : undefined,
      onDismiss: options.onDismiss,
    })
  }, [toast])
  
  const showSuccess = useCallback((
    title: string,
    description?: string,
    options: Partial<UseErrorToastOptions> = {}
  ) => {
    toast({
      title,
      description,
      duration: options.duration || 3000,
      onDismiss: options.onDismiss,
    })
  }, [toast])
  
  return {
    showError,
    showSuccess,
  }
}