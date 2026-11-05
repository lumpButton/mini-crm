create table public.objects (
    id uuid primary key default gen_random_uuid(),
    name text not null check (length(btrim(name)) > 0),
    address text not null check (length(btrim(address)) > 0),
    created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
    created_at timestamptz not null default now()
);

alter table public.objects enable row level security;

revoke all on table public.objects from anon, authenticated;
grant select, delete on table public.objects to authenticated;
grant insert (name, address), update (name, address) on table public.objects to authenticated;

create policy objects_select on public.objects
    for select to authenticated
    using (
        (select public.is_manager())
        or exists (
            select 1
            from public.tasks t
            where t.object_id = objects.id
              and t.assignee_id = (select auth.uid())
        )
    );

create policy objects_insert on public.objects
    for insert to authenticated
    with check ((select public.is_manager()));

create policy objects_update on public.objects
    for update to authenticated
    using ((select public.is_manager()))
    with check ((select public.is_manager()));

create policy objects_delete on public.objects
    for delete to authenticated
    using ((select public.is_manager()));

