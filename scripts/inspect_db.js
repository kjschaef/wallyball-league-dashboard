const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        const summaries = await sql`SELECT id, date, last_match_id, created_at FROM daily_summaries ORDER BY created_at DESC LIMIT 5`;
        console.log('Recent Daily Summaries:');
        console.table(summaries);

        const matches = await sql`SELECT date FROM matches ORDER BY date DESC LIMIT 1`;
        if (matches.length > 0) {
            const matchDate = new Date(matches[0].date);
            console.log('Latest Match Date (raw):', matches[0].date);
            console.log('Latest Match Date (toDateString):', matchDate.toDateString());
            console.log('Latest Match Date (ISO):', matchDate.toISOString());

            // Check if we can find it by string
            const cacheKey = matchDate.toISOString().split('T')[0];
            const found = await sql`SELECT * FROM daily_summaries WHERE date = ${cacheKey}`;
            console.log(`Searching for date = '${cacheKey}': Found ${found.length} entries`);
        }
    } catch (error) {
        console.error('Error querying database:', error);
    }
}

main();
