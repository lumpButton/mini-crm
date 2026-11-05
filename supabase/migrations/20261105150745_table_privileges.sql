REVOKE ALL ON SEQUENCE "public"."task_status_history_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."task_status_history_id_seq" FROM "authenticated";

REVOKE ALL ON TABLE "public"."objects" FROM "anon";

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

REVOKE ALL ON TABLE "public"."task_status_history" FROM "anon";

REVOKE ALL ON TABLE "public"."tasks" FROM "anon";

REVOKE ALL ON TABLE "public"."objects" FROM "authenticated";

REVOKE ALL ("address") ON TABLE "public"."objects" FROM "authenticated";

GRANT INSERT ("address"), UPDATE ("address") ON TABLE "public"."objects" TO "authenticated";

REVOKE ALL ("name") ON TABLE "public"."objects" FROM "authenticated";

GRANT INSERT ("name"), UPDATE ("name") ON TABLE "public"."objects" TO "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."objects" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."task_status_history" FROM "authenticated";

GRANT SELECT ON TABLE "public"."task_status_history" TO "authenticated";

REVOKE ALL ON TABLE "public"."tasks" FROM "authenticated";

REVOKE ALL ("assignee_id") ON TABLE "public"."tasks" FROM "authenticated";

GRANT INSERT ("assignee_id"), UPDATE ("assignee_id") ON TABLE "public"."tasks" TO "authenticated";

REVOKE ALL ("description") ON TABLE "public"."tasks" FROM "authenticated";

GRANT INSERT ("description"), UPDATE ("description") ON TABLE "public"."tasks" TO "authenticated";

REVOKE ALL ("object_id") ON TABLE "public"."tasks" FROM "authenticated";

GRANT INSERT ("object_id"), UPDATE ("object_id") ON TABLE "public"."tasks" TO "authenticated";

REVOKE ALL ("title") ON TABLE "public"."tasks" FROM "authenticated";

GRANT INSERT ("title"), UPDATE ("title") ON TABLE "public"."tasks" TO "authenticated";

GRANT DELETE, SELECT ON TABLE "public"."tasks" TO "authenticated";

ALTER TABLE "public"."objects"
  ALTER COLUMN "created_by" SET DEFAULT auth.uid();

ALTER TABLE "public"."tasks"
  ALTER COLUMN "author_id" SET DEFAULT auth.uid();
