# Migrations

This folder contains SQL migrations for the Wallyball League Dashboard.

The migration `004_add_inactivity_exemptions.sql` adds the `inactivity_exemptions` table used by the API.

How to apply these migrations

- Using Drizzle (recommended):
  - If this project uses Drizzle ORM migrations, you can run the following commands from the project root.
  - Create a new migration (if you need to add more):
    - `npx drizzle-kit generate:migration --out migrations` or your configured drizzle CLI command
  - Apply pending migrations:
    - `npx drizzle-kit migrate` or `npx drizzle-kit migrate:latest` depending on your setup
  - Example with `DATABASE_URL` env var:
    - `DATABASE_URL="$DATABASE_URL" npx drizzle-kit migrate`
  - If you use a different Drizzle config file, pass it via `--config` as needed.

- Manually via psql / Neon CLI:
  1. Ensure `DATABASE_URL` points to your development database.
  2. From the project root run:
     - `psql "$DATABASE_URL" -f migrations/0000_light_toro.sql`
     - `psql "$DATABASE_URL" -f migrations/004_add_inactivity_exemptions.sql`
     - `psql "$DATABASE_URL" -f migrations/007_add_signups.sql`
     - `psql "$DATABASE_URL" -f migrations/008_add_signup_close_settings.sql`
     - `psql "$DATABASE_URL" -f migrations/009_add_weekly_unavailable.sql`

- Example (Neon-local / Postgres):
  - `PGPASSWORD=yourpw psql -h db.host -U youruser -d yourdb -f migrations/004_add_inactivity_exemptions.sql`

Notes
- These migrations must be applied to the database used by your Next.js dev server or CI environment.
- `migrations/0000_light_toro.sql` is the executable baseline migration for the core tables and `daily_summaries`.
- `migrations/add_daily_summaries.sql` is retained as historical context for older manual setups and is not part of the numbered Drizzle chain.
- If you see `relation "inactivity_exemptions" does not exist` or `relation "weekly_unavailable" does not exist` errors, the connected database is missing one or more applied migrations.

Recommended: add migrations to your deployment pipeline so production and preview environments apply them automatically.
