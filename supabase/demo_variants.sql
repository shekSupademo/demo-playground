-- Run once in the Supabase SQL editor.
create table public.demo_variants (
  id int primary key check (id = 1),
  variants jsonb check (
    variants - array['cards', 'payments', 'bills', 'insights'] = '{}'::jsonb
    and variants ?& array['cards', 'payments', 'bills', 'insights']
    and variants ->> 'cards' in ('baseline', 'variant')
    and variants ->> 'payments' in ('baseline', 'variant')
    and variants ->> 'bills' in ('baseline', 'variant')
    and variants ->> 'insights' in ('baseline', 'variant')
  )
);

-- A null selection means the app uses src/demoVariantDefaults.json.
insert into public.demo_variants (id, variants) values (1, null);

alter table public.demo_variants enable row level security;

create policy "Anyone can read the shared variants"
  on public.demo_variants for select to anon using (true);

create policy "Anyone can change the shared variants"
  on public.demo_variants for update to anon using (id = 1) with check (id = 1);

revoke all on public.demo_variants from anon, authenticated;
grant select on public.demo_variants to anon;
grant update (variants) on public.demo_variants to anon;
