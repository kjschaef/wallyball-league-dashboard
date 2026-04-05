import { NextResponse } from 'next/server';
import { generateDailySummary, PlayerSummaryStats, RecentMatch } from '../../lib/openai';
import { neon } from '@neondatabase/serverless';
import { calculatePlayerStats } from '../../lib/stats';
import { getCurrentSeasonByDate } from '../../../lib/seasons';

// Disable Next.js caching for this route to ensure fresh database queries
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('Database URL not configured');
        }

        const sql = neon(process.env.DATABASE_URL);

        // Fetch all matches and players
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Get current season info to filter matches
        const currentSeason = getCurrentSeasonByDate(now);

        const [allTimeMatches, allPlayers] = await Promise.all([
            sql`SELECT * FROM matches ORDER BY date DESC, id DESC`,
            sql`SELECT * FROM players ORDER BY created_at DESC`
        ]);

        // Filter to current season in JS — avoids a second DB round trip
        const seasonStart = new Date(currentSeason.start_date).getTime();
        const tomorrowTime = tomorrow.getTime();
        const allMatches = allTimeMatches.filter((m: { date: string | number | Date }) => {
            const t = new Date(m.date).getTime();
            return t >= seasonStart && t <= tomorrowTime;
        });

        // Get the most recent match date for cache key
        let cacheKey = 'no-matches';
        let lastMatchId = null;

        if (allMatches.length > 0) {
            // Use YYYY-MM-DD format for consistency
            const mostRecentDate = new Date(allMatches[0].date).toISOString().split('T')[0];
            cacheKey = mostRecentDate;
            lastMatchId = allMatches[0].id;
        }

        const cachedSummaries = await sql`
            SELECT * 
            FROM daily_summaries 
            WHERE date = ${cacheKey} 
            ORDER BY created_at DESC 
            LIMIT 1
        `;

        if (cachedSummaries.length > 0) {
            // Loose comparison for ID in case of type mismatch (string vs number)
            if (cachedSummaries[0].last_match_id == lastMatchId) {
                console.log('[daily-summary] ✓ Cache HIT for', cacheKey);
                return NextResponse.json({ summary: cachedSummaries[0].summary });
            } else {
                console.log('[daily-summary] ⚠ Cache invalidated (Match ID changed)', {
                    date: cacheKey,
                    expected: lastMatchId,
                    found: cachedSummaries[0].last_match_id
                });
            }
        }

        console.log('[daily-summary] Generating new summary for', cacheKey);

        // Calculate season stats; attempt lifetime stats with fallback
        let lifetimePlayerStats;
        try {
            lifetimePlayerStats = await calculatePlayerStats(allPlayers, allTimeMatches, sql, 'lifetime', null);
        } catch (err) {
            console.error('[daily-summary] ✗ Failed to calculate lifetime stats, falling back to season stats:', err);
            lifetimePlayerStats = null;
        }
        const playerStats = await calculatePlayerStats(allPlayers, allMatches, sql, 'current', null);

        // Get matches from the last day with games
        let recentMatches: RecentMatch[] = [];
        if (allMatches.length > 0) {
            const matches = allMatches.map((m: { date: string | number | Date }) => ({
                ...m,
                date: new Date(m.date).toISOString()
            }));
            const mostRecentDate = new Date(matches[0].date).toISOString().split('T')[0];
            recentMatches = matches.filter((m: any) => new Date(m.date).toISOString().split('T')[0] === mostRecentDate);
        }

        // Build lifetime lookup and merge with season stats
        const lifetimeLookup = new Map(
            (lifetimePlayerStats ?? playerStats).map(p => [p.name, p.record.totalGames])
        );
        const mergedStats: PlayerSummaryStats[] = playerStats.map(p => ({
            name: p.name,
            seasonGames: p.record.totalGames,
            lifetimeGames: lifetimeLookup.get(p.name) ?? p.record.totalGames,
            winPercentage: p.winPercentage,
        }));

        const summary = await generateDailySummary(recentMatches, mergedStats);

        // Cache the generated summary
        try {
            // Check one last time if it was cached while we were generating
            const existingCache = await sql`
                SELECT id FROM daily_summaries 
                WHERE date = ${cacheKey} AND last_match_id = ${lastMatchId}
                LIMIT 1
            `;

            if (existingCache.length === 0) {
                console.log('[daily-summary] Caching new summary for', cacheKey);
                await sql`
                    INSERT INTO daily_summaries (date, summary, last_match_id)
                    VALUES (${cacheKey}, ${summary}, ${lastMatchId})
                `;
                console.log('[daily-summary] ✓ Successfully cached summary');
            } else {
                console.log('[daily-summary] ⚠ Summary already cached by another request, skipping insert');
            }
        } catch (cacheError) {
            console.error('[daily-summary] ✗ Failed to cache summary:', cacheError);
        }

        return NextResponse.json({ summary });
    } catch (error) {
        console.error('Error in daily-summary route:', error);
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
}
