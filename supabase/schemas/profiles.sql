create type public.user_role as enum ('manager', 'executor');

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null check (length(btrim(display_name)) > 0),
    role public.user_role not null,
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

create function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.profiles
        where id = (select auth.uid())
          and role = 'manager'
    );
$$;

revoke execute on function public.is_manager() from public, anon;
grant execute on function public.is_manager() to authenticated;

create policy profiles_select on public.profiles
    for select to authenticated
    using (true);

