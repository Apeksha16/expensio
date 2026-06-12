-- Create a public profiles table to store user metadata and enforce unique usernames
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  name text,
  salary numeric default 0,
  avatar_id integer default 1,
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

-- Drop existing table if it exists to fix schema cache and conflicting types
drop table if exists public.expenses cascade;

-- Create expenses table
create table public.expenses (
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
create policy "Users can insert own expenses."
  on public.expenses for insert
  with check ( auth.uid() = user_id );

-- Policy: Users can update their own expenses.
create policy "Users can update own expenses."
  on public.expenses for update
  using ( auth.uid() = user_id );

-- Policy: Users can delete their own expenses.
create policy "Users can delete own expenses."
  on public.expenses for delete
  using ( auth.uid() = user_id );

-- Policy: Users can select their own expenses.
create policy "Users can view own expenses."
  on public.expenses for select
  using ( auth.uid() = user_id );

-- Drop existing budgets table if it exists
drop table if exists public.budgets cascade;

-- Create budgets table
create table public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric not null,
  icon_path text not null,
  month text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.budgets enable row level security;

-- Policy: Users can insert their own budgets.
create policy "Users can insert own budgets."
  on public.budgets for insert
  with check ( auth.uid() = user_id );

-- Policy: Users can update their own budgets.
create policy "Users can update own budgets."
  on public.budgets for update
  using ( auth.uid() = user_id );

-- Policy: Users can delete their own budgets.
create policy "Users can delete own budgets."
  on public.budgets for delete
  using ( auth.uid() = user_id );

-- Policy: Users can select their own budgets.
create policy "Users can view own budgets."
  on public.budgets for select
  using ( auth.uid() = user_id );

-- Friends Table
create table public.friends (
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
create policy "Users can view their own friendships"
  on public.friends for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Policy: Users can insert friendships as requester
create policy "Users can insert friendships as requester"
  on public.friends for insert
  with check (auth.uid() = requester_id);

-- Policy: Users can update their own friendships
create policy "Users can update their own friendships"
  on public.friends for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Policy: Users can delete their own friendships
create policy "Users can delete their own friendships"
  on public.friends for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

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
$$ language plpgsql security definer;


-- Split Groups Table
create table public.split_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  members uuid[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for split_groups
alter table public.split_groups enable row level security;

-- Users can view groups they are a member of
create policy "Users can view groups they are a member of"
  on public.split_groups for select
  using (auth.uid() = any(members));

-- Users can insert groups if they are the creator and in the members list
create policy "Users can create groups"
  on public.split_groups for insert
  with check (auth.uid() = creator_id and auth.uid() = any(members));

-- Users can update groups they are a member of
create policy "Users can update groups they are a member of"
  on public.split_groups for update
  using (auth.uid() = any(members));

-- Users can delete groups if they are the creator
create policy "Users can delete their own groups"
  on public.split_groups for delete
  using (auth.uid() = creator_id);


-- Split Expenses Table
create table public.split_expenses (
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
create policy "Users can view split expenses they are part of"
  on public.split_expenses for select
  using (auth.uid() = any(participant_ids) or auth.uid() = payer_id);

-- Users can insert expenses if they are the payer or a participant
create policy "Users can create split expenses"
  on public.split_expenses for insert
  with check (auth.uid() = any(participant_ids) or auth.uid() = payer_id);

-- Users can update expenses if they are a participant or the payer
create policy "Users can update split expenses they are part of"
  on public.split_expenses for update
  using (auth.uid() = any(participant_ids) or auth.uid() = payer_id);

-- Users can delete expenses if they are the payer
create policy "Users can delete split expenses they created"
  on public.split_expenses for delete
  using (auth.uid() = payer_id);
