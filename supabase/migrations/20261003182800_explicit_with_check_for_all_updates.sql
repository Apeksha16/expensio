-- Fix RLS policies by explicitly defining WITH CHECK clauses for all UPDATE policies
-- This prevents the "new row violates row-level security policy" error caused by missing or restrictive default WITH CHECK clauses.

-- 1. profiles
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );

-- 2. expenses
DROP POLICY IF EXISTS "Users can update own expenses." ON public.expenses;
CREATE POLICY "Users can update own expenses."
  ON public.expenses FOR UPDATE
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- 3. budgets
DROP POLICY IF EXISTS "Users can update own budgets." ON public.budgets;
CREATE POLICY "Users can update own budgets."
  ON public.budgets FOR UPDATE
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- 4. friends (fixing the initial bug)
DROP POLICY IF EXISTS "Users can update their own friendships" ON public.friends;
CREATE POLICY "Users can update their own friendships"
  ON public.friends FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 5. split_groups
DROP POLICY IF EXISTS "Users can update groups they are a member of" ON public.split_groups;
CREATE POLICY "Users can update groups they are a member of"
  ON public.split_groups FOR UPDATE
  USING (auth.uid() = any(members))
  WITH CHECK (auth.uid() = any(members));

-- 6. split_expenses
DROP POLICY IF EXISTS "Users can update split expenses they are part of" ON public.split_expenses;
CREATE POLICY "Users can update split expenses they are part of"
  ON public.split_expenses FOR UPDATE
  USING (auth.uid() = any(participant_ids) OR auth.uid() = payer_id OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = any(participant_ids) OR auth.uid() = payer_id OR auth.uid() = created_by);

-- 7. subscriptions
DROP POLICY IF EXISTS "Users can update own subscriptions." ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions."
  ON public.subscriptions FOR UPDATE
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- 8. ledger_entries
DROP POLICY IF EXISTS "Users can update own ledger entries." ON public.ledger_entries;
CREATE POLICY "Users can update own ledger entries."
  ON public.ledger_entries FOR UPDATE
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- 9. ledger_sub_transactions
DROP POLICY IF EXISTS "Users can update own ledger sub-transactions." ON public.ledger_sub_transactions;
CREATE POLICY "Users can update own ledger sub-transactions."
  ON public.ledger_sub_transactions FOR UPDATE
  USING ( 
    exists (
      select 1 from public.ledger_entries 
      where id = ledger_id and user_id = auth.uid()
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.ledger_entries 
      where id = ledger_id and user_id = auth.uid()
    )
  );

-- 10. user_accounts
DROP POLICY IF EXISTS "Users can update own accounts." ON public.user_accounts;
CREATE POLICY "Users can update own accounts."
  ON public.user_accounts FOR UPDATE
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- 11. account_transactions
DROP POLICY IF EXISTS "Users can update own account transactions." ON public.account_transactions;
CREATE POLICY "Users can update own account transactions."
  ON public.account_transactions FOR UPDATE
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- 12. account_rollovers
DROP POLICY IF EXISTS "Users can update own account rollovers." ON public.account_rollovers;
CREATE POLICY "Users can update own account rollovers."
  ON public.account_rollovers FOR UPDATE
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );
