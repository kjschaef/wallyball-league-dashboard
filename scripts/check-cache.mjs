// Check daily_summaries table contents
import { neon } from '@neondatabase/serverless';

async function checkCache() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        const summaries = await sql`SELECT * FROM daily_summaries ORDER BY created_at DESC LIMIT 5`;
        console.log('Recent cached summaries:');
        console.log(JSON.stringify(summaries, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

checkCache();
