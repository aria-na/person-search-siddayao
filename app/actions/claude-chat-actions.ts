'use server'

import {
  mcpCreatePerson,
  mcpDeletePerson,
  mcpGetPerson,
  mcpListPeople,
  mcpUpdatePerson,
} from '@/app/actions/mcp-person-actions'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type AnthropicTextBlock = {
  type: 'text'
  text: string
}

type AnthropicToolUseBlock = {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

type AnthropicAssistantBlock = AnthropicTextBlock | AnthropicToolUseBlock

type AnthropicResponse = {
  content: AnthropicAssistantBlock[]
}

const anthropicTools = [
  {
    name: 'person_create',
    description: 'Create a person record in the database.',
    input_schema: {
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
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
    },
  },
  {
    name: 'person_get',
    description: 'Get a person by id.',
    input_schema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
      },
    },
  },
  {
    name: 'person_update',
    description: 'Update person fields by id.',
    input_schema: {
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
    input_schema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
      },
    },
  },
]

async function runTool(name: string, input: Record<string, unknown>) {
  switch (name) {
    case 'person_create':
      return mcpCreatePerson(input)
    case 'person_list':
      return mcpListPeople(typeof input.query === 'string' ? input.query : undefined)
    case 'person_get':
      if (typeof input.id !== 'string') {
        throw new Error('person_get requires id')
      }
      return mcpGetPerson(input.id)
    case 'person_update': {
      if (typeof input.id !== 'string') {
        throw new Error('person_update requires id')
      }

      const { id, ...rest } = input
      const sanitized = Object.fromEntries(
        Object.entries(rest).filter(([, value]) => value !== null && value !== undefined && value !== ''),
      )

      return mcpUpdatePerson(id, sanitized)
    }
    case 'person_delete':
      if (typeof input.id !== 'string') {
        throw new Error('person_delete requires id')
      }
      return mcpDeletePerson(input.id)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

async function callAnthropic(messages: Array<{ role: 'user' | 'assistant'; content: unknown }>) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server.')
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest'

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system:
        'You are the in-app assistant for Person Search. Use available tools for person CRUD when relevant. Keep responses concise and action-oriented.',
      tools: anthropicTools,
      messages,
    }),
  })

  if (!response.ok) {
    const raw = await response.text()
    throw new Error(`Claude API request failed (${response.status}): ${raw}`)
  }

  return (await response.json()) as AnthropicResponse
}

export async function chatWithClaude(messages: ChatMessage[]): Promise<{ reply: string }> {
  let workingMessages: Array<{ role: 'user' | 'assistant'; content: unknown }> = messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))

  for (let i = 0; i < 6; i += 1) {
    const response = await callAnthropic(workingMessages)
    const content = response.content ?? []
    const toolUses = content.filter((block): block is AnthropicToolUseBlock => block.type === 'tool_use')
    const text = content
      .filter((block): block is AnthropicTextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    workingMessages.push({
      role: 'assistant',
      content,
    })

    if (toolUses.length === 0) {
      return { reply: text || 'Done.' }
    }

    const toolResultBlocks = await Promise.all(
      toolUses.map(async (toolUse) => {
        try {
          const result = await runTool(toolUse.name, toolUse.input)
          return {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result, null, 2),
          }
        } catch (error) {
          return {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            is_error: true,
            content: error instanceof Error ? error.message : 'Tool execution failed.',
          }
        }
      }),
    )

    workingMessages.push({
      role: 'user',
      content: toolResultBlocks,
    })
  }

  return {
    reply: 'I could not complete that request in time. Please try again with a more specific instruction.',
  }
}

export type { ChatMessage }
