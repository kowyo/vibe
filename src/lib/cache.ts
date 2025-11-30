interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
}

export class Cache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>()
  private options: Required<CacheOptions>

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize ?? 100,
    }
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const expiresAt = now + (ttl ?? this.options.ttl)

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.options.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache statistics
  getStats(): {
    size: number
    oldestEntry: number | null
    newestEntry: number | null
  } {
    const entries = Array.from(this.cache.values())
    
    if (entries.length === 0) {
      return { size: 0, oldestEntry: null, newestEntry: null }
    }

    const timestamps = entries.map(e => e.timestamp)
    
    return {
      size: entries.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps),
    }
  }
}

// Create specific cache instances for different use cases
export const projectCache = new Cache<any>({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 50,
})

export const apiResponseCache = new Cache<any>({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
})

export const userCache = new Cache<any>({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 20,
})