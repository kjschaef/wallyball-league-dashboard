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
     - `psql "$DATABASE_URL" -f migrations/004_add_inactivity_exemptions.sql`

- Example (Neon-local / Postgres):
  - `PGPASSWORD=yourpw psql -h db.host -U youruser -d yourdb -f migrations/004_add_inactivity_exemptions.sql`

Notes
- These migrations must be applied to the database used by your Next.js dev server or CI environment.
- If you see `relation "inactivity_exemptions" does not exist` errors, this migration has not been applied to the connected database.

Recommended: add migrations to your deployment pipeline so production and preview environments apply them automatically.
