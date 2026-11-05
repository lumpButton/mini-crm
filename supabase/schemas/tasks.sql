create type public.task_status as enum (
    'new',
    'in_progress',
    'in_review',
    'accepted',
    'rework'
);

create table public.tasks (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) > 0),
    description text not null default '',
    object_id uuid not null references public.objects(id) on delete cascade,
    assignee_id uuid not null references public.profiles(id) on delete restrict,
    author_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
    status public.task_status not null default 'new',
    created_at timestamptz not null default now()
);

create index tasks_object_id_idx on public.tasks(object_id);
create index tasks_assignee_id_idx on public.tasks(assignee_id);

alter table public.tasks enable row level security;

revoke all on table public.tasks from anon, authenticated;
grant select, delete on table public.tasks to authenticated;
grant insert (title, description, object_id, assignee_id),
      update (title, description, object_id, assignee_id)
    on table public.tasks to authenticated;

