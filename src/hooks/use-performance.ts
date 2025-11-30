import { useEffect, useRef, useState } from 'react'

interface PerformanceMetrics {
  renderTime: number
  paintTime?: number
  memoryUsage?: number
}

interface UsePerformanceOptions {
  componentName: string
  logOnUnmount?: boolean
  warnThreshold?: number // ms
}

export function usePerformance({ 
  componentName, 
  logOnUnmount = false, 
  warnThreshold = 16 // 60fps threshold
}: UsePerformanceOptions): PerformanceMetrics | null {
  const startTime = useRef<number>(performance.now())
  const paintTime = useRef<number | undefined>()
  const [metrics, setMetrics] = useRef<PerformanceMetrics | null>(null)

  useEffect(() => {
    // Measure paint time using Performance Observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === componentName) {
            paintTime.current = entry.startTime
            break
          }
        }
      })
      
      try {
        observer.observe({ entryTypes: ['paint'] })
      } catch (e) {
        // Ignore if paint entries aren't supported
      }
      
      return () => observer.disconnect()
    }
  }, [componentName])

  useEffect(() => {
    // Calculate metrics after paint
    const calculateMetrics = () => {
      const renderTime = performance.now() - startTime.current
      const memoryUsage = 'memory' in performance ? (performance as any).memory.usedJSHeapSize : undefined
      
      const newMetrics: PerformanceMetrics = {
        renderTime,
        paintTime: paintTime.current,
        memoryUsage,
      }
      
      setMetrics.current = newMetrics
      
      if (renderTime > warnThreshold) {
        console.warn(
          `[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render ` +
          `(threshold: ${warnThreshold}ms)`
        )
      }
    }
    
    // Use requestAnimationFrame to measure after paint
    requestAnimationFrame(calculateMetrics)
  }, [componentName, warnThreshold])

  useEffect(() => {
    return () => {
      if (logOnUnmount && setMetrics.current) {
        console.log(`[Performance] ${componentName} metrics:`, setMetrics.current)
      }
    }
  }, [componentName, logOnUnmount])

  return setMetrics.current
}

export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0)
  
  useEffect(() => {
    renderCount.current += 1
  })
  
  useEffect(() => {
    if (renderCount.current > 10) {
      console.warn(
        `[Performance] ${componentName} has re-rendered ${renderCount.current} times`
      )
    }
  }, [componentName])
  
  return renderCount.current
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(function() {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}