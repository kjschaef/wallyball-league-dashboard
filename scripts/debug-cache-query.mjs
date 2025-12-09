// Debug cache query
import { neon } from '@neondatabase/serverless';

async function debugQuery() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    const cacheKey = 'Mon Nov 24 2025';

    try {
        console.log('Testing cache query with cacheKey:', cacheKey);

        const result = await sql`
      SELECT summary, last_match_id, date
      FROM daily_summaries 
      WHERE date = ${cacheKey}
      ORDER BY created_at DESC 
      LIMIT 1
    `;

        console.log('Query result:', result);
        console.log('Result length:', result.length);

        // Also try a broader query
        const allRows = await sql`SELECT id, date, last_match_id FROM daily_summaries LIMIT 5`;
        console.log('\nFirst 5 rows:');
        allRows.forEach(row => {
            console.log(`  id=${row.id}, date="${row.date}", last_match_id=${row.last_match_id}`);
            console.log(`  date === cacheKey: ${row.date === cacheKey}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

debugQuery();
