const fs = require('fs');
const path = require('path');
const { db } = require('../db');
const { players, matches, achievements, playerAchievements } = require('../db/schema');

// Create 'exports' directory if it doesn't exist
const exportDir = path.join(__dirname, '../exports');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

// Convert data to CSV string
function jsonToCSV(data, headers) {
  if (data.length === 0) return headers.join(',') + '\n';
  
  const csvRows = [];
  
  // Add the headers
  csvRows.push(headers.join(','));
  
  // Add the data
  data.forEach(item => {
    const values = headers.map(header => {
      const value = item[header];
      
      // Handle null values
      if (value === null || value === undefined) return '';
      
      // Handle date objects
      if (value instanceof Date) return value.toISOString();
      
      // Handle strings with commas or quotes - escape with double quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return String(value);
    });
    
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n') + '\n';
}

// Write data to a CSV file
function writeToCSV(data, filename, headers) {
  const csvData = jsonToCSV(data, headers);
  const filePath = path.join(exportDir, `${filename}.csv`);
  
  fs.writeFileSync(filePath, csvData);
  console.log(`Exported ${data.length} records to ${filePath}`);
}

async function exportTables() {
  try {
    console.log('Starting database export...');
    
    // Export players table
    const playersData = await db.query.players.findMany();
    writeToCSV(
      playersData, 
      'players', 
      ['id', 'name', 'startYear', 'createdAt']
    );
    
    // Export matches table
    const matchesData = await db.query.matches.findMany();
    writeToCSV(
      matchesData, 
      'matches', 
      [
        'id', 
        'teamOnePlayerOneId', 
        'teamOnePlayerTwoId', 
        'teamOnePlayerThreeId', 
        'teamTwoPlayerOneId', 
        'teamTwoPlayerTwoId', 
        'teamTwoPlayerThreeId', 
        'teamOneGamesWon', 
        'teamTwoGamesWon', 
        'date'
      ]
    );
    
    // Export achievements table
    const achievementsData = await db.query.achievements.findMany();
    writeToCSV(
      achievementsData, 
      'achievements', 
      ['id', 'name', 'description', 'icon', 'condition']
    );
    
    // Export player achievements table
    const playerAchievementsData = await db.query.playerAchievements.findMany();
    writeToCSV(
      playerAchievementsData, 
      'player_achievements', 
      ['id', 'playerId', 'achievementId', 'unlockedAt']
    );
    
    console.log('Database export complete!');
  } catch (error) {
    console.error('Error exporting database:', error);
  }
}

// Run the export
exportTables();