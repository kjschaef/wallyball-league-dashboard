import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db';
import { players, matches, achievements, playerAchievements } from '../db/schema';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create 'exports' directory if it doesn't exist
const exportDir = path.join(__dirname, '../exports');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

// Convert data to CSV string
function jsonToCSV(data: any[], headers: string[]): string {
  if (data.length === 0) return headers.join(',') + '\n';
  
  const csvRows: string[] = [];
  
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
function writeToCSV(data: any[], filename: string, headers: string[]): void {
  const csvData = jsonToCSV(data, headers);
  const filePath = path.join(exportDir, `${filename}.csv`);
  
  fs.writeFileSync(filePath, csvData);
  console.log(`Exported ${data.length} records to ${filePath}`);
}

async function exportTables(): Promise<void> {
  try {
    console.log('Starting database export...');
    
    // Export players table
    const playersData = await db.select().from(players);
    writeToCSV(
      playersData, 
      'players', 
      ['id', 'name', 'startYear', 'createdAt']
    );
    
    // Export matches table
    const matchesData = await db.select().from(matches);
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
    const achievementsData = await db.select().from(achievements);
    writeToCSV(
      achievementsData, 
      'achievements', 
      ['id', 'name', 'description', 'icon', 'condition']
    );
    
    // Export player achievements table
    const playerAchievementsData = await db.select().from(playerAchievements);
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