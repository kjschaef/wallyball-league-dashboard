import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { calculateSeasonalPenaltySeries, isWithinExemption } from '../../../lib/inactivity-penalty';

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    const { searchParams } = new URL(request.url);
    const seasonParam = searchParams.get('season');
    
    // Fetch all players
    const allPlayers = await sql`SELECT * FROM players ORDER BY name ASC`;
    
    // Handle season filtering for matches
    let allMatches;
    let seasonId: number | null = null;
    let seasonData: any = null;
    
    if (seasonParam) {
      if (seasonParam === 'current') {
        // Get current active season
        const currentSeason = await sql`SELECT * FROM seasons WHERE is_active = true LIMIT 1`;
        if (currentSeason.length === 0) {
          return NextResponse.json({ error: 'No active season found' }, { status: 404 });
        }
        seasonId = currentSeason[0].id;
      } else if (seasonParam === 'lifetime') {
        // No season filter for lifetime
        seasonId = null;
      } else if (!isNaN(Number(seasonParam))) {
        // Specific season ID
        seasonId = Number(seasonParam);
        const season = await sql`SELECT * FROM seasons WHERE id = ${seasonId}`;
        if (season.length === 0) {
          return NextResponse.json({ error: 'Season not found' }, { status: 404 });
        }
        seasonData = season[0];
      } else {
        return NextResponse.json(
          { error: 'Invalid season parameter. Use "current", "lifetime", or a season ID.' },
          { status: 400 }
        );
      }
    }
    
    // Fetch matches with optional season filtering
    if (seasonId !== null) {
      allMatches = await sql`SELECT * FROM matches WHERE season_id = ${seasonId} ORDER BY date ASC`;
    } else {
      allMatches = await sql`SELECT * FROM matches ORDER BY date ASC`;
    }
    
    // Fetch all exemptions once and index by player id for quick lookup
    const exemptionsRows = await sql`SELECT player_id, start_date, end_date FROM inactivity_exemptions`;
    const exemptionsByPlayer: Record<number, Array<{startDate: string; endDate?: string | null}>> = {};
    for (const r of exemptionsRows) {
      exemptionsByPlayer[r.player_id] = exemptionsByPlayer[r.player_id] || [];
      exemptionsByPlayer[r.player_id].push({ startDate: r.start_date, endDate: r.end_date });
    }

    const toDateKeyLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const playerTrends = allPlayers.map(player => {
      const playerExemptions = exemptionsByPlayer[player.id] || [];
      // Find matches where this player participated
      const playerMatches = allMatches.filter(match => 
        match.team_one_player_one_id === player.id ||
        match.team_one_player_two_id === player.id ||
        match.team_one_player_three_id === player.id ||
        match.team_two_player_one_id === player.id ||
        match.team_two_player_two_id === player.id ||
        match.team_two_player_three_id === player.id
      );
      
      // Calculate cumulative performance by date with penalties calculated relative to each date
      const dailyStats = new Map();
      let cumulativeGamesWon = 0;
      let cumulativeGamesLost = 0;
      
      // Sort matches chronologically
      const sortedMatches = playerMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      sortedMatches.forEach((match, index) => {
        const isTeamOne = match.team_one_player_one_id === player.id || 
                         match.team_one_player_two_id === player.id || 
                         match.team_one_player_three_id === player.id;

        // Preserve cumulative stats before this match for gap penalty calculation
        const prevWins = cumulativeGamesWon;
        const prevLosses = cumulativeGamesLost;
        const prevTotal = prevWins + prevLosses;
        const prevRawWinPct = prevTotal > 0 ? (prevWins / prevTotal) * 100 : 0;

        // If there's a gap since the last match, add weekly penalty points across the gap
        if (index > 0) {
          const currentMatchDate = new Date(match.date);
          const previousMatchDate = new Date(sortedMatches[index - 1].date);

          const daysSinceLastMatch = Math.floor((currentMatchDate.getTime() - previousMatchDate.getTime()) / (1000 * 60 * 60 * 24));
          const weeksSinceLastMatch = Math.floor(daysSinceLastMatch / 7);

          const gracePeriodWeeks = 2;
          const penaltyPerWeek = 5;
          const maxPenalty = 50;
          const penaltyWeeks = Math.max(0, weeksSinceLastMatch - gracePeriodWeeks);

          // Add a point for each inactive week boundary between previous match and the day before current match
          for (let w = gracePeriodWeeks + 1; w <= weeksSinceLastMatch; w++) {
            const weekPenalty = Math.min(maxPenalty, (w - gracePeriodWeeks) * penaltyPerWeek);
            const weekDate = new Date(previousMatchDate);
            weekDate.setDate(weekDate.getDate() + w * 7);

            // Only include points strictly before the current match date
            if (weekDate >= currentMatchDate) break;
            const weekKey = toDateKeyLocal(weekDate);
            const currentKey = toDateKeyLocal(currentMatchDate);
            // Avoid placing a weekly point on the same local day as the match
            if (weekKey === currentKey) continue;
            // Respect exemptions on the week date
            const effectivePenalty = isWithinExemption(weekDate, playerExemptions) ? 0 : weekPenalty;
            const weekWinPct = Math.max(0, prevRawWinPct - effectivePenalty);
            if (!dailyStats.has(weekKey)) {
              dailyStats.set(weekKey, {
                winPercentage: weekWinPct,
                rawWinPercentage: prevRawWinPct,
                totalWins: prevWins,
                totalGames: prevTotal,
                inactivityPenalty: effectivePenalty
              });
            }
          }
        }

        // Now apply this match (no penalty on match date)
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
          totalGames,
          inactivityPenalty: 0
        });
      });
      
      // For inactive players, add synthetic weekly data points showing penalty progression
      const isHistoricalSeason = seasonParam && seasonParam !== 'current' && seasonParam !== 'lifetime';

      if (playerMatches.length > 0) {
        if (!isHistoricalSeason) {
          // Only apply client-side weekly progression for current/lifetime stats
          const lastMatchDate = new Date(sortedMatches[sortedMatches.length - 1].date);
          const today = new Date();
          const daysSinceLastMatch = Math.floor((today.getTime() - lastMatchDate.getTime()) / (1000 * 60 * 60 * 24));

          // If player hasn't played in over 14 days, add weekly penalty progression
          if (daysSinceLastMatch > 14) {
            const weeksSinceLastMatch = Math.floor(daysSinceLastMatch / 7);
            const gracePeriodWeeks = 2;
            const penaltyPerWeek = 5;
            const maxPenalty = 50;
            
            // Get the last recorded stats
            const lastStats = Array.from(dailyStats.values()).pop();
            if (lastStats) {
                // Add a data point for each week of inactivity
                for (let week = gracePeriodWeeks + 1; week <= weeksSinceLastMatch; week++) {
                  const penaltyWeeks = week - gracePeriodWeeks;
                  const weeklyPenalty = Math.min(maxPenalty, penaltyWeeks * penaltyPerWeek);
                  const penalizedWinPercentage = Math.max(0, lastStats.rawWinPercentage - weeklyPenalty);
                  
                  // Calculate the date for this week of inactivity
                  const weekDate = new Date(lastMatchDate);
                  weekDate.setDate(weekDate.getDate() + (week * 7));
                  
                  // Don't add future dates beyond today
                if (weekDate <= today) {
                  // If the player has an exemption covering this week date, skip penalty
                  if (isWithinExemption(weekDate, playerExemptions)) {
                    dailyStats.set(toDateKeyLocal(weekDate), {
                      winPercentage: lastStats.rawWinPercentage,
                      rawWinPercentage: lastStats.rawWinPercentage,
                      totalWins: lastStats.totalWins,
                      totalGames: lastStats.totalGames,
                      inactivityPenalty: 0
                    });
                    continue;
                  }
                  const weekKey = toDateKeyLocal(weekDate);
                  dailyStats.set(weekKey, {
                    winPercentage: penalizedWinPercentage,
                    rawWinPercentage: lastStats.rawWinPercentage,
                    totalWins: lastStats.totalWins,
                    totalGames: lastStats.totalGames,
                    inactivityPenalty: weeklyPenalty
                  });
                }
              }

              // Add current date with final penalty if it's different from the last weekly point
              const finalPenaltyWeeks = Math.max(0, weeksSinceLastMatch - gracePeriodWeeks);
              let currentPenalty = Math.min(maxPenalty, finalPenaltyWeeks * penaltyPerWeek);
              const todayKey = toDateKeyLocal(today);
              
              // If player has an exemption covering today, zero the current penalty
              if (isWithinExemption(today, playerExemptions)) {
                currentPenalty = 0;
              }
              
              if (!dailyStats.has(todayKey)) {
                const penalizedWinPercentage = Math.max(0, lastStats.rawWinPercentage - currentPenalty);
                dailyStats.set(todayKey, {
                  winPercentage: penalizedWinPercentage,
                  rawWinPercentage: lastStats.rawWinPercentage,
                  totalWins: lastStats.totalWins,
                  totalGames: lastStats.totalGames,
                  inactivityPenalty: currentPenalty
                });
              }
            }
          }
        } else if (seasonData) {
          // Historical season: use season-aware penalty series so penalties are distributed across the season
          const series = calculateSeasonalPenaltySeries(
            playerMatches.map(m => ({ date: m.date })),
            seasonData,
            player.created_at || null,
            playerExemptions
          );
          // If we have any series points, merge them into dailyStats based on the last known raw stats
          const lastStats = Array.from(dailyStats.values()).pop();
          if (lastStats) {
            for (const [dateKey, penaltyValue] of Object.entries(series)) {
              const penalizedWinPercentage = Math.max(0, lastStats.rawWinPercentage - penaltyValue);
              // Only set points that are on or after the last match date
              dailyStats.set(dateKey, {
                winPercentage: penalizedWinPercentage,
                rawWinPercentage: lastStats.rawWinPercentage,
                totalWins: lastStats.totalWins,
                totalGames: lastStats.totalGames,
                inactivityPenalty: penaltyValue
              });
            }
          }
        }
      }
      
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
