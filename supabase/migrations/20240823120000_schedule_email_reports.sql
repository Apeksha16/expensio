-- Note: Ensure 'pg_net' and 'pg_cron' extensions are enabled in your Supabase Dashboard (Database -> Extensions) before running this.

-- Create the cron job to call the email-reports Edge Function every day at 8:00 AM UTC
-- Make sure to replace project-ref with your actual Supabase project reference in production
-- In local development, the edge function runs at http://host.docker.internal:54321/functions/v1/email-reports
SELECT cron.schedule(
    'daily-email-reports',
    '0 8 * * *',
    $$
    SELECT net.http_post(
        url:='http://host.docker.internal:54321/functions/v1/email-reports',
        headers:='{"Content-Type": "application/json"}'::jsonb
    ) as request_id;
    $$
);
