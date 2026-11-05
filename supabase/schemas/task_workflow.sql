create function public.change_task_status(
    p_task_id uuid,
    p_new_status public.task_status,
    p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_uid uuid := auth.uid();
    v_is_manager boolean;
    v_status public.task_status;
    v_assignee uuid;
    v_comment text := nullif(btrim(p_comment), '');
begin
    if v_uid is null then
        raise exception 'not authenticated' using errcode = '42501';
    end if;

    v_is_manager := public.is_manager();

    select t.status, t.assignee_id
      into v_status, v_assignee
      from public.tasks t
     where t.id = p_task_id
       for update;

    if not found or not (v_is_manager or v_assignee = v_uid) then
        raise exception 'task not found' using errcode = 'P0002';
    end if;

    if p_new_status is null or not (
        (v_status = 'new' and p_new_status = 'in_progress' and v_assignee = v_uid)
        or (v_status = 'in_progress' and p_new_status = 'in_review' and v_assignee = v_uid)
        or (v_status = 'rework' and p_new_status = 'in_progress' and v_assignee = v_uid)
        or (v_status = 'in_review' and p_new_status in ('accepted', 'rework') and v_is_manager)
    ) then
        raise exception 'transition from % to % is not allowed', v_status, p_new_status
            using errcode = '22023';
    end if;

    if p_new_status = 'rework' and v_comment is null then
        raise exception 'comment is required for rework' using errcode = '22023';
    end if;

    update public.tasks
       set status = p_new_status
     where id = p_task_id;

    insert into public.task_status_history (task_id, old_status, new_status, changed_by, comment)
    values (p_task_id, v_status, p_new_status, v_uid, v_comment);
end;
$$;

revoke execute on function public.change_task_status(uuid, public.task_status, text) from public, anon;
grant execute on function public.change_task_status(uuid, public.task_status, text) to authenticated;

create function public.log_task_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.task_status_history (task_id, old_status, new_status, changed_by)
    values (new.id, null, new.status, new.author_id);
    return null;
end;
$$;

revoke execute on function public.log_task_created() from public, anon, authenticated;

create trigger tasks_log_created
    after insert on public.tasks
    for each row
    execute function public.log_task_created();

create function public.check_task_assignee()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if not exists (
        select 1
        from public.profiles p
        where p.id = new.assignee_id
          and p.role = 'executor'
    ) then
        raise exception 'assignee must be an executor' using errcode = '23514';
    end if;
    return new;
end;
$$;

revoke execute on function public.check_task_assignee() from public, anon, authenticated;

create trigger tasks_check_assignee
    before insert or update of assignee_id on public.tasks
    for each row
    execute function public.check_task_assignee();
