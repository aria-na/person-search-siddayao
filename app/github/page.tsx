import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github } from 'lucide-react'

const repositoryUrl = 'https://github.com/aria-na/person-search-siddayao'
const mcpRepositoryUrl = process.env.NEXT_PUBLIC_MCP_SERVER_REPO_URL || 'https://github.com/aria-na/person-search-mcp-server'

export default function GithubPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">GitHub Repository</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Public Repository</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              This project is publicly available on GitHub. Use the link below to view the source code,
              commit history, and project documentation.
            </p>
            <Button asChild>
              <Link href={repositoryUrl} target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" /> Open GitHub Repository
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground break-all">{repositoryUrl}</p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Person MCP Server Repository</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              This repository contains the MCP server used by Claude Desktop to execute Person CRUD operations
              against this deployed app.
            </p>
            <Button asChild>
              <Link href={mcpRepositoryUrl} target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" /> Open MCP Server Repository
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground break-all">{mcpRepositoryUrl}</p>
          </CardContent>
        </Card>

        <Button asChild variant="outline" className="mt-2 mr-2">
          <Link href="/mcp-setup">View MCP Setup Page</Link>
        </Button>

        <Button asChild variant="outline" className="mt-2">
          <Link href="/mcp-demo">View MCP Demo Page</Link>
        </Button>

        <Button asChild variant="link" className="mt-2">
          <Link href="/">Back to Home</Link>
        </Button>
      </main>
    </div>
  )
}
