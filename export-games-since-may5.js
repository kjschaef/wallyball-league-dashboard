
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function exportGamesSinceMay5() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Fetch all matches since May 5, 2024
    const matches = await sql`
      SELECT 
        m.*,
        p1.name as team_one_player_one_name,
        p2.name as team_one_player_two_name,
        p3.name as team_one_player_three_name,
        p4.name as team_two_player_one_name,
        p5.name as team_two_player_two_name,
        p6.name as team_two_player_three_name
      FROM matches m
      LEFT JOIN players p1 ON m.team_one_player_one_id = p1.id
      LEFT JOIN players p2 ON m.team_one_player_two_id = p2.id
      LEFT JOIN players p3 ON m.team_one_player_three_id = p3.id
      LEFT JOIN players p4 ON m.team_two_player_one_id = p4.id
      LEFT JOIN players p5 ON m.team_two_player_two_id = p5.id
      LEFT JOIN players p6 ON m.team_two_player_three_id = p6.id
      WHERE m.date >= '2024-05-05'
      ORDER BY m.date ASC
    `;

    // Get all unique players
    const allPlayerIds = new Set();
    matches.forEach(match => {
      if (match.team_one_player_one_id) allPlayerIds.add(match.team_one_player_one_id);
      if (match.team_one_player_two_id) allPlayerIds.add(match.team_one_player_two_id);
      if (match.team_one_player_three_id) allPlayerIds.add(match.team_one_player_three_id);
      if (match.team_two_player_one_id) allPlayerIds.add(match.team_two_player_one_id);
      if (match.team_two_player_two_id) allPlayerIds.add(match.team_two_player_two_id);
      if (match.team_two_player_three_id) allPlayerIds.add(match.team_two_player_three_id);
    });

    // Get player names for reference
    const players = await sql`
      SELECT id, name, start_year, created_at
      FROM players
      WHERE id = ANY(${Array.from(allPlayerIds)})
    `;

    // Generate clean SQL insert statements
    let sqlOutput = '';
    
    // Players insert statements
    players.forEach(player => {
      const createdAt = player.created_at ? `'${player.created_at.toISOString()}'` : 'NOW()';
      const startYear = player.start_year || 'NULL';
      const safeName = player.name.replace(/'/g, "''");
      
      sqlOutput += `INSERT INTO players (id, name, start_year, created_at) VALUES (${player.id}, '${safeName}', ${startYear}, ${createdAt}) ON CONFLICT (id) DO NOTHING;\n`;
    });

    sqlOutput += '\n';
    
    // Matches insert statements
    matches.forEach(match => {
      const formatValue = (val) => val === null ? 'NULL' : val;
      const formatDate = (date) => date ? `'${date.toISOString()}'` : 'NOW()';
      
      sqlOutput += `INSERT INTO matches (team_one_player_one_id, team_one_player_two_id, team_one_player_three_id, team_two_player_one_id, team_two_player_two_id, team_two_player_three_id, team_one_games_won, team_two_games_won, date) VALUES (${formatValue(match.team_one_player_one_id)}, ${formatValue(match.team_one_player_two_id)}, ${formatValue(match.team_one_player_three_id)}, ${formatValue(match.team_two_player_one_id)}, ${formatValue(match.team_two_player_two_id)}, ${formatValue(match.team_two_player_three_id)}, ${match.team_one_games_won}, ${match.team_two_games_won}, ${formatDate(match.date)});\n`;
    });

    // Output to console for copying
    console.log(sqlOutput);

    // Also write to file
    const fs = require('fs');
    const filename = `games-since-may5-${new Date().toISOString().split('T')[0]}.sql`;
    fs.writeFileSync(filename, sqlOutput);
    
    console.log(`\n-- ${matches.length} matches exported to ${filename}`);
    console.log(`-- ${allPlayerIds.size} unique players involved`);

  } catch (error) {
    console.error('Error exporting games:', error);
    throw error;
  }
}

// Run the export
exportGamesSinceMay5().catch(console.error);
