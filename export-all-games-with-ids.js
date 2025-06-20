
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function exportAllGamesWithIds() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Fetch all matches with their IDs
    const matches = await sql`
      SELECT 
        id,
        team_one_player_one_id,
        team_one_player_two_id,
        team_one_player_three_id,
        team_two_player_one_id,
        team_two_player_two_id,
        team_two_player_three_id,
        team_one_games_won,
        team_two_games_won,
        date
      FROM matches
      ORDER BY id ASC
    `;

    // Generate clean SQL insert statements with IDs
    let sqlOutput = '';
    
    matches.forEach(match => {
      const formatValue = (val) => val === null ? 'NULL' : val;
      const formatDate = (date) => date ? `'${date.toISOString()}'` : 'NOW()';
      
      sqlOutput += `INSERT INTO matches (id, team_one_player_one_id, team_one_player_two_id, team_one_player_three_id, team_two_player_one_id, team_two_player_two_id, team_two_player_three_id, team_one_games_won, team_two_games_won, date) VALUES (${match.id}, ${formatValue(match.team_one_player_one_id)}, ${formatValue(match.team_one_player_two_id)}, ${formatValue(match.team_one_player_three_id)}, ${formatValue(match.team_two_player_one_id)}, ${formatValue(match.team_two_player_two_id)}, ${formatValue(match.team_two_player_three_id)}, ${match.team_one_games_won}, ${match.team_two_games_won}, ${formatDate(match.date)});\n`;
    });

    // Output to console for copying
    console.log(sqlOutput);

    // Also write to file
    const fs = require('fs');
    const filename = `all-games-with-ids-${new Date().toISOString().split('T')[0]}.sql`;
    fs.writeFileSync(filename, sqlOutput);
    
    console.log(`\n-- ${matches.length} matches exported to ${filename}`);

  } catch (error) {
    console.error('Error exporting games:', error);
    throw error;
  }
}

// Run the export
exportAllGamesWithIds().catch(console.error);
