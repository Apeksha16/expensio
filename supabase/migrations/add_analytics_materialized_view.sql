-- supabase/migrations/add_analytics_materialized_view.sql

CREATE MATERIALIZED VIEW analytics_summary AS
SELECT
  user_id,
  date_trunc('month', date) as month,
  SUM(amount) as total_expenses,
  COUNT(id) as expense_count,
  AVG(amount) as avg_expense
FROM expenses
GROUP BY user_id, date_trunc('month', date);

CREATE UNIQUE INDEX idx_analytics_summary_user_month ON analytics_summary (user_id, month);

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('refresh-analytics', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_summary');

CREATE OR REPLACE FUNCTION get_analytics_summary(p_user_id uuid)
RETURNS TABLE (
  month timestamp,
  total_expenses numeric,
  expense_count bigint,
  avg_expense numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.month, 
    a.total_expenses, 
    a.expense_count, 
    a.avg_expense
  FROM analytics_summary a
  WHERE a.user_id = p_user_id
  AND a.month >= date_trunc('month', CURRENT_DATE - INTERVAL '11 months')
  ORDER BY a.month DESC;
END;
$$ LANGUAGE plpgsql;
