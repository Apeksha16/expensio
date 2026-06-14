-- RPC: get_email_by_username
-- Allows the frontend to resolve an email address from an auto-generated username
create or replace function get_email_by_username(p_username text)
returns text
language plpgsql
security definer
as $$
declare
  v_email text;
  v_id uuid;
begin
  select id into v_id from public.profiles where username = p_username;
  if found then
    select email into v_email from auth.users where id = v_id;
    return v_email;
  end if;
  return null;
end;
$$;
