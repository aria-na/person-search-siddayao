import ClaudeChatClient from '@/app/components/claude-chat-client'

export default function ClaudeChatPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Claude Chat</h1>
        <p className="mt-2 text-muted-foreground">
          In-app Claude assistant for Person CRUD powered by Anthropic and your existing MCP tool logic.
        </p>
      </div>
      <ClaudeChatClient />
    </div>
  )
}
