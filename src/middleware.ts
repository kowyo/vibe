import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10

// Simple in-memory rate limit store (consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getClientIp(request: NextRequest): string {
  // Get client IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  return forwarded?.split(',')[0] || realIp || 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const current = rateLimitStore.get(ip)
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return false
  }
  
  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return true
  }
  
  current.count++
  return false
}

export function middleware(request: NextRequest) {
  // Security headers
  const response = NextResponse.next()
  
  // Basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' http://localhost:8000 https://api.claude.ai; " +
    "frame-src 'self' https://stackblitz.com;"
  )
  
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/_next/static/')) {
    
    const clientIp = getClientIp(request)
    
    if (isRateLimited(clientIp)) {
      return new NextResponse('Rate limit exceeded', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + RATE_LIMIT_WINDOW).toString()
        }
      })
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/api/:path*'
  ]
}