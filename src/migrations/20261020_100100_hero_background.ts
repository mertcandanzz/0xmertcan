import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_settings_hero_background" AS ENUM('topography', 'rays', 'shapes');
  ALTER TABLE "settings" ADD COLUMN "hero_background" "enum_settings_hero_background" DEFAULT 'topography' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" DROP COLUMN "hero_background";
  DROP TYPE "public"."enum_settings_hero_background";`)
}
