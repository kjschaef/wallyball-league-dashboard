import 'dotenv/config';
import { getDatabase } from '../db/config';
import * as schema from '../db/schema';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (process.env.VERCEL_ENV === 'production') {
    console.error('❌ FATAL: Cannot run seed in production environment!');
    process.exit(1);
  }

  if (process.env.VERCEL_GIT_COMMIT_REF === 'main') {
    console.error('❌ FATAL: Cannot run seed on the main branch!');
    process.exit(1);
  }

  const db = getDatabase();

  console.log('Seeding database...');

  // 1. Clear existing data
  console.log('Clearing existing data...');
  if (process.env.DATABASE_URL) {
    try {
      const rawSql = neon(process.env.DATABASE_URL);
      await rawSql`DROP TABLE IF EXISTS "player_achievements" CASCADE;`;
      await rawSql`DROP TABLE IF EXISTS "achievements" CASCADE;`;
    } catch (err) {
      console.warn('⚠️ Warning dropping legacy tables:', err);
    }
  }

  try {
    await db.delete(schema.matchGames);
  } catch (err) {
    console.warn('⚠️ Warning clearing match_games (table may not exist yet):', err);
  }
  await db.delete(schema.matches);
  await db.delete(schema.weeklySignups);
  await db.delete(schema.weeklyUnavailable);
  await db.delete(schema.siteSettings);
  await db.delete(schema.dailySummaries);
  await db.delete(schema.players);

  // 2. Insert Players
  console.log('Inserting players...');
  const insertedPlayers = await db.insert(schema.players).values([
    { name: 'Alice', startYear: 2020 },
    { name: 'Bob', startYear: 2021 },
    { name: 'Charlie', startYear: 2022 },
    { name: 'David', startYear: 2023 },
    { name: 'Eve', startYear: 2024 },
    { name: 'Frank', startYear: 2024 },
  ]).returning();

  const p = (name: string) => insertedPlayers.find(player => player.name === name)!.id;

  // 3. Insert Site Settings
  console.log('Inserting site settings...');
  await db.insert(schema.siteSettings).values({
    // Use ADMIN_PASSWORD from env or fallback to "admin123"
    adminPasswordHash: process.env.ADMIN_PASSWORD || 'admin123',
    signupOpenDayOfWeek: 0,
    signupOpenTime: '12:00',
    signupCloseDayOfWeek: 0,
    signupCloseTime: '16:00',
    availableDays: JSON.stringify(['Monday', 'Tuesday', 'Thursday']),
  });

  // 4. Insert Matches & Games
  console.log('Inserting matches...');
  const insertedMatches = await db.insert(schema.matches).values([
    {
      teamOnePlayerOneId: p('Alice'),
      teamOnePlayerTwoId: p('Bob'),
      teamTwoPlayerOneId: p('Charlie'),
      teamTwoPlayerTwoId: p('David'),
      teamOneGamesWon: 3,
      teamTwoGamesWon: 0,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      teamOnePlayerOneId: p('Alice'),
      teamOnePlayerTwoId: p('Charlie'),
      teamTwoPlayerOneId: p('Bob'),
      teamTwoPlayerTwoId: p('Eve'),
      teamOneGamesWon: 2,
      teamTwoGamesWon: 1,
      date: new Date(),
    },
  ]).returning();

  // Insert sample match games
  if (insertedMatches.length >= 2) {
    try {
      await db.insert(schema.matchGames).values([
        { matchId: insertedMatches[0].id, gameNumber: 1, teamOneScore: 11, teamTwoScore: 7 },
        { matchId: insertedMatches[0].id, gameNumber: 2, teamOneScore: 11, teamTwoScore: 5 },
        { matchId: insertedMatches[0].id, gameNumber: 3, teamOneScore: 11, teamTwoScore: 8 },
        { matchId: insertedMatches[1].id, gameNumber: 1, teamOneScore: 11, teamTwoScore: 9 },
        { matchId: insertedMatches[1].id, gameNumber: 2, teamOneScore: 8, teamTwoScore: 11 },
        { matchId: insertedMatches[1].id, gameNumber: 3, teamOneScore: 11, teamTwoScore: 6 },
      ]);
    } catch (err) {
      console.warn('⚠️ Warning seeding match_games:', err);
    }
  }

  console.log('Seeding completed successfully!');
}

main().catch((err) => {
  console.error('Seeding failed:');
  console.error(err);
  process.exit(1);
});
