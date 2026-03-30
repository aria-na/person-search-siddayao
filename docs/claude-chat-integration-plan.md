# Claude Chat In-App Plan

## Goal
Embed a Claude-powered chatbot directly inside the Person Search website so users can run Person CRUD workflows without opening Claude Desktop.

## Approach
- Add a server action that calls Anthropic Messages API.
- Reuse existing server actions for Person CRUD tool execution (`mcp-person-actions.ts`).
- Add a dedicated page `/claude-chat` with a chat UI and quick starter prompts.
- Keep the architecture API-light by using server actions instead of creating new API routes.

## Status
- [x] Added `app/actions/claude-chat-actions.ts` for Anthropic + tool loop.
- [x] Added `app/components/claude-chat-client.tsx` UI.
- [x] Added `app/claude-chat/page.tsx` route.
- [x] Added navbar link for `Claude Chat`.
- [x] Updated README with env requirements and page references.

## Environment Variables
- `ANTHROPIC_API_KEY` (required)
- `ANTHROPIC_MODEL` (optional, defaults to `claude-3-5-sonnet-latest`)

## Notes
- The in-app assistant uses the same Person CRUD tool logic used by MCP handlers for consistency.
- Chat responses are non-streaming for now to reduce implementation complexity.