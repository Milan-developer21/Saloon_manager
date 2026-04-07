# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Saloon Manager (mobile app)
- **Path**: `artifacts/saloon/`
- **Type**: Expo (React Native)
- **Preview**: `/` (root path)
- **Description**: Saloon management app for appointments and customer management
- **Storage**: AsyncStorage (no backend required)
- **Features**:
  - Dashboard with today's appointments, revenue, and stats
  - Appointment booking (multi-step flow: customer → service → date/time → review)
  - Appointment management (mark complete, no-show, cancel)
  - Customer profiles with visit history and total spend
  - Services catalog with categories, prices, duration
  - Search/filter across all entities

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
