-- Add icon column to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS icon text;

-- Add icon column to subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS icon text;

-- Add icon column to goals
ALTER TABLE goals ADD COLUMN IF NOT EXISTS icon text;

-- Add icon column to splits
ALTER TABLE split_expenses ADD COLUMN IF NOT EXISTS icon text;

-- Add icon column to budgets
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS icon text;
