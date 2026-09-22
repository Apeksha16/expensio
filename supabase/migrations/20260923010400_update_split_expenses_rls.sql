-- Update RLS policies to allow users to view/create/update/delete split expenses if they are the creator

DROP POLICY IF EXISTS "Users can view split expenses they are part of" ON public.split_expenses;
CREATE POLICY "Users can view split expenses they are part of"
  ON public.split_expenses FOR SELECT
  USING (auth.uid() = any(participant_ids) OR auth.uid() = payer_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create split expenses" ON public.split_expenses;
CREATE POLICY "Users can create split expenses"
  ON public.split_expenses FOR INSERT
  WITH CHECK (auth.uid() = any(participant_ids) OR auth.uid() = payer_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update split expenses they are part of" ON public.split_expenses;
CREATE POLICY "Users can update split expenses they are part of"
  ON public.split_expenses FOR UPDATE
  USING (auth.uid() = any(participant_ids) OR auth.uid() = payer_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete split expenses they created" ON public.split_expenses;
CREATE POLICY "Users can delete split expenses they created"
  ON public.split_expenses FOR DELETE
  USING (auth.uid() = any(participant_ids) OR auth.uid() = payer_id OR auth.uid() = created_by);
