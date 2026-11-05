create type public.user_role as enum ('manager', 'executor');

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null check (length(btrim(display_name)) > 0),
    role public.user_role not null,
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

