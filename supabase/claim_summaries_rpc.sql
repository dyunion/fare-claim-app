-- SmartFare 高速一覧表示用RPC
-- 申請一覧では領収書画像本体を読まず、経路情報と領収書枚数だけを返します。

begin;

create or replace function public.list_claim_summaries()
returns table (
  id text,
  user_id uuid,
  date date,
  title text,
  category text,
  amount integer,
  status text,
  applicant_name text,
  legs jsonb,
  receipt_count integer,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  select
    c.id,
    c.user_id,
    c.date,
    c.title,
    c.category,
    c.amount,
    c.status,
    c.applicant_name,
    coalesce((
      select jsonb_agg(leg - 'receiptImage')
      from jsonb_array_elements(c.legs) as leg
    ), '[]'::jsonb) as legs,
    coalesce((
      select count(*)::integer
      from jsonb_array_elements(c.legs) as leg
      where coalesce(leg ->> 'receiptImage', '') <> ''
    ), 0) as receipt_count,
    c.created_at,
    c.updated_at
  from public.claims c
  order by c.created_at desc;
$$;

revoke all on function public.list_claim_summaries() from public, anon, authenticated;
grant execute on function public.list_claim_summaries() to authenticated;

notify pgrst, 'reload schema';

commit;
