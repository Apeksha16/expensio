# Expensio Architecture and Documentation

Welcome to **Expensio 2.0**, a highly performant and modern full-stack monorepo built using npm workspaces.

## Project Structure

```
expensio/
├── apps/
│   ├── web/               # Next.js Frontend (PWA)
│   └── api/               # Fastify Backend API
├── packages/
│   ├── shared-types/      # Shared TypeScript types / definitions
│   └── shared-utils/      # Shared utility/helper functions
└── docs/                  # Architecture & Guides (This folder)
```

## Tech Stack Overview

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **PWA Capabilities**: Next-PWA / Serwist (Service worker integrations)

### Backend
- **Framework**: Fastify (Node.js)
- **Language**: TypeScript
- **Realtime**: Socket.IO
- **Task Queue**: BullMQ
- **Caching**: Upstash Redis

### Database & ORM
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM
- **Storage**: Supabase Storage
- **Search**: Meilisearch

## Development Workflow

### Installing Dependencies
From the repository root, run:
```bash
npm install
```

### Running Locally
To run frontend and backend simultaneously:
```bash
# Run both in development
npm run dev --workspaces
```

Or run them individually:
```bash
# Run Next.js App
npm run dev:web

# Run Fastify API
npm run dev:api
```

### Building for Production
```bash
npm run build
```
