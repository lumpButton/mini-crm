CREATE TABLE "public"."objects" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "address"    text                     NOT NULL,
  "created_by" uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "objects_address_check" CHECK ((length(btrim(address)) > 0)),
  CONSTRAINT "objects_name_check" CHECK ((length(btrim(name)) > 0)),
  CONSTRAINT "objects_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."objects"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"           uuid NOT NULL,
  "display_name" text NOT NULL,
  CONSTRAINT "profiles_display_name_check" CHECK ((length(btrim(display_name)) > 0)),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."task_status_history" (
  "id"      bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "task_id" uuid   NOT NULL,
  CONSTRAINT "task_status_history_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."task_status_history"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."tasks" (
  "id"          uuid NOT NULL DEFAULT gen_random_uuid(),
  "title"       text NOT NULL,
  "description" text NOT NULL DEFAULT ''::text,
  "object_id"   uuid NOT NULL,
  "assignee_id" uuid NOT NULL,
  "author_id"   uuid NOT NULL,
  CONSTRAINT "tasks_pkey" PRIMARY KEY (id),
  CONSTRAINT "tasks_title_check" CHECK ((length(btrim(title)) > 0))
);

ALTER TABLE "public"."tasks"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."task_status" AS ENUM (
  'new',
  'in_progress',
  'in_review',
  'accepted',
  'rework'
);

ALTER TABLE "public"."task_status_history"
  ADD COLUMN "old_status" public.task_status;

ALTER TABLE "public"."task_status_history"
  ADD COLUMN "new_status" public.task_status NOT NULL;

ALTER TABLE "public"."task_status_history"
  ADD COLUMN "changed_by" uuid NOT NULL;

ALTER TABLE "public"."task_status_history"
  ADD COLUMN "comment" text;

ALTER TABLE "public"."task_status_history"
  ADD COLUMN "changed_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."tasks"
  ADD COLUMN "status" public.task_status NOT NULL DEFAULT 'new'::public.task_status;

ALTER TABLE "public"."tasks"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

CREATE TYPE "public"."user_role" AS ENUM (
  'manager',
  'executor'
);

ALTER TABLE "public"."profiles"
  ADD COLUMN "role" public.user_role NOT NULL;

ALTER TABLE "public"."profiles"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."objects"
  ADD CONSTRAINT "objects_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."task_status_history"
  ADD CONSTRAINT "rework_requires_comment" CHECK (((new_status <> 'rework'::public.task_status) OR ((comment IS NOT NULL) AND (length(btrim(comment)) > 0))));

ALTER TABLE "public"."task_status_history"
  ADD CONSTRAINT "task_status_history_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."task_status_history"
  ADD CONSTRAINT "valid_status_change"
    CHECK
    ((((old_status IS NULL) AND (new_status = 'new'::public.task_status)) OR ((old_status = 'new'::public.task_status) AND (new_status = 'in_progress'::public.task_status)) OR
    ((old_status = 'in_progress'::public.task_status) AND (new_status = 'in_review'::public.task_status)) OR
    ((old_status = 'in_review'::public.task_status) AND (new_status = ANY (ARRAY['accepted'::public.task_status, 'rework'::public.task_status]))) OR
    ((old_status = 'rework'::public.task_status) AND (new_status = 'in_progress'::public.task_status))));

ALTER TABLE "public"."tasks"
  ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY (assignee_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."tasks"
  ADD CONSTRAINT "tasks_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."tasks"
  ADD CONSTRAINT "tasks_object_id_fkey" FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE;

ALTER TABLE "public"."task_status_history"
  ADD CONSTRAINT "task_status_history_task_id_fkey" FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

CREATE INDEX task_status_history_task_id_changed_at_idx ON public.task_status_history USING btree (task_id, changed_at);

CREATE INDEX tasks_assignee_id_idx ON public.tasks USING btree (assignee_id);

CREATE INDEX tasks_object_id_idx ON public.tasks USING btree (object_id);

REVOKE ALL ON SEQUENCE "public"."task_status_history_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."task_status_history_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."task_status_history_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."task_status_history_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."task_status_history_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."task_status_history_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."task_status_history_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."task_status_history_id_seq" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."objects" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."objects" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."objects" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."objects" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."task_status_history" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."task_status_history" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."task_status_history" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."task_status_history" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tasks" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."tasks" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tasks" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tasks" TO "service_role";
