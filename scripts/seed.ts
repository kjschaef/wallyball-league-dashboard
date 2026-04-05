import 'dotenv/config';
import { getDatabase } from '../db/config';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const db = getDatabase();

  console.log('Seeding database...');

  // 1. Clear existing data
  console.log('Clearing existing data...');
  await db.execute(sql`TRUNCATE TABLE ${schema.matches} RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE ${schema.players} RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE ${schema.siteSettings} RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE ${schema.achievements} RESTART IDENTITY CASCADE`);

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

  // 4. Insert Matches
  console.log('Inserting matches...');
  await db.insert(schema.matches).values([
    {
      teamOnePlayerOneId: p('Alice'),
      teamOnePlayerTwoId: p('Bob'),
      teamTwoPlayerOneId: p('Charlie'),
      teamTwoPlayerTwoId: p('David'),
      teamOneGamesWon: 3,
      teamTwoGamesWon: 0,
      date: new Date('2024-01-01T18:00:00Z'),
    },
    {
      teamOnePlayerOneId: p('Alice'),
      teamOnePlayerTwoId: p('Charlie'),
      teamTwoPlayerOneId: p('Bob'),
      teamTwoPlayerTwoId: p('Eve'),
      teamOneGamesWon: 2,
      teamTwoGamesWon: 1,
      date: new Date('2024-01-02T18:00:00Z'),
    },
  ]);

  console.log('Seeding completed successfully!');
}

main().catch((err) => {
  console.error('Seeding failed:');
  console.error(err);
  process.exit(1);
});
