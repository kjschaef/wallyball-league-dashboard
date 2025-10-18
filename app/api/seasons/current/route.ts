import { NextResponse } from 'next/server';
import { getCurrentSeasonByDate } from '../../../../lib/seasons';

export async function GET() {
  try {
    const current = getCurrentSeasonByDate(new Date());
    return NextResponse.json({
      id: null,
      name: current.name,
      start_date: current.start_date,
      end_date: current.end_date,
      is_active: true
    });
  } catch (error) {
    console.error('Error fetching current season:', error);
    return NextResponse.json({ error: 'Failed to fetch current season' }, { status: 500 });
  }
}
