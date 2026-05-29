-- SmartFare 管理者用ユーザー管理RPC
-- Supabase SQL Editorで、プロジェクト所有者として実行してください。
-- service_role keyはブラウザに置かず、管理者ログイン済みユーザーだけがRPCを呼べるようにします。

begin;

create extension if not exists pgcrypto with schema extensions;

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

create or replace function public.delete_user_by_admin(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user_id is null then
    raise exception '削除対象ユーザーが指定されていません。';
  end if;

  if public.smartfare_current_user_is_admin() is not true then
    raise exception 'アクセス権限がありません。管理者のみ実行可能です。';
  end if;

  if target_user_id = auth.uid() then
    raise exception '自分自身のアカウントを削除することはできません。';
  end if;

  delete from auth.users
  where id = target_user_id;

  if not found then
    raise exception '対象ユーザーが見つかりません。';
  end if;
end;
$$;

create or replace function public.update_user_profile_by_admin(
  target_user_id uuid,
  new_name text,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user_id is null then
    raise exception '変更対象ユーザーが指定されていません。';
  end if;

  if public.smartfare_current_user_is_admin() is not true then
    raise exception 'アクセス権限がありません。管理者のみ実行可能です。';
  end if;

  if new_role not in ('admin', 'user') then
    raise exception '権限には admin または user を指定してください。';
  end if;

  if nullif(trim(new_name), '') is null then
    raise exception '氏名を入力してください。';
  end if;

  if target_user_id = auth.uid() and new_role <> 'admin' then
    raise exception '自分自身の管理者権限を削除することはできません。';
  end if;

  update public.profiles
  set
    name = trim(new_name),
    role = new_role
  where id = target_user_id;

  if not found then
    raise exception '対象ユーザーのプロフィールが見つかりません。';
  end if;

  update auth.users
  set
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('name', trim(new_name), 'role', new_role),
    updated_at = now()
  where id = target_user_id;
end;
$$;

create or replace function public.update_user_password_by_admin(
  target_user_id uuid,
  new_password text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user_id is null then
    raise exception '変更対象ユーザーが指定されていません。';
  end if;

  if public.smartfare_current_user_is_admin() is not true then
    raise exception 'アクセス権限がありません。管理者のみ実行可能です。';
  end if;

  if length(coalesce(new_password, '')) < 6 then
    raise exception 'パスワードは6文字以上で設定してください。';
  end if;

  update auth.users
  set
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception '対象ユーザーが見つかりません。';
  end if;
end;
$$;

revoke all on function public.smartfare_current_user_is_admin() from public, anon, authenticated;
revoke all on function public.delete_user_by_admin(uuid) from public, anon, authenticated;
revoke all on function public.update_user_profile_by_admin(uuid, text, text) from public, anon, authenticated;
revoke all on function public.update_user_password_by_admin(uuid, text) from public, anon, authenticated;

grant execute on function public.delete_user_by_admin(uuid) to authenticated;
grant execute on function public.update_user_profile_by_admin(uuid, text, text) to authenticated;
grant execute on function public.update_user_password_by_admin(uuid, text) to authenticated;

notify pgrst, 'reload schema';

commit;
