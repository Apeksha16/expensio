-- Create a public profiles table to store user metadata and enforce unique usernames
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  name text,
  salary numeric default 0,
  avatar_id integer default 1,
  failed_attempts int default 0,
  locked_until timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies

drop policy if exists "Users can insert their own profile." on public.profiles;
-- Policy: Users can insert their own profile.
create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on public.profiles;
-- Policy: Users can update their own profile.
create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

drop policy if exists "Profiles are viewable by everyone." on public.profiles;
-- Policy: Anyone can read profiles (useful for deduplication and friends list).
create policy "Profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

-- Create expenses table if it does not exist
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  amount numeric not null,
  category text not null,
  date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.expenses enable row level security;

-- Policy: Users can insert their own expenses.
drop policy if exists "Users can insert own expenses." on public.expenses;
create policy "Users can insert own expenses."
  on public.expenses for insert
  with check ( auth.uid() = user_id );

-- Policy: Users can update their own expenses.
drop policy if exists "Users can update own expenses." on public.expenses;
create policy "Users can update own expenses."
  on public.expenses for update
  using ( auth.uid() = user_id );

-- Policy: Users can delete their own expenses.
drop policy if exists "Users can delete own expenses." on public.expenses;
create policy "Users can delete own expenses."
  on public.expenses for delete
  using ( auth.uid() = user_id );

-- Policy: Users can select their own expenses.
drop policy if exists "Users can view own expenses." on public.expenses;
create policy "Users can view own expenses."
  on public.expenses for select
  using ( auth.uid() = user_id );

-- Create budgets table if it does not exist
create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric not null,
  icon_path text not null,
  month text not null,
  auto_rollover boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.budgets enable row level security;

-- Policy: Users can insert their own budgets.
drop policy if exists "Users can insert own budgets." on public.budgets;
create policy "Users can insert own budgets."
  on public.budgets for insert
  with check ( auth.uid() = user_id );

-- Policy: Users can update their own budgets.
drop policy if exists "Users can update own budgets." on public.budgets;
create policy "Users can update own budgets."
  on public.budgets for update
  using ( auth.uid() = user_id );

-- Policy: Users can delete their own budgets.
drop policy if exists "Users can delete own budgets." on public.budgets;
create policy "Users can delete own budgets."
  on public.budgets for delete
  using ( auth.uid() = user_id );

-- Policy: Users can select their own budgets.
drop policy if exists "Users can view own budgets." on public.budgets;
create policy "Users can view own budgets."
  on public.budgets for select
  using ( auth.uid() = user_id );

-- Friends Table
create table if not exists public.friends (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(requester_id, addressee_id),
  constraint friends_cannot_add_self check (requester_id != addressee_id)
);

-- Enable RLS
alter table public.friends enable row level security;

-- Policy: Users can view their own friendships
drop policy if exists "Users can view their own friendships" on public.friends;
create policy "Users can view their own friendships"
  on public.friends for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Policy: Users can insert friendships as requester
drop policy if exists "Users can insert friendships as requester" on public.friends;
create policy "Users can insert friendships as requester"
  on public.friends for insert
  with check (auth.uid() = requester_id);

-- Policy: Users can update their own friendships
drop policy if exists "Users can update their own friendships" on public.friends;
create policy "Users can update their own friendships"
  on public.friends for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Policy: Users can delete their own friendships
drop policy if exists "Users can delete their own friendships" on public.friends;
create policy "Users can delete their own friendships"
  on public.friends for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Enable real-time for friends table
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.friends;
alter publication supabase_realtime add table public.split_groups;
alter publication supabase_realtime add table public.split_expenses;

-- Search Function
create or replace function search_users_for_friendship(search_query text, max_friends int default 10)
returns setof public.profiles as $$
declare
  current_user_uuid uuid;
  current_user_friend_count int;
begin
  current_user_uuid := auth.uid();
  
  -- Check if current user is maxed out
  select count(*) into current_user_friend_count from public.friends 
  where (requester_id = current_user_uuid or addressee_id = current_user_uuid)
  and status in ('pending', 'accepted');
  
  if current_user_friend_count >= max_friends then
    return; -- Return empty
  end if;

  return query
  select p.*
  from public.profiles p
  where p.id != current_user_uuid
    and (p.username ilike '%' || search_query || '%' or p.name ilike '%' || search_query || '%')
    and (
      -- Target user must have < max_friends
      (select count(*) from public.friends f2 
       where (f2.requester_id = p.id or f2.addressee_id = p.id)
       and f2.status in ('pending', 'accepted')) < max_friends
    )
    and not exists (
      -- Must not already be friends or have pending request
      select 1 from public.friends f3
      where (f3.requester_id = current_user_uuid and f3.addressee_id = p.id)
         or (f3.requester_id = p.id and f3.addressee_id = current_user_uuid)
    );
end;
$$ language plpgsql security definer set search_path = '';


-- Split Groups Table
create table if not exists public.split_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  members uuid[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for split_groups
alter table public.split_groups enable row level security;

-- Users can view groups they are a member of
drop policy if exists "Users can view groups they are a member of" on public.split_groups;
create policy "Users can view groups they are a member of"
  on public.split_groups for select
  using (auth.uid() = any(members));

-- Users can insert groups if they are the creator and in the members list
drop policy if exists "Users can create groups" on public.split_groups;
create policy "Users can create groups"
  on public.split_groups for insert
  with check (auth.uid() = creator_id and auth.uid() = any(members));

-- Users can update groups they are a member of
drop policy if exists "Users can update groups they are a member of" on public.split_groups;
create policy "Users can update groups they are a member of"
  on public.split_groups for update
  using (auth.uid() = any(members));

-- Users can delete groups if they are the creator
drop policy if exists "Users can delete their own groups" on public.split_groups;
create policy "Users can delete their own groups"
  on public.split_groups for delete
  using (auth.uid() = creator_id);


-- Split Expenses Table
create table if not exists public.split_expenses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  total_amount numeric not null,
  payer_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.split_groups(id) on delete cascade,
  date timestamp with time zone not null,
  participants jsonb not null default '[]'::jsonb,
  participant_ids uuid[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for split_expenses
alter table public.split_expenses enable row level security;

-- Users can view expenses if they are a participant or the payer
drop policy if exists "Users can view split expenses they are part of" on public.split_expenses;
create policy "Users can view split expenses they are part of"
  on public.split_expenses for select
  using (auth.uid() = any(participant_ids) or auth.uid() = payer_id);

-- Users can insert expenses if they are the payer or a participant
drop policy if exists "Users can create split expenses" on public.split_expenses;
create policy "Users can create split expenses"
  on public.split_expenses for insert
  with check (auth.uid() = any(participant_ids) or auth.uid() = payer_id);

-- Users can update expenses if they are a participant or the payer
drop policy if exists "Users can update split expenses they are part of" on public.split_expenses;
create policy "Users can update split expenses they are part of"
  on public.split_expenses for update
  using (auth.uid() = any(participant_ids) or auth.uid() = payer_id);

-- Users can delete expenses if they are the payer
drop policy if exists "Users can delete split expenses they created" on public.split_expenses;
create policy "Users can delete split expenses they created"
  on public.split_expenses for delete
  using (auth.uid() = payer_id);

-- RPC: check_email_exists
create or replace function check_email_exists(p_email text)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
begin
  return exists (select 1 from auth.users where email = p_email);
end;
$$;

-- RPC: pre_login_check (Moved to profiles)
create or replace function pre_login_check(p_email text)
returns json
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uid uuid;
  v_locked timestamp with time zone;
begin
  select id into v_uid from auth.users where email = p_email;
  if not found then
    return json_build_object('allowed', true);
  end if;

  select locked_until into v_locked from public.profiles where id = v_uid;
  if v_locked is not null and v_locked > now() then
    return json_build_object('allowed', false, 'locked_until', v_locked);
  end if;

  return json_build_object('allowed', true);
end;
$$;

-- RPC: record_failed_login (Moved to profiles)
create or replace function record_failed_login(p_email text)
returns json
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uid uuid;
  v_failed int;
begin
  select id into v_uid from auth.users where email = p_email;
  if not found then
    return json_build_object('success', false);
  end if;

  update public.profiles 
  set failed_attempts = failed_attempts + 1,
      locked_until = case when failed_attempts + 1 >= 3 then now() + interval '24 hours' else locked_until end
  where id = v_uid
  returning failed_attempts into v_failed;

  return json_build_object('success', true, 'failed_attempts', v_failed);
end;
$$;

-- RPC: reset_failed_login (Moved to profiles)
create or replace function reset_failed_login(p_email text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where email = p_email;
  if found then
    update public.profiles set failed_attempts = 0, locked_until = null where id = v_uid;
  end if;
end;
$$;

-- Trigger to handle new user signups atomically
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, name, salary, avatar_id)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'salary')::numeric, 0),
    1
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- MPIN Reset OTPs
create table if not exists public.mpin_reset_otps (
  email text primary key,
  otp_code text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for mpin_reset_otps
alter table public.mpin_reset_otps enable row level security;

-- Policy: Reject all (table is only accessed via security definer RPCs)
drop policy if exists "Reject all API access" on public.mpin_reset_otps;
create policy "Reject all API access"
  on public.mpin_reset_otps for all
  using ( false );

-- RPC: generate_mpin_reset_otp
create or replace function generate_mpin_reset_otp(p_email text)
returns json
language plpgsql
security definer set search_path = ''
as $$
declare
  v_code text;
  v_expires timestamp with time zone;
begin
  -- Generate a 4-digit code
  v_code := lpad(floor(random() * 10000)::text, 4, '0');
  v_expires := now() + interval '10 minutes';
  
  insert into public.mpin_reset_otps (email, otp_code, expires_at)
  values (p_email, v_code, v_expires)
  on conflict (email) do update 
  set otp_code = excluded.otp_code, expires_at = excluded.expires_at, created_at = now();
  
  return json_build_object('success', true, 'code', v_code);
end;
$$;

-- RPC: verify_mpin_reset_otp
create or replace function verify_mpin_reset_otp(p_email text, p_code text)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  v_valid boolean;
begin
  select true into v_valid
  from public.mpin_reset_otps
  where email = p_email 
    and otp_code = p_code 
    and expires_at > now();

  return coalesce(v_valid, false);
end;
$$;

-- RPC: reset_custom_mpin
create or replace function reset_custom_mpin(p_email text, p_code text, p_new_mpin text)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  v_valid boolean;
  v_uid uuid;
begin
  select true into v_valid
  from public.mpin_reset_otps
  where email = p_email 
    and otp_code = p_code 
    and expires_at > now();

  if coalesce(v_valid, false) then
    select id into v_uid from auth.users where email = p_email;
    if v_uid is not null then
      -- Hash the new MPIN and update the password
      update auth.users 
      set encrypted_password = extensions.crypt(p_new_mpin, extensions.gen_salt('bf'))
      where id = v_uid;
      
      -- Delete to prevent reuse
      delete from public.mpin_reset_otps where email = p_email;
      return true;
    end if;
  end if;

  return false;
end;
$$;



-- Subscriptions Table
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  amount numeric not null,
  category text not null,
  billing_day integer not null check (billing_day >= 1 and billing_day <= 31),
  last_paid_month text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Policy: Users can insert their own subscriptions.
drop policy if exists "Users can insert own subscriptions." on public.subscriptions;
create policy "Users can insert own subscriptions."
  on public.subscriptions for insert
  with check ( auth.uid() = user_id );

-- Policy: Users can update their own subscriptions.
drop policy if exists "Users can update own subscriptions." on public.subscriptions;
create policy "Users can update own subscriptions."
  on public.subscriptions for update
  using ( auth.uid() = user_id );

-- Policy: Users can delete their own subscriptions.
drop policy if exists "Users can delete own subscriptions." on public.subscriptions;
create policy "Users can delete own subscriptions."
  on public.subscriptions for delete
  using ( auth.uid() = user_id );

-- Policy: Users can select their own subscriptions.
drop policy if exists "Users can view own subscriptions." on public.subscriptions;
create policy "Users can view own subscriptions."
  on public.subscriptions for select
  using ( auth.uid() = user_id );

-- Reload schema cache to ensure API access to new RPCs
NOTIFY pgrst, 'reload schema';

-- Revoke execute from public/anon/authenticated on internal triggers
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM anon, authenticated;
