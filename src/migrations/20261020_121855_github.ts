import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" ADD COLUMN "github_repo_id" numeric;
  ALTER TABLE "projects" ADD COLUMN "github_full_name" varchar;
  ALTER TABLE "projects" ADD COLUMN "github_url" varchar;
  ALTER TABLE "projects" ADD COLUMN "github_description" varchar;
  ALTER TABLE "projects" ADD COLUMN "github_language" varchar;
  ALTER TABLE "projects" ADD COLUMN "github_topics" varchar;
  ALTER TABLE "projects" ADD COLUMN "github_stars" numeric;
  ALTER TABLE "projects" ADD COLUMN "github_is_private" boolean;
  ALTER TABLE "projects" ADD COLUMN "github_is_fork" boolean;
  ALTER TABLE "projects" ADD COLUMN "github_archived" boolean;
  ALTER TABLE "projects" ADD COLUMN "github_pushed_at" timestamp(3) with time zone;
  ALTER TABLE "projects" ADD COLUMN "github_synced_at" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN "version_github_repo_id" numeric;
  ALTER TABLE "_projects_v" ADD COLUMN "version_github_full_name" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_github_url" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_github_description" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_github_language" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_github_topics" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_github_stars" numeric;
  ALTER TABLE "_projects_v" ADD COLUMN "version_github_is_private" boolean;
  ALTER TABLE "_projects_v" ADD COLUMN "version_github_is_fork" boolean;
  ALTER TABLE "_projects_v" ADD COLUMN "version_github_archived" boolean;
  ALTER TABLE "_projects_v" ADD COLUMN "version_github_pushed_at" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN "version_github_synced_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "github_login" varchar;
  ALTER TABLE "users" ADD COLUMN "github_id" numeric;
  ALTER TABLE "users" ADD COLUMN "github_token" varchar;
  ALTER TABLE "users" ADD COLUMN "github_session_version" numeric DEFAULT 0;
  CREATE INDEX "projects_github_github_repo_id_idx" ON "projects" USING btree ("github_repo_id");
  CREATE INDEX "_projects_v_version_github_version_github_repo_id_idx" ON "_projects_v" USING btree ("version_github_repo_id");
  CREATE INDEX "users_github_login_idx" ON "users" USING btree ("github_login");
  CREATE INDEX "users_github_id_idx" ON "users" USING btree ("github_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "projects_github_github_repo_id_idx";
  DROP INDEX "_projects_v_version_github_version_github_repo_id_idx";
  DROP INDEX "users_github_login_idx";
  DROP INDEX "users_github_id_idx";
  ALTER TABLE "projects" DROP COLUMN "github_repo_id";
  ALTER TABLE "projects" DROP COLUMN "github_full_name";
  ALTER TABLE "projects" DROP COLUMN "github_url";
  ALTER TABLE "projects" DROP COLUMN "github_description";
  ALTER TABLE "projects" DROP COLUMN "github_language";
  ALTER TABLE "projects" DROP COLUMN "github_topics";
  ALTER TABLE "projects" DROP COLUMN "github_stars";
  ALTER TABLE "projects" DROP COLUMN "github_is_private";
  ALTER TABLE "projects" DROP COLUMN "github_is_fork";
  ALTER TABLE "projects" DROP COLUMN "github_archived";
  ALTER TABLE "projects" DROP COLUMN "github_pushed_at";
  ALTER TABLE "projects" DROP COLUMN "github_synced_at";
  ALTER TABLE "_projects_v" DROP COLUMN "version_github_repo_id";
  ALTER TABLE "_projects_v" DROP COLUMN "version_github_full_name";
  ALTER TABLE "_projects_v" DROP COLUMN "version_github_url";
  ALTER TABLE "_projects_v" DROP COLUMN "version_github_description";
  ALTER TABLE "_projects_v" DROP COLUMN "version_github_language";
  ALTER TABLE "_projects_v" DROP COLUMN "version_github_topics";
  ALTER TABLE "_projects_v" DROP COLUMN "version_github_stars";
  ALTER TABLE "_projects_v" DROP COLUMN "version_github_is_private";
  ALTER TABLE "_projects_v" DROP COLUMN "version_github_is_fork";
  ALTER TABLE "_projects_v" DROP COLUMN "version_github_archived";
  ALTER TABLE "_projects_v" DROP COLUMN "version_github_pushed_at";
  ALTER TABLE "_projects_v" DROP COLUMN "version_github_synced_at";
  ALTER TABLE "users" DROP COLUMN "github_login";
  ALTER TABLE "users" DROP COLUMN "github_id";
  ALTER TABLE "users" DROP COLUMN "github_token";
  ALTER TABLE "users" DROP COLUMN "github_session_version";`)
}
