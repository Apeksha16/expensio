-- Add created_by column to track who created the split expense
ALTER TABLE public.split_expenses 
ADD COLUMN created_by uuid REFERENCES public.profiles(id);

-- For existing records, assume the creator is the payer
UPDATE public.split_expenses 
SET created_by = payer_id 
WHERE created_by IS NULL;

-- Now that existing records are populated, we don't necessarily make it NOT NULL
-- just in case of edge cases, but for application logic we'll assume it exists.
