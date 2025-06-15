const http = require('http');

function makeRequest() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5000/api/team-performance', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const teams = JSON.parse(data);
          resolve(teams);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

async function checkParkerHodnett() {
  try {
    const teams = await makeRequest();
    
    console.log('Searching for Parker & Hodnett teams...\n');
    
    teams.forEach(team => {
      if (team.players.includes('Hodnett') && team.players.includes('Parker')) {
        console.log(`Team: ${team.players.join(', ')}`);
        console.log(`Record: ${team.wins}W-${team.losses}L (${team.winPercentage}%)`);
        console.log(`Total Matches: ${team.totalGames}`);
        console.log(`Game W-L: ${team.gameWins || 'N/A'}-${team.gameLosses || 'N/A'}`);
        console.log('---');
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkParkerHodnett();