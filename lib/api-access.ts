import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

type AccessResult = {
  ok: true
  source: 'clerk' | 'mcp'
} | {
  ok: false
  message: string
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)

  if (aBuffer.length !== bBuffer.length) {
    return false
  }

  return timingSafeEqual(aBuffer, bBuffer)
}

export async function checkApiAccess(request: NextRequest): Promise<AccessResult> {
  const { userId } = await auth()
  if (userId) {
    return { ok: true, source: 'clerk' }
  }

  const expectedApiKey = process.env.MCP_API_KEY
  const providedApiKey = request.headers.get('x-mcp-api-key')

  if (!expectedApiKey) {
    return {
      ok: false,
      message: 'Server misconfiguration: MCP_API_KEY is not set.',
    }
  }

  if (!providedApiKey) {
    return {
      ok: false,
      message: 'Authentication required. Sign in with Clerk or provide x-mcp-api-key.',
    }
  }

  if (!safeEqual(expectedApiKey, providedApiKey)) {
    return {
      ok: false,
      message: 'Invalid MCP API key.',
    }
  }

  return { ok: true, source: 'mcp' }
}

export function unauthorizedResponse(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}