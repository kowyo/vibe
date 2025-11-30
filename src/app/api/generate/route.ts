import { NextResponse } from "next/server"
import { authClient } from "@/lib/auth-client"

// Input validation schema
const MAX_PROMPT_LENGTH = 1000
const MIN_PROMPT_LENGTH = 10

function validatePrompt(prompt: unknown): string {
  if (typeof prompt !== 'string') {
    throw new Error('Prompt must be a string')
  }
  
  const trimmed = prompt.trim()
  
  if (trimmed.length < MIN_PROMPT_LENGTH) {
    throw new Error(`Prompt must be at least ${MIN_PROMPT_LENGTH} characters long`)
  }
  
  if (trimmed.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt must not exceed ${MAX_PROMPT_LENGTH} characters`)
  }
  
  // Basic XSS prevention - remove script tags and dangerous patterns
  const sanitized = trimmed
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
  
  return sanitized
}

export async function POST(request: Request) {
  try {
    // Get the current session
    const session = await authClient.getSession()
    
    if (!session?.session?.token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate input
    let prompt: string
    try {
      prompt = validatePrompt(body.prompt)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message: "Invalid prompt" },
        { status: 400 }
      )
    }

    // Call the backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    
    const response = await fetch(`${backendUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.token}`,
      },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(
        { error: errorData.error || 'Failed to generate project' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      files: data.files,
      preview_url: data.preview_url,
      project_id: data.id,
    })
    
  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}