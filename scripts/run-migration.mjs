// Run manual migration to add daily_summaries table
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);
    const migrationSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/add_daily_summaries.sql'),
        'utf-8'
    );

    try {
        console.log('Running migration...');

        // Split SQL by semicolons and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            // Use template literal syntax as required by neon
            await sql`${sql.unsafe(statement)}`;
        }

        console.log('✓ Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
