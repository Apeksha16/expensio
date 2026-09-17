-- 1. Add new columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_guest boolean default false,
ADD COLUMN IF NOT EXISTS created_by uuid references public.profiles(id) on delete cascade;

-- 2. Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  cash_balance numeric;
  savings_balance numeric;
BEGIN
  INSERT INTO public.profiles (id, username, name, salary, avatar_id, is_guest, created_by)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'salary')::numeric, 0),
    1,
    COALESCE((NEW.raw_user_meta_data->>'is_guest')::boolean, false),
    (NEW.raw_user_meta_data->>'created_by')::uuid
  );

  cash_balance := COALESCE((NEW.raw_user_meta_data->>'cash_balance')::numeric, 0);
  savings_balance := COALESCE((NEW.raw_user_meta_data->>'savings_balance')::numeric, 0);

  INSERT INTO public.user_accounts (user_id, account_type, balance)
  VALUES 
    (NEW.id, 'Salary', COALESCE((NEW.raw_user_meta_data->>'salary')::numeric, 0)),
    (NEW.id, 'Cash', cash_balance),
    (NEW.id, 'Savings', savings_balance);

  RETURN NEW;
END;
$$;

-- 3. Update search_users_for_friendship to exclude guests
CREATE OR REPLACE FUNCTION search_users_for_friendship(search_query text, max_friends int default 10)
RETURNS setof public.profiles AS $$
DECLARE
  current_user_uuid uuid;
  current_user_friend_count int;
BEGIN
  current_user_uuid := auth.uid();
  
  -- Check if current user is maxed out
  SELECT count(*) INTO current_user_friend_count FROM public.friends 
  WHERE (requester_id = current_user_uuid OR addressee_id = current_user_uuid)
  AND status IN ('pending', 'accepted');
  
  IF current_user_friend_count >= max_friends THEN
    RETURN; -- Return empty
  END IF;

  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  WHERE p.id != current_user_uuid
    AND p.is_guest = false -- EXCLUDE GUESTS
    AND (p.username ILIKE '%' || search_query || '%' OR p.name ILIKE '%' || search_query || '%')
    AND (
      -- Target user must have < max_friends
      (SELECT count(*) FROM public.friends f2 
       WHERE (f2.requester_id = p.id OR f2.addressee_id = p.id)
       AND f2.status IN ('pending', 'accepted')) < max_friends
    )
    AND NOT EXISTS (
      -- Must not already be friends or have pending request
      SELECT 1 FROM public.friends f3
      WHERE (f3.requester_id = current_user_uuid AND f3.addressee_id = p.id)
         OR (f3.requester_id = p.id AND f3.addressee_id = current_user_uuid)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';


-- 4. Create create_guest_user RPC
CREATE OR REPLACE FUNCTION public.create_guest_user(p_name text, p_username text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE
  new_guest_id uuid;
  current_user_id uuid;
  guest_count int;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Limit to 5 guests per user
  SELECT count(*) INTO guest_count FROM public.profiles WHERE created_by = current_user_id AND is_guest = true;
  IF guest_count >= 5 THEN
    RAISE EXCEPTION 'Maximum limit of 5 guest users reached.';
  END IF;

  new_guest_id := gen_random_uuid();
  
  -- Insert into auth.users with a dummy email and password
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (
    new_guest_id,
    '00000000-0000-0000-0000-000000000000',
    new_guest_id::text || '@guest.expensio',
    extensions.crypt('dummy_password123!', extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('username', p_username, 'full_name', p_name, 'is_guest', true, 'created_by', current_user_id)
  );

  -- Add to friends automatically
  INSERT INTO public.friends (requester_id, addressee_id, status)
  VALUES (current_user_id, new_guest_id, 'accepted');

  RETURN new_guest_id;
END;
$$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
