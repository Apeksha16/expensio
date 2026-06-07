# Expensio - Current State of App (Architecture & Features)

This document provides a detailed overview of the current architecture, data schemas, frontend layout interfaces, and modular backend features designed inside the Expensio monorepo.

---

## 1. High-Level Technology Architecture

Expensio is engineered as a modern, unified codebase utilizing a monorepo structure powered by **Turbo** and **npm workspaces**.

```mermaid
graph TD
    subgraph Frontend [apps/web (Next.js)]
        React[Next.js Client]
        Zustand[Zustand Stores]
        RQ[React Query Cache]
        SupabaseClient[Supabase Auth Client]
    end

    subgraph SharedLibraries [packages/*]
        Validation[shared/validation Zod]
        Types[shared/types TS Interfaces]
        Config[shared/config ESLint/TSConfig]
        UI[shared/ui Component Library]
    end

    subgraph Backend [apps/api (Fastify)]
        Controller[Fastify Controllers]
        Service[Business Service Layer]
        Repository[Database Repositories]
        Drizzle[Drizzle ORM]
        WebSockets[Socket.io Manager]
    end

    Database[(PostgreSQL DB)]

    React --> SharedLibraries
    Controller --> SharedLibraries
    React --> SupabaseClient
    React --> Backend
    Backend --> Drizzle
    Drizzle --> Database
```

### Core Frontend Stack (`apps/web`)

- **Framework**: Next.js (Client-side rendering, routing structure, React hook forms).
- **Styling**: Vanilla CSS custom themes (with light/dark theme-aware scaling and premium zinc color tokens).
- **State Management**: Zustand (stores for local auth and financial states) and `@tanstack/react-query` for cached server calls.
- **Animations**: Framer Motion (page slide transitions, button taps, and micro-interactions).
- **Authentication**: Supabase Auth integration.

### Core Backend Stack (`apps/api`)

- **Framework**: Fastify (microsecond-level routing, modular plugin registration).
- **ORM**: Drizzle ORM (type-safe SQL queries, migrations, PostgreSQL schema representation).
- **Database**: PostgreSQL (multi-tenant layout tracking users, budgets, split bills, and settlements).
- **WebSockets**: Socket.io (real-time notification triggers and balance synchronization).
- **Logging & Helpers**: Pino logger, custom rate limiters, and cryptographically secure MPIN hashing utilities.

---

## 2. PostgreSQL Schema & Data Relations

Database schemas are defined in [schema.ts](file:///d:/Personal/FULLSTACK/expensio/apps/api/src/db/schema.ts).

### Data Models & Constraints

| Table Name           | Primary Key | Key Columns & Types                                                                                                                                                                                                                         | Key Indexes / Relations                                                                                                     |
| :------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------- |
| **`users`**          | `id` (text) | `supabaseAuthId` (uuid, unique)<br>`email` (text, unique)<br>`name`, `username` (text, unique)<br>`avatarUrl` (text)<br>`currency`, `timezone` (text)<br>`monthlySalary` (double)<br>`isOnboardingCompleted` (bool)<br>`mpin` (hashed text) | Unique constraints on `email`, `username`, `supabaseAuthId`.                                                                |
| **`accounts`**       | `id` (text) | `userId` (text, references users)<br>`name`, `type` (text)<br>`balance` (double)<br>`currency` (text)                                                                                                                                       | Cascades on `userId` delete.<br>Index: `accounts_user_id_idx`.                                                              |
| **`expenses`**       | `id` (text) | `userId` (text, references users)<br>`amount` (double)<br>`category`, `paymentMethod` (text)<br>`date` (timestamp)<br>`accountId` (text, references accounts)<br>`groupId` (text, references groups)<br>`isSplit` (bool)                    | Cascades on `userId`/`accountId` delete.<br>Sets null on `groupId` delete.<br>Indexes on `userId`, `accountId`, and `date`. |
| **`budgets`**        | `id` (text) | `userId` (text, references users)<br>`categoryId` (text)<br>`amount` (double)<br>`period` (monthly/yearly)<br>`startDate`, `endDate` (timestamp)                                                                                            | Cascades on `userId` delete.<br>Indexes on `userId` and `categoryId`.                                                       |
| **`friendships`**    | `id` (text) | `senderId` (text, references users)<br>`receiverId` (text, references users)<br>`status` (pending/accepted/rejected/blocked)                                                                                                                | Cascades on sender/receiver deletes.<br>Indexes on `senderId`, `receiverId`, and `status`.                                  |
| **`groups`**         | `id` (text) | `name` (text)<br>`description` (text)<br>`coverImageUrl` (text)<br>`ownerId` (text, references users)                                                                                                                                       | Sets null on owner delete.<br>Index: `groups_owner_id_idx`.                                                                 |
| **`group_members`**  | `id` (text) | `groupId` (text, references groups)<br>`userId` (text, references users)<br>`role` (owner/admin/member)                                                                                                                                     | Cascades on `groupId` / `userId` deletes.<br>Indexes on `groupId` and `userId`.                                             |
| **`group_expenses`** | `id` (text) | `groupId` (text, references groups)<br>`title` (text)<br>`amount` (double)<br>`paidBy` (text, references users)<br>`note` (text)                                                                                                            | Cascades on `groupId` / `paidBy` deletes.<br>Indexes on `groupId` and `paidBy`.                                             |
| **`splits`**         | `id` (text) | `expenseId` (text, references expenses)<br>`groupExpenseId` (text, references group_expenses)<br>`userId` (text, references users)<br>`amount`, `percentage` (double)<br>`status` (pending/settled)                                         | Cascades on all foreign keys.<br>Indexes on `expenseId`, `groupExpenseId`, and `userId`.                                    |
| **`settlements`**    | `id` (text) | `payerId` (text, references users)<br>`receiverId` (text, references users)<br>`amount` (double)<br>`status` (pending/settled)<br>`settledAt` (timestamp)                                                                                   | Cascades on payer/receiver deletes.<br>Indexes on `payerId` and `receiverId`.                                               |
| **`notifications`**  | `id` (text) | `userId` (text, references users)<br>`type`, `title`, `body` (text)<br>`isRead` (bool)                                                                                                                                                      | Cascades on `userId` delete.<br>Indexes on `userId` and `isRead`.                                                           |
| **`sync_queue`**     | `id` (text) | `type`, `payload` (text)<br>`status` (pending/completed/failed)                                                                                                                                                                             | Index: `sync_queue_status_idx`. Handles offline syncing logs.                                                               |

---

## 3. Endpoints & Modular Backend Controllers

Modular controller layers are registered inside Fastify in `apps/api/src/modules` and use Zod definitions from `packages/validation` to guarantee input integrity before db entry.

### Auth Module (`auth.routes.ts`)

- Provides registration/login middleware verification callbacks with Supabase Auth hookups.

### Users Module (`users.routes.ts`)

- **`GET /api/v1/users/me`**: Fetches current user profile metrics.
- **`PUT /api/v1/users/me`**: Updates display name, currency config, timezone, and salary limit.
- **`POST /api/v1/users/onboarding`**: Records user onboarding completion profile parameters.
- **`PUT /api/v1/users/mpin`**: Updates or creates security PIN. Employs rate-limiting safeguards (with automatic clear on verification success) and custom hashing algorithms to save hashed secrets.

### Expenses Module (`expenses.routes.ts`)

- Handles transactions queries, single entries, update patches, deletion routes, and bulk selection deletions.

---

## 4. Frontend Client Features & Functional Workflows

Expensio's client-side PWA features are organized across structured user-experience screens.

### 1. Onboarding Screen (`/onboarding`)

- **Step 1: Identity & Persona**: Users select high-fidelity svg preset avatars (dicebear adventurer library) and input their profile display names.
- **Step 2: Core Base Currency & Income**: Setup base currency (defaulted to INR) and input the monthly salary cap to serve as the baseline budget calculation threshold.
- **Step 3: Access Security (MPIN)**: Set up a 4- or 6-digit numeric security MPIN. Upon submit, local stores transition `isOnboardingCompleted: true` and redirect to the dashboard.

### 2. Premium Analytics Dashboard (`/dashboard`)

- **Left-Aligned Mobile Header**: Dynamically reads the active route and presents a flat title next to the transparent hamburger menu button (Dashboard / Expenses / Budgets / Friends / Groups) preventing overlap with the right action buttons.
- **Financial Action Controls**: Quick toggles for search, light/dark theme toggles, and notification center toggles.
- **Balance Indicator Card**: Gorgeous visual widget computing total expenses against monthly salary caps.
- **AI Receipt Scanner Mock Tool**: Simulates scanning receipt invoices. Includes state transitions (`uploading` -> `analyzing layout` -> `extracting details` -> `review form`) populated with mock sports/coffee merchant transactions.
- **Timeframe Calendar Filters**: Period range filters (This Month, This Week, Custom) with custom date selections.

### 3. Expense Ledger (`/expenses`)

- **Ledger View**: Tab list of transactions with category tags (Food, Travel, Utilities, Credit Cards, etc.).
- **Advanced Filters**: Slide-out filter panel allowing sorting by ascending/descending dates and values, filtering transaction types (incomes/expenses), filtering payment modes (Cash, Credit Cards, UPI), and setting amount thresholds.
- **Batch selection**: Toggling select mode triggers checklist controls for bulk transaction deletes.

### 4. Budgets Limits (`/budgets`)

- Category-specific monthly allowances. Computes remaining balances and shows colored alert bars when expenses approach limits.

### 5. Peer-to-Peer Friends & Settlements (`/friends`)

- List of close contacts with current net-dues balance logs (Green: owes you, Red: you owe them). Handles cash squarings dynamically.

### 6. Groups & Expense Splitting (`/groups`)

- **Group Folders**: Grid cards showcasing group banners, member count, and gradient covers.
- **Group Search Parameter Synchronization**: Choosing a folder pushes its state to the url search parameters (`?id=<groupId>`), ensuring that reloading pages keeps detail states active and back actions work naturally.
- **Split Calculations**: Supports equal splitting or custom percentage ratios for shared expenses.
- **Direct Wallet Settlements**: Wallet vector graphics plotting net settlement paths (sender -> receiver nodes) with settle-up payment requests.

### 7. User Settings (`/settings`)

- Enables profile detail adjustments (avatars, salary limits).
- **Reset Security MPIN Sheet**: A dedicated slide-up BottomSheet modal that requests a 3-step security check (Current MPIN -> New MPIN -> Confirm MPIN) decoupled from general profile updates, featuring validation alerts and loader indications.
- **Session Termination**: Direct Supabase logout redirect triggers.
