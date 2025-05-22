# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blank is an expense tracking/splitting application built with SST v3, featuring offline-first architecture with real-time sync via Rocicorp Zero. The app uses AI for natural language expense parsing and supports multi-tenant group expense sharing.

## Development Commands

- `pnpm dev` - Start SST development environment
- `pnpm build` - Build all packages in workspace
- `pnpm test` - Run tests across all packages
- `pnpm lint` / `pnpm lint:fix` - Lint all packages
- `pnpm db` - Run Drizzle Kit for database operations
- `pnpm db:reset` - Reset and seed database
- `pnpm ai:eval` - Run AI model evaluations with Braintrust

## Architecture

### Monorepo Structure
- `@blank/core` - Shared business logic, database schemas, AI/NL processing, utilities
- `@blank/web` - React frontend with TanStack Router, Radix UI, Tailwind CSS v4
- `@blank/api` - Lambda-based API endpoints
- `@blank/auth` - OpenAuth implementation with Google OAuth
- `@blank/zero` - Real-time sync schema and permissions

### Key Patterns
- **Offline-First**: Uses Rocicorp Zero for client-side caching and real-time sync
- **Effect/Neverthrow**: Functional error handling (migrating from neverthrow to effect)
- **Schema-First**: Shared types via Drizzle (database) and Zero (sync) schemas
- **AI-Enhanced UX**: Natural language expense parsing with multiple model providers
- **File-Based Routing**: TanStack Router with protected/static route layouts

### Database
- PostgreSQL on Neon with Drizzle ORM
- Run migrations: `pnpm db`
- Reset with seed data: `pnpm db:reset`
- Schema files: `packages/core/src/db/schema/`

### Real-Time Sync
- Zero schema in `packages/zero/schema.ts` defines client-server sync rules
- Permissions configured per user/group access
- Client-side caching enables offline functionality

## Code Style

- TypeScript with functional/declarative patterns
- Prefer string literals over booleans for status fields
- No enums - use maps/string literals/types
- Component props defined as separate type interfaces
- Directory names: lowercase with dashes
- Use Radix UI primitives with Tailwind CSS v4
- Error handling with neverthrow/effect Result types

## Infrastructure

SST configuration in `sst.config.ts` defines:
- Neon PostgreSQL database with environment secrets
- OpenAuth lambda for authentication
- API router for Lambda endpoints
- Zero sync services for real-time functionality
- ECS cluster for containerized services
- Cloudflare domain management