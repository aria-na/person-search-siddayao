import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://person-search-siddayao.vercel.app'

const claudeConfigExample = `{
  "mcpServers": {
    "person-crud": {
      "transport": "streamable-http",
      "url": "${appBaseUrl}/api/mcp",
      "headers": {
        "x-mcp-api-key": "your_same_mcp_api_key"
      }
    }
  }
}`

const claudeMcpRemoteConfigExample = `{
  "mcpServers": {
    "person-crud": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "${appBaseUrl}/api/mcp",
        "--header",
        "x-mcp-api-key:your_same_mcp_api_key"
      ]
    }
  }
}`

const toolsExample = `Available MCP tools:
- person_create(name, email, phoneNumber)
- person_list(query?)
- person_get(id)
- person_update(id, name?, email?, phoneNumber?)
- person_delete(id)`

export default function MCPSetupPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">MCP Setup Guide</h1>
          <p className="mt-2 text-muted-foreground">
            Step-by-step instructions for connecting Claude Desktop to your Person CRUD MCP server.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1) Configure MCP API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Set <strong>MCP_API_KEY</strong> in this Next.js app environment and redeploy.</p>
            <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">{`# .env.local or Vercel env\nMCP_API_KEY=your_same_mcp_api_key\nNEXT_PUBLIC_APP_BASE_URL=${appBaseUrl}`}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2) Point Claude Desktop to /api/mcp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Recommended for Claude Desktop: use mcp-remote bridge config.</p>
            <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">{claudeMcpRemoteConfigExample}</pre>
            <p>Optional fallback (only if your Claude build supports direct streamable HTTP transport):</p>
            <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">{claudeConfigExample}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3) Verify Tool Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>After connecting, run tools/list and confirm these CRUD tools appear.</p>
            <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">{toolsExample}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4) Test CRUD End-to-End</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Run these checks:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Create person via Claude Desktop tool call.</li>
              <li>List/search person and confirm record exists.</li>
              <li>Update person fields and verify persisted values.</li>
              <li>Delete person and confirm it no longer appears in list results.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Use the in-app live tester at /mcp-demo for evaluator-visible request logs and JSON responses.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5) Screenshot Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Add screenshots to your repository for evaluator review:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Claude Desktop running person_create</li>
              <li>Claude Desktop running person_get or person_list</li>
              <li>Claude Desktop running person_update</li>
              <li>Claude Desktop running person_delete</li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/mcp-demo">Go to Live MCP Demo</Link>
          </Button>
          <Button asChild variant="link">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
