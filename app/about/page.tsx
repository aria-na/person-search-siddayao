import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Linkedin, Mail } from 'lucide-react'

function ProjectOverview() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          Person Search is a production-ready Person directory built with Next.js 16, Prisma, Clerk, and server actions.
          It supports full CRUD in the web app and through MCP-based tool calls from Claude Desktop.
        </p>
        <p className="mb-4">
          The system uses a shared data model and validation layer so both the UI and MCP route consume
          the same database-backed person records.
        </p>
        <p>
          Key capabilities include search, create, update, delete, machine-to-machine MCP access,
          and evaluator-visible live request logs.
        </p>
      </CardContent>
    </Card>
  )
}

function MCPArchitecture() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>MCP Integration Architecture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          1) Web users authenticate with Clerk and perform CRUD through server actions and API routes.
        </p>
        <p>
          2) The MCP route validates x-mcp-api-key for machine access and invokes shared server actions used by the app.
        </p>
        <p>
          3) API handlers enforce access via Clerk session or MCP API key before database operations run.
        </p>
        <p>
          4) Prisma writes and reads from the Person database so app UI and MCP tools stay in sync.
        </p>
      </CardContent>
    </Card>
  )
}

function SocialLinks() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button asChild>
        <Link href="https://www.linkedin.com/in/ariana-siddayao-1b90343b8/" target="_blank" rel="noopener noreferrer">
          <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="https://github.com/aria-na" target="_blank" rel="noopener noreferrer">
          <Github className="mr-2 h-4 w-4" /> GitHub
        </Link>
      </Button>
      <Button asChild variant="secondary">
        <Link href="mailto:arianasiddayao@gmail.com">
          <Mail className="mr-2 h-4 w-4" /> Email
        </Link>
      </Button>
    </div>
  )
}

function DeveloperInfo() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>About the Developer</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          Hi, I&apos;m <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">Ariana Siddayao</code>, the developer behind Person Search. I&apos;m passionate about creating 
          efficient, user-friendly web applications using the latest technologies.
        </p>
        <p className="mb-4">
          This project serves as a demonstration of my skills in Next.js, React, and modern frontend development.
          I&apos;m always looking to learn and improve, so feel free to reach out with any questions or feedback!
        </p>
        <SocialLinks />
      </CardContent>
    </Card>
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">About Person Search</h1>
        <ProjectOverview />
        <MCPArchitecture />
        <DeveloperInfo />
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="mt-2">
            <Link href="/mcp-setup">MCP Setup Guide</Link>
          </Button>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/mcp-demo">MCP Live Demo</Link>
          </Button>
          <Button asChild variant="link" className="mt-2">
            <Link href="/">
              Back to Home
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}

