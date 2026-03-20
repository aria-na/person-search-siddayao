# Next.js Security Upgrade Plan

## Goal
Resolve deployment failure caused by Vercel security policy flagging a vulnerable Next.js version.

## Actions Taken
- Upgraded `next` from `16.0.5` to `16.2.0`.
- Upgraded `eslint-config-next` from `16.0.5` to `16.2.0`.
- Updated `vercel.json` to use pnpm commands and lockfile-safe install:
  - `installCommand`: `pnpm install --frozen-lockfile`
  - `buildCommand`: `pnpm run build`
- Ran local production build successfully.

## Validation
- `pnpm run build` passes and includes routes `/about`, `/github`, and `/database`.

## Follow-up
- Redeploy in Vercel so the new dependency versions are used in a fresh build.
