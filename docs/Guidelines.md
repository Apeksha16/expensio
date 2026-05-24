# Expensio — Complete Technical Architecture & Development Roadmap

## Project Overview

Expensio is a modern, mobile-first Progressive Web Application (PWA) focused on expense management, budgeting, social expense sharing, group expense tracking, and real-time collaboration.

The application will support:

- Personal Expense Tracking
- Budget Management
- Friends Management
- Expense Splitting
- Expense Groups & Events
- Real-time Notifications
- Offline Support
- PWA Installation
- Authentication & Authorization
- Dark/Light Mode
- Onboarding Journey
- Search Functionality
- Analytics & Insights

---

# Core Features

## Personal Finance

- Expense Tracking
- Expense Categorization
- Receipt Uploads
- Budget Management
- Spending Analytics
- Expense History

---

## Social Features

- Friend Management
- Friend Requests
- Real-time Friend Updates
- Expense Sharing
- Group Expense Management
- Settlement Tracking

---

## Realtime Features

- Friend Add/Remove Notifications
- Expense Create/Update/Delete Notifications
- Budget Create/Update/Delete Notifications
- Group Invitations
- Settlement Requests

---

## Productivity Features

- Offline Support
- PWA Installation
- Search System
- Notification Center
- Dashboard Analytics

---

# Technology Stack

## Frontend

### Framework

- Next.js 15+ (App Router)
- TypeScript

### Styling

- Tailwind CSS
- Tailwind Merge
- Class Variance Authority (CVA)

### State Management

- Zustand

### Server State

- TanStack Query (React Query)

### Forms & Validation

- React Hook Form
- Zod

### UI Components

- Shadcn UI
- Radix UI

### Animations

- Framer Motion
- Lottie React

### Charts

- Recharts

### PWA

- Serwist
- Service Workers
- Web Manifest
- Offline Caching
- Install Prompt

---

## Backend

### Framework

- Fastify

### Language

- TypeScript

### Validation

- Zod

### Realtime Communication

- Socket.IO

### Background Jobs

- BullMQ

### Cache Layer

- Upstash Redis

---

## Database & Infrastructure

### Database

- Supabase PostgreSQL

### ORM

- Drizzle ORM

### Storage

- Supabase Storage

### Search

- Meilisearch

### Authentication

- Supabase Auth

---

# Monorepo Structure

A Turborepo architecture is recommended from day one.

```txt
apps/
├── web
└── api

packages/
├── ui
├── types
├── validation
├── config
└── shared
```

---

# System Architecture

```txt
Frontend (Next.js PWA)

↓ HTTP API

Fastify Backend

├── Auth Module
├── User Module
├── Expense Module
├── Budget Module
├── Friend Module
├── Group Module
├── Notification Module
├── Settlement Module
├── Search Module
└── Realtime Module

↓

Drizzle ORM

↓

Supabase PostgreSQL

────────────────────────

Socket.IO

↓

Realtime Communication

────────────────────────

BullMQ

↓

Background Processing

────────────────────────

Redis

↓

Caching
Queue Backend
Presence Tracking
Rate Limiting

────────────────────────

Meilisearch

↓

Global Search

────────────────────────

Supabase Storage

↓

Receipts
Group Images
Avatars
```

---

# Domain Models

## User

```ts
User {
  id
  name
  username
  email
  avatar
  currency
  timezone
  createdAt
  updatedAt
}
```

---

## Friendship

```ts
Friendship {
  id
  senderId
  receiverId
  status
  createdAt
}
```

### Status

```txt
pending
accepted
rejected
blocked
```

---

## Expense

```ts
Expense {
  id
  userId
  title
  amount
  category
  note
  receiptUrl
  expenseDate
  createdAt
  updatedAt
  deletedAt
}
```

---

## Budget

```ts
Budget {
  id
  userId
  category
  limitAmount
  period
  createdAt
}
```

---

## Group

```ts
Group {
  id
  name
  description
  coverImage
  ownerId
  createdAt
}
```

---

## Group Member

```ts
GroupMember {
  id
  groupId
  userId
  role
}
```

### Roles

```txt
owner
admin
member
```

---

## Group Expense

```ts
GroupExpense {
  id
  groupId
  title
  amount
  paidBy
  note
  createdAt
}
```

---

## Split

```ts
Split {
  id
  expenseId
  userId
  amount
  percentage
  status
}
```

### Status

```txt
pending
settled
```

---

## Notification

```ts
Notification {
  id
  userId
  type
  title
  body
  isRead
  createdAt
}
```

---

## Settlement

```ts
Settlement {
  id
  payerId
  receiverId
  amount
  status
  settledAt
}
```

---

## Sync Queue

```ts
SyncQueue {
  id
  type
  payload
  status
  createdAt
}
```

---

# Backend Folder Structure

```txt
src

├── modules
│
├── auth
├── users
├── expenses
├── budgets
├── friends
├── groups
├── notifications
├── settlements
├── search
├── realtime
├── uploads
├── analytics
│
├── jobs
│
│   ├── notification.job.ts
│   ├── budget-alert.job.ts
│   ├── search-index.job.ts
│   ├── settlement.job.ts
│   └── cleanup.job.ts
│
├── db
│
│   ├── schema
│   ├── migrations
│   └── drizzle.ts
│
├── cache
│
├── config
│
├── plugins
│
├── shared
│
├── app.ts
└── server.ts
```

---

# Frontend Folder Structure

```txt
src

├── app
│
├── (auth)
├── (dashboard)
│
├── expenses
├── budgets
├── friends
├── groups
├── notifications
├── settings
├── onboarding
│
├── api
│
├── components
│
│   ├── ui
│   ├── shared
│   ├── forms
│   ├── charts
│   └── layouts
│
├── features
│
│   ├── auth
│   ├── expenses
│   ├── budgets
│   ├── friends
│   ├── groups
│   └── notifications
│
├── hooks
│
├── lib
│
│   ├── api
│   ├── auth
│   ├── query
│   ├── socket
│   └── utils
│
├── services
├── store
├── providers
├── constants
├── types
└── utils
```

---

# Authentication System

## Features

### Authentication

- Register
- Login
- Logout
- Forgot Password
- Reset Password

### Providers

- Email
- Google
- Apple

### Session Management

- Access Token
- Refresh Token

---

## Authorization

### Roles

```txt
user
admin
```

---

# Expense Module

## Features

### Create Expense

- Title
- Amount
- Category
- Date
- Notes
- Receipt Upload

### Edit Expense

### Delete Expense

Soft Delete Only

### Filters

- Today
- Week
- Month
- Year
- Category
- Amount

### Search

- Title
- Category

---

# Budget Module

## Features

### Create Budget

- Category
- Limit
- Period

### Analytics

- Total Spent
- Remaining
- Percentage Used
- Exceeded Amount

### Alerts

- 80% Budget Used
- 100% Budget Exceeded

---

# Friend Management Module

## Features

### User Search

- Email
- Username

### Friend Requests

- Send
- Accept
- Reject
- Cancel

### Friend List

- All Friends
- Pending Requests
- Sent Requests

---

# Group Module

## Features

### Create Group

- Name
- Description
- Cover Image

### Member Management

- Invite Members
- Remove Members
- Assign Roles

### Expense Management

- Create Group Expense
- Update Expense
- Delete Expense

---

# Expense Splitting

## Split Types

### Equal Split

```txt
₹1000 ÷ 4
```

### Custom Split

```txt
Custom Amounts
```

### Percentage Split

```txt
40%
30%
30%
```

---

# Settlement Module

## Features

### Debt Tracking

- Who Owes Whom
- Outstanding Amounts
- Net Balances

### Settlement Requests

- Create Request
- Accept Request
- Mark Settled

---

# Realtime Infrastructure

## Socket.IO Events

### Friend Events

```txt
friend:request
friend:accept
friend:remove
```

### Expense Events

```txt
expense:create
expense:update
expense:delete
```

### Budget Events

```txt
budget:create
budget:update
budget:delete
```

### Group Events

```txt
group:create
group:update
group:invite
```

### Notification Events

```txt
notification:new
notification:read
```

---

# Notification Center

## Types

- Friend Request
- Friend Accepted
- Expense Created
- Expense Updated
- Budget Exceeded
- Group Invitation
- Settlement Request

## Features

- Unread Count
- Mark Read
- Delete Notification

---

# Search Architecture

## Search Engine

Meilisearch

### Searchable Entities

#### Users

```txt
id
name
username
email
```

#### Groups

```txt
id
name
description
```

#### Expenses

```txt
id
title
category
note
```

#### Notifications

```txt
id
title
body
```

---

# Redis Strategy

## Cache

- User Profile
- Dashboard Analytics
- Expense Summary
- Budget Summary

## Rate Limiting

- Login API
- Register API
- Search API

## Presence Tracking

- Online Friends
- Active Group Members

## BullMQ Backend

- Job Storage
- Retry Logic

---

# BullMQ Job Processing

## Jobs

### Notifications

- Friend Notifications
- Group Notifications
- Settlement Notifications

### Reports

- Weekly Reports
- Monthly Reports

### Budget Monitoring

- Budget Threshold Alerts

### Search

- Meilisearch Sync

### Maintenance

- Receipt Cleanup
- Inactive User Cleanup

### Analytics

- Daily Aggregation
- Monthly Aggregation

---

# Offline First PWA Architecture

## Technology

- Serwist
- IndexedDB
- Local Cache

---

## Offline Data

- Expenses
- Budgets
- Friends
- Groups
- Notifications

---

## Synchronization Flow

```txt
Offline Action

↓

Store Locally

↓

Queue Action

↓

Connection Restored

↓

Automatic Sync

↓

Server Updated
```

---

# Theme System

## Supported Themes

### Light Mode

- Light Background
- Dark Text

### Dark Mode

- Dark Background
- Light Text

### Persistence

- Local Storage
- System Preference Detection

---

# Onboarding System

## Screens

### Screen 1

Track Every Expense

### Screen 2

Create Smart Budgets

### Screen 3

Split Expenses With Friends

### Screen 4

Manage Group Spending

### Screen 5

Stay Financially Organized

---

## Animation Framework

- Lottie
- Framer Motion

---

# Security Architecture

## API Security

- JWT Authentication
- Refresh Tokens
- Role-Based Access Control
- Request Validation

---

## Fastify Security

- Helmet
- Rate Limiting
- CORS Protection

---

## Database Security

Enable Row Level Security (RLS) for:

- Users
- Expenses
- Budgets
- Friendships
- Groups
- Group Members
- Group Expenses
- Notifications
- Settlements

---

# Testing Strategy

## Frontend

### Tools

- Vitest
- React Testing Library
- Playwright

### Coverage

- Components
- Hooks
- Pages
- Features

---

## Backend

### Tools

- Vitest
- Supertest

### Coverage

- Routes
- Services
- Repositories
- Socket Events

---

# Deployment Architecture

## Frontend

- Vercel

## Backend

- Railway

## Database

- Supabase

## Search

- Meilisearch Cloud

## Redis

- Upstash Redis

## Storage

- Supabase Storage

---

# Recommended Development Roadmap

## Phase 1

- Turborepo Setup
- Shared Packages Setup
- CI/CD Setup
- Environment Configuration

---

## Phase 2

- Database Design
- Drizzle Schema
- Drizzle Migrations

---

## Phase 3

- Authentication
- Authorization
- RLS Policies

---

## Phase 4

- User Profiles

---

## Phase 5

- Expense Tracking Module

---

## Phase 6

- Budget Management Module

---

## Phase 7

- Dashboard Module

---

## Phase 8

- Friend Management Module

---

## Phase 9

- Socket.IO Infrastructure

---

## Phase 10

- Notification Center

---

## Phase 11

- Groups Module

---

## Phase 12

- Expense Splitting Module

---

## Phase 13

- Settlement Module

---

## Phase 14

- Meilisearch Integration

---

## Phase 15

- BullMQ Integration

---

## Phase 16

- Redis Caching Layer

---

## Phase 17

- Offline First PWA Features

---

## Phase 18

- Dark / Light Theme System

---

## Phase 19

- Onboarding Experience

---

## Phase 20

- Testing

---

## Phase 21

- Performance Optimization

---

## Phase 22

- Production Deployment

---

# MVP Scope

Launch Version Includes:

- Authentication
- Expense Tracking
- Budget Management
- Dashboard
- Friend Management
- Realtime Notifications
- Groups
- Expense Splitting
- Search
- Dark/Light Mode
- PWA Support

---

# Version 2 Roadmap

## Advanced Features

- Offline Synchronization
- Settlement Engine
- Advanced Analytics
- Scheduled Reports
- Smart Budget Suggestions
- AI Expense Categorization
- AI Financial Insights
- Family Accounts
- Premium Features