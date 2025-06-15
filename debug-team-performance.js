const { neon } = require("@neondatabase/serverless");

async function debugParkerHodnett() {
  const sql = neon(process.env.DATABASE_URL);
  
  // Get all matches with Parker (57) and Hodnett (54) on the same team
  const matches = await sql`
    SELECT 
      m.id,
      m.team_one_player_one_id,
      m.team_one_player_two_id, 
      m.team_one_player_three_id,
      m.team_two_player_one_id,
      m.team_two_player_two_id,
      m.team_two_player_three_id,
      m.team_one_games_won,
      m.team_two_games_won
    FROM matches m
    WHERE ((57 IN (m.team_one_player_one_id, m.team_one_player_two_id, m.team_one_player_three_id) 
            AND 54 IN (m.team_one_player_one_id, m.team_one_player_two_id, m.team_one_player_three_id))
           OR (57 IN (m.team_two_player_one_id, m.team_two_player_two_id, m.team_two_player_three_id)
               AND 54 IN (m.team_two_player_one_id, m.team_two_player_two_id, m.team_two_player_three_id)))
    ORDER BY m.id
  `;

  console.log('Parker & Hodnett Team Performance Analysis:');
  console.log('==========================================');
  
  let wins = 0;
  let losses = 0;
  let ties = 0;
  
  matches.forEach(match => {
    const parkerOnTeamOne = [match.team_one_player_one_id, match.team_one_player_two_id, match.team_one_player_three_id].includes(57);
    const hodnettOnTeamOne = [match.team_one_player_one_id, match.team_one_player_two_id, match.team_one_player_three_id].includes(54);
    
    let result = '';
    if (parkerOnTeamOne && hodnettOnTeamOne) {
      // Both on team one
      if (match.team_one_games_won > match.team_two_games_won) {
        wins++;
        result = 'WIN';
      } else if (match.team_one_games_won < match.team_two_games_won) {
        losses++;
        result = 'LOSS';
      } else {
        ties++;
        result = 'TIE';
      }
    } else {
      // Both on team two
      if (match.team_two_games_won > match.team_one_games_won) {
        wins++;
        result = 'WIN';
      } else if (match.team_two_games_won < match.team_one_games_won) {
        losses++;
        result = 'LOSS';
      } else {
        ties++;
        result = 'TIE';
      }
    }
    
    console.log(`Match ${match.id}: ${match.team_one_games_won}-${match.team_two_games_won} = ${result}`);
  });
  
  console.log('==========================================');
  console.log(`Total: ${wins} wins, ${losses} losses, ${ties} ties`);
  console.log(`Win percentage: ${((wins / (wins + losses)) * 100).toFixed(1)}%`);
}

debugParkerHodnett().catch(console.error);