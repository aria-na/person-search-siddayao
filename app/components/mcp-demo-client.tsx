'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Person = {
  id: string
  name: string
  email: string
  phoneNumber: string
}

type LogEntry = {
  id: string
  timestamp: string
  method: string
  endpoint: string
  status: number
  ok: boolean
  requestBody?: unknown
  responseBody?: unknown
}

type RequestResult<T> = {
  ok: boolean
  status: number
  data: T | null
}

type JsonRpcError = {
  code: number
  message: string
}

type JsonRpcResponse<T> = {
  jsonrpc: '2.0'
  id: string | number | null
  result?: {
    content?: Array<{ type: string; text?: string }>
    structuredContent?: T
  }
  error?: JsonRpcError
}

const initialCreate = {
  name: '',
  email: '',
  phoneNumber: '',
}

const initialUpdate = {
  id: '',
  name: '',
  email: '',
  phoneNumber: '',
}

function createLogId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function MCPDemoClient() {
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [selectedUser, setSelectedUser] = useState<Person | null>(null)
  const [createForm, setCreateForm] = useState(initialCreate)
  const [updateForm, setUpdateForm] = useState(initialUpdate)
  const [mcpApiKey, setMcpApiKey] = useState('')
  const [useMcpHeader, setUseMcpHeader] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [message, setMessage] = useState('Ready for MCP CRUD testing.')
  const [busyAction, setBusyAction] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)

  const status = useMemo(() => {
    if (busyAction) {
      return { label: `Running ${busyAction}`, tone: 'secondary' as const }
    }

    if (!logs.length) {
      return { label: 'Idle', tone: 'outline' as const }
    }

    return logs[0].ok
      ? { label: 'Last request succeeded', tone: 'default' as const }
      : { label: 'Last request failed', tone: 'destructive' as const }
  }, [busyAction, logs])

  async function requestMcp<T>(method: string, params?: unknown): Promise<RequestResult<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (useMcpHeader && mcpApiKey.trim()) {
      headers['x-mcp-api-key'] = mcpApiKey.trim()
    }

    const requestBody = {
      jsonrpc: '2.0',
      id: createLogId(),
      method,
      params,
    }

    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      let payload: JsonRpcResponse<T> | null = null
      try {
        payload = (await response.json()) as JsonRpcResponse<T>
      } catch {
        payload = null
      }

      const ok = Boolean(response.ok && payload && !payload.error)
      const data = payload?.result?.structuredContent ?? null

      const entry: LogEntry = {
        id: createLogId(),
        timestamp: new Date().toLocaleTimeString(),
        method,
        endpoint: '/api/mcp',
        status: response.status,
        ok,
        requestBody,
        responseBody: payload,
      }

      setLogs((current) => [entry, ...current].slice(0, 12))

      return {
        ok,
        status: response.status,
        data,
      }
    } catch (error) {
      const entry: LogEntry = {
        id: createLogId(),
        timestamp: new Date().toLocaleTimeString(),
        method,
        endpoint: '/api/mcp',
        status: 0,
        ok: false,
        requestBody,
        responseBody: {
          error: error instanceof Error ? error.message : 'Network error',
        },
      }

      setLogs((current) => [entry, ...current].slice(0, 12))

      return {
        ok: false,
        status: 0,
        data: null,
      }
    }
  }

  async function callMcpTool<T>(name: string, args: Record<string, unknown>): Promise<RequestResult<T>> {
    return requestMcp<T>('tools/call', {
      name,
      arguments: args,
    })
  }

  async function listMcpTools() {
    setBusyAction('TOOLS(list)')
    const result = await requestMcp<{ tools: Array<{ name: string }> }>('tools/list')

    if (result.ok && result.data) {
      const toolNames = result.data.tools.map((tool) => tool.name).join(', ')
      setMessage(`MCP tools available: ${toolNames}`)
    } else {
      setMessage('Failed to fetch MCP tool list. Check request log details.')
    }

    setBusyAction('')
  }

  async function loadPeople() {
    setBusyAction('READ(list)')
    const result = await callMcpTool<Person[]>('person_list', {
      query: query.trim() || undefined,
    })

    const listData = Array.isArray(result.data)
      ? result.data
      : (result.data as { items?: Person[] } | null)?.items

    if (result.ok && Array.isArray(listData)) {
      setPeople(listData)
      setMessage(`Loaded ${listData.length} record(s).`)
    } else {
      setMessage('Failed to load records. Check request log details.')
    }

    setBusyAction('')
  }

  async function createPerson() {
    setBusyAction('CREATE')

    const result = await callMcpTool<Person>('person_create', createForm)
    if (result.ok && result.data) {
      setMessage(`Created user: ${result.data.name}`)
      setCreateForm(initialCreate)
      await loadPeople()
    } else {
      setMessage('Create request failed. Check request log details.')
      setBusyAction('')
    }
  }

  async function getPersonById(id: string) {
    setBusyAction('READ(single)')

    const result = await callMcpTool<Person>('person_get', { id })
    if (result.ok && result.data) {
      setSelectedUser(result.data)
      setUpdateForm({
        id: result.data.id,
        name: result.data.name,
        email: result.data.email,
        phoneNumber: result.data.phoneNumber,
      })
      setMessage(`Fetched user: ${result.data.name}`)
    } else {
      setMessage('Read-by-id request failed. Check request log details.')
    }

    setBusyAction('')
  }

  async function updatePerson() {
    if (!updateForm.id.trim()) {
      setMessage('Enter a target ID for update.')
      return
    }

    setBusyAction('UPDATE')

    const payload = {
      name: updateForm.name,
      email: updateForm.email,
      phoneNumber: updateForm.phoneNumber,
    }

    const result = await callMcpTool<Person>('person_update', {
      id: updateForm.id,
      ...payload,
    })
    if (result.ok && result.data) {
      setSelectedUser(result.data)
      setMessage(`Updated user: ${result.data.name}`)
      await loadPeople()
    } else {
      setMessage('Update request failed. Check request log details.')
      setBusyAction('')
    }
  }

  async function deletePerson(id: string) {
    setBusyAction('DELETE')

    const result = await callMcpTool<{ success: boolean }>('person_delete', { id })
    if (result.ok) {
      setMessage(`Deleted user with id ${id}.`)
      if (selectedUser?.id === id) {
        setSelectedUser(null)
      }
      if (updateForm.id === id) {
        setUpdateForm(initialUpdate)
      }
      await loadPeople()
    } else {
      setMessage('Delete request failed. Check request log details.')
      setBusyAction('')
    }
  }

  function fillUpdateTarget(person: Person) {
    setUpdateForm(person)
    setSelectedUser(person)
  }

  useEffect(() => {
    if (!autoRefresh) {
      return
    }

    const intervalId = window.setInterval(() => {
      if (!busyAction) {
        void loadPeople()
      }
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [autoRefresh, busyAction, query])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>MCP Test Controls</CardTitle>
          <CardDescription>
            This panel calls the built-in MCP server at /api/mcp using JSON-RPC tools/list and tools/call.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={status.tone}>{status.label}</Badge>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[220px_1fr] md:items-center">
            <label className="text-sm font-medium" htmlFor="mcp-toggle">Use MCP API key header</label>
            <div className="flex items-center gap-3">
              <Button
                id="mcp-toggle"
                type="button"
                variant={useMcpHeader ? 'default' : 'outline'}
                onClick={() => setUseMcpHeader((value) => !value)}
              >
                {useMcpHeader ? 'MCP Header Enabled' : 'MCP Header Disabled'}
              </Button>
              <Input
                placeholder="Paste MCP_API_KEY value"
                value={mcpApiKey}
                onChange={(event) => setMcpApiKey(event.target.value)}
              />
              <Button type="button" variant="outline" onClick={listMcpTools} disabled={Boolean(busyAction)}>
                List Tools
              </Button>
              <Button
                type="button"
                variant={autoRefresh ? 'default' : 'outline'}
                onClick={() => setAutoRefresh((current) => !current)}
              >
                {autoRefresh ? 'Auto Refresh On (5s)' : 'Auto Refresh Off'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Person Directory (Live CRUD)</CardTitle>
          <CardDescription>
            Run Create, Read, Update, and Delete through MCP tools that persist directly to the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              placeholder="Search by name prefix"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button type="button" onClick={loadPeople} disabled={Boolean(busyAction)}>
              Load Records
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No records loaded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  people.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-mono text-xs">{person.id}</TableCell>
                      <TableCell>{person.name}</TableCell>
                      <TableCell>{person.email}</TableCell>
                      <TableCell>{person.phoneNumber}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => getPersonById(person.id)}>
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => fillUpdateTarget(person)}>
                            Edit Target
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deletePerson(person.id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Person (MCP Create)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Full name"
              value={createForm.name}
              onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              placeholder="Email"
              value={createForm.email}
              onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
            />
            <Input
              placeholder="Phone number (e.g., 09171234567)"
              value={createForm.phoneNumber}
              onChange={(event) => setCreateForm((current) => ({ ...current, phoneNumber: event.target.value }))}
            />
            <Button type="button" onClick={createPerson} disabled={Boolean(busyAction)}>Create</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Person (MCP Update)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Target user id"
              value={updateForm.id}
              onChange={(event) => setUpdateForm((current) => ({ ...current, id: event.target.value }))}
            />
            <Input
              placeholder="Updated full name"
              value={updateForm.name}
              onChange={(event) => setUpdateForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              placeholder="Updated email"
              value={updateForm.email}
              onChange={(event) => setUpdateForm((current) => ({ ...current, email: event.target.value }))}
            />
            <Input
              placeholder="Updated phone number"
              value={updateForm.phoneNumber}
              onChange={(event) => setUpdateForm((current) => ({ ...current, phoneNumber: event.target.value }))}
            />
            <Button type="button" onClick={updatePerson} disabled={Boolean(busyAction)}>Update</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last Read Result</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedUser ? (
            <div className="grid gap-2 text-sm">
              <p><span className="font-semibold">ID:</span> <span className="font-mono">{selectedUser.id}</span></p>
              <p><span className="font-semibold">Name:</span> {selectedUser.name}</p>
              <p><span className="font-semibold">Email:</span> {selectedUser.email}</p>
              <p><span className="font-semibold">Phone:</span> {selectedUser.phoneNumber}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No person selected yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request / Response Log</CardTitle>
          <CardDescription>Real-time log for evaluator verification.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests yet.</p>
            ) : (
              logs.map((entry) => (
                <div key={entry.id} className="rounded-md border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant={entry.ok ? 'default' : 'destructive'}>{entry.status}</Badge>
                    <span className="font-medium">{entry.method}</span>
                    <span className="font-mono text-xs">{entry.endpoint}</span>
                    <span className="text-muted-foreground">{entry.timestamp}</span>
                  </div>
                  <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                    {JSON.stringify({ request: entry.requestBody ?? null, response: entry.responseBody ?? null }, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
