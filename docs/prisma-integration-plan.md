# Prisma Integration Plan

## Goal
Replace in-memory people data with Prisma ORM-backed persistence while preserving the existing UI and server action interfaces.

## Plan
- Add Prisma dependencies and schema for `User`
- Add shared Prisma client at `lib/prisma.ts`
- Update server actions in `app/actions/actions.ts` to use Prisma CRUD
- Add environment variable setup (`DATABASE_URL`)
- Add seed script for starter records
- Push schema and seed local SQLite DB

## Status
- [x] Prisma dependencies installed
- [x] Prisma schema created
- [x] Prisma client singleton created
- [x] Server actions migrated to Prisma
- [x] Environment example added
- [x] Seed script added
- [x] Database pushed and seeded

## Notes
- Prisma is pinned to v6.18.0 for compatibility with this project's setup and schema format.
