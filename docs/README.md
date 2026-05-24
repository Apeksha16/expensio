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
### ---------------------------------------------- ###

FEATURES- 
1. Expense Tracking
2. Budget Management
3. Friends Management
4. Split Expense With Friends
5. Real-time Friends Add/ Remove/ Update notification System
6. Real-time Expense Add/ Remove/ Update notification System
7. Real-time Budget Add/ Remove/ Update notification System
8. PWA Capabilities
9. Mobile-first Design
10. Offline Support
11. Clean Authentication & Authorization System
12. Expense Groups & Events Tracking & Sharing with Friends.
13. Dark Light Mode
14. Onboarding Journey with Lottie Animations
