create table public.objects (
    id uuid primary key default gen_random_uuid(),
    name text not null check (length(btrim(name)) > 0),
    address text not null check (length(btrim(address)) > 0),
    created_by uuid not null references public.profiles(id) on delete restrict,
    created_at timestamptz not null default now()
);

alter table public.objects enable row level security;

