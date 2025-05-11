import { sql } from "drizzle-orm";
import { db } from "../index";

export async function reset() {
  console.log("⏳ Resetting database...");
  const start = Date.now();

  // Delete all tables
  const dropTablesQuery = sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `;

  // Delete enums
  const dropEnumsQuery = sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (select t.typname as enum_name
      from pg_type t 
        join pg_enum e on t.oid = e.enumtypid  
        join pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      where n.nspname = current_schema()) LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.enum_name);
      END LOOP;
    END $$;
  `;

  try {
    await db.execute(dropTablesQuery);
    await db.execute(dropEnumsQuery);
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }

  const end = Date.now();
  console.log(`✅ Reset complete & took ${(end - start).toString()}ms`);
}

void reset();
