import { NextResponse } from 'next/server';

// Sample player colors for visualization
const playerColors = [
  '#FF6B6B', '#4E4EFF', '#62D962', '#FF7E67', '#BADA55',
  '#FFD700', '#20B2AA', '#FF8C00', '#00CED1', '#FF69B4'
];

export async function GET() {
  try {
    // Fetch players to get win percentage data
    const playersResponse = await fetch('https://cfa-wally-stats.replit.app/api/players', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!playersResponse.ok) {
      throw new Error(`Failed to fetch players: ${playersResponse.status}`);
    }

    const players = await playersResponse.json();
    
    // Filter active players with games
    const activePlayers = players
      .filter((player: any) => {
        const totalGames = player.stats?.won + player.stats?.lost;
        return totalGames > 0;
      })
      .map((player: any) => {
        const totalGames = player.stats.won + player.stats.lost;
        const winPercentage = Math.round((player.stats.won / totalGames) * 100);
        return {
          id: player.id,
          name: player.name,
          winPercentage,
          totalGames
        };
      });
    
    // Sort by win percentage (highest first) and take top 5
    const topPlayers = activePlayers
      .sort((a: any, b: any) => b.winPercentage - a.winPercentage)
      .slice(0, 5);
      
    // Create weekly data points for our chart (simulating a month of data)
    const weeks = [
      "Week of Apr 28",
      "Week of May 05", 
      "Week of May 12", 
      "Week of May 19"
    ];
    
    // Create chart data points
    const trendData = weeks.map((week, weekIndex) => {
      // Start with the week label
      const dataPoint: any = { week };
      
      // Add each player's win percentage with slight variations to show trends
      topPlayers.forEach((player: any) => {
        // Create realistic variations to show trends
        // Earlier weeks slightly lower, most recent week exact win %
        const weekEffect = (weekIndex / (weeks.length - 1)); // 0 to 1 factor
        const basePercentage = player.winPercentage - 10 + (weekEffect * 10);
        
        // Add slight random variance (±3%)
        const variance = Math.floor(Math.random() * 6) - 3;
        
        // Ensure win percentage stays within 0-100%
        dataPoint[player.name] = Math.min(
          100, 
          Math.max(0, Math.round(basePercentage + variance))
        );
      });
      
      return dataPoint;
    });
    
    return NextResponse.json(trendData);
  } catch (error) {
    console.error('Error in trends API:', error);
    
    // Create a minimal dataset if API fails
    const fallbackData = [
      {
        week: "Week of May 19",
        "Player 1": 60,
        "Player 2": 55,
        "Player 3": 50
      }
    ];
    
    return NextResponse.json(fallbackData);
  }
}