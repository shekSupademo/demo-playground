create table public.demo_apps (
  id text primary key check (
    id in ('plano', 'pipeline', 'shopline', 'filebox', 'tripway', 'peoplehub', 'metricly', 'mailbird', 'notely')
  ),
  variant text not null default 'baseline' check (variant in ('baseline', 'variant'))
);

insert into public.demo_apps (id)
values ('plano'), ('pipeline'), ('shopline'), ('filebox'), ('tripway'), ('peoplehub'), ('metricly'), ('mailbird'), ('notely');

alter table public.demo_apps enable row level security;

create policy "Anyone can read the app variants"
  on public.demo_apps for select to anon using (true);

create policy "Anyone can switch an app's variant"
  on public.demo_apps for update to anon using (true) with check (true);

revoke all on public.demo_apps from anon, authenticated;
grant select on public.demo_apps to anon;
grant update (variant) on public.demo_apps to anon;
