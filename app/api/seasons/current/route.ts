import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    const activeSeasons = await sql`
      SELECT * FROM seasons 
      WHERE is_active = true 
      ORDER BY start_date DESC 
      LIMIT 1
    `;
    
    if (activeSeasons.length === 0) {
      return NextResponse.json(
        { error: 'No active season found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(activeSeasons[0]);
  } catch (error) {
    console.error('Error fetching current season:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current season' },
      { status: 500 }
    );
  }
}