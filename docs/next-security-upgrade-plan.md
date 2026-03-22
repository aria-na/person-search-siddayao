# Next.js Security Upgrade Plan

## Goal
Resolve deployment failure caused by Vercel security policy flagging a vulnerable Next.js version.

## Actions Taken
- Upgraded `next` from `16.0.5` to `16.2.0`.
- Upgraded `eslint-config-next` from `16.0.5` to `16.2.0`.
- Updated `vercel.json` to use pnpm commands and lockfile-safe install:
  - `installCommand`: `pnpm install --frozen-lockfile --prod=false`
  - `buildCommand`: `pnpm prisma generate && pnpm run build`
- Added `postinstall` script in `package.json` to always run `prisma generate`.
- Ran local production build successfully.

## Validation
- `pnpm run build` passes and includes routes `/about`, `/github`, and `/database`.

## Clerk Auth Integration (March 2026)

### Goal
Replace planned Google/Auth.js setup with Clerk for free-tier friendly authentication in Next.js 16.

### Actions Taken
- Installed `@clerk/nextjs` via pnpm.
- Added `proxy.ts` at repo root with `clerkMiddleware()` and Clerk matcher for Next.js 16.
- Wrapped app tree in `ClerkProvider` in root layout.
- Updated navbar auth UI:
  - Signed out: `Sign In` and `Sign Up` buttons.
  - Signed in: `UserButton`.

### Follow-up Validation
- Run `pnpm dev`.
- Confirm sign-up, sign-in, and sign-out from navbar.
- Confirm Clerk keys exist in local env file.

## Auth Gate For CRUD (March 2026)

### Goal
Allow all visitors to see the page layout, while requiring authentication before search/add/edit/delete operations.

### Actions Taken
- Added Clerk auth guard in server actions for `searchUsers`, `addUser`, `updateUser`, and `deleteUser`.
- Added Clerk auth guard in `GET /api/people` route to return `401` for unauthenticated calls.
- Updated client interactions:
  - Search input opens Clerk sign-in when signed-out user clicks search.
  - Add button opens Clerk sign-in when signed-out user clicks add.
  - Edit button opens Clerk sign-in when signed-out user clicks edit.
  - Delete button opens Clerk sign-in when signed-out user clicks delete.

### Validation
- Signed-out users can view page and UI but cannot execute CRUD actions.
- Signed-in users can perform search/add/edit/delete normally.

## Philippine Phone Number Setup (March 2026)

### Goal
Use Philippine mobile format validation instead of Australian format in forms and sample data.

### Actions Taken
- Updated Zod phone validation to accept Philippine mobile formats: `09XXXXXXXXX`, `639XXXXXXXXX`, and `+639XXXXXXXXX`.
- Updated user form placeholder and helper text to Philippine examples.
- Updated fallback in-memory users and Prisma seed users to Philippine mobile numbers.

### Validation
- Build passes with updated schema and UI.

## Follow-up
- Redeploy in Vercel so the new dependency versions are used in a fresh build.
