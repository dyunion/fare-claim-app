-- SmartFare 初期データベース設定
-- Supabase SQL Editorで、admin_user_rpc.sql より先に実行してください。

begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.claims (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  title text not null,
  category text not null,
  amount integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  applicant_name text not null,
  legs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_claims_updated_at on public.claims;
create trigger set_claims_updated_at
before update on public.claims
for each row execute function public.set_updated_at();

create or replace function public.smartfare_current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'admin'
      );
$$;

create or replace function public.handle_new_smartfare_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_role text;
  profile_username text;
begin
  profile_username := split_part(new.email, '@', 1);
  profile_name := coalesce(new.raw_user_meta_data ->> 'name', profile_username);
  profile_role := coalesce(new.raw_user_meta_data ->> 'role', 'user');

  if profile_role not in ('admin', 'user') then
    profile_role := 'user';
  end if;

  insert into public.profiles (id, username, name, role)
  values (new.id, profile_username, profile_name, profile_role)
  on conflict (id) do update
  set
    username = excluded.username,
    name = excluded.name,
    role = excluded.role,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_smartfare on auth.users;
create trigger on_auth_user_created_smartfare
after insert on auth.users
for each row execute function public.handle_new_smartfare_user();

alter table public.profiles enable row level security;
alter table public.claims enable row level security;
alter table public.system_settings enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.smartfare_current_user_is_admin());

drop policy if exists "claims_select_self_or_admin" on public.claims;
create policy "claims_select_self_or_admin"
on public.claims
for select
to authenticated
using (user_id = auth.uid() or public.smartfare_current_user_is_admin());

drop policy if exists "claims_insert_self_or_admin" on public.claims;
create policy "claims_insert_self_or_admin"
on public.claims
for insert
to authenticated
with check (user_id = auth.uid() or public.smartfare_current_user_is_admin());

drop policy if exists "claims_update_self_or_admin" on public.claims;
create policy "claims_update_self_or_admin"
on public.claims
for update
to authenticated
using (user_id = auth.uid() or public.smartfare_current_user_is_admin())
with check (user_id = auth.uid() or public.smartfare_current_user_is_admin());

drop policy if exists "claims_delete_self_or_admin" on public.claims;
create policy "claims_delete_self_or_admin"
on public.claims
for delete
to authenticated
using (user_id = auth.uid() or public.smartfare_current_user_is_admin());

drop policy if exists "system_settings_select_authenticated" on public.system_settings;
create policy "system_settings_select_authenticated"
on public.system_settings
for select
to authenticated
using (true);

drop policy if exists "system_settings_write_admin" on public.system_settings;
create policy "system_settings_write_admin"
on public.system_settings
for all
to authenticated
using (public.smartfare_current_user_is_admin())
with check (public.smartfare_current_user_is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.claims to authenticated;
grant select, insert, update on public.system_settings to authenticated;

insert into public.system_settings (key, value)
values ('fuel_efficiency', '{"standard":9.6,"compact":12.4,"kei":15.1,"bike":30.0}'::jsonb)
on conflict (key) do nothing;

notify pgrst, 'reload schema';

commit;
