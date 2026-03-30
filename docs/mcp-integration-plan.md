# MCP Integration Plan

## Goal
Deliver a production-ready MCP-enabled Person app where evaluators can test Person CRUD through both the web UI and Claude Desktop MCP calls.

## Scope
- Full API CRUD coverage for Person records.
- Authentication strategy for both Clerk sessions and MCP machine calls.
- Built-in MCP JSON-RPC server endpoint for Claude Desktop calls.
- Required built-in pages: /mcp-setup, /mcp-demo, /github, /about updates.
- Live testing interface with request/response visibility.

## Implementation Progress
- [x] Added shared API access guard supporting Clerk session or x-mcp-api-key.
- [x] Expanded /api/people with GET(list/search) and POST(create).
- [x] Added /api/people/[id] with GET(read), PATCH(update), DELETE(delete).
- [x] Added /api/mcp built-in MCP server route with JSON-RPC methods initialize, tools/list, and tools/call.
- [x] Reused server actions in MCP tool handlers for person_create, person_list, person_get, person_update, and person_delete.
- [x] Updated /mcp-demo page to execute MCP tools directly with real-time logs and auto-refresh.
- [x] Updated /mcp-setup page with built-in /api/mcp Claude Desktop configuration.
- [x] Updated /about with MCP architecture explanation.
- [x] Updated /github with MCP server repository link section.
- [x] Updated top navigation with MCP links.
- [ ] Add Claude Desktop screenshots to public assets and embed in setup/demo pages.
- [ ] Validate production behavior after Vercel env update for MCP_API_KEY.

## Env Requirements
- MCP_API_KEY must be set in Vercel for app API machine access.
- MCP server local env should include APP_BASE_URL and MCP_API_KEY.

## Notes
- MCP server now runs directly in this Next.js app at /api/mcp.
- Web app remains single evaluator URL and hosts all required documentation and demo pages.
