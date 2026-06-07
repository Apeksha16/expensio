# Expensio Phase F2.5 — Production Readiness & Architecture Drift Audit

**Date:** 2026-06-06
**Auditor:** Principal Staff Engineer & Platform Architect

---

## Executive Summary

Expensio has made significant progress through the P0, P1, D, E, and F phases. The core architecture is solid with Fastify, Drizzle, React Query, and Socket.io. However, rapid feature development has introduced severe architecture drift, redundant calculations, and critical scalability bottlenecks in background workers.

**Current Production Score:** 65/100
**Launch Recommendation:** ❌ NOT READY (Beta Only)

---

## Section 1 — Architecture Drift Audit

The codebase currently suffers from severe duplication across modules.

**Duplicate Logic & Dead Code:**

1. **Analytics vs. Dashboard:** Both `analytics.service.ts` and `dashboard.service.ts` manually fetch and calculate `getCategoryBreakdown()`, `getMonthlyExpensesSum()`, and active budget calculations. They duplicate Drizzle queries across `analytics.repository.ts` and `dashboard.repository.ts`.
2. **Unused Tables:** The `monthly_category_aggregates` table was created in F2 and is actively updated by `analytics.listener.ts`, but **no API reads from it**. The dashboard and analytics still compute aggregates on-the-fly from raw expenses.
3. **Frontend Drift:** `useExpenses.ts` mutates expenses but only invalidates `['expenses']` and `['dashboard-summary']`. It completely ignores `['analytics']` and `['budgets']`, leading to stale UI caches.
4. **Mock Data Types:** `store/mockData.ts` holds duplicate types (`Friend`, `Group`, `Expense`) which conflict with hook-level types, causing recent compilation breakages.

**Output (Safe-to-delete / Consolidate):**

- Consolidate `dashboard` and `analytics` services into a unified aggregation pipeline.
- Delete duplicate repository methods.
- Drop `mockData.ts` entirely.

---

## Section 2 — Database Audit

Schema review (`schema.ts`):

1. **Missing Composite Indexes:** Budget calculations rely heavily on `userId`, `category`, and `date`. The `expenses` table lacks a composite index on `(userId, category, date)`.
2. **Missing Reference Integrity:** `budgets.categoryId` is a plain `text` field without a foreign key relation to a dedicated `categories` table.
3. **Deleted At:** Soft deletes (`deletedAt`) are indexed, but many repository queries lack the `deletedAt IS NULL` check by default, risking phantom data in aggregates.

**Required Migrations Before Launch:**

- Add index `(userId, category, date)` on `expenses`.
- Enforce strict category enums or a reference table.

---

## Section 3 — Worker Audit

There is a critical divergence in worker quality:

1. **RecurringExpenseWorker:**
   - **Mechanism:** Uses `FOR UPDATE SKIP LOCKED`.
   - **Scalability:** ✅ Safe for multi-instance (can run 10 instances).
   - **Flaw:** Missed Outbox pattern. The worker commits the DB transaction _before_ publishing `eventBus.publish`. If the pod crashes in those milliseconds, the expense is created but the EventBus never triggers budgets or analytics.

2. **BudgetForecastWorker:**
   - **Mechanism:** Selects all `activeBudgets` and iterates. **No locking mechanism.**
   - **Scalability:** ❌ Max 1 instance. If deployed to 2+ instances, all nodes will forecast simultaneously and send duplicate push notifications.
   - **Flaw:** Must implement Redis locks or Postgres advisory locks.

---

## Section 4 — EventBus Audit

**Current Flows:**

- `expense.created/updated/deleted` ➔ `analytics.listener`, `budget.listener`
- `budget.warning/exceeded`, `recurring_expense.generated` ➔ `notification.service`

**Risks:**

1. **Concurrency Skew:** `analytics.listener` updates `monthly_category_aggregates` via SQL `ON CONFLICT DO UPDATE`. If multiple `expense.updated` events fire rapidly out of order, the delta math (`amount - previousAmount`) can corrupt the aggregate.
2. **Missing Outbox:** Event publishing is purely in-memory (`setImmediate`). Any application crash loses all pending internal events.

---

## Section 5 — Analytics Audit

- **Data Consistency:** The `monthlyCategoryAggregates` table is fundamentally vulnerable to drift. There is no backfill or reconciliation cron job. If the `analytics.listener` fails (or server restarts before `setImmediate` fires), the aggregate is permanently corrupted.
- **Mathematical Correctness:** The listener handles updates by taking the delta. But because it relies on `previousAmount` being correctly passed in memory, any bug in the controller layer passing the wrong delta ruins the aggregate.

---

## Section 6 — Notification Audit

- **Realtime Delivery:** Sockets handle realtime push flawlessly.
- **Offline Delivery:** PWA lacks Web Push API integration. Offline users receive no OS-level notifications.
- **Database Growth:**
  - 10k users \* 10 notifications/month = 1.2M rows/year.
  - The `notifications` table has no TTL or partitioning strategy.
- **Recommendation:** Implement a 30-day rolling TTL cron job for read notifications.

---

## Section 7 — Security Audit

- **JWT Verification:** ✅ P0.1 resolved the network bottleneck. `auth.service.ts` uses local CPU validation.
- **Socket Isolation:** ✅ Rooms are strictly locked to `socket.data.user.id`.
- **Rate Limiting:** ✅ Enabled via Fastify plugins.
- **Vulnerabilities:** `P1` - No idempotency keys on expense creation/settlement routes, risking duplicate charges if a mobile user double-taps on poor network.

---

## Section 8 — Frontend Audit

**React Query Risks:**

1. **Stale Cache (P0):** `useExpenses.ts` does not invalidate `queryKey: ['analytics']` or `queryKey: ['budgets']`. Adding an expense will not reflect in the analytics chart until a hard refresh.
2. **Duplicate Requests:** The lack of a central query boundary causes components on the Dashboard to fetch user data simultaneously.

---

## Section 9 — Mobile Experience Audit

- **iOS/Android PWA:** Basic meta tags and `manifest.webmanifest` are present.
- **Safe Areas:** Implemented via `safe-area-inset-bottom`.
- **Missing Elements:**
  - No native smooth scrolling (`-webkit-overflow-scrolling: touch` missing in some generic lists).
  - No Web Push notifications for offline budget alerts.
- **Score:** 7/10

---

## Section 10 — Production Launch Readiness

| Category     | Score | Notes                                                      |
| ------------ | ----- | ---------------------------------------------------------- |
| Architecture | 6/10  | Severe drift between Analytics and Dashboard.              |
| Performance  | 8/10  | Fastify + Drizzle are highly performant.                   |
| Security     | 9/10  | JWT and Socket isolation are excellent.                    |
| Scalability  | 5/10  | BudgetWorker will corrupt notifications on multi-instance. |
| Realtime     | 9/10  | Socket integration is solid.                               |

**Launch Recommendation:** NOT READY
**Expected Score After Fixes:** 95/100

### Critical Blockers to Fix Before Launch:

1. Wrap `BudgetForecastWorker` in a distributed lock or convert to `SKIP LOCKED` job queue.
2. Fix `useExpenses.ts` query invalidation for analytics/budgets.
3. Replace on-the-fly dashboard category aggregate queries with reads from `monthly_category_aggregates`.
4. Implement atomic outbox pattern (or transactional event emission) for `RecurringExpenseWorker`.
