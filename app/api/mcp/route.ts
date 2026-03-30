import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkApiAccess, unauthorizedResponse } from '@/lib/api-access'
import {
  mcpCreatePerson,
  mcpDeletePerson,
  mcpGetPerson,
  mcpListPeople,
  mcpUpdatePerson,
} from '@/app/actions/mcp-person-actions'

const jsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string(),
  params: z.unknown().optional(),
})

const toolCallParamsSchema = z.object({
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()).optional(),
})

const personCreateSchema = z.object({
  name: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
})

const personListSchema = z.object({
  query: z.string().optional(),
})

const personGetSchema = z.object({
  id: z.string().min(1),
})

const personUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
})

const personDeleteSchema = z.object({
  id: z.string().min(1),
})

type JsonRpcId = string | number | null

function success(id: JsonRpcId, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result })
}

function failure(id: JsonRpcId, code: number, message: string, status = 200) {
  return NextResponse.json(
    {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
      },
    },
    { status },
  )
}

function toolResponse(payload: unknown) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
  }
}

function listToolsResult() {
  return {
    tools: [
      {
        name: 'person_create',
        description: 'Create a person record in the database.',
        inputSchema: {
          type: 'object',
          required: ['name', 'email', 'phoneNumber'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            phoneNumber: { type: 'string' },
          },
        },
      },
      {
        name: 'person_list',
        description: 'List people, optionally filtering by name prefix.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
          },
        },
      },
      {
        name: 'person_get',
        description: 'Get a person by id.',
        inputSchema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
      {
        name: 'person_update',
        description: 'Update a person by id.',
        inputSchema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phoneNumber: { type: 'string' },
          },
        },
      },
      {
        name: 'person_delete',
        description: 'Delete a person by id.',
        inputSchema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    ],
  }
}

async function handleToolCall(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'person_create': {
      const input = personCreateSchema.parse(args)
      const created = await mcpCreatePerson(input)
      return toolResponse(created)
    }
    case 'person_list': {
      const input = personListSchema.parse(args)
      const listed = await mcpListPeople(input.query)
      return toolResponse(listed)
    }
    case 'person_get': {
      const input = personGetSchema.parse(args)
      const person = await mcpGetPerson(input.id)
      return toolResponse(person)
    }
    case 'person_update': {
      const input = personUpdateSchema.parse(args)
      const { id, ...data } = input
      const updated = await mcpUpdatePerson(id, data)
      return toolResponse(updated)
    }
    case 'person_delete': {
      const input = personDeleteSchema.parse(args)
      const deleted = await mcpDeletePerson(input.id)
      return toolResponse(deleted)
    }
    default:
      throw new Error(`Unknown MCP tool: ${name}`)
  }
}

export async function GET(request: NextRequest) {
  const access = await checkApiAccess(request)
  if (!access.ok) {
    return unauthorizedResponse(access.message)
  }

  return NextResponse.json({
    name: 'person-crud-mcp',
    endpoint: '/api/mcp',
    transport: 'json-rpc',
    message: 'Use POST with JSON-RPC methods initialize, tools/list, and tools/call.',
  })
}

export async function POST(request: NextRequest) {
  const access = await checkApiAccess(request)
  if (!access.ok) {
    return unauthorizedResponse(access.message)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return failure(null, -32700, 'Parse error', 400)
  }

  const parsedRequest = jsonRpcRequestSchema.safeParse(body)
  if (!parsedRequest.success) {
    return failure(null, -32600, 'Invalid Request', 400)
  }

  const { id, method, params } = parsedRequest.data
  const isNotification = typeof id === 'undefined'

  // MCP clients can send lifecycle notifications (e.g. notifications/initialized)
  // without an id. They should not receive a JSON-RPC response body.
  if (isNotification) {
    return new NextResponse(null, { status: 204 })
  }

  try {
    if (method === 'initialize') {
      return success(id, {
        protocolVersion: '2025-03-26',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'person-crud-mcp',
          version: '1.0.0',
        },
      })
    }

    if (method === 'tools/list') {
      return success(id, listToolsResult())
    }

    if (method === 'tools/call') {
      const call = toolCallParamsSchema.parse(params ?? {})
      const args = call.arguments ?? {}
      const result = await handleToolCall(call.name, args)
      return success(id, result)
    }

    return failure(id, -32601, `Method not found: ${method}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return failure(id, -32000, message)
  }
}
