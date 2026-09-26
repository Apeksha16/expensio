ALTER TABLE public.emis 
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS transactions jsonb DEFAULT '[]'::jsonb;
