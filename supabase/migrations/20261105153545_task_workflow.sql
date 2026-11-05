SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.change_task_status (
  p_task_id    uuid,
  p_new_status public.task_status,
  p_comment    text               DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
$function$;

REVOKE ALL ON FUNCTION "public"."change_task_status"(uuid, public.task_status, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.check_task_assignee()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
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
$function$;

REVOKE ALL ON FUNCTION "public"."check_task_assignee"() FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.log_task_created()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
    insert into public.task_status_history (task_id, old_status, new_status, changed_by)
    values (new.id, null, new.status, new.author_id);
    return null;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."log_task_created"() FROM PUBLIC, "anon", "authenticated";

CREATE TRIGGER tasks_check_assignee
  BEFORE INSERT OR UPDATE OF assignee_id ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.check_task_assignee();

CREATE TRIGGER tasks_log_created
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_created();

GRANT EXECUTE ON FUNCTION "public"."change_task_status"(uuid, public.task_status, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."change_task_status"(uuid, public.task_status, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."change_task_status"(uuid, public.task_status, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."change_task_status"(uuid, public.task_status, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."check_task_assignee"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."check_task_assignee"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."check_task_assignee"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."log_task_created"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."log_task_created"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."log_task_created"() TO "service_role";
