import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }

    const sql = neon(process.env.DATABASE_URL);
    const { searchParams } = new URL(request.url);
    const seasonParam = searchParams.get('season');

    // Handle season filtering for matches
    let allMatches;


    if (seasonParam) {
      const { listSeasons, getSeasonById } = await import('../../../lib/seasons');
      const computedSeasons = listSeasons(32);
      if (seasonParam === 'current') {
        const s = computedSeasons[0];
        allMatches = await sql`SELECT * FROM matches WHERE date >= ${s.start_date} AND date <= ${new Date().toISOString()} ORDER BY date ASC`;
      } else if (seasonParam === 'lifetime') {
        allMatches = await sql`SELECT * FROM matches ORDER BY date ASC`;
      } else if (!isNaN(Number(seasonParam))) {
        const sid = Number(seasonParam);
        const s = getSeasonById(sid);
        if (!s) return NextResponse.json({ error: 'Season not found' }, { status: 404 });
        allMatches = await sql`SELECT * FROM matches WHERE date >= ${s.start_date} AND date <= ${s.end_date} ORDER BY date ASC`;
      } else {
        return NextResponse.json({ error: 'Invalid season parameter. Use "current", "lifetime", or a season ID.' }, { status: 400 });
      }
    } else {
      allMatches = await sql`SELECT * FROM matches ORDER BY date ASC`;
    }

    // Fetch all players
    const allPlayers = await sql`SELECT * FROM players ORDER BY name ASC`;

    // Use UTC components to ensure date keys are stable across test environments
    const toDateKeyLocal = (d: Date) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const playerTrends = allPlayers.map(player => {
      // Find matches where this player participated
      const playerMatches = allMatches.filter(match =>
        match.team_one_player_one_id === player.id ||
        match.team_one_player_two_id === player.id ||
        match.team_one_player_three_id === player.id ||
        match.team_two_player_one_id === player.id ||
        match.team_two_player_two_id === player.id ||
        match.team_two_player_three_id === player.id
      );

      // Calculate cumulative performance by date
      const dailyStats = new Map();
      let cumulativeGamesWon = 0;
      let cumulativeGamesLost = 0;

      // Sort matches chronologically
      const sortedMatches = playerMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedMatches.forEach((match) => {
        const isTeamOne = match.team_one_player_one_id === player.id ||
          match.team_one_player_two_id === player.id ||
          match.team_one_player_three_id === player.id;

        const gamesWon = isTeamOne ? match.team_one_games_won : match.team_two_games_won;
        const gamesLost = isTeamOne ? match.team_two_games_won : match.team_one_games_won;

        cumulativeGamesWon += gamesWon;
        cumulativeGamesLost += gamesLost;

        const totalGames = cumulativeGamesWon + cumulativeGamesLost;
        const rawWinPercentage = totalGames > 0 ? (cumulativeGamesWon / totalGames) * 100 : 0;

        const dateKey = match.date ? toDateKeyLocal(new Date(match.date)) : toDateKeyLocal(new Date());
        dailyStats.set(dateKey, {
          winPercentage: rawWinPercentage,
          rawWinPercentage,
          totalWins: cumulativeGamesWon,
          totalGames
        });
      });

      return {
        id: player.id,
        name: player.name,
        dailyStats: Object.fromEntries(dailyStats)
      };
    });

    return NextResponse.json(playerTrends);
  } catch (error) {
    console.error('Error fetching player trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player trends' },
      { status: 500 }
    );
  }
}
