
create table public.task_status_history (
    id bigint generated always as identity primary key,
    task_id uuid not null references public.tasks(id) on delete cascade,
    old_status public.task_status,
    new_status public.task_status not null,
    changed_by uuid not null references public.profiles(id) on delete restrict,
    comment text,
    changed_at timestamptz not null default now(),
    constraint valid_status_change check (
        (old_status is null and new_status = 'new')
        or (old_status = 'new' and new_status = 'in_progress')
        or (old_status = 'in_progress' and new_status = 'in_review')
        or (old_status = 'in_review' and new_status in ('accepted', 'rework'))
        or (old_status = 'rework' and new_status = 'in_progress')
    ),
    constraint rework_requires_comment check (
        new_status <> 'rework'
        or (comment is not null and length(btrim(comment)) > 0)
    )
);

create index task_status_history_task_id_changed_at_idx
    on public.task_status_history(task_id, changed_at);

alter table public.task_status_history enable row level security;

revoke all on table public.task_status_history from anon, authenticated;
grant select on table public.task_status_history to authenticated;
revoke all on sequence public.task_status_history_id_seq from anon, authenticated;

create policy task_status_history_select on public.task_status_history
    for select to authenticated
    using (
        exists (
            select 1
            from public.tasks t
            where t.id = task_status_history.task_id
        )
    );
