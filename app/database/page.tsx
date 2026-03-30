import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const schemaSource = 'prisma/schema.prisma'

export default function DatabasePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Database Documentation</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prisma Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              This project uses Prisma ORM with a PostgreSQL database configured through the
              DATABASE_URL environment variable.
            </p>
            <p>
              Prisma schema source: <span className="font-mono text-sm">{schemaSource}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Model Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
              <li>id: String, primary key, generated with cuid()</li>
              <li>name: String, required</li>
              <li>email: String, required, unique constraint</li>
              <li>phoneNumber: String, required, unique constraint</li>
              <li>createdAt: DateTime, default now()</li>
              <li>updatedAt: DateTime, automatically updated on write</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Database Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              The application performs CRUD operations through Next.js server actions using Prisma Client.
            </p>
            <p>
              Unique constraints on email and phoneNumber prevent duplicate records and are surfaced as
              user-friendly validation messages in the UI.
            </p>
          </CardContent>
        </Card>

        <Button asChild variant="link" className="mt-2">
          <Link href="/">Back to Home</Link>
        </Button>
      </main>
    </div>
  )
}
