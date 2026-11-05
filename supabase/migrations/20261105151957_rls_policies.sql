SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_manager()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    select exists (
        select 1
        from public.profiles
        where id = (select auth.uid())
          and role = 'manager'
    );
$function$;

REVOKE ALL ON FUNCTION "public"."is_manager"() FROM PUBLIC, "anon";

CREATE POLICY "objects_delete" ON "public"."objects"
  FOR DELETE
  TO "authenticated"
  USING (( SELECT public.is_manager() AS is_manager));

CREATE POLICY "objects_insert" ON "public"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (( SELECT public.is_manager() AS is_manager));

CREATE POLICY "objects_select" ON "public"."objects"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT public.is_manager() AS is_manager) OR (EXISTS ( SELECT 1
   FROM public.tasks t
  WHERE ((t.object_id = objects.id) AND (t.assignee_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "objects_update" ON "public"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (( SELECT public.is_manager() AS is_manager))
  WITH CHECK (( SELECT public.is_manager() AS is_manager));

CREATE POLICY "profiles_select" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "task_status_history_select" ON "public"."task_status_history"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.tasks t
  WHERE (t.id = task_status_history.task_id))));

CREATE POLICY "tasks_delete" ON "public"."tasks"
  FOR DELETE
  TO "authenticated"
  USING (( SELECT public.is_manager() AS is_manager));

CREATE POLICY "tasks_insert" ON "public"."tasks"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (( SELECT public.is_manager() AS is_manager));

CREATE POLICY "tasks_select" ON "public"."tasks"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT public.is_manager() AS is_manager) OR (assignee_id = ( SELECT auth.uid() AS uid))));

CREATE POLICY "tasks_update" ON "public"."tasks"
  FOR UPDATE
  TO "authenticated"
  USING (( SELECT public.is_manager() AS is_manager))
  WITH CHECK (( SELECT public.is_manager() AS is_manager));

GRANT EXECUTE ON FUNCTION "public"."is_manager"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."is_manager"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_manager"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_manager"() TO "service_role";
