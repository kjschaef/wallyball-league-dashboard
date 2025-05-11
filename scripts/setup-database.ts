// Setup Database Script
// This script executes the SQL file to set up the database from scratch

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { getDatabase } from '../db/config';

async function setupDatabase(): Promise<void> {
  try {
    // Get database connection string from environment
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('Error: DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    console.log('Setting up database from scratch...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL using psql
    const command = `psql "${databaseUrl}" -f "${sqlFilePath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing SQL: ${error.message}`);
        return;
      }
      
      if (stderr) {
        console.error(`SQL warnings: ${stderr}`);
      }
      
      console.log('Database setup completed successfully!');
      console.log(stdout);
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();