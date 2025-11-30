import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

interface LazyLoadProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function LazyLoad({ children, fallback }: LazyLoadProps) {
  return (
    <Suspense 
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  )
}

// Lazy load heavy components
export const MonacoEditor = lazy(() => 
  import('@/components/ui/shadcn-io/code-block').then(mod => ({ 
    default: mod.CodeBlock 
  }))
)

export const ResizablePanels = lazy(() => 
  import('react-resizable-panels').then(mod => ({
    default: mod.PanelGroup,
    Panel: mod.Panel,
    PanelResizeHandle: mod.PanelResizeHandle,
  }))
)

export const WebPreview = lazy(() => 
  import('@/components/ai-elements/web-preview').then(mod => ({ 
    default: mod.WebPreview 
  }))
)