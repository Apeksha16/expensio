-- Accelerates cursor pagination on expenses list
-- Used by: findManyWithCursor() ORDER BY date DESC, id DESC WHERE user_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_user_date_id_desc
ON expenses (user_id, date DESC, id DESC);

-- Accelerates filtered list by category per user
-- Used by: findManyWithCursor() with optional categoryId filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_user_category
ON expenses (user_id, category);

-- Accelerates outbox event processing and status polling
-- Used by: outbox worker querying pending events ordered by creation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outbox_events_status_created
ON outbox_events (status, created_at DESC);

-- Accelerates split JOIN lookups when loading expense details
-- Used by: findById() joining splits on expense_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_splits_expense_user
ON splits (expense_id, user_id);

-- Accelerates budget lookups for active period
-- Used by: analytics queries checking budget vs actual spend per period
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budgets_user_period_start
ON budgets (user_id, period, start_date);
