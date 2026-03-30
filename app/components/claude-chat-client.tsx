'use client'

import { useState } from 'react'
import { chatWithClaude } from '@/app/actions/claude-chat-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const starters = [
  'List all people.',
  'Create a person named Danna Cruz with email danna.cruz@example.com and phone 09191234567.',
  'Find person by email danna.cruz@example.com then update the name to Danna C. Cruz.',
  'Delete person by id cmnddc85m0000lb043i5dexuk.',
]

export default function ClaudeChatClient() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi. I can manage people using the same MCP CRUD tools (list, create, get, update, delete). Tell me what you want to do.',
    },
  ])

  async function submitMessage(customText?: string) {
    const text = (customText ?? input).trim()
    if (!text || loading) {
      return
    }

    const nextMessages = [...messages, { role: 'user', content: text } as ChatMessage]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const result = await chatWithClaude(nextMessages)
      setMessages((current) => [...current, { role: 'assistant', content: result.reply }])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Chat request failed.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Claude In-App Assistant</CardTitle>
          <CardDescription>
            Chat here to run Person CRUD without opening Claude Desktop. This uses Anthropic plus the same backend tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {starters.map((starter) => (
              <Button
                key={starter}
                variant="outline"
                size="sm"
                onClick={() => submitMessage(starter)}
                disabled={loading}
              >
                {starter}
              </Button>
            ))}
          </div>

          <ScrollArea className="h-[420px] rounded-md border p-3">
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === 'assistant'
                      ? 'rounded-md border bg-muted p-3 text-sm'
                      : 'rounded-md border border-primary/40 p-3 text-sm'
                  }
                >
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {message.role}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
              {loading ? <p className="text-sm text-muted-foreground">Claude is thinking...</p> : null}
            </div>
          </ScrollArea>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              void submitMessage()
            }}
          >
            <Textarea
              placeholder="Tell Claude what to do. Example: Update Danna's phone number to 09181234567."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={4}
              disabled={loading}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={loading || !input.trim()}>
                Send
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
