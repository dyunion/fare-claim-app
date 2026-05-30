-- SmartFare 下書き保存対応
-- Supabase SQL Editorで1回実行してください。

begin;

alter table public.claims
drop constraint if exists claims_status_check;

alter table public.claims
add constraint claims_status_check
check (status in ('draft', 'pending', 'approved'));

notify pgrst, 'reload schema';

commit;
