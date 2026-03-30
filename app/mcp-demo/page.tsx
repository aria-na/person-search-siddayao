import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MCPDemoClient from '@/app/components/mcp-demo-client'

export default function MCPDemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">MCP Demo</h1>
          <p className="mt-2 text-muted-foreground">
            Real-time CRUD verification panel that calls the built-in MCP server at /api/mcp.
          </p>
        </div>

        <MCPDemoClient />

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/mcp-setup">Open MCP Setup Guide</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/github">Open GitHub References</Link>
          </Button>
          <Button asChild variant="link">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
